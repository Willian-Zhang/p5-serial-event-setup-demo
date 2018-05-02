import $ from "jquery"
import {Howl, Howler} from 'howler'
// import Microm from 'microm'
import swal from 'sweetalert'

import {Board} from './Arduino.js'
import {TimeAnalysizer, Button, ThresholdedSensor, Light} from './Device.js'
import {Keybaord} from './Keyboard.js'
import * as TextSpeech from './TextSpeech.js'
import Siri from './Siri.js'
import Talker , {Sentence} from './Sentence.js'
import {wait, wait_until} from './utils.js'
import { EventEmitter2 } from "eventemitter2";
import { release } from "os";

let force = new ThresholdedSensor(12);
let bend  = new ThresholdedSensor(360);
let photo = new ThresholdedSensor(118);
let touch = new ThresholdedSensor(20000);

let tilt_1 = new Button(0, 0);
let tilt_2 = new Button(1, 1);

let bgMusic = new Howl({
    src: ['UNIVOX8.WAV'],
    loop: true,
    volume: 0.5
});

let devices = [new TimeAnalysizer(), force, bend, photo, touch, tilt_1, tilt_2]
const board = new Board(devices);
board.connect({baudrate: 9600});

// debug raw value
// board.on('line', line => {
//     console.log(`line`, String.fromCharCode(...line))
// });

// only works if device is set: `let board = new Board([button1]);`
// board.on('point', point => {
//     console.log(`point`, point)
// });

force.on('press', ()=>{
    console.log('press','force')
})

touch.on('press', ()=>{
    console.log('press','touch')
})
bend.on('press', ()=>{
    console.log('press','bend')
})
photo.on('press', ()=>{
    console.log('press','photo')
})
tilt_1.on('press', ()=>{
    console.log('press','tilt_1')
})
tilt_2.on('press', ()=>{
    console.log('press','tilt_2')
})

TextSpeech.getAuthorizations()

const siri = new Siri();

const default_siri_key = ' ';
const if_siri_key_do =  (async_callable, siriKey = default_siri_key) => async (e) => { if(e.key == siriKey){return await async_callable()} return false}

const keyboard = new Keybaord();

class SiriButton extends EventEmitter2{
    constructor(devices, keyboard){
        super()
        this.busy = false;
        
        devices.map(d=>d.on('press', e=>{
            this.busy = true;
            this.emit('press', e)
        }))
        devices.map(d=>d.on('release', e=>{
            this.busy = false;
            this.emit('release', e)
        }))
        
        keyboard.on('press', (e)=>{
            if(e.key == default_siri_key){
                this.busy = true;
                this.emit('press', e)
            }
        })
        keyboard.on('release', (e)=>{
            if(e.key == default_siri_key){
                this.busy = false;
                this.emit('release', e)
            }
        })
    } 
}
class NewConversationListener extends EventEmitter2{
    constructor(){
        super()
        let siriButton = new SiriButton([force], keyboard);
        siriButton.on('press', e => this.emit('press', [siriButton, e]));
        siriButton.on('release',e => this.emit('release', [siriButton, e]))

        keyboard.on('press', e => this.emit('press', [null, e]));
        keyboard.on('release',e => this.emit('release', [null, e]))
    }
}
let conversation_listener = new NewConversationListener()

const light = new Light(board)

