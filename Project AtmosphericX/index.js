
/*
    $$$$$$\    $$\                                                 $$\                           $$\           $$\   $$\                  $$\   $$\ 
    $$  __$$\   $$ |                                                $$ |                          \__|          $$ |  $$ |                 $$ |  $$ |
    $$ /  $$ |$$$$$$\   $$$$$$\$$$$\   $$$$$$\   $$$$$$$\  $$$$$$\  $$$$$$$\   $$$$$$\   $$$$$$\  $$\  $$$$$$$\ \$$\ $$  |      $$\    $$\ $$ |  $$ |
    $$$$$$$$ |\_$$  _|  $$  _$$  _$$\ $$  __$$\ $$  _____|$$  __$$\ $$  __$$\ $$  __$$\ $$  __$$\ $$ |$$  _____| \$$$$  /       \$$\  $$  |$$$$$$$$ |
    $$  __$$ |  $$ |    $$ / $$ / $$ |$$ /  $$ |\$$$$$$\  $$ /  $$ |$$ |  $$ |$$$$$$$$ |$$ |  \__|$$ |$$ /       $$  $$<         \$$\$$  / \_____$$ |
    $$ |  $$ |  $$ |$$\ $$ | $$ | $$ |$$ |  $$ | \____$$\ $$ |  $$ |$$ |  $$ |$$   ____|$$ |      $$ |$$ |      $$  /\$$\         \$$$  /        $$ |
    $$ |  $$ |  \$$$$  |$$ | $$ | $$ |\$$$$$$  |$$$$$$$  |$$$$$$$  |$$ |  $$ |\$$$$$$$\ $$ |      $$ |\$$$$$$$\ $$ /  $$ |         \$  /         $$ |
    \__|  \__|   \____/ \__| \__| \__| \______/ \_______/ $$  ____/ \__|  \__| \_______|\__|      \__| \_______|\__|  \__|          \_/          \__|
                                                          $$ |                                                                                       
                                                          $$ |                                                                                       
                                                          \__|                                                                                       

    Written by: k3yomi@GitHub                     Primary API: https://api.weather.gov
    Version: 4.5                                 
*/

const apiManager = require('./library/api.js');
const formatManager = require('./library/format.js');
const toolsManager = require('./library/tools.js');
const discordManager = require('./library/discord.js');
const endpointManager = require('./library/endpoint.js');


file_extensions = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.woff': 'application/font-woff', '.ttf': 'application/font-ttf', '.eot': 'application/vnd.ms-fontobject', '.otf': 'application/font-otf', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.webm': 'video/webm', '.mp4': 'video/mp4', };


HTTP_OK = 200;
HTTP_FORBIDDEN = 403;
HTTP_NOT_FOUND = 404;
HTTP_CREATED = 201;
HTTP_INTERNAL_SERVER_ERROR = 500;


configurations = undefined;
active_total_warnings = [];
active_total_watches = [];
generic_data = [];
manual_data = [];
active_notifications = [];
ratelimitController = [];
loginAuthorization = [];
alreadyQuerying = false;
alreadyQueryingDiscord = false;


express = require("express");
cryptography = require('crypto');
fs = require('fs');
path = require('path');
req = require('request');
ascii = fs.readFileSync('./ascii', 'utf8');



apiConstructor = new apiManager();
formatConstructor = new formatManager();
toolsConstructor = new toolsManager();
discordConstructor = new discordManager();
endpointConstructor = new endpointManager();

