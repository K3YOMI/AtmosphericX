

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


class RawParsing { 
    constructor() {
        this.name = `RawParsing`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function getStringByLine
      * @description Get a string by line from the message and will replace the searched string with an empty string.
      * 
      * @param {string} message - The message to search in
      * @param {string} string - The string to search for and replace (if needed)
      */

    getStringByLine = function(message, string, removeIfExists=[]) {
        let lines = message.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(string)) {
                let start = lines[i].indexOf(string) + string.length;
                let end = lines[i].length;
                let result = lines[i].substring(start, end);
                for (let j = 0; j < removeIfExists.length; j++) { result = result.replace(removeIfExists[j], '');}
                return result.replace(string, '').replace(/^\s+|\s+$/g, '').replace(`<`, '').trim()
            }  
        }
        return null
    }

    /**
      * @function getOfficeName
      * @description Get the office name from the message. This will search for the string "National Weather Service" or "NWS STORM PREDICTION CENTER" and return the string after it.
      * 
      * @param {string} message - The message to search in
      */

    getOfficeName = function(message) {
        let v1 = this.getStringByLine(message, `National Weather Service `) 
        let v2 = this.getStringByLine(message, `NWS STORM PREDICTION CENTER `)
        if (v1) { return v1 }
        if (v2) { return v2 }
        return null
    }

    /**
     * @function getPolygonCoordinatesByText
     * @description Get the polygon coordinates from the message. This will search for the string "LAT...LON" and return the coordinates as an array of arrays.
     * 
     * @param {string} message - The message to search in
     */

    getPolygonCoordinatesByText = function(message) {
        let coordinates = [];
        let latLon = message.match(/LAT\.{3}LON\s+([\d\s]+)/i);
        if (latLon && latLon[1]) {
            let coordStrings = latLon[1].replace(/\n/g, ' ').trim().split(/\s+/);
            for (let i = 0; i < coordStrings.length - 1; i += 2) {
                let lat = parseFloat(coordStrings[i]) / 100;
                let long = -1 * (parseFloat(coordStrings[i + 1]) / 100);
                if (!isNaN(lat) && !isNaN(long)) { coordinates.push([long, lat]);}
            }
            if (coordinates.length > 2) { coordinates.push(coordinates[0]);}
        }
        return coordinates;
    }
}


module.exports = RawParsing;