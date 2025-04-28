

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
*/

let LOAD = require(`../loader.js`)

/**
  * @class Routes
  * @description Handles the setup and management of the Express application, including middleware, 
  * routing, WebSocket creation, and managing session-related operations. 
  * Initializes configuration for development, testing, and production environments.
  * 
  * @constructor
  * Initializes the Routes class and performs the following:
  * - Logs successful initialization.
  * - Calls methods to start the Express server, set up middleware, configure routes, and 
  *   create WebSocket connections.
  */

class Routes { 
    constructor() {
        this.author = `k3yomi@GitHub`
        this.production = true
        this.name = `Routes`;
        LOAD.Library.Hooks.PrintLog(`${this.name}`, `Successfully initialized ${this.name} module`);
        this.StartExpressJS(LOAD.cache.configurations.hosting)
        this.CreateMiddleware()
        this.CreateRoutes()
        this.CreateWebsocket()
    }

    /**
      * @function StartExpressJS
      * @description Initializes and starts an Express.js HTTP/HTTPS server based on provided settings. 
      * Configures session handling with security options and sets up the server(s) to listen on the 
      * designated ports. Logs the server start status and stores the server instance in the LOAD.cache.
      * 
      * @async
      * @param {Object} _settings 
      * An object containing configuration for session behavior, HTTPS usage, certificate paths, 
      * and port numbers.
      * 
      * @returns {Promise<string>} 
      * A Promise that resolves with `"OK"` once the Express server(s) have been successfully started.
      */

    async StartExpressJS(_settings) {
        return new Promise((resolve, reject) => {
            LOAD.Static.Application = LOAD.Packages.Express()
            LOAD.Static.Application.use(LOAD.Packages.ExpressSession({
                secret: LOAD.Packages.Crypto.randomBytes(64).toString(`hex`),
                resave: false,
                saveUninitialized: true,
                cookie: {
                    maxAge: _settings.session_maxage, name: `session`,
                    sameSite: `strict`, secure: _settings.https
                },
                name: `atmosx-cookie`
            }));
            LOAD.cache.ws = LOAD.Packages.HttpLib.createServer(LOAD.Static.Application).listen(_settings.http_port, () => {})
            if (_settings.https) { 
                let https_options = { key: LOAD.Packages.FileSystem.readFileSync(_settings.cert_path.key), cert: LOAD.Packages.FileSystem.readFileSync(_settings.cert_path.cert) };
                LOAD.cache.ws = LOAD.Packages.HttpsLib.createServer(https_options, LOAD.Static.Application).listen(_settings.https_port, () => {})
                LOAD.Library.Hooks.PrintLog(`${this.name}.SecureHttp`, `HTTPS server started on port ${_settings.https_port}`);
            }
            LOAD.Library.Hooks.PrintLog(`${this.name}.NotSecureHttp`, `HTTP server started on port ${_settings.http_port}`);
            LOAD.Library.Hooks.Log(`${this.name}.Express : Express server has started`);
            resolve(`OK`)
        })
    }

    /**
      * @function CreateMiddleware
      * @description Sets up core middleware for the Express application. This includes session 
      * validation, user-agent checks, request logging, CORS headers, static asset routing, 
      * and root route redirection based on session state.
      * 
      * @async
      * @returns {Promise<void>} 
      * A Promise that resolves once all middleware and routes have been initialized on the LOAD.Static.Application.
      */

