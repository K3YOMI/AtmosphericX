

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
    constructor(library) {
        this.library = library
        this.storage = this.library.storage
        this.name = `ElementsClass`
        this.library.createOutput(`${this.name} Initialization`, `Successfully initialized ${this.name} module`)
        document.addEventListener('onCacheUpdate', (event) => {})
    }

    /**
      * @function updateHeaders
      * @description Updates the header widget text based on the current active alerts or custom header broadcast.
      * 
      * @param {string} id - The ID of the DOM element to update with the header text.
      */

    updateHeaders = function(id) {
        let docHeader = document.getElementById(id)
        let configurations = this.storage.configurations.widget_settings.header
        let maxHeaderLength = configurations.max_header_length
        let rotateAlerts = configurations.rotate_through_alerts
        if (this.storage.header == ``) { 
            if (rotateAlerts.enabled) { 
                let getCycled = rotateAlerts.cycled_types
                let getActiveAlerts = this.storage.active.filter(alert => getCycled.includes(alert.details.name))
                if (getActiveAlerts.length == 0) {
                    docHeader.innerHTML = `No Active Cycled Alerts`
                    return 
                }
                let getRandomAlert = getActiveAlerts[Math.floor(Math.random() * getActiveAlerts.length)]
                let getAlertName = getRandomAlert.details.name
                let getAlertTotal = this.storage.active.filter(alert => alert.details.name == getAlertName).length
                let tempString = `${getAlertName}: (x${getAlertTotal})`
                if (tempString.length > maxHeaderLength) {
                    tempString = tempString.substring(0, maxHeaderLength) + `...`
                }
                docHeader.innerHTML = tempString
                return
            }
            docHeader.innerHTML = `${this.storage.active.length} Active Alerts`
        } else {
            if (this.storage.header.length > maxHeaderLength) {
                this.storage.header = this.storage.header.substring(0, maxHeaderLength) + `...`
            }
            docHeader.innerHTML = this.storage.header
        }
    }

    /**
      * @function updateNotification
      * @description Updates the notification widget with a title and message. If there are no notification, the notification widget will be hidden.
      * 
      * @param {string} id - The ID of the DOM element to update with the notification title and message.
      * @param {string} docTitle - The ID of the DOM element to update with the notification title.
      * @param {string} docBody - The ID of the DOM element to update with the notification message.
      */

    updateNotification = function(id, headerDom, bodyDom) {
        let docHolder = document.getElementById(id)
        let docTitle = document.getElementById(headerDom)
        let docBody = document.getElementById(bodyDom)
        if (this.storage.notification.title != undefined && this.storage.notification.message != undefined) {
            let maxTitleLength = this.storage.configurations.widget_settings.notification.max_title_length
            let maxMessageLength = this.storage.configurations.widget_settings.notification.max_text_length
            if (this.storage.notification.title.length > maxTitleLength) {
                this.storage.notification.title = this.storage.notification.title.substring(0, maxTitleLength) + `...`
            }
            if (this.storage.notification.message.length > maxMessageLength) {
                this.storage.notification.message = this.storage.notification.message.substring(0, maxMessageLength) + `...`
            }
            docHolder.style.display = `block`
            docTitle.innerHTML = this.storage.notification.title
            docBody.innerHTML = this.storage.notification.message
        } else { 
            docHolder.style.display = `none`
        }
    }
    
    /**
      * @function updateSPC
      * @description Updates the SPC widget with a new image and associated title from the SPC outlook configuration.
      * 
      * @param {string} domImage - The ID of the DOM element to update with the SPC image.
      * @param {string} domText - The ID of the DOM element to update with the SPC title.
      */

    updateSPC = function(domImage, domText) {
        if (this.storage.index == undefined) { this.storage.index = 0 }
        this.storage.index++
        this.storage.configurations.spc_outlooks.sort((a, b) => a.day - b.day)
        this.storage.index = this.storage.index >= this.storage.configurations.spc_outlooks.length ? 0 : this.storage.index;
        let model = this.storage.configurations.spc_outlooks[this.storage.index];
        document.getElementById(domImage).src = model.source;
        document.getElementById(domText).innerHTML = model.title;
    }

    /**
      * @function randomAlertUpdate
      * @description Updates the alert element with a random active alert, animating the transition between alerts if multiple active alerts are present.
      * 
      * @param {string} domId - The ID of the DOM element to update with the alert message.
      * @param {string} messageText - The message text to display in the alert element.
      * @param {number} maxLength - The maximum length of the message text before truncation.
      * @param {string} startAnimation - The CSS animation class to apply at the start of the transition.
      * @param {string} endAnimation - The CSS animation class to apply at the end of the transition.
      */

    randomAlertUpdate = async function(domId, messageText, maxLength, startAnimation, endAnimation) {
        if (messageText.length > maxLength) { messageText = messageText.substring(0, maxLength) + `...`}
        if (this.storage.active.length == 0) { document.getElementById(domId).innerHTML = `No active alerts`; return }
        if (this.storage.active.length == 1) { document.getElementById(domId).innerHTML = messageText; return }
        document.getElementById(domId).style.animation = `${startAnimation} 0.3s linear forwards`;
        await this.library.createTimeout(500)
        document.getElementById(domId).innerHTML = messageText;
        document.getElementById(domId).style.animation = `${endAnimation} 0.3s linear forwards`;
    }



    /**
     * @function watchDog
     * @description Updates the alert count for a specific alert type in the UI.
     * 
     * @param {string} domId - The ID of the DOM element to update with the alert count.
     * @param {Array} urlParamter - An array of alert types to count.
     */

    watchDog = function(domId, urlParamter) {
        let total = 0
        let name = urlParamter[0].replace(/%20/g, ` `)
        for (let i = 0; i < urlParamter.length; i++) {
            let param = urlParamter[i]
            param = param.replace(/%20/g, ` `)
            let activeAlerts = this.storage.active.filter(alert => alert.details.name.includes(param));
            total += activeAlerts.length
        }
        document.getElementById(domId).innerHTML = `${name}(s): ${total} active`
    }
}