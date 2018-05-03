const IBMCredentials = require('./credentials.json')

const express = require('express')
const fs = require('fs');

const { PassThrough } = require('stream');

const app = express()
const bodyParser = require('body-parser')

const watson = require('watson-developer-cloud');
const vcapServices = require('vcap_services');

const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
const speech_to_text = new SpeechToTextV1 ({
    username: IBMCredentials.speech_to_text[0].credentials.username,
    password: IBMCredentials.speech_to_text[0].credentials.password
  });
const text_to_speech = new TextToSpeechV1 ({
    username: IBMCredentials.text_to_speech[0].credentials.username,
    password: IBMCredentials.text_to_speech[0].credentials.password
  });

// speech to text token endpoint
const sttAuthService = new watson.AuthorizationV1(
    Object.assign({
        username: IBMCredentials.speech_to_text[0].credentials.username, 
        password: IBMCredentials.speech_to_text[0].credentials.password
      }, vcapServices.getCredentials('speech_to_text') 
      // pulls credentials from environment in bluemix, otherwise returns {}
    )
);
const ttsAuthService = new watson.AuthorizationV1(
    Object.assign({
        username: IBMCredentials.text_to_speech[0].credentials.username, 
        password: IBMCredentials.text_to_speech[0].credentials.password
      }, vcapServices.getCredentials('text_to_speech')
    )
);

app.post('/speech-to-text/:lang', function(req, res, next) {

    let language_model = 'en-US_BroadbandModel';
    if(req.params.lang){
        switch (req.params.lang) {
            case 'ja-jp':
                language_model  = 'ja-JP_BroadbandModel';
                break;
            case 'en-gb':
                language_model  = 'en-GB_BroadbandModel';
                break;
            case 'es-es':
                language_model  = 'es-ES_BroadbandModel';
                break;
            case 'en-us':
            default:
                language_model = 'en-US_BroadbandModel';
                break;
        }
    }

    // req.pipe(fs.createWriteStream('./logs/test.mp3'))

    let params = {
        model: language_model,
        audio: req,
        content_type: 'audio/mp3'
      };
    
    speech_to_text.recognize(params, function(error, transcript) {
        if (error){
            res.send({'error': error});
            console.warn('Error:', error);
        }else{
            res.send(transcript.results);
        }
    });

});

app.post('/text-to-speech/:lang', bodyParser.json(), function(req, res, next) {

    let voice_model = 'en-US_AllisonVoice';
    if(req.params.lang){
        switch (req.params.lang) {
            case 'ja-jp':
                voice_model  = 'ja-JP_EmiVoice';
                break;
            case 'en-gb':
                voice_model  = 'en-GB_KateVoice';
                break;
            case 'es-es':
                voice_model  = 'es-ES_LauraVoice';
                break;
            case 'en-us':
            default:
                voice_model = 'en-US_AllisonVoice';
                break;
        }
    }
    

    let params = {
        text: req.body.text,
        voice: voice_model,
        accept: 'audio/webm'
      };
    
    // let pass = new PassThrough();
    res.set('Content-Type', 'audio/webm');
    text_to_speech.synthesize(params).on('error', function(error) {
        res.send({'error': error});
        console.warn('Error:', error);
    }).pipe(res);

    // res.pipe(pass);
});

// token endpoints
// **Warning**: these endpoints should probably be guarded with additional authentication & authorization for production use
app.use('/token/speech-to-text', function(req, res) {
    sttAuthService.getToken(
        {
        url: watson.SpeechToTextV1.URL
        },
        function(err, token) {
        if (err) {
            console.log('Error retrieving token: ', err);
            res.status(500).send('Error retrieving token');
            return;
        }
        res.send(token);
        }
    );
});

app.use('/token/text-to-speech', function(req, res) {
    ttsAuthService.getToken(
        {
        url: watson.TextToSpeechV1.URL
        },
        function(err, token) {
        if (err) {
            console.log('Error retrieving token: ', err);
            res.status(500).send('Error retrieving token');
            return;
        }
        res.send(token);
        }
    );
});


app.use('/', express.static('static'));


app.listen(5080, () => console.log('Voice Of Doom Web Server listening on port 5080!'))
