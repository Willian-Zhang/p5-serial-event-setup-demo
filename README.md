# Voice of Doom
Alexa / Siri like interacive device that tries to take over the world.

## Story
In the past few years, smart speakers such as Amazon’s Echo, Google Home, and Apple’s HomePod have infiltrated many an American home. These devices are prime examples of simple design - most only need to be plugged in, configured to a home WiFi network once, and then spoken to with natural language to accomplish tasks varying from playing music to adding items to a shopping list. But, what if the design was not so seamless? What if,  like our pets and our fellow household members, our smart speakers required physical care to persist and function healthily? This is the question our final project asks in order to explore the relationship between players, technology, and compassion.



## Prerequisite
### Serial Server App
You might choose from an GUI App or commnad line:

- GUI
download https://github.com/vanevery/p5.serialcontrol/releases
- ​cmd
see https://github.com/vanevery/p5.serialport#p5serial-nodejs 

### Setup `credentials.json`
1. Visit [IBM Cloud](https://www.ibm.com/watson/services/text-to-speech/).
2. Follow the guide to setup IBM account and create API credientals.
3. copy the credientals to `credientals.json` formated as `credientals.sample.json`, there is few thing needs to change.

### Start a Web Server for commnunication
Make sure you have node.js installed to have it run, if you don't have it:

#### install `node.js` if you haven't
```
$ /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
$ brew install node
```

#### install dependencies
```bash
$ npm install
```

## How to run

### Start the Serial Server 
Start p5.serialcontrol App (or cmd line server)

### Start web server
``` bash
$ node app
```

## Test
### Use keyboard to convert speech
Keep pressing `space` while talking.

## Development
Run the following cmd to build javascript in live time:
``` bash
$ npm run webpack
```

Main Interaction logic are in `static`. `app.js` is for communication with IBM server.

