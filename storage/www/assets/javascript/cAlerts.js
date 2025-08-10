

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

    triggerLocation = function() {
        if (Object.keys(this.storage.location).length > 2) {
            document.getElementById('location-box').style.display = 'block';
            let totalChasersNearby = this.storage.spotters.filter(spotter => spotter.distance < 25).length;
            let closestAlert = this.storage.active.reduce((closest, alert) => {
                let distance = alert.details.distance && alert.details.distance !== 'N/A' ? parseFloat(alert.details.distance.replace('mi', '').trim()) : Infinity;
                return (!closest || distance < (closest.details.distance && closest.details.distance !== 'N/A' ? parseFloat(closest.details.distance.replace('mi', '').trim()) : Infinity)) ? alert : closest;
            }, null);  

            document.getElementById('closest-warning').textContent = closestAlert ? `${closestAlert.details.name} (${closestAlert.details.distance})` : `No Active Warnings`;
            document.getElementById('location').textContent = this.storage.location && this.storage.location.county && this.storage.location.state ? `${this.storage.location.county}, ${this.storage.location.state}` : `No Location Found`;
            document.getElementById('current-cape').textContent = this.storage.location.cape || `Not Available`;
            document.getElementById('chasers-nearby').textContent = `${totalChasersNearby}`;
            document.getElementById('cloud-description').textContent = this.storage.mesonet.misc?.forecast?.condition || `Not Available`;
            document.getElementById('temperature').textContent = this.storage.mesonet.temperature?.observations?.airTemperature || `Not Available`;
            document.getElementById('humidity').textContent = this.storage.mesonet.temperature?.observations?.relativeHumidity || `Not Available`;
            document.getElementById('wind-speed').textContent = this.storage.mesonet.wind?.observations?.windAverage || `Not Available`;
            document.getElementById('wind-direction').textContent = this.storage.mesonet.wind?.observations?.windDirection  || `Not Available`;
            document.getElementById('wind-gust').textContent = this.storage.mesonet.wind?.observations?.windGusts || `Not Available`;
        }

        this.triggerDynamicColors('location-row-light', 'location-row-dark');
    }

    /**
      * @function triggerNotice
      * @description This function triggers a notice alert at the top of the page. It will display the most relevant alert based on the warnings array.
      * If no relevant alert is found, it will hide the notice element. The notice will display information such as the event name, type,
      * 
      * @param {string} id - The ID of the notice element to display.
      * @param {boolean} useAlertColor - If true, the notice will use the color of the alert; otherwise, it will use the default color scheme.
      */

    triggerNotice = function(id, useAlertColor=undefined, trackingId=undefined) {
        let warnings = this.storage.configurations.widget_settings.notice.alert_types;
        let alert = warnings.map(w => this.storage.active.find(a => a.details.name == w)).filter(a => a !== undefined)[0];
        if (trackingId != undefined) { 
            alert = this.storage.active.find(a => a.raw.tracking == trackingId || (a.raw.properties.parameters.WMOidentifier && a.raw.properties.parameters.WMOidentifier[0] == trackingId));
        }
        if (alert == undefined ) return document.getElementById(id).style.display = 'none';
        let { name, type, locations, issued, expires, wind, hail, damage, tornado, sender, tag } = alert.details;
        let issuedTime = this.library.getTimeInformation(issued);
        let expiresTime = this.library.getTimeInformation(expires);

        let fields = { 
            'notice-event-name': `${name}`, 
            'notice-event-expires-time': expiresTime.expires || "N/A",
            'notice-event-locations': locations.substring(0, 50) + (locations.length > 50 ? '...' : ''), 
            'notice-event-max-hail': hail || "N/A", 
            'notice-event-max-wind': wind || "N/A", 
            'notice-event-tornado': tornado || "N/A", 
            'notice-event-damage': damage || "N/A", 
            'notice-event-issued-time': `${issuedTime.date || "N/A"}, ${issuedTime.time || "N/A"} ${issuedTime.timezone || "N/A"}`,
            'notice-event-sender': sender || "N/A", 
            'notice-event-tags': JSON.stringify(tag || []).replace(/[\[\]"]/g, '').replace(/,/g, ', ').substring(0, 50) + (JSON.stringify(tag || []).length > 50 ? '...' : '')
        };  
        let noticeElement = document.getElementById(id);
        noticeElement.style.display = 'block';
        noticeElement.style.animation = 'fadeIn 0.8s ease-in-out'; // Add fade-in animation
        for (let key in fields) document.getElementById(key).innerHTML = fields[key];
        this.triggerDynamicColors(`notice-row-light`, `notice-row-dark`, useAlertColor != undefined ? alert.details.name : undefined);
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
        let config = this.storage.configurations.widget_settings.alert;
        if (this.storage.isStreaming) {
            let maxDescLength = config.max_text_length;
            let { name, type, locations, issued, expires, wind, hail, damage, tornado, sender, tag } = alert.details;
            let issuedTime = library.getTimeInformation(issued);
            let expiresTime = library.getTimeInformation(expires);
        

            let color = this.storage.configurations.scheme.find(c => name.includes(c.type)) || this.storage.configurations.scheme.find(c => c.type == `Default`);
            let dom = document.querySelector('.alert-box');
            Object.assign(dom.style, {
                display: 'block',
                animation: 'fadeInDown 0.9s ease-in-out',
                boxShadow: `0 0 20px ${color.color.dark}`,
                background: `linear-gradient(to bottom, ${color.color.light}, ${color.color.dark})`
            });
            document.querySelector('.alert-header').style.backgroundColor = color.color.dark;

            let fields = { 
                'alert-event-name': `${name} (${type})`, 
                'alert-event-locations': locations.substring(0, maxDescLength) || 'N/A',
                'alert-event-max-hail': hail || 'N/A', 
                'alert-event-max-wind': wind || 'N/A', 
                'alert-event-tornado': tornado || 'N/A', 
                'alert-event-damage': damage || 'N/A', 
                'alert-event-sender': sender || 'N/A', 
                'alert-event-expires-time': expiresTime.expires || 'N/A', 
                'alert-event-issued-time': issuedTime.date ? `${issuedTime.date}, ${issuedTime.time}` : 'N/A',
                'alert-event-tags': JSON.stringify(tag || []).replace(/[\[\]"]/g, '').replace(/,/g, ', ')
            };
            for (let id in fields) document.getElementById(id).textContent = fields[id];

            setTimeout(() => {
                dom.style.animation = 'fadeOut 1s ease-in-out';
                setTimeout(() => dom.style.display = 'none', 900);
            }, (config.duration - 0.8) * 1000);
        }
        setTimeout(() => this.storage.isQueryRunning = false, config.duration * 1000);
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
            this.library.playAudio(this.storage.configurations.tone_sounds.beep, false)
            await this.library.createTimeout(1300)
            this.library.playAudio(currentAlert.metadata.audio, false)
            if (currentAlert.metadata.eas || currentAlert.metadata.siren || currentAlert.metadata.amber) {
                await this.library.createTimeout(3800);  
                this.library.playAudio( currentAlert.metadata.eas  ? this.storage.configurations.tone_sounds.eas  : currentAlert.metadata.siren  ? this.storage.configurations.tone_sounds.siren  : this.storage.configurations.tone_sounds.amber,  false );
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

    triggerDynamicColors = function(targetedClassLightName=`p_boxlight`, targetdClassDarkName=`p_boxdark`, targetAlert=undefined) {
        let light = document.getElementsByClassName(targetedClassLightName)
        let dark = document.getElementsByClassName(targetdClassDarkName)
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
        if (targetAlert != undefined) {
            let targetColor = colorScheme.find(type => { return targetAlert.includes(type.type); });
            highest = colorScheme.find(type => type.type == `Default`);
            if (targetColor != undefined) { highest = targetColor; }
        }
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
            if (i == this.storage.configurations.widget_settings.table.max_alerts_shown) break;
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
