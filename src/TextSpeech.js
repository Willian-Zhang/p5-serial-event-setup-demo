import {Howl, Howler} from 'howler'
import $ from 'jquery'
import WatsonSpeech from 'watson-speech'

import {wait_until, wait_on} from './utils.js'

var default_language = 'en-us';

export
async function speech_to_text(soundBlob, lang = default_language){
    let results = await $.ajax({
        type: 'POST',
        url: `speech-to-text/${lang}`,
        data: soundBlob,
        processData: false,
        contentType: "multipart/form-data",
    });
    if(results.error){
        throw results.error;
    }
    
    return conclude_results(results);
}

export
async function text_to_speech(text, lang = default_language){
    let results = await $.ajax({
        type: 'POST',
        url: `text-to-speech/${lang}`,
        data: JSON.stringify({text: text}),
        contentType: "application/json; charset=utf-8",
        cache: false,
        xhrFields:{
            responseType: 'blob'
        },
    });
    return results;
}

export
async function playTextToAudioBlob(blob){
    let url = URL.createObjectURL( blob );
    let sound = new Howl({
        src: [url],
        format: ['webm']
      });
    sound.play();
    await wait_until(sound, 'end');
    return sound;
}

/* IBM API
 * Allows for stream
 */

var token_speech_to_text = '';
var token_text_to_speech = '';

export 
async function getAuthorizations(){
    [token_speech_to_text, token_text_to_speech] = await Promise.all([
        $.get('/token/speech-to-text'),
        $.get('/token/text-to-speech')
    ])
    return [token_speech_to_text, token_text_to_speech]
}

function conclude_results(results){
    results = results.filter(data=>data.results[0] && data.results[0].final)
    
    results = results.map(data => data.results[0].alternatives[0]);

    console.log(results)

    return results.map(r=> r.transcript).join(' ');
}

var stream;
/**
 * Record Mic and convert to string
 * 
 * 
 * @param {any} lang langauge 
 * @param {boolean} [autoStop=true] `false` and call `mic_stop()` to manually get it stoped
 * @param {any} [outputElement=undefined] continously modifies this element when in recording
 * @returns text recorded
 */
export
async function mic_to_text(lang, autoStop = true, outputElement = undefined){
    let language_model = 'en-US_BroadbandModel';
    if(lang){
        switch (lang) {
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

    stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
        token: token_speech_to_text,
        keepMicrophone: true,
        outputElement: outputElement,
        model: language_model,
        objectMode: true
    });

    stream.on('data', (data) => {
        if(autoStop && data.results[0] && data.results[0].final) {
            stream.stop();
        }
    });

    let results =  await stream.promise()
    
    return conclude_results(results)
}

/**
 * Stop recording the mic
 * 
 * 
 * @returns text recorded
 */
export 
async function mic_stop(){
    stream.stop();

    let results =  await stream.promise()

    return conclude_results(results)
}
