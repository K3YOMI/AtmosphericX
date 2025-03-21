
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
        cache.alerts.manual = data.details.locations !== "" ? data : []
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
functions.request_data = async function(req, res, type) {
    try {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(type)
        return
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.request_random_alert = async function() {
    return new Promise((resolve, reject) => {
        let alerts = [...cache.alerts.active, ...[cache.alerts.manual]].filter(alert => alert && Object.keys(alert).length > 0);
        if (alerts.length > 0) {
            if (cache.alerts.random_index === undefined || cache.alerts.random_index >= alerts.length) {
                cache.alerts.random_index = 0;
            }
            cache.alerts.random = alerts[cache.alerts.random_index];
            cache.alerts.random_index++;
        } else {
            cache.alerts.random = null;
            cache.alerts.random_index = undefined;
        }
        resolve();
    });
}
functions.request_configurations = function(req, res, ret=true) { // Handles the configurations request (GET)
    try {
        let modified = { 
            WARNING: "This is configuration data routed from the server, please use this data for client development purposes only.",
            ['request:allalerts']: cache.configurations['request:settings']['request:allalerts'],
            ['query:rate']: cache.configurations['request:settings']['request:query_sycned'],
            ['refresh:rate']: cache.configurations['request:settings']['request:refresh_synced'],
            ['application:timezone']: cache.configurations['application:information']['application:timezone'],
            ['application:12hour']: cache.configurations['application:information']['application:12hour'],
            ['application:location']: cache.configurations['application:information']['application:location'],
            ['application:useragent']: cache.configurations['application:api']['primary:api']['nws:api']['application:useragent'],
            ['application:sounds']: cache.configurations['application:sounds'],
            ['application:banners']: cache.configurations['application:banners'],
            ['application:warnings']: cache.configurations['application:warnings'],
            ['overlay:settings']: {
                ['color:scheme']: cache.configurations['overlay:settings']['color:scheme'],
            },
            ['spc:outlooks']: cache.configurations['spc:outlooks'],
            ['external:services']: cache.configurations['external:services'],
            ['map:layers']: {
                ['radar']: cache.configurations['application:api']['misc:api']['radar:layer'],
                ['tracking']: cache.configurations['application:api']['misc:api']['spotternetwork:members']['spotternetwork:tracking'],
            },
        }
        if (!ret) {return modified}
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(modified, null, 2))
        return
    } catch (error) {web.functions.internal(req, res, error); return;}
}
functions.request = async function() {
    let calls = cache.configurations['application:api']
    let primary = calls['primary:api']
    let misc = calls['misc:api']
    let data = {}
    let time = new Date()
    let result = ``
    data.nws = undefined
    data.generic = undefined
    data.reports = undefined
    
    async function nws() { // National Weather Service API Handler
        if (primary['nws:api']['nws:enabled'] == true) {
            let url = primary['nws:api']['nws:api']
            let state = primary['nws:api']['nws:state']
            if (state != `ALL` && state != ``) { url += `/area/${state}` }
            let d = await ext.functions.request(url)
            if (d.features != undefined) { data.nws = d; } else { await nws(); return }
            result += `(NWS: ${d.features.length})`
        }
    }
    async function reports() { // IEM Storm Reports API Handler
        if (misc['iem:stormreports']['iem:stormreports:enable'] == true) {
            let url = misc['iem:stormreports']['iem:stormreports:api']
            let state = misc['iem:stormreports']['iem:stormreports:state']
            let hours = misc['iem:stormreports']['iem:stormreports:hours']
            if (state != `ALL` && state != ``) { url += `states=${state}` }
            url += `&hours=${hours}`
            let d = await ext.functions.request(url)
            if (d.features != undefined) { data.reports = d; } else { await reports(); return; }
            result += ` (REPORTS: ${d.features.length})`
        }
    }

    async function allisionHouse() { 
        if (primary['allisonhouse:warnings']['allisonhouse:warnings:enable'] == true) {
            let url = primary['allisonhouse:warnings']['allisonhouse:warnings:api']
            let d = await ext.functions.request(url)
            if (d.length == 0) { await allisionHouse(); return; }
            let extract = await ext.functions.extract(d)
            let download = await ext.functions.download(extract, url)
            let parser = await ext.functions.parser(download)
            data.generic = parser
            result += ` (AH: ${parser.length})`
        }
    }
    async function cod() {
        if (primary['cod:warnings']['cod:warnings:enable'] == true) {
            let url = primary['cod:warnings']['cod:warnings:api']
            let d = await ext.functions.request(url)
            if (d.length == 0) { await cod(); return; }
            let extract = await ext.functions.extract(d)
            let download = await ext.functions.download(extract, url)
            let parser = await ext.functions.parser(download)
            data.generic = parser
            result += ` (COD: ${parser.length})`
        }
    }
    async function spotternetwork() {
        let d = ``
        let c = ``
        if (misc['spotternetwork:members']['spotternetwork:members:enable'] == true) {
            let url = misc['spotternetwork:members']['spotternetwork:members:api']
            d = await ext.functions.request(url)
            if (d.length == 0) { await spotternetwork(); return; }
        }
        if (misc['spotternetwork:members']['spotternetwork:streams:enable'] == true) {
            let url = misc['spotternetwork:members']['spotternetwork:streams:api']
            c = await ext.functions.request(url)
            if (c.length == 0) { await spotternetwork(); return; }
        }
        let parsed = await ext.functions.spotternetwork(d,c)
        cache.alerts.spotters = parsed
        result += ` (SPOTTERS: ${parsed.length})`
    }

    await nws()
    await reports()
    await allisionHouse()
    await cod()
    await spotternetwork()
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [GET] Updated Alert Cache (Taken: ${new Date() - time}ms) | ${result}`)
    await ext.functions.build(data)
}

class api {constructor() {this.functions = functions}}
module.exports = api;