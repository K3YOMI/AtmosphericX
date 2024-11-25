
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

let functions = {}
functions.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded AMS Functions`)
}

functions.login = async function(req, res) { // Handles the login request (POST)
    try {
        let body = await new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => { resolve(body); });
            req.on('error', error => { reject(error); }); // Handle request error
        });
        let result = JSON.parse(body);
        let username = result.username;
        let hash = cryptography.createHash('sha256').update(result.password).digest('base64')
        let account = JSON.parse(fs.readFileSync(path.join(__dirname, `../cache/accounts.json`), 'utf8'));
        let exists = account.filter(user => user.username === username && user.hash === hash);
        if (exists.length == 0) {
            web.functions.forbidden(req, res, 'Invalid username or password.')
            return
        }
        let activated = exists[0].activated 
        if (!activated) { 
            web.functions.forbidden(req, res, 'Account not activated. Please contact the system administrator for activation.')
            return
        }
        req.session.account = `atmosphericx-cookie-${exists[0].username}`
        req.session.save()
        web.functions.success(req, res, `Welcome back ${username}!`)
        return;
    } catch (error) {web.functions.internal(req, res, error); return;}
} 
functions.logout = async function(req, res) { // Handles the logout request (POST)
    try {
        if (req.session.account) {
            req.session.destroy()
            web.functions.success(req, res, `You have been logged out.`)
            return
        } else { 
            web.functions.forbidden(req, res, 'You are not logged in.')
            return
        }
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.register = async function(req, res) { // Handles the register request (POST)
    try {
        let body = await new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => { resolve(body); });
            req.on('error', error => { reject(error); }); // Handle request error
        });
        let result = JSON.parse(body);
        let username = result.username;
        let hash = cryptography.createHash('sha256').update(result.password).digest('base64')
        let account = JSON.parse(fs.readFileSync(path.join(__dirname, `../cache/accounts.json`), 'utf8'));
        let exists = account.filter(user => user.username === username);
        if (exists.length > 0) {
            web.functions.forbidden(req, res, 'Username already exists.')
            return
        }
        account.push({username: username, hash: hash, activated: false});
        fs.writeFileSync(path.join(__dirname, `../cache/accounts.json`), JSON.stringify(account, null, 2), 'utf8');
        web.functions.success(req, res, `Account created. Please contact the system administrator for activation.`)
        return;
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.password_reset = async function(req, res) { // Handles the password reset request (POST)
    try {
        let body = await new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => { resolve(body); });
            req.on('error', error => { reject(error); }); // Handle request error
        });
        let result = JSON.parse(body);
        let username = result.username;
        let newpassword = cryptography.createHash('sha256').update(result.newpassword).digest('base64')
        let hash = cryptography.createHash('sha256').update(result.password).digest('base64')
        let account = JSON.parse(fs.readFileSync(path.join(__dirname, `../cache/accounts.json`), 'utf8'));
        let exists = account.filter(user => user.username === username);
        if (exists.length == 0) {
            web.functions.forbidden(req, res, 'Username does not exist.')
            return;
        }
        if (exists[0].hash != hash) {
            web.functions.forbidden(req, res, 'Invalid password.')
            return
        }
        exists[0].hash = newpassword;
        fs.writeFileSync(path.join(__dirname, `../cache/accounts.json`), JSON.stringify(account, null, 2), 'utf8');
        if (req.session.account) {req.session.destroy()}
        web.functions.success(req, res, `Password reset successful.`)
        return;
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.notification_activation = async function(req, res) { // Handles the notification activation request (POST)
    try {
        if (!req.session.account) {
            web.functions.forbidden(req, res, 'You do not have permission to access this resource.')
            return
        }
        let body = await new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => { resolve(body); });
            req.on('error', error => { reject(error); }); // Handle request error
        });
        let {title, message} = JSON.parse(body);
        if (message) { 
            cache.alerts.broadcasts = {title, message}
            web.functions.success(req, res, `Broadcast sent - ${title}, ${message}`)
            return;
        } else {
            cache.alerts.broadcasts = []
            web.functions.success(req, res, `Broadcast cleared.`)
            return;
        }
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.status_activation = async function(req, res) { // Handles the notification activation request (POST)
    try {
        if (!req.session.account) {
            web.functions.forbidden(req, res, 'You do not have permission to access this resource.')
            return
        }
        let body = await new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => { resolve(body); });
            req.on('error', error => { reject(error); }); // Handle request error
        });
        let {title} = JSON.parse(body);
        if (title !== "" && title !== undefined) {
            cache.alerts.status = title
            web.functions.success(req, res, `Status sent - ${title}`)
            return;
        } else {
            cache.alerts.status = ""
            web.functions.success(req, res, `Status cleared.`)
            return;
        }
    } catch (error) {
        console.log(error)
        web.functions.internal(req, res, error); return;}
}
functions.manual_activation = async function(req, res) { // Handles the manual activation request (POST)
    try {
        if (!req.session.account) {
            web.functions.forbidden(req, res, 'You do not have permission to access this resource.')
            return
        }
        let body = await new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => { resolve(body); });
            req.on('error', error => { reject(error); }); // Handle request error
        });
        let result = JSON.parse(body);
        let data = core.functions.register(result);
        if (Object.keys(data).length == 0) {
            web.functions.success(req, res, `Successfully removed event.`)
            return
        }
        cache.alerts.manual = data.locations !== "" ? data : []
        web.functions.success(req, res, `Successfully registered new event.`)
        return
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.request_latest = async function(req, res) { // Handles the latest request (GET)
    try {
        if (!req.session.account) {
            web.functions.forbidden(req, res, 'You do not have permission to access this resource.')
            return
        }
        functions.request()
        cache.configurations = core.functions.config(`./configurations.json`)
        web.functions.success(req, res, `Requesting latest data.`)
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.request_manual = async function(req, res) { // Handles the manual request (GET)
    try {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(cache.alerts.manual))
        return
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.request_warnings = async function(req, res) { // Handles the warnings request (GET)
    try {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(cache.alerts.warnings))
        return
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.request_watches = async function(req, res) { // Handles the watches request (GET)
    try {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(cache.alerts.watches))
        return
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.request_alerts = async function(req, res) { // Handles the alerts request (GET)
    try {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(cache.alerts.active))
        return
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.request_configurations = async function(req, res) { // Handles the configurations request (GET)
    try {
        let modified = { 
            WARNING: "This is configuration data routed from the server, please use this data for client development purposes only.",
            ['request:allalerts']: cache.configurations['request:settings']['request:allalerts'],
            ['query:rate']: cache.configurations['request:settings']['request:query_sycned'],
            ['refresh:rate']: cache.configurations['request:settings']['request:refresh_synced'],
            ['application:location']: cache.configurations['application:information']['application:location'],
            ['application:useragent']: cache.configurations['application:information']['application:useragent'],
            ['application:sounds']: cache.configurations['application:sounds'],
            ['application:banners']: cache.configurations['application:banners'],
            ['application:warnings']: cache.configurations['application:warnings'],
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(modified, null, 2))
        return
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.request_notifications = async function(req, res) { // Handles the notifications request (GET)
    try {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(cache.alerts.broadcasts))
        return
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.request_status = async function(req, res) { // Handles the notifications request (GET)
    try {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(cache.alerts.status)
        return
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.request_states = async function(req, res) {
    try {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(cache.configurations['application:states']))
        return
    } catch (error) {web.functions.internal(req, res, error); return;}
}


functions.dashboard = async function(req, res) { // Handles the dashboard request (GET)
    try {
        if (req.session.account == undefined) {res.redirect('/'); return;}
        res.sendFile(path.join(__dirname, `../www/dashboard/index.html`))
    } catch (error) { web.functions.internal(req, res, error); return;}
}


functions.request = async function() {
    let url = `https://api.weather.gov/alerts/active`
    if (cache.configurations['application:information']['application:stateid'] != `ALL` && cache.configurations['application:information']['application:stateid'] != ``) {
        url += `/area/${cache.configurations['application:information']['application:stateid']}`
    }
    nws.functions.request(url)
}

class ams {constructor() {this.functions = functions}}
module.exports = ams;