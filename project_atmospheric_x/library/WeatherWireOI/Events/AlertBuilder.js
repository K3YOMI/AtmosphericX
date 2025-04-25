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
  * @class AlertBuilder
  * @description The `AlertBuilder` class is responsible for constructing and processing weather alerts based on raw or XML messages. 
  * It processes messages using either raw text or XML format and builds alerts accordingly.
  * 
  * @constructor
  * 
  * @param {Object} [_metdata={}] The metadata object containing the message, attributes, and XML flag.
  * @param {string} [_xml=false] Indicates whether the message is in XML format.
  */

class AlertBuilder {
    constructor(_metdata={}, _xml=false) {
        this.author = `k3yomi@GitHub`
        this.name = `AlertBuilder`
        this.production = true
        this.message = _metdata.message
        this.attributes = _metdata.attributes
        this.xml = _metdata.xml
        this.alerts = []
        if (!this.xml) {this._RawTextProduct()}
        if (this.xml) {this._XmlProduct()}
    }

    /**
      * @method _RawTextProduct
      * @description Processes raw weather alert messages, parses VTEC and UGC data, extracts relevant details like polygon coordinates, wind gusts, hail size, damage threats, and more. It constructs alert objects and sends them for further processing.
      * 
      * @async
      * @returns {Promise<void>} A promise that resolves once the alert processing is complete.
      */

    async _RawTextProduct() {
        let start = new Date().getTime()
        let message = this.message.split(/(?=\$\$)/g)
        let messages = message.map(msg => msg.trim());
        let configurations = cache.configurations.definitions
        for (let i = 0; i < messages.length; i++) {
            let msg = message[i]
            let vtec_h = new VTECParser(msg, configurations)
            let ugc_h = new UGCParser(msg, configurations)
            let raw_h = new RawParser(msg)
            let vtec = await vtec_h.ParseVTEC()
            let ugc = await ugc_h.ParseUGC()
            if (vtec != null && ugc != null) {
                let coords = await raw_h.GetPolygonCoordinatesByText()
                if (coords.length == 0) { coords = await ShapefileManager.GetCoordinates(ugc.zones) }
                let tornado = await raw_h.GetTornado()
                let hail = await raw_h.GetHailSize()
                let wind = await raw_h.GetWindGusts()
                let damage = await raw_h.GetDamageThreat()
                let office = (await raw_h.GetOfficeName() != `N/A` ? `${await raw_h.GetOfficeName()}` : `No Text Found`)
                let alert = {
                    id: `NWWS-OI-${vtec.tracking_id}`,
                    tracking: vtec.tracking_id,
                    action: vtec.event_status,
                    history: [{desc: msg, act: vtec.event_status, time: new Date(this.attributes.issue)}],
                    properties: {
                        areaDesc: ugc.locations.join(`; `) || `N/A`,
                        expires: new Date(vtec.expires) == `Invalid Date` ? new Date(new Date().getTime() + 9999999 * 60 * 60 * 1000) : new Date(vtec.expires),
                        sent: new Date(this.attributes.issue),
                        messageType: vtec.event_status,
                        event: `${vtec.event_name} ${vtec.event_significance}` || "N/A",
                        sender: office,
                        senderName: office == 'No Text Found' ? `No Text Found` : `NWS ${office}`,
                        description: msg,
                        geocode: { UGC: ugc.zones || [] },
                        parameters: {
                            tornadoDetection: tornado || "N/A",
                            maxHailSize: hail || "N/A",
                            maxWindGust: wind || "N/A",
                            thunderstormDamageThreat: [damage || "N/A"],
                        },
                    },
                    geometry: {
                        type: `Polygon`,
                        coordinates: [coords]
                    },
                    type: `Feature`,
                }
                this.alerts.push(alert)
            }
        }
        let filter = await Parsing._FilterNWSAlertsv2(this.alerts)
        let filterd = filter.warnings.concat(filter.watches).concat(filter.unknown)
        for (let i = 0; i < filterd.length; i++) {
            NOAAWeatherWireService.ProcessValidAlert(filterd[i], `RAW`, `${new Date().getTime() - start}ms`)
        }
        return filterd
    }

    /**
      * @method _XmlProduct
      * @description Parses an XML weather alert message and processes it into a structured alert object, extracting VTEC information, event details, and associated parameters. The alert is then filtered and processed for further use.
      * 
      * @async
      * @returns {Promise<void>} A promise that resolves once the XML alert processing is complete.
      */

    async _XmlProduct() {
        let start = new Date().getTime()
        let message = this.message.substring(this.message.indexOf(`<?xml version="1.0"`), this.message.length)
        let xml_data = new xml2js.Parser()
        let result = await xml_data.parseStringPromise(message)
        let tracking = result.alert.info[0].parameter.find(p => p.valueName[0] === "VTEC")?.value[0] || "N/A"
        let action = `N/A`
        if (tracking != `N/A`) {
            let vtec_parts = tracking.split(`.`)
            let office_id = vtec_parts[2]
            let significance = vtec_parts[4]
            let etn = vtec_parts[5]
            tracking = `${office_id}-${significance}-${etn}`
            action = cache.configurations.definitions.status_signatures[vtec_parts[1]]
        }
        let alert = {
            id: `NWWS-OI-${tracking}`,
            tracking: tracking,
            action: action,
            history: [{desc: result.alert.info[0].description[0], act: action, time: new Date(this.attributes.issue)}],
            properties: {
                areaDesc: result.alert.info[0].area[0].areaDesc[0],
                expires: result.alert.info[0].expires[0],
                sent: result.alert.sent[0],
                messageType: result.alert.msgType[0],
                event: result.alert.info[0].event[0],
                sender: result.alert.sender[0],
                senderName: result.alert.info[0].senderName[0],
                description: result.alert.info[0].description[0],
                geocode: { UGC: result.alert.info[0].area[0].geocode.filter(g => g.valueName[0] === "UGC").map(g => g.value[0]) },
                parameters: {
                    tornadoDetection: result.alert.info[0].parameter.find(p => p.valueName[0] === "tornadoDetection")?.value[0] || "N/A",
                    maxHailSize: result.alert.info[0].parameter.find(p => p.valueName[0] === "maxHailSize")?.value[0] || "N/A",
                    maxWindGust: result.alert.info[0].parameter.find(p => p.valueName[0] === "maxWindGust")?.value[0] || "N/A",
                    thunderstormDamageThreat: [result.alert.info[0].parameter.find(p => p.valueName[0] === "thunderstormDamageThreat")?.value[0] || "N/A"],
                },
            },
        }
        if (result.alert.info[0].area[0].polygon != undefined) {
            alert.geometry = { type: "Polygon", coordinates: [result.alert.info[0].area[0].polygon[0].split(" ").map(coord => {const [lat, lon] = coord.split(",").map(parseFloat);return [lon, lat];})], };
        } 
        this.alerts.push(alert)
        let filter = await Parsing._FilterNWSAlertsv2(this.alerts)
        let filterd = filter.warnings.concat(filter.watches).concat(filter.unknown)
        for (let i = 0; i < filterd.length; i++) {
            NOAAWeatherWireService.ProcessValidAlert(filterd[i], `XML`, `${new Date().getTime() - start}ms`)
        }
        return filterd
    }
}

module.exports = AlertBuilder