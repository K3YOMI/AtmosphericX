

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

global = {}

/**
  * @class Library
  * @description The `Library` class is responsible for managing and interacting with various system operations such as logging, 
  * fetching remote data, updating internal storage, handling device interaction, and more. This class is designed to be initialized 
  * at the start of the application and provides methods for interacting with and 
  * manipulating data throughout the frontend side.
  */

class Library { 
    constructor() {
        this.storage = global
        this.name = `Library`
        this.PrintLog(`${this.name} Initialization`, `Successfully initialized ${this.name} module`)
    }

    /**
      * @function PrintLog
      * @description Logs messages to the console with a timestamp, project name, and the current page URL. Useful for debugging and tracking application activities.
      * 
      * @async
      * @param {string} [_header='Info'] - The header or category of the log message.
      * @param {string} [_message='No message provided.'] - The message to be logged.
      * 
      * @returns {Promise<void>} 
      */

    async PrintLog(_header=`Info`, _message=`No message provided.`) {
        let get_name_site = window.location.href.split('/').slice(-1)[0].split('.')
        if (get_name_site == ``) { get_name_site = `dashboard` } else { get_name_site = get_name_site[0] }
        console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] << ${_header} (${get_name_site}) >> ${_message}`)
    }

    /**
      * @function CallHTTPS
      * @description Makes an HTTP GET request to the specified URL and returns the response data as a string.
      * 
      * @async
      * @param {string} [_url='localhost/api/all'] - The URL to send the GET request to.
      * @returns {Promise<string>} Resolves with the response text from the API.
      */

    async CallHTTPS(_url=`localhost/api/all`) {
        return new Promise(async (resolve, reject) => {
            await fetch(_url).then(response => response.text()).then(data => {
                resolve(data)
            })
        })
    }

    /**
      * @function UpdateCache
      * @description Updates the internal storage with new data and dispatches a custom event notifying other components of the update.
      * 
      * @async
      * @param {Object} _data - An object containing the new data to update the storage with.
      * @returns {Promise<void>} Resolves when the cache has been successfully updated.
      */

    async UpdateCache(_data={}) {
        return new Promise(async (resolve, reject) => {
            this.storage.configurations = _data.configurations ? _data.configurations : []
            this.storage.active = _data.active ? _data.active : []
            this.storage.warnings = _data.warnings ? _data.warnings : []
            this.storage.manual = _data.manual ? _data.manual : []
            this.storage.watches = _data.watches ? _data.watches : []
            this.storage.reports = _data.reports ? _data.reports : []
            this.storage.broadcasts = _data.broadcasts ? _data.broadcasts : []
            this.storage.header = _data.status ? _data.status : []
            this.storage.random = _data.random ? _data.random : []
            this.storage.stations = _data.stations ? _data.stations : []
            this.storage.spotters = _data.spotters ? _data.spotters : []
            this.storage.lightning = _data.lightning ? _data.lightning : []
            this.storage.mesoscale = _data.mesoscale ? _data.mesoscale : []
            this.storage.statistics = _data.statistics ? _data.statistics : []
            this.storage.wire = _data.wire ? _data.wire : []
            document.dispatchEvent(new CustomEvent('onCacheUpdate', { detail: _data }));
            let entries = Object.keys(_data).reduce((sum, key) => { return sum + (_data[key] instanceof Array ? _data[key].length : 0); }, 0);
            _data = JSON.stringify(_data);
            let size = new Blob([_data]).size / (1024 * 1024);
            this.PrintLog(`${this.name}.SetCache`, `Cache has been updated successfully - ${size.toFixed(2)} MB, ${entries} total entries`);        
            resolve()
        })
    }

    /**
      * @function CreateSession
      * @description Creates a new session by and establishing a WebSocket connection to the server.
      * 
      * @async
      * @returns {Promise<string>} Resolves with a success message upon session creation.
      */

    async CreateSession() {
        return new Promise(async (resolve, reject) => {
            let hostname = window.location.hostname
            let port = window.location.port
            this.storage.socket = new WebSocket(`ws://${hostname}:${port}`)
            this.storage.socket.addEventListener(`open`, () => {
                this.PrintLog(`Library.CreateSession`, `WebSocket connection established`);
            });

