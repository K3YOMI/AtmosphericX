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



loader.definitions.cancelSignatures = ["THIS_MESSAGE_IS_FOR_TEST_PURPOSES_ONLY", "this is a test", "subsided sufficiently for the advisory to be cancelled", "has been cancelled", "will be allowed to expire", "has diminished", "and no longer", "has been replaced", "The threat has ended", "has weakened below severe" ]

loader.definitions.static_apis = { 
    ['open_street_map_coordinates']: "https://nominatim.openstreetmap.org/reverse?format=json&lat=${X}&lon=${Y}",
    ['cape_coordinates']: "https://api.open-meteo.com/v1/gfs?latitude=${X}&longitude=${Y}&hourly=cape",
    ['temperature_coordinates']: "https://api.openweathermap.org/data/2.5/weather?lat=${X}&lon=${Y}&appid=64fb789b4ab267d578a5b1c24fd4b5ba",
}

loader.definitions.allowed_websockets = [`tropical`, `mesonet`, `occupants`, `metrics`, `chatbot`, `wxRadio`, `updates`, `svrprob`, `torprob`, `public`, `active`, `location`, `discussions`, `notification`, `header`, `reports`, `spotters`, `manual`, `wire`, `random`]

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
loader.packages.placefile = require('atmosx-placefile-parser');
loader.packages.shapefile = require('shapefile');
loader.packages.ws = require('ws');
loader.packages.nodemailer = require('nodemailer');
loader.packages.firebaseApp = require('firebase/app');
loader.packages.firebaseDatabase = require('firebase/database');
loader.packages.streamerBot = require('@streamerbot/client');

loader.modules.hooks = new (require(`./modules/mHooks.js`))()
loader.modules.character = new (require(`./modules/eCharacterAI.js`))()
loader.modules.database = new (require(`./modules/mDatabase.js`))()
loader.modules.routes = new (require(`./modules/mRoutes.js`))()
loader.modules.dashboard = new (require(`./modules/mEndpoints.js`))()
loader.modules.websocket = new (require(`./modules/mWebsockets.js`))()
loader.modules.webcalling = new (require(`./modules/mWebcalls.js`))()
loader.modules.building = new (require(`./modules/mBuilding.js`))()
loader.modules.commands = new (require(`./modules/mCommands.js`))()
loader.modules.placefiles = new (require(`./modules/mPlacefiles.js`))()
loader.modules.rtlirl = new (require(`./modules/eRtIrl.js`))()
loader.modules.chatInteractions = new (require(`./modules/eChatInteractions.js`))()
loader.modules.tempest = new (require(`./modules/eTempestStation.js`))()
loader.modules.wire = new (require(`./modules/eNoaaWire.js`))()