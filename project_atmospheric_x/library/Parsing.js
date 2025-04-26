

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
  * @module Parsing
  * @description 
  * A module for parsing different data formats and filtering alerts.
  * 
  * Note: For performance improvements or suggestions, feel free to reach out to me on GitHub or Discord @kiyomi (359794704847601674).
  */


class Parsing { 
    constructor() {
        this.author = `k3yomi@GitHub`
        this.production = true
        this.name = `Parsing`;
        Hooks.PrintLog(`${this.name}`, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function _IsAlertCancelled
      * @description Checks if a given alert is cancelled by looking for specific phrases or context
      * 
      * @param {string} _alert - The alert.
      * 
      * @returns {boolean} 
      * `true` if the alert contains cancellation-related phrases, otherwise `false`.
      */

    async _IsAlertCancelled(_alert=undefined) {
        if (_alert == undefined) { return true; }
        let signatures = cache.configurations.definitions.cancel_signatures
        let description = _alert.properties.description
        let type = _alert.properties.messageType
        let desc_cancel = signatures.filter(signature => description.toLowerCase().includes(signature.toLowerCase()))
        if (desc_cancel.length != 0 || type == `Cancel`) { return true; }
        return false;
    }

    /**
      * @function _DoesAlertIDExist
      * @description Checks if a given ID exists in the provided array. Returns `true` if found, `false` otherwise.
      * 
      * @param {Array} _array - Array of objects with an `id` property.
      * @param {string|number} _id - ID to search for.s
      * 
      * @returns {boolean} 
      * `true` if the ID is found, `false` if not.
      */

    async _DoesAlertIDExist(_array=[], _id=0) {
        let exists = _array.filter(item => item.id == _id)
        if (exists == undefined || exists.length == 0) { return false; }
        return true 
    }

    /**
      * @function _FilterNWSAlertsv1
      * @description This function filters a list of alerts based on several configuration settings, such as the forecast office, 
      * SAME codes, UGC zone codes, WMO codes, and AWIPS codes. It first checks if there are any specific forecast offices 
      * to include and filters alerts by the `senderName` property. It then filters the alerts based on the `SAME`, `UGC`, 
      * `WMO`, and `AWIPS` codes from the alert’s geocode or parameters property, ensuring only alerts that match the 
      * provided codes are kept. The function returns the filtered list of alerts based on these criteria.
      * 
      * @param {Array} alerts - A list of alert objects to be filtered. Each alert contains properties like `senderName`, `geocode`, etc.
      * 
      * @returns {Array} 
      * A filtered list of alerts based on the provided configurations for forecast offices, SAME codes, UGC zone codes, 
      * WMO codes, and AWIPS codes.
      */

    async _FilterNWSAlertsv1(alerts=[]) {
        let forecast_office = cache.configurations.sources.filter.forecast_office_filter;
        let zone_codes = cache.configurations.sources.filter.ugc_filter;
        if (forecast_office.length != 0) { alerts = alerts.filter(alert => forecast_office.includes(alert.properties.senderName)); }
        if (zone_codes.length != 0) { alerts = alerts.filter(alert => alert.properties.geocode.UGC.some(code => zone_codes.includes(code))); }
        return alerts;
    }

    /**
      * @function _FilterNWSAlertsv2
      * @description This function filters a list of alerts based on their event types and expiration times. 
      * It first checks if the event is part of the allowed set of events (either "outbreak alerts" or "all alerts") 
      * and then filters out any alerts that have expired. After that, it categorizes the alerts into three groups: 
      * warnings, watches, and unknown events. Alerts are classified based on whether their event type contains 
      * the words "Warning" or "Watch".
      * 
      * @param {Array} alerts - A list of alert objects to be filtered. Each alert contains properties like `event` and `expires`.
      * 
      * @returns {Object} 
      * An object containing three arrays:
      * - `warnings`: Alerts categorized as warnings.
      * - `watches`: Alerts categorized as watches.
      * - `unknown`: Alerts that do not fit into either warnings or watches.
      */

    async _FilterNWSAlertsv2(alerts=[]) {
        let priority = cache.configurations.project_settings.priority_alerts 
        let allowed_events = cache.configurations.project_settings.priority
        if (priority == true) { alerts = alerts.filter(alert => allowed_events.includes(alert.properties.event)) }
        let time_filter = alerts.filter(alert => new Date(alert.properties.expires).getTime() / 1000 > new Date().getTime() / 1000); 
        let warnings = time_filter.filter(alert => alert.properties.event.includes('Warning'));
        let watches = time_filter.filter(alert => alert.properties.event.includes('Watch'));
        let unknown = time_filter.filter(alert => !alert.properties.event.includes('Warning') && !alert.properties.event.includes('Watch'));
        return { warnings: warnings, watches: watches, unknown: unknown };
    }

    /**
      * @function _TranslateHTML2Files
      * @description This function processes raw alert data by parsing it into individual alerts. 
      * It splits the input data by line, filters out empty lines, and then uses a regular expression 
      * to extract key details like the alert ID, date, and size. After collecting this information, 
      * it sorts the alerts by date and returns the most recent 25 alerts.
      * 
      * @async
      * @param {string} _body - The raw text data containing alert information, with each alert on a new line.
      * 
      * @returns {Promise<Array>} 
      * A promise that resolves to an array of the most recent 25 alerts. Each alert is an object containing:
      * - `id`: The unique identifier of the alert.
      * - `date`: The date the alert was issued.
      * - `size`: The size of the alert (presumably related to the content or severity).
      */

    async _TranslateHTML2Files(_body=``) {
        return new Promise((resolve, reject) => {
            let alerts = _body.split(`\n`).filter(alert => alert.length > 0)
            let regular_expression = /<a href="(.*)">(.*)<\/a>.*<td align="right">(.*)<\/td>.*<td align="right">(.*)<\/td>/
            let found = []
            for (let i = 0; i < alerts.length; i++) {
                let index = alerts[i]
                let match = index.match(regular_expression)
                if (match != null) {
                    let id = match[1]
                    let date = match[3]
                    let size = match[4]
                    let name = id.split('.')[0]
                    if (isNaN(name)) { continue }
                    found.push({ id: id, date: date, size: size })
                }
            }
            found.sort((a, b) => { return new Date(a.date) - new Date(b.date)})
            found = found.slice(found.length - 25)
            resolve(found)
        })
    }

    /**
      * @function _GetRawTextDownload
      * @description This function takes an array of alert IDs and fetches their corresponding raw text data from a specified API. 
      * For each ID, it creates a URL, sends a request to the API, and splits the response into separate lines. 
      * The function then groups the lines into chunks, using a specific delimiter (`$$`) to separate them. 
      * Finally, it returns an array of objects, each containing the ID and the chunks of text associated with it.
      * 
      * @async
      * @param {Array} _array - A list of objects, each with an `id` that will be used to fetch data from the API.
      * @param {string} _api - The API URL to get the raw data from, which defaults to `https://warnings.cod.edu`.
      * 
      * @returns {Promise<Array>} 
      * A promise that resolves to an array of objects. Each object has:
      * - `id`: The URL created from the alert ID.
      * - `values`: An object with chunk numbers as keys and concatenated lines of text as values.
      */

    async _GetRawTextDownload(_array=[], _api=`https://warnings.cod.edu`) {
        return new Promise(async (resolve, reject) => {
            let found = [];
            for (let i = 0; i < _array.length; i++) {
                let index = _array[i];
                let created_link = `${_api}/${index.id}`;
                let response = await Hooks.CallHTTPS(created_link);
                let values = {};
                let chunks = 0;
                response = response.split('\n');
                for (let j = 0; j < response.length; j++) {
                    let line = response[j];
                    if (line.length == 0) { continue; }
                    if (line.includes(`$$`)) { chunks++; }
                    values[chunks] = values[chunks] === undefined ? line : values[chunks] + '\n' + line;
                }
                found.push({ id: created_link, message: values, attributes: {} });
            }
            resolve(found);
        });
    }

    /**
     * @function _ReadRawSpotterNetwork
     * @description Processes raw spotter network data by using regular expressions to extract various attributes, 
     * including latitude, longitude, description, and status (active, streaming, idle, offline) from the provided data. 
     * The function matches data using three different regular expressions, each capturing different levels of detail. 
     * The function then creates a list of spotters with their respective properties, ensuring that duplicate spotters are 
     * removed based on their latitude, longitude, and description. The final output is an array of unique spotters with 
     * their details.
     * 
     * @async
     * @param {string} _body - The raw body of the spotter network data, typically containing spotter details in a structured format.
     * 
     * @returns {Promise<Array>} 
     * An array of unique spotter objects, where each object contains:
     * - `lat`: Latitude of the spotter.
     * - `lon`: Longitude of the spotter.
     * - `description`: A description of the spotter (or "N/A" if not available).
     * - `streaming`: A flag indicating whether the spotter is streaming (1 for true, 0 for false).
     * - `active`: A flag indicating whether the spotter sis active (1 for true, 0 for false).
     * - `idle`: A flag indicating whether the spotter is idle (1 for true, 0 for false).
     * - `offline`: A flag indicating whether the spotter is offline (1 for true, 0 for false).
     */

    async _ReadRawSpotterNetwork(_body=``) {
        return new Promise((resolve, reject) => {
            let regular_expressionv1 = /Object:\s*([\d.-]+),([\d.-]+)\s*Icon:.*?"(.*?)\n.*?Text:.*?"(.*?)"/g;
            let regular_expressionv2 = /Object:\s*([\d.-]+),([\d.-]+)\s*Icon:.*?"(.*?)\n.*?Icon:.*?"(.*?)\n.*?Text:.*?"(.*?)"/g;
            let regular_expressionv3 = /Object:\s*([\d.-]+),([\d.-]+)\s*$/g;
            let regex = new RegExp(regular_expressionv1.source + '|' + regular_expressionv2.source + '|' + regular_expressionv3.source, 'gs');
            let spotters = [];
            let config = cache.configurations.sources.miscellaneous_sources.spotter_network.spotter_network_filters

            let matches = [..._body.matchAll(regex)];
            for (const match of matches) {
                let lat = parseFloat(match[1]);
                let lon = parseFloat(match[2]);
                let meta = match[0];
                let description = match[3] == undefined ? "N/A" : match[3];
                let is_active = meta.includes('Icon: 0,0,000,6,2') ? 1 : 0;
                let is_streaming = meta.includes('Icon: 0,0,000,1,19') ? 1 : 0;
                let is_idle = meta.includes('Icon: 0,0,000,6,6') ? 1 : 0;
                let is_offline = meta.includes('Icon: 0,0,000,6,10') ? 1 : 0;
                if (!config.active) { if (is_active == 1) { continue; } }
                if (!config.streaming) { if (is_streaming == 1) { continue; } }
                if (!config.idle) { if (is_idle == 1) { continue; } }
                if (!config.offline) { if (is_offline == 1) { continue; } }
                spotters.push({ lat: lat, lon: lon, description: description, streaming: is_streaming, active: is_active, idle: is_idle, offline: is_offline });
            }
            let unique = spotters.filter((thing, index, self) => index === self.findIndex((t) => (t.description === thing.description && t.lat === thing.lat && t.lon === thing.lon)));
            resolve(unique);
        });
    }

    /**
      * @function _ReadRawMesoscaleDiscussions
      * @description Processes raw mesocale discussions data. It splits the raw data into individual discussions 
      * based on a specific separator. For each discussion, it uses a regular expression to extract relevant text and 
      * constructs a string of discussion content. The function also cleans up the extracted text by removing unwanted HTML 
      * elements, such as anchor tags (`<a href=`). Finally, the function returns an array of parsed and cleaned discussions 
      * after filtering out any empty entries.
      * 
      * @async
      * @param {string} _body - The raw body of the mesocale discussions data.
      * 
      * @returns {Promise<Array>} 
      * An array of cleaned discussion texts, where each entry is a string representing the content of a discussion.
      */

    async _ReadRawMesoscaleDiscussions(_body=``) {
        return new Promise(async (resolve, reject) => {
            let discussions = _body.split('#################################################################################################################');
            let parsed_discussions = discussions.map(discussion => {
                let regex = /Icon:.*?1, 1, "(.*?)"/g;
                let matches = [...discussion.matchAll(regex)];
                let discussion_text = '';
                for (let i = 0; i < matches.length; i++) {
                    let match = matches[i];
                    let text = match[1];
                    discussion_text += text;
                }
                discussion_text = discussion_text.replace(/<a href=/g, '');
                return discussion_text.trim();
            });
            parsed_discussions = parsed_discussions.filter(discussion => discussion !== '');
            resolve(parsed_discussions);
        });
    }

    /**
      * @function _ReadRawLightningReports
      * @description Processes raw lightning network data. It uses a regular expression to extract 
      * latitude and longitude from the provided data, identifying lightning strike locations. The function then 
      * constructs an array of objects representing each lightning strike, containing the latitude and longitude 
      * for each strike. The function resolves the array of strikes once all matches are processed.
      * 
      * @async
      * @param {string} _body - The raw body of the lightning network data.
      * 
      * @returns {Promise<Array>} 
      * An array of objects, each containing:
      * - `lat`: Latitude of the lightning strike location.
      * - `lon`: Longitude of the lightning strike location.
      */

    async _ReadRawLightningReports(_body=``) {
        return new Promise(async (resolve, reject) => {
            let regex = /Icon:.*?([\d.-]+),([\d.-]+),0,1,12,(.*?)/g;
            let matches = [..._body.matchAll(regex)];
            let strikes = [];
            for (let i = 0; i < matches.length; i++) {
                let match = matches[i];
                let lat = parseFloat(match[1]);
                let lon = parseFloat(match[2]);
                strikes.push({ lat: lat, lon: lon });
            }
            resolve(strikes);
        });
    }

    /**
      * @function _ReadRawGRLevelXReports
      * @description Processes raw GrLevelX reports data. It uses a regular expression to extract 
      * various properties from the provided data, including the event date, time, latitude, longitude, event type, 
      * magnitude, state, county, location, and source. The function then constructs a report object containing 
      * metadata such as area description, expiration time, event type, sender details, and a description of the event. 
      * Each report is registered through an external API, and only successfully registered reports that are not ignored 
      * are included in the final output. The function returns an array of these processed and registered reports.
      * 
      * @async
      * @param {string} _body - The raw body of the GrLevelX reports data.
      * 
      * @returns {Promise<Array>} 
      * An array of successfully registered reports. Each report includes:
      * - `id`: A unique identifier based on latitude and longitude.
      * - `properties`: Metadata including area description, expiration time, event type, sender details, and description.
      * - `value`: The magnitude of the event.
      * - `lat`: Latitude of the report location.
      * - `lon`: Longitude of the report location.
      */

    async _ReadRawGRLevelXReports(_body=``) {
        return new Promise(async (resolve, reject) => {
            let regex = /(\w+)\|(\d{4}\/\d{2}\/\d{2})\|(\d{2}:\d{2})\|([\d.-]+)\|([\d.-]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)/g;
            let matches = [..._body.matchAll(regex)];
            let reports = [];
            for (const match of matches) {
                let date = match[2];
                let time = match[3];
                let lat = parseFloat(match[4]);
                let lon = parseFloat(match[5]);
                let event_type = match[6];
                let magnitude = match[7];
                let state = match[8];
                let county = match[9];
                let location = match[10];
                let source = match[11];
                let build = {
                    id: `${lat},${lon}`,
                    properties: {
                        areaDesc: `${location}, ${county}, ${state}`,
                        expires: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
                        sent: `${date} ${time}`,
                        messageType: "Alert",
                        event: event_type,
                        sender: "reported",
                        senderName: source,
                        description: `${event_type} reported with magnitude ${magnitude} at ${location}, ${county}, ${state}`,
                        parameters: {}
                    },
                    value: magnitude,
                    lat: lat,
                    lon: lon
                };
                let registration = await Formats.RegisterEvent(build);
                if (Object.keys(registration).length != 0) {
                    if (registration.details.ignored == true) { continue; }
                    reports.push(registration);
                }
            }
            resolve(reports);
        });
    }

    /**
      * @function _ReadRawMPingReports
      * @description Processes raw mPing reports data. 
      * It uses a regular expression to extract latitude, longitude, report type, and report time from the provided data. 
      * The function then constructs a report object with various metadata, such as area description, expiration time, event type, and sender details. 
      * Each report is registered through an external API, and only successfully registered reports that are not ignored are included in the final output. 
      * The function returns an array of these processed and registered reports.
      * 
      * @async
      * @param {string} _body - The raw body of the mPing reports data, typically containing raw report information.
      * @return {Array} - Returns an array of successfully registered reports with metadata and properties.
      */

    async _ReadRawMPingReports(_body=``) {
        return new Promise(async (resolve, reject) => {
            let regex = /Icon:.*?([\d.-]+),([\d.-]+),\d+,\d+,\d+, "Report Type: (.*?)\\nTime of Report: (.*?)"/g;
            let matches = [..._body.matchAll(regex)];
            let reports = [];
            for (let i = 0; i < matches.length; i++) {
                let match = matches[i];
                let lat = parseFloat(match[1]);
                let lon = parseFloat(match[2]);
                let report_type = match[3].trim();
                let report_time = match[4].trim();
                if (report_type === 'NULL') { continue; }
                let build = {
                    id: `${lat},${lon}`,
                    properties: {
                        areaDesc: `Longitude: ${lon}, Latitude: ${lat}`,
                        expires: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
                        sent: report_time,
                        messageType: `Alert`,
                        event: report_type,
                        sender: `mPing`,
                        senderName: `mPing`,
                        description: `No Description`,
                        parameters: {
                            reportType: report_type,
                            reportTime: report_time
                        },
                    },
                    value: `No Value`,
                    lat: lat,
                    lon: lon
                };
                let registration = await Formats.RegisterEvent(build);
                if (Object.keys(registration).length !== 0) {
                    if (registration.details.ignored === true) { continue; }
                    reports.push(registration);
                }
            }
            resolve(reports);
        });
    }

    /**
      * @function _ReadIowaLocalStormReports
      * @description Processes raw IEM (Iowa Environmental Mesonet) Local Storm Reports (LSR) data. 
      * It iterates through the provided data, extracting and transforming relevant properties into a structured format. 
      * The function ensures that missing fields such as remarks and magnitude are assigned default values. 
      * It constructs a report object containing metadata like area description, expiration time, event type, and sender details. 
      * Each report is registered via an external API, and only successfully registered reports that are not ignored are included in the final output. 
      * The function returns an array of these processed and registered reports.
      * 
      * @async
      * @param {string} _body - The raw body of the IEM LSR reports data.
      * @return {Array} - Returns an array of parsed reports with ID, properties, and value.
      */

    async _ReadIowaLocalStormReports(_body=``) {
        return new Promise(async (resolve, reject) => {
            let reports = [];
            for (let i = 0; i < _body.length; i++) {
                let properties = _body[i].properties;
                if (!properties.remark) { properties.remark = 'No Description'; }
                if (!properties.magf) { properties.magf = 'N/A'; properties.unit = ''; }
                let expires = properties.valid.replace('T', ' ').replace('Z', '');
                let sent = new Date().toISOString();
                let build = {
                    id: `${properties.lat},${properties.lon}`,
                    properties: {
                        areaDesc: `${properties.county}, ${properties.state}`,
                        expires: expires,
                        sent: sent,
                        messageType: "Alert",
                        event: properties.typetext,
                        sender: "reported",
                        senderName: properties.source,
                        description: `${properties.remark} - ${properties.city}`,
                        parameters: {}
                    },
                    value: `${properties.magf} ${properties.unit}`,
                    lat: properties.lat,
                    lon: properties.lon
                };
                let registration = await Formats.RegisterEvent(build);
                if (Object.keys(registration).length !== 0) {
                    if (registration.details.ignored === true) { continue; }
                    reports.push(registration);
                }
            }
            resolve(reports);
        });
    }

    /**
     * @function _ReadRawStations
     * @description Processes raw station data, extracting latitude, longitude, and properties for each station. 
     * The function iterates through the provided features, extracting the coordinates and properties of each station 
     * and constructing an array of station objects. Each object contains the latitude, longitude, and properties of a station.
     * 
     * @async
     * @param {Object} body - The raw body of the station data, typically containing features with geometry and properties.
     * 
     * @returns {Promise<Array>} 
     * An array of station objects, where each object contains:
     * - `lat`: Latitude of the station.
     * - `lon`: Longitude of the station.
     * - `properties`: Additional properties of the station.
     */

    async _ReadRawStations(body) {
        return new Promise(async (resolve, reject) => {
            let features = body.features;
            let stations = [];
            for (let i = 0; i < features.length; i++) {
                let index = features[i];
                let coordinates = index.geometry.coordinates;
                let properties = index.properties;
                stations.push({ lat: coordinates[1], lon: coordinates[0], properties: properties });
            }
            resolve(stations);
        });
    }

    /**
      * @function _ReadNWSAlerts
      * @description Processes raw alert data, categorizing the alerts into warnings, watches, and unknown alerts. 
      * The function first filters the incoming data through two internal filter functions (`_FilterNWSAlertsv1` and `_FilterNWSAlertsv2`) 
      * to extract relevant alerts. It then checks each alert to see if it is cancelled or already active. If not, the alert is 
      * registered via an external API. Only successfully registered and non-ignored alerts are added to the appropriate 
      * category (warnings, watches, or unknown). The function returns an object containing arrays of active alerts, warnings, 
      * and watches after filtering and registering the data.
      * 
      * @async
      * @param {string} _body - The raw body of the alert data, typically containing various alert features to be processed.
      * 
      * @returns {Promise<Object>} 
      * An object containing three arrays:
      * - `active`: An array of active, successfully registered alerts.
      * - `warnings`: An array of registered warning alerts.
      * - `watches`: An array of registered watch alerts.
      */

    async _ReadNWSAlerts(_body=``) {
        return new Promise(async (resolve, reject) => {
            let temp_active = [];
            let temp_warnings = [];
            let temp_watches = [];
            let features = _body.features.filter(feature => feature !== undefined);
            let filtering = await this._FilterNWSAlertsv1(features);    
            let { warnings, watches, unknown } = await this._FilterNWSAlertsv2(filtering);

            for (let i = 0; i < warnings.length; i++) {
                let index = warnings[i];
                if (index.properties.description != null) {
                    if (await this._IsAlertCancelled(index)) { continue; }
                }
                if (await this._DoesAlertIDExist(temp_active, index.id)) { continue; }
                index = JSON.parse(JSON.stringify(index));
                let registration = await Formats.RegisterEvent(index);
                if (Object.keys(registration).length != 0) {
                    if (registration.details.ignored == true) { continue; }
                    temp_warnings.push(registration);
                    temp_active.push(registration);
                }
            }
            for (let i = 0; i < watches.length; i++) {
                let index = watches[i];
                if (index.properties.description != null) {
                    if (await this._IsAlertCancelled(index)) { continue; }
                }
                if (await this._DoesAlertIDExist(temp_active, index.id)) { continue; }
                index = JSON.parse(JSON.stringify(index));
                let registration = await Formats.RegisterEvent(index);
                if (Object.keys(registration).length != 0) {
                    if (registration.details.ignored == true) { continue; }
                    temp_watches.push(registration);
                    temp_active.push(registration);
                }
            }
            for (let i = 0; i < unknown.length; i++) {
                let index = unknown[i];
                if (index.properties.description != null) {
                    if (await this._IsAlertCancelled(index)) { continue; }
                }
                if (await this._DoesAlertIDExist(temp_active, index.id)) { continue; }
                index = JSON.parse(JSON.stringify(index));
                let registration = await Formats.RegisterEvent(index);
                if (Object.keys(registration).length != 0) {
                    if (registration.details.ignored == true) { continue; }
                    temp_warnings.push(registration);
                    temp_active.push(registration);
                }
            }
            resolve({ active: temp_active, warnings: temp_warnings, watches: temp_watches });
        });
    }
}


module.exports = Parsing;