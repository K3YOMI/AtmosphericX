/*
                                            _               _     __   __
         /\  | |                           | |             (_)    \ \ / /
        /  \ | |_ _ __ ___   ___  ___ _ __ | |__   ___ _ __ _  ___ \ V / 
       / /\ \| __| '_ ` _ \ / _ \/ __| '_ \| '_ \ / _ \ '__| |/ __| > <  
      / ____ \ |_| | | | | | (_) \__ \ |_) | | | |  __/ |  | | (__ / . \ 
     /_/    \_\__|_| |_| |_|\___/|___/ .__/|_| |_|\___|_|  |_|\___/_/ \_\
                                     | |                                 
                                     |_|                                                                                                                
    
    Written by: KiyoWx (k3yomi) & StarflightWx                    
*/


/* [ AtmosphericX Custom Modules ] */
import * as nwws from 'atmosx-nwws-parser';
import * as tempest from 'atmosx-tempest-pulling';
import * as placefile from 'atmosx-placefile-parser';

/* [ Variable Exports ] */
import sqlite3 from 'better-sqlite3';
import express from 'express';
import cookieParser from 'cookie-parser';
import axios from 'axios';


/* [ All Modules Export ] */
import * as events from 'events';
import * as path from 'path'; 
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as http from 'http';
import * as https from 'https';
import * as xmpp from '@xmpp/client';
import * as os from 'os';
import * as xml2js from 'xml2js';
import * as shapefile from 'shapefile';
import * as ws from 'ws';
import * as nodemailer from 'nodemailer';
import * as firebaseApp from 'firebase/app';
import * as firebaseDatabase from 'firebase/database';
import * as streamerBot from '@streamerbot/client';
import * as cron from 'node-cron';
import * as jsonc from 'jsonc-parser';

/* [ Submodule Exports ] */
import utils from './submodules/utils';
import alerts from './submodules/alerts';
import calculations from './submodules/calculations';
import networking from './submodules/networking';
import structure from './submodules/structure';
//import websockets from './src/submodules/websockets';
//import streaming from './src/submodules/streaming';
//import gps from './src/submodules/gps';
//import routing from './src/submodules/routing';
//import parsing from './src/submodules/parsing';

//import database from './src/submodules/database';
//import commands from './src/submodules/commands';
//import character from './src/submodules/character';
//import building from './src/submodules/building';


/* [ ATMOSX MODULES ] */
//import placefiles from './src/submodules/atmsx-modules/placefiles';
//import wire from './src/submodules/atmsx-modules/wire';
//import stations from './src/submodules/atmsx-modules/stations';


/* [ Global Cache ] */
export const cache = {
    external: {
        configurations: {}, 
        changelogs: undefined, 
        version: undefined,
        spotter_network_feed: [],
        spotter_reports: [],
        grlevelx_reports: [],
        storm_prediction_center_mesoscale: [],
        tropical_storm_tracks: [],
        sonde_project_weather_eye: [],
        wx_radio: [],
        tornado: [],
        severe: [],
        manual_alert: [],
        active_alerts: [],
        locations: {
            spotter_network: [],
            realtime_irl: [],
        },
    }, 
    internal: {
        configurations: {}, 
        random_alert_ms: undefined,
        random_alert_index: undefined,
        webhook_queue: [],
        wire: {features: []},
        events: [],
        http_timers: {},
        express: undefined,
        websocket: undefined,
        sessions: [],
    },
    placefiles: {},
};

export const strings = {
    updated_requied: `New version available: {X_ONLINE_PARSED} (Current version: {X_OFFLINE_VERSION})\n\t\t\t\t\t Update by running update.sh or download the latest version from GitHub.\n\t\t\t\t\t =================== CHANGE LOGS ======================= \n\t\t\t\t\t {X_ONLINE_CHANGELOGS}\n\n`,
    updated_required_failed: `Failed to check for updates. Please check your internet connection. This may also be due to an endpoint configuration change.`,
}

/* [ Package Exports ] */
export const packages = {
    events, path, fs, sqlite3,
    express, cookieParser, crypto, http,
    https, axios, xmpp, os, jsonc,
    xml2js, nwws, tempest, placefile, 
    shapefile, ws, nodemailer, firebaseApp, 
    firebaseDatabase, streamerBot, cron
};


/* [ Submodule Initialization ] */
const submoduleClasses = {
    utils, alerts, calculations, networking,
    structure
};

export const submodules: any = {};
Object.entries(submoduleClasses).forEach(([key, Class]) => {submodules[key] = new Class();});
