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

    formatLocations = function(locations=`Chicago, IL`) { 
        let splitLocations = locations.split(`,`)
        let parsedLocations = ``
        if (splitLocations.length == 1) { return locations } 
        splitLocations.forEach((location, index) => {
            if (index == 0) { parsedLocations += `${location.trim()}` }
            else { parsedLocations += `, ${location.trim()}` }
        })
        return parsedLocations
    }

    /**
      * @function getEventParameters
      * @description Get the event parameters from the alert object
      * Example: maxHailSize, maxWindGust, tornadoDetection, thunderstormDamageThreat
      * 
      * @param {object} event - The alert object to get the parameters from
      */

    getEventParameters = function(event) { 
        let hailSize = event.properties.parameters.maxHailSize ? `${event.properties.parameters.maxHailSize}` : `N/A`
        let windGust = event.properties.parameters.maxWindGust ? `${event.properties.parameters.maxWindGust}` : `N/A`
        let tornadoThreat = event.properties.parameters.tornadoDetection || event.properties.parameters.waterspoutDetection || `N/A`
        let damageThreat = event.properties.parameters.thunderstormDamageThreat || event.properties.parameters.tornadoDamageThreat || [`N/A`]
        return { hail: hailSize, wind: windGust, tornado: tornadoThreat, damage: damageThreat }
    }

    /**
      * @function getEventSignificance
      * @description Get the event significance from the alert object, if needed change the event name to a more significant name
      * depending on the description of the alert and or parameters of the alert
      * 
      * @param {object} event - The alert object to get the significance from
      */

    getEventSignificance = function(event, damage) { 
        let description = (event.properties.description == undefined) ? `No description provided` : event.properties.description.toLowerCase() 
        if (description.includes(`flash flood emergency`) && event.properties.event == `Flash Flood Warning`) { event.properties.event = `Flash Flood Emergency`}
        if (description.includes(`particularly dangerous situation`) && event.properties.event == `Tornado Warning` && damage == `CONSIDERABLE`) { event.properties.event = `Particularly Dangerous Situation`}
        if (description.includes(`tornado emergency`) && event.properties.event == `Tornado Warning` && damage == `CATASTROPHIC`) { event.properties.event = `Tornado Emergency`}

        if (event.properties.event == `Tornado Warning`) {
            if (event.properties.parameters.tornadoDetection == `RADAR INDICATED`) { event.properties.event = `Radar Indicated Tornado Warning`}
            if (event.properties.parameters.tornadoDetection == `OBSERVED`) { event.properties.event = `Confirmed Tornado Warning` }
        }
        if (event.properties.event == `Severe Thunderstorm Warning`) {
            if (event.properties.parameters.thunderstormDamageThreat == `CONSIDERABLE`) { event.properties.event = `Considerable Severe Thunderstorm Warning` }
            if (event.properties.parameters.thunderstormDamageThreat == `DESTRUCTIVE`) { event.properties.event = `Destructive Severe Thunderstorm Warning` }
        }
        return event.properties.event
    }

    /**
      * @function getEventTag
      * @description Get the event tags from the alert object
      * 
      * @param {object} event - The alert object to check
      */

    getEventTag = function(event) { 
        let tagDictionary = loader.cache.configurations.tags
        let tags = [`No tags found`]
        for (let [key, value] of Object.entries(tagDictionary)) { 
            if (event.properties.description.toLowerCase().includes(key.toLowerCase())) {
                if (tags.includes(`No tags found`)) {tags = []}
                if (!tags.includes(value)) { tags.push(value); }
            } 
        }
        return tags
    }

    /**
      * @function getEventActions
      * @description Get the event actions from the alert object
      * 
      * @param {object} event - The alert object to get the actions from
      */

    getEventActions = function(event) { 
        let defaultAudio = loader.cache.configurations.tone_sounds.beep
        let eventDictionary = loader.cache.configurations.alert_dictionary[event.properties.event]
        let newAlertAudio = (eventDictionary == undefined) ? loader.cache.configurations.alert_dictionary.UNK.new : eventDictionary.new
        let updateAlertAudio = (eventDictionary == undefined) ? loader.cache.configurations.alert_dictionary.UNK.update : eventDictionary.update
        let cancelAlertAudio = (eventDictionary == undefined) ? loader.cache.configurations.alert_dictionary.UNK.cancel : eventDictionary.cancel
        let easAudio = (eventDictionary == undefined) ? loader.cache.configurations.alert_dictionary.UNK.eas : eventDictionary.eas
        let sirenAudio = (eventDictionary == undefined) ? loader.cache.configurations.alert_dictionary.UNK.siren : eventDictionary.siren
        let autobeepAudio = (eventDictionary == undefined) ? loader.cache.configurations.alert_dictionary.UNK.autobeep : eventDictionary.autobeep
        let editedEventName = (eventDictionary == undefined) ? event.properties.event : eventDictionary.card
        let messageState = [
            { event: `Update`, message: `Updated`, audio: updateAlertAudio},
            { event: `Cancel`, message: `Expired`, audio: cancelAlertAudio},
            { event: `Alert`, message: `Issued`, audio: newAlertAudio},
            { event: `Updated`, message: `Updated`, audio: updateAlertAudio},
            { event: `Expired`, message: `Expired`, audio: cancelAlertAudio},
            { event: `Issued`, message: `Issued`, audio: newAlertAudio},
            { event: `Extended`, message: `Updated`, audio: newAlertAudio },
            { event: `Correction`, message: `Updated`, audio: updateAlertAudio },
            { event: `Upgraded`, message: `Upgraded`, audio: newAlertAudio },
            { event: `Cancelled`, message: `Cancelled`, audio: cancelAlertAudio },
            { event: `Expired`, message: `Expired`, audio: cancelAlertAudio },
            { event: `Routine`, message: `Routine`, audio: updateAlertAudio },
        ]
        messageState.forEach((item) => { if (event.properties.messageType == item.event) { event.properties.messageType = item.message; defaultAudio = item.audio; }});
        return {
            message: event.properties.messageType,
            name: editedEventName,
            audiopresets: { new: newAlertAudio, update: updateAlertAudio, cancel: cancelAlertAudio },
            audio: defaultAudio,
            eas: easAudio,
            siren: sirenAudio,
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
        let ignoreWarning = false
        let onlyBeep = false 
        let defaultAudio = loader.cache.configurations.tone_sounds.beep
        let onlyDoBeeps = loader.cache.configurations.project_settings.beep_only
        let filteredEvents = loader.cache.configurations.project_settings.ignore_restrictions
        let filteredAllowUpdated = loader.cache.configurations.project_settings.show_updates
        let {hail, wind, tornado, damage} = this.getEventParameters(event)
        let eventTags = this.getEventTag(event)
        event.properties.areaDesc = this.formatLocations(event.properties.areaDesc)
        event.properties.event = this.getEventSignificance(event, damage)
        let eventActions = this.getEventActions(event)
        event.properties.parameters.maxWindGust = wind
        event.properties.parameters.maxHailSize = hail
        event.properties.parameters.tornadoDetection = tornado
        if (event.properties.description == undefined) { event.properties.description = `No description provided` }
        event.properties.messageType = eventActions.message
        if (onlyDoBeeps) {
            if (!filteredEvents.includes(event.properties.event)) { 
                eventActions.audio = defaultAudio 
                onlyBeep = true
            }
        }
        if (!filteredAllowUpdated && event.properties.messageType == `Updated`) {
            if (!filteredEvents.includes(event.properties.event)) { 
                ignoreWarning = true
            }
        }
        event.properties.event = eventActions.name
        return {
            raw: event,
            details: {
                id: event.properties.id,
                name: event.properties.event,
                type: event.properties.messageType,
                expires: event.properties.expires,
                issued: event.properties.sent,
                locations: event.properties.areaDesc,
                description: event.properties.description,
                hail: event.properties.parameters.maxHailSize != `N/A` ? `${event.properties.parameters.maxHailSize} IN` : `N/A`,
                wind: event.properties.parameters.maxWindGust == "0" ? `N/A` : `${event.properties.parameters.maxWindGust}`,
                tornado: event.properties.parameters.tornadoDetection,
                damage: damage[0],
                sender: event.properties.senderName,
                tag: eventTags,
                link: event.id,
            },
            metadata: { ...eventActions, ignored: ignoreWarning, onlyBeep: onlyBeep },
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
            rawData = loader.modules.hooks.filteringHtml(rawData)
            if (rawData.NoaaWeatherWireService != undefined && isUsingWire == true ) {
                let response = loader.modules.parsing.readAlerts(rawData.NoaaWeatherWireService)
                loader.cache.active = response.message
            }
            if (rawData.NationalWeatherService != undefined && rawData.NationalWeatherService.features.length > 0) {
                let response = loader.modules.parsing.readAlerts(rawData.NationalWeatherService)
                loader.cache.active = response.message
            }
            if (rawData.SpotterNetwork != undefined) {
                let response = loader.modules.parsing.readSpotterNetwork(rawData.SpotterNetwork)
                loader.cache.spotters = response.message;
            }
            if (rawData.MesoscaleDiscussions != undefined) {
                let response = loader.modules.parsing.readRawMesoscaleDicussions(rawData.MesoscaleDiscussions)
                loader.cache.discussions = response.message;
            }
            if (rawData.SpotterNetworkReports != undefined) {
                let response = loader.modules.parsing.rawSpotterNetworkReports(rawData.SpotterNetworkReports)
                loader.cache.reports = response.message
            }
            if (rawData.mPingReports != undefined) {
                let response = loader.modules.parsing.rawRawMpingReports(rawData.mPingReports)
                loader.cache.reports = response.message
            }
            if (rawData.GRLevelXReports != undefined) {
                let response = loader.modules.parsing.readRawGrlevelXReports(rawData.GRLevelXReports)
                loader.cache.reports = response.message
            }
            if (rawData.IEMReports != undefined) {
                let response = loader.modules.parsing.rawIemReports(rawData.IEMReports.features)
                loader.cache.reports = response.message
            }
            if (rawData.ProbTornado != undefined) {
                let response = loader.modules.parsing.rawProbabilityReports(rawData.ProbTornado, `tornado`)
                loader.cache.torprob = response.message
            }
            if (rawData.ProbSevere != undefined) {
                let response = loader.modules.parsing.rawProbabilityReports(rawData.ProbSevere, `severe`)
                loader.cache.svrprob = response.message
            }
            if (rawData.wxRadio != undefined) {
                let response = loader.modules.parsing.readWxRadio(rawData.wxRadio)
                loader.cache.wxRadio = response.message
            }
            if (rawData.RealtimeIRL != undefined) { 
                if (typeof loader.cache.realtime != `object`) { loader.cache.realtime = {} }
                loader.cache.realtime.lat = rawData.RealtimeIRL.location.latitude;
                loader.cache.realtime.lon = rawData.RealtimeIRL.location.longitude;
                let toLocation = await loader.modules.hooks.converCoordinated(loader.cache.realtime.lat, loader.cache.realtime.lon)
                if (toLocation != `err`) {
                    let address = toLocation.address
                    loader.cache.realtime.address = `${address.house_number}, ${address.road}, ${address.city || address.municipality}, ${address.state}, ${address.postcode}`; 
                    loader.cache.realtime.location = `${address.city || address.municipality}, ${address.state}`
                    loader.cache.realtime.county = address.county;
                    loader.cache.realtime.state = address.state;
                }
            }
            loader.modules.websocket.onCacheReady()
            return {status: true, message: `Cache built successfully`}
        } catch (error) {
            loader.modules.hooks.createOutput(this.name, `Error while building cache: ${error}`)
            loader.modules.hooks.createLog(this.name, `Error while building cache: ${error}`)
            return {status: false, message: `Error while building cache: ${error}`}
        }
    }
}

module.exports = Building;