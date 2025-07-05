

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
  * @class Alerts
  * @description A class for managing and displaying alerts in a UI, synchronizing alerts from a remote source, and processing them.
  * 
  * This class handles syncing alerts, displaying them with GIFs and audio cues, updating UI colors dynamically, and populating a table with active alerts.
  * 
  * The alerts are processed in queues, and the UI elements reflect the most relevant or active alert types.
  */

class Alerts { 
    constructor(library, streamerMode=false) {
        this.library = library
        this.storage = this.library.storage
        this.storage.isStreaming = streamerMode
        this.name = `Alerts`
        this.library.createOutput(`${this.name} Initialization`, `Successfully initialized ${this.name} module`)
        document.addEventListener('onCacheUpdate', (event) => {})
    }

    /**
      * @function syncAlerts
      * @description Synchronizes alerts from the storage, processes them, and then sends them to the queue. Nothing more
      * nothing less. I recently updated this function to be more efficient and not require async/await for functionality.
      */

    syncAlerts = function(isDashboard=false) { 
        if (this.storage.alertsQueue == undefined) { this.storage.alertsQueue = [] }
        if (this.storage.alertManual == undefined) { this.storage.alertManual = `` }
        if (this.storage.lastQueue == undefined) { this.storage.lastQueue = [] }
        if (this.storage.emergencyAlerts == undefined) { this.storage.emergencyAlerts = [] }
        
        let manualAlerts = this.storage.manual 
        let activeAlerts = this.storage.active
        if (manualAlerts.length != 0) { 
            let data = manualAlerts
            if (this.storage.alertManual != data.details.name + `-` + data.details.locations + `-` + data.details.type) {
                this.storage.alertManual = data.details.name + `-` + data.details.locations + `-` + data.details.type
                if (!data.metadata.ignored) { this.storage.alertsQueue.push(data) }
                if (isDashboard) { 
                    this.createDashboardPriorityAlert(data)
                    this.library.createNotification(`<span style="color: red;">${data.details.name}</span> has been <span style="color: green;">${data.details.type}</span>`) 
                }
            }
            let isInActive = this.storage.active.find(x => x.details.name == data.details.name && x.details.locations == data.details.locations)
            if (isInActive == undefined) { this.storage.active.push(data) }
        }
        if (this.storage.active.length != 0) { 
            for (let i = 0; i < this.storage.active.length; i++) { 
                let data = this.storage.active[i]
                let emergencyAlertPlayed = this.storage.emergencyAlerts.find(x => x == `${data.details.name}-${data.details.locations}`)
                let isDuplicate = this.storage.lastQueue.find(x => x.details.name == data.details.name && x.details.description == data.details.description && x.details.type == data.details.type && x.details.issued == data.details.issued && x.details.expires == data.details.expires)
                let currentTime = Date.now();
                let timeCheck = currentTime - new Date(data.details.issued).getTime();
                let canBePushed = (timeCheck < 200000 && isDuplicate == undefined) ? true : false;
                let canBeCleared = (timeCheck > 200000 && isDuplicate != undefined) ? true : false;  
                if (data.metadata.ignored) { continue }
                if (emergencyAlertPlayed != undefined) { data.metadata.siren = false; data.metadata.eas = false; }
                if (data.metadata.siren == true || data.metadata.eas == true) { this.storage.emergencyAlerts.push(`${data.details.name}-${data.details.locations}`) } // Add to sound alerts if not already in the list
                if (canBePushed) { 
                    if (isDashboard) { 
                        this.createDashboardPriorityAlert(data)
                        this.library.createNotification(`<span style="color: red;">${data.details.name}</span> has been <span style="color: green;">${data.details.type}</span>`) 
                    }
                    this.storage.alertsQueue.push(data)
                    this.storage.lastQueue.push(data)
                }
                if (canBeCleared) {
                    let indexQueries = this.storage.lastQueue.indexOf(data)
                    let indexQueue = this.storage.alertsQueue.indexOf(data)
                    if (indexQueue > -1) { this.storage.alertsQueue.splice(indexQueue, 1) }
                    if (indexQueries > -1) { this.storage.lastQueue.splice(indexQueries, 1) }
                }
            }
        }
        return this.storage.alertsQueue
    }


