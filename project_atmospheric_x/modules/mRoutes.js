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
        let parentDirectory = loader.packages.path.resolve(__dirname, `../../storage`);
        let widgets = [
            `alerts`, `mapbox`, `table`, `colors`, `random`, `clock`, `location`, 
            `chatbot`, `header`, `watchdog`, `notification`, `spc`, `portable`
        ];
        loader.static.express.get(`/`, (req, res) => {
            let session = loader.modules.dashboard.hasCredentials(req, res);
            session.success 
                ? loader.modules.dashboard.redirectSession(req, res, `${parentDirectory}/www/dashboard/index.html`, false) 
                : loader.modules.dashboard.redirectSession(req, res, `${parentDirectory}/www/portal/login.html`, true);
        });
        loader.static.express.get(`/settings`, (req, res) => {
            let session = loader.modules.dashboard.hasCredentials(req, res, true);
            session.success 
                ? loader.modules.dashboard.redirectSession(req, res, `${parentDirectory}/www/dashboard/settings.html`, false) 
                : loader.modules.dashboard.giveResponse(req, res, { statusCode: 401, message: `Administrator privileges required.` });
        });
        loader.static.express.get(`/configurations`, (req, res) => {
            let session = loader.modules.dashboard.hasCredentials(req, res, true);
            session.success 
                ? loader.modules.dashboard.giveResponse(req, res, { statusCode: 200, message: loader.cache.configurations }) 
                : loader.modules.dashboard.giveResponse(req, res, { statusCode: 401, message: `Administrator privileges required.` });
        });
        loader.static.express.get(`/reset`, (req, res) => res.sendFile(`${parentDirectory}/www/portal/reset.html`));
        loader.static.express.get(`/registration`, (req, res) => res.sendFile(`${parentDirectory}/www/portal/registration.html`));

        // Widgets
        widgets.forEach(widget => loader.static.express.get(`/widgets/${widget}`, (req, res) => res.sendFile(`${parentDirectory}/www/widgets/${widget}@widget/index.html`)));

        // Placefiles
        loader.static.express.get(`/placefiles/alerts`, (req, res) => loader.modules.dashboard.sendCacheData(req, res, loader.cache.placefiles.alerts));
        loader.static.express.get(`/placefiles/gps`, (req, res) => loader.modules.dashboard.sendCacheData(req, res, loader.cache.placefiles.gps));

        // API Endpoints
        loader.static.express.post(`/api/login`, (req, res) => loader.modules.dashboard.processCredentials(req, res, 0));
        loader.static.express.post(`/api/login-guest`, (req, res) => loader.modules.dashboard.processCredentials(req, res, 4));
        loader.static.express.post(`/api/chatbot`, (req, res) => loader.modules.dashboard.chatBot(req, res));
        loader.static.express.post(`/api/logout`, (req, res) => loader.modules.dashboard.processCredentials(req, res, 1));
        loader.static.express.post(`/api/register`, (req, res) => loader.modules.dashboard.processCredentials(req, res, 2));
        loader.static.express.post(`/api/reset`, (req, res) => loader.modules.dashboard.processCredentials(req, res, 3));
        loader.static.express.post(`/api/manual`, (req, res) => loader.modules.dashboard.createManualAlert(req, res));
        loader.static.express.post(`/api/notification`, (req, res) => loader.modules.dashboard.createNotification(req, res));
        loader.static.express.post(`/api/status`, (req, res) => loader.modules.dashboard.createStatusHeader(req, res));
        loader.static.express.post(`/set-configurations`, async (req, res) => loader.modules.dashboard.processConfigurations(req, res));
    }


    /**
     * @function createMiddleware
     * @description Creates middleware for the Express server to handle static file serving and logging.
     * It sets up the parent directory for static files and logs the request details.
     * 
     */

    createMiddleware = function() {
        let parentDirectory = loader.packages.path.resolve(__dirname, `../../storage/`);
        loader.static.express.use((req, res, next) => {
            loader.modules.hooks.createLog(this.name, `${req.method} : ${req.url} : ${req.headers['user-agent']} : ${req.headers['cf-connecting-ip'] || req.connection.remoteAddress} : ${req.headers.referer}`);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Surrogate-Control', 'no-store');
            next();
        });
        loader.static.express.use(`/assets`, loader.packages.express.static(`${parentDirectory}/www/assets`));
        loader.static.express.use(`/widgets`, loader.packages.express.static(`${parentDirectory}/www/widgets`));
        loader.static.express.use(`/obs`, loader.packages.express.static(`${parentDirectory}/obs-themes`));
        return { status: true, message: `Middleware created` };
    }

    /**
      * @function createExpressServer
      * @description Creates an Express server and sets up session management using express-session. It also creates an HTTP or HTTPS server based on the configuration.
      */

    createExpressServer = function() {
        let express = loader.static.express = loader.packages.express();
        express.use(loader.packages.cookieParser());
        express.set('trust proxy', 1);
        let isHttps = loader.cache.configurations.hosting.https;
        let port = isHttps ? loader.cache.configurations.hosting.https_port : loader.cache.configurations.hosting.http_port;
        if (isHttps) {
            let httpsOptions = {
                key: loader.packages.fs.readFileSync(loader.cache.configurations.hosting.cert_path.key),
                cert: loader.packages.fs.readFileSync(loader.cache.configurations.hosting.cert_path.cert),
            };
            loader.static.websocket = loader.packages.https.createServer(httpsOptions, express).listen(port, () => {});
            loader.modules.hooks.createOutput(this.name, `HTTPS server started on port ${port}`);
            loader.modules.hooks.createLog(this.name, `HTTPS server started on port ${port}`);
        } else {
            loader.static.websocket = loader.packages.http.createServer(express).listen(port, () => {});
            loader.modules.hooks.createOutput(this.name, `HTTP server started on port ${port}`);
            loader.modules.hooks.createLog(this.name, `HTTP server started on port ${port}`);
        }
        if (!loader.cache.configurations.hosting.portal) {
            loader.modules.hooks.createOutput(this.name, 
                `\n\n[SECURITY] THE PORTAL LOGIN PAGE IS DISABLED,\n\t   THIS IS NOT RECOMMENDED FOR PRODUCTION USE AS EVERYONE CAN ACCESS THE DASHBOARD WITHOUT AUTHENTICATION.\n\t   YOU CAN SIMPLY DO IP WHITELISTING THROUGH A WEB SERVER OR FIREWALL IF YOU WISH TO KEEP THIS OFF.\n\t   IF YOU WISH TO ENABLE THE PORTAL LOGIN PAGE, PLEASE SET THE PORTAL CONFIG TO TRUE IN THE CONFIGURATION FILE.\n\n`
            );
        }
        return { status: true, message: `Express server created` };
    }
}


module.exports = Routes;