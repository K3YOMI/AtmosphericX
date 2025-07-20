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
        if (description.includes(`flash flood emergency`) && eventName == `Flash Flood Warning`) eventName = `Flash Flood Emergency`;
        if (description.includes(`particularly dangerous situation`) && eventName == `Tornado Warning` && damage == `CONSIDERABLE`) eventName = `Particularly Dangerous Situation (TOR WARNING)`;
        if (description.includes(`particularly dangerous situation`) && eventName == `Tornado Watch`) eventName = `Particularly Dangerous Situation (TOR WATCH)`;
        if (description.includes(`tornado emergency`) && eventName == `Tornado Warning` && damage == `CATASTROPHIC`) eventName = `Tornado Emergency`;
        if (eventName == `Tornado Warning`) {
            eventName = `Radar Indicated Tornado Warning`;
            if (event.properties.parameters.tornadoDetection == `RADAR INDICATED`) eventName = `Radar Indicated Tornado Warning`;
            if (event.properties.parameters.tornadoDetection == `OBSERVED`) eventName = `Confirmed Tornado Warning`;
        }
        if (eventName == `Severe Thunderstorm Warning`) {
            if (event.properties.parameters.thunderstormDamageThreat == `CONSIDERABLE`) eventName = `Considerable Severe Thunderstorm Warning`;
            if (event.properties.parameters.thunderstormDamageThreat == `DESTRUCTIVE`) eventName = `Destructive Severe Thunderstorm Warning`;
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
        let eventDictionary = loader.cache.configurations.alert_dictionary[event.properties.properEventName] || loader.cache.configurations.alert_dictionary.UNK;
        let { new: newAlertAudio, update: updateAlertAudio, cancel: cancelAlertAudio, eas: easAudio, siren: sirenAudio, amber: amberAudio, autobeep: autobeepAudio } = eventDictionary;
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
            autobeep: autobeepAudio,
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
        let filteredEvents = loader.cache.configurations.project_settings.ignore_restrictions;
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
        if (onlyDoBeeps && !filteredEvents.includes(event.properties.properEventName)) {
            eventActions.audio = defaultAudio;
            onlyBeep = true;
        }
        if (!filteredAllowUpdated && event.properties.messageType == `Updated` && !filteredEvents.includes(event.properties.properEventName)) {
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
      * @function buildCache
      * @description Build the cache and read the alerts from the data and filter them based on the configuration settings
      * 
      * @param {object} rawData - The data object to read the alerts from
      * @param {boolean} isUsingWire - The boolean to check if we are using the NOAA Weather Wire Service
      */

    buildCache = async function(rawData, isUsingWire) {
        try {
            rawData = loader.modules.hooks.filteringHtml(rawData);
            if (rawData.SpotterNetwork) { loader.cache.spotters = loader.modules.parsing.readSpotterNetwork(rawData.SpotterNetwork).message; }
            if (rawData.MesoscaleDiscussions) { loader.cache.discussions = loader.modules.parsing.readRawMesoscaleDicussions(rawData.MesoscaleDiscussions).message;  }
            if (rawData.SpotterNetworkReports) { loader.cache.reports = loader.modules.parsing.rawSpotterNetworkReports(rawData.SpotterNetworkReports).message;  }
            if (rawData.mPingReports) { loader.cache.reports = loader.modules.parsing.rawRawMpingReports(rawData.mPingReports).message;  }
            if (rawData.GRLevelXReports) { loader.cache.reports = loader.modules.parsing.readRawGrlevelXReports(rawData.GRLevelXReports).message;  }
            if (rawData.IEMReports) { loader.cache.reports = loader.modules.parsing.rawIemReports(rawData.IEMReports.features).message;  }
            if (rawData.ProbTornado) { loader.cache.torprob = loader.modules.parsing.rawProbabilityReports(rawData.ProbTornado, `tornado`).message;  }
            if (rawData.ProbSevere) { loader.cache.svrprob = loader.modules.parsing.rawProbabilityReports(rawData.ProbSevere, `severe`).message;  }
            if (rawData.wxRadio) { loader.cache.wxRadio = loader.modules.parsing.readWxRadio(rawData.wxRadio).message;  }
            if ((rawData.NoaaWeatherWireService && isUsingWire) || rawData.NationalWeatherService) {
                let response = loader.modules.parsing.readAlerts(isUsingWire ? true : false, isUsingWire ? rawData.NoaaWeatherWireService : rawData.NationalWeatherService);
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