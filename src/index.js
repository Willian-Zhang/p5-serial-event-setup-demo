import $ from "jquery"
import {Howl, Howler} from 'howler'
// import Microm from 'microm'
import swal from 'sweetalert'

import {Board} from './Arduino.js'
import {TimeAnalysizer, Button, ThresholdedSensor, Light, InputDevice, CapasitiveSensor} from './Device.js'
import {Keybaord} from './Keyboard.js'
import * as TextSpeech from './TextSpeech.js'
import Siri from './Siri.js'
import Talker , {Sentence} from './Sentence.js'
import {wait, wait_until, wait_race} from './utils.js'
import { EventEmitter2 } from "eventemitter2";
import { release } from "os";

let force = new ThresholdedSensor(12);
let bend  = new ThresholdedSensor(360);
let photo = new ThresholdedSensor(3);
let touch = new CapasitiveSensor(20000);

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
// photo.on('tick', (e)=>{
//     console.log('photo',e)
// })
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
            let quick_released = false;
            let quick_release = async () => {
                quick_released = true

                // siriButton.once('release', TextSpeech.mic_stop)

                await pressAsk(true)
                listen_new_conversation()
            }
            siriButton.once('release', quick_release)
            await siri.start();
            light.cyan()

            if(!quick_released){
                siriButton.off('release', quick_release)
                siriButton.once('release', TextSpeech.mic_stop)
            
                await pressAsk()
                listen_new_conversation()
            }
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

/**
 * 
 * 
 * @param {ThresholdedSensor} device 
 */
function setup_device_for_value_connection(device){
    device.values_collcetion = []
}
/**
 * 
 * 
 * @param {ThresholdedSensor} device 
 * @param {number} value 
 */
function collect_device_values(device, value){
    device.values_collcetion.push(value)
}
const listen_on_tick = (device)=>{
    setup_device_for_value_connection(device)
    let collect_event = (value) => collect_device_values(device, value)
    device.on('tick', collect_event);
    return collect_event
}
/**
 * 
 * 
 * @param {ThresholdedSensor} device 
 * @param {number} factor 
 */
const set_device_value = (device, factor) => {
    device.reset(device.values_collcetion, factor)
    return device.threshold;
}


const deviceEvent = (device, event) => [device, event]


/**
 * 
 * 
 * @param {[InputDevice, string]} deviceEvent 
 * @param {[[InputDevice, string] | [wait, number]]} inDeviceEvents 
 * @param {number} timeout 
 * @returns {boolean} if the correct device is activated
 */
const wait_until_some_device = async (deviceEvent, inDeviceEvents, timeout) => {
    let [correct_device, _] = deviceEvent
    if(timeout){
        inDeviceEvents.push([wait, timeout])
    }
    let [waited_device, waited_event] = await wait_race(inDeviceEvents)
    // console.log(waited_device)
    if(inDeviceEvents.length <= 1){
        return waited_device !== wait
    }else{
        return waited_device == correct_device
    }
}

// var color_to_button = {
//     'white': button3,
//     'red': button2,
//     'blue': button1,
// }
// var possible_buttons = ['white', 'red', 'blue']

class GameMatch{
    constructor(instrction, deviceEvent, allDeviceEvents = []){
        this.instrction = instrction
        this.deviceEvent = deviceEvent
        this.inDeviceEvents = allDeviceEvents
        this.inDeviceEvents.push(deviceEvent)
    }
    async play(timeout){
        pop_busy_dialog(this.instrction.text, false)

        await this.instrction.play()
        await wait(150)

        return await wait_until_some_device(this.deviceEvent, this.inDeviceEvents, timeout)
    }
}

let welcomed = false
var difficualty = 1;
function reset_states(){
    welcomed = false;
    difficualty = 1;
}


async function ask_to_do_game(){
    let talker = new Talker(language);

    let instrction 
    
    let allInDeviceEvents = [
        [photo, 'press'], 
        [bend, 'press'], 
        [touch, 'press']
    ]

    let inDeviceEvents = difficualty > 1 ? allInDeviceEvents : [];

    let possible_game_matches = [
        new GameMatch(talker.liftMe(), [photo, 'press'], inDeviceEvents ),
        new GameMatch(talker.squeezeMe(), [bend, 'press'], inDeviceEvents),
        new GameMatch(talker.tapMe(), [touch, 'press'], inDeviceEvents)
    ]


    if(!welcomed){
        instrction = talker.welcomeChallenge()
        pop_busy_dialog(instrction.text, false)
        await instrction.play()
        welcomed = true;
    }

    bgMusic.play();

    instrction = talker.beginChallenge()
    pop_busy_dialog(instrction.text, false)
    await instrction.play()
    
    //  trail
    let round = 1;
    let timeout;
    let game ;
    let win ;
    let progress_speed = 0.5;
    let initialDuration = 8000;
    if( difficualty > 2 ){
        progress_speed = 1;
    }

    while (true) {
        timeout = initialDuration/(progress_speed * round);
        game =  possible_game_matches.randomElement();
        win = await game.play(timeout);
        if(win){
            round += 1;
            
        }else{
            break
        }
    }
    console.log(`Fianl timeout: ${timeout}`)

    instrction = talker.made_round(round - 1, difficualty)
    pop_busy_dialog(instrction.text, false)
    await instrction.play()

    instrction = talker.successComply()
    pop_busy_dialog(instrction.text, false)
    await instrction.play()
    
    bgMusic.stop();
}

async function pressAsk(autoStop = false){
    let question = await askWithDialog('', autoStop);

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

    let name = await ask_with_dialog_and_indicator_sound(siri_question.text)

    siri_question = talker.hi(name);
    pop_busy_dialog(siri_question.text, false);
    await siri_question.play();
    
    await instantAsk(siri_question.text)
}

async function ask_with_dialog_and_indicator_sound(title, autoStop=true){
    await siri.start()
    light.cyan()
    let result = await askWithDialog(title, autoStop=true)
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

            }else if(question.match(/難度|難し/i)){
                if(question.match(/ハード|難しい/i)){
                    difficualty = 3
                }else if(question.match(/ノーマル|普通/i)){
                    difficualty = 2
                }else if(question.match(/イージー|簡単/i)){
                    difficualty = 1
                }else{
                    return talker.unsure();
                }
                return talker.okey()
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

            }else if(question.match(/difficulty|difficult|difficulter/i)){
                if(question.match(/hard/i)){
                    difficualty = 3
                }else if(question.match(/normal/i)){
                    difficualty = 2
                }else if(question.match(/easy/i)){
                    difficualty = 1
                }else if(question.match(/easier/i)){
                    difficualty -= 1
                }else if(question.match(/harder|difficulter/i)){
                    difficualty += 1
                }else{
                    return talker.unsure();
                }
                return talker.okey()
            }else if(question.match(/game/i)){
                await ask_to_do_game()
                return ''
            }else if(question.match(/reset/i)){
                reset_states()
                return talker.okey()
            }else if(question.match(/hi|hello|how are you/i)){
                return talker.greetings()
            }else{
                return talker.unsure();
            }
    }
    return talker.unsure()
}