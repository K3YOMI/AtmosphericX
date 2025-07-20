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
        let socket = loader.static.socket = new loader.packages.ws.Server({ server: loader.static.websocket, path: '/ws' });
        socket.on('connection', client => {
            this.onConnection(client);
            client.on('message', message => this.onMessage(client, message));
            client.on('close', () => this.onClose(client));
        });
        socket.on('close', client => this.onClose(client));
        return { status: true, message: 'Websocket server created' };
    }

    /**
      * @function onClose 
      * @description Closes the websocket connection based on the client id (index) and removes it from both the clients and limits array
      * @param {WebSocket} client - The client to close the connection for
      */

    onClose = function(client) {
        let index = loader.static.webSocketClients.indexOf(client);
        if (index > -1) {
            loader.static.webSocketClients.splice(index, 1);
            loader.static.webSocketClientLimits.splice(index, 1);
        }
    }

    /**
      * @function onConnection 
      * @description Sends a message to the client when the connection is established, this can be used to trigger a request for the client to the server to update their cache
      * @param {WebSocket} client - The client to send the message to
      */

    onConnection = function(client) {
        let clients = loader.static.webSocketClients;
        clients.push(client);
        client.send(JSON.stringify({ messageType: 'onConnection', message: 'Websocket connection established' }));
    }

    /**
      * @function onMessage
      * @description Handles the messages being sent from the client, this will be used to request values or send any other information to the server...
      * @param {WebSocket} client - The client that sent the message
      * @param {string} message - The message being sent from the client, this will be a JSON string that will be parsed to an object  
      */

    onMessage = function(client, message) {
        if (typeof message !== 'string' || !message.startsWith('{') || !message.endsWith('}')) {
            return client.send(JSON.stringify({ messageType: 'onNewMessage', message: '[201 ERR] Message is not JSON' }));
        }
        let data = JSON.parse(message);
        let { messageType, message: messageValue } = data;
        if (!messageType || !messageValue) {
            return client.send(JSON.stringify({ messageType: 'onNewMessage', message: '[201 ERR] Missing messageType or messageValue' }));
        }
        if (messageType == 'onRequestValues') {
            this.requestValues(client, messageValue);
            return client.send(JSON.stringify({ messageType: 'onNewMessage', message: '[200 OK] Received values' }));
        }
        return client.send(JSON.stringify({ messageType: 'onNewMessage', message: '[201 ERR] Unknown messageType' }));
    }

    /** 
      * @function requestValues
      * @description This request values that the client wants to recieve, this will also filter out any values that we dont want the client to gather as that will lead to leaking information
      * @param {WebSocket} client - The client that sent the message
      * @param {Array} values - The values that the client wants to request, this will be an array of strings that will be filtered to only include the allowed values
      */

    requestValues = function(client, values) {
        let allowedValues = loader.definitions.allowed_websockets;
        values = values.filter(value => allowedValues.includes(value));
        if (client.readyState !== loader.packages.ws.OPEN) return { status: false, message: '[201 ERR] Client not ready' };
        let index = loader.static.webSocketClients.indexOf(client);
        if (index == -1) return client.send(JSON.stringify({ messageType: 'onNewMessage', message: '[201 ERR] Client not found' }));
        let canSend = false;
        values.forEach(value => {
            loader.static.webSocketClientLimits[index] = loader.static.webSocketClientLimits[index] || {};
            loader.static.webSocketClientLimits[index][value] = loader.static.webSocketClientLimits[index][value] || { time: 0, hasCalled: false };
            let { time: lastTime, hasCalled } = loader.static.webSocketClientLimits[index][value];
            let currentTime = Date.now();
            let websocketCfg = loader.cache.configurations.websocket_settings;
            let timeout = websocketCfg.priority_websockets.types.includes(value) ? websocketCfg.priority_websockets.timeout : websocketCfg.general_websockets.types.includes(value) 
                ? websocketCfg.general_websockets.timeout : 1;
            if (currentTime - lastTime > timeout * 1000 || !hasCalled) {
                canSend = true;
                loader.static.webSocketClientLimits[index][value] = { time: currentTime, hasCalled: true };
                let cacheData = loader.cache[value] || [];
                client.send(JSON.stringify({ messageType: 'onCacheUpdate', value, message: cacheData }));
            }
        });
        if (!canSend) return { status: false, message: '[201 ERR] No values to send' };
        client.send(JSON.stringify({ messageType: 'onCacheFinished', message: '[200 OK] Cache has been fully sent to your client!' }));
        return { status: true, message: '[200 OK] Cache has been fully sent to your client!' };
    }

    /**
      * @function onCacheReady
      * @description This will be used to send a message to all clients when the cache is ready, this will be used to trigger a request for the client to the server to update their cache
      */

    onCacheReady = function() {
        loader.modules.hooks.getRandomAlert();
        loader.static.webSocketClients.forEach(client => {
            if (client.readyState == loader.packages.ws.OPEN) {
                client.send(JSON.stringify({ messageType: 'onCacheReady', message: '[200 OK] Cache just updated, want to request?' }));
            } else {
                this.onClose(client);
            }
        });
        return { status: true, message: '[200 OK] Cache request has been sent to all clients!' };
    }
}

module.exports = Websockets;