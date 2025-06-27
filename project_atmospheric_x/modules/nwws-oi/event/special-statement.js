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


class AlertBuilder { 
    constructor() {
        this.name = `statementbuilder`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function process
      * @description Processes the alert based on the metadata provided. It checks if the metadata is XML or raw text and calls the appropriate function to handle it.
      *
      * @param {Object} metadata - The metadata object containing alert information.
      */

    process = function(metadata) {
        if (!metadata.isXml) { this.rawTextAlert(metadata) }
    }

    /**
      * @function rawTextAlert
      * @description Processes raw text special weather statements, extracts relevant information, and builds alert objects.
      *
      * @param {Object} metadata - The metadata object containing alert information.
      */

    rawTextAlert = async function(metadata) {
        let message = metadata.message.split(/(?=\$\$)/g)
        let messages = message.map(msg => msg.trim());
        let wire = loader.cache.configurations.sources.primary_sources.noaa_weather_wire_service
        let start = new Date().getTime()
        let defaultWmo = metadata.message.match(new RegExp(loader.definitions.RegExp_WMO, "gimu"));
        let alerts = []
        for (let i = 0; i < messages.length; i++) {
            let msg = messages[i]
            let ugc = await loader.modules.ugc.getUGC(msg)
            if (ugc != null) { 
                let getCoords = loader.modules.raw.getPolygonCoordinatesByText(msg)
                let getTornado = loader.modules.raw.getStringByLine(msg, `TORNADO...`) ? loader.modules.raw.getStringByLine(msg, `TORNADO...`) : loader.modules.raw.getStringByLine(msg, `WATERSPOUT...`)
                let getMaxHailSize = loader.modules.raw.getStringByLine(msg, `MAX HAIL SIZE...`, [`IN`]) ? loader.modules.raw.getStringByLine(msg, `MAX HAIL SIZE...`, [`IN`]) : loader.modules.raw.getStringByLine(msg, `HAIL...`, [`IN`])
                let getMaxWindGusts = loader.modules.raw.getStringByLine(msg, `MAX WIND GUST...`) ? loader.modules.raw.getStringByLine(msg, `MAX WIND GUST...`) : loader.modules.raw.getStringByLine(msg, `WIND...`)
                let damageThreat = loader.modules.raw.getStringByLine(msg, `DAMAGE THREAT...`)
                let senderOffice = loader.modules.raw.getOfficeName(msg) ? loader.modules.raw.getOfficeName(msg) : `Unknown Office`
                if (getCoords.length == 0 && wire.ugc_polygons) { getCoords = await loader.modules.ugc.getCoordinates(ugc.zones) }
                let dateLineMatches = [...msg.matchAll(/\d{3,4}\s*(AM|PM)?\s*[A-Z]{2,4}\s+[A-Z]{3,}\s+[A-Z]{3,}\s+\d{1,2}\s+\d{4}/gim)];
                if (dateLineMatches.length > 0) {
                    let dateLineMatch = dateLineMatches[dateLineMatches.length - 1];
                    let nwsStart = msg.lastIndexOf(dateLineMatch[0]);
                    if (nwsStart !== -1) {
                        let latStart = msg.indexOf("&&", nwsStart);
                        if (latStart !== -1) {
                            msg = msg.substring(nwsStart + dateLineMatch[0].length, latStart + "&&".length).trim();
                        } else {
                            msg = msg.substring(nwsStart + dateLineMatch[0].length).trim();
                        }
                        if (msg.startsWith('/')) { msg = msg.substring(1).trim() }
                    }
                } else {
                    let vtecStart = msg.indexOf(vtec.raw);
                    if (vtecStart !== -1) {
                        let afterVtec = msg.substring(vtecStart + vtec.raw.length);
                        if (afterVtec.startsWith('/')) { afterVtec = afterVtec.substring(1); }
                        let latStart = afterVtec.indexOf("&&");
                        if (latStart !== -1) { msg = afterVtec.substring(0, latStart).trim(); } else { msg = afterVtec.trim(); }
                    }
                }
                let alert = {
                    id: `NWWS-OI-${defaultWmo ? defaultWmo[0] : `N/A`}-${ugc.zones.join(`-`)}`,
                    tracking: `${defaultWmo ? defaultWmo[0] : `N/A`}-${ugc.zones.join(`-`)}`,
                    action: `Issued`,
                    history: [{desc: msg, act: `Issued`, time: new Date(metadata.attributes.issue)}],
                    properties: {
                        areaDesc: ugc.locations.join(`; `) || `N/A`,
                        expires: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
                        sent: new Date(metadata.attributes.issue),
                        messageType: `Issued`,
                        event: `Special Weather Statement`,
                        sender: senderOffice,
                        senderName: `NWS ${senderOffice}`,
                        description: msg,
                        geocode: { UGC: ugc.zones || []},
                        parameters: { 
                            WMOidentifier: defaultWmo ? defaultWmo[0] : `N/A`,
                            tornadoDetection: getTornado || `N/A`,
                            maxHailSize: getMaxHailSize || `N/A`,
                            maxWindGust: getMaxWindGusts || `N/A`,
                            thunderstormDamageThreat: [damageThreat || `N/A`],
                        },
                    },
                    geometry: {
                        type: `Polygon`,
                        coordinates: [getCoords]
                    },
                    type: `Feature`,
                }
                alerts.push(alert)
            }
        }
        let filter = loader.modules.parsing.filterAlerts(alerts)
        let coordFilter = loader.modules.parsing.coordsToMiles(filter)
        if (coordFilter.length == 0) { return }
        loader.modules.listener.processValidAlerts(coordFilter, `RAW`, `${new Date().getTime() - start}ms`)
    }
}


module.exports = AlertBuilder;