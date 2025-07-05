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
        loader.static.express.get(`/`, (request, response) => {
            let hasSession = loader.modules.dashboard.hasCredentials(request, response)
            if (!hasSession.success) { return loader.modules.dashboard.redirectSession(request, response, `${parentDirectory}/www/portal/login.html`, true); }
            loader.modules.dashboard.redirectSession(request, response, `${parentDirectory}/www/dashboard/index.html`, false)
        })
        loader.static.express.get(`/settings`, (request, response) => {
            let hasSession = loader.modules.dashboard.hasCredentials(request, response, true)
            if (!hasSession.success) { return loader.modules.dashboard.giveResponse(request, response, {statusCode: 401, message: `You do not have permission to access this page, this requires administrator privileges.`}) }
            loader.modules.dashboard.redirectSession(request, response, `${parentDirectory}/www/dashboard/settings.html`, false)
        })
        loader.static.express.get(`/configurations`, (request, response) => {
            let hasSession = loader.modules.dashboard.hasCredentials(request, response, true)
            if (!hasSession.success) { return loader.modules.dashboard.giveResponse(request, response, {statusCode: 401, message: `You do not have permission to access this page, this requires administrator privileges.`}) }
            loader.modules.dashboard.giveResponse(request, response, {statusCode: 200, message: loader.cache.configurations})
        })
        loader.static.express.post(`/set-configurations`, async (request, response) => {
            loader.modules.dashboard.processConfigurations(request, response)
        })
        loader.static.express.get(`/widgets/alert_bar`, (request, response) => {response.sendFile(`${parentDirectory}/www/widgets/alert_bar@widget/index.html`)})
        loader.static.express.get('/widgets/mapbox', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/mapbox@widget/index.html`));
        loader.static.express.get('/widgets/notice', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/notice@widget/index.html`));
        loader.static.express.get('/widgets/table', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/table@widget/index.html`));
        loader.static.express.get('/widgets/light', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/color_scheme_light@widget/index.html`));
        loader.static.express.get('/widgets/dark', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/color_scheme_dark@widget/index.html`));
        loader.static.express.get('/widgets/description', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/random_alert_description@widget/index.html`));
        loader.static.express.get('/widgets/alert', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/random_alert_title@widget/index.html`));
        loader.static.express.get('/widgets/location', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/random_alert_location@widget/index.html`));
        loader.static.express.get('/widgets/gps', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/gps@widget/index.html`));
        loader.static.express.get('/widgets/chatbot', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/chatbot@widget/index.html`));
        loader.static.express.get('/widgets/expires', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/random_alert_expires@widget/index.html`));
        loader.static.express.get('/widgets/time', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/time@widget/index.html`));
        loader.static.express.get('/widgets/date', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/date@widget/index.html`));
        loader.static.express.get('/widgets/header', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/header@widget/index.html`));
        loader.static.express.get('/widgets/watchdog', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/watchdog@widget/index.html`));
        loader.static.express.get('/widgets/notification', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/notification@widget/index.html`));
        loader.static.express.get('/widgets/spc', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/spc@widget/index.html`));
        loader.static.express.get('/premade/stream', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/@premade/stream_layout@widget/index.html`));
        loader.static.express.get('/premade/portable', (request, response) => response.sendFile(`${parentDirectory}/www/widgets/@premade/portable_layout@widget/index.html`));
        loader.static.express.get('/reset', (request, response) => response.sendFile(`${parentDirectory}/www/portal/reset.html`));
        loader.static.express.get('/registration', (request, response) => response.sendFile(`${parentDirectory}/www/portal/registration.html`));
        loader.static.express.post(`/api/login`, async (request, response) => { loader.modules.dashboard.processCredentials(request, response, 0) });
        loader.static.express.post(`/api/login-guest`, async (request, response) => { loader.modules.dashboard.processCredentials(request, response, 4) });
        loader.static.express.post(`/api/chatbot`, async (request, response) => { loader.modules.dashboard.chatBot(request, response) });

        loader.static.express.post(`/api/logout`, async (request, response) => { loader.modules.dashboard.processCredentials(request, response, 1) });
        loader.static.express.post(`/api/register`, async (request, response) => { loader.modules.dashboard.processCredentials(request, response, 2) });
        loader.static.express.post(`/api/reset`, async (request, response) => { loader.modules.dashboard.processCredentials(request, response, 3) });
        loader.static.express.post(`/api/manual`, async (request, response) => { loader.modules.dashboard.createManualAlert(request, response) });
        loader.static.express.post(`/api/notification`, async (request, response) => { loader.modules.dashboard.createNotification(request, response) });
        loader.static.express.post(`/api/status`, async (request, response) => { loader.modules.dashboard.createStatusHeader(request, response) });
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
            loader.modules.hooks.createLog(this.name, `${request.method} : ${request.url} : ${request.headers['user-agent']} : ${request.headers['cf-connecting-ip'] ? request.headers['cf-connecting-ip'] : request.connection.remoteAddress} : ${request.headers.referer}`)
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.setHeader('Access-Control-Allow-Credentials', 'true');
            response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
            response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            response.setHeader('Pragma', 'no-cache');
            response.setHeader('Expires', '0');
            response.setHeader('Surrogate-Control', 'no-store');
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
        loader.static.express = loader.packages.express()
        loader.static.express.use(loader.packages.cookieParser())
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