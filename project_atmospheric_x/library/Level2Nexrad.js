

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
 * @module Level2Nexrad
 * @description This module provides functionality to fetch and parse Level 2 Nexrad radar data from AWS S3 bucket.
 * It includes methods to get the latest data, stream it, and process reflectivity data into GeoJSON format.
 * It also includes methods to calculate coordinates based on azimuth, elevation, and range.
 * 
 * @requires axios
 * @requires nexrad-level-2-data
 * @requires nexrad-level-2-plot
 * 
 * Note: This module does not use the traditional AWS SDK for S3 operations, but rather direct HTTP requests to the S3 bucket.
 * This is due to complications and inconsistencies encountered with the latest AWS SDK libraries. 
 * 
 * Also, this module isn't being used in production just yet, still doing silent testing and debugging for position of radar level2/level3 data.
 * The timing to gather this data takes about 2-3 seconds which is not ideal for a production environment, but it is being used for testing purposes.
 * If anyone has any suggestions on how to improve the performance of this module, please feel free to reach out to me on GitHub or Discord @kiyomi (359794704847601674).
 */


class Level2Nexrad { 
    constructor() {
        this.author = `k3yomi@GitHub`;
        this.production = false
        this.name = `Level2Nexrad`;
        Hooks.PrintLog(`${this.name}`, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function GetNewInformation
      * @description Retrieves and parses the latest radar data for a given prefix. It first fetches the latest file key 
      * using `_GetLatestFromPrefix`, then streams the file from the NOAA NEXRAD S3 bucket. The radar data is parsed to 
      * extract reflectivity information. If the data is successfully parsed, it is compressed and stored 
      * in the cache for future use. If the data has already been cached, it returns the cached version.
      * 
      * @param {string} _prefix - The prefix to fetch the latest radar data for.
      * 
      * @returns {Promise<Object|null>} 
      * Returns a compressed object containing the radar data or `null` if no data is found or the prefix is invalid.
      */

    async GetNewInformation(_prefix) {
        return new Promise(async (resolve) => {
            let start = new Date().getTime();
            let lookup = (await this._GetLatestFromPrefix(_prefix))
            if (lookup == null) { resolve(null); return; }
            let stream = await this._StreamLatestFromKey(lookup);
            if (stream != null) {
                let level2parser = new nexrad_data.Level2Radar(Buffer.from(stream));
                let reflectivity = await this._GetHighResReflectivity(level2parser);

                let compressed = {
                    'file': lookup,
                    'high_res_reflectivity': Buffer.from(JSON.stringify(reflectivity)).toString('base64'),
                }
                cache.rdr.filter(rdr => rdr.file == lookup)[0].compressed = compressed
                let end = new Date().getTime();
                Hooks.Log(`Level2Nexrad : Radar data parsed for ${lookup} @ ${new Date().toLocaleString()} (${end - start} milliseconds)`)
                Hooks.PrintLog(`Level2Nexrad`, `Radar data parsed for ${lookup} @ ${new Date().toLocaleString()} (${end - start} milliseconds)`)
                resolve(compressed);
            } else { 
                if (cache.rdr.filter(rdr => rdr.file == _prefix).length != 0) {
                    let compressed = cache.rdr.filter(rdr => rdr.file == _prefix)[0].compressed;
                    resolve(compressed);    
                }
                else { resolve(null); return; }
            }
        })
    }

    /**
      * @function _GetLatestFromPrefix
      * @description Fetches the latest key from an S3 bucket based on the provided prefix. It sends a request to the NOAA NEXRAD Level 2 data S3 endpoint, 
      * retrieves the list of keys, and filters out keys with "_MDM". The latest key (the most recent one) is then returned.
      * 
      * @param {string} _prefix - The prefix to search for in the S3 bucket.
      * 
      * @returns {Promise<string|null>} 
      * Returns the latest key as a string, or `null` if no keys are found or an error occurs.
      */

    async _GetLatestFromPrefix(_prefix) {
        return new Promise(async (resolve) => {
            try {
                let link = `https://noaa-nexrad-level2.s3.amazonaws.com/?list-type=2&delimiter=%2F&prefix=${_prefix}`;
                let response = await Hooks.CallHTTPS(link);
                let regular_expression = /<Key>(.*?)<\/Key>/g;
                let keys = response.match(regular_expression);
                if (keys == null) { 
                    Hooks.Log(`Level2Nexrad : No keys found for prefix ${_prefix}`); 
                    Hooks.PrintLog(`Level2Nexrad`, `No keys found for prefix ${_prefix}`);
                    resolve(null); 
                    return;
                }
                keys = keys.filter(key => !key.includes('_MDM'));
                keys.reverse();
                keys = keys.slice(0, 1);
                resolve(keys[0]?.split('<Key>')[1]?.split('</Key>')[0]);
            } catch (error) {
                Hooks.Log(`Level2Nexrad : Error fetching keys from S3: ${error}`);
                resolve(null);
            }
        });
    }

    /**
     * @function _StreamLatestFromKey
     * @description Streams level2 data with a specified key from the AWS S3 Bucket. This doesn't use the traditional AWS SDK, but rather a direct HTTP request to the S3 bucket.
     * as I find it more complicated to use the SDK for this specific case. Plus having issues with just general AWS SDK usasge properly working consistently.
     * 
     * @param {string} _key - The key of the file to download.
     * @returns {Promise<Buffer>} - The downloaded data as a Buffer.
     */

    async _StreamLatestFromKey(_key) {
        return new Promise(async (resolve) => {
            let isKeyCached = cache.rdr.filter(rdr => rdr.file == _key)
            if (isKeyCached.length != 0) { resolve(null); return; }
            cache.rdr.push({ file: _key, compressed: null });
            let download_link = `https://noaa-nexrad-level2.s3.amazonaws.com/${_key}`;
            let req = await axios.request({url: download_link, responseType: "arraybuffer", headers: {}, timeout: 10000});
            resolve(req.data)
        })
    }

    /**
      * @function _CalculateCoordsByRadar
      * @description Calculates the new geographical coordinates (longitude and latitude) given an initial point, 
      * azimuth, elevation, and range. This function uses the Haversine formula and spherical trigonometry 
      * to calculate the destination point on the Earth's surface.
      * 
      * @param {number} _lon0 - The initial longitude in degrees.
      * @param {number} _lat0 - The initial latitude in degrees.
      * @param {number} _azimuth - The azimuth angle (in degrees), which is the direction of travel.
      * @param {number} _elevation - The elevation angle (in degrees), which is the angle above the horizon.
      * @param {number} _range - The distance to travel (in meters).
      * 
      * @returns {Promise<Array|null>} 
      * Returns an array containing the new longitude and latitude, or `null` if the coordinates are invalid.
      */

    async _CalculateCoordsByRadar(_lon0, _lat0, _azimuth, _elevation, _range) {
        let earth_radius = 6378137;
        let theta = (_azimuth * Math.PI) / 180;
        let distance = _range * Math.cos(_elevation * Math.PI / 180);
        let delta = distance / earth_radius;
        let new_lat = Math.asin(
            Math.sin(_lat0 * Math.PI / 180) * Math.cos(delta) +
            Math.cos(_lat0 * Math.PI / 180) * Math.sin(delta) * Math.cos(theta)
        );
        let new_lon = _lon0 * Math.PI / 180 + Math.atan2(
            Math.sin(theta) * Math.sin(delta) * Math.cos(_lat0 * Math.PI / 180),
            Math.cos(delta) - Math.sin(_lat0 * Math.PI / 180) * Math.sin(new_lat)
        );
        new_lat = (new_lat * 180) / Math.PI;
        new_lon = (new_lon * 180) / Math.PI;
        if (isNaN(new_lat) || isNaN(new_lon) || new_lat < -90 || new_lat > 90 || new_lon < -180 || new_lon > 180) {
            return null;
        }
        return [new_lon, new_lat];
    }

    /**
      * @function _GetHighResReflectivity
      * @description Processes high-resolution reflectivity data from a Level 2 Nexrad radar scan. For each scan, 
      * the function calculates the geographic coordinates and intensity values for each radar point 
      * based on azimuth, elevation, and range. It then formats this information into a GeoJSON feature collection.
      * 
      * @param {Object} _cb - The Nexrad data object used for fetching radar scan information.
      * 
      * @returns {Promise<Object>} 
      * A GeoJSON object containing the processed reflectivity data as features with coordinates and intensity values.
      */

    async _GetHighResReflectivity(_cb) {
        return new Promise(async (resolve) => {
            let features = [];
            let headers = _cb.getHeader();
            let lon0 = headers[0]?.volume?.longitude;
            let lat0 = headers[0]?.volume?.latitude;
            let elevations = _cb.listElevations();
            let scans = _cb.getScans();
            if (!lon0 || !lat0) {
                Hooks.Log(`Level2Nexrad : Invalid longitude or latitude in header.`);
                Hooks.PrintLog(`Level2Nexrad`, `Invalid longitude or latitude in header.`);
                resolve({ type: "FeatureCollection", features: [] });
                return;
            }
            for (let i = 0; i < scans; i++) {
                let header = _cb.getHeader(i);
                let azimuth = header.azimuth;
                let elevationIndex = header.elevation_number - 1;
                let elevation = elevations[elevationIndex] || null;
                if (elevation === null || isNaN(elevation)) {
                    Hooks.Log(`Level2Nexrad : Invalid elevation for scan ${i}.`);
                    Hooks.PrintLog(`Level2Nexrad`, `Invalid elevation for scan ${i}.`);
                    continue;
                }
                let reflect_scan = _cb.getHighresReflectivity(i)?.moment_data;
                if (!reflect_scan || reflect_scan.length === 0) {
                    Hooks.Log(`Level2Nexrad : No reflectivity data for scan ${i}.`);
                    Hooks.PrintLog(`Level2Nexrad`, `No reflectivity data for scan ${i}.`);
                    continue;
             }  
                let ranges = Array.from({ length: reflect_scan.length }, (_, j) => j * 250); // Assuming 250m range resolution
                for (let a = 0; a < reflect_scan.length; a++) {
                    if (reflect_scan[a] === null || isNaN(reflect_scan[a])) {
                        continue;
                    }
                    let coordinates = this._CalculateCoordsByRadar(lon0, lat0, azimuth, elevation, ranges[a]);
                    if (!coordinates) {
                        Hooks.Log(`Level2Nexrad : Invalid coordinates for scan ${i}, range ${a}.`);
                        Hooks.PrintLog(`Level2Nexrad`, `Invalid coordinates for scan ${i}, range ${a}.`);
                        continue;
                    }
                    features.push({
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: coordinates
                        },
                        properties: {
                            intensity: reflect_scan[a]
                        }
                    });
                }
            }
    
            resolve({ type: "FeatureCollection", features });
        });
    }
}



module.exports = Level2Nexrad;