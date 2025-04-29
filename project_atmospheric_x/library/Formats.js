

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

let LOAD = require(`../loader.js`)

/**
 * @module Formats
 * @description This module is responsible for properly formatting, building, and parsing data passed on from multiple sources including
 * but not limited to the National Weather Service
 * 
 * 
 * 
 * Note: If anyone has any suggestions on how to improve the performance of this module, 
 * please feel free to reach out to me on GitHub or Discord @kiyomi (359794704847601674).
 */


class Formats { 
    constructor() {
        this.author = `k3yomi@GitHub`
        this.production = true
        this.name = `Formats`;
        LOAD.Library.Hooks.PrintLog(`${this.name}`, `Successfully initialized ${this.name} module`);
    }

    /**
     * @function _FormatLocations
     * @description Processes a location string by splitting it into parts, trimming whitespace, 
     * and reassembling it into a properly formatted string. If the input contains 
     * only one location, it is returned as-is.
     *
     * @async
     * @param {string} _paremters - The location string to process (e.g., "Chicago, IL").
     * @return {string} - The processed location string, properly formatted.
     */

    async _FormatLocations(_paremters=`Chicago, IL`) {
        let split_locations = _paremters.split(`,`)
        if (split_locations.length == 1) {return _paremters}
        let parsed_locations;
        split_locations.forEach((location, index) => {
            if (index == 0) {parsed_locations = location.trim()}
            else {parsed_locations += `, ${location.trim()}`}
        });
        return parsed_locations
    }

    /**
     * @function _GetEventParameters
     * @description Parses and formats event parameters from the National Weather Service API into a more user-friendly structure.
     * This function ensures that all relevant event details are extracted and presented in a standardized format.
     * 
     * @async
     * @param {object} _paremeters - The raw parameters object to parse.
     * @return {object} - An object containing the parsed and formatted event parameters.
     */
    
    async _GetEventParameters(_paremeters=undefined) {

        if (_paremeters == undefined) {return {hail: `N/A`, wind: `N/A`, tornado: `N/A`, thunderstorm: [`N/A`]}}
        let hail_size = _paremeters.maxHailSize ? `${_paremeters.maxHailSize}` : `N/A`
        let wind_gust = _paremeters.maxWindGust ? `${_paremeters.maxWindGust}` : `N/A`
        let tornado = _paremeters.tornadoDetection || `N/A`
        let thunderstorm = _paremeters.thunderstormDamageThreat || [`N/A`]
     
        return {hail: hail_size, wind: wind_gust, tornado: tornado, thunderstorm: thunderstorm}
    }

    /**
     * @function _GetCustomEventSignatures
     * @Description This will add a custom event name if the description contains certain keywords.
     * Note: This is a custom function and may not be accurate for all events. But generally works for most of the time.
     * 
     * @async
     * @param {object} _event - The event to parse.
     * @return {string} - The event name.
     */

    async _GetCustomEventSignatures(_event=undefined) {
        if (_event == undefined) {return `Invalid Event Object`}
        let description = (_event.properties.description == undefined) ? `No Description` : _event.properties.description.toLowerCase()
        if (description.includes(`flash flood emergency`) && _event.properties.event == `Flash Flood Warning`) { 
            _event.properties.event = `Flash Flood Emergency`; 
        }
        if (description.includes(`particularly dangerous situation`) && _event.properties.event == `Tornado Warning`) { 
            _event.properties.event = `Particularly Dangerous Situation`; 
        }
        if (description.includes(`tornado emergency`)) { 
            _event.properties.event = `Tornado Emergency`; 
        }
        if (_event.properties.event == `Tornado Warning`) {
            if (_event.properties.parameters.tornadoDetection == `OBSERVED` || description.includes(`confirmed`)) { 
                _event.properties.parameters.tornadoDetection = `Confirmed`; 
                _event.properties.event = `Confirmed Tornado Warning`; 
            } else if (_event.properties.parameters.tornadoDetection == `RADAR INDICATED`) { 
                _event.properties.parameters.tornadoDetection = `Radar Indicated`; 
                _event.properties.event = `Radar Indicated Tornado Warning`; 
            } else if (_event.properties.parameters.tornadoDetection == `POSSIBLE`) { 
                _event.properties.parameters.tornadoDetection = `Cancel`; 
            }
        }
        if (_event.properties.event == `Severe Thunderstorm Warning`) {
            if (_event.properties.parameters.thunderstormDamageThreat == `CONSIDERABLE`) { 
                _event.properties.event = `Considerable Destructive Severe Thunderstorm Warning`; 
            } else if (_event.properties.parameters.thunderstormDamageThreat == `DESTRUCTIVE`) { 
                _event.properties.event = `Destructive Severe Thunderstorm Warning`; 
            } else { 
                _event.properties.event = `Severe Thunderstorm Warning`; 
            }
        }
        return _event.properties.event;
    }

