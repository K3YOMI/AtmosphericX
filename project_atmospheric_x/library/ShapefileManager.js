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
  * @class ShapefileManager
  * @description Manages shapefile operations including reading shapefiles, extracting geographic data,
  * and processing zone and location identifiers. Provides methods for creating zone maps, retrieving
  * coordinates, and parsing UGC-style headers. Utilizes asynchronous operations for file handling and
  * large datasets.
  */

class ShapefileManager {
    constructor() {
        this.author = `k3yomi@GitHub`
        this.name = `ShapefileManager`
        this.production = true
        this.areas = []
        Hooks.PrintLog(`${this.name}`, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function CreateZoneMap
      * @description Asynchronously processes a list of shapefiles to build a geographic zone map.
      * For each shapefile, it reads features and extracts location data such as county,
      * zone, or state identifiers, then compiles these into an internal `areas` array.
      * Handles various property types including FIPS, STATE, FULLSTAID, and defaults to 
      * basic ID and NAME if none are present.
      *
      * @async
      * @param {Array<Object>} [_shapefiles=[]] - An array of shapefile descriptors to be processed.
      * @param {string} _shapefiles[].file - The filename of the shapefile.
      * @param {string} _shapefiles[].id - A type identifier to help construct the zone ID.
      * @returns {Promise<Array<Object>>} A promise that resolves to the populated `areas` array,
      * each containing an `id`, `location`, and `geometry`.
      */

    async CreateZoneMap(_shapefiles=[]) {
        return new Promise(async (resolve, reject) => {
            let shape_files = _shapefiles
            for (let i = 0; i < shape_files.length; i++) {
                let file = shape_files[i].file
                let type = shape_files[i].id
                let filepath = `../storage/shapefiles/${file}`
                let read = await shapefile.read(filepath, filepath)
                let features = read.features
                for (let a = 0; a < features.length; a++) {
                    let properties = features[a].properties
                    let fips_exists = properties.FIPS != undefined
                    let state_exists = properties.STATE != undefined
                    let full_state_id_exists = properties.FULLSTAID != undefined
                    if (fips_exists) {
                        let t = `${properties.STATE}${type}${properties.FIPS.substring(2)}`
                        let n = `${properties.COUNTYNAME}, ${properties.STATE}`
                        this.areas.push({ id: t, location: n, geometry: features[a].geometry })
                    } else if (state_exists) {
                        let t = `${properties.STATE}${type}${properties.ZONE}`
                        let n = `${properties.NAME}, ${properties.STATE}`
                        this.areas.push({ id: t, location: n, geometry: features[a].geometry })
                    } else if (full_state_id_exists) {
                        let t = `${properties.ST}${type}-NoZone`
                        let n = `${properties.NAME}, ${properties.STATE}`
                        this.areas.push({ id: t, location: n, geometry: features[a].geometry })
                    } else {
                        let t = properties.ID 
                        let n = properties.NAME
                        this.areas.push({ id: t, location: n, geometry: [] })
                    }
                }
            }
            resolve(this.areas)
            Hooks.PrintLog(`${this.name}`, `Successfully loaded ${this.areas.length} shapefiles`)
        })
    }

    /**
      * @function GetCoordinates
      * @description Asynchronously retrieves the coordinates for a given list of UGC (Universal Geographic Code) identifiers.
      * Searches through the internal `areas` array and extracts the coordinates of the first matching polygon.
      * Only the first matching polygon's coordinates are returned. Coordinates are returned in [longitude, latitude] format.
      * 
      * @async
      * @param {Array<string>} [_ugc=[]] - An array of UGC zone identifiers to match against the `areas` list.
      * @returns {Promise<Array<Array<number>>>} A promise that resolves to an array of coordinates in [lon, lat] pairs,
      * corresponding to the matched polygon's outer ring.
      **/

    async GetCoordinates(_ugc=[]) {
        return new Promise(async (resolve, reject) => {
            let ugc = _ugc.map(item => item.trim());
            let coords = [];
            for (let i = 0; i < this.areas.length; i++) {
                let id = this.areas[i].id;
                let geo = this.areas[i].geometry;
                if (ugc.includes(id)) { 
                    if (geo && geo.type === "Polygon") {
                        coords = coords.concat(geo.coordinates[0].map(coord => [coord[0], coord[1]]));
                        break;
                    }
                }
            }
            resolve(coords);
        });
    }

    /**
      * @function GetLocations
      * @description Asynchronously retrieves unique location names for a given list of UGC (Universal Geographic Code) identifiers.
      * Iterates through the internal `areas` array to find matches and compiles a deduplicated list of location names.
      *
      * @async
      * @param {Array<string>} [_ugc=[]] - An array of UGC zone identifiers to match against the `areas` list.
      * @returns {Promise<Array<string>>} A promise that resolves to an array of unique location names corresponding to the matched zones.
      */

    async GetLocations(_ugc=[]) {
        return new Promise(async (resolve, reject) => {
            let ugc = _ugc.map(item => item.trim());
            let locations = [];
            for (let i = 0; i < this.areas.length; i++) {
                let id = this.areas[i].id;
                let location = this.areas[i].location;
                if (ugc.includes(id)) { locations.push(location) }
            }
            locations = [...new Set(locations)];
            resolve(locations);
        });
    }

    /**
      * @function GetZones
      * @description Asynchronously parses a UGC-style header string and extracts all individual zone identifiers.
      * Supports single zones, zone ranges using the `>` symbol, and handles switching state prefixes dynamically.
      *
      * @async
      * @param {string} [_header=`INC129-KYC225-231015-`] - The UGC header string containing one or more zone identifiers.
      * @returns {Promise<Array<string>>} A promise that resolves to an array of expanded and normalized zone identifiers.
      */

    async GetZones(_header = `INC129-KYC225-231015-`) {
        return new Promise(async (resolve, reject) => {
            let header = _header;
            let ugc_s = header.split(`-`);
            let zones = [];
            let state = ugc_s[0].substring(0, 2);
            let format = ugc_s[0].substring(2, 3);
            for (let i = 0; i < ugc_s.length; i++) {
                if (/^[A-Z]/.test(ugc_s[i])) { 
                    state = ugc_s[i].substring(0, 2);
                    zones.push(ugc_s[i]); 
                    continue; 
                }
                if (ugc_s[i].includes('>')) {
                    let [start, end] = ugc_s[i].split('>');
                    let startNum = parseInt(start, 10);
                    let endNum = parseInt(end, 10);
                    for (let j = startNum; j <= endNum; j++) {
                    zones.push(`${state}${format}${j.toString().padStart(3, '0')}`);
                    }
                } else {
                    zones.push(`${state}${format}${ugc_s[i]}`);
                }
            }
            zones = zones.filter(item => item !== '');
            resolve(zones);
        });
    }
}

module.exports = ShapefileManager