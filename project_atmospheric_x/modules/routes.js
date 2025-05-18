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
    Version: 7.0.5                             
*/


let loader = require(`../loader.js`)


class Routes { 
    constructor() {
        this.name = `Routes`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
        this.createExpressServer()
        this.createMiddleware()
        this.createRoutes()
    }

    /**
      * @function createRoutes
      * @description Creates routes for the Express server to handle various requests. It sets up routes for static files, login, logout, registration, reset, and other API endpoints.
      * It also handles session management and redirects based on user authentication status.
      */

    createRoutes = function() {
        let parentDirectory = loader.packages.path.resolve(__dirname, `../../storage`)
        loader.static.express.get(`/`, (req, res) => {
            let hasSession = loader.modules.dashboard.hasCredentials(req, res)
            if (!hasSession.success) { return loader.modules.dashboard.redirectSession(req, res, `${parentDirectory}/www/portal/login.html`, true); }
            loader.modules.dashboard.redirectSession(req, res, `${parentDirectory}/www/dashboard/index.html`, false)
        })
        loader.static.express.get(`/settings`, (req, res) => {
            let hasSession = loader.modules.dashboard.hasCredentials(req, res)
            if (!hasSession.success) { return loader.modules.dashboard.redirectSession(req, res, `${parentDirectory}/www/portal/login.html`, true); }
            loader.modules.dashboard.redirectSession(req, res, `${parentDirectory}/www/dashboard/settings.html`, false)
        })
        loader.static.express.get(`/widgets/alert_bar_old`, (request, response) => {response.sendFile(`${parentDirectory}/www/widgets/alert_bar@widget/index.html`)})
        loader.static.express.get(`/widgets/alert_bar`, (request, response) => {response.sendFile(`${parentDirectory}/www/widgets/alert_barv2@widget/index.html`)})
        loader.static.express.get('/widgets/mapbox', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/mapbox@widget/index.html`));
        loader.static.express.get('/widgets/notice', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/notice@widget/index.html`));
        loader.static.express.get('/widgets/table', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/table@widget/index.html`));
        loader.static.express.get('/widgets/light', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/color_scheme_light@widget/index.html`));
        loader.static.express.get('/widgets/dark', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/color_scheme_dark@widget/index.html`));
        loader.static.express.get('/widgets/description', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/random_alert_description@widget/index.html`));
        loader.static.express.get('/widgets/alert', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/random_alert_title@widget/index.html`));
        loader.static.express.get('/widgets/location', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/random_alert_location@widget/index.html`));
        loader.static.express.get('/widgets/expires', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/random_alert_expires@widget/index.html`));
        loader.static.express.get('/widgets/time', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/time@widget/index.html`));
        loader.static.express.get('/widgets/date', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/date@widget/index.html`));
        loader.static.express.get('/widgets/header', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/header@widget/index.html`));
        loader.static.express.get('/widgets/watchdog', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/watchdog@widget/index.html`));
        loader.static.express.get('/widgets/notification', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/notification@widget/index.html`));
        loader.static.express.get('/widgets/spc', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/spc@widget/index.html`));
        loader.static.express.get('/premade/stream', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/@premade/stream_layout@widget/index.html`));
        loader.static.express.get('/premade/portable', (req, res) => res.sendFile(`${parentDirectory}/www/widgets/@premade/portable_layout@widget/index.html`));
        loader.static.express.get('/reset', (req, res) => res.sendFile(`${parentDirectory}/www/portal/reset.html`));
        loader.static.express.get('/registration', (req, res) => res.sendFile(`${parentDirectory}/www/portal/registration.html`));
        loader.static.express.post(`/api/login`, async (req, res) => { loader.modules.dashboard.processCredentials(req, res, 0) });
        loader.static.express.post(`/api/logout`, async (req, res) => { loader.modules.dashboard.processCredentials(req, res, 1) });
        loader.static.express.post(`/api/register`, async (req, res) => { loader.modules.dashboard.processCredentials(req, res, 2) });
        loader.static.express.post(`/api/reset`, async (req, res) => { loader.modules.dashboard.processCredentials(req, res, 3) });
        loader.static.express.post(`/api/manual`, async (req, res) => { loader.modules.dashboard.createManualAlert(req, res) });
        loader.static.express.post(`/api/notification`, async (req, res) => { loader.modules.dashboard.createNotification(req, res) });
        loader.static.express.post(`/api/status`, async (req, res) => { loader.modules.dashboard.createStatusHeader(req, res) });
    }


    /**
     * @function createMiddleware
     * @description Creates middleware for the Express server to handle static file serving and logging.
     * It sets up the parent directory for static files and logs the request details.
     * 
     */

    createMiddleware = function() {
        let parentDirectory = loader.packages.path.resolve(__dirname, `../../storage/`)
        loader.static.express.use((request, response, next) => {
            loader.modules.hooks.createLog(this.name, `${request.method} : ${request.url} : ${request.headers['user-agent']} : ${request.connection.remoteAddress} : ${request.headers.referer}`)
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.setHeader('Access-Control-Allow-Credentials', 'true');
            response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
            next()
        })
        loader.static.express.use(`/assets`, loader.packages.express.static(parentDirectory + `/www/assets`))
        loader.static.express.use(`/widgets`, loader.packages.express.static(parentDirectory + `/www/widgets`))
        loader.static.express.use(`/obs`, loader.packages.express.static(parentDirectory + `/obs-themes`))
        return {status: true, message: `Middleware created`}
    }

    /**
      * @function createExpressServer
      * @description Creates an Express server and sets up session management using express-session. It also creates an HTTP or HTTPS server based on the configuration.
      */

    createExpressServer = function() { 
        let randomSecret = loader.packages.crypto.randomBytes(32).toString('hex')
        loader.static.express = loader.packages.express()
        loader.static.express.use(loader.packages.expressSession({
            secret: randomSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: null,
                name: `session`,
                sameSite: `strict`,
                httpOnly: true,
                secure: loader.cache.configurations.hosting.https
            },
            name: `atmosx-session`
        }))
        loader.static.express.set('trust proxy', 1)
        if (loader.cache.configurations.hosting.https) { 
            let httpsOptions = { 
                key: loader.packages.fs.readFileSync(loader.cache.configurations.hosting.cert_path.key),
                cert: loader.packages.fs.readFileSync(loader.cache.configurations.hosting.cert_path.cert),
            }
            loader.static.websocket = new loader.packages.https.createServer(httpsOptions, loader.static.express).listen(loader.cache.configurations.hosting.https_port, () => {})
            loader.modules.hooks.createOutput(this.name, `HTTPS server started on port ${loader.cache.configurations.hosting.https_port}`)
            loader.modules.hooks.createLog(this.name, `HTTPS server started on port ${loader.cache.configurations.hosting.https_port}`)
        } else {
            loader.static.websocket = new loader.packages.http.createServer(loader.static.express).listen(loader.cache.configurations.hosting.http_port, () => {})
            loader.modules.hooks.createOutput(this.name, `HTTP server started on port ${loader.cache.configurations.hosting.http_port}`)
            loader.modules.hooks.createLog(this.name, `HTTP server started on port ${loader.cache.configurations.hosting.http_port}`)
        }
        if (!loader.cache.configurations.hosting.portal) {
            loader.modules.hooks.createOutput(this.name, `\n\n[SECURITY] THE PORTAL LOGIN PAGE IS DISABLED,\n\t   THIS IS NOT RECOMMENDED FOR PRODUCTION USE AS EVERYONE CAN ACCESS THE DASHBOARD WITHOUT AUTHENTICATION.\n\t   YOU CAN SIMPLY DO IP WHITELISTING THROUGH A WEB SERVER OR FIREWALL IF YOU WISH TO KEEP THIS OFF.\n\t   IF YOU WISH TO ENABLE THE PORTAL LOGIN PAGE, PLEASE SET THE PORTAL CONFIG TO TRUE IN THE CONFIGURATION FILE.\n\n`)
        }
        return {status: true, message: `Express server created`}
    }
}


module.exports = Routes;