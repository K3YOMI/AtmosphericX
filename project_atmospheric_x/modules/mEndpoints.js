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


class Dashboard { 
    constructor() {
        this.name = `Dashboard`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    /**
     * @function sendCacheData
     * @description Sends cache data to the client based on the request and response objects.
     * 
     * @param {Object} request - The HTTP request object.
     * @param {Object} response - The HTTP response object.
     * @param {string} pointer - The cache pointer to send.
     * @param {boolean} xy - Whether to include latitude and longitude in the response.
     */

    sendCacheData = async function(request, response, pointer, xy = false) {
        try {
            if (xy) {
                let url = request.url, params = new URLSearchParams(url.split('?')[1]);
                let lon = parseFloat(params.get('lon'))
                let lat = parseFloat(params.get('lat'))
            }
            this.giveResponse(request, response, { statusCode: 200, message: pointer }, true);
        } catch (error) {
            this.giveResponse(request, response, { statusCode: 500, message: `Internal Server Error` }, true);
            loader.modules.hooks.createOutput(this.name, `Error occurred while sending cache data: ${error}`);
            loader.modules.hooks.createLog(this.name, `ERROR`, `Error occurred while sending cache data: ${error}`);
        }
    }

    /**
      * @function processConfigurations
      * @description Processes the configurations from the request body and saves them to the configurations file.
      * 
      * @async
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      */

    processConfigurations = async function(request, response) {
        try {
            let hasSession = loader.modules.dashboard.hasCredentials(request, response, true);
            if (!hasSession.success) {
                this.giveResponse(request, response, {statusCode: 403, message: `You must be an administrator to modify configurations`});
                return {success: false, message: `You must be an administrator to modify configurations`};
            }
            let body = await new Promise((resolve, reject) => { let data = ``; request.on(`data`, chunk => data += chunk); request.on(`end`, () => resolve(data)); request.on(`error`, error => reject(error)); });
            let parsedBody;
            try { parsedBody = JSON.parse(body); } 
            catch (e) { 
                this.giveResponse(request, response, {statusCode: 400, message: `Invalid JSON format`}); 
                return {success: false, message: `Invalid JSON format`}; 
            }
            loader.packages.fs.writeFileSync(`../configurations.json`, JSON.stringify(parsedBody, null, 4));
            loader.modules.hooks.createOutput(this.name, `Configurations modified successfully`);
            loader.modules.hooks.createLog(this.name, `Configurations modified successfully`);
            this.giveResponse(request, response, {statusCode: 200, message: `Configurations modified successfully`});
            loader.modules.hooks.reloadConfigurations();
            return {success: true, message: `Configurations modified successfully`};
        } catch (error) {
            loader.modules.hooks.createOutput(this.name, `Error occurred while processing configurations: ${error}`);
            loader.modules.hooks.createLog(this.name, `ERROR`, `Error occurred while processing configurations: ${error}`);
            this.giveResponse(request, response, {statusCode: 500, message: `Internal Server Error`});
            return {success: false, message: `Internal Server Error`};
        }
    }

    /**
      * @function chatBot
      * @description Create a message with a chatbot to retrieve text-to-speech audio for streaming purposes ig...
      * This is only windows supported due to a package limitation....
      * 
      * @async
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      */

    chatBot = async function(request, response) {
        try {
            let hasSession = loader.modules.dashboard.hasCredentials(request, response, true);
            if (!hasSession.success) {
                this.giveResponse(request, response, {statusCode: 403, message: `You must be an administrator to create a chatbot alert`});
                return {success: false, message: `You must be an administrator to create a chatbot alert`};
            }
            let body = await new Promise((resolve, reject) => { let data = ``; request.on(`data`, chunk => data += chunk); request.on(`end`, () => resolve(data)); request.on(`error`, error => reject(error)); });
            let parsedBody = JSON.parse(body);
            let registration = loader.modules.hooks.filteringHtml(parsedBody);
            let description = registration.description;
            let chatData = await loader.modules.character.commitChat(`${loader.cache.configurations.sources.miscellaneous_sources.character_ai.prefix} ${description}`);
            if (!chatData.status) {
                this.giveResponse(request, response, {statusCode: 200, message: chatData.message});
                return {success: false, message: chatData.message};
            }
            loader.cache.chatbot = {message: chatData.message, image: loader.cache.configurations.sources.miscellaneous_sources.character_ai.image};
            this.giveResponse(request, response, {statusCode: 200, message: `Chatbot alert created successfully`});
            loader.modules.websocket.onCacheReady();
            return {success: true, message: `Chatbot alert created successfully`};
        } catch (error) {
            loader.modules.hooks.createOutput(this.name, `Error occurred while creating chatbot alert: ${error}`);
            loader.modules.hooks.createLog(this.name, `ERROR`, `Error occurred while creating chatbot alert: ${error}`);
            this.giveResponse(request, response, {statusCode: 500, message: `Internal Server Error`});
            return {success: false, message: `Internal Server Error`};
        }
    }

    /**
      * @function createManualAlert
      * @description Creates a manual alert and adds it to the cache.
      * 
      * @async
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      */

    createManualAlert = async function(request, response) {
        try {
            let hasSession = loader.modules.dashboard.hasCredentials(request, response, true);
            if (!hasSession.success) {
                this.giveResponse(request, response, {statusCode: 403, message: `You must be an administrator to create a manual alert`});
                return {success: false, message: `You must be an administrator to create a manual alert`};
            }
            let body = await new Promise((resolve, reject) => { let data = ``; request.on(`data`, chunk => data += chunk); request.on(`end`, () => resolve(data)); request.on(`error`, error => reject(error)); });
            let parsedBody = JSON.parse(body);
            let registration = loader.modules.hooks.filteringHtml(loader.modules.building.registerEvent(parsedBody));
            loader.cache.manual = registration.details.locations != `` ? registration : [];
            this.giveResponse(request, response, {statusCode: 200, message: `Alert created successfully`});
            if (loader.cache.manual.length != 0) {
                loader.modules.hooks.createOutput(this.name, `Manual alert created successfully - Created Alert`);
                loader.modules.hooks.createLog(this.name, `Manual alert created successfully - Created Alert`);
            } else {
                loader.modules.hooks.createOutput(this.name, `Cleared manual alert - Clear`);
                loader.modules.hooks.createLog(this.name, `Cleared manual alert - Clear`);
            }
            loader.modules.websocket.onCacheReady();
            return {success: true, message: `Manual alert modified successfully`};
        } catch (error) {
            loader.modules.hooks.createOutput(this.name, `Error occurred while creating manual alert: ${error}`);
            loader.modules.hooks.createLog(this.name, `ERROR`, `Error occurred while creating manual alert: ${error}`);
            this.giveResponse(request, response, {statusCode: 500, message: `Internal Server Error`});
            return {success: false, message: `Internal Server Error`};
        }
    }

    /**
      * @function createNotification
      * @description Creates a notification and adds it to the cache.
      * 
      * @async
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      */

    createNotification = async function(request, response) {
        try {
            let hasSession = loader.modules.dashboard.hasCredentials(request, response, true);
            if (!hasSession.success) {
                this.giveResponse(request, response, {statusCode: 403, message: `You must be an administrator to create a notification`});
                return {success: false, message: `You must be an administrator to create a notification`};
            }
            let body = JSON.parse(await new Promise((resolve, reject) => { let data = ``; request.on(`data`, chunk => data += chunk); request.on(`end`, () => resolve(data)); request.on(`error`, error => reject(error)); }));
            let { title, message } = body;
            if (title && message) {
                loader.cache.notification = loader.modules.hooks.filteringHtml({title, message});
                loader.modules.hooks.createOutput(this.name, `Notification created successfully - ${title} - ${message}`);
                loader.modules.hooks.createLog(this.name, `Notification created successfully - ${title} - ${message}`);
            } else {
                loader.cache.notification = {};
                loader.modules.hooks.createOutput(this.name, `Cleared notification - Clear`);
                loader.modules.hooks.createLog(this.name, `Cleared notification - Clear`);
            }
            loader.modules.websocket.onCacheReady();
            this.giveResponse(request, response, {statusCode: 200, message: `Notification modified successfully`});
            return {success: true, message: `Notification modified successfully`};
        } catch (error) {
            loader.modules.hooks.createOutput(this.name, `Error occurred while creating notification: ${error}`);
            loader.modules.hooks.createLog(this.name, `ERROR`, `Error occurred while creating notification: ${error}`);
            this.giveResponse(request, response, {statusCode: 500, message: `Internal Server Error`});
            return {success: false, message: `Internal Server Error`};
        }
    }

    /**
      * @function createStatusHeader
      * @description Creates a status header and adds it to the cache.
      * 
      * @async
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object. 
      */

    createStatusHeader = async function(request, response) {
        try {
            let hasSession = loader.modules.dashboard.hasCredentials(request, response, true);
            if (!hasSession.success) {
                this.giveResponse(request, response, {statusCode: 403, message: `You must be an administrator to modify the status header`});
                return {success: false, message: `You must be an administrator to modify the status header`};
            }
            let body = JSON.parse(await new Promise((resolve, reject) => { let data = ``; request.on(`data`, chunk => data += chunk); request.on(`end`, () => resolve(data)); request.on(`error`, error => reject(error)); }));
            let title = body.title || ``;
            loader.cache.header = title;
            this.giveResponse(request, response, {statusCode: 200, message: `Header modified successfully - ${loader.cache.header}`});
            if (title) {
                loader.modules.hooks.createOutput(this.name, `Status header modified successfully - ${loader.cache.header}`);
                loader.modules.hooks.createLog(this.name, `Status header modified successfully - ${loader.cache.header}`);
            } else {
                loader.cache.header = ``;
                loader.modules.hooks.createOutput(this.name, `Cleared status header - Clear`);
                loader.modules.hooks.createLog(this.name, `Cleared status header - Clear`);
            }
            loader.modules.websocket.onCacheReady();
            return {success: true, message: `Status header modified successfully`};
        } catch (error) {
            loader.modules.hooks.createOutput(this.name, `Error occurred while modifying status header: ${error}`);
            loader.modules.hooks.createLog(this.name, `ERROR`, `Error occurred while modifying status header: ${error}`);
            this.giveResponse(request, response, {statusCode: 500, message: `Internal Server Error`});
            return {success: false, message: `Internal Server Error`};
        }
    }

    /**
      * @function createExpressServer
      * @description Creates an Express server and sets up middleware for session management and static file serving.
      * 
      * @async
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      * @param {number} action - The action to perform (0: login, 1: logout, 2: register, 3: reset password).
      */

    processCredentials = async function(request, response, action) {
        try {
            let body = JSON.parse(await new Promise((resolve, reject) => { let data = ``; request.on(`data`, chunk => data += chunk); request.on(`end`, () => resolve(data)); request.on(`error`, error => reject(error)); }));
            let username = body.username || '', hash = body.password ? loader.packages.crypto.createHash(`sha256`).update(body.password).digest(`base64`) : '';
            if (action == 0) { // Login
                let db = await loader.modules.database.runQuery(`SELECT * FROM accounts WHERE username = ? AND hash = ?`, [username, hash]);
                if (!db.length) return this.logError(response, `Invalid username or password`, 401, `Attempted login with invalid credentials on username ${username}`);
                if (!db[0].activated) return this.logError(response, `Account not activated`, 401, `Attempted login with unactivated account on username ${username}`);
                let session = loader.packages.crypto.randomBytes(32).toString(`hex`);
                response.cookie(`session`, session, { maxAge: null, sameSite: `lax`, secure: loader.cache.configurations.hosting.https, httpOnly: true });
                loader.static.accounts.push({ username, session, address: request.headers['cf-connecting-ip'] || request.connection.remoteAddress, userAgent: request.headers['user-agent'] });
                this.logSuccess(response, `Login successful`, 200, `Login successful for username ${username}`, { session, role: db[0].role });
                return { success: true, message: `Login successful`, session, role: db[0].role };
            }
            if (action == 1) { // Logout
                let account = loader.static.accounts.find(a => a.session == request.cookies.session || a.session == request.cookies.sessionFallback);
                if (!account) return this.logError(response, `No session found`, 401, `No session found`);
                loader.static.accounts = loader.static.accounts.filter(a => a.session !== account.session);
                response.clearCookie(`session`); response.clearCookie(`sessionFallback`);
                this.logSuccess(response, `Logout successful`, 200, `${account.username} logged out successfully`);
                return { success: true, message: `Logout successful` };
            }
            if (action == 2) { // Register
                let db = await loader.modules.database.runQuery(`SELECT * FROM accounts WHERE username = ?`, [username]);
                let allowedChars = /^[a-zA-Z0-9_]+$/;
                if (db.length) return this.logError(response, `Username already exists`, 401, `Attempted registration with existing username ${username}`);
                if (!username.match(allowedChars)) return this.logError(response, `Username can only contain alphanumeric characters and underscores`, 401, `Attempted registration with invalid username ${username}`);
                if ((username.length < 3 || username.length > 20)) return this.logError(response, `Username must be between 3 and 20 characters`, 401, `Attempted registration with invalid username ${username}`);
                let createdAccount = await loader.modules.database.runQuery(`INSERT INTO accounts (username, hash, activated) VALUES (?, ?, ?)`, [username, hash, 0]);
                if (!createdAccount) return this.logError(response, `Failed to create account`, 401, `Failed to create account for username ${username}`);
                this.logSuccess(response, `Account created successfully - please wait for the administrator to activate your account`, 200, `Account created for username ${username}, to activate this account, type /activate <username> <true/false> in the console`);
                return { success: true, message: `Account created successfully, please wait for the administrator to activate your account` };
            }
            if (action == 3) { // Reset Password
                let oldPassword = hash, newPassword = loader.packages.crypto.createHash(`sha256`).update(body.new_password).digest(`base64`);
                let db = await loader.modules.database.runQuery(`SELECT * FROM accounts WHERE username = ? AND hash = ?`, [username, oldPassword]);
                if (!db.length) return this.logError(response, `Invalid username or password`, 401, `Attempted password reset with invalid credentials on username ${username}`);
                if (!db[0].activated) return this.logError(response, `Account not activated`, 401, `Attempted password reset with unactivated account on username ${username}`);
                let updatedAccount = await loader.modules.database.runQuery(`UPDATE accounts SET hash = ? WHERE username = ?`, [newPassword, username]);
                if (!updatedAccount) return this.logError(response, `Failed to update password`, 401, `Failed to update password for username ${username}`);
                this.logSuccess(response, `Password updated successfully`, 200, `Password updated for username ${username}`);
                return { success: true, message: `Password updated successfully` };
            }
            if (action == 4) { // Guest Login
                if (!loader.cache.configurations.hosting.guests) return this.logError(response, `Guest login is disabled`, 403, `Attempted guest login but guest login is disabled`);
                let session = loader.packages.crypto.randomBytes(32).toString(`hex`);
                response.cookie(`session`, session, { maxAge: null, sameSite: `lax`, secure: loader.cache.configurations.hosting.https, httpOnly: true });
                let randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
                loader.static.accounts.push({ username: `Guest-${randomSuffix}`, session, address: request.headers['cf-connecting-ip'] || request.connection.remoteAddress, userAgent: request.headers['user-agent'], isGuest: true });
                this.logSuccess(response, `Guest login successful`, 200, `Guest login successful - Guest-${randomSuffix}`, { session, role: 0 });
                return { success: true, message: `Guest login successful`, session, role: 0 };
            }
            this.logError(response, `Invalid action`, 400, `Invalid action`);
            return { success: false, message: `Invalid action` };
        } catch (error) {
            this.logError(response, `Error occurred while processing credentials: ${error}`, 500, `Error occurred while processing credentials: ${error}`);
            return { success: false, message: `Internal Server Error` };
        }
    }

    /**
      * @function logError
      * @description Handles errors by logging them and sending a response with the specified status code and message.
      * @param {Object} response - The HTTP response object.
      * @param {string} message - The error message to send in the response.
      * @param {number} statusCode - The HTTP status code to set in the response.
      * @param {string} logMessage - The message to log in the system logs.
      */

    logError(response, message, statusCode, logMessage) {
        loader.modules.hooks.createOutput(this.name, logMessage);
        loader.modules.hooks.createLog(this.name, logMessage);
        this.giveResponse(null, response, { statusCode, message });
    }

    /**
      * @function logSuccess
      * @description Logs a success message and sends a response with the specified status code and message.
      * @param {Object} response - The HTTP response object.
      * @param {string} message - The success message to send in the response.
      * @param {number} statusCode - The HTTP status code to set in the response.
      * @param {string} logMessage - The message to log in the system logs.
      * @param {Object} additionalData - Additional data to include in the response.
      */

    logSuccess(response, message, statusCode, logMessage, additionalData = {}) {
        loader.modules.hooks.createOutput(this.name, logMessage);
        loader.modules.hooks.createLog(this.name, `INFO`, logMessage);
        this.giveResponse(null, response, { statusCode, message, ...additionalData });
    }

    /**
      * @function giveResponse
      * @description Sends a JSON response to the client with the specified status code and message.
      * 
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      * @param {Object} data - An object containing the status code and message to be sent in the response.
      */

    giveResponse = function(request, response, data = { statusCode: 200, message: 'OK' }, isRaw = false) {
        let { statusCode, message } = data;
        response.statusCode = statusCode;
        response.setHeader('Content-Type', isRaw ? 'text/plain' : 'application/json');
        response.end(isRaw ? (message || 'OK') : JSON.stringify(data));
    }

    /**
      * @function hasCredentials
      * @description Checks if the user has valid credentials in the session.
      * 
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      * @param {boolean} isAdministrator - Whether to check if the user is an administrator (default: false).
      */

    hasCredentials = function(request, response, isAdministrator = false) {
        if (!loader.cache.configurations.hosting.portal) return { success: true, message: `Userless Session` };
        let cookie = request.cookies.session, fallback = request.cookies.sessionFallback;
        let account = loader.static.accounts.find(a => a.session == cookie || a.session == fallback);
        if (account) {
            if (account.isGuest) return isAdministrator ? { success: false, message: `Forbidden - Guest user cannot be an administrator` } : { success: true, message: `Guest user ${account.username} has valid session` };
            let getDB = loader.modules.database.runQuery(`SELECT * FROM accounts WHERE username = ?`, [account.username]);
            if (!getDB.length) return { success: false, message: `Forbidden - User not found in database` };
            if (isAdministrator && getDB[0].role !== 1) return { success: false, message: `Forbidden - User is not an administrator` };
            return { success: true, message: `User ${account.username} has valid session` };
        }
        return { success: false, message: `Forbidden - Invalid session` };
    }

    /**
      * @function redirectSession
      * @description Redirects the user to a specified URL and optionally destroys the session.
      * 
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      * @param {string} redirectUrl - The URL to redirect the user to.
      * @param {boolean} killSession - Whether to destroy the session (default: false).
      */

    redirectSession = function(request, response, redirectUrl, killSession = false) {
        if (killSession) {
            response.clearCookie('session'); 
            response.clearCookie('sessionFallback');
        }
        let filePath = redirectUrl;
        response.sendFile(filePath);
        return { success: true, message: `Redirected to ${filePath}` };
    }
}


module.exports = Dashboard;