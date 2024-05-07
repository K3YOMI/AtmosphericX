
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
    Version: 4.0                                  
*/                                         

const apiManager = require('./library/api.js');
const formatManager = require('./library/format.js');
const toolsManager = require('./library/tools.js');
const discordManager = require('./library/discord.js');
const endpointManager = require('./library/endpoint.js');


file_extensions = { '.html': 'text/html','.css': 'text/css','.js': 'text/javascript','.json': 'application/json','.png': 'image/png','.jpg': 'image/jpg','.gif': 'image/gif','.svg': 'image/svg+xml','.ico': 'image/x-icon','.wav': 'audio/wav','.mp4': 'video/mp4','.woff': 'application/font-woff','.ttf': 'application/font-ttf','.eot': 'application/vnd.ms-fontobject','.otf': 'application/font-otf','.wasm': 'application/wasm','.mp3': 'audio/mpeg','.webm': 'video/webm','.mp4': 'video/mp4',}


HTTP_OK = 200;
HTTP_FORBIDDEN = 403;
HTTP_NOT_FOUND = 404;
HTTP_CREATED = 201;


configurations = undefined
active_total_warnings = []
active_total_watches = []
generic_data = []
manual_data = []
active_notifications = []
ratelimitController = []
loginAuthorization = []
alreadyQuerying = false



http = require('http');
crypto = require('crypto');
fs = require('fs')
path = require('path')
req = require('request')
ascii = fs.readFileSync('./ascii', 'utf8')





apiConstructor = new apiManager();
formatConstructor = new formatManager();
toolsConstructor = new toolsManager();
discordConstructor = new discordManager();
endpointConstructor = new endpointManager();

