const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
    }
});
const speech = require('@google-cloud/speech');

router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        console.log("NO FILE");
        res.status(400).send('No file uploaded.');
        return;
    }

    const sampleRateHertz = parseInt(req.query.sampleRateHertz);
    const encoding = req.query.encoding;
    const languageCode = req.query.languageCode;

    const request = {
        config: {
            encoding: encoding,
            sampleRateHertz: sampleRateHertz,
            languageCode: languageCode,
        },
        singleUtterance: true,
        interimResults: false, // If you want interim results, set this to true
    };
    const client = new speech.SpeechClient();
    console.log("RECOGNIZING STREAM")
    const recognizeStream = client
        .streamingRecognize(request)
        .on('error', (err) => {
            console.log("STREAMING RECOGNIZE ERROR", err);
            res.status(400).json({ speechError: err, uploaded: 0 });
            return;
        })
        .on('data', data => {
            console.log("STREAMING RECOGNIZE DATA", data);
            if (data.results && data.results.length > 0 && data.results[0].isFinal) {
                res.json({ results: data.results, uploaded: 0 });
                return;
            }
        });

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    bufferStream.pipe(recognizeStream);

});

module.exports = router;