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


class Building { 
    constructor() {
        this.name = `Building`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function formatLocations
      * @description Format the locations string to be more readable
      * 
      * @param {string} locations - The locations string to format
      */

    formatLocations = function(locations = `Chicago, IL`) {
        let splitLocations = locations.split(`,`);
        if (splitLocations.length == 1) return locations;
        return splitLocations.map(location => location.trim()).join(`, `);
    }

    /**
      * @function getEventParameters
      * @description Get the event parameters from the alert object
      * Example: maxHailSize, maxWindGust, tornadoDetection, thunderstormDamageThreat
      * 
      * @param {object} event - The alert object to get the parameters from
      */

    getEventParameters = function(event) {
        let hail = event.properties.parameters.maxHailSize || `N/A`;
        let wind = event.properties.parameters.maxWindGust || `N/A`;
        let tornado = event.properties.parameters.tornadoDetection || event.properties.parameters.waterspoutDetection || `N/A`;
        let damage = event.properties.parameters.thunderstormDamageThreat || event.properties.parameters.tornadoDamageThreat || [`N/A`];
        return { hail, wind, tornado, damage };
    }

    /**
      * @function getEventSignificance
      * @description Get the event significance from the alert object, if needed change the event name to a more significant name
      * depending on the description of the alert and or parameters of the alert
      * 
      * @param {object} event - The alert object to get the significance from
      */

    getEventSignificance = function(event, damage) {
        let eventName = event.properties.event || `Unknown Event`;
        let description = event.properties.description?.toLowerCase() || `No description provided`;
        let dmgThreat = event.properties.parameters.thunderstormDamageThreat || event.properties.parameters.tornadoDamageThreat || `N/A`;
        let torThreat = event.properties.parameters.tornadoDetection
        if (description.includes(`flash flood emergency`) && eventName == `Flash Flood Warning`) eventName = `Flash Flood Emergency`;
        if (description.includes(`particularly dangerous situation`) && eventName == `Tornado Warning` && dmgThreat == `CONSIDERABLE`) eventName = `PDS Tornado Warning`;
        if (description.includes(`particularly dangerous situation`) && eventName == `Tornado Watch`) eventName = `PDS Tornado Watch`;
        if (description.includes(`extremely dangerous situation`) && eventName == `Severe Thunderstorm Warning`) eventName = `EDS Severe Thunderstorm Warning`;
        if (description.includes(`tornado emergency`) && eventName == `Tornado Warning` && dmgThreat == `CATASTROPHIC`) eventName = `Tornado Emergency`;
        
        if (eventName == `Tornado Warning`) {
            eventName = `Radar Indicated Tornado Warning`;
            if (dmgThreat == `RADAR INDICATED`) eventName = `Radar Indicated Tornado Warning`;
            if (dmgThreat == `OBSERVED`) eventName = `Confirmed Tornado Warning`;
        }
        if (eventName == `Severe Thunderstorm Warning`) {
            if (dmgThreat == `CONSIDERABLE`) eventName = `Considerable Severe Thunderstorm Warning`;
            if (dmgThreat == `DESTRUCTIVE`) eventName = `Destructive Severe Thunderstorm Warning`;
            if (torThreat == `POSSIBLE`) eventName = `${eventName} (TPROB)`;
        }
        if (eventName == `Flash Flood Warning`) {
            if (dmgThreat == `CONSIDERABLE`) eventName = `Considerable Flash Flood Warning`;
        }
        return eventName;
    }

    /**
      * @function getEventTag
      * @description Get the event tags from the alert object
      * 
      * @param {object} event - The alert object to check
      */

    getEventTag = function(event) {
        let tags = [`No tags found`];
        let tagDictionary = loader.cache.configurations.tags;
        for (let [key, value] of Object.entries(tagDictionary)) {
            if (event.properties.description.toLowerCase().includes(key.toLowerCase())) {
                tags = tags.includes(`No tags found`) ? [] : tags;
                if (!tags.includes(value)) tags.push(value);
            }
        }
        return tags;
    }

    /**
      * @function getEventActions
      * @description Get the event actions from the alert object
      * 
      * @param {object} event - The alert object to get the actions from
      */

    getEventActions = function(event) {
        let defaultAudio = loader.cache.configurations.tone_sounds.beep;
        let eventDictionary = loader.cache.configurations.alert_dictionary[event.properties.properEventName] || loader.cache.configurations.alert_dictionary['Special Event'];
        let { new: newAlertAudio, update: updateAlertAudio, cancel: cancelAlertAudio, eas: easAudio, siren: sirenAudio, amber: amberAudio } = eventDictionary;
        let messageState = [
            { event: `Update`, message: `Updated`, audio: updateAlertAudio },
            { event: `Cancel`, message: `Expired`, audio: cancelAlertAudio },
            { event: `Alert`, message: `Issued`, audio: newAlertAudio },
            { event: `Updated`, message: `Updated`, audio: updateAlertAudio },
            { event: `Expired`, message: `Expired`, audio: cancelAlertAudio },
            { event: `Issued`, message: `Issued`, audio: newAlertAudio },
            { event: `Extended`, message: `Updated`, audio: newAlertAudio },
            { event: `Correction`, message: `Updated`, audio: updateAlertAudio },
            { event: `Upgraded`, message: `Upgraded`, audio: newAlertAudio },
            { event: `Cancelled`, message: `Cancelled`, audio: cancelAlertAudio },
            { event: `Expired`, message: `Expired`, audio: cancelAlertAudio },
            { event: `Routine`, message: `Routine`, audio: updateAlertAudio },
        ];
        messageState.forEach(item => {
            if (event.properties.messageType == item.event) {
                event.properties.messageType = item.message;
                defaultAudio = item.audio;
            }
        });
        return {
            message: event.properties.messageType,
            audiopresets: { new: newAlertAudio, update: updateAlertAudio, cancel: cancelAlertAudio },
            audio: defaultAudio,
            eas: easAudio,
            siren: sirenAudio,
            amber: amberAudio,
        };
    }

    /**
      * @function registerEvent
      * @description Register the event and clean up the alert object and return it so we can use it for client purposes
      * 
      * @param {object} event - The alert object to register
      */

    registerEvent = function(event) {
        let ignoreWarning = false, onlyBeep = false, distanceAway;
        let defaultAudio = loader.cache.configurations.tone_sounds.beep;
        let onlyDoBeeps = loader.cache.configurations.project_settings.beep_only;
        let filteredEvents = new Set((loader.cache.configurations.project_settings.ignore_restrictions || []).map(p => String(p).toLowerCase()));
   
        let filteredAllowUpdated = loader.cache.configurations.project_settings.show_updates;
        let { hail, wind, tornado, damage } = this.getEventParameters(event);
        let eventTags = this.getEventTag(event);
        event.properties.areaDesc = this.formatLocations(event.properties.areaDesc);
        event.properties.properEventName = this.getEventSignificance(event, damage);
        let eventActions = this.getEventActions(event);
        event.properties.parameters.maxWindGust = wind;
        event.properties.parameters.maxHailSize = hail;
        event.properties.parameters.tornadoDetection = tornado;
        event.properties.description ??= `No description provided`;
        event.properties.messageType = eventActions.message;
        if (onlyDoBeeps && !filteredEvents.has(event.properties.properEventName.toLowerCase())) {
            eventActions.audio = defaultAudio;
            onlyBeep = true;
        }
        if (!filteredAllowUpdated && event.properties.messageType == `Updated` && !filteredEvents.has(event.properties.properEventName.toLowerCase())) {
            ignoreWarning = true;
        }
        if (event.geometry?.coordinates?.[0] && loader.cache.location) {
            let warningCoords = event.geometry.coordinates[0];
            let centerPolygon = warningCoords.reduce((acc, [lon, lat]) => ([acc[0] + lon, acc[1] + lat]), [0, 0]).map(sum => sum / warningCoords.length);
            distanceAway = loader.modules.hooks.getMilesAway(loader.cache.location.lat, loader.cache.location.lon, centerPolygon[1], centerPolygon[0]);
        }
        return {
            raw: event,
            details: {
                id: event.properties.id,
                native: event.properties.event,
                name: event.properties.properEventName,
                type: event.properties.messageType,
                expires: event.properties.expires,
                issued: event.properties.sent,
                locations: event.properties.areaDesc,
                description: event.properties.description,
                hail: hail !== `N/A` ? `${hail} IN` : `N/A`,
                wind: wind == "0" ? `N/A` : `${wind}`,
                tornado,
                damage: damage[0],
                sender: event.properties.senderName,
                tag: eventTags,
                distance: distanceAway ? `${distanceAway} mi` : `N/A`,
                link: event.id,
            },
            metadata: { ...eventActions, ignored: ignoreWarning, onlyBeep },
        };
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
            let area = 0, lat2 = 0, lon2 = 0;
            for (let i = 0; i < warningCoords.length; i++) {
                let [x1, y1] = warningCoords[i];
                let [x2, y2] = warningCoords[(i + 1) % warningCoords.length];
                let cross = x1 * y2 - x2 * y1;
                area += cross;
                lat2 += (y1 + y2) * cross;
                lon2 += (x1 + x2) * cross;
            }
            area /= 2;
            lat2 = lat2 / (6 * area);
            lon2 = lon2 / (6 * area);
            let miles = loader.modules.hooks.getMilesAway(lat1, lon1, lat2, lon2);
            return miles <= maxMiles;
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
        if (priority_alerts) {
            let pSet = new Set((priority || []).map(p => String(p).toLowerCase()));
            alerts = alerts.filter(alert => pSet.has(String(alert.properties?.event || '').toLowerCase()));
        }
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

    readAlerts = async function(isWire, alerts) {
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
                loader.modules.hooks.createOutput(`${this.name}.${isWire ? "WIRE" : "API"}`, `[!] Alert ${registration.details.type} >> ${registration.details.name} (${trackingId})` + (registration.details.distance != `N/A` ? ` (${registration.details.distance})` : ``));
                loader.modules.chatInteractions.emitMessage(`${registration.details.name} has been ${registration.details.type} for areas of ${registration.details.locations}.`);
                loader.cache.logging.push({ id: alertHash, expires: registration.details.expires });
                let alertTitle = `${registration.details.name} (${registration.details.type})`;
                let alertBody = [
                    `**Locations:** ${registration.details.locations.slice(0, 250)} ${(registration.details.locations.length > 250) ? '...' : ''}`,
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
                let pSet = new Set((criticalWebhook.events || []).map(p => String(p).toLowerCase()));
                if (Array.isArray(criticalWebhook.events) && pSet.has(registration.details.name.toLowerCase())) { loader.modules.hooks.sendWebhook(alertTitle, alertBody, criticalWebhook); }
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

    /**
      * @function buildCache
      * @description Build the cache and read the alerts from the data and filter them based on the configuration settings
      * 
      * @param {object} rawData - The data object to read the alerts from
      * @param {boolean} isUsingWire - The boolean to check if we are using the NOAA Weather Wire Service
      */

    buildCache = async function(rawData, isUsingWire) {
        try {
            rawData = loader.modules.hooks.filteringHtml(rawData);
            if (rawData.MesoscaleDiscussions) { loader.cache.discussions = loader.modules.placefiles.parsing(rawData.MesoscaleDiscussions, `mesoscale_discussions`).message;  }
            if (rawData.SpotterNetwork) { loader.cache.spotters = loader.modules.placefiles.parsing(rawData.SpotterNetwork, `spotter_network_members`).message;  }
            if (rawData.SpotterNetworkReports) { loader.cache.reports = loader.modules.placefiles.parsing(rawData.SpotterNetworkReports, `spotter_network_reports`).message;  }
            if (rawData.GRLevelXReports)  { loader.cache.reports = loader.modules.placefiles.parsing(rawData.SpotterNetworkReports, `gr_level_x`).message;  }
            if (rawData.IEMReports) { loader.cache.reports = loader.modules.placefiles.parsing(rawData.SpotterNetworkReports, `iem`).message;  }
            if (rawData.wxRadio) { loader.cache.wxRadio = loader.modules.placefiles.parsing(rawData.wxRadio, `nwr_stations`).message;  }
            if (rawData.tropical) { loader.cache.tropical = loader.modules.placefiles.parsing(rawData.tropical, `weatherwise_storm_tracks`).message;  }

            if (rawData.ProbTornado) { loader.cache.torprob = loader.modules.placefiles.parsing(rawData.ProbTornado, `tornado_probability`).message;  }
            if (rawData.ProbSevere) { loader.cache.svrprob = loader.modules.placefiles.parsing(rawData.ProbSevere, `severe_probability`).message;  }
          
            if ((rawData.NoaaWeatherWireService && isUsingWire) || rawData.NationalWeatherService) {
                let response = await this.readAlerts(isUsingWire ? true : false, isUsingWire ? rawData.NoaaWeatherWireService : rawData.NationalWeatherService);
                loader.cache.active = response.message;
                let places = response.message.map(alert => {
                    let { name, locations, issued, expires, wind, hail, damage, tornado, tag, sender, distance } = alert.details;
                    let tracking = alert.raw.tracking || alert.raw.properties.parameters.WMOidentifier?.[0] || `No ID found`;
                    let description = [`Event: ${name}`, `Locations: ${locations}`, `Issued: ${new Date(issued).toLocaleString()}`, `Expires: ${new Date(expires).toLocaleString()}`, `Wind Gusts: ${wind}`, `Hail Size: ${hail}`, `Damage Threat: ${damage}`, `Tornado: ${tornado}`, `Tags: ${tag.join(', ')}`, `Sender: ${sender}`, `Distance: ${distance}`, `Tracking: ${tracking}`, `Source: AtmosphericX`].join('\\n').replace(/;/g, ' -').replace(/,/g, "");
                    let geometry = alert.raw.geometry?.coordinates;
                    let schemeEntry = Array.isArray(loader.cache.configurations.scheme) ? loader.cache.configurations.scheme.find(s => s.type && name?.toLowerCase().includes(s.type.toLowerCase())) : null;
                    let color = (schemeEntry?.color?.light || loader.cache.configurations.scheme.find(s => s.type == 'Default').color.light).replace('rgb(', '').replace(')', '') + ',255';
                    return { title: name, description, polygon: geometry, rgb: color };
                });
                loader.modules.placefiles.createPlacefilePolygon(1, 999, `AtmosphericX Alerts - ${new Date().toUTCString()}`, places, `alerts`);
            }
            loader.modules.websocket.onCacheReady();
            return { status: true, message: `Cache built successfully` };
        } catch (error) {
            let errorMessage = `Error while building cache: ${error.stack || error.message}`;
            loader.modules.hooks.createOutput(this.name, errorMessage);
            loader.modules.hooks.createLog(this.name, errorMessage);
            return { status: false, message: errorMessage };
        }
    }
}

module.exports = Building;
