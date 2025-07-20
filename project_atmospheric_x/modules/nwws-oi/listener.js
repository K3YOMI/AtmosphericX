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
        let wireCfg = loader.cache.configurations.sources.primary_sources.noaa_weather_wire_service;
        let nwsCfg = loader.cache.configurations.sources.primary_sources.national_weather_service;
        let wireEnabled = wireCfg.enabled, wireUsername = wireCfg.credentials.username, wirePassword = wireCfg.credentials.password, displayName = wireCfg.credentials.display.replace(`AtmosphericX`, ``), wireService = wireCfg.endpoint, wireXml = wireCfg.xml_alerts, wireDomain = wireCfg.domain;
        if (!wireEnabled) return;
        loader.cache.totalReconnects = 0;
        loader.static.wiresession = loader.packages.xmpp.client({ reconnect: true, service: wireService, domain: wireDomain, username: wireUsername, password: wirePassword }).setMaxListeners(0);
        loader.static.wiresession.on(`online`, async (_address) => {
            let now = new Date(), displayTime = `${String(now.getUTCMonth() + 1).padStart(2, '0')}/${String(now.getUTCDate()).padStart(2, '0')} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
            loader.static.wiresession.send(loader.packages.xmpp.xml('presence', { to: `nwws@conference.nwws-oi.weather.gov/AtmosphericX (${displayName}) (v${loader.modules.hooks.getCurrentVersion()}) (${displayTime}) (x${loader.cache.totalReconnects})`, xmlns: 'http://jabber.org/protocol/muc' }));
            loader.static.wiresession.send(loader.packages.xmpp.xml('presence', { to: `nwws@conference.nwws-oi.weather.gov`, type: 'available' }));
            loader.modules.hooks.createOutput(`${this.name}`, `Connected to ${wireDomain} as "AtmosphericX (${displayName}) (v${loader.modules.hooks.getCurrentVersion()}) (${displayTime}) (x${loader.cache.totalReconnects})"`);
            loader.cache.timeSinceLastStanza = new Date().getTime();
            loader.cache.hasConnectedBefore = true;
            nwsCfg.enabled = false; wireCfg.enabled = true;
            setTimeout(() => {
                let getTotalAtmosphericXOccupants = Array.from(loader.cache.occupants).filter(occupant => occupant.nickname.includes(`AtmosphericX`)).length;
                loader.modules.hooks.createOutput(`${this.name}`, `You are the ${getTotalAtmosphericXOccupants}${getTotalAtmosphericXOccupants == 1 ? `st` : getTotalAtmosphericXOccupants == 2 ? `nd` : getTotalAtmosphericXOccupants == 3 ? `rd` : `th`} AtmosphericX occupant in the NWWS room`);
                if (loader.cache.attemptingToConnect) setTimeout(() => { loader.cache.attemptingToConnect = false }, 15 * 1000);
            }, 500);
        });
        loader.static.wiresession.on(`error`, async (err) => {
            if (err.message == `not-authorized`) {
                loader.modules.hooks.createOutput(`${this.name}`, `Invalid credentials or connection error for ${wireService}, falling back to NWS`);
                loader.modules.hooks.createLog(`${this.name}`, `Invalid credentials or connection error for ${wireService}, falling back to NWS`);
                loader.static.wiresession.stop(); loader.static.wiresession = undefined;
                nwsCfg.enabled = true; wireCfg.enabled = false;
                setTimeout(() => { loader.modules.webcalling.nextRun(undefined, true) }, 2000);
            } else {
                loader.static.wiresession.stop(); loader.cache.attemptingToConnect = false;
                loader.modules.hooks.createOutput(`${this.name}`, `Error occurred on ${wireService}`);
                loader.modules.hooks.createLog(`${this.name}`, `Error occurred on ${wireService}`);
            }
            process.on('uncaughtException', () => {});
        });
        loader.static.wiresession.on(`offline`, () => { process.on('uncaughtException', () => {}); });
        loader.static.wiresession.on(`stanza`, async (stanza) => {
            loader.cache.timeSinceLastStanza = new Date().getTime();
            if (!loader.cache.occupants) loader.cache.occupants = [];
            if (stanza.is('message')) {
                let metadata = loader.modules.product.compileMessage(stanza);
                if (metadata.ignore || (metadata.isXml && !wireXml) || (!metadata.isXml && wireXml) || (metadata.isXml && !metadata.hasXmlDescription)) return;
                loader.modules.product.processMessage(metadata);
            }
            if (stanza.is('presence') && stanza.attrs.from && stanza.attrs.from.startsWith('nwws@conference.nwws-oi.weather.gov/')) {
                let occupantNick = stanza.attrs.from.split('/').slice(1).join('/');
                if (!loader.cache.occupants) loader.cache.occupants = [];
                if (occupantNick && occupantNick.includes(`AtmosphericX`)) {
                    if (stanza.attrs.type == 'unavailable') {
                        loader.modules.hooks.createOutput(`${this.name}.Room`, `AtmosphericX occupant "${occupantNick}" has left the NWWS room`);
                        loader.cache.occupants = loader.cache.occupants.filter(o => o.nickname !== occupantNick);
                    } else {
                        let alreadyPresent = loader.cache.occupants.some(o => o.nickname == occupantNick);
                        if (!alreadyPresent) {
                            loader.modules.hooks.createOutput(`${this.name}.Room`, `AtmosphericX occupant "${occupantNick}" has joined the NWWS room`);
                            loader.cache.occupants.push({ nickname: occupantNick });
                        }
                    }
                }
            }
        });
        await loader.modules.shapefiles.createZones([{ id: `C`, file: `USCounties` }, { id: `Z`, file: `ForecastZones` }, { id: `Z`, file: `FireZones` }, { id: `Z`, file: `OffShoreZones` }, { id: `Z`, file: `FireCounties` }, { id: `Z`, file: `Marine` }]);
        loader.modules.hooks.createOutput(`${this.name}`, `Shapefiles have been already imported into the database`);
        await loader.static.wiresession.start();
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
        if (!alerts) { 
            loader.modules.webcalling.nextRun(loader.cache.twire); 
            loader.modules.hooks.createOutput(`${this.name}`, `[!] ${type} (${timeTaken})`); 
            return; 
        }
        for (let i = 0; i < alerts.length; i++) {
            let data = alerts[i], action = data.action, tracking = data.tracking;
            let find = loader.cache.twire.features.findIndex(feature => feature && feature.tracking == tracking);
            let expiresArray = [`Expired`, `Cancelled`, `Cancel`], updatedArray = [`Extended`, `Updated`, `Correction`, `Upgraded`], newArray = [`Issued`, `Alert`];
            if (expiresArray.includes(action) && find !== -1) loader.cache.twire.features[find] = undefined;
            if (newArray.includes(action) && find == -1) loader.cache.twire.features.push(data);
            if (updatedArray.includes(action)) {
                if (find !== -1) {
                    let newHistory = loader.cache.twire.features[find].history.concat(data.history).sort((a, b) => new Date(b.time) - new Date(a.time));
                    let newLocations = loader.cache.twire.features[find].properties.areaDesc;
                    loader.cache.twire.features[find] = data;
                    loader.cache.twire.features[find].history = newHistory;
                    for (let i = 0; i < newHistory.length; i++) {
                        for (let j = 0; j < newHistory.length; j++) {
                            let vTimeDiff = Math.abs(new Date(newHistory[i].time).getTime() - new Date(newHistory[j].time).getTime());
                            if (vTimeDiff < 1000) {
                                let combinedLocations = newLocations + `; ` + loader.cache.twire.features[find].properties.areaDesc;
                                let uniqueLocations = [...new Set(combinedLocations.split(';').map(location => location.trim()))];
                                loader.cache.twire.features[find].properties.areaDesc = uniqueLocations.join('; ');
                            }
                        }
                    }
                } else loader.cache.twire.features.push(data);
            }
        }
        let filePath = loader.packages.path.join(__dirname, `../../../storage/nwws-oi`, `parsed`, `nwws-parsed-valid-feed.bin`);
        let fileContent = `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${JSON.stringify(alerts, null, 4)}\n\n`;
        loader.packages.fs.appendFileSync(filePath, fileContent, `utf8`);
        loader.modules.webcalling.nextRun(loader.cache.twire);
    }

    /**
     * @function reconnectSessionCheck
     * @description Checks if the session is still active. If not, it will attempt to reconnect to the session. 
     */

    reconnectSessionCheck = async function() {
        let session = loader.static.wiresession, hasConnected = loader.cache.hasConnectedBefore, config = loader.cache.configurations.sources.primary_sources.noaa_weather_wire_service;
        if (session && hasConnected) {
            let timeDiff = new Date().getTime() - loader.cache.timeSinceLastStanza;
            if (timeDiff > config.reconnect_after * 1000) {
                loader.modules.hooks.createOutput(`AtmosphericX`, `[!] No NWWS message received in the last ${timeDiff}ms, restarting...`);
                loader.modules.hooks.createLog(`AtmosphericX`, `[!] No NWWS message received in the last ${timeDiff}ms, restarting...`);
                if (!loader.cache.attemptingToConnect) {
                    loader.cache.attemptingToConnect = true;
                    loader.cache.totalReconnects += 1;
                    await session.stop().catch(() => {});
                    await session.start().catch(() => {});
                }
                return { status: false, message: `Session is not active` };
            }
        }
        return { status: true, message: `Session is active` };
    }

    /**
      * @function createDebugAlert
      * @description Literally just a function to create a debug alert. This is used for testing purposes only. It will create a debug alert and send it to the webcalling module.
      * 
      * @param {string} alertType - The type of alert to create (RAW or XML)
      */

    createDebugAlert = function(alertType = `RAW`) {
        let alerts = alertType == `RAW` ? [`raw_feed_exmaple.bin`] : [`xml_feed_example.xml`];
        for (let i = 0; i < alerts.length; i++) {
            let attributes = { awipsid: `N/A`, issue: new Date(Date.now() - 299 * 1000).toISOString() };
            let file = loader.packages.path.join(__dirname, `../../../storage/nwws-oi/`, `debugging`, alerts[i]);
            let data = loader.packages.fs.readFileSync(file, `utf8`);
            let metadata = loader.modules.product.compileMessage(data, true, { attributes, xml: alertType == `XML` });
            loader.modules.product.processMessage(metadata);
        }
    }

}


module.exports = Listener;