    /**
     * @function _GetCustomEvent
     * @description This method processes an event object to determine the appropriate audio, 
     * message type, and other configurations based on the event's properties. 
     * If the event type is not recognized, it defaults to a predefined "unknown" 
     * configuration. The method also handles specific message types such as 
     * "Update", "Cancel", and "Alert", mapping them to corresponding audio presets 
     * and message descriptions.
     *
     * @async
     * @param {Object} [_event=undefined] - The event object containing properties 
     * @param {string} [_event.properties.event] - The event type used to determine 
     * @param {string} [_event.properties.messageType] - The message type of the 
     * @returns {Promise<Object>} An object containing the processed event details, 
     */

    async _GetCustomEvent(_event=undefined) {
        if (_event == undefined) {return `Invalid Event Object`}
        let audio_to_use = LOAD.cache.configurations.tone_sounds.beep;
        let event_action = LOAD.cache.configurations.alert_dictionary[_event.properties.event];
        let tag_dictionary = LOAD.cache.configurations.definitions.tag_definitions


        let tag = [`No Quick Tag Assigned`]
        for (let [key, value] of Object.entries(tag_dictionary)) { 
            if (_event.properties.description.toLowerCase().includes(key.toLowerCase())) {
                if (tag.includes(`No Quick Tag Assigned`)) {tag = []}
                if (!tag.includes(value)) { tag.push(value); }
            } 
        }

        if (event_action == undefined) {
            event_action = LOAD.cache.configurations.alert_dictionary.UNK;
            let new_alert = event_action.new;
            let update_alert = event_action.update;
            let cancel_alert = event_action.cancel;
            let message_type_table = [
                { event: `Update`, message: `Updated`, audio: update_alert},
                { event: `Cancel`, message: `Expired`, audio: cancel_alert},
                { event: `Alert`, message: `Issued`, audio: new_alert},
                { event: `Updated`, message: `Updated`, audio: update_alert},
                { event: `Expired`, message: `Expired`, audio: cancel_alert},
                { event: `Issued`, message: `Issued`, audio: new_alert},
                { event: `Extended`, message: `Extended`, audio: new_alert },
                { event: `Correction`, message: `Corrected`, audio: update_alert },
                { event: `Upgraded`, message: `Upgraded`, audio: new_alert },
                { event: `Cancelled`, message: `Cancelled`, audio: cancel_alert },
                { event: `Expired`, message: `Expired`, audio: cancel_alert },
                { event: `Routine`, message: `Routine`, audio: update_alert },
            ]
            message_type_table.forEach((item) => {
                if (_event.properties.messageType == item.event) {
                    _event.properties.messageType = item.message;
                    audio_to_use = item.audio;
                }
            });
            return {
                message: _event.properties.messageType,
                audiopresets: { new: new_alert, update: update_alert, cancel: cancel_alert },
                audio: audio_to_use,
                gif: LOAD.cache.configurations.alert_banners.UNK,
                eas: LOAD.cache.configurations.alert_dictionary.UNK.eas,
                siren: LOAD.cache.configurations.alert_dictionary.UNK.siren,
                autobeep: LOAD.cache.configurations.alert_dictionary.UNK.autobeep,
                tag: tag,
            };
        } else {
            let new_alert = event_action.new;
            let update_alert = event_action.update;
            let cancel_alert = event_action.cancel;
            let message_type_table = [
                { event: `Update`, message: `Updated`, audio: update_alert},
                { event: `Cancel`, message: `Expired`, audio: cancel_alert},
                { event: `Alert`, message: `Issued`, audio: new_alert},
                { event: `Updated`, message: `Updated`, audio: update_alert},
                { event: `Expired`, message: `Expired`, audio: cancel_alert},
                { event: `Issued`, message: `Issued`, audio: new_alert},
                { event: `Extended`, message: `Extended`, audio: new_alert },
                { event: `Correction`, message: `Corrected`, audio: update_alert },
                { event: `Upgraded`, message: `Upgraded`, audio: new_alert },
                { event: `Cancelled`, message: `Cancelled`, audio: cancel_alert },
                { event: `Expired`, message: `Expired`, audio: cancel_alert },
                { event: `Routine`, message: `Routine`, audio: update_alert },
            ]
            message_type_table.forEach((item) => {
                if (_event.properties.messageType == item.event) {
                    _event.properties.messageType = item.message;
                    audio_to_use = item.audio;
                }
            });
            return {
                message: _event.properties.messageType,
                audiopresets: { new: new_alert, update: update_alert, cancel: cancel_alert },
                audio: audio_to_use,
                gif: LOAD.cache.configurations.alert_banners[_event.properties.event],
                eas: event_action.eas,
                siren: event_action.siren,
                autobeep: event_action.autobeep,
                notifyCard: event_action.card,
                tag: tag,
            };
        }
    }

