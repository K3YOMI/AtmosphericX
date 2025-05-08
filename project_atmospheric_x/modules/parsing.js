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
    Version: 7.0.5                             
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
                    if (typeof loader.cache.realtime != `object`) { loader.cache.realtime = {} }
                    loader.cache.realtime.lat = lat;
                    loader.cache.realtime.lon = lon;
                    loader.cache.realtime.address = `N/A`;
                    loader.cache.realtime.location = `N/A`;
                    loader.cache.realtime.county = `N/A`;
                    loader.cache.realtime.state = `N/A`;
                }
            }


            if (isActive == 1 && filters.show_active == false) { continue; }
            if (isStreaming == 1 && filters.show_streaming == false) { continue; }
            if (isIdle == 1 && filters.show_idle == false) { continue; }
            if (isActive == 0 && isStreaming == 0 && isIdle == 0 && filters.show_offline == false) { continue; }
            spotters.push({ lat: lat, lon: lon, description: description, active: isActive, streaming: isStreaming, idle: isIdle })
        }
        let uniqueFilter = spotters.filter((thing, index, self) => index === self.findIndex((t) => (t.description === thing.description && t.lat === thing.lat && t.lon === thing.lon)));
        return {success: true, message: uniqueFilter}

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
        let signatures = loader.cache.configurations.definitions.cancel_signatures
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
        if (exludedForecaseOffices.length != 0) { alerts = alerts.filter(alert => !exludedForecaseOffices.includes(alert.properties.parameters.WMOidentifier[0].split(' ')[1])); }
        if (forecastOffices.length != 0) { alerts = alerts.filter(alert => forecastOffices.includes(alert.properties.parameters.WMOidentifier[0].split(' ')[1])); }
        if (ugcCodes.length != 0) { alerts = alerts.filter(alert => alert.properties.geocode.UGC.some(code => ugcCodes.includes(code))); }
        if (priortityAlerts == true) { alerts = alerts.filter(alert => allowedEvents.includes(alert.properties.event)) }
        alerts = alerts.filter(alert => new Date(alert.properties.expires).getTime() / 1000 > new Date().getTime() / 1000); 
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
        for (let i = 0; i < filtering.length; i++) {
            let index = filtering[i]
            if (index.properties.description != null) { if (this.isAlreadyCancelled(index)) { continue; } }
            if (this.doesAlertExist(tAlerts, index.id)) { continue; }
            index = JSON.parse(JSON.stringify(index));
            let registration = loader.modules.building.registerEvent(index);
            if (Object.keys(registration).length != 0) {
                if (registration.details.ignored == true) { continue; }
                tAlerts.push(registration);
            }
        }
        return {success: true, message: tAlerts}
    }
}

module.exports = Parsing;