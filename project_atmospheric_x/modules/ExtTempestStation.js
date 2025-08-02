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


class TempestService { 
    constructor() {
        this.name = `TempestService`;
        this.lastUpdate = 0;
        this.latitude = 0;
        this.longitude = 0;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
        this.createSession()
    }

    /**
      * @function createSession
      * @description Creates a session with the Tempest Weather Station Package.
      */

    setClosest = async function(latitude, longitude) {
        try {
            return new Promise(async (resolve, reject) => {
                if (this.latitude === latitude && this.longitude === longitude) { resolve({ statusCode: 200, message: `Closest station already set for these coordinates` }); return; }
                this.latitude = latitude; this.longitude = longitude;
                let station = await loader.static.tempest.getClosestStation(latitude, longitude)
                let stationName = station.name
                let stationDistance = station.distance
                let selectedStationId = station.stations[0]
                loader.static.tempest.setCoreSettings(station.stations[0], station.id)
                let onData = loader.static.tempest.onEvent(loader.cache.configurations.sources.miscellaneous_sources.mesonet_services.forecasts == true ? `onObservation` : `onForecast`, (data) => {
                    onData();
                    resolve({ statusCode: 200, message: `Closest station set successfully`, stationId: selectedStationId, stationName: stationName, stationDistance: stationDistance });
                })
                setTimeout(() => {
                    if (onData) { onData(); reject({ statusCode: 408, message: `Observation data not received within timeout period` }); }
                }, 5000);
            })
        } catch (err) { return Promise.reject(err); }
    }

     
    createSession = async function() {
        let mesonetServices = loader.cache.configurations.sources.miscellaneous_sources.mesonet_services;
        if (!mesonetServices.tempest_weather_station.enabled) return;
        loader.cache.mesonet = {}
        loader.cache.tmesonet = { wind: {}, observations: {}, forecast: {}, lightning: {}, property: {}, setter: this };
        loader.static.tempest = new loader.packages.tempest({
            apiKey: mesonetServices.tempest_weather_station.api_key,
            deviceId: mesonetServices.tempest_weather_station.device_id,
            stationId: mesonetServices.tempest_weather_station.station_id,
            enableForecasts: mesonetServices.tempest_weather_station.forecasts,
        });
        loader.static.tempest.onEvent(`onObservation`, (data) => { loader.cache.tmesonet.observations = data; loader.modules.hooks.onMesonetUpdate() });
        loader.static.tempest.onEvent(`onWind`, (data) => { loader.cache.tmesonet.wind = data; });
        loader.static.tempest.onEvent(`onForecast`, (data) => { loader.cache.tmesonet.forecast = data; loader.modules.hooks.onMesonetUpdate()  });
        loader.static.tempest.onEvent(`onLightning`, (data) => { loader.cache.tmesonet.lightning = data; });
        loader.static.tempest.onEvent(`onError`, (data) => { 
            console.log(data)
        });
    }
}


module.exports = TempestService;