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

let LOAD = require(`../../loader.js`)

/**
  * @module Listener
  * @description Initializes a new instance of the `WeatherWireListener` class.
  * Sets the author, name, and production mode properties, and logs the initialization message.
  * Immediately calls the `_CreateSession` method to establish a connection to the NOAA Weather Wire Service.
  */

class Listener {
    constructor() {
        this.author = `k3yomi@GitHub`
        this.name = `WeatherWireListener`
        this.production = true
        LOAD.Library.Hooks.PrintLog(`${this.name}`, `Successfully initialized ${this.name} module`);
        this._CreateSession()
    }

    /**
      * @function _CreateSession
      * @description Creates and manages an XMPP session to connect to the NOAA Weather Wire Service.
      * The method initiates a connection with the wire service using the provided credentials and configuration,
      * sends presence information to the server, and listens for incoming alerts. It processes each alert based on its
      * format (XML or non-XML) and passes the data to a `ProductInterpreter` for further action. If an error occurs 
      * during the connection, the method logs the failure and attempts to enable fallback options.
      * Additionally, the method invokes `LOAD.Library.ShapefileManager.CreateZoneMap` to initialize necessary geographic data.
      *
      * @async
      * @returns {Promise<void>} A promise that resolves once the session has been created and connected.
      */

    async _CreateSession() {
        return new Promise(async (resolve, reject) => {
            let wire_cfg = LOAD.cache.configurations.sources.primary_sources.noaa_weather_wire_service
            let nws_cfg = LOAD.cache.configurations.sources.primary_sources.national_weather_service
            let wire_enabled = wire_cfg.enabled 
            let wire_username = wire_cfg.credentials.username 
            let wire_password = wire_cfg.credentials.password
            let wire_service = wire_cfg.endpoint
            let wire_xml = wire_cfg.xml_alerts
            let wire_domain = wire_cfg.domain
            if (!wire_enabled) { return }
            let session = LOAD.Packages.XMPP.client({service: wire_service, domain: wire_domain, username: wire_username, password: wire_password}).setMaxListeners(0);
            session.on(`online`, async (_address) => {
                session.send(LOAD.Packages.XMPP.xml('presence', {  to: `nwws@conference.nwws-oi.weather.gov/${wire_username}-AtmosX`, xmlns: 'http://jabber.org/protocol/muc' }));
                LOAD.Library.Hooks.PrintLog(`${this.name}`, `Connected to ${wire_domain}`)
                nws_cfg.enabled = false
                wire_cfg.enabled = true
            })
            session.on(`error`, async () => {
                LOAD.Library.Hooks.PrintLog(`${this.name}`, `Couldn't connect to ${wire_service}, enabling fallback and attempting to reconnect...`)
                nws_cfg.enabled = true
                wire_cfg.enabled = false
                LOAD.Library.APICalls.Next(undefined, true)
                process.on('uncaughtException', (err) => {})
            })
            session.on(`stanza`, async (_stanza) => {
                let product = new LOAD.Callbacks.ProductInterpreter(_stanza)
                let message = await product.CompileMessage()
                if (message.ignore || (message.xml == true && wire_xml == false)) { return }
                if (message.ignore || (message.xml == false && wire_xml == true) ) { return }
                if (message.xml == true && message.valid_xml_alert == false) { return }
                await product.CreateNewAlert()
            })
            await LOAD.Library.ShapefileManager.CreateZoneMap([{id: `C`, file: `USCounties`},{id: `Z`, file: `ForecastZones`},{id: `Z`, file: `FireZones`},{id: `Z`, file: `OffShoreZones`},{id: `Z`, file: `FireCounties`},{id: `Z`, file: `Marine`},])
            LOAD.Library.Hooks.PrintLog(`${this.name}`, `Shapefiles have been already imported into the database`)
            LOAD.Library.Hooks.PrintLog(`${this.name}`, `Attempting to connect to ${wire_service}...`)
            await session.start()
        })
    }

    /**
      * @function ProcessValidAlert
      * @description Processes a valid alert by handling different actions (Expired, Cancelled, Updated, etc.).
      * Based on the action type, the method either updates an existing alert in the cache, adds a new alert, or logs that no action was taken.
      * The method handles alerts by their `tracking` ID, and for each action, it either modifies or appends the alert in the cache accordingly.
      * After processing the alert, it logs the action and appends the alert data to a file for further review.
      *
      * @async
      * @param {Object} _data - The alert data to process.
      * @param {string} _type - The type of the alert (e.g., "Text", "XML").
      * @param {string} _taken - The timestamp when the alert was taken.
      * @returns {Promise<void>} A promise that resolves once the alert processing and logging are complete.
      */

