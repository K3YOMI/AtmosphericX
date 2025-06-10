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


let loader = require(`../../loader.js`)


class Products { 
    constructor() {
        this.name = `Products`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }
    /**
      * @function compileMessage
      * @description NWWS-OI message (stanza) compiler. This function will take a input of a stanza and or debug mesage and process it into a object.
      * It will determine the alert type (LSR, Alert, MD, etc) and return the message object.
      * 
      * @param {string} stanza - The NWWS-OI message to compile
      * @param {boolean} debugMode - If true, the function will return the message as a string and not process it. This is used for debugging purposes.
      * @param {object} metadata - The metadata object to pass to the function. This is used for debugging purposes.
      */

    compileMessage = function(stanza, debugMode=false, metadata={}) {
        try {
            if (debugMode) {
                let isXml = metadata.xml 
                let attributes = metadata.attributes
                let message = stanza
                let hasVtec = message.match(loader.definitions.RegExp_VTEC)
                let areaDesc = message.includes(`<areaDesc>`)
                let getType = this.getCallType(attributes)
                return {message: message, attributes: attributes, isXml: isXml, hasXmlDescription: areaDesc, hasVtec: hasVtec, type: getType, ignore: false}
            }
            if (stanza.is(`message`)) {
                let cb = stanza.getChild(`x`)
                if (cb && cb.children) {
                    let message = unescape(cb.children[0])
                    let attributes = cb.attrs
                    let isXml = message.includes(`<?xml version="1.0"`)
                    let areaDesc = message.includes(`<areaDesc>`)
                    let hasVtec = message.match(loader.definitions.RegExp_VTEC)
                    let getType = this.getCallType(attributes)
                    if (loader.cache.wire == undefined) { loader.cache.wire = [] }
                    if (loader.cache.wire.length >= 20) { loader.cache.wire.shift() }
                    loader.cache.wire.push({message: message, issued: new Date().toISOString()})
                    loader.packages.fs.appendFileSync(loader.packages.path.join(__dirname, `../../../storage/nwws-oi`, `feed`, `nwws-raw-category-${getType}s.bin`), `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${message}`, `utf8`)
                    if (!hasVtec) { loader.packages.fs.appendFileSync(loader.packages.path.join(__dirname, `../../../storage/nwws-oi`, `feed`, `nwws-raw-global-feed.bin`), `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${message}\n${JSON.stringify(attributes, null, 4)}\n`, `utf8`); }
                    if (attributes.awipsid) {
                        if (isXml && areaDesc) {
                            loader.packages.fs.appendFileSync(loader.packages.path.join(__dirname, `../../../storage/nwws-oi`, `feed`, `nwws-xml-valid-feed.bin`), `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${message}\n${JSON.stringify(attributes, null, 4)}\n`, `utf8`);
                        }
                        if (!isXml && hasVtec) {
                            loader.packages.fs.appendFileSync(loader.packages.path.join(__dirname, `../../../storage/nwws-oi`, `feed`, `nwws-raw-valid-feed.bin`), `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${message}\n${JSON.stringify(attributes, null, 4)}\n`, `utf8`);
                            loader.packages.fs.appendFileSync(loader.packages.path.join(__dirname, `../../../storage/nwws-oi`, `feed`, `nwws-cache.bin`), `\n\n${message}\n\n`, `utf8`);

                        }
                        return {message: message, attributes: attributes, isXml: isXml, hasXmlDescription: areaDesc, hasVtec: hasVtec,type: getType,ignore: false}
                    }
                }
            }
            return { message: null, attributes: null, isXml: null, hasXmlDescription: null, hasVtec: null, type: null, ignore: true }
        } catch (error) {
            loader.modules.hooks.createLog(`${this.name}.compileMessage`, `Error: ${error}`)
            return { message: null,  attributes: null, isXml: null, hasXmlDescription: null, hasVtec: null, type: null, ignore: true }
        }
    }

    /**
      * @function getCallType
      * @description Get the call type of the alert basedon AWIPS ID. 
      * 
      * @param {object} attributes - The attributes object to check
      */

    getCallType = function(attributes) {
        if (attributes == null) { return `Unknown`}
        if (attributes.awipsid == "") { return `Test Message`}
        let awipsDefinitions = {
            SWOMCD: `md`, LSR: `local storm report`,
            SPS: `special weather statement`, TAF: `terminal aerodrome forecast`,
            RVS: `river statement`, RWR: `regional weather roundup`,
            SFT: `tabular state forecast`, REC: `recreational report`,
            PFM: `point forecast matrices`
        };
        for (let [prefix, type] of Object.entries(awipsDefinitions)) {
            if (attributes.awipsid.startsWith(prefix)) { return type }
        }
        return `alert`;
    }

    /**
      * @function processMessage
      * @description Process the message and determine the alert type. This function will take a input of a message and process it into a object and run it through the events builder.
      * 
      * @param {object} metadata - The metadata object to pass to the function. This is used for debugging purposes.
      */

    processMessage = function(metadata) {
        if (metadata.type == `alert`) { loader.modules.alertbuilder.process(metadata) }
        if (metadata.type == `local storm report`) { } // TODO: Add LSR support
        if (metadata.type == `md`) { } // TODO: Add MD support
        if (metadata.type == `outlook`) { } // TODO: Add Outlook support
        if (metadata.type == `special weather statement`) { loader.modules.statementbuilder.process(metadata) }
        if (metadata.type == `test message`) { } // TODO: Add Test Message support
        if (metadata.type == `tabular state forecast`) { } // TODO: Add Tabular State Forecast support
        if (metadata.type == `recreational report`) { } // TODO: Add Recreational Report support
        if (metadata.type == `point forecast matrices`) { } // TODO: Add Point Forecast Matrices support
        if (metadata.type == `terminal aerodrome forecast`) { } // TODO: Add Terminal Aerodrome Forecast support
        if (metadata.type == `river statement`) { } // TODO: Add River Statement support
        if (metadata.type == `regional weather roundup`) { } // TODO: Add Regional Weather Roundup support
        return {success: true, message: `Successfully processed the message`}
    }
}


module.exports = Products;