function listen_new_conversation(){
    conversation_listener.once('press', async (tuple) =>{
        let [siriButton, e] = tuple
        if(siriButton){
            siriButton.once('release', TextSpeech.mic_stop)
            await pressAsk()
            listen_new_conversation()
        }else{
            if(e.key == 'n'){
                await new_conversation();
                listen_new_conversation()
            }
            else if(e.key == 't'){
                let input = await swal({
                    title: `Text to Speech:`, 
                    content: "input", 
                    buttons: {
                        cancel: {value:false, visible: true},
                        confirm: true,
                    },
                });
                if(input){
                    let sentence =  new Sentence(input, language)
                    await sentence.play()
                }
                listen_new_conversation()
            }
            else if(e.key == 'q'){
                let input = await swal({
                    title: `Question:`, 
                    content: "input", 
                    buttons: {
                        cancel: {value:false, visible: true},
                        confirm: true,
                    },
                });
                if(input){
                    let question = input;
                    console.log('question', question);
                    await responseToQuestion(question)
                }
                listen_new_conversation()
            }
            else if(e.key == '\\'){

                let e_force = listen_on_tick(force)
                let e_bend  = listen_on_tick(bend)
                let e_photo = listen_on_tick(photo)
                let e_touch = listen_on_tick(touch)

                let release = (e)=>{
                    if(e.key == '\\'){
                        keyboard.off('release', release)
                        
                        console.log('force set', set_device_value(force, 3));
                        console.log('bend  set', set_device_value(bend,  3));
                        console.log('photo set', set_device_value(photo, 3));
                        console.log('touch set', set_device_value(touch, 3));

                        listen_new_conversation()
                    }
                }
                keyboard.on('release', release)

            }else{
                listen_new_conversation()
            }
            
        }
    })
}
listen_new_conversation();

async function pop_busy_dialog(title, cancelable = true, text = ''){
    return await swal({
        title: title,
        text: text,
        buttons: {
            cancel: {value:false, visible: cancelable},
            confirm: false,
        },
    })
}

function setup_device_for_value_connection(device){
    device.values_collcetion = []
}
function collect_device_values(device, value){
    device.values_collcetion.push(value)
}
const listen_on_tick = (device)=>{
    setup_device_for_value_connection(device)
    let collect_event = (value) => collect_device_values(device, value)
    device.on('tick', collect_event);
    return collect_event
}



const wait_until_some_device = async (correctDevice, event='press', all_devices = devices) => {
    // TODO: cancel not doing
    return await Promise.race(all_devices.map(device => wait_until(device, event))) == correctDevice
}

// var color_to_button = {
//     'white': button3,
//     'red': button2,
//     'blue': button1,
// }
// var possible_buttons = ['white', 'red', 'blue']


async function ask_to_do_game(){
    let talker = new Talker(language);

    let instrction 

    let devices = [photo, bend]

    instrction = talker.beginChallenge()
    pop_busy_dialog(instrction.text, false)
    await instrction.play()
    
    bgMusic.play();

    instrction = talker.liftMe()
    pop_busy_dialog(instrction.text, false)
    await instrction.play()

    // 
    if(!await wait_until_some_device(photo, 'press', devices)){
        instrction = talker.failComply()
        pop_busy_dialog(instrction.text, false)
        await instrction.play()
        return bgMusic.stop();
    }

    instrction = talker.squeezeMe()
    await instrction.play()

    // 
    if(!await wait_until_some_device(bend, 'press', devices)){
        instrction = talker.failComply()
        pop_busy_dialog(instrction.text, false)
        await instrction.play()
        return bgMusic.stop();
    }

    // TODO: Game:

    // let buttons = [button1, button2, button3]
    // instrction = talker.pressButton()
    // await instrction.play()

    // let color 
    // let button

    // color= possible_buttons.randomElement();
    // button = color_to_button[color]
    // instrction = talker.buttonName(color)
    // instrction.play()
    // if(!await wait_until_some_device(button, 'press', buttons)){
    //     instrction = talker.failComply()
    //     pop_busy_dialog(instrction.text, false)
    //     await instrction.play()
    //     return bgMusic.stop();
    // }
    

    



    instrction = talker.successComply()
    await instrction.play()

    // TODO: Sample
    
    bgMusic.stop();
}

async function pressAsk(){
    await siri.start();
    light.cyan()

    let question = await askWithDialog('', false);

    if(question){
        siri.done()
        light.white()
        await responseToQuestion(question)
    }else{
        siri.cancel()
        light.white()
    }
}
async function instantAsk(previosQuestions){
    await siri.start()
    light.cyan()
    let question = await askWithDialog(previosQuestions)
    if(question){
        siri.done()
        light.white()
        await responseToQuestion(question)
    }else{
        siri.cancel()
        light.white()
    }
}

