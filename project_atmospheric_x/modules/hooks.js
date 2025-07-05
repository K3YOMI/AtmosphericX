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



class Hooks { 
    constructor() {
        this.name = `Hooks`;
        this.displayLogo()
        this.reloadConfigurations()
        this.createOutput(this.name, `Successfully initialized ${this.name} module`);
        this.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function youveGotMail
      * @description Sends an email using the nodemailer package. (Mostly for alerts...)
      *
      * @param {string} title - The title of the email.
      * @param {string} message - The message of the email.
      */

    youveGotMail = async function(title, message) {
        let settings = loader.cache.configurations.project_settings.mail_settings
        let isEnabled = settings.enabled 
        if (!isEnabled) { return }
        if (loader.static.mailclient == undefined) {
            loader.static.mailclient = loader.packages.nodemailer.createTransport({
                host: settings.provider,
                port: settings.port,
                secure: settings.secure,
                auth: { user: settings.credentials.username, pass: settings.credentials.password }
            })
            this.createLog(`${this.name}.onMailServer`, `Mail server created`)
            this.createOutput(`${this.name}.onMailServer`, `Mail server created`)
        }
        await loader.static.mailclient.sendMail({ 
            from: `${settings.sender.name} <${settings.sender.email}>`, 
            to: settings.recipient, 
            subject: title, 
            text: message, 
        })
        return { success: true, message: `Successfully sent email to ${settings.recipient}` }
    }

    /**
      * @function sendWebhook
      * @description Sends a webhook message to a Discord channel using the axios package.
      * 
      * @param {string} title - The title of the webhook message.
      * @param {string} message - The message of the webhook.
      */

    sendWebhook = async function(title, message) {
        let settings = loader.cache.configurations.project_settings.webhook_settings;
        let endpoint = settings.discord_webhook;
        let content = settings.content;
        let displayName = settings.webhook_display;
        let cooldownTime = settings.webhook_cooldown
        if (!settings.enabled) { return; }
        let currentTime = new Date().getTime();
        loader.static.webhookTimestamps.push({ time: currentTime, title: title });
        loader.static.webhookTimestamps = loader.static.webhookTimestamps.filter(timestamp => timestamp.time > currentTime - cooldownTime * 1000);
        if (loader.static.webhookTimestamps.length > 3) { return; }
        let embed = { title: title, description: message, color: 16711680, timestamp: new Date().toISOString(), footer: { text: displayName } };
        try { await loader.packages.axios.post(endpoint, { username: displayName, content: content || "", embeds: [embed] }); } catch (error) { return { success: false, message: `Failed to send webhook message.` } }
        return { success: true, message: `Successfully sent webhook message.` }
    }

    /**
      * @function converCoordinated
      * @description Converts latitude and longitude coordinates to a human-readable address using the OpenStreetMap Nominatim API.
      *
      * @param {number} lat - The latitude coordinate.
      * @param {number} lon - The longitude coordinate.
      */

    converCoordinated = async function(lat, lon) {
        return new Promise((resolve, reject) => {
            let url = loader.definitions.static_apis.open_stree_map_coordinates.replace("${X}", lat).replace("${Y}", lon);
            return this.createHttpRequest(url).then(response => {
                if (response.success === false) { resolve('err') } resolve(response.message);
            }).catch(error => { resolve('err'); });
        })
    }


    /**
      * @function getRandomAlert
      * @description Gets a random alert from the cache and increments the index for the next call.
      * This will be used for the random alert feature in the overlay...
      */

    getRandomAlert = function() {
        if (loader.cache.active == undefined) { loader.cache.active = [] }
        if (loader.cache.manual == undefined) { loader.cache.manual = [] }
        let alertsTable = [...loader.cache.active, ...[loader.cache.manual]].filter(alert => alert && Object.keys(alert).length > 0);
        if (alertsTable.length > 0) {
            if (loader.cache.randomIndex == undefined || loader.cache.randomIndex >= alertsTable.length) {
                loader.cache.randomIndex = 0
            }
            loader.cache.random = alertsTable[loader.cache.randomIndex]
            loader.cache.randomIndex++
        } else { 
            loader.cache.random = null
            loader.cache.randomIndex = undefined
        }
        return {success: true, message: `Successfully got random alert.`}
    }

    /**
     * @function createHttpRequest
     * @description Creates an HTTP request using the axios library and returns the response while properly handling errors and status code issues.
     * 
     * @param {string} url - The URL to send the HTTP request to.
     * @return {Promise<Object>} - A promise that resolves to an object containing the success status and the response message.
     */

    createHttpRequest = async function(url) {
        return new Promise(async (resolve, reject) => {
            try { 
                let details = { 
                    url: url,
                    maxRedirects: 0,
                    timeout: loader.cache.configurations.project_settings.http_timeout * 1000,
                    headers: { 
                        'User-Agent': loader.cache.configurations.project_settings.http_useragent,
                        'Accept': 'application/geo+json, text/plain, */*; q=0.9',
                        'Accept-Language': 'en-US,en;q=0.9',
                    },
                    httpsAgent: new loader.packages.https.Agent({ rejectUnauthorized: false })
                }
                await loader.packages.axios.get(details.url, {headers: details.headers, maxRedirects: details.maxRedirects, timeout: details.timeout, httpsAgent: details.httpsAgent}).then((response) => {
                    let responseMessage = response.data 
                    let errorMessage = response.error
                    let statusCode = response.status
                    if (errorMessage != undefined) { 
                        this.createLog(`${this.name}.onHttpErrMessage`, `Error: ${errorMessage}`)
                        resolve({success: false, message: undefined})
                    }
                    if (statusCode != 200) { 
                        this.createLog(`${this.name}.onStatusCodeFail`, `Error: ${statusCode}`)
                        resolve({success: false, message: undefined})
                    }
                    if (responseMessage == undefined) {
                        this.createLog(`${this.name}.onResponseMessageFail`, `Error: ${responseMessage}`)
                        resolve({success: false, message: undefined})
                    }
                    resolve({success: true, message: responseMessage})
                })
            } catch (error) { 
                this.createLog(`${this.name}.onAxiosError`, `Error: ${error}`)
                resolve({success: false, message: undefined})
            }
        })
    }

    /**
      * @function cleanTemp
      * @description Cleans the temporary files in the storage directory.
      */

    cleanTemp = function() {
        let maxBytes = 20000000; // 10MB
        let directory = loader.packages.path.join(__dirname, `../../storage/nwws-oi`);
        let stackFiles = [directory];
        let files = [];
        while (stackFiles.length > 0) {
            let currentDirectory = stackFiles.pop();
            loader.packages.fs.readdirSync(currentDirectory).forEach(file => {
                let filePath = loader.packages.path.join(currentDirectory, file);
                if (loader.packages.fs.statSync(filePath).isDirectory()) {
                    stackFiles.push(filePath);
                } else {
                    files.push({ file: filePath, size: loader.packages.fs.statSync(filePath).size });
                }
            });
        }
        if (files.length === 0) {
            return { success: false, message: `No files found in the directory.` };
        }
        let cleanedFiles = 0;
        files.forEach(file => {
            if (file.size > maxBytes) {
                loader.packages.fs.unlinkSync(file.file);
                cleanedFiles++;
            }
        });
        return { success: true, message: `Successfully cleaned ${cleanedFiles} file(s) exceeding the size limit.` };
    }

    /**
      * @function reloadConfigurations
      * @description Reloads the configurations from the configurations.json file.
      */

    reloadConfigurations = function() {
        loader.cache.configurations = JSON.parse(loader.packages.fs.readFileSync(loader.packages.path.join(__dirname, `../../configurations.json`), `utf-8`));
        loader.cache.public = {
            warning: "This is a public configuration, this prevents the user from being able to view private information.",
            tone_sounds: loader.cache.configurations.tone_sounds,
            default_text: loader.cache.configurations.project_settings.default_alert_text,
            scheme: loader.cache.configurations.scheme,
            spc_outlooks: loader.cache.configurations.spc_outlooks,
            third_party_services: loader.cache.configurations.third_party_services,
            widget_settings: loader.cache.configurations.widget_settings,
            realtime_irl: loader.cache.configurations.sources.miscellaneous_sources.realtime_irl,
            version: this.getCurrentVersion(),
        }
        const memoryUsage = process.memoryUsage();
        loader.cache.metrics = {
            memory: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB', 
            cpu: loader.packages.os.cpus().length + ' cores',
            platform: process.platform,
            arch: process.arch,
            uptime: (process.uptime() / 60).toFixed(2) + ' min',
            node_version: process.version,
            hostname: loader.packages.os.hostname(),
            free_memory: (loader.packages.os.freemem() / 1024 / 1024).toFixed(2) + ' MB',
            total_memory: (loader.packages.os.totalmem() / 1024 / 1024).toFixed(2) + ' MB',
            loadavg: loader.packages.os.loadavg(),
        }
        return {success: true, message: `Successfully reloaded configurations.`}
    }

    /**
      * @function filteringHtml
      * @description Filters HTML tags from a given string or object.
      *
      * @param {string|object} rawBody - The string or object to filter HTML tags from.
      * @return {string|object} - The filtered string or object with HTML tags removed.
      */

    filteringHtml = function(rawBody) {
        if (typeof rawBody === 'string') {
            try {
                let parsed = JSON.parse(rawBody);
                rawBody = parsed;
            } catch (e) {
                rawBody = rawBody.replace(/<[^>]*>/g, ``);
                return rawBody;
            }
        }
        if (Array.isArray(rawBody)) {
            return rawBody.map(item => this.filteringHtml(item));
        } else if (typeof rawBody === 'object' && rawBody !== null) {
            for (let key in rawBody) {
                if (typeof rawBody[key] === 'string') {
                    rawBody[key] = rawBody[key].replace(/<[^>]*>/g, ``);
                } else if (typeof rawBody[key] === 'object') {
                    rawBody[key] = this.filteringHtml(rawBody[key]);
                }
            }
            return rawBody;
        }
        return rawBody;
    }

    /**
      * @function getCurrentVersion
      * @description Gets the current version of the project from the version file.
      * 
      */

    getCurrentVersion = function() {
        let version = loader.packages.fs.readFileSync(loader.packages.path.join(__dirname, `../../version`), `utf-8`);
        return version
    }

    /**
      * @function checkUpdates
      * @description Checks for updates to the project by comparing the current version with the latest version from the GitHub repository.
      */

    checkUpdates = async function() {
        let changelogs = "https://k3yomi.github.io/update/atmosx_header.json"
        let currentVersion = "https://raw.githubusercontent.com/k3yomi/AtmosphericX/main/version"
        let thisVersion = this.getCurrentVersion()
        let latestVersion = await this.createHttpRequest(currentVersion)
        let changelogsData = await this.createHttpRequest(changelogs)
        if (latestVersion.success === false) { return {success: false, message: `Failed to get latest version.`} }
        if (changelogsData.success === false) { return {success: false, message: `Failed to get changelogs.`} }
        loader.cache.updates = changelogsData.message[thisVersion] ? changelogsData.message[thisVersion] : []
        loader.cache.latestupdates = changelogsData.message[latestVersion.message] ? changelogsData.message[latestVersion.message] : []
        if (latestVersion.message > thisVersion) {
            this.createOutput(this.name, `\n\n[NOTICE] New version available: ${latestVersion.message} (Current version: ${thisVersion})\n\t You can update to the latest version by running update.sh.\n\t If you wish to replace manually, you can download the latest version from the GitHub repository.\n\t ==================== CHANGE LOGS ======================== \n\t ${loader.cache.latestupdates.changelogs.join(`\n\t `)}\n\n`);
        }
    }

    /**
      * @function displayLogo
      * @description Displays the logo of the project in the console.
      */

    displayLogo = function() {
        console.clear()
        console.log(loader.packages.fs.readFileSync(loader.packages.path.join(__dirname, `../../storage/logo`), `utf-8`).replace(`{VERSION}`, this.getCurrentVersion()))
        return {success: true, message: `Successfully displayed logo.`}
    }

    /**
      * @function createLog
      * @description Creates a log entry with a header and message.
      * 
      * @param {string} inputHeader - The header for the log entry.
      * @param {string} inputMessage - The message for the log entry.
      */

    createLog = function(inputHeader=this.name, inputMessage=`No Message Specified`) { 
        if (loader.packages.fs.existsSync(loader.packages.path.join(__dirname, `../../storage/logs`)) === false) { 
            loader.packages.fs.writeFileSync(loader.packages.path.join(__dirname, `../../storage/logs`), ``);
        }
        loader.packages.fs.appendFileSync(loader.packages.path.join(__dirname, `../../storage/logs`), `[${new Date().toLocaleString()}] [${inputHeader}] ${inputMessage}\n`);
        return {success: true, message: `Successfully created log entry.`}
    }

    /**
      * @function createOutput
      * @description Creates a console output with a header and message.
      * 
      * @param {string} inputHeader - The header for the output.
      * @param {string} inputMessage - The message for the output.
      */

    createOutput = function(inputHeader=this.name, inputMessage=`No Message Specified`) { 
        console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] << [${inputHeader}] >> ${inputMessage}`);
        return {success: true, message: `Successfully created output entry.`}
    }
}


module.exports = Hooks;