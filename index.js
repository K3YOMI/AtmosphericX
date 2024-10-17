
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
    Version: 5.0                              
*/

cache = {}
cache.version = `5.0.1`
cache.author = `k3yomi@GitHub`
cache.alerts = {
    active: [], warnings: [],
    watches: [], manual: [],
    broadcasts: [], danger: [],
    status: undefined
}
cache.configurations = undefined;
cache.requesting = false;

express = require('express') // Web Framework
session = require('express-session') // Session Management
http = require('http')
https = require('https')
cryptography = require('crypto');
fs = require('fs') 
path = require('path')
req = require('request')

core = new (require('./library/core.js')); 
ams = new (require('./library/ams_api.js'));
nws = new (require('./library/nws_api.js'));
web = new (require('./library/web.js'));


core.functions.init()
ams.functions.init()
nws.functions.init()
web.functions.init()
cache.configurations = core.functions.config(`./configurations.json`)
app = express() 
app.use(session({
    secret: cache.configurations['hosting:settings']['cookie:secret'],
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: cache.configurations['hosting:settings']['cookie:maxage'],
        name: 'session',
        sameSite: 'strict',
        secure: cache.configurations['hosting:settings']['cookie:secure']
    },
    name: 'AtmosphericX-Cookie'
}))

/* Generic Middleware */
app.use(`/assets`, express.static(__dirname + '/www/assets'));

/* Stream Routes (PUBLIC) */
app.get(`/`, (req, res) => { if (req.session.account != undefined) {
    res.sendFile(__dirname + '/www/dashboard/index.html'); return;} 
    res.sendFile(__dirname + '/www/portal/login.html')
    // remove all session data
    req.session.destroy()
})
app.get(`/stream`, (req, res) => {res.sendFile(__dirname + '/www/stream/stream.html')})
app.get(`/portable`, (req, res) => {res.sendFile(__dirname + '/www/stream/portable.html')})
app.get(`/warnings`, (req, res) => {res.sendFile(__dirname + '/www/stream/warnings.html')})
app.get(`/reset`, (req, res) => {res.sendFile(__dirname + '/www/portal/reset.html')})
app.get(`/registration`, (req, res) => {res.sendFile(__dirname + '/www/portal/registration.html')})

/* Dashboard Routes (PRIVATE) */
app.get(`/dashboard`, (req, res) => {ams.functions.dashboard(req, res)})

/* API Routes */
app.post(`/api/login`, (req, res) => {ams.functions.login(req, res)})
app.post(`/api/logout`, (req, res) => {ams.functions.logout(req, res)})
app.post(`/api/register`, (req, res) => {ams.functions.register(req, res)})
app.post(`/api/reset`, (req, res) => {ams.functions.password_reset(req, res)})
app.post(`/api/notification`, (req, res) => {ams.functions.notification_activation(req, res)})
app.post(`/api/manual`, (req, res) => {ams.functions.manual_activation(req, res)})
app.post(`/api/status`, (req, res) => {ams.functions.status_activation(req, res)})
app.post(`/api/forcerequest`, (req, res) => {ams.functions.request_latest(req, res)})

app.get(`/api/alerts`, (req, res) => {ams.functions.request_alerts(req, res)})
app.get(`/api/manual`, (req, res) => {ams.functions.request_manual(req, res)})
app.get(`/api/warnings`, (req, res) => {ams.functions.request_warnings(req, res)})
app.get(`/api/watches`, (req, res) => {ams.functions.request_watches(req, res)})
app.get(`/api/notifications`, (req, res) => {ams.functions.request_notifications(req, res)})
app.get(`/api/status`, (req, res) => {ams.functions.request_status(req, res)})
app.get(`/api/configurations`, (req, res) => {ams.functions.request_configurations(req, res)})
app.get(`/api/states`, (req, res) => {ams.functions.request_states(req, res)})

return new Promise(async (resolve, reject) => {
    let hosting = cache.configurations['hosting:settings']
    if (hosting['https:enabled']) { 
        let ssl = { key: fs.readFileSync(hosting['ssl:path']['ssl:key']), cert: fs.readFileSync(hosting['ssl:path']['ssl:cert']) };
        httpsServer = https.createServer(ssl, app)
        httpsServer.listen(hosting['https:port'], () => {})
    }
    const httpServer = http.createServer(app)
    httpServer.listen(cache.configurations['hosting:settings']['http:port'], () => {})
    let url = `https://api.weather.gov/alerts/active`
    if (cache.configurations['application:information']['application:stateid'] != `ALL` && cache.configurations['application:information']['application:stateid'] != ``) {
        url += `/area/${cache.configurations['application:information']['application:stateid']}`
    }

    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: AtmosphericX v${cache.version} by ${cache.author}`)
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Server is running on port ${cache.configurations['hosting:settings']['http:port']}`)
    if (hosting['https:enabled']) {console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Secure Server is running on port ${hosting['https:port']}`)}
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Please remember to stick to offical sources for accurate weather information. Even though this project uses the NWS API, it is not a replacement for official sources.`)


    nws.functions.request(url)
    setInterval(async () => { // a little messy but operational...
        if (new Date().getSeconds() % cache.configurations['request:settings']['request:refresh_synced'] == 0) {
            if (cache.requesting) {return}
            cache.requesting = true
            cache.configurations = core.functions.config(`./configurations.json`)
            let url = `https://api.weather.gov/alerts/active`
            if (cache.configurations['application:information']['application:stateid'] != `ALL` && cache.configurations['application:information']['application:stateid'] != ``) {
                url += `/area/${cache.configurations['application:information']['application:stateid']}`
            }
            nws.functions.request(url)          
            setTimeout(() => { cache.requesting = false; }, 1000);
        }
    }, 200);
})