async function new_conversation(){
    let talker = new Talker(language);

    let siri_question = talker.askForName();
    pop_busy_dialog(siri_question.text, false);
    await siri_question.play();

    await ask_with_dialog_and_indicator_sound(siri_question.text)

    siri_question = talker.hi(name);
    pop_busy_dialog(siri_question.text, false);
    await siri_question.play();
    
    await instantAsk(siri_question.text)
}

async function ask_with_dialog_and_indicator_sound(title, autoStop=true){
    await siri.start()
    light.cyan()
    let name = await askWithDialog(title, autoStop=true)
    siri.done()
    light.white()
    return result;
}
async function askWithDialog(title, autoStop=true){
    let recording = $('<div />').attr('id', 'text-recording');
    recording.text('...');

    let dialog = swal({
        title: title,
        content: recording[0],
        buttons: false
    })
    let result = await TextSpeech.mic_to_text(language, autoStop, recording[0]);
    return result;
}

var language = 'en-us';

async function responseToQuestion(question){
    let answer = await reason_question(question);
    console.log('answer', answer);
    if(answer){
        swal({
            title: answer.text,
            text : question,
            button: false,
        })
        await answer.play();
    }
}

async function reason_question(question){
    let talker = new Talker(language);
    switch (language) {
        case 'ja-jp':
            if(question.match(/言語/i)){
                let new_langauge_literal = '';
                if(question.match(/イギリス/i)){
                    language = 'en-gb';
                    new_langauge_literal = 'イギリス語'
                }else if(question.match(/英語|アメリカ|米/i)){
                    language = 'en-us';
                    new_langauge_literal = '英語'
                }else if(question.match(/スペイン/i)){
                    language = 'es-es';
                    new_langauge_literal = 'スペイン語'
                }else{
                    return talker.unsure();
                }

                return talker.okey(`${new_langauge_literal} に換えました。`);

            }else if(question.match(/ゲム|ゲーム/i)){
                await ask_to_do_game()
                return ''
            }else if(question.match(/こんにちは/i)){
                return talker.greetings()
            }else{
                return talker.unsure();
            }

        case 'es-es':
            if(question.match(/idioma/i)){
                let new_langauge_literal = '';
                if(question.match(/inglés/i)){
                    language = 'en-us';
                    new_langauge_literal = 'inglés'
                }else if(question.match(/japonés/i)){
                    language = 'ja-jp';
                    new_langauge_literal = 'japonés'
                }else{
                    return talker.unsure();
                }
                return talker.okey(`ha cambiado a ${new_langauge_literal}.`);
            }else if(question.match(/juego/i)){
                await ask_to_do_game()
                return ''
            }
            return talker.unsure();

        case 'en-us':
        case 'en-gb':
        default:
            // TODO: Sample: main logic part
            if(question.match(/language/i)){
                let new_langauge_literal = '';
                if(question.match(/british|uk/i)){
                    language = 'en-gb';
                    new_langauge_literal = 'British English'
                }else if(question.match(/american|us/i)){
                    language = 'en-us';
                    new_langauge_literal = 'American English'
                }else if(question.match(/spanish|spain/i)){
                    language = 'es-es';
                    new_langauge_literal = 'Spanish'
                }else if(question.match(/japanese|japan/i)){
                    language = 'ja-jp';
                    new_langauge_literal = 'Japanese'
                }else{
                    return talker.unsure();
                }

                return talker.okey(`Language switched to ${new_langauge_literal}.`);

            }else if(question.match(/game/i)){
                await ask_to_do_game()
                return ''

            }else if(question.match(/hi|hello|how are you/i)){
                return talker.greetings()
            }else{
                return talker.unsure();
            }
    }
    return talker.unsure()
}