    /**
      * @function RegisterEvent
      * @description This function processes and registers an event, applying various configurations to determine how the event 
      * should be handled. It updates the event properties with parameters such as wind, tornado, hail, and thunderstorm 
      * information. It also manages alert notifications, including handling the audio settings based on configuration, 
      * checking for duplicate events, and deciding whether to ignore certain events based on preset rules.
      * 
      * The function also ensures the event details are formatted correctly for further processing, returning both the 
      * raw event and the processed details.
      * 
      * @param {Object} _event - The event object to be processed. This object must have a `properties` field containing 
      *                          necessary event details like `parameters`, `description`, `areaDesc`, and `event`.
      * 
      * @returns {Promise<Object|string>} 
      * Returns a Promise that resolves to an object containing:
      * - `raw`: The original event object.
      * - `details`: A structured object containing key information about the event such as name, type, expiration, 
      *             issued time, locations, description, and more.
      * - `metadata`: Metadata related to the event including signature details.
      * 
      * If the event is invalid or an error occurs during processing, it returns an error message as a string.
      * 
      * @throws {Error} If there is an issue while processing the event, an error message is logged and returned.
      */

    async RegisterEvent(_event=undefined) {
        if (_event == undefined) {return `Invalid Event Object`}
        try {
            let ignore_warning = false;
            let only_beep = false;
            let audio_to_use = LOAD.cache.configurations.tone_sounds.beep;
            let beep_only_cfg = LOAD.cache.configurations.project_settings.beep_only;
            let filtered_events_cfg = LOAD.cache.configurations.project_settings.ignore_restrictions;
            let allow_updates_cfg = LOAD.cache.configurations.project_settings.show_updates;
            let { hail, wind, tornado, thunderstorm} = await this._GetEventParameters(_event.properties.parameters);

            _event.properties.parameters.maxWindGust = wind;
            _event.properties.parameters.tornadoDetection = tornado;
            _event.properties.parameters.thunderstormDamageThreat = thunderstorm[0];
            _event.properties.parameters.maxHailSize = hail;
            if (_event.properties.description == undefined) {
            _event.properties.description = `No Description`;
            }
            _event.properties.areaDesc = await this._FormatLocations(_event.properties.areaDesc);
            _event.properties.event = await this._GetCustomEventSignatures(_event);
            let signature = await this._GetCustomEvent(_event);
            _event.properties.messageType = signature.message;
            if (beep_only_cfg == true) {
                if (!filtered_events_cfg.includes(_event.properties.event)) {
                    audio_to_use = LOAD.cache.configurations.tone_sounds.beep;
                    signature.audio = audio_to_use;
                    only_beep = true;
                }
            }
            if (allow_updates_cfg == false && _event.properties.messageType == `Updated`) {
                if (!filtered_events_cfg.includes(_event.properties.event)) {
                    ignore_warning = true;
                }
            }
            if (signature.notifyCard == undefined) {
                signature.notifyCard = _event.properties.event;
            }
            if (LOAD.cache.configurations.sources.primary_sources.noaa_weather_wire_service.enabled == true) {
                if (_event.action != undefined && _event.action != `N/A`) {_event.properties.messageType = _event.action}
            }
            return {
                raw: _event,
                details: {
                    id: _event.properties.id,
                    name: signature.notifyCard,
                    type: _event.properties.messageType,
                    expires: _event.properties.expires,
                    issued: _event.properties.sent,
                    locations: _event.properties.areaDesc,
                    description: _event.properties.description,
                    hail: _event.properties.parameters.maxHailSize,
                    wind: _event.properties.parameters.maxWindGust,
                    tornado: _event.properties.parameters.tornadoDetection,
                    thunderstorm: _event.properties.parameters.thunderstormDamageThreat,
                    sender: _event.properties.senderName,
                    tag: signature.tag,
                    link: _event.id,
                },
                metadata: { ...signature, ignored: ignore_warning, only_beep: only_beep },
            };
        } catch (error) {
            LOAD.Library.Hooks.Log(`${this.name}.Register : ${error.message}`);
            LOAD.Library.Hooks.PrintLog(`${this.name}.Register`, `Error registering event: ${error.message}`);
            return `Error processing event`;
        }
    }

