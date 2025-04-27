
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
    Version: 7.0.0                              
*/


let LOAD = require(`./loader.js`)

LOAD.Static.Application = null
LOAD.Static.WireSession = null


LOAD.Packages.FileSystem = require(`fs`)
LOAD.Packages.PathSystem = require(`path`)
LOAD.Packages.Sqllite3 = require(`sqlite3`)
LOAD.Packages.Express = require(`express`)
LOAD.Packages.ExpressSession = require(`express-session`)
LOAD.Packages.Crypto = require(`crypto`)
LOAD.Packages.HttpLib = require(`http`)
LOAD.Packages.HttpsLib = require(`https`)
LOAD.Packages.Axios = require(`axios`)
LOAD.Packages.XMPP = require(`@xmpp/client`)
LOAD.Packages.OS = require(`os`)
LOAD.Packages.XML2JS = require('xml2js');
LOAD.Packages.Shapefile = require('shapefile');
LOAD.Packages.Websocket = require('ws');

LOAD.Library.Hooks = new (require(`./library/Hooks.js`))()
LOAD.Library.APICalls = new (require(`./library/APICalls.js`))()
LOAD.Library.Formats = new (require(`./library/Formats.js`))()
LOAD.Library.Parsing = new (require(`./library/Parsing.js`))()
LOAD.Library.Routes = new (require(`./library/Routes.js`))()
LOAD.Library.Database = new (require(`./library/Database.js`))()
LOAD.Library.ShapefileManager = new (require(`./library/ShapefileManager.js`))()
LOAD.Library.NOAAWeatherWireService = new (require(`./library/WeatherWireOI/Listener.js`))()

LOAD.Callbacks.ProductInterpreter = require(`./library/WeatherWireOI/ProductInterpreter.js`)
LOAD.Callbacks.AlertBuilder = require(`./library/WeatherWireOI/Events/AlertBuilder.js`)
LOAD.Callbacks.VTECParser = require(`./library/WeatherWireOI/Parsers/VTECParser.js`)
LOAD.Callbacks.UGCParser = require(`./library/WeatherWireOI/Parsers/UGCParser.js`)
LOAD.Callbacks.RawParser = require(`./library/WeatherWireOI/Parsers/RawParser.js`)

LOAD.Library.Hooks.PrintLog(`Bootloader.Executed`, `Finished compiling all modules successfully`)

