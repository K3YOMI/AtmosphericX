
/*
                                            _               _     __   __
         /\  | |                           | |             (_)    \ \ / /
        /  \ | |_ _ __ ___   ___  ___ _ __ | |__   ___ _ __ _  ___ \ V / 
       / /\ \| __| '_ ` _ \ / _ \/ __| '_ \| '_ \ / _ \ '__| |/ __| > <  
      / ____ \ |_| | | | | | (_) \__ \ |_) | | | |  __/ |  | | (__ / . \ 
     /_/    \_\__|_| |_| |_|\___/|___/ .__/|_| |_|\___|_|  |_|\___/_/ \_\
                                     | |                                 
                                     |_|                                                                                                                
    
    Written by: k3yomi@GitHub                     Primary API: https://api.weather.gov
    Version: 6.0.0                              
*/

cache = {}
cache.version = `5.0.1`
cache.author = `k3yomi@GitHub`
cache.alerts = {
    active: [], warnings: [],
    watches: [], manual: [],
    broadcasts: [], danger: [],
    reports: [],
    status: undefined
}
cache.configurations = undefined;
cache.requesting = false;

express = require('express') // Web Framework
session = require('express-session') // Session Management
http = require('http') // HTTP Server 
https = require('https') // HTTPS Server
cryptography = require('crypto'); // Cryptography (Hashing, Encryption, etc)
fs = require('fs')  // File System
path = require('path') // Path
axios = require('axios') // Axios (Mostly for API Requests)

core = new (require('./library/core.js')); 
api = new (require('./library/api.js'));
ext = new (require('./library/external.js'));
web = new (require('./library/web.js'));


core.functions.init()
api.functions.init()
ext.functions.init()
web.functions.init()
cache.configurations = core.functions.config(`./configurations.json`)
app = express() 
app.use(session({
    secret: cryptography.randomBytes(64).toString('hex'), // Replaced with a random bytes. Why set it to a static when you can randomize it each time?!
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: cache.configurations['hosting:settings']['cookie:maxage'],
        name: 'session',
        sameSite: 'strict',
        secure: cache.configurations['hosting:settings']['https:enabled']
    },
    name: 'AtmosphericX-Cookie'
}))

/* Generic Middleware */
app.use(`/assets`, express.static(__dirname + '/www/assets'));

/* Stream Routes (PUBLIC) */
app.get(`/`, (req, res) => { if (req.session.account != undefined) {
    res.sendFile(__dirname + '/www/dashboard/index.html'); return;} 
    res.sendFile(__dirname + '/www/portal/login.html')
    req.session.destroy()
})
app.get(`/stream`, (req, res) => {res.sendFile(__dirname + '/www/stream/stream.html')})
app.get(`/portable`, (req, res) => {res.sendFile(__dirname + '/www/stream/portable.html')})
app.get(`/warnings`, (req, res) => {res.sendFile(__dirname + '/www/stream/warnings.html')})
app.get(`/map`, (req, res) => {res.sendFile(__dirname + '/www/stream/geolocation.html')})
app.get(`/reset`, (req, res) => {res.sendFile(__dirname + '/www/portal/reset.html')})
app.get(`/registration`, (req, res) => {res.sendFile(__dirname + '/www/portal/registration.html')})

/* Dashboard Routes (PRIVATE) */
app.get(`/dashboard`, (req, res) => {web.functions.dashboard(req, res)})

/* API Routes */
app.post(`/api/login`, (req, res) => {api.functions.login(req, res)})
app.post(`/api/logout`, (req, res) => {api.functions.logout(req, res)})
app.post(`/api/register`, (req, res) => {api.functions.register(req, res)})
app.post(`/api/reset`, (req, res) => {api.functions.password_reset(req, res)})
app.post(`/api/notification`, (req, res) => {api.functions.notification_activation(req, res)})
app.post(`/api/manual`, (req, res) => {api.functions.manual_activation(req, res)})
app.post(`/api/status`, (req, res) => {api.functions.status_activation(req, res)})
app.post(`/api/forcerequest`, (req, res) => {api.functions.request_latest(req, res)})

app.get(`/api/alerts`, (req, res) => {api.functions.request_data(req, res, JSON.stringify(cache.alerts.active))})
app.get(`/api/reports`, (req, res) => {api.functions.request_data(req, res, JSON.stringify(cache.alerts.reports))})
app.get(`/api/manual`, (req, res) => {api.functions.request_data(req, res, JSON.stringify(cache.alerts.manual))})
app.get(`/api/warnings`, (req, res) => {api.functions.request_data(req, res, JSON.stringify(cache.alerts.warnings))})
app.get(`/api/watches`, (req, res) => {api.functions.request_data(req, res, JSON.stringify(cache.alerts.watches))})
app.get(`/api/notifications`, (req, res) => {api.functions.request_data(req, res, JSON.stringify(cache.alerts.broadcasts))})
app.get(`/api/states`, (req, res) => {api.functions.request_data(req, res, JSON.stringify(cache.configurations['application:states']))})
app.get(`/api/status`, (req, res) => {api.functions.request_data(req, res, cache.alerts.status)})
app.get(`/api/configurations`, (req, res) => {api.functions.request_configurations(req, res)})

return new Promise(async (resolve, reject) => {
    let hosting = cache.configurations['hosting:settings']
    if (hosting['https:enabled']) { 
        let ssl = { key: fs.readFileSync(hosting['ssl:path']['ssl:key']), cert: fs.readFileSync(hosting['ssl:path']['ssl:cert']) };
        httpsServer = https.createServer(ssl, app)
        httpsServer.listen(hosting['https:port'], () => {})
    }
    const httpServer = http.createServer(app)
    httpServer.listen(cache.configurations['hosting:settings']['http:port'], () => {})
    
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: AtmosphericX v${cache.version} by ${cache.author}`)
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Server is running on port ${cache.configurations['hosting:settings']['http:port']}`)
    if (hosting['https:enabled']) {console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Secure Server is running on port ${hosting['https:port']}`)}
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Please remember to stick to offical sources for accurate weather information. Even though this project uses multiple api sources, it is not a replacement for official sources.`)
    await api.functions.request()    
    setInterval(async () => { // a little messy but operational...
        if (new Date().getSeconds() % cache.configurations['request:settings']['request:refresh_synced'] == 0) {
            if (cache.requesting) {return}
            cache.requesting = true
            await api.functions.request()         
            cache.configurations = core.functions.config(`./configurations.json`)
            setTimeout(() => { cache.requesting = false; }, 1000);
        }
    }, 200);
})