return new Promise(async (resolve, reject) => {
    console.log('\x1bc');
    console.log(`\x1b[90m`);
    console.log(ascii);
    configurations = await toolsConstructor.env('env');
    const app = express();
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        if (configurations['API_ACCESS'] != "[*]") {
            let allowed = JSON.parse(configurations['API_ACCESS']);
            let ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).replace('::ffff:', '');
            if (!allowed.includes(ip)) {
                res.statusCode = HTTP_FORBIDDEN;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Forbidden', message: 'Your address is not allowed to access this API.' }));
                return;
            }
        }
        if (req.url.includes('dashboard')) {
            if (!loginAuthorization.includes(req.headers['x-forwarded-for'] || req.connection.remoteAddress)) {
                endpointConstructor.loginRedirect(req, res);
                return;
            }
        }
        if (req.url.includes('.')) {
            let file_path = path.resolve('./www' + req.url);
            let file_extension = path.extname(file_path);
            if (fs.existsSync(file_path)) {
                res.statusCode = HTTP_OK;
                res.setHeader('Content-Type', file_extensions[file_extension]);
                res.end(fs.readFileSync(file_path));
            } else {
                endpointConstructor.errorRedirect(req, res);
                return;
            }
        } else {
            if (req.url.includes('/api') || req.url == `/`) { next(); return; }
            let file_path = path.resolve('./www' + req.url + '.html');
            if (fs.existsSync(file_path)) {
                res.statusCode = HTTP_OK;
                res.setHeader('Content-Type', file_extensions['.html']);
                res.end(fs.readFileSync(file_path));
            } else {
                endpointConstructor.errorRedirect(req, res);
                return;
            }
        }
        next();
    });
    app.get('/', (req, res) => {
        if (!loginAuthorization.includes(req.headers['x-forwarded-for'] || req.connection.remoteAddress)) {
            endpointConstructor.loginRedirect(req, res);
            return;
        }
        endpointConstructor.redirectDashboard(req, res);
    });
    app.get('/api/alerts', (req, res) => {
        res.statusCode = HTTP_OK;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(generic_data, null, 2));
    });
    app.get('/api/active_warnings', (req, res) => {
        res.statusCode = HTTP_OK;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(active_total_warnings, null, 2));
    });
    app.get('/api/active_manual', (req, res) => {
        res.statusCode = HTTP_OK;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(manual_data, null, 2));
    });
    app.get('/api/notifications', (req, res) => {
        res.statusCode = HTTP_OK;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(active_notifications, null, 2));
    });
    app.get('/api/active_watches', (req, res) => {
        res.statusCode = HTTP_OK;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(active_total_watches, null, 2));
    });
    app.get('/api/queryrate', (req, res) => {
        res.statusCode = HTTP_OK;
        res.setHeader('Content-Type', 'application/json');
        res.end(configurations['QUERY_RATE']);
    });
    app.get('/api/location', (req, res) => {
        res.statusCode = HTTP_OK;
        res.setHeader('Content-Type', 'application/json');
        res.end(configurations['YOUR_LOCATION']);
    });
    app.post('/api/manual', (req, res) => {
        if (!loginAuthorization.includes(req.headers['x-forwarded-for'] || req.connection.remoteAddress)) {
            res.statusCode = HTTP_FORBIDDEN;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Forbidden' }));
            return;
        }
        endpointConstructor.manualPost(req, res);
    });
    app.post('/api/forcerequest', (req, res) => {
        if (!loginAuthorization.includes(req.headers['x-forwarded-for'] || req.connection.remoteAddress)) {
            res.statusCode = HTTP_FORBIDDEN;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Forbidden' }));
            return;
        }
        endpointConstructor.requestDataPost(req, res);
    });
    app.post('/api/notification', (req, res) => {
        if (!loginAuthorization.includes(req.headers['x-forwarded-for'] || req.connection.remoteAddress)) {
            res.statusCode = HTTP_FORBIDDEN;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Forbidden' }));
            return;
        }
        endpointConstructor.notificationPost(req, res);
    });
    app.post('/api/login', (req, res) => {
        endpointConstructor.loginPost(req, res, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    });
    app.post('/api/register', (req, res) => {
        endpointConstructor.registerPost(req, res, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    });
    app.post('/api/newpassword', (req, res) => {
        endpointConstructor.newPasswordPost(req, res, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    });
    app.post('/api/logout', (req, res) => {
        endpointConstructor.requestLogoutPost(req, res, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    });
    if (configurations['HTTPS'].toLowerCase() == 'true') {
        if (!fs.existsSync('./cert/generated.key') || !fs.existsSync('./cert/generated.crt')) {
            toolsConstructor.log('[Error] SSL Certificate and Key not found. Please run the generator script to generate the SSL certificate and key.\n\t\t\t\t\t\t   If you wish to run the server without SSL, please set HTTPS to false in the .env file.');
            process.exit(1);
        } else {
            let ssl = { key: fs.readFileSync(`./cert/generated.key`), cert: fs.readFileSync(`./cert/generated.crt`) };
            var https = require('https');
            var http = require('http');
            httpServer = http.createServer(app);
            httpsServer = https.createServer(ssl, app);
            httpServer.listen(configurations.PORT, () => { }).on('error', (err) => { toolsConstructor.log(`[Error] [WebServer] ${err}`); });
            httpsServer.listen(configurations.SSL_PORT, () => { }).on('error', (err) => { toolsConstructor.log(`[Error] [WebServer] ${err}`); });

            toolsConstructor.log(`[Warning] Server is running in HTTPS/HTTP mode. Please ensure that your SSL certificate is valid and up-to-date.`);
            toolsConstructor.log(`Dasboard: https://${configurations.HOSTNAME}:${configurations.PORT} | http://${configurations.HOSTNAME}:${configurations.SSL_PORT}`);
        }
    } else {
        toolsConstructor.log(`Dashboard: http://${configurations.HOSTNAME}:${configurations.PORT}`);
        app.listen(configurations.PORT, configurations.HOSTNAME, () => {
            toolsConstructor.log('Thank you for using AtmosphericX - Please stay safe and happy storm chasing!');
            toolsConstructor.log('[Warning] Data recieved from this service may be inaccurate or outdated. Use at your own risk and always rely on official sources for weather information. I do not take responsibility for any damages or losses caused by this service.');
        }).on('error', (err) => {
            toolsConstructor.log(`[Error] [WebServer] ${err}`);
        });
    }
    if (configurations.ACTIVE_ONLY == "true") {
        apiConstructor.requestActive();
        setInterval(() => {
            if (new Date().getSeconds() % configurations['REFRESH_RATE'] == 0) {
                if (alreadyQuerying) { return; }
                alreadyQuerying = true;
                apiConstructor.requestActive();
                setTimeout(() => { alreadyQuerying = false; }, 1000);
            }
        }, 200);
        toolsConstructor.log('Active Only mode is enabled. Starting active alerts...');
    } else {
        apiConstructor.requestArchive();
        setInterval(() => {
            if (new Date().getSeconds() % configurations['REFRESH_RATE'] == 0) {
                if (alreadyQuerying) { return; }
                alreadyQuerying = true;
                apiConstructor.requestArchive();
                setTimeout(() => { alreadyQuerying = false; }, 1000);
            }
        }, 200);
        toolsConstructor.log('Archive mode is enabled. Starting all alerts...');
    }
    if (configurations.ENABLE_DISCORD_BOT == "true") {
        discordjs = require('discord.js');
        toolsConstructor.log('Discord Bot is enabled. Starting bot...');
        bot_client = new discordjs.Client({
            intents: [
                32767,
                discordjs.GatewayIntentBits.DirectMessages,
                discordjs.GatewayIntentBits.Guilds,
                discordjs.GatewayIntentBits.GuildMessages,
                discordjs.GatewayIntentBits.MessageContent,
                discordjs.GatewayIntentBits.GuildMessageReactions,
            ],
            partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'],
            shardCount: 2
        });
        bot_client.on('ready', () => {
            console.log(`Logged in as ${bot_client.user.tag}!`);
            let latest = generic_data[0];
            let eventName = latest['eventName'];
            bot_client.user.setPresence({ activities: [{ name: `${eventName}`, type: discordjs.ActivityType.Watching }], status: 'online' });
            setInterval(() => {
                if (new Date().getSeconds() % configurations['DISCORD_BOT_REFRESH_RATE'] == 0) {
                    if (alreadyQueryingDiscord) { return; }
                    alreadyQueryingDiscord = true;
                    discordConstructor.update();
                    setTimeout(() => { alreadyQueryingDiscord = false; }, 1000);
                }
            }, 200);
        });
        bot_client.login(configurations.DISCORD_TOKEN);
    }
});