    async CreateMiddleware() {
        let parent = LOAD.Packages.PathSystem.resolve(__dirname, `../`);
        LOAD.Static.Application.use((req, res, next) => {
            if (LOAD.cache.accounts[req.session.account] != undefined) {
                if (LOAD.cache.accounts[req.session.account].useragent != req.headers['user-agent']) {
                    this._RedirectSession(req, res, `${parent}/www/portal/login.html`, true);
                    return;
                }
            }
            LOAD.Library.Hooks.GetLatestHostingStats(false, true);
            LOAD.Library.Hooks.Log(`${req.method} : ${req.url} : ${req.headers['user-agent']} : ${req.connection.remoteAddress} : ${req.headers.referer}`);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            next();
        });
        LOAD.Static.Application.use(`/assets`, LOAD.Packages.Express.static(parent + '/www/assets'));
        LOAD.Static.Application.use(`/obs`, LOAD.Packages.Express.static(parent + '/obs'));
        LOAD.Static.Application.use(`/widgets`, LOAD.Packages.Express.static(parent + '/www/widgets'));
        LOAD.Static.Application.get(`/`, async (req, res) => {
            if (!await this._DoesRequestHaveSession(req)) {
                return this._RedirectSession(req, res, `${parent}/www/portal/login.html`, true);
            }
            return this._RedirectSession(req, res, `${parent}/www/dashboard/index.html`);
        });
    }

    /**
      * @function CreateRoutes
      * @description Registers all HTTP GET and POST routes for the Express application. This includes 
      * routing for widget components, premade layouts, portal pages, and multiple API endpoints for 
      * session handling, alert data, and manual input actions.
      * 
      * @async
      * @returns {Promise<void>} 
      */

    async CreateRoutes() {
        let parent = LOAD.Packages.PathSystem.resolve(__dirname, `../`);
        LOAD.Static.Application.get(`/widgets/alert_bar`, async (req, res) => { res.sendFile(`${parent}/www/widgets/alert_bar@widget/index.html`)});
        LOAD.Static.Application.get('/widgets/mapbox', (req, res) => res.sendFile(`${parent}/www/widgets/mapbox@widget/index.html`));
        LOAD.Static.Application.get('/widgets/notice', (req, res) => res.sendFile(`${parent}/www/widgets/notice@widget/index.html`));
        LOAD.Static.Application.get('/widgets/table', (req, res) => res.sendFile(`${parent}/www/widgets/table@widget/index.html`));
        LOAD.Static.Application.get('/widgets/light', (req, res) => res.sendFile(`${parent}/www/widgets/color_scheme_light@widget/index.html`));
        LOAD.Static.Application.get('/widgets/dark', (req, res) => res.sendFile(`${parent}/www/widgets/color_scheme_dark@widget/index.html`));
        LOAD.Static.Application.get('/widgets/description', (req, res) => res.sendFile(`${parent}/www/widgets/random_alert_description@widget/index.html`));
        LOAD.Static.Application.get('/widgets/alert', (req, res) => res.sendFile(`${parent}/www/widgets/random_alert_title@widget/index.html`));
        LOAD.Static.Application.get('/widgets/location', (req, res) => res.sendFile(`${parent}/www/widgets/random_alert_location@widget/index.html`));
        LOAD.Static.Application.get('/widgets/expires', (req, res) => res.sendFile(`${parent}/www/widgets/random_alert_expires@widget/index.html`));
        LOAD.Static.Application.get('/widgets/time', (req, res) => res.sendFile(`${parent}/www/widgets/time@widget/index.html`));
        LOAD.Static.Application.get('/widgets/date', (req, res) => res.sendFile(`${parent}/www/widgets/date@widget/index.html`));
        LOAD.Static.Application.get('/widgets/header', (req, res) => res.sendFile(`${parent}/www/widgets/header@widget/index.html`));
        LOAD.Static.Application.get('/widgets/watchdog', (req, res) => res.sendFile(`${parent}/www/widgets/watchdog@widget/index.html`));
        LOAD.Static.Application.get('/widgets/notification', (req, res) => res.sendFile(`${parent}/www/widgets/notification@widget/index.html`));
        LOAD.Static.Application.get('/widgets/spc', (req, res) => res.sendFile(`${parent}/www/widgets/spc@widget/index.html`));
        LOAD.Static.Application.get('/premade/stream', (req, res) => res.sendFile(`${parent}/www/widgets/@premade/stream_layout@widget/index.html`));
        LOAD.Static.Application.get('/premade/portable', (req, res) => res.sendFile(`${parent}/www/widgets/@premade/portable_layout@widget/index.html`));
        LOAD.Static.Application.get('/reset', (req, res) => res.sendFile(`${parent}/www/portal/reset.html`));
        LOAD.Static.Application.get('/registration', (req, res) => res.sendFile(`${parent}/www/portal/registration.html`));
        LOAD.Static.Application.post(`/api/login`, async (req, res) => { this._Credentials(req, res, 0) });
        LOAD.Static.Application.post(`/api/logout`, async (req, res) => { this._Credentials(req, res, 1) });
        LOAD.Static.Application.post(`/api/register`, async (req, res) => { this._Credentials(req, res, 2) });
        LOAD.Static.Application.post(`/api/reset`, async (req, res) => { this._Credentials(req, res, 3) });
        LOAD.Static.Application.post(`/api/manual`, async (req, res) => { LOAD.Library.Hooks.CreateManualAlert(req, res) });
        LOAD.Static.Application.post(`/api/notification`, async (req, res) => { LOAD.Library.Hooks.CreateNotification(req, res) });
        LOAD.Static.Application.post(`/api/status`, async (req, res) => { LOAD.Library.Hooks.CreateStatusMarker(req, res) });
    }


