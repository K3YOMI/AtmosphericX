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
     * @function rawCape
     * @description Read the raw cape data and parse it into a placefile.
     * 
     * @param {number} lat - The latitude to read the cape data for
     * @param {number} lon - The longitude to read the cape data for
     */

    rawCape = async function(lat, lon) {
        if (!lat || !lon) return { success: false, message: "Latitude and Longitude are required" };
        loader.cache.cape = loader.cache.cape?.filter(c => new Date(c.expires) > new Date()) || [];
        let places = [];
        let sideLength = 10.666, gridSize = 4, step = sideLength / (gridSize - 1);
        let promises = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                let gridLat = lat - sideLength / 2 + i * step;
                let gridLon = lon - sideLength / 2 + j * step;
                let cachedCape = loader.cache.cape.find(c => c.lat == gridLat && c.lon == gridLon);
                if (cachedCape && new Date(cachedCape.expires) > new Date()) {
                    places.push({ title: `Expires: ${cachedCape.expires}\nTime: ${cachedCape.time}`, description: `${cachedCape.cape} J/kg`, point: [gridLon, gridLat], rgb: "255,0,0,255", icon: "0,0,000,6,4" });
                } else {
                    promises.push(loader.modules.hooks.convertCoordinatesToRequest(loader.definitions.static_apis.cape_coordinates, gridLat, gridLon).then(toData => {
                        if (toData !== "err") {
                            let index = toData.hourly.time.findIndex(t => new Date(t).getTime() >= new Date().getTime());
                            if (index !== -1 && toData.hourly.cape[index] !== undefined) {
                                let expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
                                places.push({ title: `Expires: ${expires}\nTime: ${toData.hourly.time[index]}`, description: `${toData.hourly.cape[index]} J/kg`, point: [gridLon, gridLat], rgb: "255,0,0,255", icon: "0,0,000,6,4" });
                                loader.cache.cape.push({ lat: gridLat, lon: gridLon, cape: toData.hourly.cape[index], expires: expires, time: toData.hourly.time[index] });
                            }
                        } else {
                            places.push({ title: `Expires: ${new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()}\nTime: N/A`, description: "N/A", point: [gridLon, gridLat], rgb: "255,0,0,255", icon: "0,0,000,6,4" });
                        }
                    }));
                }
            }
        }
        await Promise.all(promises);
        loader.modules.placefiles.createPlacefilePoint(1, 999, `AtmosphericX Cape - ${new Date().toUTCString()}`, places, "cape");
        return { success: true, message: "Cape data processed and placefile created" };
    }

    /**
      * @function rawIemReports
      * @description Read the raw IEM reports and parse them into an array of objects.
      * 
      * @param {string} messageBody - The raw IEM reports to read
      */

    rawIemReports = function(messageBody = ``) {
        let reports = messageBody.map(({ properties }) => {
            let remark = properties.remark || 'No Description';
            let magf = properties.magf || 'N/A';
            let unit = properties.unit || '';
            return {
                location: `${properties.county}, ${properties.state}`,
                event: properties.typetext,
                sender: 'Iowa Environmental Mesonet (API)',
                description: `${remark} - ${properties.city} | ${magf} ${unit}`,
                latitude: parseFloat(properties.lat),
                longitude: parseFloat(properties.lon),
            };
        });
        return { success: true, message: reports };
    }

    /**
      * @function rawRawMpingReports
      * @description Read the raw mPing reports and parse them into an array of objects.
      * 
      * @param {string} messageBody - The raw mPing reports to read
      */

    rawRawMpingReports = function(messageBody = ``) {
        let regex = /Icon:.*?([\d.-]+),([\d.-]+),\d+,\d+,\d+, "Report Type: (.*?)\\nTime of Report: (.*?)"/g;
        let matches = [...messageBody.matchAll(regex)];
        let reports = matches.map(match => {
            if (match[3] == `NULL`) return;
            return {
                location: `${match[1]}, ${match[2]}`,
                event: match[3],
                sender: `mPing`,
                description: `No Description`,
                latitude: parseFloat(match[1]),
                longitude: parseFloat(match[2]),
            };
        }).filter(Boolean);
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
        let reports = matches.map(match => {
            let [latitude, longitude] = [parseFloat(match[1]), parseFloat(match[2])];
            let reporter = match[3].trim();
            let eventType = match[4].trim();
            let reportTime = match[5].trim();
            let size = match[6]?.replace(/"/g, '').trim() || '';
            let notes = match[7]?.replace(/\\n/g, ' ').replace(/"/g, '').trim() || '';
            let description = `Reported By: ${reporter} | ${eventType}` + (size ? ` | Size: ${size}` : '') + (notes ? ` | Notes: ${notes}` : '');
            return {
                location: `${latitude}, ${longitude}`,
                latitude,
                longitude,
                event: eventType,
                reporter,
                size,
                notes,
                sender: "Spotter Network",
                description
            };
        });
        return { success: true, message: reports };
    };

    /**
      * @function readRawGrlevelXReports
      * @description Read the raw GrlevelX reports and parse them into an array of objects.
      * 
      * @param {string} messageBody - The raw GrlevelX reports to read
      */

    readRawGrlevelXReports = function(messageBody = ``) {
        let regex = /(\w+)\|(\d{4}\/\d{2}\/\d{2})\|(\d{2}:\d{2})\|([\d.-]+)\|([\d.-]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)/g;
        let matches = [...messageBody.matchAll(regex)];
        let reports = matches.map(match => {
            let [_, eventType, date, time, latitude, longitude, magnitude, state, county, location, source] = match;
            return {
                location: `${location}, ${county}, ${state}`,
                event: eventType,
                sender: source,
                description: `${eventType} reported with magnitude ${magnitude} at ${location}, ${county}, ${state}`,
                magnitude,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
            };
        });
        return { success: true, message: reports };
    }

    /**
      * @function readRawMesoscaleDicussions
      * @description Read the raw mesoscale discussions and parse them into an array of objects.
      * 
      * @param {string} messageBody - The raw mesoscale discussions to read
      */

    readRawMesoscaleDicussions = function(messageBody = ``) {
        let discussions = messageBody.split('#################################################################################################################');
        let parsedDiscussions = discussions.map(discussion => {
            let matches = [...discussion.matchAll(/Icon:.*?1, 1, "(.*?)"/g)];
            let discussionText = matches.map(match => match[1]).join('').replace(/<a href=/g, '').trim();
            return discussionText;
        }).filter(discussion => discussion !== '');
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

    readSpotterNetwork = function(messageBody = ``) {
        let { spotter_network, rtlirl } = loader.cache.configurations.sources.miscellaneous_sources.location_services;
        let r1 = /Object:\s*([\d.-]+),([\d.-]+)\s*Icon:.*?"(.*?)\n.*?Text:.*?"(.*?)"/g;
        let r2 = /Object:\s*([\d.-]+),([\d.-]+)\s*Icon:.*?"(.*?)\n.*?Icon:.*?"(.*?)\n.*?Text:.*?"(.*?)"/g;
        let r3 = /Object:\s*([\d.-]+),([\d.-]+)\s*$/g;
        let regExpression = new RegExp(r1.source + '|' + r2.source + '|' + r3.source, 'gs');
        let matches = [...messageBody.matchAll(regExpression)];
        let spotters = matches.map(match => {
            let lat = match[1] || match[5] || match[9];
            let lon = match[2] || match[6] || match[10];
            let description = match[3] || match[7] || "N/A";
            let meta = match[0];
            let isActive = meta.includes('Icon: 0,0,000,6,2,') && spotter_network.show_active ? 1 : 0;
            let isStreaming = meta.includes('Icon: 0,0,000,1,19,') && spotter_network.show_streaming ? 1 : 0;
            let isIdle = meta.includes('Icon: 0,0,000,6,6,') && spotter_network.show_idle ? 1 : 0;
            let distance = 99999;
            if (loader.cache.location) {
                distance = loader.modules.hooks.getMilesAway(lat, lon, loader.cache.location.lat, loader.cache.location.lon)
            }
            if (!rtlirl.enabled && spotter_network.tracking_name && description.toLowerCase().includes(spotter_network.tracking_name.toLowerCase())) {
                loader.modules.hooks.gpsTracking(lat, lon, `SpotterNetwork`);
            }
            if ( (isActive && !spotter_network.show_active) || (isStreaming && !spotter_network.show_streaming) || (isIdle && !spotter_network.show_idle) || (!isActive && !isStreaming && !isIdle && !spotter_network.show_offline) ) return null;
            return { lat, lon, description, active: isActive, streaming: isStreaming, idle: isIdle, distance };
        }).filter(Boolean);
        let uniqueSpotters = spotters.filter((spotter, index, self) =>
            index == self.findIndex(s => s.description == spotter.description && s.lat == spotter.lat && s.lon == spotter.lon)
        );
        return { success: true, message: uniqueSpotters };
    }

    /**
     * @function rawProbabilityReports
     * @description Read the raw probability reports and parse them into an array of objects.
     * 
     * @param {string} messageBody - The raw probability reports to read
     * @param {string} type - The type of probability report to read (severe or tornado)
     */
    
    rawProbabilityReports = function(messageBody = ``, type = `tornado`) {
        let typeMap = { severe: { key: "PSv3", label: "Severe" }, tornado: { key: "ProbTor", label: "Tornado" } };
        let objects = [], lines = messageBody.split('\n'), seenIds = new Set(), i = 0;
        while (i < lines.length) {
            let line = lines[i];
            if (line.startsWith("Color:")) {
                let infoLine = lines[i + 1] || "";
                let details = infoLine.match(/PSv3: ([\d.]+)%; PHv3: ([\d.]+)%; PWv3: ([\d.]+)%; PTv3: ([\d.]+)%|ProbTor: ([\d.]+)%/);
                let objectIdMatch = infoLine.match(/Object ID: (\d+)/);
                let objectId = objectIdMatch ? objectIdMatch[1] : "";
                let meta = { 
                    objectId, 
                    info: infoLine.replace(/Line: \d+, \d+,\s*/, '').trim(),
                    PSv3: details?.[1] ? parseFloat(details[1]) : null, 
                    PHv3: details?.[2] ? parseFloat(details[2]) : null, 
                    PWv3: details?.[3] ? parseFloat(details[3]) : null, 
                    PTv3: details?.[4] ? parseFloat(details[4]) : null,
                    ProbTor: details?.[5] ? parseFloat(details[5]) : null
                };
                let j = i + 2;
                while (j < lines.length && !lines[j].startsWith("End:") && !lines[j].startsWith("Color:")) j++;
                let key = typeMap[type]?.key || "PSv3";
                if (meta[key] !== null && !seenIds.has(meta.objectId)) {
                    objects.push({ id: meta.objectId, type, probability: meta[key], description: meta.info });
                    seenIds.add(meta.objectId);
                }
                i = j;
            } else i++;
        }
        let typeThreshold = type == `tornado` ? loader.cache.configurations.sources.miscellaneous_sources.tornado_probability.threshold : loader.cache.configurations.sources.miscellaneous_sources.severe_probability.threshold;
        objects = objects.filter(object => object.probability >= typeThreshold);
        return { success: true, message: objects };
    }

    readWxRadio = function(messageBody = ``) {
        let feeds = messageBody.sources.map(feed => ({
            location: feed.location || `N/A`,
            lat: feed.lat || `N/A`,
            lon: feed.lon || `N/A`,
            callsign: feed.callsign || `N/A`,
            frequency: feed.freq || `N/A`,
            stream: feed.listen_url || `No stream available`
        }));
        return { success: true, message: feeds };
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
        if (!loader.cache.location || !loader.cache.configurations.sources.miscellaneous_sources.location_services.alert_filtering) return alerts;
        let maxMiles = loader.cache.configurations.sources.miscellaneous_sources.location_services.max_miles;
        return alerts.filter(alert => {
            let warningCoords = alert.geometry?.coordinates?.[0];
            if (!Array.isArray(warningCoords) || warningCoords.length == 0) return false;
            let [lat1, lon1] = [parseFloat(loader.cache.location.lat), parseFloat(loader.cache.location.lon)];
            let [lat2, lon2] = warningCoords.reduce((acc, [lon, lat]) => [acc[0] + lon, acc[1] + lat], [0, 0]).map(sum => sum / warningCoords.length);
            return loader.modules.hooks.getMilesAway(lat1, lon1, lat2, lon2) <= maxMiles;
        });
    };

    /**
      * @function isAlreadyCancelled
      * @description Check if the alert is already cancelled
      * 
      * @param {object} alert - The alert object to check
      */

    isAlreadyCancelled = function(alert) {
        let signatures = loader.definitions.cancelSignatures;
        let description = alert.properties.description || '';
        let type = alert.properties.messageType || '';
        let isCancelled = signatures.some(signature => description.toLowerCase().includes(signature.toLowerCase()));
        return isCancelled || type == 'Cancel';
    };

    /**
      * @function doesAlertExist
      * @description Check if the alert already exists in the array
      * 
      * @param {object} array - The array to check
      * @param {string} id - The id of the alert to check
      */

    doesAlertExist = function(array, id) {
        let exists = array.some(item => item.id == id);
        return exists;
    }

    /**
      * @function filterAlerts
      * @description Filter the alerts based on the configuration settings
      * 
      * @param {object} alerts - The array of alerts to filter
      */

    filterAlerts = function(alerts) {
        let { priority_alerts, priority } = loader.cache.configurations.project_settings;
        let { nws_office_filter, nws_office_exclude_filter, ugc_filter, abbreviated_states_filter } = loader.cache.configurations.sources.filter;
        if (priority_alerts) alerts = alerts.filter(alert => priority.includes(alert.properties.event));
        alerts.forEach(alert => alert.properties.parameters = alert.properties.parameters || { WMOidentifier: [`No WMO Found`] });
        if (abbreviated_states_filter.length) alerts = alerts.filter(alert =>  alert.properties.geocode.UGC?.some(code => abbreviated_states_filter.includes(code.substring(0, 2))) );
        if (nws_office_exclude_filter.length) alerts = alerts.filter(alert => !nws_office_exclude_filter.includes(alert.properties.parameters.WMOidentifier[0]?.split(' ')[1]));
        if (nws_office_filter.length) alerts = alerts.filter(alert => nws_office_filter.includes(alert.properties.parameters.WMOidentifier[0]?.split(' ')[1]));
        if (ugc_filter.length) alerts = alerts.filter(alert => alert.properties.geocode.UGC?.some(code => ugc_filter.includes(code)));
        return alerts.filter(alert => new Date(alert.properties.expires).getTime() > Date.now());
    };

    /**
      * @function readAlerts
      * @description Read the alerts from the data and filter them based on the configuration settings
      * 
      * @param {object} alerts - The data object to read the alerts from
      */

    readAlerts = function(isWire, alerts) {
        let tAlerts = [];
        let features = alerts.features.filter(feature => feature !== undefined);
        let filteredAlerts = this.coordsToMiles(this.filterAlerts(features));
        for (let alert of filteredAlerts) {
            if (alert.properties.description == null || alert.properties.description == undefined) continue;
            if (this.isAlreadyCancelled(alert)) { continue; } 
            if (this.doesAlertExist(tAlerts, alert.id)) continue;
            alert = JSON.parse(JSON.stringify(alert));
            let registration = loader.modules.building.registerEvent(alert);

            let alertHash = loader.packages.crypto.createHash('sha1').update(JSON.stringify({ ...registration, details: { ...registration.details, distance: undefined } })).digest('hex');
            if (!loader.cache.logging.some(log => log.id == alertHash)) {
                let { general_alerts: generalWebhook, critical_alerts: criticalWebhook } = loader.cache.configurations.webhook_settings;
                let trackingId = registration.raw.tracking ?? (registration.raw.properties.parameters.WMOidentifier?.[0] ?? `No ID found`);
                loader.modules.hooks.createOutput(`${this.name}.${isWire ? "WIRE" : "API"}`, `[!] Alert ${registration.details.type} >> ${registration.details.name} (${trackingId}) (${registration.details.distance})`);
                loader.cache.logging.push({ id: alertHash, expires: registration.details.expires });
                let alertTitle = `${registration.details.name} (${registration.details.type})`;
                let alertBody = [
                    `**Locations:** ${registration.details.locations}`,
                    `**Issued:** ${new Date(registration.details.issued).toLocaleString()}`,
                    `**Expires:** ${new Date(registration.details.expires).toLocaleString()}`,
                    `**Wind Gusts:** ${registration.details.wind}`,
                    `**Hail Size:** ${registration.details.hail}`,
                    `**Damage Threat:** ${registration.details.damage}`,
                    `**Tornado:** ${registration.details.tornado}`,
                    `**Tags:** ${registration.details.tag.join(', ')}`,
                    `**Sender:** ${registration.details.sender}`,
                    `**Miles Away:** ${registration.details.distance}`,
                    `**Tracking ID:** ${trackingId}`,
                    '```',
                    registration.details.description.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n'),
                    '```'
                ].join('\n');
                loader.modules.hooks.sendWebhook(alertTitle, alertBody, generalWebhook);
                if (Array.isArray(criticalWebhook.events) && criticalWebhook.events.includes(registration.details.name)) { loader.modules.hooks.sendWebhook(alertTitle, alertBody, criticalWebhook); }
                if (loader.cache.configurations.sources.miscellaneous_sources.character_ai.auto_alert) {
                    loader.modules.character.commitChat(`${loader.cache.configurations.sources.miscellaneous_sources.character_ai.prefix} ${registration.details.description}`).then(response => {
                        if (response.success) { loader.cache.chatbot = { message: response.message, image: loader.cache.configurations.sources.miscellaneous_sources.character_ai.image }; }
                    });
                }
            }
            if (Object.keys(registration).length && !registration.details.ignored) tAlerts.push(registration);
        }
        return { success: true, message: tAlerts };
    }
}

module.exports = Parsing;