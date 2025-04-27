

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
    
    
    Literally just junk code and some commands you can use.. nothing more, nothing less.
*/

let LOAD = require(`../loader.js`)

command_node = [
    {"cmd": "/activate", "description": "Activates an account", "args": ["username", "enable"], "example": "/activate <username> <true/false>", "function": async (args) => {
        let username = args[0]
        let enable = (args[1] == `true`) ? 1 : 0
        if (username != undefined && enable != undefined) {
            LOAD.Library.Database.SendDatabaseQuery(`UPDATE accounts SET activated = ? WHERE username = ?`, [enable, username]).then((result) => {})
            LOAD.Library.Hooks.Log(`AtmosphericX.CommandExecution : Account ${username} activation status is now set to ${enable}`)
            LOAD.Library.Hooks.PrintLog(`AtmosphericX.CommandExecution`, `Account ${username} activation status is now set to ${enable}`)
        }
    }},
    {"cmd": "/del-account", "description": "Deletes an account", "args": ["username"], "example": "/activate <username>", "function": async (args) => {
        let username = args[0]
        if (username != undefined) {
            LOAD.Library.Database.SendDatabaseQuery(`DELETE FROM accounts WHERE username = ?`, [username]).then((result) => {})
            LOAD.Library.Hooks.Log(`AtmosphericX.CommandExecution : Account ${username} deleted`)
            LOAD.Library.Hooks.PrintLog(`AtmosphericX.CommandExecution`, `Account ${username} deleted`)
        }
    }},
    {"cmd": "/force", "description": "Force update all clients", "args": [], "example": "/force", "function": async (args) => {
        LOAD.Library.Hooks.RefreshConfigurations()
        await LOAD.Library.Routes.SyncClients()
        LOAD.Library.Hooks.Log(`AtmosphericX.CommandExecution : Force update all connected clients`)
        LOAD.Library.Hooks.PrintLog(`AtmosphericX.CommandExecution`, `Force update all connected clients`)
    }},
    {"cmd": "/safe-close", "description": "Close app safely", "args": [], "example": "/safe-close", "function": async (args) => {
        if (LOAD.Static.WireSession != null) {
            LOAD.Static.WireSession.send(LOAD.Packages.XMPP.xml('presence', { type: 'unavailable' }));
            await LOAD.Static.WireSession.stop()
        }
        setTimeout(() => {
            LOAD.Library.Hooks.Log(`AtmosphericX.CommandExecution : Application closed safely`)
            LOAD.Library.Hooks.PrintLog(`AtmosphericX.CommandExecution`, `Application closed safely`)
            process.exit(0)
        }, 1000)
    }},
    {"cmd": "/debug-xml", "description": "Debug xML alerts", "args": [], "example": "/debug-xml", "function": async (args) => { LOAD.Library.NOAAWeatherWireService.CreateDebugAlert(`XML`)}},
    {"cmd": "/debug-raw", "description": "Debug raw alerts", "args": [], "example": "/debug-raw", "function": async (args) => {LOAD.Library.NOAAWeatherWireService.CreateDebugAlert(`TEXT`)}},
    {"cmd": "/clear", "description": "Clear console", "args": [], "example": "/clear", "function": async (args) => { console.clear(); LOAD.Library.Hooks._PrintLogo() }},
    {"cmd": "/memory-dump", "description": "Create a memory dump", "args": [], "example": "/memory-dump", "function": async (args) => { require('v8').writeHeapSnapshot();}},
    {"cmd": "/clear-cache", "description": "Cleare the caches", "args": [], "example": "/memory-dump", "function": async (args) => { LOAD.cache.alerts = {}; LOAD.cache.wire = { features: []}; }},
    {"cmd": "/hammer-time", "description": "Stress testing", "args": [], "example": "/hammer-time", "function": async (args) => {
        for (let i = 0; i < 25; i++) { await LOAD.Library.NOAAWeatherWireService.CreateDebugAlert(`TEXT`) }
        console.log(`Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MiB (${Math.round((LOAD.Packages.OS.totalmem() - LOAD.Packages.OS.freemem()) / LOAD.Packages.OS.totalmem() * 100) + '%'})`)
    }},
    {"cmd": "/help", "description": "Show help", "args": [], "example": "/help", "function": async () => {
        console.log(`\n`)
        console.log(`Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MiB (${Math.round((LOAD.Packages.OS.totalmem() - LOAD.Packages.OS.freemem()) / LOAD.Packages.OS.totalmem() * 100) + '%'})`)
        console.log(`┌───────────────┬───────────────────────────┬──────────────────────────────────────┐`)
        console.log(`│ Command       │ Description               │ Usage                                │`)
        console.log(`├───────────────┼───────────────────────────┼──────────────────────────────────────┤`)
        command_node.forEach((cmd) => {
            console.log(`│ ${cmd.cmd.padEnd(13)} │ ${cmd.description.padEnd(25)} │ ${cmd.example.padEnd(36)} │`)
        })
        console.log(`└───────────────┴───────────────────────────┴──────────────────────────────────────┘`)
    }},
]