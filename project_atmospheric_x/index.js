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
require(`./bootstrap.js`)

let promise = new Promise(async (resolve, reject) => {
    let hooks = loader.modules.hooks;
    let modules = loader.modules;
    hooks.createOutput(`AtmosphericX`, `Atmospheric X is starting...`);
    hooks.createLog(`AtmosphericX`, `Atmospheric X is starting...`);
    hooks.cleanTemp();
    hooks.checkUpdates();
    await modules.rtlirl.listener();
    await modules.webcalling.nextRun();
    await modules.character.initCharacterAI();
    modules.listener.createSession();
    setInterval(async () => {
        let currentSeconds = new Date().getSeconds();
        let currentMinutes = new Date().getMinutes();
        if (currentSeconds % loader.cache.configurations.project_settings.global_update === 0) {
            if (loader.cache.isRequestingData) return;
            loader.cache.isRequestingData = true;
            hooks.reloadConfigurations();
            hooks.cleanTemp();
            setTimeout(() => {
                loader.cache.twire = {
                    features: loader.cache.twire.features.filter(feature => 
                        feature !== undefined && new Date(feature.properties.expires).getTime() > new Date().getTime()
                    )
                };
                loader.cache.logging = loader.cache.logging.filter(log => 
                    log !== undefined && new Date(log.expires).getTime() > new Date().getTime()
                );
                modules.webcalling.nextRun(loader.cache.twire);
                modules.webcalling.nextRun();
                loader.cache.isRequestingData = false;
            }, 1000);

            if (loader.static.wiresession !== undefined) { modules.listener.reconnectSessionCheck(); }
        }
        if (currentMinutes % 30 === 0 && currentSeconds === 0) { hooks.checkUpdates(); }
    }, 100);
});

return promise;