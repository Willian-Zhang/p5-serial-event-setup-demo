import EventEmitter2 from "eventemitter2"

export 
class Keybaord extends EventEmitter2{
    constructor(){
        super();
        document.addEventListener('keydown', (event) => {          
            if(!event.repeat){
                this.emit('press', event);
            }
        });
        document.addEventListener('keyup', (event) => {          
            this.emit('release', event);
        });
    }
}