    /**
      * Creates a dashboard priority alert similar to NOAA Weather Radio Alerts. Starts off with the Uniden Siren and gives a confirmation if you want to proceed to listen to the alert with
      * text to speech. 
      * @param {Object} alert - The alert object containing details about the alert.
      */

    createDashboardPriorityAlert = function(alert) {
        if (this.storage.isPriorityAlertPlaying == undefined) { this.storage.isPriorityAlertPlaying = false }
        if (!this.storage.eas) { return }
        if (this.storage.isPriorityAlertPlaying) { return }
        this.library.playAudio(this.storage.configurations.tone_sounds.uniden, false);
        dashboard_class.injectNotification({
            title: `Critical Information - ${alert.details.name}`,
            subtext: `Locations Impacted: ${alert.details.locations}`,
            description: `${alert.details.description.substring(0, 3000)}...<br><br>`,
            rows: 3,
            parent: `_body.base`,
            buttons: [
                {
                    name: `Listen`,
                    className: `button-ok`,
                    function: () => {
                        let synth = window.speechSynthesis;
                        let utter = new SpeechSynthesisUtterance(`${alert.details.description}`);
                        let preferredVoices = [ "Microsoft Aria Online (Natural) - English (United States)", "Google US English", "Google UK English Female", "Google UK English Male" ];
                        let voices = synth.getVoices();
                        utter.lang = `en-US`;
                        utter.volume = 1;
                        utter.rate = 1;
                        utter.pitch = 1;
                        utter.voice = voices.find(voice => preferredVoices.includes(voice.name)) || voices.find(voice => voice.lang.startsWith("en")) || voices[0];  utter.onend = () => {
                            this.storage.isPriorityAlertPlaying = false;
                        };
                        synth.cancel();
                        synth.speak(utter);
                        this.library.stopAllSounds();
                        dashboard_class.clearAllPopups();
                    }
                },
                {
                    name: `Ignore Alert`,
                    className: `button-danger`,
                    function: () => {
                        dashboard_class.clearAllPopups();
                        this.library.stopAllSounds();
                        this.storage.isPriorityAlertPlaying = false;
                    }
                }
            ]
        })
        this.storage.isPriorityAlertPlaying = true;
        setTimeout(() => { this.storage.isPriorityAlertPlaying = false; }, 10 * 1000);
    }  


    /**
      * @function createAnimatedAlert
      * @description This is the version 2 of the alert function. This doesn't use a GIF but rather a div and animations...
      * This is a more efficient way instead of calling 90 different gifs and wasting resources. Plus we can use CSS and style 
      * the alert to your liking!
      * 
      * @param {Object} alert - The alert object containing details about the alert.
      */

