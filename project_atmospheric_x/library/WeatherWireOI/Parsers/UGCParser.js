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

let LOAD = require(`../../../loader.js`)

/**
  * @class UGCParser
  * @description A class responsible for parsing User Generated Content (UGC) messages. This parser is designed to extract relevant information from UGC messages,
  * such as zones, locations, and other geographic data for use in weather alerts and other related systems.
  * 
  * @param {string} [_msg=""] - The UGC message to be parsed.
  * @param {Object} [_metadata={}] - Metadata used for parsing the UGC message, such as regular expressions for identifying specific parts of the message.
  */ 

class UGCParser {
    constructor(_msg=``, _metadata={}) {
        this.author = `k3yomi@GitHub`
        this.name = `UGCParser`
        this.production = true
        this.message = _msg
        this.metadata = _metadata
        this.ugc = {}
    }

    /**
      * @method ParseUGC
      * @description Parses the UGC (Unified Geographic Code) from the message by extracting header information, zones, and locations.
      * This method retrieves zone and location data using the header, and then resolves with the parsed UGC data.
      * If no zones are found, it resolves with `null`.
      * 
      * @async
      * @returns {Promise<object|null>} Resolves with an object containing `zones` and `locations` if found, otherwise resolves with `null`.
      */

    async ParseUGC() {
        return new Promise(async (resolve, reject) => {
            let header = await this.GetHeader()
            let zones = await LOAD.Library.ShapefileManager.GetZones(header)
            let locations = await LOAD.Library.ShapefileManager.GetLocations(zones)
            if (zones.length > 0) {
                this.ugc.zones = zones
                this.ugc.locations = locations
                resolve(this.ugc)
            }
            resolve(null)
        })
    }

    /**
      * @method GetHeader
      * @description Extracts the header from the message by searching for the start and end patterns defined in the metadata. 
      * It uses regular expressions to locate the header content, trims spaces, and removes the last character before returning the result.
      * 
      * @async
      * @returns {Promise<string>} Resolves with the extracted header as a string. If the start or end patterns are not found, it may return an empty string.
      */

    async GetHeader() {
        let start = this.message.search(new RegExp(this.metadata.ugc_start_regexp, "gimu"));
        let end = this.message.substring(start).search(new RegExp(this.metadata.ugc_end_regexp, "gimu"));
        let full = this.message.substring(start, start + end).replace(/\s+/g, '').slice(0, -1)
        return full
    }

    /**
      * @method GetStates
      * @description Extracts and returns a list of unique states from the locations defined in the UGC (User Generated Content).
      * The method iterates through the `locations` array, splits each location by a comma, and extracts the state. 
      * Duplicate states are filtered out to ensure only unique states are returned.
      * 
      * @async
      * @returns {Promise<string[]>} Resolves with an array of unique state names found in the locations. 
      * If no states are found, it returns an empty array.
      */

    async GetStates() {
        let states = []
        for (let i = 0; i < this.ugc.locations.length; i++) {
            let location = this.ugc.locations[i]
            if (location.includes(`,`)) {
                let state = location.split(`,`)[1].trim()
                if (!states.includes(state)) {
                    states.push(state)
                }
            }
        }
        return states
    }
}

module.exports = UGCParser