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


let loader = require(`../../loader.js`)


class Listener { 
    constructor() {
        this.name = `Listener`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }


    /**
      * @function createSession
      * @description Creates a XMPP Session to the NOAA Weather Wire Service. This will be used to receive real time alerts...
      */

    createSession = async function() {
        let wireCfg = loader.cache.configurations.sources.primary_sources.noaa_weather_wire_service
        let nwsCfg = loader.cache.configurations.sources.primary_sources.national_weather_service
        let wireEnabled = wireCfg.enabled
        let wireUsername = wireCfg.credentials.username 
        let wirePassword = wireCfg.credentials.password
        let displayName = wireCfg.credentials.display.replace(`AtmosphericX`, ``)
        let wireService = wireCfg.endpoint
        let wireXml = wireCfg.xml_alerts
        let wireDomain = wireCfg.domain
        if (!wireEnabled) { return }
        loader.cache.totalReconnects = 0
        loader.static.wiresession = loader.packages.xmpp.client({reconnect: true, service: wireService, domain: wireDomain, username: wireUsername, password: wirePassword}).setMaxListeners(0);
        loader.static.wiresession.on(`online`, async (_address) => {
            let now = new Date();
            let displayTime = `${String(now.getUTCMonth() + 1).padStart(2, '0')}/${String(now.getUTCDate()).padStart(2, '0')} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
            loader.static.wiresession.send(loader.packages.xmpp.xml('presence', {  to: `nwws@conference.nwws-oi.weather.gov/AtmosphericX (${displayName}) (v${loader.modules.hooks.getCurrentVersion()}) (${displayTime}) (x${loader.cache.totalReconnects})`, xmlns: 'http://jabber.org/protocol/muc' }));
            loader.modules.hooks.createOutput(`${this.name}`, `Connected to ${wireDomain} as "AtmosphericX (${displayName}) (v${loader.modules.hooks.getCurrentVersion()}) (${displayTime}) (x${loader.cache.totalReconnects})"`)
            loader.cache.timeSinceLastStanza = new Date().getTime()
            loader.cache.hasConnectedBefore = true
            nwsCfg.enabled = false
            wireCfg.enabled = true
            if (loader.cache.attemptingToConnect) {
                setTimeout(() => { loader.cache.attemptingToConnect = false}, 15 * 1000)
            }
        })
        loader.static.wiresession.on(`error`, async (err) => {
            if (err.message == `not-authorized`) {
                loader.modules.hooks.createOutput(`${this.name}`, `Invalid credentials or connection error for ${wireService}, falling back to NWS`)
                loader.modules.hooks.createLog(`${this.name}`, `Invalid credentials or connection error for ${wireService}, falling back to NWS`)
                loader.static.wiresession.stop()
                loader.static.wiresession = undefined
                nwsCfg.enabled = true
                wireCfg.enabled = false
                setTimeout(() => { loader.modules.webcalling.nextRun(undefined, true)}, 2000)
            }
            if (err.message != `not-authorized`) {
                loader.static.wiresession.stop()
                loader.cache.attemptingToConnect = false
                loader.modules.hooks.createOutput(`${this.name}`, `Error occured on ${wireService}`)
                loader.modules.hooks.createLog(`${this.name}`, `Error occured on ${wireService}`)
            }
            process.on('uncaughtException', (err) => {})
        })
        loader.static.wiresession.on(`offline`, async (eee) => {
            process.on('uncaughtException', (err) => {})
        })
        loader.static.wiresession.on(`stanza`, async (stanza) => {
            loader.cache.timeSinceLastStanza = new Date().getTime()
            if (stanza.is('message')) {
                let metadata = loader.modules.product.compileMessage(stanza)
                if (metadata.ignore) { return }
                if (metadata.isXml == true && wireXml == false) { return }
                if (metadata.isXml == false && wireXml == true) { return }
                if (metadata.isXml == true && metadata.hasXmlDescription == false) { return }
                loader.modules.product.processMessage(metadata)
            }
        })
        await loader.modules.shapefiles.createZones([{id: `C`, file: `USCounties`},{id: `Z`, file: `ForecastZones`},{id: `Z`, file: `FireZones`},{id: `Z`, file: `OffShoreZones`},{id: `Z`, file: `FireCounties`},{id: `Z`, file: `Marine`},])
        loader.modules.hooks.createOutput(`${this.name}`, `Shapefiles have been already imported into the database`)
        await loader.static.wiresession.start()
    }

    /**
      * @function processValidAlerts
      * @description Processes the valid alerts and sends them to the webcalling module. This function will process the alerts into an array and continue with the cache building...
      * 
      * @param {array} alerts - The array of alerts to process
      * @param {string} type - The type of alerts to process (XML or RAW)
      * @param {number} timeTaken - The time taken to process the alerts (in milliseconds)
      */

    processValidAlerts = function(alerts, type, timeTaken) {
        if (alerts == undefined) { loader.modules.webcalling.nextRun(loader.cache.twire); loader.modules.hooks.createOutput(`${this.name}`, `[!] ${type} (${timeTaken})`); return; }
        for (let i = 0; i < alerts.length; i++) {
            let data = alerts[i]
            let action = data.action
            let tracking = data.tracking
            let find = loader.cache.twire.features.findIndex(feature => feature !== undefined && feature.tracking == tracking)
            let expiresArray = [`Expired`, `Cancelled`, `Cancel`]
            let updatedArray = [`Extended`, `Updated`, `Correction`, `Upgraded`]
            let newArray = [`Issued`, `Alert`]
            if (expiresArray.includes(action)) { if (find != -1) { loader.cache.twire.features[find] = undefined } }
            if (newArray.includes(action)) { if (find == -1) { loader.cache.twire.features.push(data) } }
            if (updatedArray.includes(action)) { 
                if (find != -1) {
                    let newHistory = loader.cache.twire.features[find].history.concat(data.history)
                    let newLocations = loader.cache.twire.features[find].properties.areaDesc
                    newHistory = newHistory.sort((a, b) => new Date(b.time) - new Date(a.time))
                    loader.cache.twire.features[find] = data
                    loader.cache.twire.features[find].history = newHistory
                    for (let i = 0; i < newHistory.length; i++) {
                        for (let j = 0; j < newHistory.length; j++) {
                            let vTime = new Date(newHistory[i].time).getTime()
                            let cTime = new Date(newHistory[j].time).getTime()
                            let vTimeDiff = Math.abs(vTime - cTime)
                            if (vTimeDiff < 1000) {
                                let combinedLocations = newLocations + `; ` + loader.cache.twire.features[find].properties.areaDesc
                                let uniqueLocations = [...new Set(combinedLocations.split(';').map(location => location.trim()))];
                                loader.cache.twire.features[find].properties.areaDesc = uniqueLocations.join('; ')
                            }
                        }
                    }
                } else { 
                    loader.cache.twire.features.push(data)
                }
            } 
        }
        loader.packages.fs.appendFileSync(loader.packages.path.join(__dirname, `../../../storage/nwws-oi`, `parsed`, `nwws-parsed-valid-feed.bin`), `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${JSON.stringify(alerts, null, 4)}\n\n`, `utf8`)
        loader.modules.webcalling.nextRun(loader.cache.twire)
    }


    /**
     * @function reconnectSessionCheck
     * @description Checks if the session is still active. If not, it will attempt to reconnect to the session. 
     */

    reconnectSessionCheck = async function() {
        if (loader.static.wiresession !== undefined && loader.cache.hasConnectedBefore == true) {
            let timeDiff = new Date().getTime() - loader.cache.timeSinceLastStanza
            if (timeDiff > loader.cache.configurations.sources.primary_sources.noaa_weather_wire_service.reconnect_after * 1000) {
                loader.modules.hooks.createOutput(`AtmosphericX`, `[!] No NWWS message Received in the last ${timeDiff}ms, restarting...`)
                loader.modules.hooks.createLog(`AtmosphericX`, `[!] No NWWS message Received in the last ${timeDiff}ms, restarting...`)
                if (!loader.cache.attemptingToConnect) {
                    loader.cache.attemptingToConnect = true
                    loader.cache.totalReconnects += 1
                    await loader.static.wiresession.stop().catch((err) => {})
                    await loader.static.wiresession.start().catch((err) => {})
                }
                return {status: false, message: `Session is not active`}
            }
        }
        return {status: true, message: `Session is active`}
    }

    /**
      * @function createDebugAlert
      * @description Literally just a function to create a debug alert. This is used for testing purposes only. It will create a debug alert and send it to the webcalling module.
      * 
      * @param {string} alertType - The type of alert to create (RAW or XML)
      */

    createDebugAlert = function(alertType=`RAW`) {
        if (alertType == `RAW`) {
            let raw_alerts = [`raw_feed_exmaple.bin`]
            for (let i = 0; i < raw_alerts.length; i++) {
                let attributes = { awipsid: `N/A`, issue: new Date(Date.now() - 299 * 1000).toISOString()} 
                let file = loader.packages.path.join(__dirname, `../../../storage/nwws-oi/`, `debugging`, raw_alerts[i])
                let data = loader.packages.fs.readFileSync(file, `utf8`)
                let metadata = loader.modules.product.compileMessage(data, true, { attributes: attributes, xml: false })
                loader.modules.product.processMessage(metadata)
            }
        }
        if (alertType == `XML`) {
            let raw_alerts = [`xml_feed_example.xml`]
            for (let i = 0; i < raw_alerts.length; i++) {
                let attributes = { awipsid: `N/A`, issue: new Date(Date.now() - 299 * 1000).toISOString()} 
                let file = loader.packages.path.join(__dirname, `../../../storage/nwws-oi/`, `debugging`, raw_alerts[i])
                let data = loader.packages.fs.readFileSync(file, `utf8`)
                let metadata = loader.modules.product.compileMessage(data, true, { attributes: attributes, xml: true })
                loader.modules.product.processMessage(metadata)
            }
        } 
    }

}


module.exports = Listener;