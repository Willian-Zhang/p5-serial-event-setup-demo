import EventEmitter2 from "eventemitter2"
import {mean, variance} from 'simple-statistics'
import {Board} from './Arduino'
export
class InputDevice extends EventEmitter2{
    tick(value){
    }
}

export
class TimeAnalysizer extends InputDevice{
    tick(elapsed){
    }
}

export 
class Button extends InputDevice{
    constructor(initialValue = 1, offValue = 1){
        super();
        this.lastValue = initialValue;
        this.offValue = offValue;
    }
    tick(value){
        /**
         * detect new changes for value
         * @param  value  new value
         */
        if(this.lastValue !== value){
            if(value === this.offValue){
                this.emit("release", this);
            }else{
                this.emit("press", this);
            }
            this.lastValue = value;
        }
    }
}

export 
class ThresholdedSensor extends InputDevice{
    constructor(threshold = 100){
        super();
        this.threshold = threshold;
        this.value = 1;
        this.mean = 1;
        this.state = false;
    }
    tick(value){
        this.emit("tick", value);
        let over  = value > this.threshold;
        
        if(this.state != over){
            if(over == true){
                this.emit("press", this);
            }else{
                this.emit("release", this);
            }
            this.state = over;
        }
        let relativeValue = value/this.mean;
        this.value = relativeValue;
    }
    reset(values, outlierMultiplier = 1.5){
        // debugger
        let avg = mean(values);
        let vari = variance(values);
        let threshold = avg + outlierMultiplier * vari;
        this.threshold = threshold;
        this.mean = avg;
    }
}

export 
class CapasitiveSensor extends ThresholdedSensor{
    reset(values){
        return super.reset(values, 10)
    }
}

export 
class AnalogReader extends InputDevice{
    constructor(){
        super();
        this.value = 0;
    }
    tick(value){
        this.emit("tick", value);
        this.value = value;
    }
}

export 
class CatagorialReader extends InputDevice{
    constructor(defaultValue = 0){
        super();
        this.value = defaultValue;
    }
    tick(value){
        this.emit("tick", value);
        if(value !== this.value){
            this.emit("change", value);
            this.value = value;
        }
    }
}


export 
class SimpleOutputDevice extends EventEmitter2{
    /**
     * Creates an instance of SimpleOutputDevice.
     * @param {Board} board 
     * @memberof SimpleOutputDevice
     */
    constructor(board){
        super()
        this.board = board
    }
}

export 
class Light extends SimpleOutputDevice{
    change_color(r, g, b){
        // this.board.write()
    }
    /**
     * 
     * 
     * @param {Number} id 
     * @memberof Light
     */
    change_color_id(id){
        this.board.write(id)
    }
    red(){
        change_color_id(0)
    }
    green(){
        change_color_id(1)
    }
    blue(){
        change_color_id(2)
    }
    yellow(){
        change_color_id(3)
    }
    pupple(){
        change_color_id(4)
    }
    cyan(){
        change_color_id(5)
    }
    white(){
        change_color_id(6)
    }
    off(){
        change_color_id(7)
    }
}