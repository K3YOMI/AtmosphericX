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


class Websockets { 
    constructor() {
        this.name = `Websockets`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
        this.createWebsocketServer()
    }

    /**
      * @function createWebsocketServer 
      * @description Creates a websocket server and listens for connections and messages, this will also be used to send cache updates to the client instead of using
      * REST API calls as that will lead to a lot of requests and slowdown on the server...
      * 
      */

    createWebsocketServer = function() {
        loader.static.socket = new loader.packages.ws.Server({ server: loader.static.websocket, path: '/ws' })
        loader.static.socket.on(`connection`, (client) => { 
            this.onConnection(client) 
            client.on(`message`, (message) => { this.onMessage(client, message) })
            client.on(`close`, () => { this.onClose(client) })
        })
        loader.static.socket.on(`close`, (client) => { this.onClose(client) })
        return {status: true, message: `Websocket server created`}
    }

    /**
      * @function onClose 
      * @description Closes the websocket connection based on the client id (index) and removes it from both the clients and limits array
      * @param {WebSocket} client - The client to close the connection for
      */

    onClose = function(client) {
        let index = loader.static.webSocketClients.indexOf(client)
        if (index > -1) { 
            loader.static.webSocketClients.splice(index, 1) 
            loader.static.webSocketClientLimits.splice(index, 1)
        }
    }

    /**
      * @function onConnection 
      * @description Sends a message to the client when the connection is established, this can be used to trigger a request for the client to the server to update their cache
      * @param {WebSocket} client - The client to send the message to
      */

    onConnection = function(client) {
        loader.static.webSocketClients.push(client)
        return client.send(JSON.stringify({messageType: `onConnection`, message: `Websocket connection established`}))
    }

    /**
      * @function onMessage
      * @description Handles the messages being sent from the client, this will be used to request values or send any other information to the server...
      * @param {WebSocket} client - The client that sent the message
      * @param {string} message - The message being sent from the client, this will be a JSON string that will be parsed to an object  
      */

    onMessage = function(client, message) {
        let isJson = typeof message === `string` && message.startsWith(`{`) && message.endsWith(`}`)
        if (!isJson) { return client.send(JSON.stringify({messageType: `onNewMessage`, message: `[201 ERR] Message is not JSON`})) }
        let data = JSON.parse(message)
        let messageType = data.messageType
        let messageValue = data.message
        if (messageType == undefined || messageValue == undefined) { return client.send(JSON.stringify({messageType: `onNewMessage`, message: `[201 ERR] Missing messageType or messageValue`})) }
        if (messageType == `onRequestValues`) { 
            this.requestValues(client, messageValue)
            return client.send(JSON.stringify({messageType: `onNewMessage`, message: `[200 OK] Recieved values`})) 
        }
        return client.send(JSON.stringify({messageType: `onNewMessage`, message: `[201 ERR] Unknown messageType`}))
    }

    /** 
      * @function requestValues
      * @description This request values that the client wants to recieve, this will also filter out any values that we dont want the client to gather as that will lead to leaking information
      * @param {WebSocket} client - The client that sent the message
      * @param {Array} values - The values that the client wants to request, this will be an array of strings that will be filtered to only include the allowed values
      */

    requestValues = function(client, values) {
        let canSend = false
        let allowedValues = [`metrics`, `chatbot`, `wxRadio`, `updates`, `svrprob`, `torprob`, `public`, `active`, `realtime`, `discussions`, `notification`, `header`, `reports`, `spotters`, `manual`, `wire`, `random`]
        values = values.filter((value) => { return allowedValues.includes(value) })
        if (client.readyState === loader.packages.ws.OPEN) { 
            let index = loader.static.webSocketClients.indexOf(client)
            if (index == -1) { return client.send(JSON.stringify({messageType: `onNewMessage`, message: `[201 ERR] Client not found`})) }
            for (let i = 0; i < values.length; i++) { 
                let value = values[i]
                if (loader.static.webSocketClientLimits[index] == undefined) { loader.static.webSocketClientLimits[index] = {} }
                if (loader.static.webSocketClientLimits[index][value] == undefined) {
                    loader.static.webSocketClientLimits[index][value] = {time: 0, hasCalled: false}
                }
                let lastTime = loader.static.webSocketClientLimits[index][value].time
                let currentTime = new Date().getTime()
                let websocketCfg = loader.cache.configurations.project_settings.websocket_settings
                let inPriority = websocketCfg.priority_websockets.types.includes(value)
                let inGeneral = websocketCfg.general_websockets.types.includes(value)
                let defaultTimer = 1
                if (inPriority) { defaultTimer = websocketCfg.priority_websockets.timeout }
                if (inGeneral) { defaultTimer = websocketCfg.general_websockets.timeout }
                if (currentTime - lastTime > defaultTimer * 1000 || loader.static.webSocketClientLimits[index][value].hasCalled == false) {
                    canSend = true
                    loader.static.webSocketClientLimits[index][value].hasCalled = true
                    loader.static.webSocketClientLimits[index][value].time = currentTime
                    let tmp = undefined
                    if (loader.cache[value] == undefined) { tmp = [] } else { tmp = loader.cache[value] }
                    client.send(JSON.stringify({messageType: `onCacheUpdate`, value: value, message: tmp}))
                }
            }
        }
        if (!canSend) { return {status: false, message: `[201 ERR] No values to send` } }
        client.send(JSON.stringify({messageType: `onCacheFinished`, message: `[200 OK] Cache has been fully sent to your client!`}))
        return {status: true, message: `[200 OK] Cache has been fully sent to your client!`}
    }

    /**
      * @function onCacheReady
      * @description This will be used to send a message to all clients when the cache is ready, this will be used to trigger a request for the client to the server to update their cache
      */

    onCacheReady = function() {
        loader.modules.hooks.getRandomAlert()
        for (let i = 0; i < loader.static.webSocketClients.length; i++) {
            let client = loader.static.webSocketClients[i]
            if (client.readyState === loader.packages.ws.OPEN) { 
                client.send(JSON.stringify({messageType: `onCacheReady`, message: `[200 OK] Cache just updated, want to request?`})) 
            } else { 
                this.onClose(client) 
            }
        }
        return {status: true, message: `[200 OK] Cache request has been sent to all clients!`}
    }
}

module.exports = Websockets;