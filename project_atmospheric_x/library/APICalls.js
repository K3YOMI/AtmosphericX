

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
 * @module APICalls
 * @description This module provides a set of functions to handle API calls and data processing for various weather-related services.
 * It includes methods for managing API configurations, resolving conflicts, and processing data from multiple sources.
 * 
 * @requires axios
 * 
 * 
 * Note: For performance improvements or suggestions, feel free to reach out to me on GitHub or Discord @kiyomi (359794704847601674).
 */


class APICalls { 
    constructor() {
        this.author = `k3yomi@GitHub`
        this.production = true
        this.name = `APICalls`;
        this.retries = 0;
        this.results = ``
        this.data = {}
        LOAD.Library.Hooks.PrintLog(`${this.name}`, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function _NationalWeatherServiceAlerts
      * @description Fetches National Weather Service (NWS) alerts data from the specified API and processes the response.
      * 
      * @param {Object} _handle - An object containing the National Weather Service API URL under the `national_weather_service` property and 
      *                            optionally a state code under `state_filter`.
      * 
      * @returns {Promise<void>} - Resolves when the operation is complete, either successfully or after retries.
      * - If the request is successful, the NWS alerts data is stored in `this.data.nws`.
      * - If the request fails after retries, an error message is logged, and the results are updated with an error status.
      */

    async _NationalWeatherServiceAlerts(_handle) {
        let url = _handle.endpoint
        let state = _handle.state_filter
        if (state && state !== 'ALL') { url += `/area/${state}`; }
        try {
            let response = await LOAD.Library.Hooks.CallHTTPS(url);
            if (response != undefined && response.features) {
                this.data.nws = response;
                this.results += ` (NationalWeatherService: OK)`;
                return
            } else {
                if (this.retries < 3) { 
                    this.retries++;
                    LOAD.Library.Hooks.PrintLog(`${this.name}.NationalWeatherService`, `Retrying NationalWeatherService request... (${this.retries})`);
                    LOAD.Library.Hooks.Log(`${this.name}.NationalWeatherService : ${response.error}`)
                    await this._NationalWeatherServiceAlerts(_handle);
                } else {
                    throw new Error('Invalid response');
                }
            }
        } catch (error) {
            this.resuslts += ` (NationalWeatherService: ERR)`;
            LOAD.Library.Hooks.PrintLog(`${this.name}.NationalWeatherService`, `Failed to fetch data: ${error.message}`);
            LOAD.Library.Hooks.Log(`${this.name}.NationalWeatherService : ${error.message}`);
            return
        }
    }

    /**
      * @function _SpotterNetworkPlacefile
      * @description Fetches data about Spotter Network members from the specified API and processes the response.
      * 
      * @param {Object} _handle - An object containing the Spotter Network members API URL under the `endpoint` property.
      * 
      * @returns {Promise<void>} - Resolves when the operation is complete, either successfully or after retries.
      * - If the request is successful, the Spotter Network member data is stored in `this.data.spotters`.
      * - If the request fails after retries, an error message is logged, and the results are updated with an error status.
      */

    async _SpotterNetworkPlacefile(_handle) {
        let url = _handle.endpoint
        try {
            let response = await LOAD.Library.Hooks.CallHTTPS(url);
            if (response != undefined) {
                this.data.spotters = response;
                this.results += ` (SpotterNetwork: OK)`; 
                return  
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (this.retries < 3) {
                this.retries++;
                LOAD.Library.Hooks.PrintLog(`${this.name}.SpotterNetwork`, `Retrying SpotterNetwork request... (${this.retries})`);
                LOAD.Library.Hooks.Log(`${this.name}.SpotterNetwork : ${error.message}`);
                await this._SpotterNetworkPlacefile(_handle);
            } else {
                this.results += ` (SpotterNetwork: ERR)`;
                LOAD.Library.Hooks.PrintLog(`${this.name}.SpotterNetwork`, `${error.message}`);
                LOAD.Library.Hooks.Log(`${this.name}.SpotterNetwork : ${error.message}`);
                return
            }
        }
    }

    /**
      * @function _SPCMesoscaleDiscussionPlacefile
      * @description 
      * Fetches mesoscale convective discussion data from the SPC (Storm Prediction Center) API and stores the result.
      * 
      * @param {Object} _handle - An object containing the SPC Mesoscale Discussion API URL under the `endpoint` property.
      * 
      * @returns {Promise<void>} - Resolves when the operation is complete, either successfully or after retries.
      * - If the request is successful, the data is stored in `this.data.mesoscale_discussions`.
      * - If the request fails after retries, an error message is logged, and the results are updated with an error status.
      */

    async _SPCMesoscaleDiscussionPlacefile(_handle) {
        let url = _handle.endpoint
            try {
                let response = await LOAD.Library.Hooks.CallHTTPS(url);
                if (response != undefined) {
                    this.data.mesoscale_discussions = response;
                    this.results += ` (MesoscaleDiscussion: OK)`;
                    return
                } else {
                    throw new Error('Invalid response');
                }
            } catch (error) {
                if (this.retries < 3) {
                    this.retries++;
                    LOAD.Library.Hooks.PrintLog(`${this.name}.MesoscaleDiscussion`, `Retrying MesoscaleDiscussion API request... (${this.retries})`);
                    LOAD.Library.Hooks.Log(`${this.name}.MesoscaleDiscussion : ${error.message}`);
                    await this._SPCMesoscaleDiscussionPlacefile(_handle);
                } else {
                    this.results += ` (MesoscaleDiscussion: ERR)`;
                    LOAD.Library.Hooks.PrintLog(`${this.name}.MesoscaleDiscussion`, `${error.message}`);
                    LOAD.Library.Hooks.Log(`${this.name}.MesoscaleDiscussion : ${error.message}`);
                    return
                }
            }
        
    }

    /**
      * @function _LightningStrikesPlacefile
      * @description 
      * Fetches lightning strike data from the specified API and stores the result.
      * 
      * @param {Object} _handle - An object containing the Lightning Strikes API URL under the `endpoint` property.
      * 
      * @returns {Promise<void>} - Resolves when the operation is complete, either successfully or after retries.
      * - If the request is successful, the data is stored in `this.data.lightning`.
      * - If the request fails after retries, an error message is logged, and the results are updated with an error status.
      */


    async _LightningStrikesPlacefile(_handle) {
        let url = _handle.endpoint
        try {
            let response = await LOAD.Library.Hooks.CallHTTPS(url);
            if (response != undefined) {
                this.data.lightning = response;
                this.results += ` (LightningStrikes: OK)`;
                return
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (this.retries < 3) {
                this.retries++;
                LOAD.Library.Hooks.PrintLog(`${this.name}.LightningStrikes`, `Retrying LightningStrikes API request... (${this.retries})`);
                LOAD.Library.Hooks.Log(`${this.name}.LightningStrikes : ${error.message}`);
                await this._LightningStrikesPlacefile(_handle);
            } else {
                this.results += ` (LightningStrikes: ERR)`;
                LOAD.Library.Hooks.PrintLog(`${this.name}.LightningStrikes`, `${error.message}`);
                LOAD.Library.Hooks.Log(`${this.name}.LightningStrikes : ${error.message}`);
                return
            }
        } 
    }

    /**
      * @function _mPingReports
      * @description 
      * Fetches mPing reports data from the specified API and stores the result.
      * 
      * @param {Object} _handle - An object containing the mPing reports API URL under the `endpoint` property.
      * 
      * @returns {Promise<void>} - Resolves when the operation is complete, either successfully or after retries.
      * - If the request is successful, the data is stored in `this.data.mPing`.
      * - If the request fails after retries, an error message is logged, and the results are updated with an error status.
      */


    async _mPingReports(_handle) {
        let url = _handle.endpoint
            try {
                let response = await LOAD.Library.Hooks.CallHTTPS(url);
                if (response != undefined) {
                    this.data.mPing = response;
                    this.results += ` (mPing: OK)`;
                    return
                } else {
                    throw new Error('Invalid response');
                }
            } catch (error) {
                if (this.retries < 3) {
                    this.retries++;
                    LOAD.Library.Hooks.PrintLog(`${this.name}.mPing`, `Retrying mPing request... (${this.retries})`);
                    LOAD.Library.Hooks.Log(`${this.name}.mPing : ${error.message}`);
                    await this._mPingReports(_handle);
                } else {
                    this.results += ` (mPing: ERR)`;
                    LOAD.Library.Hooks.PrintLog(`${this.name}.mPing`, `${error.message}`);
                    LOAD.Library.Hooks.Log(`${this.name}.mPing : ${error.message}`);
                    return
                }
            }
        
    }

    /**
      * @function _GRLevelXReports
      * @description Fetches GRLevelX reports data from the specified API and stores the result.
      * 
      * @param {Object} _handle - An object containing the necessary information for the API request:
      *   - `endpoint`: The URL of the GRLevelX reports API endpoint.
      * 
      * @returns {Promise<void>} - Resolves when the operation is complete, either successfully or after retries.
      * - If the request is successful, the data is stored in `this.data.grxlsr`.
      * - If the request fails after retries, an error message is logged, and the results are updated with an error status.
      */


    async _GRLevelXReports(_handle) {
        let url = _handle.endpoint
        try {
            let response = await LOAD.Library.Hooks.CallHTTPS(url);
            if (response != undefined) {
                this.data.grxlsr = response;
                this.results += ` (GRLevelXReports: OK)`;
                return
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (this.retries < 3) {
                this.retries++;
                LOAD.Library.Hooks.PrintLog(`${this.name}.GRLevelXReports`, `Retrying GRLevelXReports request... (${this.retries})`);
                LOAD.Library.Hooks.Log(`${this.name}.GRLevelXReports : ${error.message}`);
                await this._GRLevelXReports(_handle);
            } else {
                this.results += ` (GRLevelXReports: ERR)`;
                LOAD.Library.Hooks.PrintLog(`${this.name}.GRLevelXReports`, `${error.message}`);
                LOAD.Library.Hooks.Log(`${this.name}.GRLevelXReports : ${error.message}`);
                return
            }
        }
    }

    /**
      * @function _IowaEnvironmentalMesonetReports
      * @description Fetches Iowa Environmental Mesonet reports data from the specified API and stores the result.
      * 
      * 
      * @param {Object} _handle - An object containing the necessary information for the API request:
      *   - `endpoint`: The URL of the Iowa Environmental Mesonet reports API endpoint.
      *   - `abbreviated_state`: The state for which the report is being requested. If `ALL` or empty, no state filter is applied.
      *   - `data_retention_hours`: The number of hours for which the report should be fetched.
      * 
      * @returns {Promise<void>} - Resolves when the operation is complete, either successfully or after retries.
      * - If the request is successful, the data is stored in `this.data.lsr`.
      * - If the request fails after retries, an error message is logged, and the results are updated with an error status.
      */


    async _IowaEnvironmentalMesonetReports(_handle) {
        let url = _handle.endpoint
        let state = _handle.abbreviated_state
        let hours = _handle.data_retention_hours
        try {
            url += `hours=${hours}`;
            if (state != `ALL` && state != ``) {
                url += `&states=${state}`;
            }
            let response = await LOAD.Library.Hooks.CallHTTPS(url);
            if (response != undefined && response.features != undefined) {
                this.data.lsr = response;
                this.results += ` (IowaEM: OK)`;
                return
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (this.retries < 3) {
                this.retries++;
                LOAD.Library.Hooks.PrintLog(`${this.name}.IowaEM`, `Retrying IowaEM request... (${this.retries})`);
                LOAD.Library.Hooks.Log(`${this.name}.IowaEM : ${error.message}`);
                await this._IowaEnvironmentalMesonetReports(_handle);
            } else {
                this.results += ` (IowaEM: ERR)`;
                LOAD.Library.Hooks.PrintLog(`${this.name}.IowaEM`, `${error.message}`);
                LOAD.Library.Hooks.Log(`${this.name}.IowaEM : ${error.message}`);
                return
            }
        }
    }

    /**
      * @function _NexradStations
      * @description Fetches Nexrad stations data from the specified API and stores the result.
      * 
      * @param {Object} _handle - An object containing the Nexrad stations API URL under the `endpoint` property.
      * 
      * @returns {Promise<void>}
      */


    async _NexradStations(_handle) {
        let url = _handle.endpoint
        try {
            let response = await LOAD.Library.Hooks.CallHTTPS(url);
            if (response != undefined && response.features) {
                this.data.nwsstat = response;
                this.results += ` (NexradStations: OK)`;
                return
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (this.retries < 3) {
                this.retries++;
                LOAD.Library.Hooks.PrintLog(`${this.name}.NexradStations`, `Retrying NexradStations API request... (${this.retries})`);
                LOAD.Library.Hooks.Log(`${this.name}.NexradStations : ${error.message}`);
                await this._NexradStations(_handle);
            } else {
                this.results += ` (NexradStations: ERR)`;
                LOAD.Library.Hooks.PrintLog(`${this.name}.NexradStations`, `${error.message}`);
                LOAD.Library.Hooks.Log(`${this.name}.NexradStations : ${error.message}`);
                return
            }
        }
    }

    /**
      * @function _NullRoute
      * @description Literally does nothing...
      * 
      * @param {Object} _handle - Just something but not nothing
      */

    async _NullRoute(_handle) {
        return
    }

    /**
      * @function Next
      * @description This function manages API calls based on configuration settings. It checks the cache time for various API services 
      * and ensures that no conflicting APIs are enabled simultaneously. If an API is ready based on its cache timer, 
      * it proceeds to call the relevant handler for that API. This function also handles retries and updates the cache 
      * after each successful call.
      * 
      * The function is designed to check and resolve conflicts between different API calls, ensuring that only one 
      * of the conflicting APIs is enabled at any given time.
      * 
      * @param {Object} _raw - The raw data from the API call, if available. If not provided, the function will check the cache time for each API.
      * @param {boolean} _force_fallback - A flag to force fallback to the National Weather Service API if set to true.
      * @returns {void} 
      * This function returns a value if the API call is successful, otherwise it returns a message indicating that no cache update is available.
      */

    async Next(_raw=undefined, _force_fallback=false) {
        let calls = LOAD.cache.configurations.sources
        let time = new Date()
        this.data = {}
        this.retries = 0
        this.results = ``
        let handles = [
            {name: 'national_weather_service', handle: calls.primary_sources.national_weather_service, timer: calls.primary_sources.national_weather_service.cache_time, contradictions: [`noaa_weather_wire_service`], pointer: `_NationalWeatherServiceAlerts`},
            {name: 'spotter_network', handle: calls.miscellaneous_sources.spotter_network, timer: calls.miscellaneous_sources.spotter_network.cache_time, contradictions: [], pointer: `_SpotterNetworkPlacefile`},
            {name: 'spc_mesoscale_discussions', handle: calls.miscellaneous_sources.spc_mesoscale_discussions, timer: calls.miscellaneous_sources.spc_mesoscale_discussions.cache_time, contradictions: [], pointer: `_SPCMesoscaleDiscussionPlacefile`},
            {name: 'lightning_reports', handle: calls.miscellaneous_sources.lightning_reports, timer: calls.miscellaneous_sources.lightning_reports.cache_time, contradictions: [], pointer: `_LightningStrikesPlacefile`},
            {name: 'mping_reports', handle: calls.miscellaneous_sources.mping_reports, timer: calls.miscellaneous_sources.mping_reports.cache_time, contradictions: [`iem_local_storm_reports`, `grlevelx_reports`, `noaa_weather_wire_service_lsr`], pointer: `_mPingReports`},
            {name: 'iem_local_storm_reports', handle: calls.miscellaneous_sources.iem_local_storm_reports, timer: calls.miscellaneous_sources.iem_local_storm_reports.cache_time, contradictions: [`mping_reports`, `grlevelx_reports`, `noaa_weather_wire_service_lsr`], pointer: `_IowaEnvironmentalMesonetReports`},
            {name: 'grlevelx_reports', handle: calls.miscellaneous_sources.grlevelx_reports, timer: calls.miscellaneous_sources.grlevelx_reports.cache_time, contradictions: [`mping_reports`, `iem_local_storm_reports`, `noaa_weather_wire_service_lsr`], pointer: `_GRLevelXReports`},
            {name: 'nexrad_stations', handle: calls.miscellaneous_sources.nexrad_stations, timer: calls.miscellaneous_sources.nexrad_stations.cache_time, contradictions: [], pointer: `_NexradStations`},
            {name: 'noaa_weather_wire_service', handle: calls.primary_sources.noaa_weather_wire_service, timer: 1, contradictions: [`national_weather_service`], pointer: `_NullRoute`},        ];
        if (_raw == undefined) {
            handles.forEach(handle => {
                let contradictions = handle.contradictions;
                contradictions.forEach(contradiction => {
                    let index = handles.findIndex(handle => handle.name === contradiction);
                    if (index !== -1 && handles[index].handle.enabled=== true) {
                        if (handle.handle.enabled === true) {
                            LOAD.Library.Hooks.PrintLog(`${this.name}.Warning`, `Conflicting API detected: ${handle.name} and ${contradiction}. Disabling ${contradiction}.`);
                            LOAD.Library.Hooks.Log(`${this.name}.Warning : Conflicting API detected: ${handle.name} and ${contradiction}. Disabling ${contradiction}.`);
                            handles[index].handle.enabled = false;
                        }
                    }
                })
            })
            let active = handles.filter(handle => handle.handle.enabled == true)
            active.forEach(handle => {
                if (LOAD.cache.time[handle.name] == undefined) {LOAD.cache.time[handle.name] = Date.now() - handle.timer * 1000}
            })
            let ready = active.filter(handle => (Date.now() - LOAD.cache.time[handle.name]) / 1000 >= handle.timer) // filter out the ones ready to be requested
            for (const handle of ready) {
                LOAD.cache.time[handle.name] = Date.now();
                this.retries = 0
                await this[handle.pointer](handle.handle);
            }    
        }
        if (_raw != undefined) { 
            if (LOAD.cache.time[`nwws`] == undefined) {LOAD.cache.time[`nwws`] = 0}
            if (LOAD.cache.time[`nwws`] < Date.now() - calls.primary_sources.noaa_weather_wire_service.cache_time * 1000) {
                LOAD.cache.time[`nwws`] = Date.now()
                this.data.wire = _raw; 
            }
        }
        if (_force_fallback != false) { 
            if (LOAD.cache.time.national_weather_service == undefined) {LOAD.cache.time.national_weather_service = Date.now() - calls.primary_sources.national_weather_service.cache_time * 1000}
            if (LOAD.cache.time.national_weather_service < Date.now() - calls.primary_sources.national_weather_service.cache_time * 1000) { 
                LOAD.cache.time.national_weather_service = Date.now()
                await this._NationalWeatherServiceAlerts(calls.primary_sources.national_weather_service);
            }
        }
        if (Object.keys(this.data).length > 0) {
            if (this.results != ``) { LOAD.Library.Hooks.PrintLog(`${this.name}.Get`, `Cache updated (Taken ${((new Date() - time) / 1000).toFixed(2)}s) |${this.results}`) }
            if (this.data.wire != undefined) { this.data.wire = {features: LOAD.cache.wire.features.filter(feature => feature !== undefined && new Date(feature.properties.expires).getTime() / 1000 > new Date().getTime() / 1000)} }
            return await LOAD.Library.Formats.build(this.data, calls.primary_sources.noaa_weather_wire_service.enabled)
        }
        return `No cache update available`;
    }
}


module.exports = APICalls;