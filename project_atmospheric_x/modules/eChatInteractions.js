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


class streamberBotInteractions { 
    constructor() {
        this.name = `streamberBotInteractions`;
        this.usingService = false;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
        this.getSocket();
    }

    /**
      * @function emitMessage
      * @description Emits a message to the chat for whatever service is being used.
      * 
      * @param {string} message - The message to emit.
      */

    emitMessage = async function(message) {
        try {
            if (!this.usingService) return false;
            if (!loader.static.lastChatMessage) { loader.static.lastChatMessage = 0; }
            if (Date.now() - loader.static.lastChatMessage > 50) {
                loader.static.lastChatMessage = Date.now()
                await loader.static.streamerBotClient.sendMessage(this.service, message, {bot: this.useBotAccount});
            }
            return false;
        } catch (e) {}
    }

    /**
      * @function getSocket
      * @description Initializes the connection to Streamer.Bot.
      */

    getSocket = async function() {
        try {
            let cfg = loader.cache.configurations.sources.miscellaneous_sources.streamer_bot;
            if (!cfg.enabled) return;
            loader.static.streamerBotClient = await new loader.packages.streamerBot.StreamerbotClient({
                onConnect: async () => {
                    let getBroadcaster = await loader.static.streamerBotClient.getBroadcaster();
                    this.service = getBroadcaster.connected[0]
                    this.usingService = true;
                    this.useBotAccount = cfg.websocket.use_bot ?? false;
                    await loader.static.streamerBotClient.sendMessage(this.service, `AtmosphericX has connected!`, {bot: this.useBotAccount});
                    loader.modules.hooks.createOutput(this.name, `Connected to Streamer.Bot at ${cfg.websocket.address}:${cfg.websocket.port}`);
                    loader.modules.hooks.createLog(this.name, `Connected to Streamer.Bot at ${cfg.websocket.address}:${cfg.websocket.port}`);
                },
                onDisconnect: async () => {
                    this.usingService = false;
                    loader.modules.hooks.createOutput(this.name, `Disconnected from Streamer.Bot at ${cfg.websocket.address}:${cfg.websocket.port}`);
                    loader.modules.hooks.createLog(this.name, `Disconnected from Streamer.Bot at ${cfg.websocket.address}:${cfg.websocket.port}`);
                },
                onError: async (err) => {
                    this.usingService = false;
                    loader.modules.hooks.createOutput(this.name, `Error with Streamer.Bot at ${cfg.websocket.address}:${cfg.websocket.port} (${err})`);
                    loader.modules.hooks.createLog(this.name, `Error with Streamer.Bot at ${cfg.websocket.address}:${cfg.websocket.port} (${err})`);
                },
                address: cfg.websocket.address,
                port: cfg.websocket.port,
                password: cfg.websocket.authentication,
            })
        } catch (e) {}
    }
}


module.exports = streamberBotInteractions;