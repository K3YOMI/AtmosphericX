
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
require(`./library/Static.js`)
require(`./bootloader.js`)

LOAD.Library.Hooks.PrintLog(`Start.AtmosphericX`, `Starting AtmosphericX...`)
LOAD.Library.Hooks.PrintLog(`Start.AtmosphericX`, `For a list of commands, type /help`)
LOAD.Library.Hooks.StartProcess()

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
        LOAD.Library.Hooks.PrintLog(`AtmosphericX.CommandExecution`, `${d} is not a valid command, type /help for a list of commands`)
    }
})
