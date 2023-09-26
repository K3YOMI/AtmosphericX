///////////////////////////////////////////////// Setup and Configurations /////////////////////////////////////////////////
const hostname = "192.168.x.xx" // The Hosts IP Address
const port = 420; // The Port to run the server on
const location = "County, ST" // The location of you (The Host) , used to send private alerts to you during severe weather events.
const api_access = [''] // IP Addresses that can access the API and dashboard. (You can also do a wildcard '*' to allow all IP Addresses to access the API and dashboard.)
const dashboard_access = [''] // IP Addresses that can access the dashboard. (You can also do a wildcard '*' to allow all IP Addresses to access the dashboard.)
const query_refresh = 8 // How often to refresh the query in seconds (Default: 8, seems to be the fastest without getting rate limited)
const global_header = { 'User-Agent': 'Any-UA-Here','Accept': 'application/geo+json','Accept-Language': 'en-US'}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/////// Required Modules ///////

const http = require('http');
const fs = require('fs')
const path = require('path')



/////// Variables ///////
let arr_checkManualQuery = []
let time_left = 0


const HTTP_OK = 200;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const DASHBOARD_PAGES = ['/site_dashboard.html','/site_manual.html','/site_outlook.html','/site_alerts.html']
const API_PAGES = ['/api_logo.html', '/api_portable.html', '/api_starting.html', '/api_stream.html', '/api_visualBase.html', '/api_visualDisplay.html', '/api_warnings.html']


const fetch_latest = function () {
    async function fetch_alerts() {
        // promise
        return new Promise((resolve, reject) => { 
            try {
                fetch(`https://api.weather.gov/alerts`, {headers: global_header}).then(response => response.text()).then(text => {
                    try{
                        let json = JSON.parse(text); fs.writeFile(`./archive.json`, JSON.stringify(json), function(err) {})
                    }catch(err) {
                        fs.writeFile(`./archive.json`, JSON.stringify({error: "No Active Alerts"}), function(err) {})
                    }    
                })
                fetch(`https://api.weather.gov/alerts/active`, {headers: global_header}).then(response => response.text()).then(text => {
                    try {
                        let json = JSON.parse(text); fs.writeFile(`./active.json`, JSON.stringify(json), function(err) {})
                    }catch(err) {
                        fs.writeFile(`./active.json`, JSON.stringify({error: "No Active Alerts"}), function(err) {})
                    }
                })
            } catch (error) {
                console.log(`[AtmosphericX API] [Error] - ${error}`)
            }
            let current_unix_to_sync = Math.floor(Date.now() / 1000)
            let add_9_seconds = current_unix_to_sync + 9
            time_left = add_9_seconds
            resolve()
        })
    }
    fetch_alerts()
    setInterval(fetch_alerts, query_refresh * 1000);
}

const api_access_check = async function (ip, req, res) {
    // prmise
    return new Promise((resolve, reject) => {
        if (api_access.includes(ip) == false && api_access.includes('*') == false) {
            res.statusCode = HTTP_FORBIDDEN;
            res.setHeader('Content-Type', 'text/html');
            res.end('<h1>Not Allowed</h1>');
            console.log(`[AtmosphericX API] [API Not Allowed] - ${ip} - ${req.method} - ${req.url}`)
            return
        }
        resolve()
    })
}
const dashboard_access_check = async function (ip, req, res) {
    // prmise
    return new Promise((resolve, reject) => {
        if (dashboard_access.includes(ip) == false && dashboard_access.includes('*') == false) {
            res.statusCode = HTTP_FORBIDDEN;
            res.setHeader('Content-Type', 'text/html');
            res.end('<h1>Not Allowed</h1>');
            console.log(`[AtmosphericX API] [Dashboard Not Allowed] - ${ip} - ${req.method} - ${req.url}`)
            return
        }
        resolve()
    })
}
const global_check = async function (ip, req, res) {
    // prmise
    return new Promise((resolve, reject) => {
        if (api_access.includes(ip) == false && dashboard_access.includes(ip) == false && api_access.includes('*') == false && dashboard_access.includes('*') == false) {
            res.statusCode = HTTP_FORBIDDEN;
            res.setHeader('Content-Type', 'text/html');
            res.end('<h1>Not Allowed</h1>');
            console.log(`[AtmosphericX API] [General Not Allowed] - ${ip} - ${req.method} - ${req.url}`)
            return
        }
        resolve()
    })
}


const read_file = async function (file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf8', function(err, data) {
            if (err) { return }
            try {
                json = JSON.parse(data)
                resolve(json)
            }catch(err) {
                resolve({error: "No Active Alerts"})
            }
        });
    })
}

