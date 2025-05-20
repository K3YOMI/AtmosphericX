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
      * @function createManualAlert
      * @description Creates a manual alert and adds it to the cache.
      * 
      * @async
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      */

    createManualAlert = async function(request, response) {
        let hasSession = loader.modules.dashboard.hasCredentials(request, response)
        if (!hasSession.success) {
            this.giveResponse(request, response, {statusCode: 403, message: `Forbidden - No session found`});
            return {success: false, message: `Forbidden - No session found`}
        }
        let body = JSON.parse(await new Promise((resolve, reject) => {
            let body = ``;
            request.on(`data`, (chunk) => { body += chunk; });
            request.on(`end`, () => { resolve(body); });
        }));
        let registration = loader.modules.building.registerEvent(body);
        loader.cache.manual = registration.details.locations != `` ? registration : []
        this.giveResponse(request, response, {statusCode: 200, message: `Alert created successfully`});
        if (loader.cache.manual.length != 0) {
            loader.modules.hooks.createOutput(this.name, `Manual alert created successfully - ${hasSession.message}`);
            loader.modules.hooks.createLog(this.name, `Manual alert created successfully - ${hasSession.message}`);
        } else { 
            loader.modules.hooks.createOutput(this.name, `Cleared manual alert - ${hasSession.message}`);
            loader.modules.hooks.createLog(this.name, `Cleared manual alert - ${hasSession.message}`);
        }
        loader.modules.websocket.onCacheReady()
        return {success: true, message: `Manual alert modified successfully`}
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
        let hasSession = loader.modules.dashboard.hasCredentials(request, response)
        if (!hasSession.success) {
            this.giveResponse(request, response, {statusCode: 403, message: `Forbidden - No session found`});
            return {success: false, message: `Forbidden - No session found`}
        }
        let body = JSON.parse(await new Promise((resolve, reject) => {
            let body = ``;
            request.on(`data`, (chunk) => { body += chunk; });
            request.on(`end`, () => { resolve(body); });
        }));
        let title = body.title
        let message = body.message
        this.giveResponse(request, response, {statusCode: 200, message: `Notification created successfully`});
        if (title != `` && message != ``) {
            loader.cache.notification = {title: title, message: message}
            loader.modules.hooks.createOutput(this.name, `Notification created successfully - ${hasSession.message}`);
            loader.modules.hooks.createLog(this.name, `Notification created successfully - ${hasSession.message}`);
        } else {
            loader.cache.notification = {}
            loader.modules.hooks.createOutput(this.name, `Cleared notification - ${hasSession.message}`);
            loader.modules.hooks.createLog(this.name, `Cleared notification - ${hasSession.message}`);
        }
        loader.modules.websocket.onCacheReady()
        return {success: true, message: `Notification modified successfully`}
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
        let hasSession = loader.modules.dashboard.hasCredentials(request, response)
        if (!hasSession.success) {
            this.giveResponse(request, response, {statusCode: 403, message: `Forbidden - No session found`});
            return {success: false, message: `Forbidden - No session found`}
        }
        let body = JSON.parse(await new Promise((resolve, reject) => {
            let body = ``;
            request.on(`data`, (chunk) => { body += chunk; });
            request.on(`end`, () => { resolve(body); });
        }));
        let title = body.title
        loader.cache.header = title
        this.giveResponse(request, response, {statusCode: 200, message: `Header modified successfully`});
        if (title != ``) {
            loader.modules.hooks.createOutput(this.name, `Status header modified successfully - ${hasSession.message}`);
            loader.modules.hooks.createLog(this.name, `Status header modified successfully - ${hasSession.message}`);
        } else {
            loader.cache.header = ``
            loader.modules.hooks.createOutput(this.name, `Cleared status header - ${hasSession.message}`);
            loader.modules.hooks.createLog(this.name, `Cleared status header - ${hasSession.message}`);
        }
        loader.modules.websocket.onCacheReady()
        return {success: true, message: `Status header modified successfully`}
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
            let body = JSON.parse(await new Promise((resolve, reject) => {
                let body = ``;
                request.on(`data`, (chunk) => { body += chunk; });
                request.on(`end`, () => { resolve(body); });
            }));
            if (action == 0) { // Login (0)
                let username = body.username;
                let hash = loader.packages.crypto.createHash(`sha256`).update(body.password).digest(`base64`);
                let db = await loader.modules.database.runQuery(`SELECT * FROM accounts WHERE username = ? AND hash = ?`, [username, hash]);
                if (db.length == 0) {
                    loader.modules.hooks.createOutput(this.name, `Attempted login with invalid credentials on username ${username}`);
                    loader.modules.hooks.createLog(this.name, `WARNING`, `Attempted login with invalid credentials on username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Invalid username or password`});
                    return {success: false, message: `Invalid username or password`};
                }
                if (db[0].activated == 0) {
                    loader.modules.hooks.createOutput(this.name, `Attempted login with unactivated account on username ${username}`);
                    loader.modules.hooks.createLog(this.name, `WARNING`, `Attempted login with unactivated account on username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Account not activated`});
                    return {success: false, message: `Account not activated`};
                }
                request.session.account = `atmosx-session-${loader.packages.crypto.randomBytes(16).toString(`hex`)}`;
                request.session.username = username;
                request.session.save();
                loader.modules.hooks.createOutput(this.name, `Login successful for username ${username}`);
                loader.modules.hooks.createLog(this.name, `INFO`, `Login successful for username ${username}`);
                loader.static.accounts.push({username: username, session: request.session.account});
                this.giveResponse(request, response, {statusCode: 200, message: `Login successful`});
                return {success: true, message: `Login successful`};
            }
            if (action == 1) { // Logout (1)
                if (request.session.account == undefined) {
                    loader.modules.hooks.createOutput(this.name, `Attempted logout with no session`);
                    loader.modules.hooks.createLog(this.name, `WARNING`, `Attempted logout with no session`);
                    this.giveResponse(request, response, {statusCode: 401, message: `No session found`});
                    request.session.destroy();
                    return {success: false, message: `No session found`};
                }
                let account = loader.static.accounts.find(a => a.session == request.session.account);
                loader.modules.hooks.createOutput(this.name, `${account.username} logged out successfully`);
                loader.modules.hooks.createLog(this.name, `INFO`, `${account.username} logged out successfully`);
                loader.static.accounts = loader.static.accounts.filter(a => a.session != request.session.account);
                this.giveResponse(request, response, {statusCode: 200, message: `Logout successful`});
                request.session.destroy();
                return {success: true, message: `Logout successful`};
            }
            if (action == 2) { // Register (2)
                let username = body.username;
                let hash = loader.packages.crypto.createHash(`sha256`).update(body.password).digest(`base64`);
                let db = await loader.modules.database.runQuery(`SELECT * FROM accounts WHERE username = ?`, [username]);
                if (db.length > 0) {
                    loader.modules.hooks.createOutput(this.name, `Attempted registration with existing username ${username}`);
                    loader.modules.hooks.createLog(this.name, `WARNING`, `Attempted registration with existing username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Username already exists`});
                    return {success: false, message: `Username already exists`};
                }
                if (username.length < 3 || username.length > 20) {
                    loader.modules.hooks.createOutput(this.name, `Attempted registration with invalid username ${username}`);
                    loader.modules.hooks.createLog(this.name, `WARNING`, `Attempted registration with invalid username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Username must be between 3 and 20 characters`});
                    return {success: false, message: `Username must be between 3 and 20 characters`};
                }
                let createdAccount = await loader.modules.database.runQuery(`INSERT INTO accounts (username, hash, activated) VALUES (?, ?, ?)`, [username, hash, 0]);
                if (createdAccount == undefined) {
                    loader.modules.hooks.createOutput(this.name, `Failed to create account for username ${username}`);
                    loader.modules.hooks.createLog(this.name, `WARNING`, `Failed to create account for username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Failed to create account`});
                    return {success: false, message: `Failed to create account`};
                }
                loader.modules.hooks.createOutput(this.name, `Account created for username ${username}, please wait for the administrator to activate your account`);
                loader.modules.hooks.createLog(this.name, `INFO`, `Account created for username ${username}, to activate this account, type /activate <username> <true/false> in the console`);
                this.giveResponse(request, response, {statusCode: 200, message: `Account created successfully - please wait for the administrator to activate your account`});
                return {success: true, message: `Account created successfully, please wait for the administrator to activate your account`};
            }
            if (action == 3) { // Reset Password (3)
                let username = body.username;
                let oldPassword = loader.packages.crypto.createHash(`sha256`).update(body.password).digest(`base64`);
                let newPassword = loader.packages.crypto.createHash(`sha256`).update(body.new_password).digest(`base64`);
                let db = await loader.modules.database.runQuery(`SELECT * FROM accounts WHERE username = ? AND hash = ?`, [username, oldPassword]);
                if (db.length == 0) {
                    loader.modules.hooks.createOutput(this.name, `Attempted password reset with invalid credentials on username ${username}`);
                    loader.modules.hooks.createLog(this.name, `WARNING`, `Attempted password reset with invalid credentials on username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Invalid username or password`});
                    return {success: false, message: `Invalid username or password`};
                }
                if (db[0].activated == 0) {
                    loader.modules.hooks.createOutput(this.name, `Attempted password reset with unactivated account on username ${username}`);
                    loader.modules.hooks.createLog(this.name, `WARNING`, `Attempted password reset with unactivated account on username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Account not activated`});
                    return {success: false, message: `Account not activated`};
                }
                let updatedAccount = await loader.modules.database.runQuery(`UPDATE accounts SET hash = ? WHERE username = ?`, [newPassword, username]);
                if (updatedAccount == undefined) {
                    loader.modules.hooks.createOutput(this.name, `Failed to update password for username ${username}`);
                    loader.modules.hooks.createLog(this.name, `WARNING`, `Failed to update password for username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Failed to update password`});
                    return {success: false, message: `Failed to update password`};
                }
                loader.modules.hooks.createOutput(this.name, `Password updated for username ${username}`);
                loader.modules.hooks.createLog(this.name, `INFO`, `Password updated for username ${username}`);
                this.giveResponse(request, response, {statusCode: 200, message: `Password updated successfully`});
                return {success: true, message: `Password updated successfully`};
            }
        } catch (error) {
            loader.modules.hooks.createOutput(this.name, `Error occurred while managing credentials: ${error}`);
            loader.modules.hooks.createLog(this.name, `ERROR`, `Error occurred while managing credentials: ${error}`);
            this.giveResponse(request, response, {statusCode: 500, message: `Internal Server Error`});
            return {success: false, message: `Internal Server Error`};
        }
    }


    /**
      * @function giveResponse
      * @description Sends a JSON response to the client with the specified status code and message.
      * 
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      * @param {Object} data - An object containing the status code and message to be sent in the response.
      */

    giveResponse = function(request, response, data={statusCode: 200, message: `OK`}) {
        response.statusCode = data.statusCode
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({status: data.statusCode, message: data.message}))
    }

    /**
      * @function hasCredentials
      * @description Checks if the user has valid credentials in the session.
      * 
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      */

    hasCredentials = function(request, response) { 
        if (!loader.cache.configurations.hosting.portal) { return {success: true, message: `Userless Session`}}
        if (request.session.account != undefined) { return {success: true, message: request.session.username} }
        return {success: false, message: `Session not found`}
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

    redirectSession = function(request, response, redirectUrl, killSession=false) { 
        if (killSession) { request.session.destroy(); response.clearCookie(`atmosx-session`) }
        response.sendFile(redirectUrl)
        return {success: true, message: `Redirected to ${redirectUrl}`}
    }
}


module.exports = Dashboard;