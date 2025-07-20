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


class RtlIrl { 
    constructor() {
        this.name = `Rtirl`;
        this.lastUpdate = 0;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
        this.getSocket();
    }


    listener = async function() {
        if (loader.cache.rtSocket == undefined) { return }
        let db = loader.packages.firebaseDatabase.getDatabase(loader.cache.rtSocket);
        let reference = loader.packages.firebaseDatabase.child(loader.packages.firebaseDatabase.ref(db, `pullables`), loader.cache.configurations.sources.miscellaneous_sources.location_services.rtlirl.pull_key);
        let listener = (snapshot) => {
            let snap = snapshot.val();
            if (snap == null) { return; }
            if (snap.updatedAt != this.lastUpdate) {
                this.lastUpdate = snap.updatedAt;
                loader.modules.hooks.gpsTracking(snap.location.latitude, snap.location.longitude, `RealtimeIRL`);
            }
        };
        loader.packages.firebaseDatabase.onValue(reference, listener);
    }

    /**
      * @function getSocket
      * @description Initializes the Firebase app for RealtimeIRL if enabled in configurations.
      */

    getSocket = async function() {
        return new Promise((resolve, reject) => {
            let configurations = loader.cache.configurations.sources.miscellaneous_sources.location_services.rtlirl
            if (configurations.enabled) {
                loader.cache.rtSocket = loader.packages.firebaseApp.initializeApp({
                    apiKey: "AIzaSyC4L8ICZbJDufxe8bimRdB5cAulPCaYVQQ",
                    databaseURL: "https://rtirl-a1d7f-default-rtdb.firebaseio.com",
                    projectId: "rtirl-a1d7f",
                    measurementId: "G-TR97D81LT3",
                    appId: "1:684852107701:web:d77a8ed0ee5095279a61fc",
                }, `rtirl-api`);
                loader.modules.hooks.createLog(`${this.name}.getSocket`, `RealtimeIRL socket initialized successfully`);
                loader.modules.hooks.createOutput(`${this.name}.getSocket`, `RealtimeIRL socket initialized successfully`);
            }
            resolve();
        })
    }
}


module.exports = RtlIrl;