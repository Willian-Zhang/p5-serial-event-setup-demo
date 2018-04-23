import './libraries/eventemitter2.js';
import  './libraries/jquery.min.js';

export
class SpeechToText extends EventEmitter2{
    constructor(IBMCredentials){
        super();
        this.wssurl = 'wss://stream.watsonplatform.net/speech-to-text/api'
        this.url = IBMCredentials.speech_to_text[0].credentials.url;
        this.username = IBMCredentials.speech_to_text[0].credentials.username;
        this.password = IBMCredentials.speech_to_text[0].credentials.password;
        this.token = IBMCredentials.speech_to_text[0].credentials.token;
        this.websocket;
    }
    async connect(){
        let token = await $.ajax({
            type: "GET",
            dataType: 'text',
            url: `https://stream.watsonplatform.net/authorization/api/v1/token?url=${this.url}`,
            username: this.username,
            password: this.password ,
            crossDomain : true,
            headers : { "Authorization" : "BasicCustom" },
            xhrFields: {
                withCredentials: true
            }
        });
        // let token = this.token;
        console.log('token', token);

        this.websocket = new WebSocket(`${this.wssurl}/v1/recognize?watson-token=${token}`);
        this.websocket.onopen = (evt) => { this.emit('open', evt) };
        this.websocket.onclose = (evt) => { this.emit('close', evt) };
        this.websocket.onmessage = (evt)=>  { this.emit('message', evt) };
        this.websocket.onerror = (evt) => { this.emit('error', evt) };
    }
    close(){
        this.websocket.close();
    }
    send(blob, type = 'audio/wav'){
        this.websocket.send(JSON.stringify({
            action: 'start','content-type': type,
        }));
    
        this.websocket.send(blob);
    
        this.websocket.send(JSON.stringify({action: 'stop'}));
    }
}