const IBMCredentials = require('./credentials.json')

const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
const express = require('express')

const app = express()

const speech_to_text = new SpeechToTextV1 ({
    username: IBMCredentials.speech_to_text[0].credentials.username,
    password: IBMCredentials.speech_to_text[0].credentials.password
  });

  const fs = require('fs');
app.post('/speech-to-text', function(req, res, next) {
    let params = {
        audio: req,
        content_type: 'audio/wav'
      };
    
    speech_to_text.recognize(params, function(error, transcript) {
        if (error)
            console.warn('Error:', error);
        else{
            res.send(transcript.results);
        }
    });

});

app.use('/', express.static('static'));


app.listen(5000, () => console.log('Voice Of Doom Web Server listening on port 5000!'))
