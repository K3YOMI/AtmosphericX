/*


     █████  ████████ ███    ███  ██████  ███████ ██████  ██   ██ ███████ ██████  ██  ██████ ██   ██ 
    ██   ██    ██    ████  ████ ██    ██ ██      ██   ██ ██   ██ ██      ██   ██ ██ ██       ██ ██  
    ███████    ██    ██ ████ ██ ██    ██ ███████ ██████  ███████ █████   ██████  ██ ██        ███   
    ██   ██    ██    ██  ██  ██ ██    ██      ██ ██      ██   ██ ██      ██   ██ ██ ██       ██ ██  
    ██   ██    ██    ██      ██  ██████  ███████ ██      ██   ██ ███████ ██   ██ ██  ██████ ██   ██ 

    Written by: k3yomi@GitHub                     API Credits: National Weather Service (NWS)
    Version: 3.0                                  Endpoint: https://api.weather.gov/
                                                                                                
                                                                                                
    This is a simple weather alert system that uses the National Weather Service API to provide
    real-time weather alerts and warnings. 

*/


const apiManager = require('./library/api.js');
const formatManager = require('./library/format.js');
const toolsManager = require('./library/tools.js');
const discordManager = require('./library/discord.js');
const file_extensions = { '.html': 'text/html','.css': 'text/css','.js': 'text/javascript','.json': 'application/json','.png': 'image/png','.jpg': 'image/jpg','.gif': 'image/gif','.svg': 'image/svg+xml','.ico': 'image/x-icon','.wav': 'audio/wav','.mp4': 'video/mp4','.woff': 'application/font-woff','.ttf': 'application/font-ttf','.eot': 'application/vnd.ms-fontobject','.otf': 'application/font-otf','.wasm': 'application/wasm','.mp3': 'audio/mpeg','.webm': 'video/webm','.mp4': 'video/mp4',}


const HTTP_OK = 200;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_CREATED = 201;


configurations = undefined
active_total_warnings = []
active_total_watches = []
generic_data = []
manual_data = []

http = require('http');
fs = require('fs')
path = require('path')
req = require('request')
ascii = fs.readFileSync('./ascii', 'utf8')




apiConstructor = new apiManager();
formatConstructor = new formatManager();
toolsConstructor = new toolsManager();
discordConstructor = new discordManager();

return new Promise(async (resolve, reject) => {
    console.log('\x1bc');
    console.log(`\x1b[90m`)
    console.log(ascii);
    configurations = await toolsConstructor.env('.env')
    toolsConstructor.log('Environment variables loaded')
    toolsConstructor.log(`Attempting to start server on host ${configurations.HOSTNAME}:${configurations.PORT}`)
    const server = http.createServer((req, res) => {
        let clientAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (toolsConstructor.canAccess(clientAddress, configurations)) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
            let http_method = req.method;
            let http_url = req.url;
            if (http_method == "GET") {
                if (http_url == "/") {
                    res.statusCode = HTTP_OK;
                    res.setHeader('Content-Type', 'text/html');
                    res.end(fs.readFileSync(path.resolve('./www/redirect.html')))
                    return;
                }
                if (http_url.includes(`/api/`)) {
                    if (http_url == "/api/alerts") {
                        res.statusCode = HTTP_OK;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(generic_data, null, 2))
                    }
                    if (http_url == "/api/active_warnings") {
                        res.statusCode = HTTP_OK;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(active_total_warnings, null, 2))
                    }
                    if (http_url == "/api/active_manual") {
                        res.statusCode = HTTP_OK;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(manual_data, null, 2))
                    }
                    if (http_url == "/api/active_watches") {
                        res.statusCode = HTTP_OK;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(active_total_watches, null, 2))
                    }
                    if (http_url == "/api/location") {
                        res.statusCode = HTTP_OK;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end(configurations['YOUR_LOCATION'])
                    }
                }else {
                    if (http_url.includes('.')) { 
                        let file_path = path.resolve('./www' + http_url)
                        let file_extension = path.extname(file_path)
                        if (fs.existsSync(file_path)) {
                            res.statusCode = HTTP_OK;
                            res.setHeader('Content-Type', file_extensions[file_extension]);
                            res.end(fs.readFileSync(file_path))
                        }else{
                            let fs_path = path.resolve('./www/404.html')
                            res.statusCode = HTTP_NOT_FOUND;
                            res.end(fs.readFileSync(fs_path))
                        }
                    }else{
                        let file_path = path.resolve('./www' + http_url + '.html');
                        if (fs.existsSync(file_path)) {
                            res.statusCode = HTTP_OK;
                            res.setHeader('Content-Type', file_extensions['.html']);
                            res.end(fs.readFileSync(file_path))
                        }else{
                            let fs_path = path.resolve('./www/404.html')
                            res.statusCode = HTTP_NOT_FOUND;
                            res.end(fs.readFileSync(fs_path))
                        }
                    }
                }
            }
            if (http_method == "POST") {
                if (toolsConstructor.canAccess(clientAddress, configurations)) {
                    if (http_url == "/api/manual") {
                        let body = '';
                        req.on('data', chunk => {
                            body += chunk.toString();
                        });
                        req.on('end', () => {
                            let jsonData = JSON.parse(body);
                            let newData = formatConstructor.registerEvent(jsonData)
                            if (newData['locations'] != "") {
                                manual_data = newData
                                res.statusCode = HTTP_CREATED;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({status: 'success', message: 'Data added to the system'}))
                            }else{
                                manual_data = []
                            }
                        });
                    }
                }else{
                    res.statusCode = HTTP_FORBIDDEN;
                    let fs_path = path.resolve('./www/404.html')
                    res.statusCode = HTTP_NOT_FOUND;
                    res.end(fs.readFileSync(fs_path))
                    return;
                }
            }
        }else {
            res.statusCode = HTTP_FORBIDDEN;
            let fs_path = path.resolve('./www/404.html')
            res.statusCode = HTTP_NOT_FOUND;
            res.end(fs.readFileSync(fs_path))
            return;
        }




    });
    server.listen(configurations.PORT, configurations.HOSTNAME, () => {
        toolsConstructor.log(`Dashboard: http://${configurations.HOSTNAME}:${configurations.PORT}`)
        toolsConstructor.log('Thank you for using AtmosphericX - Please stay safe and happy storm chasing!')
        toolsConstructor.log('[Warning] Data recieved from this service may be inaccurate or outdated. Use at your own risk and always rely on official sources for weather information.')
        if (configurations.ACTIVE_ONLY == "true") { 
            apiConstructor.requestActive(configurations)
            toolsConstructor.log('Active Only mode is enabled. Starting active alerts...')
        }else{
            apiConstructor.requestArchive(configurations)
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
