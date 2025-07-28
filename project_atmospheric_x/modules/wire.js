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


let loader = require(`../loader.js`)


class NOAAWeatherWireService { 
    constructor() {
        this.name = `NoaaWeatherWireService`;
        this.lastUpdate = 0;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
        this.createSession()
    }

    /**
      * @function createSession
      * @description Creates a session with the NOAA Weather Wire Service (NWWS). This function will connect to the NWWS and start listening for alerts.
      */
     
    createSession = async function() {
        let wireCfg = loader.cache.configurations.sources.primary_sources.noaa_weather_wire_service;
        let nwsCfg = loader.cache.configurations.sources.primary_sources.national_weather_service;
        let wireEnabled = wireCfg.enabled, wireUsername = wireCfg.credentials.username, wirePassword = wireCfg.credentials.password, displayName = wireCfg.credentials.display.replace(`AtmosphericX`, ``), wireService = wireCfg.endpoint, wireXml = wireCfg.xml_alerts, wireDomain = wireCfg.domain;
        if (!wireEnabled) return;
        let now = new Date();
        let displayTime = `${String(now.getUTCMonth() + 1).padStart(2, '0')}/${String(now.getUTCDate()).padStart(2, '0')} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
        loader.static.nwws = new loader.packages.nwws({
            alertSettings: { 
                onlyCap: wireCfg.cap_alerts,
                ugcPolygons: wireCfg.ugc_polygons,
            },
            xmpp: {
                reconnect: true,
                reconnectInterval: wireCfg.reconnect_after,
            },
            cacheSettings: {
                maxMegabytes: 5,
                cacheDir: `../storage/nwws-oi/feed`,
            },
            authentication: {
                username: wireUsername,
                password: wirePassword,
                display: `AtmosphericX (${displayName}) (v${loader.modules.hooks.getCurrentVersion()}) (${displayTime})`
            },
            database: `../storage/shapefiles.db`
        });
        loader.static.nwws.onEvent(`onConnection`, (displayName) => { loader.modules.hooks.createOutput(`${this.name}.Connection`, `Connected to ${wireDomain} as ${displayName}`); });
        loader.static.nwws.onEvent(`onAlert`, (alerts) => { let filter = loader.modules.parsing.filterAlerts(alerts); let coordFilter = loader.modules.parsing.coordsToMiles(filter); if (!coordFilter.length) return; this.createAlerts(coordFilter); });
        loader.static.nwws.onEvent(`onMesoscaleDiscussion`, (discussion) => {});
        loader.static.nwws.onEvent(`onStormReport`, (report) => {});
        loader.static.nwws.onEvent(`onMessage`, (stanza) => {
            loader.cache.wire ??= [];
            if (loader.cache.wire.length >= 20) loader.cache.wire.shift();
            loader.cache.wire.push({ message: stanza.message, issued: new Date().toISOString() });
            loader.modules.hooks.sendWebhook(`New Stanza Type: ${stanza.id.toUpperCase()}`, `\`\`\`${stanza.message.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n')}\`\`\``, loader.cache.configurations.webhook_settings.misc_alerts);
        });
        loader.static.nwws.onEvent(`onOccupant`, (occupant) => { if (!loader.cache.occupants) loader.cache.occupants = []; if (occupant.occupant.includes(`AtmosphericX`)) { if (occupant.type == `unavailable`) { loader.modules.hooks.createOutput(`${this.name}.Room`, `AtmosphericX occupant "${occupant.occupant}" has left the NWWS room`); loader.cache.occupants = loader.cache.occupants.filter(o => o.nickname !== occupant.occupant); } else {  let alreadyPresent = loader.cache.occupants.some(o => o.nickname == occupant.occupant); if (!alreadyPresent) { loader.modules.hooks.createOutput(`${this.name}.Room`, `AtmosphericX occupant "${occupant.occupant}" has joined the NWWS room`); loader.cache.occupants.push({ nickname: occupant.occupant }); } } }});
        loader.static.nwws.onEvent(`onError`, (err) => { 
            if (err.code == `credential-error`) {
                nwsCfg.enabled = true;
                wireCfg.enabled = false;
                setTimeout(() => { loader.modules.webcalling.nextRun(undefined, true) }, 2000);
            }
            loader.modules.hooks.createOutput(`${this.name}.Error`, `${err.error}`);
        });
        loader.static.nwws.onEvent(`onReconnect`, (service) => { loader.static.nwws.setDisplayName(`AtmosphericX (${displayName}) (v${loader.modules.hooks.getCurrentVersion()}) (${displayTime}) (x${service.reconnects})`) })
    }

    /**
      * @function createAlerts
      * @description Processes the valid alerts and sends them to the webcalling module. This function will process the alerts into an array and continue with the cache building...
      * 
      * @param {array} alerts - The array of alerts to process
      */
 
    createAlerts = function(alerts) {
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
        let filePath = loader.packages.path.join(__dirname, `../../storage/nwws-oi`, `parsed`, `nwws-parsed-valid-feed.bin`);
        let fileContent = `=================================================\n${new Date().toISOString().replace(/[:.]/g, '-')}\n=================================================\n\n${JSON.stringify(alerts, null, 4)}\n\n`;
        loader.packages.fs.appendFileSync(filePath, fileContent, `utf8`);
        loader.modules.webcalling.nextRun(loader.cache.twire);
    }

    /**
      * @function createDebugAlert
      * @description Creates a debug alert for testing purposes. This function will read a file from the storage and send it to the NWWS-OI module.
      * 
      * @param {string} alertType - The type of alert to create (RAW or XML)
      */

    createDebugAlert = function(alertType = `RAW`) {
        let alerts = alertType == `RAW` ? [`raw_feed_exmaple.bin`] : [`xml_feed_example.xml`];
        for (let i = 0; i < alerts.length; i++) {
            let attributes = { awipsid: `N/A`, issue: new Date(Date.now() - 299 * 1000).toISOString() };
            let file = loader.packages.path.join(__dirname, `../../storage/nwws-oi/`, `debugging`, alerts[i]);
            let data = loader.packages.fs.readFileSync(file, `utf8`);
            loader.static.nwws.forwardCustomStanza(data, attributes);
        }
    }
}


module.exports = NOAAWeatherWireService;