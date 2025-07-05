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


return new Promise(async (resolve, reject) => {
    loader.modules.hooks.createOutput(`AtmosphericX`, `Atmospheric X is starting...`)
    loader.modules.hooks.createLog(`AtmosphericX`, `Atmospheric X is starting...`)
    loader.modules.hooks.cleanTemp()
    loader.modules.hooks.checkUpdates()
    await loader.modules.webcalling.nextRun()
    await loader.modules.character.initCharacterAI()
    loader.modules.listener.createSession()
    setInterval(async () => {
        if (new Date().getSeconds() % loader.cache.configurations.project_settings.global_update == 0) {
            if (loader.cache.isRequestingData) { return }
            loader.cache.isRequestingData = true
            loader.modules.hooks.reloadConfigurations()
            loader.modules.hooks.cleanTemp()
            setTimeout(() => {
                loader.cache.twire = {features: loader.cache.twire.features.filter(feature => feature !== undefined && new Date(feature.properties.expires).getTime() > new Date().getTime())} 
                loader.cache.logging = loader.cache.logging.filter(log => log !== undefined && new Date(log.expires).getTime() > new Date().getTime())
                loader.modules.webcalling.nextRun(loader.cache.twire)
                loader.modules.webcalling.nextRun()
                loader.cache.isRequestingData = false
            }, 1000)
            if (loader.static.wiresession !== undefined) { loader.modules.listener.reconnectSessionCheck() }
        }
        if (new Date().getMinutes() % 30 == 0 && new Date().getSeconds() == 0) { loader.modules.hooks.checkUpdates() }
    }, 100);
})