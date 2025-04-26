

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



command_node = [
    {"cmd": "/activate", "description": "Activates an account", "args": ["username", "enable"], "example": "/activate <username> <true/false>", "function": async (args) => {
        let username = args[0]
        let enable = (args[1] == `true`) ? 1 : 0
        if (username != undefined && enable != undefined) {
            Database.SendDatabaseQuery(`UPDATE accounts SET activated = ? WHERE username = ?`, [enable, username]).then((result) => {})
            Hooks.Log(`AtmosphericX.CommandExecution : Account ${username} activation status is now set to ${enable}`)
            Hooks.PrintLog(`AtmosphericX.CommandExecution`, `Account ${username} activation status is now set to ${enable}`)
        }
    }},
    {"cmd": "/del-account", "description": "Deletes an account", "args": ["username"], "example": "/activate <username>", "function": async (args) => {
        let username = args[0]
        if (username != undefined) {
            Database.SendDatabaseQuery(`DELETE FROM accounts WHERE username = ?`, [username]).then((result) => {})
            Hooks.Log(`AtmosphericX.CommandExecution : Account ${username} deleted`)
            Hooks.PrintLog(`AtmosphericX.CommandExecution`, `Account ${username} deleted`)
        }
    }},
    {"cmd": "/force", "description": "Force update all clients", "args": [], "example": "/force", "function": async (args) => {
        Hooks.RefreshConfigurations()
        await Routes.SyncClients()
        Hooks.Log(`AtmosphericX.CommandExecution : Force update all connected clients`)
        Hooks.PrintLog(`AtmosphericX.CommandExecution`, `Force update all connected clients`)
    }},
    {"cmd": "/debug-xml", "description": "Debug xML alerts", "args": [], "example": "/debug-xml", "function": async (args) => { NOAAWeatherWireService.CreateDebugAlert(`XML`)}},
    {"cmd": "/debug-raw", "description": "Debug raw alerts", "args": [], "example": "/debug-raw", "function": async (args) => {NOAAWeatherWireService.CreateDebugAlert(`TEXT`)}},
    {"cmd": "/clear", "description": "Clear console", "args": [], "example": "/clear", "function": async (args) => { console.clear(); Hooks._PrintLogo() }},
    {"cmd": "/memory-dump", "description": "Create a memory dump", "args": [], "example": "/memory-dump", "function": async (args) => { require('v8').writeHeapSnapshot();}},
    {"cmd": "/clear-cache", "description": "Cleare the caches", "args": [], "example": "/memory-dump", "function": async (args) => { cache.alerts = {}; cache.wire = { features: []}; }},
    {"cmd": "/hammer-time", "description": "Stress testing", "args": [], "example": "/hammer-time", "function": async (args) => {
        for (let i = 0; i < 25; i++) { await NOAAWeatherWireService.CreateDebugAlert(`TEXT`) }
        console.log(`Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MiB (${Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100) + '%'})`)
    }},
    {"cmd": "/help", "description": "Show help", "args": [], "example": "/help", "function": async () => {
        console.log(`\n`)
        console.log(`Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MiB (${Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100) + '%'})`)
        console.log(`┌───────────────┬───────────────────────────┬──────────────────────────────────────┐`)
        console.log(`│ Command       │ Description               │ Usage                                │`)
        console.log(`├───────────────┼───────────────────────────┼──────────────────────────────────────┤`)
        command_node.forEach((cmd) => {
            console.log(`│ ${cmd.cmd.padEnd(13)} │ ${cmd.description.padEnd(25)} │ ${cmd.example.padEnd(36)} │`)
        })
        console.log(`└───────────────┴───────────────────────────┴──────────────────────────────────────┘`)
    }},
]