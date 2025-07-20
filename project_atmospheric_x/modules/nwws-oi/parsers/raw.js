

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
                let start = lines[i].indexOf(string) + string.length, result = lines[i].substring(start).trim();
                for (let j = 0; j < removeIfExists.length; j++) result = result.replace(removeIfExists[j], '');
                return result.replace(string, '').replace(/^\s+|\s+$/g, '').replace('<', '').trim();
            }
        }
        return null;
    }

    /**
      * @function getOfficeName
      * @description Extracts the office name from the message by searching for predefined strings.
      * 
      * @param {string} message - The message to search in
      * @returns {string|null} - The extracted office name or null if not found
      */

    getOfficeName = function(message) {
        let officeName = this.getStringByLine(message, `National Weather Service `) || this.getStringByLine(message, `NWS STORM PREDICTION CENTER `);
        return officeName ? officeName : null;
    }

    /**
     * @function getPolygonCoordinatesByText
     * @description Get the polygon coordinates from the message. This will search for the string "LAT...LON" and return the coordinates as an array of arrays.
     * 
     * @param {string} message - The message to search in
     */

    getPolygonCoordinatesByText = function(message) {
        let coordinates = [], latLon = message.match(/LAT\.{3}LON\s+([\d\s]+)/i);
        if (latLon && latLon[1]) {
            let coordStrings = latLon[1].replace(/\n/g, ' ').trim().split(/\s+/);
            for (let i = 0; i < coordStrings.length - 1; i += 2) {
                let lat = parseFloat(coordStrings[i]) / 100, long = -1 * (parseFloat(coordStrings[i + 1]) / 100);
                if (!isNaN(lat) && !isNaN(long)) coordinates.push([long, lat]);
            }
            if (coordinates.length > 2) coordinates.push(coordinates[0]);
        }
        return coordinates;
    }
}


module.exports = RawParsing;