    createAnimatedAlert = function(alert) {
        if (this.storage.isStreaming) {
            let timeExpiresString = `Invalid Time`
            let timeIssuedString = `Invalid Time`
            let configuration = this.storage.configurations.widget_settings.alert;
            let maxDescriptionLength = configuration.max_text_length;
            let eventName = alert.details.name 
            let eventStatus = alert.details.type
            let locationsImpacted = alert.details.locations
            let eventIssued = alert.details.issued == undefined ? `No date found` : alert.details.issued
            let eventExpires = alert.details.expires
            let maxWindGust = alert.details.wind
            let maxHailSize = alert.details.hail
            let damageThreat = alert.details.damage
            let tornadoIndicator = alert.details.tornado
            let fullSendName = alert.details.sender
            let eventTags = alert.details.tag == undefined ? `No tags found` : alert.details.tag
            let eventExpiresTime = library.getTimeInformation(eventExpires)
            let eventIssuedTime = library.getTimeInformation(eventIssued)
            timeExpiresString = `${eventExpiresTime.date}, ${eventExpiresTime.time}`
            timeIssuedString = `${eventIssuedTime.date}, ${eventIssuedTime.time}`
            if (isNaN(eventExpiresTime.unix)) { timeExpiresString = `Invalid Time` }
            if (isNaN(eventIssuedTime.unix)) { timeIssuedString = `Invalid Time` }

            let expiresHours = Math.floor((new Date(eventExpiresTime.unix * 1000) - new Date()) / 3600000);  
            if (expiresHours < 0) { timeExpiresString = `Now...`}
            if (expiresHours > 9999) { timeExpiresString = `Until further notice...`}


            eventTags = JSON.stringify(eventTags).replace(/\"/g, ``).replace(/,/g, `, `).replace(/\[/g, ``).replace(/\]/g, ``)
            if (locationsImpacted.length > maxDescriptionLength) {locationsImpacted = locationsImpacted.substring(0, maxDescriptionLength) + `...`;}

            let colorScheme = this.storage.configurations.scheme;
            let getColor = colorScheme.find(type => eventName.includes(type.type)) || colorScheme.find(type => type.type == `Default`);
            let colorLight = getColor.color.light;
            let colorDark = getColor.color.dark;

            let domNotification = document.querySelector('.alert-box');
            let domHeader = document.querySelector('.alert-header');
            let domTitle = document.getElementById('event-name');
            let domLocations = document.getElementById('event-locations');
            let domMaxHail = document.getElementById('event-max-hail');
            let domMaxGusts = document.getElementById('event-max-wind');
            let domTornado = document.getElementById('event-tornado');
            let domDmg = document.getElementById('event-damage');
            let domExpires = document.getElementById('event-expires-time');
            let domIssued = document.getElementById('event-issued-time');
            let domSender = document.getElementById('event-sender');
            let domTags = document.getElementById('event-tags');
  
            domNotification.style.display = 'block';
            domNotification.style.animation = 'fadeInDown 0.9s ease-in-out';
            domNotification.style.boxShadow = `0 0 20px ${colorDark}`;
            domNotification.style.background = `linear-gradient(to bottom, ${colorLight}, ${colorDark})`; 
            domHeader.style.backgroundColor = colorDark;
            
            domTitle.textContent = `${eventName} (${eventStatus})`;
            domLocations.innerHTML = `${locationsImpacted || 'N/A'}`;
            domMaxHail.textContent = `${maxHailSize || 'N/A'}`;
            domMaxGusts.textContent = `${maxWindGust || 'N/A'}`;
            domTornado.textContent = `${tornadoIndicator || 'N/A'}`;
            domDmg.textContent = `${damageThreat || 'N/A'}`;
            domSender.textContent = `${fullSendName || 'N/A'}`;
            domExpires.innerHTML = `${timeExpiresString || 'N/A'}`;
            domIssued.innerHTML = `${timeIssuedString || 'N/A'}`;
            domTags.innerHTML = `${eventTags || 'N/A'}`;
            setTimeout(() => {
                domNotification.style.animation = 'fadeOut 1s ease-in-out';
                setTimeout(() => { domNotification.style.display = 'none'; domNotification.style.backgroundColor = ''; domNotification.style.animation = ''; }, 900);
            }, (this.storage.configurations.widget_settings.alert.duration - 0.8) * 1000);
        }  
        setTimeout(() => { this.storage.isQueryRunning = false; }, this.storage.configurations.widget_settings.alert.duration * 1000);
    }


    /**
      * @function triggerAlertQueue
      * @description Processes and plays the next alert in the provided queue with associated media and UI effects.
      * 
      * @async
      * @param {Array} alertQueue - The queue of alerts to process.
      */

    triggerAlertQueue = async function() {
        if (this.storage.isQueryRunning == undefined) { this.storage.isQueryRunning = false }
        if (this.storage.alertsQueue.length == 0) { return }
        if (this.storage.isQueryRunning == true) { return } else { this.storage.isQueryRunning = true }
        let nextAlert = this.storage.alertsQueue.length - 1
        let currentAlert = this.storage.alertsQueue[nextAlert]
        this.createAnimatedAlert(currentAlert)
        if (!currentAlert.metadata.onlyBeep) { 
            if (currentAlert.metadata.autobeep) { 
                this.library.playAudio(this.storage.configurations.tone_sounds.beep, false)
                await this.library.createTimeout(1300)
                this.library.playAudio(currentAlert.metadata.audio, false)
            } else {
                this.library.playAudio(currentAlert.metadata.audio, false)
            }
            if (currentAlert.metadata.eas || currentAlert.metadata.siren) {
                await this.library.createTimeout(3800)
                this.library.playAudio(currentAlert.metadata.eas ? this.storage.configurations.tone_sounds.eas : this.storage.configurations.tone_sounds.siren, false) 
            }
        } else {
            this.library.playAudio(this.storage.configurations.tone_sounds.beep, false)
        }
        this.storage.alertsQueue.splice(nextAlert, 1)
        return
    }

    /**
      * @function triggerDynamicColors
      * @description Dynamically updates the colors of the UI elements based on active alerts and their types. It will only
      * pick the most relevant alert based on count and type. If no alerts are active, it will default to the default type.
      * You can simply change the colors in the configuration file if you'd like.
      */

    triggerDynamicColors = function() {
        let light = document.getElementsByClassName(`p_boxlight`)
        let dark = document.getElementsByClassName(`p_boxdark`)
        let colorScheme = this.storage.configurations.scheme;
        let alertsScheme = colorScheme.filter(type => { return this.storage.active.some(alert => alert.details.name.includes(type.type));});    
        if (this.storage.active.length == 0 || alertsScheme.length == 0) {
            let default_c = colorScheme.find(type => {return type.type == `Default`})
            for (let x = 0; x < light.length; x++) { light[x].style.backgroundColor = default_c.color.light }
            for (let x = 0; x < dark.length; x++){ dark[x].style.backgroundColor = default_c.color.dark }
            return
        }
        colorScheme.forEach((color) => { color.count = this.storage.active.filter(x => x.details.name.includes(color.type)).length});
        colorScheme.find(type => {return type.count > 0; }) || types[types.length - 1];
        let highest = colorScheme.find(type => {return type.count > 0; }) || colorScheme[colorScheme.length - 1];  
        for (let x = 0; x < light.length; x++){
            light[x].style.backgroundColor = highest.color.light
        }
        for (let x = 0; x < dark.length; x++){
            dark[x].style.backgroundColor = highest.color.dark
        }
    }

    /**
      * @function triggerAlertTable
      * @description Populates the portable table and /widgets/table with active alerts sorted by the most recent.
      * This really doesn't have a purpose other than to show the most recent alerts in a table format for the portable
      * layout. Feel free to change the maximum number of alerts to show and the maximum number of characters per row.
      * 
      * @param {string} id - The ID of the table element to populate with alerts.
      */

    triggerAlertTable = function(id) {
        let docTable = document.getElementById(id)
        docTable.innerHTML = `<tr><th>Type<hr></th><th>Location<hr></th></tr>`
        let sortByIssued = this.storage.active.sort((a, b) => new Date(b.details.issued) - new Date(a.details.issued))
        for (let i = 0; i < sortByIssued.length; i++) {
            if (i === this.storage.configurations.widget_settings.table.max_alerts_shown) break;
            let currentAlert = sortByIssued[i];
            let insertRow = docTable.insertRow(-1);
            let eventName = insertRow.insertCell(0);
            let eventLocations = insertRow.insertCell(1);
            eventName.innerHTML = currentAlert.details.name.substring(0, this.storage.configurations.widget_settings.table.max_char_per_row);
            eventLocations.innerHTML = currentAlert.details.locations.substring(0, this.storage.configurations.widget_settings.table.max_char_per_row);
        }
        if (sortByIssued.length > this.storage.configurations.widget_settings.table.max_alerts_shown) {
            let insertRow = docTable.insertRow(-1);
            let eventName = insertRow.insertCell(0);
            let eventLocations = insertRow.insertCell(1);
            eventName.innerHTML = `...and ${sortByIssued.length - this.storage.configurations.widget_settings.table.max_alerts_shown} more`;
            eventLocations.innerHTML = `...and ${sortByIssued.length - this.storage.configurations.widget_settings.table.max_alerts_shown} more`;
        }
    }
}
