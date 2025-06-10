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


loader.static.accounts = [] // Array of accounts that are currently logged in within the dashboard (Session ID and Username)
loader.static.webSocketClients = [] // Array of websocket clients that are currently connected to the server
loader.static.webSocketClientLimits = [] // Array of websocket clients that are currently connected to the server with limits
loader.static.httpTimer = [] // Array of timers for the HTTP server
loader.static.wiresession = undefined // The session for the wire server
loader.static.webhookTimeout = 0


loader.cache.twire = {features: []} // Array of features that are currently being processed by the wire server
loader.cache.timeSinceLastStanza = new Date().getTime() // The time since the last stanza was received from the wire server
loader.cache.attemptingToConnect = false // Boolean to check if the wire server is currently attempting to connect
loader.cache.hasConnectedBefore = false // Boolean to check if the wire server has connected before
loader.cache.logging = []

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
loader.packages.shapefile = require('shapefile');
loader.packages.ws = require('ws');
loader.packages.nodemailer = require('nodemailer');

loader.modules.hooks = new (require(`./modules/hooks.js`))()
loader.modules.database = new (require(`./modules/database.js`))()
loader.modules.routes = new (require(`./modules/routes.js`))()
loader.modules.dashboard = new (require(`./modules/dashboard.js`))()
loader.modules.websocket = new (require(`./modules/websocket.js`))()
loader.modules.webcalling = new (require(`./modules/webcalling.js`))()
loader.modules.building = new (require(`./modules/building.js`))()
loader.modules.parsing = new (require(`./modules/parsing.js`))()
loader.modules.shapefiles = new (require(`./modules/shapefiles.js`))()
loader.modules.commands = new (require(`./modules/commands.js`))()

loader.modules.listener = new (require(`./modules/nwws-oi/listener.js`))()
loader.modules.product = new (require(`./modules/nwws-oi/product.js`))()
loader.modules.vtec = new (require(`./modules/nwws-oi/parsers/vtec.js`))()
loader.modules.ugc = new (require(`./modules/nwws-oi/parsers/ugc.js`))()
loader.modules.raw = new (require(`./modules/nwws-oi/parsers/raw.js`))()
loader.modules.alertbuilder = new (require(`./modules/nwws-oi/event/alert.js`))()



loader.definitions.RegExp_VTEC = "[OTEX].(NEW|CON|EXT|EXA|EXB|UPG|CAN|EXP|COR|ROU).[A-Z]{4}.[A-Z]{2}.[WAYSFON].[0-9]{4}.[0-9]{6}T[0-9]{4}Z-[0-9]{6}T[0-9]{4}Z"
loader.definitions.RegExp_UGCStart = "(\\w{2}[CZ](\\d{3}((-|>)\\s?(\n\n)?))+)"
loader.definitions.RegExp_UGCEnd = "(\\d{6}(-|>)\\s?(\n\n)?)"
loader.definitions.RegExp_WMO = "[A-Z0-9]{6}\\s[A-Z]{4}\\s\\d{6}"
loader.definitions.cancelSignatures = [ "has been cancelled", "will be allowed to expire", "has diminished", "and no longer", "has been replaced", "The threat has ended", "has weakened below severe" ]
loader.definitions.statusSignatures = { "NEW": "Issued", "CON": "Updated", "EXT": "Extended", "EXA": "Extended", "EXB": "Extended", "UPG": "Upgraded", "COR": "Correction", "ROU": "Routine", "CAN": "Cancelled", "EXP": "Expired" }
loader.definitions.eventCodes = { "AF": "Ashfall", "AS": "Air Stagnation", "BH": "Beach Hazard", "BW": "Brisk Wind", "BZ": "Blizzard", "CF": "Coastal Flood", "DF": "Debris Flow", "DS": "Dust Storm", "EC": "Extreme Cold", "EH": "Excessive Heat", "EW": "Extreme Wind", "FA": "Areal Flood", "FF": "Flash Flood", "FG": "Dense Fog", "FL": "Flood", "FR": "Frost", "FW": "Fire Weather", "FZ": "Freeze", "GL": "Gale", "HF": "Hurricane Force Wind", "HT": "Heat", "HU": "Hurricane", "HW": "High Wind", "HY": "Hydrologic", "HZ": "Hard Freeze", "IS": "Ice Storm", "LE": "Lake Effect Snow", "LO": "Low Water", "LS": "Lakeshore Flood", "LW": "Lake Wind", "MA": "Special Marine", "MF": "Dense Fog", "MH": "Ashfall", "MS": "Dense Smoke", "RB": "Small Craft for Rough Bar", "RP": "Rip Current Risk", "SC": "Small Craft", "SE": "Hazardous Seas", "SI": "Small Craft for Winds", "SM": "Dense Smoke", "SQ": "Snow Squall", "SR": "Storm", "SS": "Storm Surge", "SU": "High Surf", "SV": "Severe Thunderstorm", "SW": "Small Craft for Hazardous Seas", "TO": "Tornado", "TR": "Tropical Storm", "TS": "Tsunami", "TY": "Typhoon", "UP": "Heavy Freezing Spray", "WC": "Wind Chill", "WI": "Wind", "WS": "Winter Storm", "WW": "Winter Weather", "ZF": "Freezing Fog", "ZR": "Freezing Rain", "ZY": "Freezing Spray" }
loader.definitions.eventTypes = { "W": "Warning", "F": "Forecast", "A": "Watch", "O": "Outlook", "Y": "Advisory", "N": "Synopsis", "S": "Statement"}
