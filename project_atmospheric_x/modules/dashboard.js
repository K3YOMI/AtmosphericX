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
      * @function processConfigurations
      * @description Processes the configurations from the request body and saves them to the configurations file.
      * 
      * @async
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      */

    processConfigurations = async function(request, response) {
        try {
            let hasSession = loader.modules.dashboard.hasCredentials(request, response, true)
            if (!hasSession.success) {
                this.giveResponse(request, response, {statusCode: 403, message: `You must be an administrator to modify configurations`});
                return {success: false, message: `You must be an administrator to modify configurations`}
            }
            let body = JSON.parse(await new Promise((resolve, reject) => {
                let body = ``;
                request.on(`data`, (chunk) => { body += chunk; });
                request.on(`end`, () => { resolve(body); });
            }));
            try { JSON.stringify(body); } catch (e) { this.giveResponse(request, response, {statusCode: 400, message: `Invalid JSON format`}); return {success: false, message: `Invalid JSON format`} }
            loader.packages.fs.writeFileSync(`../configurations.json`, JSON.stringify(body, null, 4));
            loader.modules.hooks.createOutput(this.name, `Configurations modified successfully`);
            loader.modules.hooks.createLog(this.name, `Configurations modified successfully`);
            this.giveResponse(request, response, {statusCode: 200, message: `Configurations modified successfully`});
            loader.modules.hooks.reloadConfigurations()
            return {success: true, message: `Manual alert modified successfully`}
        } catch (error) {
            loader.modules.hooks.createOutput(this.name, `Error occurred while processing configurations: ${error}`);
            loader.modules.hooks.createLog(this.name, `ERROR`, `Error occurred while processing configurations: ${error}`);
            this.giveResponse(request, response, {statusCode: 500, message: `Internal Server Error`});
            return {success: false, message: `Internal Server Error`}
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
            let hasSession = loader.modules.dashboard.hasCredentials(request, response, true)
            if (!hasSession.success) {
                this.giveResponse(request, response, {statusCode: 403, message: `You must be an administrator to create a chatbot alert`});
                return {success: false, message: `You must be an administrator to create a chatbot alert`}
            }
            let body = JSON.parse(await new Promise((resolve, reject) => {
                let body = ``;
                request.on(`data`, (chunk) => { body += chunk; });
                request.on(`end`, () => { resolve(body); });
            }));
            let registration = loader.modules.hooks.filteringHtml(body);
            let description = registration.description
            let chatData = await loader.modules.character.commitChat(`${loader.cache.configurations.sources.miscellaneous_sources.character_ai.prefix} ${description}`)
            if (chatData.status == false) { 
                loader.giveResponse(request, response, {statusCode: 200, message: chatData.message});
                return {success: false, message: chatData.message}
            }
            loader.cache.chatbot = {message: chatData.message, image: loader.cache.configurations.sources.miscellaneous_sources.character_ai.image}
            this.giveResponse(request, response, {statusCode: 200, message: `Chatbot alert created successfully`});
            loader.modules.websocket.onCacheReady()
        } catch (error) {
            loader.modules.hooks.createOutput(this.name, `Error occurred while creating chatbot alert: ${error}`);
            loader.modules.hooks.createLog(this.name, `ERROR`, `Error occurred while creating chatbot alert: ${error}`);
            this.giveResponse(request, response, {statusCode: 500, message: `Internal Server Error`});
            return {success: false, message: `Internal Server Error`}
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
            let hasSession = loader.modules.dashboard.hasCredentials(request, response, true)
            if (!hasSession.success) {
                this.giveResponse(request, response, {statusCode: 403, message: `You must be an administrator to create a manual alert`});
                return {success: false, message: `You must be an administrator to create a manual alert`}
            }
            let body = JSON.parse(await new Promise((resolve, reject) => {
                let body = ``;
                request.on(`data`, (chunk) => { body += chunk; });
                request.on(`end`, () => { resolve(body); });
            }));
            let registration = loader.modules.hooks.filteringHtml(loader.modules.building.registerEvent(body));
            loader.cache.manual = registration.details.locations != `` ? registration : []
            this.giveResponse(request, response, {statusCode: 200, message: `Alert created successfully`});
            if (loader.cache.manual.length != 0) {
                loader.modules.hooks.createOutput(this.name, `Manual alert created successfully - Created Alert`);
                loader.modules.hooks.createLog(this.name, `Manual alert created successfully - Created Alert`);
            } else { 
                loader.modules.hooks.createOutput(this.name, `Cleared manual alert - Clear`);
                loader.modules.hooks.createLog(this.name, `Cleared manual alert - Clear`);
            }
            loader.modules.websocket.onCacheReady()
            return {success: true, message: `Manual alert modified successfully`}
        } catch (error) {
            loader.modules.hooks.createOutput(this.name, `Error occurred while creating manual alert: ${error}`);
            loader.modules.hooks.createLog(this.name, `ERROR`, `Error occurred while creating manual alert: ${error}`);
            this.giveResponse(request, response, {statusCode: 500, message: `Internal Server Error`});
            return {success: false, message: `Internal Server Error`}
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
            let hasSession = loader.modules.dashboard.hasCredentials(request, response, true)
            if (!hasSession.success) {
                this.giveResponse(request, response, {statusCode: 403, message: `You must be an administrator to create a notification`});
                return {success: false, message: `You must be an administrator to create a notification`}
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
                loader.cache.notification = loader.modules.hooks.filteringHtml({title: title, message: message})
                loader.modules.hooks.createOutput(this.name, `Notification created successfully - ${title} - ${message}`);
                loader.modules.hooks.createLog(this.name, `Notification created successfully - ${title} - ${message}`);
            } else {
                loader.cache.notification = {}
                loader.modules.hooks.createOutput(this.name, `Cleared notification - Clear`);
                loader.modules.hooks.createLog(this.name, `Cleared notification - Clear`);
            }
            loader.modules.websocket.onCacheReady()
            return {success: true, message: `Notification modified successfully`}
        } catch (error) {
            loader.modules.hooks.createOutput(this.name, `Error occurred while creating notification: ${error}`);
            loader.modules.hooks.createLog(this.name, `ERROR`, `Error occurred while creating notification: ${error}`);
            this.giveResponse(request, response, {statusCode: 500, message: `Internal Server Error`});
            return {success: false, message: `Internal Server Error`}
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
            let hasSession = loader.modules.dashboard.hasCredentials(request, response, true)
            if (!hasSession.success) {
                this.giveResponse(request, response, {statusCode: 403, message: `You must be an administrator to modify the status header`});
                return {success: false, message: `You must be an administrator to modify the status header`}
            }
            let body = JSON.parse(await new Promise((resolve, reject) => {
                let body = ``;
                request.on(`data`, (chunk) => { body += chunk; });
                request.on(`end`, () => { resolve(body); });
            }));
            let title = body.title
            loader.cache.header = title
            this.giveResponse(request, response, {statusCode: 200, message: `Header modified successfully - ${loader.cache.header}`});
            if (title != ``) {
                loader.modules.hooks.createOutput(this.name, `Status header modified successfully - ${loader.cache.header}`);
                loader.modules.hooks.createLog(this.name, `Status header modified successfully - ${loader.cache.header}`);
            } else {
                loader.cache.header = ``
                loader.modules.hooks.createOutput(this.name, `Cleared status header - Clear`);
                loader.modules.hooks.createLog(this.name, `Cleared status header - Clear`);
            }
            loader.modules.websocket.onCacheReady()
            return {success: true, message: `Status header modified successfully`}
        } catch (error) {
            loader.modules.hooks.createOutput(this.name, `Error occurred while modifying status header: ${error}`);
            loader.modules.hooks.createLog(this.name, `ERROR`, `Error occurred while modifying status header: ${error}`);
            this.giveResponse(request, response, {statusCode: 500, message: `Internal Server Error`});
            return {success: false, message: `Internal Server Error`}
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
                    loader.modules.hooks.createLog(this.name, `Attempted login with invalid credentials on username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Invalid username or password`});
                    return {success: false, message: `Invalid username or password`};
                }
                if (db[0].activated == 0) {
                    loader.modules.hooks.createOutput(this.name, `Attempted login with unactivated account on username ${username}`);
                    loader.modules.hooks.createLog(this.name, `Attempted login with unactivated account on username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Account not activated`});
                    return {success: false, message: `Account not activated`};
                }
                let generatedSession = loader.packages.crypto.randomBytes(32).toString(`hex`);
                response.cookie(`session`, generatedSession, { maxAge: null, sameSite: `lax`, secure: loader.cache.configurations.hosting.https, httpOnly: true });

                loader.modules.hooks.createOutput(this.name, `Login successful for username ${username}`);
                loader.modules.hooks.createLog(this.name, `INFO`, `Login successful for username ${username}`);
                loader.static.accounts.push({username: username, session: generatedSession, address: request.headers['cf-connecting-ip'] ? request.headers['cf-connecting-ip'] : request.connection.remoteAddress, userAgent: request.headers['user-agent']});
                this.giveResponse(request, response, {statusCode: 200, message: `Login successful`, session: generatedSession, role: db[0].role});
                return {success: true, message: `Login successful`, session: generatedSession, role: db[0].role};
            }
            if (action == 1) { // Logout (1)
                if (request.cookies.session == undefined || request.cookies.fallbackSession == undefined) {
                    response.clearCookie('session');
                    response.clearCookie('sessionFallback');
                    let account = loader.static.accounts.find(a => a.session == request.cookies.session || a.session == request.cookies.sessionFallback);
                    if (account) {
                        loader.static.accounts = loader.static.accounts.filter(a => a.session != request.cookies.session && a.session != request.cookies.sessionFallback ? true : false);
                    }
                    this.giveResponse(request, response, {statusCode: 401, message: `No session found`});
                    return {success: false, message: `No session found`};
                }
                let account = loader.static.accounts.find(a => a.session == request.cookies.session);
                loader.modules.hooks.createOutput(this.name, `${account.username} logged out successfully`);
                loader.modules.hooks.createLog(this.name, `INFO`, `${account.username} logged out successfully`);
                loader.static.accounts = loader.static.accounts.filter(a => a.session != request.cookies.session && a.session != request.cookies.sessionFallback ? true : false);
                response.clearCookie('session');
                response.clearCookie('sessionFallback');
                this.giveResponse(request, response, {statusCode: 200, message: `Logout successful`});
                return {success: true, message: `Logout successful`};
            }
            if (action == 2) { // Register (2)
                let username = body.username;
                let hash = loader.packages.crypto.createHash(`sha256`).update(body.password).digest(`base64`);
                let db = await loader.modules.database.runQuery(`SELECT * FROM accounts WHERE username = ?`, [username]);
                if (db.length > 0) {
                    loader.modules.hooks.createOutput(this.name, `Attempted registration with existing username ${username}`);
                    loader.modules.hooks.createLog(this.name, `Attempted registration with existing username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Username already exists`});
                    return {success: false, message: `Username already exists`};
                }
                if (username.length < 3 || username.length > 20) {
                    loader.modules.hooks.createOutput(this.name, `Attempted registration with invalid username ${username}`);
                    loader.modules.hooks.createLog(this.name, `Attempted registration with invalid username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Username must be between 3 and 20 characters`});
                    return {success: false, message: `Username must be between 3 and 20 characters`};
                }
                let createdAccount = await loader.modules.database.runQuery(`INSERT INTO accounts (username, hash, activated) VALUES (?, ?, ?)`, [username, hash, 0]);
                if (createdAccount == undefined) {
                    loader.modules.hooks.createOutput(this.name, `Failed to create account for username ${username}`);
                    loader.modules.hooks.createLog(this.name, `Failed to create account for username ${username}`);
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
                    loader.modules.hooks.createLog(this.name, `Attempted password reset with invalid credentials on username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Invalid username or password`});
                    return {success: false, message: `Invalid username or password`};
                }
                if (db[0].activated == 0) {
                    loader.modules.hooks.createOutput(this.name, `Attempted password reset with unactivated account on username ${username}`);
                    loader.modules.hooks.createLog(this.name, `Attempted password reset with unactivated account on username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Account not activated`});
                    return {success: false, message: `Account not activated`};
                }
                let updatedAccount = await loader.modules.database.runQuery(`UPDATE accounts SET hash = ? WHERE username = ?`, [newPassword, username]);
                if (updatedAccount == undefined) {
                    loader.modules.hooks.createOutput(this.name, `Failed to update password for username ${username}`);
                    loader.modules.hooks.createLog(this.name, `Failed to update password for username ${username}`);
                    this.giveResponse(request, response, {statusCode: 401, message: `Failed to update password`});
                    return {success: false, message: `Failed to update password`};
                }
                loader.modules.hooks.createOutput(this.name, `Password updated for username ${username}`);
                loader.modules.hooks.createLog(this.name, `INFO`, `Password updated for username ${username}`);
                this.giveResponse(request, response, {statusCode: 200, message: `Password updated successfully`});
                return {success: true, message: `Password updated successfully`};
            }
            if (action == 4) { // Login as Guest (4)
                if (!loader.cache.configurations.hosting.guests) {
                    loader.modules.hooks.createOutput(this.name, `Attempted guest login but guest login is disabled`);
                    loader.modules.hooks.createLog(this.name, `Attempted guest login but guest login is disabled`);
                    this.giveResponse(request, response, {statusCode: 403, message: `Guest login is disabled`});
                    return {success: false, message: `Guest login is disabled`};
                }
                let generatedSession = loader.packages.crypto.randomBytes(32).toString(`hex`);
                response.cookie(`session`, generatedSession, { maxAge: null, sameSite: `lax`, secure: loader.cache.configurations.hosting.https, httpOnly: true });
                let randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
                loader.static.accounts.push({ username: `Guest-${randomSuffix}`, session: generatedSession, address: request.headers['cf-connecting-ip'] ? request.headers['cf-connecting-ip'] : request.connection.remoteAddress, userAgent: request.headers['user-agent'], isGuest: true });
                loader.modules.hooks.createOutput(this.name, `Guest login successful`);
                loader.modules.hooks.createLog(this.name, `INFO`, `Guest login successful - ${`Guest-${randomSuffix}`}`);
                this.giveResponse(request, response, {statusCode: 200, message: `Guest login successful`, session: generatedSession, role: 0});
                return {success: true, message: `Guest login successful`, session: generatedSession, role: 0};
            }
            this.giveResponse(request, response, {statusCode: 400, message: `Invalid action`});
            return {success: false, message: `Invalid action`};
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
        response.end(JSON.stringify(data))
    }

    /**
      * @function hasCredentials
      * @description Checks if the user has valid credentials in the session.
      * 
      * @param {Object} request - The HTTP request object.
      * @param {Object} response - The HTTP response object.
      * @param {boolean} isAdministrator - Whether to check if the user is an administrator (default: false).
      */

    hasCredentials = function(request, response, isAdministrator=false) { 
        if (!loader.cache.configurations.hosting.portal) { return {success: true, message: `Userless Session`}}
        let cookie = request.cookies.session
        let fallback = request.cookies.sessionFallback
        let account = loader.static.accounts.find(a => a.session == cookie || a.session == fallback);
        if (account && !account.isGuest) {
            let getDB = loader.modules.database.runQuery(`SELECT * FROM accounts WHERE username = ?`, [account.username]);
            if (getDB.length == 0) { return {success: false, message: `Forbidden - User not found in database`} }
            if (isAdministrator && getDB[0].role != 1) { return {success: false, message: `Forbidden - User is not an administrator`} }
            return {success: true, message: `User ${account.username} has valid session`}
        } else if (account && account.isGuest) {
            if (isAdministrator) { return {success: false, message: `Forbidden - Guest user cannot be an administrator`} }
            return {success: true, message: `Guest user ${account.username} has valid session`}
        } else {
            return {success: false, message: `Forbidden - Invalid session`}
        }
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
        if (killSession) { response.clearCookie('session'); response.clearCookie('sessionFallback'); }
        response.sendFile(redirectUrl)
        return {success: true, message: `Redirected to ${redirectUrl}`}
    }
}


module.exports = Dashboard;