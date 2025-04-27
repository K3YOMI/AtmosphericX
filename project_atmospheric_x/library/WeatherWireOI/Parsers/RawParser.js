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
  * @class RawParser
  * @description A class for parsing raw messages. This class is used to handle raw message data, initializing basic properties and preparing the message for further processing.
  * 
  * @constructor
  * @param {string} [_msg=''] The raw message to be parsed. Defaults to an empty string.
  */

class RawParser {
  constructor(_msg=``) {
      this.author = `k3yomi@GitHub`
      this.name = `RawParsing`
      this.production = true
      this.message = _msg
  }

  /**
    * @method GetHailSize
    * @description Extracts hail size information from the message content by searching for the string `MAX HAIL SIZE...`.
    * The method uses a helper function (`_GetStringByLine`) to locate and retrieve the relevant line containing the hail size details.
    * 
    * @returns {Promise<string>} A promise that resolves to the string containing the hail size information found in the message.
    */

  async GetHailSize() { return await this._GetStringByLine(`MAX HAIL SIZE...`) }
  /**
    * @method GetWindGusts
    * @description Extracts wind gust information from the message content by searching for the string `MAX WIND GUST...`.
    * The method uses a helper function (`_GetStringByLine`) to locate and retrieve the relevant line containing the wind gust details.
    * 
    * @returns {Promise<string>} A promise that resolves to the string containing the wind gust information found in the message.
    */

  async GetWindGusts() { return await this._GetStringByLine(`MAX WIND GUST...`) }

  /**
    * @method GetTornado
    * @description Extracts tornado-related information from the message content by searching for the string `TORNADO...`.
    * The method uses a helper function (`_GetStringByLine`) to locate and retrieve the relevant line containing tornado details.
    * 
    * @returns {Promise<string>} A promise that resolves to the string containing the tornado information found in the message.
    */

  async GetTornado() { return await this._GetStringByLine(`TORNADO...`) }

  /**
    * @method GetDamageThreat
    * @description Extracts damage threat information from the message content by searching for the string `THUNDERSTORM DAMAGE THREAT...`.
    * The method uses a helper function (`_GetStringByLine`) to locate and retrieve the relevant line containing the damage threat details.
    * 
    * @returns {Promise<string>} A promise that resolves to the string containing the damage threat information found in the message.
    */

  async GetDamageThreat() { return await this._GetStringByLine(`THUNDERSTORM DAMAGE THREAT...`) }

  /**
    * @method GetOfficeName
    * @description Retrieves the name of the office issuing the alert. It checks the message for the presence of two office names:
    * 1. `National Weather Service`
    * 2. `NWS STORM PREDICTION CENTER`
    * 
    * If the first office name (`National Weather Service`) is found, it is returned. If not, it checks for the second office name (`NWS STORM PREDICTION CENTER`).
    * If neither is found, the method returns `N/A`.
    * 
    * @returns {Promise<string>} A promise that resolves to the office name (either the first found office or `N/A` if none is found).
    */

  async GetOfficeName() { 
      let v1 = await this._GetStringByLine(`National Weather Service `) 
      let v2 = await this._GetStringByLine(`NWS STORM PREDICTION CENTER `)
      if (v1 != `N/A`) { return v1 }
      if (v2 != `N/A`) { return v2 }
      return `N/A`
  }

  /**
    * @method GetPolygonCoordinatesByText
    * @description Parses the `LAT.{3}LON` pattern from the message to extract geographic coordinates. The coordinates are expected to be in a format with latitude and longitude pairs.
    * 
    * The method extracts the latitude and longitude values from the matched string, converts them into proper coordinate pairs (in decimal format), and stores them as an array of coordinate points. If there are at least three coordinates, the method ensures that the last point is connected to the first, forming a closed polygon.
    * 
    * @returns {Promise<Array<Array<number>>>} A promise that resolves to an array of coordinates, where each coordinate is represented as an array `[longitude, latitude]`. If no valid coordinates are found, it returns an empty array.
    */
  async GetPolygonCoordinatesByText() {
      let coordinates = [];
      let lat_lon = this.message.match(/LAT\.{3}LON\s+([\d\s]+)/i);
      if (lat_lon && lat_lon[1]) {
          let coordinate_strings = lat_lon[1].replace(/\n/g, ' ').trim().split(/\s+/);
          for (let i = 0; i < coordinate_strings.length - 1; i += 2) {
              const lat = parseFloat(coordinate_strings[i]) / 100;
              const long = -1 * (parseFloat(coordinate_strings[i + 1]) / 100);
              if (!isNaN(lat) && !isNaN(long)) { coordinates.push([long, lat]);}
          }
          if (coordinates.length > 2) { coordinates.push(coordinates[0]);}
      }
      return coordinates;
  }

  /**
   * @method _GetStringByLine
   * @description Searches the message for a specific pattern in each line and returns the cleaned string associated with that pattern. The method removes the matching text, excess whitespace, and certain units (like MPH, IN, etc.) from the resulting line.
   * 
   * @param {string} [_match='TORNADO...'] The string pattern to search for within each line of the message. Defaults to `'TORNADO...'`.
   * @returns {Promise<string>} A promise that resolves to a string. The string is the cleaned text from the first line that contains the given pattern, with the matching text and certain units removed. If no match is found, it returns `'N/A'`.
   */

  async _GetStringByLine(_match=`TORNADO...`) {
      let lines = this.message.split(`\n`)
      for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(_match)) {
              return lines[i].replace(_match, '').replace(/^\s+|\s+$/g, '').replace(/\b(?:MPH|IN|FT|MILE|NM|SM|in)\b/g, '').trim()
          }
      }
      return `N/A`
  }
}

module.exports = RawParser