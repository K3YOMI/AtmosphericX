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


let loader = require(`../loader.js`)


class Parsing { 
    constructor() {
        this.name = `Parsing`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function rawIemReports
      * @description Read the raw IEM reports and parse them into an array of objects.
      * 
      * @param {string} messageBody - The raw IEM reports to read
      */

    rawIemReports = function(messageBody=``) {
        let reports = [];
        for (let i = 0; i < messageBody.length; i++) {
            let properties = messageBody[i].properties;
            if (!properties.remark) { properties.remark = 'No Description'; }
            if (!properties.magf) { properties.magf = 'N/A'; properties.unit = ''; }
            reports.push({
                location: `${properties.county}, ${properties.state}`,
                expires: properties.valid.replace('T', ' ').replace('Z', ''),
                issued: new Date().toISOString(),
                event: properties.typetext,
                sender: `Iowa Environmental Mesonet (API)`,
                description: `${properties.remark} - ${properties.city} | ${properties.magf} ${properties.unit}`,
                latitude: parseFloat(properties.lat),
                longitude: parseFloat(properties.lon),
            })
        }
        return { success: true, message: reports };
    }

    /**
      * @function rawRawMpingReports
      * @description Read the raw mPing reports and parse them into an array of objects.
      * 
      * @param {string} messageBody - The raw mPing reports to read
      */

    rawRawMpingReports = function(messageBody=``) {
        let regex = /Icon:.*?([\d.-]+),([\d.-]+),\d+,\d+,\d+, "Report Type: (.*?)\\nTime of Report: (.*?)"/g;
        let matches = [...messageBody.matchAll(regex)];
        let reports = [];
        for (let i = 0; i < matches.length; i++) {
            let match = matches[i];
            let latitude = parseFloat(match[1]);
            let longitude = parseFloat(match[2]);
            let eventType = match[3];
            let reportTime = match[4];
            reports.push({
                location: `${latitude}, ${longitude}`,
                expires: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
                issued: reportTime,
                event: eventType,
                sender: `mPing`,
                description: `No Description`,
                latitude: latitude,
                longitude: longitude,
            })
        }
        return { success: true, message: reports };
    }

    /**
      * @function rawSpotterNetworkReports
      * @description Read the raw Spotter Network reports and parse them into an array of objects.
      * 
      * @param {string} messageBody - The raw Spotter Network reports to read
      */

    rawSpotterNetworkReports = function(messageBody = ``) {
        let regex = /Icon:\s*([\d.-]+),([\d.-]+),\d+,\d+,\d+,"Reported By: ([^\n]*)\\n([^\n]*)\\nTime: ([^\n]*) UTC(?:\\nSize: ([^\\n]*))?\\nNotes:([\s\S]*?)"/g;
        let matches = [...messageBody.matchAll(regex)];
        let reports = [];
        for (let i = 0; i < matches.length; i++) {
            let match = matches[i];
            let latitude = parseFloat(match[1]);
            let longitude = parseFloat(match[2]);
            let reporter = match[3].trim();
            let eventType = match[4].trim();
            let reportTime = match[5].trim();
            let size = match[6] ? match[6].replace(/"/g, '').trim() : '';
            let notes = match[7] ? match[7].replace(/\\n/g, ' ').replace(/"/g, '').trim() : '';
            let description = `Reported By: ${reporter} | ${eventType}` + (size ? ` | Size: ${size}` : '') + (notes ? ` | Notes: ${notes}` : '');
                reports.push({
                location: `${latitude}, ${longitude}`,
                latitude: latitude,
                longitude: longitude,
                issued: reportTime,
                expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                event: eventType,
                reporter: reporter,
                size: size,
                notes: notes,
                sender: "Spotter Network",
                description: description
            });
        }
        return { success: true, message: reports };
    };

    /**
      * @function readRawGrlevelXReports
      * @description Read the raw GrlevelX reports and parse them into an array of objects.
      * 
      * @param {string} messageBody - The raw GrlevelX reports to read
      */

    readRawGrlevelXReports = function(messageBody=``) {
        let regex = /(\w+)\|(\d{4}\/\d{2}\/\d{2})\|(\d{2}:\d{2})\|([\d.-]+)\|([\d.-]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)/g;
        let matches = [...messageBody.matchAll(regex)];
        let reports = [];
        for (let i = 0; i < matches.length; i++) {
            let match = matches[i];
            let date = match[2];
            let time = match[3];
            let latitude = parseFloat(match[4]);
            let longitude = parseFloat(match[5]);
            let eventType = match[6];
            let magnitude = match[7];
            let state = match[8];
            let county = match[9];
            let location = match[10];
            let source = match[11];
            reports.push({
                location: `${location}, ${county}, ${state}`,
                expires: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
                issued: `${date} ${time}`,
                event: eventType,
                sender: source,
                description: `${eventType} reported with magnitude ${magnitude} at ${location}, ${county}, ${state}`,
                magnitude: magnitude,
                latitude: latitude,
                longitude: longitude,
            })
        }
        return { success: true, message: reports };
    }

    /**
      * @function readRawMesoscaleDicussions
      * @description Read the raw mesoscale discussions and parse them into an array of objects.
      * 
      * @param {string} messageBody - The raw mesoscale discussions to read
      */

    readRawMesoscaleDicussions = function(messageBody=``) {
        let discussions = messageBody.split('#################################################################################################################');
        let parsedDiscussions = discussions.map(discussion => {
            let regex = /Icon:.*?1, 1, "(.*?)"/g;
            let matches = [...discussion.matchAll(regex)];
            let discussionText = '';
            for (let i = 0; i < matches.length; i++) {
                let match = matches[i];
                let text = match[1];
                discussionText += text;
            }
            discussionText = discussionText.replace(/<a href=/g, '');
            return discussionText.trim();
        });
        parsedDiscussions = parsedDiscussions.filter(discussion => discussion !== '');
        return { success: true, message: parsedDiscussions };
    }

    /**
      * @function readSpotterNetwork
      * @description Read the placefile data and parse it into an array of objects.
      * This includes the coordinates, description, and status of the spotter network members.
      * Additionally, you can use this to filter the alerts based on the configuration settings.
      * 
      * (This can can be also seen through the map widget)
      * 
      * @param {string} messageBody - The placefile data to read
      */

    readSpotterNetwork = function(messageBody=``) { 
        let locationServices = loader.cache.configurations.sources.miscellaneous_sources.location_services
        let r1 = /Object:\s*([\d.-]+),([\d.-]+)\s*Icon:.*?"(.*?)\n.*?Text:.*?"(.*?)"/g;
        let r2 = /Object:\s*([\d.-]+),([\d.-]+)\s*Icon:.*?"(.*?)\n.*?Icon:.*?"(.*?)\n.*?Text:.*?"(.*?)"/g;
        let r3 = /Object:\s*([\d.-]+),([\d.-]+)\s*$/g;
        let regExpression = new RegExp(r1.source + '|' + r2.source + '|' + r3.source, 'gs');
        let spotters = []
        let matches = [... messageBody.matchAll(regExpression)]
        for (let i = 0; i < matches.length; i++) {
            let match = matches[i]
            let lat = match[1]
            let lon = match[2]
            let meta = match[0]
            let description = match[3] == undefined ? "N/A" : match[3];

            let isActive = meta.includes('Icon: 0,0,000,6,2') && locationServices.spotter_network.show_active ? 1 : 0;
            let isStreaming = meta.includes('Icon: 0,0,000,1,19') && locationServices.spotter_network.show_streaming ? 1 : 0;
            let isIdle = meta.includes('Icon: 0,0,000,6,6') && locationServices.spotter_network.show_idle ? 1 : 0;

            if (locationServices.realtimeirl.enabled == false) {
                if (locationServices.spotter_network.tracking_name != `SPOTTER_ATTRIBUTE_HERE` && locationServices.spotter_network.tracking_name != ``) {
                    if (description.toLowerCase().includes(locationServices.spotter_network.tracking_name.toLowerCase())) {
                        if (typeof loader.cache.realtime != `object`) { loader.cache.realtime = {} }
                        loader.cache.realtime.lat = lat;
                        loader.cache.realtime.lon = lon;
                        if (loader.cache.realtime.location == undefined) {
                            loader.cache.realtime.address = `N/A`;
                            loader.cache.realtime.location = `N/A`;
                            loader.cache.realtime.county = `N/A`;
                            loader.cache.realtime.state = `N/A`;
                        }
                    }
                }
            }
            if (isActive == 1 && locationServices.spotter_network.show_active == false) { continue; }
            if (isStreaming == 1 && locationServices.spotter_network.show_streaming == false) { continue; }
            if (isIdle == 1 && locationServices.spotter_network.show_idle == false) { continue; }
            if (isActive == 0 && isStreaming == 0 && isIdle == 0 && locationServices.spotter_network.show_offline == false) { continue; }
            spotters.push({ lat: lat, lon: lon, description: description, active: isActive, streaming: isStreaming, idle: isIdle })
        }
        let uniqueFilter = spotters.filter((thing, index, self) => index === self.findIndex((t) => (t.description === thing.description && t.lat === thing.lat && t.lon === thing.lon)));
        return {success: true, message: uniqueFilter}
    }

    /**
     * @function rawProbabilityReports
     * @description Read the raw probability reports and parse them into an array of objects.
     * 
     * @param {string} messageBody - The raw probability reports to read
     * @param {string} type - The type of probability report to read (severe or tornado)
     */
    
    rawProbabilityReports = function(messageBody=``, type=`tornado`) {
        let typeMap = { severe: { key: "PSv3", label: "Severe" }, tornado: { key: "ProbTor", label: "Tornado" }};
        let objects = [];
        let lines = messageBody.split('\n');
        let seenIds = new Set();
        let i = 0;
        while (i < lines.length) {
            let line = lines[i];
            if (line.startsWith("Color:")) {
                let infoLine = lines[i + 1] || "";
                let details = infoLine.match(/PSv3: ([\d.]+)%; PHv3: ([\d.]+)%; PWv3: ([\d.]+)%; PTv3: ([\d.]+)%|ProbTor: ([\d.]+)%/);
                let objectIdMatch = infoLine.match(/Object ID: (\d+)/);
                let objectId = objectIdMatch ? objectIdMatch[1] : "";
                let meta = { 
                    objectId: objectId, 
                    info: infoLine.replace(/Line: \d+, \d+,\s*/, '').trim(),
                    PSv3: details && details[1] ? parseFloat(details[1]) : null, 
                    PHv3: details && details[2] ? parseFloat(details[2]) : null, 
                    PWv3: details && details[3] ? parseFloat(details[3]) : null, 
                    PTv3: details && details[4] ? parseFloat(details[4]) : null,
                    ProbTor: details && details[5] ? parseFloat(details[5]) : null
                };
                // Skip storing coordinates to save memory
                let j = i + 2;
                while (j < lines.length && !lines[j].startsWith("End:") && !lines[j].startsWith("Color:")) {
                    j++;
                }
                let key = typeMap[type] ? typeMap[type].key : "PSv3";
                if (meta[key] !== null && !seenIds.has(meta.objectId)) {
                    objects.push({ id: meta.objectId, type: type, probability: meta[key], description: meta.info});
                    seenIds.add(meta.objectId);
                }
                i = j;
            } else {
                i++;
            }
        }
        let typeThreshold = type === `tornado` ? loader.cache.configurations.sources.miscellaneous_sources.tornado_probability.threshold : loader.cache.configurations.sources.miscellaneous_sources.severe_probability.threshold;
        objects = objects.filter(object => object.probability >= typeThreshold);
        return { success: true, message: objects };
    }

    readWxRadio = function(messageBody=``) {
        let feeds = []
        for (let i = 0; i < messageBody.sources.length; i++) {
            let feed = messageBody.sources[i];
            let location = feed.location || `N/A`
            let lat = feed.lat || `N/A`
            let lon = feed.lon || `N/A`
            let callsign = feed.callsign || `N/A`
            let frequency = feed.freq || `N/A`
            let stream = feed.listen_url || `No stream available`
            feeds.push({location: location,lat: lat,lon: lon, callsign: callsign,frequency: frequency,stream: stream})
        }
        return { success: true, message: feeds }
    }

    /**
     * @function coordsToMiles
     * @description Check if the coordinates are within the specified miles of the a spotter network member's location
     * This is a convoluted way of checking but it works, feel free to make PR requests to improve this function. 
     * This will filter out alerts that are not within the specified miles of the spotter network member's location.
     * 
     * @param {object} alerts - The array of alerts to check
     */

    coordsToMiles = function(alerts) {
        if (loader.cache.realtime == undefined || loader.cache.configurations.sources.miscellaneous_sources.location_services.alert_filtering == false) { return alerts; }
        let maxMiles = loader.cache.configurations.sources.miscellaneous_sources.location_services.max_miles;
        alerts = alerts.filter(alert => {
            if (!alert.geometry || !alert.geometry.coordinates || !alert.geometry.coordinates[0]) { return false; }
            let warningCoords = alert.geometry.coordinates[0];
            if (!Array.isArray(warningCoords) || warningCoords.length === 0) { return false; }
            let centerPolygon = warningCoords.reduce((acc, coord) => { acc[0] += coord[0]; acc[1] += coord[1]; return acc; }, [0, 0]).map(sum => sum / warningCoords.length);
            if (!loader.cache.realtime || !loader.cache.realtime.lat || !loader.cache.realtime.lon) { return false; }
            let lat1 = parseFloat(loader.cache.realtime.lat);
            let lon1 = parseFloat(loader.cache.realtime.lon);
            let lat2 = parseFloat(centerPolygon[1]);
            let lon2 = parseFloat(centerPolygon[0]);
            let R = 3959;
            let dLat = (lat2 - lat1) * Math.PI / 180;
            let dLon = (lon2 - lon1) * Math.PI / 180;
            let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            let distance = R * c;
            return distance <= maxMiles;
        });
        return alerts;
    }

    /**
      * @function isAlreadyCancelled
      * @description Check if the alert is already cancelled
      * 
      * @param {object} alert - The alert object to check
      */

    isAlreadyCancelled = function(alert) {
        let signatures = loader.definitions.cancelSignatures
        let description = alert.properties.description
        let type = alert.properties.messageType
        let isCancelledDescirption = signatures.filter(signature => description.toLowerCase().includes(signature.toLowerCase()))
        if (isCancelledDescirption.length != 0 || type == `Cancel`) { return true; }
    }

    /**
      * @function doesAlertExist
      * @description Check if the alert already exists in the array
      * 
      * @param {object} array - The array to check
      * @param {string} id - The id of the alert to check
      */

    doesAlertExist = function(array, id) {
        let exists = array.filter(item => item.id == id)
        if (exists == undefined || exists.length == 0) { return false; }
        return true 
    }

    /**
      * @function filterAlerts
      * @description Filter the alerts based on the configuration settings
      * 
      * @param {object} alerts - The array of alerts to filter
      */

    filterAlerts = function(alerts) {
        let priortityAlerts = loader.cache.configurations.project_settings.priority_alerts 
        let allowedEvents = loader.cache.configurations.project_settings.priority
        let forecastOffices = loader.cache.configurations.sources.filter.nws_office_filter;
        let exludedForecaseOffices = loader.cache.configurations.sources.filter.nws_office_exclude_filter;
        let ugcCodes = loader.cache.configurations.sources.filter.ugc_filter;
        let abbreviatedStatesFilter = loader.cache.configurations.sources.filter.abbreviated_states_filter;
        if (priortityAlerts == true) { alerts = alerts.filter(alert => allowedEvents.includes(alert.properties.event)) }
        alerts.forEach(alert => { if (!alert.properties?.parameters?.WMOidentifier?.length) alert.properties.parameters = { WMOidentifier: [`No WMO Found`] }; });
        if (abbreviatedStatesFilter.length != 0) { alerts = alerts.filter(alert => { let ugcCodes = alert.properties.geocode.UGC; if (!Array.isArray(ugcCodes) || ugcCodes.length === 0) { return false; } return ugcCodes.some(code => abbreviatedStatesFilter.includes(code.substring(0, 2))); }); }
        if (exludedForecaseOffices.length != 0) { alerts = alerts.filter(alert => !exludedForecaseOffices.includes(alert.properties.parameters.WMOidentifier[0].split(' ')[1])); }
        if (forecastOffices.length != 0) { alerts = alerts.filter(alert => forecastOffices.includes(alert.properties.parameters.WMOidentifier[0].split(' ')[1])); }
        if (ugcCodes.length != 0) { alerts = alerts.filter(alert => alert.properties.geocode.UGC.some(code => ugcCodes.includes(code))); }
        alerts = alerts.filter(alert => new Date(alert.properties.expires).getTime() > new Date().getTime()); 
        return alerts
    }

    /**
      * @function readAlerts
      * @description Read the alerts from the data and filter them based on the configuration settings
      * 
      * @param {object} alerts - The data object to read the alerts from
      */

    readAlerts = function(alerts) {
        let tAlerts = []
        let features = alerts.features.filter(feature => feature !== undefined);   
        let filtering = this.filterAlerts(features)
        let coordFilter = this.coordsToMiles(filtering)
        for (let i = 0; i < coordFilter.length; i++) {
            let index = coordFilter[i]
            if (index.properties.description != null) { if (this.isAlreadyCancelled(index)) { continue; } }
            if (this.doesAlertExist(tAlerts, index.id)) { continue; }
            index = JSON.parse(JSON.stringify(index));
            let registration = loader.modules.building.registerEvent(index);
            let alertHash = loader.packages.crypto.createHash('sha1').update(JSON.stringify(registration)).digest('hex');
            if (loader.cache.logging.findIndex(log => log.id == alertHash) == -1) {
                loader.modules.hooks.createOutput(`${this.name}`, `[!] Alert ${registration.details.type} >> ${registration.details.name} (${(registration.raw.tracking === undefined? (registration.raw.properties.parameters.WMOidentifier && registration.raw.properties.parameters.WMOidentifier[0] !== undefined? registration.raw.properties.parameters.WMOidentifier[0]: `No ID found`): registration.raw.tracking)})`)
                loader.cache.logging.push({ id: alertHash, expires: registration.details.expires});
                loader.modules.hooks.youveGotMail(`${registration.details.name} (${registration.details.type})`, `Locations: ${registration.details.locations}\nIssued: ${new Date(registration.details.issued).toLocaleString()}\nExpires: ${new Date(registration.details.expires).toLocaleString()}\nWind Gusts: ${registration.details.wind}\nHail Size: ${registration.details.hail}\nDamage Threat: ${registration.details.damage}\nTornado ${registration.details.tornado}\nTags: ${registration.details.tag.join(', ')}\nSender: ${registration.details.sender}\nTracking ID: ${(registration.raw.tracking === undefined? (registration.raw.properties.parameters.WMOidentifier && registration.raw.properties.parameters.WMOidentifier[0] !== undefined? registration.raw.properties.parameters.WMOidentifier[0]: `No ID found`): registration.raw.tracking)}`)
                loader.modules.hooks.sendWebhook(`${registration.details.name} (${registration.details.type})`,`**Locations:** ${registration.details.locations}\n**Issued:** ${new Date(registration.details.issued).toLocaleString()}\n**Expires:** ${new Date(registration.details.expires).toLocaleString()}\n**Wind Gusts:** ${registration.details.wind}\n**Hail Size:** ${registration.details.hail}\n**Damage Threat:** ${registration.details.damage}\n**Tornado** ${registration.details.tornado}\n**Tags:** ${registration.details.tag.join(', ')}\n**Sender:** ${registration.details.sender}\n**Tracking ID:** ${(registration.raw.tracking === undefined? (registration.raw.properties.parameters.WMOidentifier && registration.raw.properties.parameters.WMOidentifier[0] !== undefined? registration.raw.properties.parameters.WMOidentifier[0]: `No ID found`): registration.raw.tracking)}\n\n\`\`\`\n${registration.details.description.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n')}\n\`\`\`\n`);
                if (loader.cache.configurations.sources.miscellaneous_sources.character_ai.auto_alert) {
                    loader.modules.character.commitChat(`${loader.cache.configurations.sources.miscellaneous_sources.character_ai.prefix} ${registration.details.description}`).then((response) => {
                        if (response.success == true) { loader.cache.chatbot = {message: response.message, image: loader.cache.configurations.sources.miscellaneous_sources.character_ai.image} }
                    })
                }
            
            }
            if (Object.keys(registration).length != 0) {
                if (registration.details.ignored == true) { continue; }
                tAlerts.push(registration);
            }
        }
        return {success: true, message: tAlerts}
    }
}

module.exports = Parsing;