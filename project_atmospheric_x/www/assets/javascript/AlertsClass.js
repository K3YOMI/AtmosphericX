

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
    constructor(_library, _streaming=false) {
        this.library = _library
        this.storage = global
        this.name = `Alerts`
        this.library.PrintLog(`${this.name} Initialization`, `Successfully initialized ${this.name} module`)
        this.library.FetchStorage(`streaming`)
        this.storage.streaming = _streaming
        this.table_widget = this.storage.configurations.widget_settings.table
        document.addEventListener('onCacheUpdate', (event) => {
            this.table_widget = event.detail.configurations.widget_settings.table
        })
    }

    /**
      * @function SyncAlerts
      * @description Synchronizes alerts from a remote source and updates internal storage with new, non-duplicate entries.
      * 
      * @async
      * @returns {Promise<Array<Object>>} 
      * Resolves with the updated alert queue.
      */

    async SyncAlerts() {
        return new Promise(async (resolve, reject) => {
            this.library.FetchStorage(`alerts_queue`)
            this.library.FetchStorage(`alerts_latest_manual`)
            this.library.FetchStorage(`last_queries`)
            this.library.FetchStorage(`sound_alerts`)

            if (this.storage.manual.length != 0) { 
                let manual = this.storage.manual 
                if (manual.metadata.ignored != true) { 
                    let in_queue = this.storage.alerts_queue.find(x => x.details.name == manual.details.name &&  x.details.description == manual.details.description &&  x.details.type == manual.details.type &&  x.details.locations == manual.details.locations)
                    if (manual.details.name.includes(`Warning`)) { this.storage.warnings.push(manual) }
                    if (manual.details.name.includes(`Watch`)) { this.storage.watches.push(manual) }
                    if (manual.details.name.includes(`Tornado Emergency`) ||  manual.details.name.includes(`Flash Flood Emergency`) ||  manual.details.name.includes(`Particularly Dangerous Situation`)) { this.storage.warnings.push(manual); } 
                    if (in_queue == undefined && this.storage.alerts_latest_manual != manual.details.name + manual.details.description + manual.details.type) { 
                        this.storage.alerts_latest_manual = manual.details.name + manual.details.description + manual.details.type
                        this.storage.alerts_queue.push(manual)
                    }
                    this.storage.active.push(manual)
                }   
            }
            let alerts = this.storage.active
            if (alerts.length != 0) {
                for (let i = 0; i < alerts.length; i++) {
                    let alert = alerts[i]
                    if (alert.metadata.ignored == true) { continue }
                    if (this.storage.sound_alerts.includes(`${alert.details.name}-${alert.details.locations}`) && (alert.metadata.siren != false || alert.metadata.eas != false)) {
                        alert.metadata.siren = false
                        alert.metadata.eas = false
                    }
                    if ((alert.metadata.siren == true || alert.metadata.eas == true) && !this.storage.sound_alerts.includes(`${alert.details.name}-${alert.details.locations}`)) { this.storage.sound_alerts.push(`${alert.details.name}-${alert.details.locations}`) }
                    let duplicate = this.storage.last_queries.find(x => x.details.name == alert.details.name && x.details.description == alert.details.description && x.details.locations == alert.details.locations && x.details.issued == alert.details.issued && x.details.expires == alert.details.expires)    
                    let time = new Date().getTime() / 1000
                    let time_check = time - new Date(alert.details.issued).getTime() / 1000
                    if (time_check < 600 && duplicate == undefined) {
                        this.storage.alerts_queue.push(alert)
                        this.storage.last_queries.push(alert)
                    } else { 
                        if (duplicate && time_check > 1600) { 
                            let index = this.storage.last_queries.indexOf(duplicate)
                            if (index > -1) {
                                this.storage.last_queries.splice(index, 1)
                            }
                        }
                    }
                }
            }
            resolve(this.storage.alerts_queue)
        })
    }

    /**
      * @function _SendAlertByGif
      * @description Displays an alert using a GIF animation with a title and subtitle in the UI.
      * 
      * @async
      * @param {string} [_gif=""] - The URL of the GIF to display.
      * @param {string} [_title=""] - The alert title text.
      * @param {string} [_subtitle=""] - The alert subtitle/description text.
      * 
      * @returns {Promise<void>}
      */

    async _SendAlertByGif(_gif=``, _title=``, _subtitle=``) {
        this.library.FetchStorage(`alerts_total`)
        if (this.storage.streaming) {
            this.storage.alerts_total++
            let max_description_size = this.storage.configurations.widget_settings.alert.max_text_length
            let animation_style = this.storage.configurations.widget_settings.alert.animation_style
            let documentment_notification = document.getElementById(`alert_notification`)
            let notification_title = document.getElementById(`alert_title`)
            let notification_subtitle = document.getElementById(`alert_description`)
            documentment_notification.style.display = `block`
            documentment_notification.src = `${_gif}?=${this.storage.alerts_total}`
            if (_subtitle.length > max_description_size) { _subtitle = _subtitle.substring(0, max_description_size) + `...` }
            notification_subtitle.style = animation_style
            notification_title.style = animation_style
            setTimeout(() => {documentment_notification.style.display = `none`}, 6.8 * 1000)
            setTimeout(() => {notification_title.textContent = _title; notification_subtitle.textContent = _subtitle}, 500)
            setTimeout(() => {notification_title.textContent = ``; notification_subtitle.textContent = ``; notification_subtitle.style = ``; notification_title.style = ``;}, 5.9 * 1000)
        }
        setTimeout(() => {this.storage.query_running = false}, 6.8 * 1000)
    }

    /**
      * @function QueryAlertsByQueue
      * @description Processes and plays the next alert in the provided queue with associated media and UI effects.
      * 
      * @async
      * @param {Array<Object>} _queue - An array of alert objects to be processed.
      * 
      * @returns {Promise<void>}
      */

    async QueryAlertsByQueue(_queue) {
        return new Promise(async (resolve, reject) => {
            this.library.FetchStorage(`query_running`)
            if (_queue.length == 0) { resolve(); return }
            if (this.storage.query_running == true) { resolve(); return } else { this.storage.query_running = true }
            let next = _queue.length - 1
            let alert = _queue[next]
            this._SendAlertByGif(alert.metadata.gif, `${alert.details.name} (${alert.details.type})`, alert.details.locations)
            if (alert.metadata.autobeep) {
                this.library.PlayAudio(this.storage.configurations.tone_sounds.beep, false)
                if (!alert.metadata.onlyBeep) {
                    await this.library.CreateTimeout(1300) 
                    this.library.PlayAudio(alert.metadata.audio, false)
                }
            } else { 
                this.library.PlayAudio(alert.metadata.audio, false)
            }
            if (alert.metadata.eas || alert.metadata.siren) {
                await this.library.CreateTimeout(3800)
                this.library.PlayAudio(alert.metadata.eas ? this.storage.configurations.tone_sounds.eas : this.storage.configurations.tone_sounds.siren, false) 
            }
            _queue.pop()
            resolve()
        })
    }

    /**
      * @function TriggerDynamicColors
      * @description Dynamically updates UI element colors based on the most prominent active alert type.
      * 
      * @async
      * @returns {Promise<void>}
      */

    async TriggerDynamicColors() {
        let light = document.getElementsByClassName(`p_boxlight`)
        let dark = document.getElementsByClassName(`p_boxdark`)
        let color_scheme = this.storage.configurations.overlay_settings.color_scheme;
        let alerts_in_scheme = color_scheme.filter(type => { return this.storage.active.some(alert => alert.details.name.includes(type.type));});    
        if (this.storage.active.length == 0 || alerts_in_scheme.length == 0) {
            let default_c = color_scheme.find(type => {return type.type == `Default`})
            for (let x = 0; x < light.length; x++){
                light[x].style.backgroundColor = default_c.color.light
            }
            for (let x = 0; x < dark.length; x++){
                dark[x].style.backgroundColor = default_c.color.dark
            }
            return
        }
        color_scheme.forEach((color) => { color.count = this.storage.active.filter(x => x.details.name.includes(color.type)).length});
        color_scheme.find(type => {return type.count > 0; }) || types[types.length - 1];
        let highest = color_scheme.find(type => {return type.count > 0; }) || color_scheme[color_scheme.length - 1];  
        for (let x = 0; x < light.length; x++){
            light[x].style.backgroundColor = highest.color.light
        }
        for (let x = 0; x < dark.length; x++){
            dark[x].style.backgroundColor = highest.color.dark
        }
    }

    /**
      * @function TriggerAlertTable
      * @description Populates a table element with active alerts, limited by configured display settings.
      * 
      * @async
      * @param {string} _id - The DOM element ID of the table to populate.
      * 
      * @returns {Promise<void>}
      */

    async TriggerAlertTable(_id) {
        let doc = document.getElementById(_id)
        doc.innerHTML = `<tr><th>Type<hr></th><th>Location<hr></th></tr>`;
        this.storage.active.sort((a, b) => new Date(b.issued) - new Date(a.issued));
        for (let i = 0; i < this.storage.active.length; i++) {
            if (i === this.table_widget.max_alerts_shown) break;
            let alert = this.storage.active[i];
            let table = doc;
            let row = table.insertRow(-1);
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            cell1.innerHTML = alert.details.name.substring(0, this.table_widget.max_char_per_row);
            cell2.innerHTML = alert.details.locations.substring(0, this.table_widget.max_char_per_row);
        }
        if (this.storage.active.length > this.table_widget.max_alerts_shown) {
            let table = doc;
            let row = table.insertRow(-1);
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            cell1.innerHTML = "...";
            cell2.innerHTML = `+${this.storage.active.length - this.table_widget.max_alerts_shown} more`;
        }
    }
}