    /**
     * @function CreateClient
     * @description Adds a WebSocket client to the cache and initializes a timer for it.
     * 
     * @param {WebSocket} _client - The WebSocket client to add.
     * @returns {Promise<string>}
     */

    async CreateClient(_client=undefined) {
        return new Promise(async (resolve, reject) => {
            if (_client == undefined) { resolve(`Client is undefined`); return; }
            if (LOAD.cache.clients == undefined) { LOAD.cache.clients = []; }
            if (LOAD.cache.clients_timer == undefined) { LOAD.cache.clients_timer = []; }
            LOAD.cache.clients.push(_client);
            LOAD.cache.clients_timer.push({client: _client, timer: new Date().getTime()});
            resolve(`Client created`);
        });
    }

    /**
     * @function RemoveClient
     * @description Removes a WebSocket client from the cache and clears its associated timer.
     * 
     * @param {WebSocket} _client - The WebSocket client to remove.
     * @returns {Promise<string>}
     */

    async RemoveClient(_client=undefined) {
        return new Promise(async (resolve) => {
            if (_client == undefined) { resolve(`Client is undefined`); return; }
            if (LOAD.cache.clients == undefined) { LOAD.cache.clients = []; }
            if (LOAD.cache.clients_timer == undefined) { LOAD.cache.clients_timer = []; }
            let index = LOAD.cache.clients.indexOf(_client);
            if (index > -1) {
                LOAD.cache.clients.splice(index, 1);
                LOAD.cache.clients_timer.splice(index, 1);
                resolve(`Client removed`);
            }
            resolve(`Client not found`);
        });
    }

    /**
     * @function ClientTimeoutCheck
     * @description Checks if a WebSocket client has timed out based on the last activity timestamp.
     * 
     * @param {WebSocket} _client - The WebSocket client to check for timeout.
     * @returns {Promise<boolean>}
     */

    async ClientTimeoutCheck(_client = undefined) {
        return new Promise(async (resolve) => {
            if (_client == undefined) { resolve(true); return; }
            let index = LOAD.cache.clients.indexOf(_client);
            if (index > -1) {
                let lastTimer = LOAD.cache.clients_timer[index].timer;
                let currentTime = new Date().getTime();
                if (currentTime - lastTimer < LOAD.cache.configurations.project_settings.websocket_timeout * 1000) {
                    resolve(true);
                } else {
                    LOAD.cache.clients_timer[index].timer = currentTime; 
                    resolve(false);
                }
            }
            resolve(true);
        });
    }

    /**
      * @function SyncClients
      * @description Sends the latest client configuration data to all connected WebSocket clients. 
      * Implements a basic rate-limiting mechanism to prevent flooding clients with updates more 
      * than once per second.
      * 
      * @async
      * @returns {Promise<string>} 
      * A Promise that resolves with a status message indicating the result of the sync operation.
      */

