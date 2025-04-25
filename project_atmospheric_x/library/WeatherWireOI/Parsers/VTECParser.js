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
  * @class VTECParser
  * @description A class responsible for parsing VTEC (Event) codes from a given message.
  * 
  * This class handles extracting and processing relevant event details from a VTEC string 
  * including tracking numbers, event names, significance, status, and expiration dates.
  * It utilizes a set of regular expressions and metadata to retrieve specific pieces of data.
  *
  * @param {string} [_msg=""] - The VTEC message string to be parsed.
  * @param {object} [_metadata={}] - The metadata used for processing the message, including mappings for event codes.
  */

class VTECParser {
  constructor(_msg=``, _metadata={}) {
      this.author = `k3yomi@GitHub`
      this.name = `VTECParser`
      this.production = true
      this.message = _msg
      this.metadata = _metadata
      this.vtec = {}
  }

  /**
    * @method ParseVTEC
    * @description Asynchronously parses the VTEC (Vertical Time Event Code) from the message,
    * extracting and splitting the VTEC code into its components such as tracking ID, event name,
    * event significance, event status, and expiration. It resolves to the parsed `vtec` object
    * or `null` if no VTEC is found in the message.
    *
    * @async
    * @returns {Promise<Object|null>} A promise that resolves to an object containing parsed VTEC information 
    * or `null` if no VTEC code is found.
    */

  async ParseVTEC() {
      return new Promise(async (resolve, reject) => {
          let match = this.message.match(this.metadata.vtec_regexp)
          if (match != null) {
              this.split_vtec = match[0].split(`.`)
              this.split_dates = this.split_vtec[6].split(`-`)
              this.vtec.tracking_id = await this._GetTrackingNumber()
              this.vtec.event_name = await this._GetEventName()
              this.vtec.event_significance = await this._GetEventSignificance()
              this.vtec.event_status = await this._GetEventStatus()
              this.vtec.expires = await this._GetExpires()
              resolve(this.vtec)
          }
          resolve(null)
      })
  }

  /**
    * @method _GetTrackingNumber
    * @description Extracts the tracking number from the parsed VTEC code. The tracking number 
    * is constructed by combining specific parts of the VTEC code (split by a dot).
    *
    * @returns {string} The constructed tracking number in the format `XXX-XXX-XXX`.
    */

  async _GetTrackingNumber() { return `${this.split_vtec[2]}-${this.split_vtec[4]}-${this.split_vtec[5]}`; }

  /**
    * @method _GetEventName
    * @description Retrieves the event name associated with the event code from the VTEC 
    * string by using the event code lookup in the metadata's `event_codes` dictionary.
    *
    * @returns {string} The name of the event based on the event code, or an empty string 
    * if no matching code is found.
    */
  
  async _GetEventName() { return `${this.metadata.event_codes[this.split_vtec[3]]}`; }

  /**
    * @method _GetEventSignificance
    * @description Retrieves the event significance based on the event type from the VTEC 
    * string by using the event type lookup in the metadata's `event_types` dictionary.
    *
    * @returns {string} The significance of the event based on the event type, or an empty string 
    * if no matching type is found.
    */

  async _GetEventSignificance() { return `${this.metadata.event_types[this.split_vtec[4]]}`; }

  /**
    * @method _GetEventStatus
    * @description Retrieves the event status from the VTEC string by using the status 
    * signature lookup in the metadata's `status_signatures` dictionary.
    *
    * @returns {string} The status of the event based on the status signature, or an empty string 
    * if no matching status is found.
    */

  async _GetEventStatus() { return `${this.metadata.status_signatures[this.split_vtec[1]]}`; }  

  /**
    * @method _GetExpires
    * @description Computes the expiration time for an event from the VTEC string's 
    * expiration date. If the expiration date is not in a valid format, returns "Invalid Date Format".
    *
    * The method converts the expiration date from UTC to local time (Eastern Standard Time).
    *
    * @returns {string} The expiration date in ISO 8601 format, or "Invalid Date Format" 
    * if the expiration date is `000000T0000Z`.
    */

  async _GetExpires() {
      if (this.split_dates[1] != `000000T0000Z`) {
          let expires = `${new Date().getFullYear().toString().substring(0, 2)}${this.split_dates[1].substring(0, 2)}-${this.split_dates[1].substring(2, 4)}-${this.split_dates[1].substring(4, 6)}T${this.split_dates[1].substring(7, 9)}:${this.split_dates[1].substring(9, 11)}:00`;
          let local = new Date(new Date(expires).getTime() - 4 * 60 * 60000);
          let pad = n => String(n).padStart(2, '0');
          return `${local.getFullYear()}-${pad(local.getMonth()+1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}:00.000-04:00`;
      } else { 
          return "Invalid Date Format";
      }
  } 
}

module.exports = VTECParser