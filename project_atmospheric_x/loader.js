
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

module.exports = {
    cache: { // Holds all cache data
        version: `7.0.0`,
        author: `k3yomi@GitHub`,
        alerts: {},
        time: {},
        wire: { features: []},
        accounts: {},
        configurations: [],
        requesting: false ,
        statistics: { operations: 0, requests: 0, memory: 0, cpu: 0 },
    },
    Static: {},
    Library: {},
    Callbacks: {},
    Packages: {},
}