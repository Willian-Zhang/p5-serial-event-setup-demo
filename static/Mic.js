import '/libraries/recorder.js';

export default
class Mic{
    constructor(){
        this.audioRecorder = null;
    }
    async access(){
        let stream = await this.__getUserMedia();
        
        let audioContext = new AudioContext();
        let inputPoint = audioContext.createGain();
        
        // Create an AudioNode from the stream.
        let audioInput = audioContext.createMediaStreamSource(stream);
        audioInput.connect(inputPoint);
    
        this.audioRecorder = new Recorder( inputPoint );
    }
    record(){
        this.audioRecorder.clear();
        this.audioRecorder.record();
    }
    async stop(){
        return this.__getBuffers();
    }
    async getBlob(){
        return this.__exportWAV();
    }


    // Private
    async __getUserMedia(){
        return new Promise((resolve, reject) => {
            navigator.getUserMedia({video: false, audio: true}, function success(stream){
                resolve(stream);
            }, function fail(){
                reject(reject);
            });
        });
    }
    async __getBuffers(){
        return new Promise ((resolve, _) => {
            this.audioRecorder.getBuffers(resolve);
        });
    }
    async __exportWAV(){
        return new Promise ((resolve, _) => {
            this.audioRecorder.exportWAV(resolve);
        });
    }
}