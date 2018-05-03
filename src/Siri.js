import {Howl, Howler} from 'howler'
import {wait} from './utils.js'

export default
class Siri {
    constructor(filepath = 'Siri.aac'){
        this.siri = new Howl({
            src: [filepath],
            sprite: {
              start: [0, 1000],
              done: [1000, 1000],
              cancel: [2000, 1000]
            }
          });
    }
    play(spriteName){
        if(this.siri.playing()){
            this.siri.stop();
        }
        this.siri.play(spriteName);
    }
    async start(){
        this.play('start');
        await wait(200)
    }
    async done(){
        this.play('done')
        await wait(200)
    }
    async cancel(){
        this.play('cancel')
        await wait(200)
    }
}