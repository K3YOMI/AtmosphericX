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
      * @function youGotMail
      * @description Sends an email using the nodemailer package. (Mostly for alerts...)
      *
      * @param {string} title - The title of the email.
      * @param {string} message - The message of the email.
      */

    youGotMail = async function(title, message) {
        let settings = loader.cache.configurations.sources.primary_sources.noaa_weather_wire_service.mail_settings
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
                    timeout: 5000, // TODO: Make this configurable
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
            overlay_settings: loader.cache.configurations.overlay_settings,
            spc_outlooks: loader.cache.configurations.spc_outlooks,
            third_party_services: loader.cache.configurations.third_party_services,
            widget_settings: loader.cache.configurations.widget_settings,
            realtime_irl: loader.cache.configurations.sources.miscellaneous_sources.realtime_irl,
            version: this.getCurrentVersion(),
        }
        return {success: true, message: `Successfully reloaded configurations.`}
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