    async SyncClients(_timeout=true) {
        return new Promise(async (resolve) => {
            if (!LOAD.cache.clients || LOAD.cache.clients.length === 0) { resolve(`No clients to sync`); LOAD.Static.CD_A = null; return; }
            await LOAD.Library.Hooks._GetRandomAlert()
            LOAD.Static.CD_A = await LOAD.Library.Hooks.CallClientConfigurations(); 
            for (let i = 0; i < LOAD.cache.clients.length; i++) {
                if (LOAD.cache.clients[i].readyState == LOAD.Packages.Websocket.OPEN) {
                    let client = LOAD.cache.clients[i];
                    let timeout = await this.ClientTimeoutCheck(client);
                    if (timeout) { continue; }
                    for (let key in LOAD.Static.CD_A) {
                        client.send(JSON.stringify({value: LOAD.Static.CD_A[key], type: key, status: `fetch`}));
                    }
                    await client.send(JSON.stringify({value: [], type: ``, status: `update`}));
                } else {
                    await this.RemoveClient(LOAD.cache.clients[i]);
                }
            }
            LOAD.Static.CD_A = null;
            resolve(`Message synced to all clients`);
        });
    }

    /**
      * @function CreateWebsocket
      * @description Initializes a WebSocket server bound to the existing HTTP/HTTPS server. 
      * Manages client connections, stores active clients in cache, and sends initial configuration 
      * data upon connection.
      * 
      * @async
      * @returns {Promise<string>} 
      * A Promise that resolves with `"OK"` once the WebSocket server is set up and listening for connections.
      */

    async CreateWebsocket() {
        return new Promise(async (resolve, reject) => {
            let websocket = new LOAD.Packages.Websocket.Server({ server: LOAD.cache.ws });
            LOAD.cache.ws_clients = [];
            LOAD.cache.ws_client_ratelimit = [];
            websocket.on(`connection`, async (client) => {
                LOAD.Static.CD_A = await LOAD.Library.Hooks.CallClientConfigurations();
                await this.CreateClient(client);
                for (let key in LOAD.Static.CD_A) {
                    client.send(JSON.stringify({value: LOAD.Static.CD_A[key], type: key, status: `fetch`}));
                }
                await client.send(JSON.stringify({value: [], type: ``, status: `update`}));
            });
            resolve(`OK`);
        });
    }

    /**
      * @function _DoesRequestHaveSession
      * @description Checks whether the incoming request contains a valid session with an associated account.
      * 
      * @param {Object} _req 
      * The incoming HTTP request object to validate.
      * 
      * @returns {boolean} 
      * Returns `true` if a session with an account exists, otherwise `false`.
      */

    async _DoesRequestHaveSession(_req) {
        if (_req == undefined) { return false }
        if (_req.session.account != undefined) { return true }
        return false
    }

    /**
      * @function _RedirectSession
      * @description Handles session-based redirection for incoming requests. Optionally destroys 
      * the session before sending the user to the specified redirect path.
      * 
      * @param {Object} _req 
      * The incoming HTTP request object.
      * 
      * @param {Object} _res 
      * The HTTP response object used to send the redirect.
      * 
      * @param {string} _redirect 
      * Absolute path to the file to be served for the redirect.
      * 
      * @param {boolean} _kill 
      * Whether to destroy the session before redirecting.
      * 
      * @returns {void}
      */

    async _RedirectSession(_req, _res, _redirect, _kill) {
        if (_req == undefined || _res == undefined) { return }
        if (_kill) { _req.session.destroy() }
        _res.sendFile(`${_redirect}`);
    }

    /**
      * @function _GiveResponseToSession
      * @description Sends a JSON response to the client with a customizable status code and message.
      * Intended for use in session-aware routes.
      * 
      * @param {Object} _req 
      * The incoming HTTP request object.
      * 
      * @param {Object} _res 
      * The HTTP response object used to send the response.
      * 
      * @param {Object} [_metadata={code: 200, message: "OK"}] 
      * Optional metadata containing the HTTP status code and message string.
      * 
      * @returns {void}
      */

