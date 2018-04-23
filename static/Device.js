import './libraries/eventemitter2.js';

export class Button extends EventEmitter2{
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
                this.emit("release");
            }else{
                this.emit("press");
            }
            this.lastValue = value;
        }
    }
}
export class CapasitiveSensor extends EventEmitter2{
    constructor(threshold = 100){
        super();
        this.threshold = threshold;
        this.value = 1;
        this.mean = 1;
        this.state = false;
    }
    tick(value){
        
        let over  = value > this.threshold;
        
        if(this.state != over){
            if(over == true){
                this.emit("activate");
            }else{
                this.emit("release");
            }
            this.state = over;
        }
        let relativeValue = value/this.mean;
        this.value = relativeValue;
    }
    reset(values){
        // debugger
        let avg = mean(values);
        let vari = variance(values);
        let threshold = avg + 10*vari;
        this.threshold = threshold;
        this.mean = avg;
    }
}
export class AnalogReader extends EventEmitter2{
    constructor(){
        super();
        this.value = 0;
    }
    tick(value){
        this.emit("tick", value);
        this.value = value;
    }
}

export class CatagorialReader extends EventEmitter2{
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
