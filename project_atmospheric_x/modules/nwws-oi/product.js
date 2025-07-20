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

    compileMessage = function(stanza, debugMode = false, metadata = {}) {
        try {
            if (debugMode) {
                let { xml: isXml, attributes } = metadata;
                let message = stanza;
                let hasVtec = message.match(loader.definitions.RegExp_VTEC);
                let areaDesc = message.includes(`<areaDesc>`);
                let type = this.getCallType(attributes);
                return { message, attributes, isXml, hasXmlDescription: areaDesc, hasVtec, type, ignore: false };
            }
            if (stanza.is(`message`)) {
                let cb = stanza.getChild(`x`);
                if (cb?.children) {
                    let message = unescape(cb.children[0]);
                    let attributes = cb.attrs;
                    let isXml = message.includes(`<?xml version="1.0"`);
                    let areaDesc = message.includes(`<areaDesc>`);
                    let hasVtec = message.match(loader.definitions.RegExp_VTEC);
                    let type = this.getCallType(attributes);
                    loader.cache.wire ??= [];
                    if (loader.cache.wire.length >= 20) loader.cache.wire.shift();
                    loader.cache.wire.push({ message, issued: new Date().toISOString() });
                    let basePath = loader.packages.path.join(__dirname, `../../../storage/nwws-oi`, `feed`);
                    loader.packages.fs.appendFileSync(`${basePath}/nwws-raw-category-${type}s.bin`, `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${message}`, `utf8`);
                    if (!hasVtec) loader.packages.fs.appendFileSync(`${basePath}/nwws-raw-global-feed.bin`, `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${message}\n${JSON.stringify(attributes, null, 4)}\n`, `utf8`);
                    if (attributes.awipsid) {
                        if (isXml && areaDesc) loader.packages.fs.appendFileSync(`${basePath}/nwws-xml-valid-feed.bin`, `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${message}\n${JSON.stringify(attributes, null, 4)}\n`, `utf8`);
                        if (!isXml && hasVtec) {
                            loader.packages.fs.appendFileSync(`${basePath}/nwws-raw-valid-feed.bin`, `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${message}\n${JSON.stringify(attributes, null, 4)}\n`, `utf8`);
                            loader.packages.fs.appendFileSync(`${basePath}/nwws-cache.bin`, `\n\n${message}\n\n`, `utf8`);
                        }
                        loader.modules.hooks.sendWebhook(`New Stanza Type: ${type.toUpperCase()}`, `\`\`\`${message.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n')}\`\`\``, loader.cache.configurations.webhook_settings.misc_alerts);
                        return { message, attributes, isXml, hasXmlDescription: areaDesc, hasVtec, type, ignore: false };
                    }
                }
            }
            return { message: null, attributes: null, isXml: null, hasXmlDescription: null, hasVtec: null, type: null, ignore: true };
        } catch (error) {
            loader.modules.hooks.createLog(`${this.name}.compileMessage`, `Error: ${error}`);
            return { message: null, attributes: null, isXml: null, hasXmlDescription: null, hasVtec: null, type: null, ignore: true };
        }
    }

    /**
      * @function getCallType
      * @description Get the call type of the alert basedon AWIPS ID. 
      * 
      * @param {object} attributes - The attributes object to check
      */

    getCallType = function(attributes) {
        let awipsDefinitions = {
            SWOMCD: `md`, LSR: `local storm report`, SPS: `special weather statement`,
            TAF: `terminal aerodrome forecast`, RVS: `river statement`,
            RWR: `regional weather roundup`, SFT: `tabular state forecast`,
            REC: `recreational report`, PFM: `point forecast matrices`
        };
        if (!attributes || !attributes.awipsid) return `Unknown`;
        for (let [prefix, type] of Object.entries(awipsDefinitions)) { if (attributes.awipsid.startsWith(prefix)) return type; }
        return `alert`;
    }

    /**
      * @function processMessage
      * @description Process the message and determine the alert type. This function will take a input of a message and process it into a object and run it through the events builder.
      * 
      * @param {object} metadata - The metadata object to pass to the function. This is used for debugging purposes.
      */

    processMessage = function(metadata) {
        let type = metadata.type;
        if (type == `alert`) loader.modules.alertbuilder.process(metadata);
        if (type == `local storm report`) return {success: false, message: `LSR support not implemented`};
        if (type == `md`) return {success: false, message: `MD support not implemented`};
        if (type == `outlook`) return {success: false, message: `Outlook support not implemented`};
        if (type == `special weather statement`) loader.modules.statementbuilder.process(metadata);
        if (type == `test message`) return {success: false, message: `Test Message support not implemented`};
        if (type == `tabular state forecast`) return {success: false, message: `Tabular State Forecast support not implemented`};
        if (type == `recreational report`) return {success: false, message: `Recreational Report support not implemented`};
        if (type == `point forecast matrices`) return {success: false, message: `Point Forecast Matrices support not implemented`};
        if (type == `terminal aerodrome forecast`) return {success: false, message: `Terminal Aerodrome Forecast support not implemented`};
        if (type == `river statement`) return {success: false, message: `River Statement support not implemented`};
        if (type == `regional weather roundup`) return {success: false, message: `Regional Weather Roundup support not implemented`};
        return {success: true, message: `Successfully processed the message`};
    }
}


module.exports = Products;