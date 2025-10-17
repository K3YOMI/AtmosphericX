/*
              _                             _               _     __   __
         /\  | |                           | |             (_)    \ \ / /
        /  \ | |_ _ __ ___   ___  ___ _ __ | |__   ___ _ __ _  ___ \ V / 
       / /\ \| __| '_ ` _ \ / _ \/ __| '_ \| '_ \ / _ \ '__| |/ __| > <  
      / ____ \ |_| | | | | | (_) \__ \ |_) | | | |  __/ |  | | (__ / . \ 
     /_/    \_\__|_| |_| |_|\___/|___/ .__/|_| |_|\___|_|  |_|\___/_/ \_\
                                     | |                                 
                                     |_|                                                                                                                
    
    Written by: KiyoWx (k3yomi) & StarflightWx      
                          
*/


import * as loader from '../bootstrap';
import * as types from '../types';


export class Alerts { 
    name: string
    package: typeof loader.packages.nwws.AlertManager
    client: any; 
    constructor() {
        this.package = loader.packages.nwws.AlertManager;
        this.name = `submodule:alerts`;
        this.initalize()
    }

    private initalize() {
        loader.submodules.utils.log(`${this.name} initialized.`)
        this.createInstance();
        this.createListeners();
    }

    private isWithinRange(events: unknown[]) {}
    private create(alerts: unknown[]) { }

    private createListeners() {
        this.client.onEvent(`onAlerts`, (alerts) => {});
        this.client.onEvent(`onError`, (alerts) => {});
    }

    private createInstance() {
        const configurations = loader.cache.internal.configurations as Record<string, any>;
        const alerts = configurations.sources.atmosphericx_alerts_settings
        const nwws = alerts.weather_wire_settings
        const nws = alerts.national_weather_service_settings
        const filter = configurations.filters
        this.client = new this.package({
            database: nwws.database,
            isNWWS: alerts.noaa_weather_wire_service,
            NoaaWeatherWireService: {
                clientReconnections: {
                    canReconnect: nwws.client_reconnections.attempt_reconnections,
                    currentInterval: nwws.client_reconnections.reconnection_attempt_interval,
                },
                clientCredentials: {
                    username: nwws.client_credentials.username,
                    password: nwws.client_credentials.password,
                    nickname: nwws.client_credentials.nickname,
                },   
                cache: {
                    read: nwws.client_cache.read_cache,
                    maxSizeMB: nwws.client_cache.max_size_mb,
                    maxHistory: nwws.client_cache.max_db_history,
                    directory: nwws.client_cache.directory,
                },
                alertPreferences: {
                    isCapOnly: nwws.alert_preferences.cap_only,
                    isShapefileUGC: nwws.alert_preferences.implement_db_ugc,
                }
            },
            NationalWeatherService: {
                checkInterval: nws.interval,
                endpoint: nws.endpoint,
            },
            global: {
                useParentEvents: alerts.global_settings.parent_events,
                betterEventParsing: alerts.global_settings.better_parsing,
                alertFiltering: {
                    filteredEvents: filter.all_events == true ? [] : filter.listening_events,
                    ignoredEvents: filter.ignored_events,
                    filteredICOAs: filter.listening_icoa,
                    ignoredICOAs: filter.ignored_icoa,
                    ugcFilter: filter.listening_ugcs,
                    stateFilter: filter.listening_states,
                    checkExpired: filter.check_expired,
                },
                easSettings: {
                    easAlerts: filter.eas_settings.listening_eas,
                    easDirectory: filter.eas_settings.eas_directory,
                    easIntroWav: filter.eas_settings.eas_intro_wav,
                }
            }
        });
    }

}

export default Alerts;

