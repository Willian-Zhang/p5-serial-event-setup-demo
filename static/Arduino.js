import './libraries/p5.js';
import './libraries/p5.serialport.js';
import './libraries/eventemitter2.js';

export class Board extends EventEmitter2{

    constructor(devices = []){
        super();
        this.serial = new p5.SerialPort();
        this.buffer = [];
        if(devices){
            this.on('line', this.processLine.bind(this));
            this.on('point', this.processPoint.bind(this));
        }
        
        this.devices = devices;

        this.capacitors = this.devices.filter(d=>d instanceof CapasitiveSensor)
        this.buttons    = this.devices.filter(d=>d instanceof Button)
        this.last_some_capacitors_activated = false;
        this.collectedValues = null;
    }
    connect(options){
        // serial.on('data', serialEvent);  // callback for when new data arrives
        // serial.on('error', serialError); // callback for errors
        this.serial.on('connected', event=>this.emit('connected', event));
        this.serial.on('list', (portList)=>{
            let filtered = portList.filter(name=>name.startsWith('/dev/cu.usbmodem'));
            if(filtered.length == 0){
                throw new Error('No port found!');
            }else if(filtered.length == 1){
                this.serial.open(filtered[0], options);
                return filtered[0];
            }else{
                throw new Error('Mutiple ports found:'+string(filtered));
            }
        }); 
        this.serial.on('data', this.processData.bind(this));
        
        // I don't know why but this runs for deault 
        // this.list(); 
    }
    processData(){
        
        let code = this.serial.read();
        if(code==10){
            let buffer = this.buffer;
            this.buffer = [];
            this.emit('line', buffer);
        }else{
            this.buffer.push(code);
        }
    }


    write(any){
        this.serial.write(any);
    }

    processLine(buffer){
        let point = String.fromCharCode(...buffer).split('\t').map(s=>+s);
        if( point.length == this.devices.length+1){
            this.emit('point', point);
        }else{
            this.emit('warning', {
                error: `Miss alignment of devices. Should be ${this.devices.length+1}, getting ${point.length}.`,
                point: point
            });
        }        
    }

    processPoint(point){
        this.devices.map((device, i)=>{
            if(device instanceof CapasitiveSensor||
               device instanceof Button||
               device instanceof AnalogReader||
               device instanceof CatagorialReader){
                device.tick(point[i+1]);
            }
        });
    }
    disconnect(){
        // TODO:
        // server.removeListener('get', callback);
    }
}