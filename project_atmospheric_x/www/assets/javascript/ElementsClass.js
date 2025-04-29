

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
  * @class Elements
  * @description The `Elements` class provides functionality to interact with and update various 
  * UI elements related to alerts, notifications, headers, and SPC (Storm Prediction Center) data. 
  * It handles dynamic changes to the page content by interacting with the DOM based on the application's data stored in `this.storage`.
  */

class Elements { 
    constructor(_library) {
        this.library = _library
        this.storage = global
        this.name = `ElementsClass`
        this.library.PrintLog(`${this.name} Initialization`, `Successfully initialized ${this.name} module`)
        this.notification_widget = this.storage.configurations.widget_settings.notification
        this.header_widget = this.storage.configurations.widget_settings.header
        this.spc_widget = this.storage.configurations.spc_outlooks
        document.addEventListener('onCacheUpdate', (event) => {
            this.notification_widget = event.detail.configurations.widget_settings.notification
            this.header_widget = event.detail.configurations.widget_settings.header
            this.spc_widget = event.detail.configurations.spc_outlooks
        })
    }

    /**
      * @function UpdateHeaders
      * @description Updates the header of the application based on the current settings, including rotating through active alerts when enabled.
      * 
      * @async
      * @param {string} _id - The ID of the DOM element to update with the header content.
      * @returns {Promise<void>}
      */

    async UpdateHeaders(_id) {
        let max_header_len = this.header_widget.max_header_length
        if (this.storage.header == ``) {
            let alert_rotate = this.header_widget.rotate_through_alerts 
            let rng = Math.floor(Math.random() * 100)
            if (rng < 75) {
                if (alert_rotate.enabled) {
                    let find_alert_types = alert_rotate.cycled_types
                    let active_alerts = this.storage.active.filter(alert => find_alert_types.includes(alert.details.name));
                    if (active_alerts.length == 0) { 
                        document.getElementById(_id).innerHTML = `Active Warnings: ${this.storage.warnings.length}<br>Active Watches: ${this.storage.watches.length}` 
                        return
                    }
                    let alert = active_alerts[Math.floor(Math.random() * active_alerts.length)];
                    let alert_name = alert.details.name
                    let total = active_alerts.filter(alert => alert.details.name == alert_name).length
                    let string = `${alert_name}(s): ${total} active`
                    if (string.length > max_header_len) {
                        string = string.substring(0, max_header_len) + `...`
                    }
                    document.getElementById(_id).innerHTML = string
                    return
                }
            }
            document.getElementById(_id).innerHTML = `Active Warnings: ${this.storage.warnings.length}<br>Active Watches: ${this.storage.watches.length}` 
        } else { 
            if (this.storage.header.length > max_header_len) {
                this.storage.header = this.storage.header.substring(0, max_header_len) + `...`
            }
            document.getElementById(_id).innerHTML = this.storage.header
        }
    }

    /**
      * @function UpdateNotification
      * @description Updates the notification widget with a title and message. If there are no broadcasts, the notification widget will be hidden.
      * 
      * @async
      * @param {string} _id - The ID of the DOM element to display or hide the notification widget.
      * @param {string} _title_id - The ID of the DOM element to update with the broadcast title.
      * @param {string} _message_id - The ID of the DOM element to update with the broadcast message.
      * @returns {Promise<void>}
      */

    async UpdateNotification(_id, _title_id, _message_id) {
        if (this.storage.broadcasts.title != undefined && this.storage.broadcasts.message != undefined) {
            let max_title_len = this.notification_widget.max_title_length
            let max_message_len = this.notification_widget.max_text_length
            if (this.storage.broadcasts.title.length > max_title_len) {
                this.storage.broadcasts.title = this.storage.broadcasts.title.substring(0, max_title_len) + `...`
            }
            if (this.storage.broadcasts.message.length > max_message_len) {
                this.storage.broadcasts.message = this.storage.broadcasts.message.substring(0, max_message_len) + `...`
            }
            document.getElementById(_id).style.display = `block`
            document.getElementById(_title_id).innerHTML = this.storage.broadcasts.title
            document.getElementById(_message_id).innerHTML = this.storage.broadcasts.message
        } else {
            document.getElementById(_id).style.display = `none`
        }
    }
    
    /**
      * @function UpdateSPC
      * @description Updates the SPC widget with a new image and associated title from the SPC outlook configuration.
      * 
      * @async
      * @param {string} _img - The ID of the DOM element to update with the new image source.
      * @param {string} _text - The ID of the DOM element to update with the new title.
      * @returns {Promise<void>}
      */

    async UpdateSPC(_img, _text) {
        if (this.storage.index == undefined) { this.storage.index = 0 }
        this.storage.index++
        this.spc_widget.sort((a, b) => a.day - b.day)
        this.storage.index = this.storage.index >= this.spc_widget.length ? 0 : this.storage.index;
        let model = this.spc_widget[this.storage.index];
        document.getElementById(_img).src = model.source;
        document.getElementById(_text).innerHTML = model.title;
    }

    /**
      * @function RandomAlertUpdate
      * @description Updates the alert element with a random active alert, animating the transition between alerts if multiple active alerts are present.
      * 
      * @async
      * @param {string} _id - The ID of the DOM element to update with the alert text.
      * @param {string} _text - The text to display in the alert.
      * @param {number} _max_length - The maximum length for the alert text.
      * @param {string} _anim_start - The name of the animation to start when updating the alert.
      * @param {string} _anim_end - The name of the animation to end with when updating the alert.
      * @returns {Promise<void>}
      */

    async RandomAlertUpdate(_id, _text, _max_length, _anim_start, _anim_end) {
        if (_text.length > _max_length) { _text = _text.substring(0, _max_length) + `...` }
        if (this.storage.active.length == 0) { document.getElementById(_id).innerHTML = `No Active Alerts`; return }
        if (this.storage.active.length == 1) { document.getElementById(_id).innerHTML = _text; return }
        document.getElementById(_id).style.animation = `${_anim_start} 0.3s linear forwards`;
        await this.library.CreateTimeout(500)
        document.getElementById(_id).style.animation = `${_anim_end} 0.3s linear forwards`;
        document.getElementById(_id).innerHTML = _text;
    }



    /**
     * @function Watchdog
     * @description Updates the alert count for a specific alert type in the UI.
     * 
     * @async
     * @param {string} _text - The ID of the DOM element to update with the alert count.
     * @param {string} _parameter - The array of alert types to count.
     * @returns {Promise<void>}
     */

    async Watchdog(_text, _parameter) {
        let total = 0
        let name = _parameter[0].replace(/%20/g, ` `)
        for (let i = 0; i < _parameter.length; i++) {
            let param = _parameter[i]
            param = param.replace(/%20/g, ` `)
            let active_alerts = this.storage.active.filter(alert => alert.details.name.includes(param));
            total += active_alerts.length
        }
        document.getElementById(_text).innerHTML = `${name}(s): ${total} active`
    }
}