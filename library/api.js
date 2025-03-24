
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
        if (cache.alerts.active == undefined) {cache.alerts.active = []}
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

    let data = {}
    let results = ``
    let time = new Date()
    let currentRetries = 0;

    async function a_nws(handle) { // National Weather Service API
        let url = handle['nws:api'];
        let state = handle['nws:state'];
        if (state && state !== 'ALL') { url += `/area/${state}`; }
        try {
            let d = await ext.functions.request(url);
            if (d.features) {
                data.nws = d;
                results += `(NWS: OK)`;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (currentRetries < 3) { 
                currentRetries++;
                console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [WARNING] Retrying NWS API Request (Attempt: ${currentRetries})`);
                await a_nws(handle);
            } else {
                results += ` (NWS: ERR)`;
                console.error(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [ERROR] NWS API Request Failed after ${currentRetries} attempts.`);
            }
        }
    }
    async function a_allision_house(handle) { // Allision House API (Non-Subscription)
        let url = handle['allisonhouse:warnings:api'];
        try {
            let d = await ext.functions.request(url);
            if (d.length) {
                let extract = await ext.functions.extract(d);
                let download = await ext.functions.download(extract, url);
                let parser = await ext.functions.parser(download);
                data.generic = parser;
                results += ` (AH: OK)`;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (currentRetries < 3) { 
                currentRetries++;
                console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [WARNING] Retrying AH API Request (Attempt: ${currentRetries})`);
                await a_allision_house(handle);
            } else {
                results += ` (AH: ERR)`;
                console.error(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [ERROR] AH API Request Failed after ${currentRetries} attempts.`);
            }
        }
    }
    async function a_cod(handle) { // College of Dupage API (Non-Subscription)
        let url = handle['cod:warnings:api'];
        try {
            let d = await ext.functions.request(url);
            if (d.length) {
                let extract = await ext.functions.extract(d);
                let download = await ext.functions.download(extract, url);
                let parser = await ext.functions.parser(download);
                data.generic = parser;
                results += ` (COD: OK)`;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (currentRetries < 3) { 
                currentRetries++;
                console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [WARNING] Retrying COD API Request (Attempt: ${currentRetries})`);
                await a_cod(handle);
            } else {
                results += ` (COD: ERR)`;
                console.error(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [ERROR] COD API Request Failed after ${currentRetries} attempts.`);
            }
        }
    }
    async function a_spotters(handle) { // Spotter Network API
        let url = handle['spotternetwork:members:api'];
        try {
            let d = await ext.functions.request(url);
            if (d.length) {
                let parsed = await ext.functions.spotternetwork(d);
                cache.alerts.spotters = parsed;
                results += ` (SPOTTERS: OK)`;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (currentRetries < 3) { 
                currentRetries++;
                console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [WARNING] Retrying Spotter Network API Request (Attempt: ${currentRetries})`);
                await a_spotters(handle);
            } else {
                results += ` (SPOTTERS: ERR)`;
                console.error(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [ERROR] Spotter Network API Request Failed after ${currentRetries} attempts.`);
            }
        }
    }
    async function a_discussions(handle) { // SPC Mesoscale Discussions API 
        let url = handle['spc:meoscale:convective:disscussion:api'];
        try {
            let d = await ext.functions.request(url);
            if (d.length) {
                let parsed = await ext.functions.mesoscale(d);
                cache.alerts.mesoscale = parsed;
                results += ` (MESO: OK)`;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (currentRetries < 3) { 
                currentRetries++;
                console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [WARNING] Retrying Mesoscale API Request (Attempt: ${currentRetries})`);
                await a_discussions(handle);
            } else {
                results += ` (MESO: ERR)`;
                console.error(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [ERROR] Mesoscale API Request Failed after ${currentRetries} attempts.`);
            }
        }
    }
    async function a_lightning(handle) { // Lightning API
        let url = handle['lightning:reports:api'];
        try {
            let d = await ext.functions.request(url);
            if (d.length) {
                let parsed = await ext.functions.lightning(d);
                cache.alerts.lightning = parsed;
                results += ` (LIGHTNING: OK)`;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (currentRetries < 3) { 
                currentRetries++;
                console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [WARNING] Retrying Lightning API Request (Attempt: ${currentRetries})`);
                await a_lightning(handle);
            } else {
                results += ` (LIGHTNING: ERR)`;
                console.error(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [ERROR] Lightning API Request Failed after ${currentRetries} attempts.`);
            }
        }
    }
    async function a_mping(handle) { // mPing API
        let url = handle['mPing:reports:api'];
        try {
            let d = await ext.functions.request(url);
            if (d != undefined) {
                data.mPing = d;
                results += ` (MPING: OK)`;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (currentRetries < 3) { 
                currentRetries++;
                console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [WARNING] Retrying mPing API Request (Attempt: ${currentRetries})`);
                await a_mping(handle);
            } else {
                results += ` (MPING: ERR)`;
                console.error(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [ERROR] mPing API Request Failed after ${currentRetries} attempts.`);
            }
        }
    }
    async function a_grxlsr(handle) { // GRLevelX LSRs API
        let url = handle['grlevelx:reports:api'];
        try {
            let d = await ext.functions.request(url);
            if (d != undefined) {
                data.grxlsr = d;
                results += ` (GRXLSR: OK)`;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (currentRetries < 3) { 
                currentRetries++;
                console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [WARNING] Retrying GRXLSR API Request (Attempt: ${currentRetries})`);
                await a_grxlsr(handle);
            } else {
                results += ` (GRXLSR: ERR)`;
                console.error(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [ERROR] GRXLSR API Request Failed after ${currentRetries} attempts.`);
            }
        }
    }
    async function a_lsr(handle) { // IEM LSR Reports API
        let url = handle['lsr:reports:api']
        let state = handle['lsr:reports:state']
        let hours = handle['lsr:reports:hours']
        try {
            url += `hours=${hours}`
            if (state != `ALL` && state != ``) { url += `&states=${state}` }
            let d = await ext.functions.request(url);
            if (d.features != undefined) {
                data.lsr = d;
                results += ` (LSR: OK)`;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            if (currentRetries < 3) { 
                currentRetries++;
                console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [WARNING] Retrying LSR API Request (Attempt: ${currentRetries})`);
                await a_lsr(handle);
            } else {
                results += ` (LSR: ERR)`;
                console.error(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [ERROR] LSR API Request Failed after ${currentRetries} attempts.`);
            }
        }
    }


    let handles = [
        {name: 'nws', handle: calls['primary:api']['nws:api'], timer: calls['primary:api']['nws:api']['nws:cachetime'], contradictions: ['allisonhouse:warnings', 'cod:warnings'], func: a_nws},
        {name: 'allisonhouse:warnings', handle: calls['primary:api']['allisonhouse:warnings'], timer: calls['primary:api']['allisonhouse:warnings']['allisonhouse:warnings:cachetime'], contradictions: ['nws', 'cod:warnings'], func: a_allision_house},
        {name: 'cod:warnings', handle: calls['primary:api']['cod:warnings'], timer: calls['primary:api']['cod:warnings']['cod:warnings:cachetime'], contradictions: ['nws', 'allisonhouse:warnings'], func: a_cod},
        {name: 'spotternetwork:members', handle: calls['misc:api']['spotternetwork:members'], timer: calls['misc:api']['spotternetwork:members']['spotternetwork:members:cachetime'], contradictions: [], func: a_spotters},
        {name: 'spc:meoscale:convective:disscussion', handle: calls['misc:api']['spc:meoscale:convective:disscussion'], timer: calls['misc:api']['spc:meoscale:convective:disscussion']['spc:meoscale:convective:disscussion:cachetime'], contradictions: [], func: a_discussions},
        {name: 'lightning:reports', handle: calls['misc:api']['lightning:reports'], timer: calls['misc:api']['lightning:reports']['lightning:reports:cachetime'], contradictions: [], func: a_lightning},
        {name: 'mPing:reports', handle: calls['misc:api']['mPing:reports'], timer: calls['misc:api']['mPing:reports']['mPing:reports:cachetime'], contradictions: ["lsr:reports", "grlevelx:reports"], func: a_mping},
        {name: 'lsr:reports', handle: calls['misc:api']['lsr:reports'], timer: calls['misc:api']['lsr:reports']['lsr:reports:cachetime'], contradictions: ["mPing:reports", "grlevelx:reports"], func: a_lsr},
        {name: 'grlevelx:reports', handle: calls['misc:api']['grlevelx:reports'], timer: calls['misc:api']['grlevelx:reports']['grlevelx:reports:cachetime'], contradictions: ["mPing:reports", "lsr:reports"], func: a_grxlsr},
    ] 
    for (let i = 0; i < handles.length; i++) {
        let contradictions = handles[i].contradictions;
        for (let j = 0; j < contradictions.length; j++) {
            let contradictionIndex = handles.findIndex(handle => handle.name === contradictions[j]);
            if (contradictionIndex !== -1 && handles[contradictionIndex].handle[`${contradictions[j]}:enable`] === true) {
                if (handles[i].handle[`${handles[i].name}:enable`] === true) {
                    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [WARNING] Contradiction Detected: ${handles[i].name} and ${contradictions[j]} are both enabled. Disabling ${contradictions[j]}.`);
                    handles[contradictionIndex].handle[`${contradictions[j]}:enable`] = false;
                }
            }
        }
    }
    let active = handles.filter(handle => handle.handle[`${handle.name}:enable`] == true) 
    for (let i = 0; i < active.length; i++) {
        if (cache.time[active[i].name] == undefined) {cache.time[active[i].name] = Date.now() - active[i].timer * 1000}
    }
    let readyToRequest = active.filter(handle => (Date.now() - cache.time[handle.name]) / 1000 >= handle.timer) // filter out the ones ready to be requested
    for (let i = 0; i < readyToRequest.length; i++) {
        await readyToRequest[i].func(readyToRequest[i].handle)
        cache.time[readyToRequest[i].name] = Date.now()
    }
    if (results == ``) { return }
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: [GET] Updated Alert Cache (Taken: ${new Date() - time}ms) | ${results}`)
    await ext.functions.build(data)
}

class api {constructor() {this.functions = functions}}
module.exports = api;