const validate_post = async function (data,ip, req, res) {
    return new Promise((resolve, reject) => {
        if (data == undefined) {
            res.statusCode = HTTP_BAD_REQUEST;
            res.setHeader('Content-Type', 'text/html');
            res.end('<h1>Bad Request</h1>');
            console.log(`[AtmosphericX API] [Bad Request] - ${ip} - ${req.method} - ${req.url}`)
            return
        }
        // check for XSS
        for (t_data in data) {
            if (data[t_data].includes('<') || data[t_data].includes('>')) {
                res.statusCode = HTTP_BAD_REQUEST;
                res.setHeader('Content-Type', 'text/html');
                res.end('<h1>Bad Request</h1>');
                console.log(`[AtmosphericX API] [Bad Request] - ${ip} - ${req.method} - ${req.url}`)
                return
            }
        }
        resolve()
    })
}




const server = http.createServer((req, res) => {
    let access_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let file_extension_dir = { '.html': 'text/html','.css': 'text/css','.js': 'text/javascript','.png': 'image/png','.jpg': 'image/jpg','.gif': 'image/gif', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'text/xml', '.pdf': 'application/pdf', '.doc': 'application/msword', '.eot': 'application/vnd.ms-fontobject', '.ttf': 'application/font-sfnt' }
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    let access_check = api_access_check(access_ip, req, res).then(() => {
        let method = req.method
        let url = req.url
        console.log(`[AtmosphericX API] - ${access_ip} - ${method} - ${url}`)
        if (method == `GET`) {
            let file_path = path.resolve('./' + url)
            let file_extention = path.extname(file_path)
            if (url == '/api/archive') { 
                read_file('./archive.json').then((json) => {
                    res.statusCode = HTTP_OK;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(json, null, 4));
                })
            } else if (url == '/api/active') {
                read_file('./active.json').then((json) => {
                    res.statusCode = HTTP_OK;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(json, null, 4));
                })
            } else if (url == '/api/sync') {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html');
                res.end(( Math.floor(Date.now() / 1000) - time_left).toString());
            }else if (url == '/api/manual') {
                res.statusCode = HTTP_OK;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(arr_checkManualQuery, null, 4));
            }else if (url == '/api/location') {
                res.statusCode = HTTP_OK;
                res.setHeader('Content-Type', 'text/html');
                res.end(location);
            }else if (file_extention == `.html`) {
                if (DASHBOARD_PAGES.includes(url)) {
                    dashboard_access_check(access_ip, req, res).then(() => {
                        res.statusCode = HTTP_OK;
                        res.setHeader('Content-Type', 'text/html');
                        res.end(fs.readFileSync(file_path, 'utf8'));
                    })
                }else if (API_PAGES.includes(url)) {
                    api_access_check(access_ip, req, res).then(() => {
                        res.statusCode = HTTP_OK;
                        res.setHeader('Content-Type', 'text/html');
                        res.end(fs.readFileSync(file_path, 'utf8'));
                    })
                }else{
                    res.statusCode = HTTP_NOT_FOUND;
                    res.setHeader('Content-Type', 'text/html');
                    res.end('<h1>Not Found</h1>');
                    console.log(`[AtmosphericX API] [Not Found] - ${access_ip} - ${method} - ${url}`)
                }
            }else if (file_extension_dir[file_extention]) {
                global_check(access_ip, req, res).then(() => {
                    res.statusCode = HTTP_OK;
                    res.end(fs.readFileSync(file_path));
                })
            }else{
                res.statusCode = HTTP_NOT_FOUND;
                res.setHeader('Content-Type', 'text/html');
                res.end('<h1>Not Found</h1>');
                console.log(`[AtmosphericX API] [Not Found] - ${access_ip} - ${method} - ${url}`)
            }
        }else if (method == `POST`) {
            if (url == `/api/post/query`) { 
                let body = ''
                req.on('data', chunk => {body += chunk.toString();})
                req.on('end', () => {  
                    validate_post(JSON.parse(body), access_ip, req, res).then(() => {
                        arr_checkManualQuery = JSON.parse(body); ; 
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'text/html');
                        res.end('ok');
                    })
                })
            }
        }else{
            res.statusCode = HTTP_BAD_REQUEST;
            res.setHeader('Content-Type', 'text/html');
            res.end('<h1>Bad Request</h1>');
            console.log(`[AtmosphericX API] [Bad Request] - ${access_ip} - ${method} - ${url}`)
        }
    })
})
fetch_latest()
server.listen(port, hostname, () => { console.log(`[AtmosphericX API] - Running at http://${hostname}:${port}/`); });
