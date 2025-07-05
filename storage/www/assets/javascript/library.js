

/*
              _                             _               _     __   __
         /\  | |                           | |             (_)    \ \ / /
        /  \ | |_ _ __ ___   ___  ___ _ __ | |__   ___ _ __ _  ___ \ V / 
       / /\ \| __| '_ ` _ \ / _ \/ __| '_ \| '_ \ / _ \ '__| |/ __| > <  
      / ____ \ |_| | | | | | (_) \__ \ |_) | | | |  __/ |  | | (__ / . \ 
     /_/    \_\__|_| |_| |_|\___/|___/ .__/|_| |_|\___|_|  |_|\___/_/ \_\
                                     | |                                 
                                     |_|                                                                                                                
    Written by: k3yomi@GitHub
    Version: v7.0.0                              
*/



/**
  * @class Library
  * @description The `Library` class is responsible for managing and interacting with various system operations such as logging, 
  * fetching remote data, updating internal storage, handling device interaction, and more. This class is designed to be initialized 
  * at the start of the application and provides methods for interacting with and 
  * manipulating data throughout the frontend side.
  */

class Library { 
    constructor() {
        this.storage = {}
        this.name = `Library`
        this.createOutput(`${this.name} Initialization`, `Successfully initialized ${this.name} module`)
    }


    /**
     * @function createOutput
     * @description Logs messages to the console with a specific format, including the current date and time.
     * 
     * @param {string} [header=this.name] - The header for the log message, defaulting to the class name.
     * @param {string} [message=`No message Provided`] - The message to log, defaulting to "No message Provided".
     */