    async _GiveResponseToSession(_req, _res, _metadata={code: 200, message: `OK`}) {
        if (_req == undefined || _res == undefined) { return }
        _res.statusCode = _metadata.code;
        _res.setHeader('Content-Type', 'application/json');
        _res.end(JSON.stringify({ message: _metadata.message }));
    }

    /**
      * @function _ReadFileForSession
      * @description Sends a raw JSON payload as the response to the client. Typically used to serve 
      * preformatted data to authenticated sessions.
      * 
      * @param {Object} _req 
      * The incoming HTTP request object.
      * 
      * @param {Object} _res 
      * The HTTP response object used to deliver the payload.
      * 
      * @param {string} _pointer 
      * A JSON string to be sent as the response body.
      * 
      * @returns {void}
      */

    async _ReadFileForSession(_req, _res, _pointer) {
        _res.statusCode = 200
        _res.setHeader('Content-Type', 'application/json')
        _res.end(_pointer)
    }

    /**
      * @function _Credentials
      * @description Handles authentication and account management for login, logout, registration, and 
      * password reset operations. Validates user credentials, updates session data, and interacts with the 
      * accounts database stored in `../../storage/database.db`.
      * 
      * @param {Object} _req 
      * The incoming HTTP request object, containing session data and request body.
      * 
      * @param {Object} _res 
      * The HTTP response object used to send the appropriate response back to the client.
      * 
      * @param {number} _type 
      * Defines the type of operation to perform:
      * - `0`: Login
      * - `1`: Logout
      * - `2`: Register new account
      * - `3`: Reset account password
      * 
      * @returns {Promise<string>} 
      * A Promise that resolves once the operation is complete, either with success or an error message.
      */

