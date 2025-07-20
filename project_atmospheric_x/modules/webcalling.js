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


class Webcalling { 
    constructor() {
        this.name = `Webcalling`;
        this.retries = 0;
        this.data = {}
        this.results = ``
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function featureRequest
      * @description Makes a request to the feature endpoint of the given metadata and returns the response
      * 
      * @param {Object} metadata - The metadata object containing the endpoint and other parameters
      * @param {string} reqName - The name of the request to be used in the log messages
      * @param {boolean} isIem - Whether the request is for the IEM (default: false)
      */

    featureRequest = async function(metadata, reqName, isIem = false) {
        return new Promise(async (resolve) => {
            try {
                let url = metadata.endpoint;
                if (isIem) {
                    if (metadata.abbreviated_state && metadata.abbreviated_state !== `ALL`) {
                        url += `hours=${metadata.data_retention_hours}&states=${metadata.abbreviated_state}`;
                    } else if (metadata.data_retention_hours) {
                        url += `hours=${metadata.data_retention_hours}`;
                    }
                }
                let response = await loader.modules.hooks.createHttpRequest(url);
                if (response?.status !== false && response?.message?.features) {
                    this.data[reqName] = response.message;
                    this.results += ` (${reqName}: OK)`;
                    resolve({ success: true, message: response });
                } else {
                    throw new Error(`No features found`);
                }
            } catch (error) {
                if (this.retries < 3) {
                    this.retries++;
                    loader.modules.hooks.createOutput(`${this.name}.featureRequest`, `Retrying request for ${reqName} (${this.retries})`);
                    loader.modules.hooks.createLog(`${this.name}.featureRequest`, `Retrying request for ${reqName} (${this.retries})`);
                    resolve(await this.featureRequest(metadata, reqName, isIem));
                } else {
                    this.results += ` (${reqName}: Failed)`;
                    loader.modules.hooks.createOutput(`${this.name}.featureRequest`, `Failed to get ${reqName} (x${this.retries})`);
                    loader.modules.hooks.createLog(`${this.name}.featureRequest`, `Failed to get ${reqName} (x${this.retries})`);
                    resolve({ success: false, message: error.message });
                }
            }
        });
    }

    /**
      * @function genericRequest
      * @description Makes a generic request to the given metadata and returns the response
      * 
      * @param {Object} metadata - The metadata object containing the endpoint and other parameters
      * @param {string} reqName - The name of the request to be used in the log messages
      * @param {boolean} isIem - Whether the request is for the IEM (default: false)
      */

    genericRequest = async function(metadata, reqName, isIem = false) {
        return new Promise(async (resolve) => {
            try {
                let url = metadata.endpoint;
                if (isIem) {
                    let { state_abbreviation: state, data_retention_hours: hours } = metadata;
                    if (state && state !== `ALL`) url += `hours=${hours}&states=${state}`;
                }
                let response = await loader.modules.hooks.createHttpRequest(url);
                if (response?.status !== false && response?.message) {
                    this.data[reqName] = response.message;
                    this.results += ` (${reqName}: OK)`;
                    resolve({ success: true, message: response });
                } else {
                    throw new Error(`No features found`);
                }
            } catch (error) {
                if (this.retries < 3) {
                    this.retries++;
                    loader.modules.hooks.createOutput(`${this.name}.genericRequest`, `Retrying request for ${reqName} (${this.retries})`);
                    loader.modules.hooks.createLog(`${this.name}.genericRequest`, `Retrying request for ${reqName} (${this.retries})`);
                    resolve(await this.genericRequest(metadata, reqName, isIem));
                } else {
                    this.results += ` (${reqName}: Failed)`;
                    loader.modules.hooks.createOutput(`${this.name}.genericRequest`, `Failed to get ${reqName} (x${this.retries})`);
                    loader.modules.hooks.createLog(`${this.name}.genericRequest`, `Failed to get ${reqName} (x${this.retries})`);
                    resolve({ success: false, message: error.message });
                }
            }
        });
    }

    /**
      * @function nullRoute
      * @description Handles the case where no route is found, this will be used to handle data that doesnt need to be processed through https
      */

    nullRoute = async function() {
        return {success: false, message: `No route found`}
    }

    /**
      * @function nextRun
      * @description This function is called to check if the data is ready to be sent to the client, it will check if the data is ready and if not, it will call the featureRequest function to get the data
      * 
      * @param {boolean} isNWWS - Whether the request is for the NOAA Weather Wire Service (default: undefined)
      * @param {boolean} forceFallback - Whether to force the fallback to the National Weather Service (default: false)
      */

    nextRun = async function(isNWWS = undefined, forceFallback = false) {
        return new Promise(async (resolve) => {
            let sources = loader.cache.configurations.sources;
            let time = new Date();
            this.data = {};
            this.retries = 0;
            this.results = ``;

            let handles = [
                { name: 'NationalWeatherService', handle: sources.primary_sources.national_weather_service, timer: sources.primary_sources.national_weather_service.cache_time, contradictions: ['NoaaWeatherWireService'], pointer: 'featureRequest' },
                { name: 'SpotterNetwork', handle: sources.miscellaneous_sources.location_services.spotter_network, timer: sources.miscellaneous_sources.location_services.spotter_network.cache_time, contradictions: [], pointer: 'genericRequest' },
                { name: 'MesoscaleDiscussions', handle: sources.miscellaneous_sources.spc_mesoscale_discussions, timer: sources.miscellaneous_sources.spc_mesoscale_discussions.cache_time, contradictions: [], pointer: 'genericRequest' },
                { name: 'mPingReports', handle: sources.miscellaneous_sources.mping_reports, timer: sources.miscellaneous_sources.mping_reports.cache_time, contradictions: ['IEMReports', 'GRLevelXReports', 'SpotterNetworkReports'], pointer: 'genericRequest' },
                { name: 'IEMReports', handle: sources.miscellaneous_sources.iem_local_storm_reports, timer: sources.miscellaneous_sources.iem_local_storm_reports.cache_time, contradictions: ['mPingReports', 'GRLevelXReports', 'SpotterNetworkReports'], pointer: 'featureRequest' },
                { name: 'GRLevelXReports', handle: sources.miscellaneous_sources.grlevelx_reports, timer: sources.miscellaneous_sources.grlevelx_reports.cache_time, contradictions: ['mPingReports', 'IEMReports', 'SpotterNetworkReports'], pointer: 'genericRequest' },
                { name: 'SpotterNetworkReports', handle: sources.miscellaneous_sources.spotter_network_reports, timer: sources.miscellaneous_sources.spotter_network_reports.cache_time, contradictions: ['mPingReports', 'IEMReports', 'GRLevelXReports'], pointer: 'genericRequest' },
                { name: 'NoaaWeatherWireService', handle: sources.primary_sources.noaa_weather_wire_service, timer: 1, contradictions: ['NationalWeatherService'], pointer: 'nullRoute' },
                { name: 'ProbTornado', handle: sources.miscellaneous_sources.tornado_probability, timer: sources.miscellaneous_sources.tornado_probability.cache_time, contradictions: [], pointer: 'genericRequest' },
                { name: 'ProbSevere', handle: sources.miscellaneous_sources.severe_probability, timer: sources.miscellaneous_sources.severe_probability.cache_time, contradictions: [], pointer: 'genericRequest' },
                { name: 'wxRadio', handle: sources.miscellaneous_sources.wx_radio, timer: sources.miscellaneous_sources.wx_radio.cache_time, contradictions: [], pointer: 'genericRequest' },
            ];

            if (isNWWS == undefined) {
                handles.forEach(handle => {
                    handle.contradictions.forEach(contradiction => {
                        let index = handles.findIndex(h => h.name == contradiction);
                        if (index !== -1 && handles[index].handle.enabled && handle.handle.enabled) {
                            loader.modules.hooks.createOutput(`${this.name}.nextRun`, `Disabling ${contradiction} due to ${handle.name} being enabled`);
                            loader.modules.hooks.createLog(`${this.name}.nextRun`, `Disabling ${contradiction} due to ${handle.name} being enabled`);
                            handles[index].handle.enabled = false;
                        }
                    });
                });
                let active = handles.filter(handle => handle.handle.enabled);
                active.forEach(handle => {
                    if (!loader.static.httpTimer[handle.name]) loader.static.httpTimer[handle.name] = Date.now() - handle.timer * 1000;
                });
                let ready = active.filter(handle => (Date.now() - loader.static.httpTimer[handle.name]) >= handle.timer * 1000);
                for (let handle of ready) {
                    loader.static.httpTimer[handle.name] = Date.now();
                    this.retries = 0;
                    await this[handle.pointer](handle.handle, handle.name, handle.name == 'IEMReports');
                }
            }
            if (isNWWS !== undefined) {
                if (!loader.static.httpTimer['NoaaWeatherWireService']) loader.static.httpTimer['NoaaWeatherWireService'] = 0;
                if (loader.static.httpTimer['NoaaWeatherWireService'] < Date.now() - sources.primary_sources.noaa_weather_wire_service.cache_time * 1000) {
                    loader.static.httpTimer['NoaaWeatherWireService'] = Date.now();
                    this.data['NoaaWeatherWireService'] = isNWWS;
                }
            }
            if (forceFallback) {
                if (!loader.static.httpTimer['NationalWeatherService']) loader.static.httpTimer['NationalWeatherService'] = Date.now() - sources.primary_sources.national_weather_service.cache_time * 1000;
                if (loader.static.httpTimer['NationalWeatherService'] < Date.now() - sources.primary_sources.national_weather_service.cache_time * 1000) {
                    loader.static.httpTimer['NationalWeatherService'] = Date.now();
                    await this.featureRequest(sources.primary_sources.national_weather_service, 'NationalWeatherService', true, false);
                }
            }
            if (Object.keys(this.data).length > 0) {
                if (this.results) loader.modules.hooks.createOutput(`${this.name}.Get`, `Cache updated (Taken ${(new Date() - time) / 1000}s) |${this.results}`);
                loader.modules.building.buildCache(this.data, loader.cache.configurations.sources.primary_sources.noaa_weather_wire_service.enabled);
                resolve({ success: true, message: this.data });
            } else {
                resolve({ success: false, message: 'No data found' });
            }
        });
    }
}

module.exports = Webcalling;