return new Promise(async (resolve, reject) => {
    console.log('\x1bc');
    console.log(`\x1b[90m`)
    console.log(ascii);
    configurations = await toolsConstructor.env('env')
    const server = http.createServer(async (req, res) => {
        let clientAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        configurations = await toolsConstructor.env('env')
        let endpointRoutes = [ // Routing for API endpoints to return data
            {url: "/api/alerts", data: JSON.stringify(generic_data, null, 2), requiredLogin: false},
            {url: "/api/active_warnings", data: JSON.stringify(active_total_warnings, null, 2), requiredLogin: false},
            {url: "/api/active_manual", data: JSON.stringify(manual_data, null, 2), requiredLogin: false},
            {url: "/api/notifications", data: JSON.stringify(active_notifications, null, 2), requiredLogin: false},
            {url: "/api/active_watches", data: JSON.stringify(active_total_watches, null, 2), requiredLogin: false},
            {url: "/api/queryrate", data: configurations['QUERY_RATE'], requiredLogin: false},
            {url: "/api/location", data: configurations['YOUR_LOCATION'], requiredLogin: true},
            {url: "/api/manual", data: [], requiredLogin: true},
            {url: "/api/forcerequest", data: [], requiredLogin: true},
            {url: "/api/notification", data: [], requiredLogin: true},
            {url: "/api/login", data: [], requiredLogin: false},
            {url: "/api/register", data: [], requiredLogin: false},
            {url: "/api/newpassword", data: [], requiredLogin: false},
            {url: "/api/logout", data: [], requiredLogin: true}
        ]
        if (toolsConstructor.canAccess(clientAddress, configurations)) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
            let http_method = req.method;
            let http_url = req.url;
            let http_ip = req.connection.remoteAddress;
            if (http_method == "GET") {
                if (http_url == "/") {
                    endpointConstructor.redirectDashboard(req, res)
                    return;
                }
                if (http_url.includes(`/api/`)) {
                    if (endpointRoutes.filter(e => e.url == http_url)[0] == undefined) {
                        endpointConstructor.errorRedirect(req, res) 
                        return
                    }else{
                        if (endpointRoutes.filter(e => e.url == http_url)[0].requiredLogin) {
                            if (!loginAuthorization.includes(http_ip)) {
                                endpointConstructor.loginRedirect(req, res)
                                return;
                            }else{
                                res.statusCode = HTTP_OK;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(endpointRoutes.filter(e => e.url == http_url)[0].data)
                                return;
                            }
                        }else{
                            res.statusCode = HTTP_OK;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(endpointRoutes.filter(e => e.url == http_url)[0].data)
                            return;
                        }
                    }
                }else {
                    if (http_url.includes('dashboard')) {
                        if (!loginAuthorization.includes(http_ip)) {
                            endpointConstructor.loginRedirect(req, res)
                            return 
                        }
                    }
                    if (http_url.includes('.')) { 
                        let file_path = path.resolve('./www' + http_url)
                        let file_extension = path.extname(file_path)
                        if (fs.existsSync(file_path)) {
                            res.statusCode = HTTP_OK;
                            res.setHeader('Content-Type', file_extensions[file_extension]);
                            res.end(fs.readFileSync(file_path))
                        }else{
                            endpointConstructor.errorRedirect(req, res)
                            return;
                        }
                    }else{
                        let file_path = path.resolve('./www' + http_url + '.html');
                        if (fs.existsSync(file_path)) {
                            res.statusCode = HTTP_OK;
                            res.setHeader('Content-Type', file_extensions['.html']);
                            res.end(fs.readFileSync(file_path))
                        }else{
                            endpointConstructor.errorRedirect(req, res)
                            return;
                        }
                    }
                }
            }
            if (http_method == "POST") {
                if (toolsConstructor.canAccess(clientAddress, configurations)) {
                    if (endpointRoutes.filter(e => e.url == http_url)[0] == undefined) {
                        endpointConstructor.errorRedirect(req, res)
                        return;
                    }else{
                        if (endpointRoutes.filter(e => e.url == http_url)[0].requiredLogin) {
                            if (!loginAuthorization.includes(http_ip)) {
                                endpointConstructor.loginRedirect(req, res)
                            }else{
                                if (http_url == "/api/manual") {
                                    endpointConstructor.manualPost(req, res)
                                    return
                                }
                                if (http_url == "/api/forcerequest") {
                                    endpointConstructor.requestDataPost(req, res)
                                    return
                                }
                                if (http_url == "/api/notification") {
                                    endpointConstructor.notificationPost(req, res)
                                    return
                                }
                                if (http_url == "/api/logout") {
                                    endpointConstructor.requestLogoutPost(req, res, http_ip)
                                    return
                                }
                            }
                        }else{
                            if (http_url == "/api/login") {
                                endpointConstructor.loginPost(req, res, http_ip)
                                return
                            }
                            if (http_url == "/api/register") {
                                endpointConstructor.registerPost(req, res, http_ip)
                                return
                            }
                            if (http_url == "/api/newpassword") {
                                endpointConstructor.newPasswordPost(req, res, http_ip)
                                return
                            }
                        }
                    }
                }else{
                    endpointConstructor.errorRedirect(req, res)
                    return
                }
            }
        }else {
            endpointConstructor.errorRedirect(req, res)
            return
        }
    });
    server.listen(configurations.PORT, configurations.HOSTNAME, () => {
        toolsConstructor.log(`Dashboard: http://${configurations.HOSTNAME}:${configurations.PORT}`)
        toolsConstructor.log('Thank you for using AtmosphericX - Please stay safe and happy storm chasing!')
        toolsConstructor.log('[Warning] Data recieved from this service may be inaccurate or outdated. Use at your own risk and always rely on official sources for weather information. I do not take responsibility for any damages or losses caused by this service.')
        if (configurations.ACTIVE_ONLY == "true") { 
            apiConstructor.requestActive()
            setInterval(() => {
                if (new Date().getSeconds() % configurations['REFRESH_RATE'] == 0) {
                    if (alreadyQuerying) {return}
                    alreadyQuerying = true
                    apiConstructor.requestActive()
                    setTimeout(() => {alreadyQuerying = false}, 1000)}
            }, 200);
            toolsConstructor.log('Active Only mode is enabled. Starting active alerts...')
        }else{
            apiConstructor.requestArchive()
            setInterval(() => {
                if (new Date().getSeconds() % configurations['REFRESH_RATE'] == 0) {
                    if (alreadyQuerying) {return}
                    alreadyQuerying = true
                    apiConstructor.requestArchive()
                    setTimeout(() => {alreadyQuerying = false}, 1000)}
            }, 200);
            toolsConstructor.log('Archive mode is enabled. Starting all alerts...')
        }
        if (configurations.ENABLE_DISCORD_BOT == "true") {
            discordjs = require('discord.js');
            toolsConstructor.log('Discord Bot is enabled. Starting bot...')
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
                let latest = generic_data[0]
                let eventName = latest['eventName']
                bot_client.user.setPresence({ activities: [{ name:`${eventName}`, type: discordjs.ActivityType.Watching }], status: 'online' });
                discordConstructor.update()
            });
            bot_client.login(configurations.DISCORD_TOKEN);
        }
    }).on('error', (err) => {
        toolsConstructor.log(`Error: ${err.message}`)
    });
});
