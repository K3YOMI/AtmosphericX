
/*
                                            _               _     __   __
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


let loader = require(`../../../loader.js`)


class VTECParsing { 
    constructor() {
        this.name = `VTECParsing`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function getVTEC
      * @description Get the VTEC from the message. This will search for the VTEC in the message and return it as an object.
      * Additionally will get the WMO if found...
      * 
      * @param {string} message - The message to search in
      */

    getVTEC = async function(message) {
        let match = message.match(loader.definitions.RegExp_VTEC)
        let vtec = {}
        if (match != null) {
            let splitVTEC = match[0].split(`.`)
            let vtecDates = splitVTEC[6].split(`-`)
            vtec.trackingId = this.getTrackingId(splitVTEC)
            vtec.eventName = this.getEventName(splitVTEC)
            vtec.eventSignificance = this.getEventSignificance(splitVTEC)
            vtec.eventStatus = this.getEventStatus(splitVTEC)
            vtec.expires = this.getEventExpiration(vtecDates)
            vtec.wmo = message.match(new RegExp(loader.definitions.RegExp_WMO, "gimu"));
            return vtec
        } 
        return null
    }

    /**
      * @function getTrackingId
      * @description Get the tracking ID from the VTEC. This will be used to identify the alert.
      * 
      * @param {array} vtec - The VTEC to search in
      */

    getTrackingId = function(vtec) {
        return `${vtec[2]}-${vtec[3]}-${vtec[4]}-${vtec[5]}`
    }

    /**
      * @function getEventName
      * @description Get the event name from the VTEC. This will be used to identify the alert.
      * 
      * @param {array} vtec - The VTEC to search in
      */

    getEventName = function(vtec) {
        return loader.definitions.eventCodes[vtec[3]]
    }

    /**
      * @function getEventSignificance
      * @description Get the event significance from the VTEC. This will be used to identify the alert.
      * 
      * @param {array} vtec - The VTEC to search in
      */    

    getEventSignificance = function(vtec) {
        return loader.definitions.eventTypes[vtec[4]]
    }

    /**
      * @function getEventStatus
      * @description Get the event status from the VTEC. This will be used to identify the alert.
      * 
      * @param {array} vtec - The VTEC to search in
      */  

    getEventStatus = function(vtec) {
        return loader.definitions.statusSignatures[vtec[1]]
    }

    /**
      * @function getEventExpiration
      * @description Get the event expiration from the VTEC. This will be used to identify the alert.
      * 
      * @param {array} vtecDates - The VTEC dates
      */  

    getEventExpiration = function(vtecDates) {
        if (vtecDates[1] == `000000T0000Z`) { return `Invalid Date Format`; }
        let expires = `${new Date().getFullYear().toString().substring(0, 2)}${vtecDates[1].substring(0, 2)}-${vtecDates[1].substring(2, 4)}-${vtecDates[1].substring(4, 6)}T${vtecDates[1].substring(7, 9)}:${vtecDates[1].substring(9, 11)}:00`;
        let local = new Date(new Date(expires).getTime() - 4 * 60 * 60000);
        let pad = n => String(n).padStart(2, '0');
        return `${local.getFullYear()}-${pad(local.getMonth()+1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}:00.000-04:00`
    }
}


module.exports = VTECParsing;