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
        this.name = `AlertBuilder`;
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
        if (!metadata.isXml && metadata.hasVtec != null) { this.rawTextAlert(metadata) }
        if (metadata.isXml) { this.xmlAlert(metadata) } 
    }

    /**
      * @function rawTextAlert
      * @description Processes raw text alerts. It extracts relevant information from the message, 
      * such as VTEC, UGC, and coordinates, and builds an alert object.
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
            let vtec = await loader.modules.vtec.getVTEC(msg)
            let ugc = await loader.modules.ugc.getUGC(msg)
            if (vtec != null && ugc != null) { 
                if (vtec.wmo != null) { defaultWmo = vtec.wmo }
                let getCoords = loader.modules.raw.getPolygonCoordinatesByText(msg)
                let getTornado = loader.modules.raw.getStringByLine(msg, `TORNADO...`) ? loader.modules.raw.getStringByLine(msg, `TORNADO...`) : loader.modules.raw.getStringByLine(msg, `WATERSPOUT...`)
                let getMaxHailSize = loader.modules.raw.getStringByLine(msg, `MAX HAIL SIZE...`, [`IN`]) ? loader.modules.raw.getStringByLine(msg, `MAX HAIL SIZE...`, [`IN`]) : loader.modules.raw.getStringByLine(msg, `HAIL...`, [`IN`])
                let getMaxWindGusts = loader.modules.raw.getStringByLine(msg, `MAX WIND GUST...`) ? loader.modules.raw.getStringByLine(msg, `MAX WIND GUST...`) : loader.modules.raw.getStringByLine(msg, `WIND...`)
                let damageThreat = loader.modules.raw.getStringByLine(msg, `DAMAGE THREAT...`)
                let senderOffice = loader.modules.raw.getOfficeName(msg) ? loader.modules.raw.getOfficeName(msg) : vtec.trackingId.split(`-`)[0]
                if (getCoords.length == 0 && wire.ugc_polygons) { getCoords = await loader.modules.ugc.getCoordinates(ugc.zones) }
                let dateLineMatches = [...msg.matchAll(/\d{3,4}\s*(AM|PM)?\s*[A-Z]{2,4}\s+[A-Z]{3,}\s+[A-Z]{3,}\s+\d{1,2}\s+\d{4}/gim)];
                if (dateLineMatches.length > 0) {
                    let dateLineMatch = dateLineMatches[dateLineMatches.length - 1];
                    let nwsStart = msg.lastIndexOf(dateLineMatch[0]);
                    if (nwsStart !== -1) {
                        let latStart = msg.indexOf("&&", nwsStart);
                        if (latStart !== -1) {
                            msg = msg.substring(nwsStart + dateLineMatch[0].length, latStart).trim();
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
                    id: `NWWS-OI-${vtec.trackingId}`,
                    tracking: vtec.trackingId,
                    action: vtec.eventStatus,
                    history: [{desc: msg, act: vtec.eventStatus, time: new Date(metadata.attributes.issue)}],
                    properties: {
                        areaDesc: ugc.locations.join(`; `) || `N/A`,
                        expires: new Date(vtec.expires) == `Invalid Date` ? new Date(new Date().getTime() + 999999 * 60 * 60 * 1000) : new Date(vtec.expires),
                        sent: new Date(metadata.attributes.issue),
                        messageType: vtec.eventStatus,
                        event: `${vtec.eventName} ${vtec.eventSignificance}` || `No Event Found`,
                        sender: senderOffice,
                        senderName: `NWS ${senderOffice}`,
                        description: msg,
                        geocode: { UGC: ugc.zones || []},
                        parameters: { 
                            WMOidentifier: vtec.wmo && vtec.wmo[0] ? [vtec.wmo[0]] : (defaultWmo && defaultWmo[0] ? [defaultWmo[0]] : [`N/A`]),
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

    /**
      * @function xmlAlert
      * @description Processes XML alerts. It parses the XML message, extracts relevant information, and builds an alert object.
      *
      * @param {Object} metadata - The metadata object containing alert information.
      */

    xmlAlert = async function(metadata) {
        let start = new Date().getTime()
        let message = metadata.message.substring(metadata.message.indexOf(`<?xml version="1.0"`), metadata.message.length)
        let xmlData = loader.packages.xml2js.Parser()
        let result = await xmlData.parseStringPromise(message)
        let tracking = result.alert.info[0].parameter.find(p => p.valueName[0] === "VTEC")?.value[0] || "N/A";
        let action = `N/A`;
        if (tracking !== `N/A`) {
            let splitVTEC = tracking.split(`.`);
            tracking = `${splitVTEC[2]}-${splitVTEC[3]}-${splitVTEC[4]}-${splitVTEC[5]}`;
            action = loader.definitions.statusSignatures[splitVTEC[1]];
        }
        if (tracking === `N/A`) {
            action = result.alert.msgType[0];
            tracking = `${result.alert.info[0].parameter.find(p => p.valueName[0] === "WMOidentifier")?.value[0]}-${result.alert.info[0].area[0].geocode.filter(g => g.valueName[0] === "UGC").map(g => g.value[0]).join(`-`)}`;
        }
        let alert = {
            id: `NWWS-OI-${tracking}`,
            tracking: tracking,
            action: action,
            history: [{ desc: result.alert.info[0].description[0], act: action, time: new Date(metadata.attributes.issue) }],
            properties: {
                areaDesc: result.alert.info[0].area[0].areaDesc[0],
                expires: new Date(result.alert.info[0].expires[0]),
                sent: new Date(result.alert.sent[0]),
                messageType: result.alert.msgType[0],
                event: result.alert.info[0].event[0],
                sender: result.alert.sender[0],
                senderName: result.alert.info[0].senderName[0],
                description: result.alert.info[0].description[0],
                geocode: { UGC: result.alert.info[0].area[0].geocode.filter(g => g.valueName[0] === "UGC").map(g => g.value[0]) },
                parameters: {
                    WMOidentifier: [result.alert.info[0].parameter.find(p => p.valueName[0] === "WMOidentifier")?.value[0] || "N/A"],
                    tornadoDetection: result.alert.info[0].parameter.find(p => p.valueName[0] === "tornadoDetection")?.value[0] || result.alert.info[0].parameter.find(p => p.valueName[0] === "waterspoutDetection")?.value[0] || "N/A",
                    maxHailSize: result.alert.info[0].parameter.find(p => p.valueName[0] === "maxHailSize")?.value[0] || "N/A",
                    maxWindGust: result.alert.info[0].parameter.find(p => p.valueName[0] === "maxWindGust")?.value[0] || "N/A",
                    thunderstormDamageThreat: [result.alert.info[0].parameter.find(p => p.valueName[0] === "thunderstormDamageThreat")?.value[0] || result.alert.info[0].parameter.find(p => p.valueName[0] === "tornadoDamageThreat")?.value[0] || "N/A"],
                },
            },
        };
        if (result.alert.info[0].area[0].polygon != undefined) {
            alert.geometry = { type: "Polygon", coordinates: [result.alert.info[0].area[0].polygon[0].split(" ").map(coord => {let [lat, lon] = coord.split(",").map(parseFloat);return [lon, lat];})], };
        }
        let filter = loader.modules.parsing.filterAlerts([alert]);
        let coordFilter = loader.modules.parsing.coordsToMiles(filter)
        if (coordFilter.length == 0) { return }
        loader.modules.listener.processValidAlerts(coordFilter, `XML`, `${new Date().getTime() - start}ms`);
    }
}


module.exports = AlertBuilder;