    async ProcessValidAlert(_data, _type, _taken) {
        if (_data == undefined) { await LOAD.Library.APICalls.Next(LOAD.cache.wire); LOAD.Library.Hooks.PrintLog(`${this.name}`, `[!] ${_type} (${_taken})`); return }
        let ms = _taken
        let type = _type
        let data = _data 
        let action = data.action
        let tracking = data.tracking
        let find = LOAD.cache.wire.features.findIndex(feature => feature !== undefined && feature.tracking == tracking)
        if (action == `Expired` || action == `Cancelled` || action == `Cancel`) {
            if (find != -1) {
                LOAD.cache.wire.features[find] = undefined 
                LOAD.Library.Hooks.PrintLog(`${this.name}`, `[!] [${type}] Alert ${action} >> ${data.properties.event} (${data.tracking}) (${ms})`)
            } else { 
                LOAD.Library.Hooks.PrintLog(`${this.name}`, `[!] [${type}] Alert ${action} (No Action) >> ${data.properties.event} (${data.tracking}) (${ms})`)
            }
        }
        if (action == `Extended` || action == `Updated` || action == `Correction` || action == `Upgraded`) {
            if (find != -1) {    
                let new_history = LOAD.cache.wire.features[find].history.concat(data.history);
                let prior_sender = LOAD.cache.wire.features[find].properties.senderName;
                new_history = new_history.sort((a, b) => new Date(b.time) - new Date(a.time));
                LOAD.cache.wire.features[find] = data;
                LOAD.cache.wire.features[find].properties.senderName = prior_sender;
                LOAD.cache.wire.features[find].properties.parameters = data.properties.parameters;
                LOAD.cache.wire.features[find].history = new_history;
                LOAD.Library.Hooks.PrintLog(`${this.name}`, `[!] [${type}] Alert ${action} >> ${data.properties.event} (${data.tracking}) (${ms})`);
            } else { 
                LOAD.cache.wire.features.push(data);
                LOAD.Library.Hooks.PrintLog(`${this.name}`, `[!] [${type}] ${action} Alert Added >> ${data.properties.event} (${data.tracking}) (${ms})`);
            }
        }
        if (action == `Issued` || action == `Alert`) {
            if (find != -1) {
                LOAD.cache.wire.features[find] = data;
                LOAD.Library.Hooks.PrintLog(`${this.name}`, `[!] [${type}] [Cache] New Alert Added >> ${data.properties.event} (${data.tracking}) (${ms})`);
            } else { 
                LOAD.Library.Hooks.PrintLog(`${this.name}`, `[!] [${type}] New Alert Added >> ${data.properties.event} (${data.tracking}) (${ms})`);
                LOAD.cache.wire.features.push(data);
            }
        }
        LOAD.Packages.FileSystem.appendFileSync(LOAD.Packages.PathSystem.join(__dirname, `../../../storage/nwws-oi`, `parsed`, `nwws-parsed-valid-feed.bin`), `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${JSON.stringify(data, null, 4)}\n\n`, `utf8`)
        await LOAD.Library.APICalls.Next(LOAD.cache.wire);
    }

    /**
      * @function CreateDebugAlert
      * @description Asynchronously processes raw alerts from either text or XML formats for debugging purposes.
      * Based on the provided `_type`, it reads the relevant raw alert files, compiles the message, and creates new alerts.
      * The method supports both `TEXT` and `XML` formats, reading from files in a predefined directory and using the 
      * `ProductInterpreter` class to handle message compilation and alert creation.
      *
      * @async
      * @param {string} [_type=`TEXT`] - The format of the raw alert data to process. Can be either `TEXT` or `XML`.
      * @returns {Promise<void>} A promise that resolves once the alert processing and creation are complete.
      */

    async CreateDebugAlert(_type=`TEXT`) {
        if (_type == `TEXT`) {
            let raw_alerts = [`raw_feed_exmaple.bin`]
            for (let i = 0; i < raw_alerts.length; i++) {
                let attributes = { awipsid: `N/A`, issue: new Date().toISOString() }
                let file = LOAD.Packages.PathSystem.join(__dirname, `../../../storage/nwws-oi/`, `debugging`, raw_alerts[i])
                let data = LOAD.Packages.FileSystem.readFileSync(file, `utf8`)
                let product = new LOAD.Callbacks.ProductInterpreter()
                await product.CompileMessage(true, { message: data, attributes: attributes, xml: false })
                await product.CreateNewAlert()
            }
        }
        if (_type == `XML`) {
            let raw_alerts = [`xml_feed_example.xml`]
            for (let i = 0; i < raw_alerts.length; i++) {
                let attributes = { awipsid: `N/A`, issue: new Date().toISOString() }
                let file = LOAD.Packages.PathSystem.join(__dirname, `../../../storage/nwws-oi/`, `debugging`, raw_alerts[i])
                let data = LOAD.Packages.FileSystem.readFileSync(file, `utf8`)
                let product = new LOAD.Callbacks.ProductInterpreter()
                await product.CompileMessage(true, { message: data, attributes: attributes, xml: true })
                await product.CreateNewAlert()
            }
        } 
    }
}

module.exports = Listener