    createOutput = function(header=this.name, message=`No message Provided`) {
        let siteLocation = window.location.href.split('/').slice(-1)[0].split('.')
        if (siteLocation == ``) { siteLocation = `dashboard` } else { siteLocation = siteLocation[0] }
        console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] << ${header} (${siteLocation}) >> ${message}`)
    }

    /**
      * @function createHttpRequest
      * @description Makes an HTTP GET request to the specified URL and returns the response data as a string.
      * 
      * @async
      * @param {string} [url=`/`] - The URL to send the request to. Defaults to the root URL.
      * @returns {Promise<string>} Resolves with the response text from the API.
      */

    createHttpRequest = async function(url=`/`) {
        return new Promise(async (resolve, reject) => {
            await fetch(url).then((response) => {
                resolve(response)
            })
        })
    }

    /**
      * @function createWebsocketSession
      * @description Creates a new session by and establishing a WebSocket connection to the server. This also sets up event listeners for handling incoming messages 
      * and connection status changes so we can update the internal storage accordingly.
      * Additionally, it handles reconnections in case the WebSocket connection is closed.
      * 
      * @async
      */

    createWebsocketSession = async function(requestedCache=[`active`, `public`]) {
        return new Promise((resolve, reject) => {
            let newConnection = true
            let websocketUrl = `${window.location.protocol == `https:` ? `wss:` : `ws:`}//${window.location.hostname}:${window.location.port}/ws`
            this.storage.websocket = new WebSocket(websocketUrl)
            this.storage.websocket.addEventListener(`open`, (event) => {
                this.createOutput(`Library.CreateWebsocketSession`, `WebSocket connection has been established`)
            })
            this.storage.websocket.addEventListener(`close`, (event) => {
                this.createOutput(`Library.CreateWebsocketSession`, `WebSocket connection has been closed, attempting to reconnect`)
                this.storage.websocket.close()
                this.storage.websocket = null
                setTimeout(() => { this.createWebsocketSession(requestedCache) }, 1000)
            })
            this.storage.websocket.addEventListener(`message`, async (event) => {
                let data = JSON.parse(event.data)
                let messageType = data.messageType
                let rawMessage = data.message 
                let directValue = data.value == undefined ? `` : data.value
                if (directValue == `public`) { directValue = `configurations` }
                
                if (messageType == `onConnection`) {
                    this.createOutput(`Library.CreateWebsocketSession`, `Websocket server has responded with: ${rawMessage}`)
                    this.storage.websocket.send(JSON.stringify({messageType: `onRequestValues`, message: requestedCache}))
                }
                if (messageType == `onCacheUpdate`) {
                    if (directValue != undefined) { this.storage[directValue] = rawMessage }
                }
                if (messageType == `onCacheReady`) {
                    this.storage.websocket.send(JSON.stringify({messageType: `onRequestValues`, message: requestedCache}))
                }
                if (messageType == `onCacheFinished`) {
                    setTimeout(() => { document.dispatchEvent(new CustomEvent('onCacheUpdate', { detail: this.storage })) }, 100)
                    if (newConnection) {
                        newConnection = false
                        resolve({status: true, message: `WebSocket connection has been established`})
                    }
                }
            })
        })
    }

    /**
      * @function detectMobileDevice
      * @description Detects if the user is on a mobile device. If detected, displays a message to prompt users to enable audio interaction.
      * 
      * @async
      * @returns {Promise<void>} Resolves when mobile detection and potential audio prompt setup is complete.
      */

    detectMobileDevice = function() {
        if (window.innerWidth <= 1270) {
            this.storage.mobile = true 
            let interaction = document.createElement('button');
            interaction.innerHTML = `Mobile devices have disabled audio interaction. Click here to enable.`;
            interaction.style.position = `fixed`;
            interaction.style.top = `50%`;
            interaction.style.left = `50%`;
            interaction.style.transform = `translate(-50%, -50%)`;
            interaction.style.fontSize = `22px`;
            interaction.style.padding = `40px 60px`;
            interaction.style.background = `rgba(35, 37, 38, 0.9)`;
            interaction.style.color = `#fff`;
            interaction.style.border = `none`;
            interaction.style.borderRadius = `16px`;
            interaction.style.cursor = `pointer`;
            interaction.style.zIndex = `9999`;
            interaction.style.fontFamily = `inherit`;
            interaction.style.fontWeight = `bold`;
            interaction.style.letterSpacing = `0.5px`;
            interaction.style.transition = `background 0.3s, transform 0.2s`;
            interaction.onmouseover = () => {
                interaction.style.transform = `translate(-50%, -50%) scale(1.05)`;
            };
            interaction.onmouseout = () => {
                interaction.style.transform = `translate(-50%, -50%) scale(1)`;
            };
            document.body.appendChild(interaction);  interaction.onclick = () => {
                let audioChannels = [];
                interaction.remove();
                for (let i = 0; i < 4; i++) {
                    let audio = new Audio();
                    audio.src = `data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQDkAAAAAAAAAGw9wrNaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV`;
                    audio.volume = 0.5;
                    audio.play();
                    audioChannels.push(audio);
                }
                this.storage.channels = audioChannels;
            };
        }
    }

    /**
      * @function playAudio
      * @description Plays the specified audio file. If the device is mobile, it uses a set of preconfigured audio channels to handle playback.
      * 
      * @param {string} audioUrl - The URL of the audio file to play.
      * @param {boolean} [useChannels=false] - If true, uses the preconfigured audio channels for playback. Defaults to false.
      */

    playAudio = function(audioUrl, useChannels=false) {
        if (!this.storage.mobile) { 
            if (useChannels && !this.storage.playable) { return }
            if (useChannels) { this.storage.playable = false }
            let audio = new Audio()
            audio.src = audioUrl
            audio.volume = 1.0
            audio.autoplay = true
            audio.play()
            if (!this.storage.currentPlaying) { this.storage.currentPlaying = [] }
            this.storage.currentPlaying.push(audio)
            audio.onended = () => {
                audio.remove()
                let index = this.storage.currentPlaying.indexOf(audio);
                if (index > -1) {  this.storage.currentPlaying.splice(index, 1); }
                if (useChannels) { this.storage.playable = true}
            }  
        } else { 
            let channels = undefined;
            if (useChannels && !this.storage.playable) { return; }
            if (useChannels) { 
                this.storage.playable = false; 
                channels = [this.storage.channels[0]]; 
            } else { 
                channels = this.storage.channels; 
            }
            for (let channel of channels) {
                if (channel.ended || channel.paused) {
                    channel.src = audioUrl;
                    channel.autoplay = true;
                    channel.volume = 1.0;
                    channel.play();
                    if (!this.storage.currentPlaying) { this.storage.currentPlaying = [] }
                    this.storage.currentPlaying.push(channel);
                    channel.onended = () => {
                        let index = this.storage.currentPlaying.indexOf(channel);
                        if (index > -1) { this.storage.currentPlaying.splice(index, 1); }
                        if (useChannels) { this.storage.playable = true; }
                    };
                    break;
                }
            }    
        }
    }

    /**
     * @function stopAllSounds
     * @description Stops all currently playing audio files and resets the current playing audio list.
     */

    stopAllSounds = function() {
        if (this.storage.currentPlaying) {
            for (let audio of this.storage.currentPlaying) {
                if (!audio.ended && !audio.paused) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
            this.storage.currentPlaying = [];
        }
    }

   /**
     * @function createNotification
     * @description Creates a notification element and appends it to the body. The notification slides in, stays for a while, and then slides out before being removed from the DOM.
     * 
     * @param {string} title - The title of the notification to be displayed.
     */

    createNotification = function(title) {
        let existingNotification = document.querySelector('.notification');
        if (existingNotification) { return  }
        let notification = document.createElement('div');
        notification.className = `notification`;
        notification.innerHTML = `<h2>${title}</h2>`;  
        document.body.appendChild(notification);
        notification.classList.add('notification-slide-in');
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(1%)';
        }, 100);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-50%)';
            setTimeout(() => {notification.remove()}, 500);
        }, 2500);  
    }

    /**
      * @function createTimeout
      * @description Creates a timeout delay for a specified number of milliseconds.
      * 
      * @async
      * @param {number} [timeMs=1000] - The duration of the timeout in milliseconds. Defaults to 1000ms.
      */

    createTimeout = async function(timeMs=1000) {
        return new Promise((resolve) => {
            setTimeout(() => { resolve() }, timeMs)
        })
    }

    /**
      * @function getTimeInformation
      * @description Retrieves the current time information in a configurable format, considering time zone and standard/24-hour time.
      * 
      * @param {number} [setTime=0] - The time to format. If 0, uses the current time. Defaults to 0.
      * @returns {object} An object containing the formatted time, date, timezone, and Unix timestamp.
      */

    getTimeInformation = function(setTime=0) {
        let noTime;
        let monthDict = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"]
        let timeWidgetSettings = this.storage.configurations.widget_settings.time_date
        let standardTime = timeWidgetSettings.standard_time 
        let timeZone = timeWidgetSettings.timezone
        if (setTime == 0) { noTime = new Date() } else { noTime = setTime }
        let formal = new Date(noTime.toLocaleString('en-US', { timeZone: timeZone }))
        let formalShort = new Date(noTime.toLocaleString('en-US', { timeZone: timeZone, timeZoneName: 'short' }))
        let timeZoneFormal = formalShort.toString().split(' ')[3]
        let second = formal.getSeconds()
        let minute = formal.getMinutes()
        let hour = formal.getHours()
        let month = formal.getMonth()
        let day = formal.getDate()
        if (standardTime) {
            if (hour > 12) { hour -= 12 }
            if (hour == 0) { hour = 12 }
        }
        let extension = standardTime ? (formal.getHours() >= 12 ? 'PM' : 'AM') : ''
        if (second < 10) { second = `0${second}` }
        if (minute < 10) { minute = `0${minute}` }
        if (hour < 10) { hour = `0${hour}` }
        month = monthDict[month]
        return { // Half of these wont be used but oh fucking well...
            time: `${hour}:${minute}:${second} ${standardTime ? extension : ''}`,
            date : `${month} ${day}`,
            timezone: timeZoneFormal, 
            unix: formal.getTime() / 1000
        }
    }
}