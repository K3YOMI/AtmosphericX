

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
    Version: v7.0.5                              
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
            let isWarning = data.details.name.includes(`Warning`) // Unused but may be useful in the future
            let isWatch = data.details.name.includes(`Watch`) // Unused but may be useful in the future
            let isEmergency = data.details.name.includes(`Emergency`) || data.details.name.includes(`Particularly Dangerous Situation`) // Unused but may be useful in the future
            if (this.storage.alertManual != data.details.name + `-` + data.details.locations + `-` + data.details.type) {
                this.storage.alertManual = data.details.name + `-` + data.details.locations + `-` + data.details.type
                if (!data.metadata.ignored) { this.storage.alertsQueue.push(data) }
                if (isDashboard) { this.library.createNotification(`<span style="color: red;">${data.details.name}</span> has been <span style="color: green;">${data.details.type}</span>`) }
            }
            // check if in active
            let isInActive = this.storage.active.find(x => x.details.name == data.details.name && x.details.locations == data.details.locations)
            if (isInActive == undefined) { this.storage.active.push(data) }
        }
        if (activeAlerts.length != 0) { 
            for (let i = 0; i < activeAlerts.length; i++) { 
                let data = activeAlerts[i]
                let emergencyAlertPlayed = this.storage.emergencyAlerts.find(x => x == `${data.details.name}-${data.details.locations}`)
                let isDuplicate = this.storage.lastQueue.find(x => x.details.name == data.details.name && x.details.locations == data.details.locations && x.details.type == data.details.type && x.details.description == data.details.description)
                let currentTime = new Date().getTime() / 1000
                let timeCheck = currentTime - new Date(data.details.issued).getTime() / 1000
                let canBePushed = (timeCheck < 200 && isDuplicate == undefined) ? true : false 
                let canBeCleared = (timeCheck > 200 && isDuplicate != undefined) ? true : false
                if (data.metadata.ignored) { continue }
                if (emergencyAlertPlayed != undefined) { data.metadata.siren = false; data.metadata.eas = false; }
                if (data.metadata.siren == true || data.metadata.eas == true) { this.storage.emergencyAlerts.push(`${data.details.name}-${data.details.locations}`) } // Add to sound alerts if not already in the list
                if (canBePushed) { 
                    if (isDashboard) { this.library.createNotification(`<span style="color: red;">${data.details.name}</span> has been <span style="color: green;">${data.details.type}</span>`) }
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
      * @function createAnimatedAlert
      * @description Displays an alert using a GIF animation with a title and subtitle in the UI.
      * 
      * @param {string} animationURL - The URL of the GIF animation to display.
      * @param {string} [alertTitle=`Test Message`] - The title of the alert to display.
      * @param {string} [alertMessage=`This is a test message`] - The subtitle of the alert to display.
      */

    createAnimatedAlert = function(animationURL, alertTitle = `Test Message`, alertMessage = `This is a test message`) {
        if (this.storage.totalGifAlerts == undefined) { this.storage.totalGifAlerts = 0 }
        if (this.storage.isStreaming) {
            this.storage.totalGifAlerts++;
            let configuration = this.storage.configurations.widget_settings.alert;
            let maxDescriptionLength = configuration.max_text_length;
            let animationStyle = configuration.animation_style;
            let docNotification = document.getElementById(`alert_notification`);
            let docTitle = document.getElementById(`alert_title`);
            let docMessage = document.getElementById(`alert_description`);
            docNotification.style.display = `block`;
            docNotification.src = `${animationURL}?=${this.storage.totalGifAlerts}`;
            if (alertMessage.length > maxDescriptionLength) { alertMessage = alertMessage.substring(0, maxDescriptionLength) + `...`;}
            docMessage.style = animationStyle;
            docTitle.style = animationStyle;
            docTitle.textContent = alertTitle;
            docMessage.textContent = alertMessage;
            setTimeout(() => { docNotification.style.display = `none`; }, 6.8 * 1000);
            setTimeout(() => { docTitle.textContent = ``; docMessage.textContent = ``; docNotification.src = ``; docMessage.style = ``; docTitle.style = ``; }, 6.8 * 1000);
        }
        setTimeout(() => { this.storage.isQueryRunning = false; }, 6.8 * 1000);
    };

    /**
      * @function triggerAlertQueue
      * @description Processes and plays the next alert in the provided queue with associated media and UI effects.
      * 
      * @async
      * @param {Array} alertQueue - The queue of alerts to process.
      */

    triggerAlertQueue = async function(alertQueue=[], v2=false) {
        if (this.storage.isQueryRunning == undefined) { this.storage.isQueryRunning = false }
        if (alertQueue.length == 0) { return }
        if (this.storage.isQueryRunning == true) { return } else { this.storage.isQueryRunning = true }
        let nextAlert = alertQueue.length - 1
        let currentAlert = alertQueue[nextAlert]
        if (v2) { this.createAnimatedAlertv2(currentAlert.metadata.color, currentAlert) }
        if (!v2) { this.createAnimatedAlert(currentAlert.metadata.gif, `${currentAlert.details.name} (${currentAlert.details.type})`, currentAlert.details.locations) }
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
        alertQueue.pop()
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
        let colorScheme = this.storage.configurations.overlay_settings.color_scheme;
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