    async _Credentials(_req, _res, _type) {
        return new Promise(async (resolve, reject) => {
            try { 
                if (_req == undefined || _res == undefined) { resolve(false); return; }
                let parent = LOAD.Packages.PathSystem.resolve(__dirname, `../`)
                let body = JSON.parse(await new Promise((resolve, reject) => {
                    let body = ``
                    _req.on(`data`, (data) => {body += data})
                    _req.on(`end`, () => {resolve(body)})
                }))
                if (_type == 0) {
                    let username = body.username;
                    let hash = LOAD.Packages.Crypto.createHash('sha256').update(body.password).digest('base64')
                    let is_valid = await LOAD.Library.Database.SendDatabaseQuery(`SELECT * FROM accounts WHERE username = ? AND hash = ?`, [username, hash])
                    if (is_valid.length == 0) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Invalid username or password.`})
                        LOAD.Library.Hooks.Log(`${this.name}.Account : Failed login attempt for ${username} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                        LOAD.Library.Hooks.PrintLog(`${this.name}.Account`, `Failed login attempt for ${username}`)
                        return
                    }
                    if (is_valid[0].activated == 0) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Account not activated. Please contact project administrator to activate this account` });
                        return
                    }
                    _req.session.account = `atmosx-cookie-${LOAD.Packages.Crypto.randomBytes(64).toString('hex')}`
                    _req.session.save()
                    this._GiveResponseToSession(_req, _res, {code: 200, message: `Welcome back ${username}!`})
                    LOAD.Library.Hooks.Log(`${this.name}.Account : ${username} logged in (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                    LOAD.Library.Hooks.PrintLog(`${this.name}.Account`, `${username} has logged in with the address ${_req.connection.remoteAddress}`)
                    LOAD.cache.accounts[_req.session.account] = {username: username, useragent: _req.headers['user-agent'], ip: _req.connection.remoteAddress}
                }
                if (_type == 1) {
                    LOAD.Library.Hooks.Log(`${this.name}.Account : ${LOAD.cache.accounts[_req.session.account].username} logged out (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                    LOAD.Library.Hooks.PrintLog(`${this.name}.Account`, `${LOAD.cache.accounts[_req.session.account].username} logged out`)
                    LOAD.cache.accounts[_req.session.account] = undefined
                    if (!await this._DoesRequestHaveSession(_req)) {this._GiveResponseToSession(_req, _res, {code: 403, message: `You are not logged in.`}); return;}
                    this._RedirectSession(_req, _res, `${parent}/www/portal/login.html`, true)
                }
                if (_type == 2) {
                    let username = body.username
                    let hash = LOAD.Packages.Crypto.createHash('sha256').update(body.password).digest('base64')
                    let is_valid = await LOAD.Library.Database.SendDatabaseQuery(`SELECT * FROM accounts WHERE username = ?`, [username])
                    if (is_valid.length > 0) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Username already exists.`})
                        LOAD.Library.Hooks.Log(`${this.name}.Account : Failed registration attempt for ${username} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                        LOAD.Library.Hooks.PrintLog(`${this.name}.Account`, `Failed registration attempt for ${username}`)
                        return
                    }
                    if (username.length < 3 || username.length > 20) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Username must be between 3 and 20 characters.`})
                        LOAD.Library.Hooks.Log(`${this.name}.Account : Failed registration attempt for ${username} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                        LOAD.Library.Hooks.PrintLog(`${this.name}.Account`, `Failed registration attempt for ${username}`)
                        return
                    }
                    let create = await LOAD.Library.Database.SendDatabaseQuery(`INSERT INTO accounts (username, hash, activated) VALUES (?, ?, ?)`, [username, hash, 0])
                    if (create == undefined) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Failed to create account.`})
                        LOAD.Library.Hooks.Log(`${this.name}.Account : Failed registration attempt for ${username} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                        LOAD.Library.Hooks.PrintLog(`${this.name}.Account`, `Failed registration attempt for ${username}`)
                        return
                    }
                    LOAD.Library.Hooks.Log(`${this.name}.Account : ${username} registered (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                    LOAD.Library.Hooks.PrintLog(`${this.name}.Account`, `New account created: ${username}. To enable this account, please run /active <username> <true/false>`)
                    this._GiveResponseToSession(_req, _res, {code: 200, message: `Account created. Please contact project administrator to activate this account.`})
                }
                if (_type == 3) {
                    let username = body.username
                    let hash = LOAD.Packages.Crypto.createHash('sha256').update(body.password).digest('base64')
                    let newhash = LOAD.Packages.Crypto.createHash('sha256').update(body.new_password).digest('base64')

                    let is_valid = await LOAD.Library.Database.SendDatabaseQuery(`SELECT * FROM accounts WHERE username = ? AND hash = ?`, [username, hash])
                    if (is_valid.length == 0) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Username and password do not match.`})
                        LOAD.Library.Hooks.Log(`${this.name}.Account : Failed password reset attempt for ${username} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                        LOAD.Library.Hooks.PrintLog(`${this.name}.Account`, `Failed password reset attempt for ${username}`)
                        return
                    }
                    let account = await LOAD.Library.Database.SendDatabaseQuery(`UPDATE accounts SET hash = ? WHERE username = ?`, [newhash, username])
                    if (account == undefined) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Failed to reset password.`})
                        LOAD.Library.Hooks.Log(`${this.name}.Account : Failed password reset attempt for ${username} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                        LOAD.Library.Hooks.PrintLog(`${this.name}.Account`, `Failed password reset attempt for ${username}`)
                        return
                    }
                    this._GiveResponseToSession(_req, _res, {code: 200, message: `Password reset successfully.`})
                    LOAD.Library.Hooks.Log(`${this.name}.Account : ${username} password reset (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                    LOAD.Library.Hooks.PrintLog(`${this.name}.Account`, `${username} password reset`)
     
                    return
                }
            } catch (error) {
                LOAD.Library.Hooks.PrintLog(`${this.name}.Account`, `Failed to process request - ${error}`)
                LOAD.Library.Hooks.Log(`${this.name}.Account : Failed to process request - ${error}`)
                this._GiveResponseToSession(_req, _res, {code: 500, message: `Internal Server Error - Failed to process request.`})
                resolve(`Internal Server Error - Failed to process request.`)
            }
        })
    }
}


module.exports = Routes;