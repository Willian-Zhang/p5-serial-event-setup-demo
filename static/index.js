import  './libraries/jquery.min.js';
import {Board} from './Arduino.js';
import {Keybaord} from './Keyboard.js';
import Mic from './Mic.js';
import {SpeechToText} from './IBM.js'

// uncomment  and changge to import devices
// import {Button} from './Devices.js';
// let button1 = Button();

let board = new Board();
board.connect({baudrate: 9600});

// 
// board.on('line', line => {
//     console.log(`line`, String.fromCharCode(...line))
// });

// only works if device is set: `let board = new Board([button1]);`
board.on('point', point => {
    console.log(`point`, point)
});


let keyboard = new Keybaord();
// uncomment if keyboard wanted
keyboard.on('press', (e) =>{
    if(e.key == 'm'){
        record_begin();
    }
});
keyboard.on('release', (e) =>{
    if(e.key == 'm'){
        record_end();
    }
});

let mic = new Mic();
mic.access();

async function record_begin(){
    console.log('record_begin...');
    mic.record();
}

async function record_end(){
    console.log('record_end.');
    await mic.stop();
    let bolb = await mic.getBlob();
    let text = await speech_to_text(bolb);
    
}


async function speech_to_text(soundBlob){
    let results = await $.ajax({
        type: 'POST',
        url: '/speech-to-text',
        data: soundBlob,
        processData: false,
        contentType: "multipart/form-data",
    });
    console.log(results);
}
