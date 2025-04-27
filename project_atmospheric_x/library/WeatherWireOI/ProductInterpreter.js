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

let LOAD = require(`../../loader.js`)

/**
  * @class ProductInterpreter
  * @description A class responsible for interpreting and processing message stanzas in the weather wire format.
  * It provides methods for extracting information from the stanza, determining alert types, and compiling valid alerts
  * for further processing, such as creating new alerts or messages.
  * 
  * @constructor
  * @param {string} [_stanza=``] - The XML stanza to be processed by the `ProductInterpreter` instance.
  */


class ProductInterpreter {
    constructor(_stanza=``) {
        this.author = `k3yomi@GitHub`
        this.name = `ProductInterpreter`
        this.production = true
        this.stanza = _stanza
    }

    /**
      * @function CompileMessage
      * @description Processes a message stanza and extracts its components such as the message content,
      * attributes, and XML properties. If the debug mode is enabled, it returns the provided metadata. Otherwise, it parses
      * the `message` stanza, checks for specific XML elements like `<areaDesc>` and VTEC codes, and updates the internal properties.
      * It also logs the raw message and attributes to disk in different categories based on certain conditions (e.g., XML validity, VTEC matching).
      * 
      * @async
      * @param {boolean} [_debug=false] - Flag to indicate whether to return the provided debug metadata without further processing.
      * @param {Object} [_metadata={}] - The metadata object containing the message, attributes, and XML flag to be used in debug mode.
      * @param {string} _metadata.message - The raw message string to process.
      * @param {Object} _metadata.attributes - The attributes associated with the message.
      * @param {boolean} _metadata.xml - Indicates whether the message is in XML format.
      * @returns {Promise<Object>} A promise that resolves to an object containing the processed message, attributes, XML flag,
      * and other related metadata (e.g., `valid_xml_alert`, `type`, `ignore`).
      */

    async CompileMessage(_debug=false, _metadata={}) {
        return new Promise(async (resolve, reject) => {
            try {
                if (_debug) { 
                    this.message = _metadata.message
                    this.attributes = _metadata.attributes
                    this.xml = _metadata.xml
                    resolve({message: _metadata.message, attributes: _metadata.attributes, xml: _metadata.xml, ignore: false}); 
                    return 
                }
                if (this.stanza.is(`message`)) {
                    let cb = this.stanza.getChild(`x`)
                    if (cb && cb.children) {
                        this.message = unescape(cb.children[0])
                        this.attributes = cb.attrs
                        this.xml = this.message.includes(`<?xml version="1.0"`)
                        this.area_description = this.message.includes(`<areaDesc>`)
                        this.vtec = this.message.match(LOAD.cache.configurations.definitions.vtec_regexp)
                        let type = await this._GetCallType()

                        if (LOAD.cache.alerts.wire == undefined) { LOAD.cache.alerts.wire = [] }
                        if (LOAD.cache.alerts.wire.length >= 64) { LOAD.cache.alerts.wire.shift() }
                        LOAD.cache.alerts.wire.push({message: this.message, issued: new Date().toISOString()})

                        LOAD.Packages.FileSystem.appendFileSync(LOAD.Packages.PathSystem.join(__dirname, `../../../storage/nwws-oi`, `feed`, `nwws-raw-category-${type}s.bin`), `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${this.message}\n${JSON.stringify(this.attributes, null, 4)}\n`, `utf8`)
                        if (!this.vtec) { LOAD.Packages.FileSystem.appendFileSync(LOAD.Packages.PathSystem.join(__dirname, `../../../storage/nwws-oi`, `feed`, `nwws-raw-global-feed.bin`), `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${this.message}\n${JSON.stringify(this.attributes, null, 4)}\n`, `utf8`); }
                        if (this.attributes.awipsid) {
                            if (this.xml && this.area_description) {LOAD.Packages.FileSystem.appendFileSync(LOAD.Packages.PathSystem.join(__dirname, `../../../storage/nwws-oi`, `feed`, `nwws-xml-valid-feed.bin`), `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${this.message}\n${JSON.stringify(this.attributes, null, 4)}\n`, `utf8`);}
                            if (!this.xml && this.vtec) {LOAD.Packages.FileSystem.appendFileSync(LOAD.Packages.PathSystem.join(__dirname, `../../../storage/nwws-oi`, `feed`, `nwws-raw-valid-feed.bin`), `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${this.message}\n${JSON.stringify(this.attributes, null, 4)}\n`, `utf8`);}
                            resolve({message: this.message, attributes: this.attributes, xml: this.xml, valid_xml_alert: this.area_description, type: type, ignore: false})
                        }
                    }
                }
                resolve({message: null, attributes:null, xml: null, valid_xml_alert: null, type: null, ignore: true})
            } catch (error) {
                reject({message: null, attributes:null, xml: null, valid_xml_alert: null, type: null, ignore: true})
            }
        })
    }

    /**
      * @function _GetCallType
      * @description Asynchronously determines the type of alert based on the `message` and `attributes` properties.
      * Checks if the `awipsid` is empty or null to categorize the alert as a `test message`. Then, it maps known `awipsid` prefixes
      * (e.g., `SWOMCD`, `LSR`, `SPS`, etc.) to their respective alert types such as `md`, `local storm report`, `special weather statement`, etc.
      * If no match is found, the method defaults to returning the `alert` type.
      *
      * @async
      * @returns {Promise<string>} A promise that resolves to a string representing the type of the alert (e.g., `md`, `alert`, `LSR`).
      */

    async _GetCallType() {
        return new Promise((resolve, reject) => {
            if (this.message == null || this.attributes == null) { resolve(`unknown`); return; }
            if (this.attributes.awipsid == "") { resolve(`test message`); return; }
            let awips_name = {
                SWOMCD: `md`, LSR: `local storm report`,
                SPS: `special weather statement`, TAF: `terminal aerodrome forecast`,
                RVS: `river statement`, RWR: `regional weather roundup`,
                SFT: `tabular state forecast`, REC: `recreational report`,
                PFM: `point forecast matrices`
            };
            for (let [prefix, type] of Object.entries(awips_name)) {
                if (this.attributes.awipsid.startsWith(prefix)) { resolve(type); return; }
            }
            resolve(`alert`)
        })
    }

    /**
      * @function CreateNewAlert
      * @description Asynchronously determines the type of alert based on the current message and then processes the alert accordingly.
      * The method starts by identifying the alert type using the `_GetCallType` method. It currently handles the basic `alert` type by 
      * creating a new `AlertBuilder`. Other types such as `local storm report`, `md`, `outlook`, `special weather statement`, 
      * and `test message` are placeholders for future implementation. Each alert type has a corresponding section to be implemented.
      *
      * @async
      * @returns {Promise<void>} A promise that resolves once the alert type is determined and processed.
      */ 

    async CreateNewAlert() {
        return new Promise(async (resolve, reject) => {
            let type = await this._GetCallType() // TODO: Use if statements to determine which type alert, by default we will start with basic alerts...
            if (type == `alert`) { new LOAD.Callbacks.AlertBuilder({message: this.message, attributes: this.attributes, xml: this.xml}) }
            if (type == `local storm report`) { } // TODO: Add LSR support
            if (type == `md`) { } // TODO: Add MD support
            if (type == `outlook`) { } // TODO: Add Outlook support
            if (type == `special weather statement`) { } // TODO: Add SPS support
            if (type == `test message`) { } // TODO: Add SPS support
            resolve()
        })
    }
}

module.exports = ProductInterpreter