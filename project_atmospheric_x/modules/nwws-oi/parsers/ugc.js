
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


class UGCParsing { 
    constructor() {
        this.name = `UGCParsing`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function getUGC
      * @description Get the UGC from the message. This will search for the UGC in the message and return it as an object.
      * 
      * @param {string} message - The message to search in
      */

    getUGC = async function(message) {
        let header = this.getHeader(message)
        let zones = this.getZones(header)
        let locations = await this.getLocations(zones)
        let ugc = {}
        if (zones.length > 0) {
            ugc.zones = zones 
            ugc.locations = locations
            return ugc
        }
        return null
    }

    /**
      * @function getLocations
      * @description Get the locations from the zones. This will search for the locations in the database and return them as an array.
      * 
      * @param {array} zones - The zones to search in
      */

    getLocations = async function(zones) {
        let locations = [];
        for (let i = 0; i < zones.length; i++) {
            let id = zones[i].trim();
            let located = await loader.modules.database.runQuery(`SELECT location FROM shapefiles WHERE id = ?`, [id])
            if (located.length > 0) { locations.push(located[0].location); }
            if (located.length === 0) { locations.push(id); }
        }
        locations = [...new Set(locations)];
        return locations
    }

    /**
      * @function getCoordinates
      * @description Get the coordinates from the zones. This will search for the coordinates in the database and return them as an array.\
      * 
      * @param {array} zones - The zones to search in
      */

    getCoordinates = async function(zones) {
        let coordinates = [];
        for (let i = 0; i < zones.length; i++) {
            let id = zones[i].trim();
            let located = await loader.modules.database.runQuery(`SELECT geometry FROM shapefiles WHERE id = ?`, [id])
            if (located.length > 0) {
                let geometry = JSON.parse(located[0].geometry);
                if (geometry && geometry.type === 'Polygon') {
                    coordinates = coordinates.concat(geometry.coordinates[0].map(coord => [coord[0], coord[1]]));
                    break;
                }
            }
        }
        return coordinates
    }

    /**
      * @function getZones
      * @description Get the zones from the header. This will search for the zones in the header and return them as an array.
      * 
      * @param {string} header - The header to search in
      */

    getZones = function(header) {
        let ugcSplit = header.split(`-`);
        let zones = [];
        let state = ugcSplit[0].substring(0, 2);
        let format = ugcSplit[0].substring(2, 3);
        for (let i = 0; i < ugcSplit.length; i++) {
            if (/^[A-Z]/.test(ugcSplit[i])) { 
                state = ugcSplit[i].substring(0, 2);
                if (ugcSplit[i].includes('>')) {
                    let [start, end] = ugcSplit[i].split('>');
                    let startNum = parseInt(start.substring(3), 10);
                    let endNum = parseInt(end, 10);
                    for (let j = startNum; j <= endNum; j++) {
                        zones.push(`${state}${format}${j.toString().padStart(3, '0')}`);
                    }
                } else {
                    zones.push(ugcSplit[i]); 
                }
                continue; 
            }
            if (ugcSplit[i].includes('>')) {
                let [start, end] = ugcSplit[i].split('>');
                let startNum = parseInt(start, 10);
                let endNum = parseInt(end, 10);
                for (let j = startNum; j <= endNum; j++) {
                    zones.push(`${state}${format}${j.toString().padStart(3, '0')}`);
                }
            } else {
                zones.push(`${state}${format}${ugcSplit[i]}`);
            }
        }
        zones = zones.filter(item => item !== '');
        return zones 
    }

    /**
      * @function getHeader
      * @description Get the header from the message. This will search for the header in the message and return it as a string.
      * 
      * @param {string} message - The message to search in
      */

    getHeader = function(message) { 
        let start = message.search(new RegExp(loader.definitions.RegExp_UGCStart, "gimu"));
        let end = message.substring(start).search(new RegExp(loader.definitions.RegExp_UGCEnd, "gimu"));
        let full = message.substring(start, start + end).replace(/\s+/g, '').slice(0, -1)
        return full
    }
}


module.exports = UGCParsing;