    /**
      * @function build
      * @description 
      * This function processes various types of raw data to update the cache with relevant alert information. 
      * It checks for the presence of different alert data such as NWS alerts, weatherwire alerts, spotter network data, 
      * mesoscale discussions, lightning reports, mPing reports, and more. Based on the available data, 
      * it parses the raw information and updates the cache accordingly.
      * 
      * The function ensures that the cache is populated with the latest information about active alerts, warnings, 
      * watches, reports, and stations. In the future, the function may include additional parsing logic as indicated 
      * by the commented-out code.
      * 
      * @param {Object} _raw - The raw alert data to be processed. This object can contain various fields:
      * - `nws`: NWS alert data.
      * - `wire`: WeatherWire alert data.
      * - `spotters`: Spotter network data.
      * - `mesoscale_discussions`: Mesoscale discussion data.
      * - `lightning`: Lightning strike data.
      * - `mPing`: mPing report data.
      * - `grxlsr`: GRLevelX report data.
      * - `lsr`: Iowa Environmental Mesonet LSR report data.
      * - `nwsstat`: NWS station data.
      * 
      * @returns {Promise<void>}
      * The function does not return any value. It updates the cache directly with the parsed alert data.
      * 
      * @throws {Error} If an error occurs during the processing of the raw data, it logs the error message and prints 
      * a message indicating that there was an issue building the alerts.
      */

    async build(_raw={}, wire=false) {
        try {
            if (_raw.wire != undefined && wire == true) {
                let response = await LOAD.Library.Parsing._ReadNWSAlerts(_raw.wire);
                LOAD.cache.alerts.active = response.active;
                LOAD.cache.alerts.warnings = response.warnings;
                LOAD.cache.alerts.watches = response.watches; 
            }
            if (_raw.nws != undefined && _raw.nws.features.length > 0) {
                let response = await LOAD.Library.Parsing._ReadNWSAlerts(_raw.nws);
                LOAD.cache.alerts.active = response.active;
                LOAD.cache.alerts.warnings = response.warnings;
                LOAD.cache.alerts.watches = response.watches;
            }
            if (_raw.spotters != undefined) {
                let response = await LOAD.Library.Parsing._ReadRawSpotterNetwork(_raw.spotters);
                LOAD.cache.alerts.spotters = response;
            }
            if (_raw.mesoscale_discussions != undefined) {
                let response = await LOAD.Library.Parsing._ReadRawMesoscaleDiscussions(_raw.mesoscale_discussions);
                LOAD.cache.alerts.mesoscale = response;
            }
            if (_raw.lightning != undefined) {
                let response = await LOAD.Library.Parsing._ReadRawLightningReports(_raw.lightning);
                LOAD.cache.alerts.lightning = response;
            }
            if (_raw.mPing != undefined) {
                let response = await LOAD.Library.Parsing._ReadRawMPingReports(_raw.mPing);
                LOAD.cache.alerts.reports = response;
            }
            if (_raw.grxlsr != undefined) {
                let response = await LOAD.Library.Parsing._ReadRawGRLevelXReports(_raw.grxlsr);
                LOAD.cache.alerts.reports = response;
            }
            if (_raw.lsr != undefined) {
                let response = await LOAD.Library.Parsing._ReadIowaLocalStormReports(_raw.lsr.features);
                LOAD.cache.alerts.reports = response;
            }
            if (_raw.nwsstat != undefined && _raw.nwsstat.features.length > 0) {
                let response = await LOAD.Library.Parsing._ReadRawStations(_raw.nwsstat);
                LOAD.cache.alerts.stations = response;
            }
            await LOAD.Library.Routes.SyncClients()
        } catch (error) {
            LOAD.Library.Hooks.Log(`${this.name}.Build : ${error.message}`)
            LOAD.Library.Hooks.PrintLog(`${this.name}.Build`, `Error building alerts: ${error.message}`)
        }
    }
}

module.exports = Formats;