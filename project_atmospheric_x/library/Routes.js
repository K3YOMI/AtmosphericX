

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
        Hooks.PrintLog(`${this.name}`, `Successfully initialized ${this.name} module`);
        this.StartExpressJS(cache.configurations.hosting)
        this.CreateMiddleware()
        this.CreateRoutes()
        this.CreateWebsocket()
    }

    /**
      * @function StartExpressJS
      * @description Initializes and starts an Express.js HTTP/HTTPS server based on provided settings. 
      * Configures session handling with security options and sets up the server(s) to listen on the 
      * designated ports. Logs the server start status and stores the server instance in the cache.
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
            app = express()
            app.use(session({
                secret: cryptography.randomBytes(64).toString(`hex`),
                resave: false,
                saveUninitialized: true,
                cookie: {
                    maxAge: _settings.session_maxage, name: `session`,
                    sameSite: `strict`, secure: _settings.https
                },
                name: `atmosx-cookie`
            }));
            cache.ws = http.createServer(app).listen(_settings.http_port, () => {})
            if (_settings.https) { 
                let https_options = { key: fs.readFileSync(_settings.cert_path.key), cert: fs.readFileSync(_settings.cert_path.cert) };
                cache.ws = https.createServer(https_options, app).listen(_settings.https_port, () => {})
                Hooks.PrintLog(`${this.name}.SecureHttp`, `HTTPS server started on port ${_settings.https_port}`);
            }
            Hooks.PrintLog(`${this.name}.NotSecureHttp`, `HTTP server started on port ${_settings.http_port}`);
            Hooks.Log(`${this.name}.Express : Express server has started`);
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
      * A Promise that resolves once all middleware and routes have been initialized on the app.
      */

    async CreateMiddleware() {
        let parent = path.resolve(__dirname, `../`);
        app.use((req, res, next) => {
            if (cache.accounts[req.session.account] != undefined) {
                if (cache.accounts[req.session.account].useragent != req.headers['user-agent']) {
                    this._RedirectSession(req, res, `${parent}/www/portal/login.html`, true);
                    return;
                }
            }
            Hooks.GetLatestHostingStats(false, true);
            Hooks.Log(`${req.method} : ${req.url} : ${req.headers['user-agent']} : ${req.connection.remoteAddress} : ${req.headers.referer}`);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            next();
        });
        app.use(`/assets`, express.static(parent + '/www/assets'));
        app.use(`/obs`, express.static(parent + '/obs'));
        app.use(`/widgets`, express.static(parent + '/www/widgets'));
        app.get(`/`, async (req, res) => {
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
      * A Promise that resolves once all defined routes have been added to the Express app.
      */

    async CreateRoutes() {
        let parent = path.resolve(__dirname, `../`);
        app.get(`/widgets/alert_bar`, async (req, res) => { res.sendFile(`${parent}/www/widgets/alert_bar@widget/index.html`)});
        app.get('/widgets/mapbox', (req, res) => res.sendFile(`${parent}/www/widgets/mapbox@widget/index.html`));
        app.get('/widgets/notice', (req, res) => res.sendFile(`${parent}/www/widgets/notice@widget/index.html`));
        app.get('/widgets/table', (req, res) => res.sendFile(`${parent}/www/widgets/table@widget/index.html`));
        app.get('/widgets/light', (req, res) => res.sendFile(`${parent}/www/widgets/color_scheme_light@widget/index.html`));
        app.get('/widgets/dark', (req, res) => res.sendFile(`${parent}/www/widgets/color_scheme_dark@widget/index.html`));
        app.get('/widgets/description', (req, res) => res.sendFile(`${parent}/www/widgets/random_alert_description@widget/index.html`));
        app.get('/widgets/alert', (req, res) => res.sendFile(`${parent}/www/widgets/random_alert_title@widget/index.html`));
        app.get('/widgets/location', (req, res) => res.sendFile(`${parent}/www/widgets/random_alert_location@widget/index.html`));
        app.get('/widgets/expires', (req, res) => res.sendFile(`${parent}/www/widgets/random_alert_expires@widget/index.html`));
        app.get('/widgets/time', (req, res) => res.sendFile(`${parent}/www/widgets/time@widget/index.html`));
        app.get('/widgets/date', (req, res) => res.sendFile(`${parent}/www/widgets/date@widget/index.html`));
        app.get('/widgets/header', (req, res) => res.sendFile(`${parent}/www/widgets/header@widget/index.html`));
        app.get('/widgets/notification', (req, res) => res.sendFile(`${parent}/www/widgets/notification@widget/index.html`));
        app.get('/widgets/spc', (req, res) => res.sendFile(`${parent}/www/widgets/spc@widget/index.html`));
        app.get('/premade/stream', (req, res) => res.sendFile(`${parent}/www/widgets/@premade/stream_layout@widget/index.html`));
        app.get('/premade/portable', (req, res) => res.sendFile(`${parent}/www/widgets/@premade/portable_layout@widget/index.html`));
        app.get('/reset', (req, res) => res.sendFile(`${parent}/www/portal/reset.html`));
        app.get('/registration', (req, res) => res.sendFile(`${parent}/www/portal/registration.html`));
        app.get(`/api/events`, async (req, res) => { this._ReadFileForSession(req, res, JSON.stringify(cache.alerts, null, 4)) });
        app.get(`/api/all`, async (req, res) => { this._ReadFileForSession(req, res, JSON.stringify(await Hooks.CallClientConfigurations(), null, 4)) });

        app.post(`/api/login`, async (req, res) => { this._Credentials(req, res, 0) });
        app.post(`/api/logout`, async (req, res) => { this._Credentials(req, res, 1) });
        app.post(`/api/register`, async (req, res) => { this._Credentials(req, res, 2) });
        app.post(`/api/reset`, async (req, res) => { this._Credentials(req, res, 3) });
        app.post(`/api/manual`, async (req, res) => { Hooks.CreateManualAlert(req, res) });
        app.post(`/api/notification`, async (req, res) => { Hooks.CreateNotification(req, res) });
        app.post(`/api/status`, async (req, res) => { Hooks.CreateStatusMarker(req, res) });
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
            if (!cache.ws_clients || cache.ws_clients.length === 0) { resolve(`No clients to sync`); return; }
            await Hooks._GetRandomAlert()
            let cfg = await Hooks.CallClientConfigurations(); 
            cfg = JSON.stringify(cfg)
            for (let i = 0; i < cache.ws_clients.length; i++) {
                let client = cache.ws_clients[i];
                if (client.readyState === websocket.OPEN) {
                    let last_message = cache.ws_client_ratelimit.find((entry) => entry.ws === client);
                    if (_timeout == true && last_message && (Date.now() - last_message.time) < cache.configurations.project_settings.websocket_timeout * 1000) { continue; }
                    cache.ws_client_ratelimit = cache.ws_client_ratelimit.filter((entry) => entry.ws !== client);
                    cache.ws_client_ratelimit.push({ ws: client, time: Date.now() });
                    client.send(cfg);
                }
            }  
            cfg = undefined
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
        return new Promise((resolve, reject) => {
            const wss = new websocket.Server({ server: cache.ws });
            cache.ws_clients = [];
            cache.ws_client_ratelimit = [];
            wss.on(`connection`, async (ws) => {
                if (!cache.ws_clients.includes(ws)) { cache.ws_clients.push(ws); }
                ws.on('close', () => { cache.ws_clients = cache.ws_clients.filter((client) => client !== ws) });
                cache.ws_client_ratelimit.push({ws, time: Date.now()});
                await ws.send(JSON.stringify(await Hooks.CallClientConfigurations(), null, 4));
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
                let parent = path.resolve(__dirname, `../`)
                let body = JSON.parse(await new Promise((resolve, reject) => {
                    let body = ``
                    _req.on(`data`, (data) => {body += data})
                    _req.on(`end`, () => {resolve(body)})
                }))
                if (_type == 0) {
                    let username = body.username;
                    let hash = cryptography.createHash('sha256').update(body.password).digest('base64')
                    let is_valid = await Database.SendDatabaseQuery(`SELECT * FROM accounts WHERE username = ? AND hash = ?`, [username, hash])
                    if (is_valid.length == 0) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Invalid username or password.`})
                        Hooks.Log(`${this.name}.Account : Failed login attempt for ${username} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                        Hooks.PrintLog(`${this.name}.Account`, `Failed login attempt for ${username}`)
                        return
                    }
                    if (is_valid[0].activated == 0) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Account not activated. Please contact project administrator to activate this account` });
                        return
                    }
                    _req.session.account = `atmosx-cookie-${cryptography.randomBytes(64).toString('hex')}`
                    _req.session.save()
                    this._GiveResponseToSession(_req, _res, {code: 200, message: `Welcome back ${username}!`})
                    Hooks.Log(`${this.name}.Account : ${username} logged in (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                    Hooks.PrintLog(`${this.name}.Account`, `${username} has logged in with the address ${_req.connection.remoteAddress}`)
                    cache.accounts[_req.session.account] = {username: username, useragent: _req.headers['user-agent'], ip: _req.connection.remoteAddress}
                }
                if (_type == 1) {
                    Hooks.Log(`${this.name}.Account : ${cache.accounts[_req.session.account].username} logged out (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                    Hooks.PrintLog(`${this.name}.Account`, `${cache.accounts[_req.session.account].username} logged out`)
                    cache.accounts[_req.session.account] = undefined
                    if (!await this._DoesRequestHaveSession(_req)) {this._GiveResponseToSession(_req, _res, {code: 403, message: `You are not logged in.`}); return;}
                    this._RedirectSession(_req, _res, `${parent}/www/portal/login.html`, true)
                }
                if (_type == 2) {
                    let username = body.username
                    let hash = cryptography.createHash('sha256').update(body.password).digest('base64')
                    let is_valid = await Database.SendDatabaseQuery(`SELECT * FROM accounts WHERE username = ?`, [username])
                    if (is_valid.length > 0) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Username already exists.`})
                        Hooks.Log(`${this.name}.Account : Failed registration attempt for ${username} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                        Hooks.PrintLog(`${this.name}.Account`, `Failed registration attempt for ${username}`)
                        return
                    }
                    if (username.length < 3 || username.length > 20) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Username must be between 3 and 20 characters.`})
                        Hooks.Log(`${this.name}.Account : Failed registration attempt for ${username} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                        Hooks.PrintLog(`${this.name}.Account`, `Failed registration attempt for ${username}`)
                        return
                    }
                    let create = await Database.SendDatabaseQuery(`INSERT INTO accounts (username, hash, activated) VALUES (?, ?, ?)`, [username, hash, 0])
                    if (create == undefined) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Failed to create account.`})
                        Hooks.Log(`${this.name}.Account : Failed registration attempt for ${username} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                        Hooks.PrintLog(`${this.name}.Account`, `Failed registration attempt for ${username}`)
                        return
                    }
                    Hooks.Log(`${this.name}.Account : ${username} registered (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                    Hooks.PrintLog(`${this.name}.Account`, `New account created: ${username}. To enable this account, please run /active <username> <true/false>`)
                    this._GiveResponseToSession(_req, _res, {code: 200, message: `Account created. Please contact project administrator to activate this account.`})
                }
                if (_type == 3) {
                    let username = body.username
                    let hash = cryptography.createHash('sha256').update(body.password).digest('base64')
                    let newhash = cryptography.createHash('sha256').update(body.new_password).digest('base64')

                    let is_valid = await Database.SendDatabaseQuery(`SELECT * FROM accounts WHERE username = ? AND hash = ?`, [username, hash])
                    if (is_valid.length == 0) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Username and password do not match.`})
                        Hooks.Log(`${this.name}.Account : Failed password reset attempt for ${username} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                        Hooks.PrintLog(`${this.name}.Account`, `Failed password reset attempt for ${username}`)
                        return
                    }
                    let account = await Database.SendDatabaseQuery(`UPDATE accounts SET hash = ? WHERE username = ?`, [newhash, username])
                    if (account == undefined) {
                        this._GiveResponseToSession(_req, _res, {code: 403, message: `Failed to reset password.`})
                        Hooks.Log(`${this.name}.Account : Failed password reset attempt for ${username} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                        Hooks.PrintLog(`${this.name}.Account`, `Failed password reset attempt for ${username}`)
                        return
                    }
                    this._GiveResponseToSession(_req, _res, {code: 200, message: `Password reset successfully.`})
                    Hooks.Log(`${this.name}.Account : ${username} password reset (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`)
                    Hooks.PrintLog(`${this.name}.Account`, `${username} password reset`)
     
                    return
                }
            } catch (error) {
                Hooks.PrintLog(`${this.name}.Account`, `Failed to process request - ${error}`)
                Hooks.Log(`${this.name}.Account : Failed to process request - ${error}`)
                this._GiveResponseToSession(_req, _res, {code: 500, message: `Internal Server Error - Failed to process request.`})
                resolve(`Internal Server Error - Failed to process request.`)
            }
        })
    }

}


module.exports = Routes;