            this.storage.socket.addEventListener(`close`, () => {
                this.PrintLog(`Library.CreateSession`, `WebSocket connection dropped. Attempting to reconnect...`);
                this.storage.socket.close()
                setTimeout(() => {this.CreateSession()}, 1000);
            });  
            this.storage.socket.onmessage = async (event) => {
                this.UpdateCache(JSON.parse(event.data))
                resolve(`WebSocket connection established`)
            }
        })
    }

    /**
      * @function DetectMobileDevice
      * @description Detects if the user is on a mobile device. If detected, displays a message to prompt users to enable audio interaction.
      * 
      * @async
      * @returns {Promise<void>} Resolves when mobile detection and potential audio prompt setup is complete.
      */

    async DetectMobileDevice() {
        let useragents =  /iPhone|iPad|iPod|Android|BlackBerry|IEMobile|WPDesktop/i.test(navigator.userAgent);
        if (useragents) {
            this.storage.mobile = true 
            let interaction = document.createElement('button');
            interaction.innerHTML = `Mobile devices have disabled audio interaction. Click here to enable.`;
            interaction.style.position = `fixed`;
            interaction.style.top = `50%`;
            interaction.style.left = `50%`;
            interaction.style.transform = `translate(-50%, -50%)`;
            interaction.style.fontSize = `25px`;
            interaction.style.padding = `120px`;
            document.body.appendChild(interaction);
            interaction.onclick = () => {
                let audio_channels = [];
                interaction.remove();
                for (let i = 0; i < 4; i++) {
                    const audio = new Audio();
                    audio.src = `data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQDkAAAAAAAAAGw9wrNaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV`;
                    audio.volume = 0.5;
                    audio.play();
                    audio_channels.push(audio);
                }
                this.storage.channels = audio_channels;
            };
        }
    }

    /**
      * @function PlayAudio
      * @description Plays the specified audio file. If the device is mobile, it uses a set of preconfigured audio channels to handle playback.
      * 
      * @async
      * @param {string} [_audio='default.mp3'] - The audio file URL or base64 data to play.
      * @param {boolean} [_channels=false] - Whether or not to use the predefined audio channels for playback.
      * 
      * @returns {Promise<void>} Resolves when the audio has been successfully played.
      */

    async PlayAudio(_audio=`default.mp3`, _channels=false) {
        if (!this.storage.mobile) {
            if (_channels && !this.storage.playable) { return }
            if (_channels) { this.storage.playable = false }
            let audio = new Audio()
            audio.src = _audio
            audio.volume = 1.0
            audio.autoplay = true
            audio.play()
            audio.onended = () => {
                audio.remove()
                if (_channels) { this.storage.playable = true}
            }
        } else { 
            let channels = undefined;
            if (_channels && !this.storage.playable) { return; }
            if (_channels) { 
                this.storage.playable = false; 
                channels = [this.storage.channels[0]]; 
            } else { 
                channels = this.storage.channels; 
            }
            for (let channel of channels) {
                if (channel.ended || channel.paused) {
                    channel.src = _audio;
                    channel.autoplay = true;
                    channel.volume = 1.0;
                    channel.play();
                    channel.onended = () => {
                        if (_channels) { this.storage.playable = true; }
                    };
                    break;
                }
            }    
        }
    }

    /**
      * @function CreateTimeout
      * @description Creates a timeout delay for a specified number of milliseconds.
      * 
      * @async
      * @param {number} [_ms=1000] - The delay in milliseconds.
      * 
      * @returns {Promise<void>} Resolves after the timeout period has passed.
      */

    async CreateTimeout(_ms=1000) {
        return new Promise((resolve) => {
            setTimeout(() => { resolve() }, _ms)
        })
    }

    /**
      * @function GetTimeInformation
      * @description Retrieves the current time information in a configurable format, considering time zone and standard/24-hour time.
      * 
      * @async
      * @param {number} [_time=0] - An optional timestamp to convert. If set to `0`, the current time is used.
      * 
      * @returns {Promise<Object>} Resolves with an object containing the formatted time, date, and timezone information.
      */

    async GetTimeInformation(_time=0) {
        let time;
        let month_dictionary = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"]
        let configurable_elements = global.configurations.widget_settings.time_date

        let timezone = configurable_elements.timezone
        let standard_time = configurable_elements.standard_time
        if (_time == 0) { time = new Date() } else { time = _time }
        let formal = new Date(time.toLocaleString('en-US', { timeZone: timezone }))
        let format_short = new Date(time.toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'short' }))
        let timezone_formal = format_short.toString().split(' ')[3]
        let second = formal.getSeconds()
        let minute = formal.getMinutes()
        let hour = formal.getHours()
        let month = formal.getMonth()
        let day = formal.getDate()
        if (standard_time) {
            if (hour > 12) { hour -= 12 }
            if (hour == 0) { hour = 12 }
        }
        let extension = standard_time ? (formal.getHours() >= 12 ? 'PM' : 'AM') : ''
        if (second < 10) { second = `0${second}` }
        if (minute < 10) { minute = `0${minute}` }
        if (hour < 10) { hour = `0${hour}` }
        month = month_dictionary[month]
        return { 
            time: `${hour}:${minute}:${second} ${standard_time ? extension : ''}`,
            date : `${month} ${day}`,
            timezone: timezone_formal, 
            unix: formal.getTime() / 1000
        }
    }

    /**
      * @function FetchStorage
      * @description Fetches data stored in the `storage` object for a specific key. If the key is not found, initializes it with an empty array.
      * 
      * @async
      * @param {string} _key - The key in the `storage` object to fetch.
      * 
      * @returns {Promise<Array>} Resolves with the data stored at the specified key.
      */

    async FetchStorage(_key) {
        if (this.storage[_key]) { return this.storage[_key]}
        this.storage[_key] = []
    }

    /**
      * @function CreateNewElement
      * @description Creates a new DOM element based on the provided metadata, including attributes, style, and content. The element is appended to the specified parent element.
      * 
      * @async
      * @param {Object} _metadata - Metadata for the new DOM element. The object may include:
      * @param {Array<string>} [blacklist=[]] - A list of style properties to exclude from being applied.
      * 
      * @returns {Promise<void>} Resolves after the element is created and appended to the DOM.
      */

    async CreateNewElement(_metadata=undefined, blacklist=[]) {
        if (_metadata == undefined) { return false }
        let name = _metadata.name ? _metadata.name : `No Name Provided`
        let type = _metadata.type ? _metadata.type : `div`
        let id = _metadata.id ? _metadata.id : ``
        let class_name = _metadata.class ? _metadata.class : ``
        let parent = _metadata.parent ? _metadata.parent : ``
        let style = _metadata.style ? _metadata.style : {}
        let attributes = _metadata.attributes ? _metadata.attributes : {}
        let text = _metadata.content ? _metadata.content : ``

        let created_element = document.createElement(type)
        if (id != ``) { created_element.setAttribute(`id`, id) }
        if (class_name != ``) { created_element.setAttribute(`class`, class_name) }
        if (name != ``) { created_element.setAttribute(`description`, name) }

        for (let key in style) {
            if (blacklist.includes(key)) { continue }
            created_element.style.setProperty(key, style[key])
            this.PrintLog(`Library.SetStyle`, `Set ${key} to ${style[key]} for ${name} element`)
        }
        for (let key in attributes) {
            created_element.setAttribute(key, attributes[key])
            this.PrintLog(`Library.SetAttribute`, `Set ${key} to ${attributes[key]} for ${name} element`)
        }
        if (parent != `body` && parent != '') {
            let parentElement = document.getElementById(parent)
            if (parentElement) { parentElement.appendChild(created_element) } else { this.PrintLog(`Library.CreateElement`, `Parent ${parent} not found`) }
        } else {
            if (parent != '') {
                document.body.appendChild(created_element)
            }
        }
        if (text != undefined) { created_element.innerHTML = text }
        return created_element
    }
}