
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
    Version: 6.3.0                              
*/

express = require(`express`)
session = require(`express-session`)
websocket = require(`ws`)
http = require(`http`)
https = require(`https`)
cryptography = require(`crypto`)
fs = require(`fs`)
path = require(`path`)
axios = require(`axios`)
os = require(`os`)
process = require(`process`)
//nexrad_plot = require('nexrad-level-2-plot');
//nexrad_data = require('nexrad-level-2-data');
xmpp = require('@xmpp/client');
xml2js = require('xml2js');
glob = require('glob');
sqlite3 = require('sqlite3');
shapefile = require('shapefile');


cache = {}
cache.version = `6.3.0`
cache.author = `k3yomi@GitHub`

cache.alerts = {}
cache.time = {}
cache.rdr = []
cache.wire = { features: []}
cache.accounts = {}
cache.configurations = []
cache.requesting = false 
cache.statistics = { operations: 0, requests: 0, memory: 0, cpu: 0 }
app = undefined

// Global Classes (Doesn't require new instance)

Hooks = new (require(`./library/Hooks.js`))
Parsing = new (require(`./library/Parsing.js`))
APICalls = new (require(`./library/APICalls.js`))
Formats = new (require(`./library/Formats.js`))
//Level2Nexrad = new (require(`./library/Level2Nexrad.js`))
Database = new (require(`./library/Database.js`))
Routes = new (require(`./library/Routes.js`))
ShapefileManager = new (require(`./library/ShapefileManager.js`))
NOAAWeatherWireService = new (require(`./library/WeatherWireOI/Listener.js`))



// NOAA Weather Wire Service Libraries (v2) (To be called each time a new alert is received)
ProductInterpreter = require(`./library/WeatherWireOI/ProductInterpreter.js`)
AlertBuilder = require(`./library/WeatherWireOI/Events/AlertBuilder.js`)
VTECParser = require(`./library/WeatherWireOI/Parsers/VTECParser.js`)
UGCParser = require(`./library/WeatherWireOI/Parsers/UGCParser.js`)
RawParser = require(`./library/WeatherWireOI/Parsers/RawParser.js`)
Static = require(`./library/Static.js`)



Hooks.Log(`Start.AtmosphericX : Starting AtmosphericX...`)
Hooks.PrintLog(`Start.AtmosphericX`, `For a list of commands, type /help`)
Hooks.StartProcess()


// This calls from the Static.js file which stores all the commands...
process.stdin.setEncoding(`utf8`)
process.stdin.on(`data`, (data) => {
    let d = data.trim()
    let find = command_node.find((x) => x.cmd == d.split(` `)[0])
    if (d.startsWith(`/`)) {
        if (find) {
            let args = d.split(` `).slice(1)
            let func = find.function
            if (func) { func(args).then((result) => {}) }
            return
        }
        Hooks.PrintLog(`AtmosphericX.CommandExecution`, `${d} is not a valid command, type /help for a list of commands`)
    }
})
