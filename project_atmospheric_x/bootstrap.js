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


let loader = require(`./loader.js`)


loader.static.accounts = []
loader.static.webSocketClients = []
loader.static.lastGpsUpdate = 0
loader.static.webSocketClientLimits = [] 
loader.static.httpTimer = [] 
loader.static.wiresession = undefined 
loader.static.webhookTimestamps = []


loader.cache.twire = {features: []}
loader.cache.placefiles = {}
loader.cache.timeSinceLastStanza = new Date().getTime()
loader.cache.attemptingToConnect = false 
loader.cache.hasConnectedBefore = false
loader.cache.logging = []

loader.definitions.RegExp_VTEC = "[OTEX].(NEW|CON|EXT|EXA|EXB|UPG|CAN|EXP|COR|ROU).[A-Z]{4}.[A-Z]{2}.[WAYSFON].[0-9]{4}.[0-9]{6}T[0-9]{4}Z-[0-9]{6}T[0-9]{4}Z"
loader.definitions.RegExp_UGCStart = "(\\w{2}[CZ](\\d{3}((-|>)\\s?(\n\n)?))+)"
loader.definitions.RegExp_UGCEnd = "(\\d{6}(-|>)\\s?(\n\n)?)"
loader.definitions.RegExp_WMO = "[A-Z0-9]{6}\\s[A-Z]{4}\\s\\d{6}"
loader.definitions.cancelSignatures = ["subsided sufficiently for the advisory to be cancelled", "has been cancelled", "will be allowed to expire", "has diminished", "and no longer", "has been replaced", "The threat has ended", "has weakened below severe" ]
loader.definitions.statusSignatures = { "NEW": "Issued", "CON": "Updated", "EXT": "Extended", "EXA": "Extended", "EXB": "Extended", "UPG": "Upgraded", "COR": "Correction", "ROU": "Routine", "CAN": "Cancelled", "EXP": "Expired" }
loader.definitions.eventCodes = { "AF": "Ashfall", "AS": "Air Stagnation", "BH": "Beach Hazard", "BW": "Brisk Wind", "BZ": "Blizzard", "CF": "Coastal Flood", "DF": "Debris Flow", "DS": "Dust Storm", "EC": "Extreme Cold", "EH": "Excessive Heat", "XH": "Extreme Heat", "EW": "Extreme Wind", "FA": "Areal Flood", "FF": "Flash Flood", "FG": "Dense Fog", "FL": "Flood", "FR": "Frost", "FW": "Fire Weather", "FZ": "Freeze", "GL": "Gale", "HF": "Hurricane Force Wind", "HT": "Heat", "HU": "Hurricane", "HW": "High Wind", "HY": "Hydrologic", "HZ": "Hard Freeze", "IS": "Ice Storm", "LE": "Lake Effect Snow", "LO": "Low Water", "LS": "Lakeshore Flood", "LW": "Lake Wind", "MA": "Special Marine", "MF": "Dense Fog", "MH": "Ashfall", "MS": "Dense Smoke", "RB": "Small Craft for Rough Bar", "RP": "Rip Current Risk", "SC": "Small Craft", "SE": "Hazardous Seas", "SI": "Small Craft for Winds", "SM": "Dense Smoke", "SQ": "Snow Squall", "SR": "Storm", "SS": "Storm Surge", "SU": "High Surf", "SV": "Severe Thunderstorm", "SW": "Small Craft for Hazardous Seas", "TO": "Tornado", "TR": "Tropical Storm", "TS": "Tsunami", "TY": "Typhoon", "UP": "Heavy Freezing Spray", "WC": "Wind Chill", "WI": "Wind", "WS": "Winter Storm", "WW": "Winter Weather", "ZF": "Freezing Fog", "ZR": "Freezing Rain", "ZY": "Freezing Spray" }
loader.definitions.eventTypes = { "W": "Warning", "F": "Forecast", "A": "Watch", "O": "Outlook", "Y": "Advisory", "N": "Synopsis", "S": "Statement"}


loader.definitions.static_apis = { 
    ['open_street_map_coordinates']: "https://nominatim.openstreetmap.org/reverse?format=json&lat=${X}&lon=${Y}",
    ['cape_coordinates']: "https://api.open-meteo.com/v1/gfs?latitude=${X}&longitude=${Y}&hourly=cape",
    ['temperature_coordinates']: "https://api.openweathermap.org/data/2.5/weather?lat=${X}&lon=${Y}&appid=64fb789b4ab267d578a5b1c24fd4b5ba",
}

loader.definitions.allowed_websockets = [`mesonet`, `occupants`, `metrics`, `chatbot`, `wxRadio`, `updates`, `svrprob`, `torprob`, `public`, `active`, `location`, `discussions`, `notification`, `header`, `reports`, `spotters`, `manual`, `wire`, `random`]

loader.packages.fs = require(`fs`)
loader.packages.path = require(`path`)
loader.packages.sqlite3 = require(`better-sqlite3`)
loader.packages.express = require(`express`)
loader.packages.cookieParser = require(`cookie-parser`)
loader.packages.crypto = require(`crypto`)
loader.packages.http = require(`http`)
loader.packages.https = require(`https`)
loader.packages.axios = require(`axios`)
loader.packages.xmpp = require(`@xmpp/client`)
loader.packages.os = require(`os`)
loader.packages.xml2js = require('xml2js');
loader.packages.nwws = require('atmosx-nwws-parser');
loader.packages.tempest = require('atmosx-tempest-pulling');
loader.packages.shapefile = require('shapefile');
loader.packages.ws = require('ws');
loader.packages.nodemailer = require('nodemailer');
loader.packages.firebaseApp = require('firebase/app');
loader.packages.firebaseDatabase = require('firebase/database');

loader.modules.hooks = new (require(`./modules/mHooks.js`))()
loader.modules.character = new (require(`./modules/eCharacterAI.js`))()
loader.modules.database = new (require(`./modules/mDatabase.js`))()
loader.modules.routes = new (require(`./modules/mRoutes.js`))()
loader.modules.dashboard = new (require(`./modules/mEndpoints.js`))()
loader.modules.websocket = new (require(`./modules/mWebsockets.js`))()
loader.modules.webcalling = new (require(`./modules/mWebcalls.js`))()
loader.modules.building = new (require(`./modules/mBuilding.js`))()
loader.modules.parsing = new (require(`./modules/mDataParsing.js`))()
loader.modules.commands = new (require(`./modules/mCommands.js`))()
loader.modules.placefiles = new (require(`./modules/mPlacefiles.js`))()
loader.modules.rtlirl = new (require(`./modules/eRtIrl.js`))()
loader.modules.tempest = new (require(`./modules/eTempestStation.js`))()
loader.modules.wire = new (require(`./modules/eNoaaWire.js`))()