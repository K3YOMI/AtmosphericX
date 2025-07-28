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
        let settings = loader.cache.configurations.mail_settings;
        if (!settings.enabled) return { success: false, message: "Mail functionality is disabled in the configuration." };
        if (!loader.static.mailclient) {
            loader.static.mailclient = loader.packages.nodemailer.createTransport({ host: settings.provider, port: settings.port, secure: settings.secure, auth: { user: settings.credentials.username, pass: settings.credentials.password } });
            this.createLog(`${this.name}.MailServerInitialization`, "Mail server successfully initialized.");
            this.createOutput(`${this.name}.MailServerInitialization`, "Mail server successfully initialized.");
        }
        try {
            await loader.static.mailclient.sendMail({ from: `${settings.sender.name} <${settings.sender.email}>`, to: settings.recipient, subject: title, text: message });
            return { success: true, message: `Email successfully sent to ${settings.recipient}.` };
        } catch (error) {
            this.createLog(`${this.name}.MailSendError`, `Error sending email: ${error.message}`);
            return { success: false, message: `Failed to send email: ${error.message}` };
        }
    }

    /**
      * @function sendWebhook
      * @description Sends a webhook message to a Discord channel using the axios package.
      * 
      * @param {string} title - The title of the webhook message.
      * @param {string} message - The message of the webhook.
      * @param {Object} settings - The settings for the webhook, including the endpoint, content, display name, and cooldown time.
      */

    sendWebhook = async function(title, message, settings) {
        if (!settings.enabled) return { success: false, message: "Webhook functionality is disabled." };
        let { discord_webhook: endpoint, content, webhook_display: displayName, webhook_cooldown: cooldownTime } = settings;
        let currentTime = Date.now();
        loader.static.webhookTimestamps = loader.static.webhookTimestamps.filter(ts => ts.time > currentTime - cooldownTime * 1000);
        if (loader.static.webhookTimestamps.filter(ts => ts.type == displayName).length >= 3) {
            return { success: false, message: `Rate limit exceeded for ${displayName}.` };
        }
        let embed = { title, description: message, color: 16711680, timestamp: new Date().toISOString(), footer: { text: displayName } };
        try {
            await loader.packages.axios.post(endpoint, { username: displayName, content: content || "", embeds: [embed] });
            loader.static.webhookTimestamps.push({ time: currentTime, title, type: displayName });
            return { success: true, message: "Successfully sent webhook message." };
        } catch (error) {
            return { success: false, message: `Failed to send webhook message: ${error.message}` };
        }
    }
    
    /**
      * @function getMilesAway
      * @description Calculates the distance in miles between two geographical coordinates using the Haversine formula
      * 
      * @param {number} lat1 - The latitude of the first coordinate.
      * @param {number} lon1 - The longitude of the first coordinate.
      * @param {number} lat2 - The latitude of the second coordinate.
      * @param {number} lon2 - The longitude of the second coordinate.
      */

    getMilesAway = function(lat1, lon1, lat2, lon2) {
        let R = 3959, 
            dLat = (lat2 - lat1) * Math.PI / 180, 
            dLon = (lon2 - lon1) * Math.PI / 180, 
            a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2, 
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), 
            distance = R * c;
        return isNaN(distance) ? undefined : distance.toFixed(2);
    };

    /**
      * @function getCardinalDirection
      * @description Converts degrees to a cardinal direction (N, NE, E, SE, S, SW, W, NW).
      * 
      * @param {number} degrees - The angle in degrees.
      */
    
    getCardinalDirection = function(degrees) {
        if (degrees < 0 || degrees > 360) return 'Invalid degrees';
        let directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        let index = Math.round(degrees / 45) % 8;
        return directions[index];
    }

    /**
      * @function gpsTracking
      * @description Tracks GPS coordinates and creates a placefile point for the given latitude and longitude. This can be
      * used for various purposes including placefiles, alert filtering, and general widget functionality.
      * 
      * @param {number} lat - The latitude coordinate.
      * @param {number} lon - The longitude coordinate.
      * @param {string} type - The type of GPS tracking, default is `SpotterNetwork`.
      */

    gpsTracking = async function(lat, lon, type = 'SpotterNetwork') {
        let locationServices = loader.cache.configurations.sources.miscellaneous_sources.location_services;
        if (loader.static.lastGpsUpdate  + (locationServices.gps_refresh * 1000) > Date.now()) {
            return { success: false, message: "GPS tracking is currently on cooldown. Please wait before trying again." };
        }
        loader.static.lastGpsUpdate  = Date.now()
        if (typeof loader.cache.location != `object`) { loader.cache.location = {} }
        loader.cache.location.lat = lat;
        loader.cache.location.lon = lon;
        let toLocation = await this.convertCoordinatesToRequest(loader.definitions.static_apis.open_street_map_coordinates, lat, lon);
        let toCape = await this.convertCoordinatesToRequest(loader.definitions.static_apis.cape_coordinates, lat, lon);
        let toWeather = await this.convertCoordinatesToRequest(loader.definitions.static_apis.temperature_coordinates, lat, lon);
        if (toCape !== 'err') {
            let index = toCape.hourly.time.findIndex(t => new Date(t).getTime() >= Date.now());
            if (index !== -1 && toCape.hourly.cape[index] !== undefined) loader.cache.location.cape = toCape.hourly.cape[index]?.toString() + ' J/kg';
        }
        if (toWeather !== 'err') {
            let conditions = toWeather.weather[0];
            let baseTemps = toWeather.main
            let baseObservation = toWeather.wind
            loader.cache.location.cloudDescription = conditions.description ? conditions.description.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'N/A';
            loader.cache.location.temperature = baseTemps.temp ? `${((baseTemps.temp - 273.15) * 9/5 + 32).toFixed(0)}°F` : 'N/A';
            loader.cache.location.humidity = baseTemps.humidity ? `${baseTemps.humidity}%` : 'N/A';
            loader.cache.location.windSpeed = baseObservation.speed ? `${(baseObservation.speed * 2.23694).toFixed(0)} mph` : 'N/A';
            loader.cache.location.windDirection = baseObservation.deg ? `${baseObservation.deg}° (${this.getCardinalDirection(baseObservation.deg)})` : 'N/A';
            loader.cache.location.windGust = baseObservation.gust ? `${(baseObservation.gust * 2.23694).toFixed(0)} mph` : 'N/A';
        }
        if (toLocation !== 'err') {
            let { house_number = '', road = '', city = toLocation.address?.municipality || '----', municipality = '', state = '', postcode = '', county = 'Unknown County' } = toLocation.address || {};
            loader.cache.location.address = `${house_number || ''} ${road || ''}, ${city || municipality || '----'}, ${state || ''}, ${postcode || ''}`.trim();
            loader.cache.location.location = `${city || municipality || '----'}, ${state || ''}`.trim();
            loader.cache.location.county = county || 'Unknown County';
            loader.cache.location.state = state || 'Unknown State';
        }
        let description = [`Address: ${loader.cache.location.address || 'N/A'}`,`Location: ${loader.cache.location.location || 'N/A'}`,`County: ${loader.cache.location.county || 'N/A'}`,`State: ${loader.cache.location.state || 'N/A'}`,`Temperature: ${loader.cache.location.temperature || 'N/A'}`,`Humidity: ${loader.cache.location.humidity || 'N/A'}`,`Wind Speed: ${loader.cache.location.windSpeed || 'N/A'}`,`Wind Direction: ${loader.cache.location.windDirection || 'N/A'}`,`Wind Gust: ${loader.cache.location.windGust || 'N/A'}`,`Cloud Description: ${loader.cache.location.cloudDescription || 'N/A'}`,`CAPE: ${loader.cache.location.cape || 'N/A'}`]
        let places = [{ title: description.join('\\n').replace(/;/g, ' -').replace(/,/g, ""), description: `${locationServices.display_name} (${loader.cache.location.cape || 'N/A'})`, point: [parseFloat(loader.cache.location.lon), parseFloat(loader.cache.location.lat)], rgb: '255,0,0,255' }]
        loader.modules.placefiles.createPlacefilePoint(1, 999, `AtmosphericX GPS (${type}) - ${new Date().toUTCString()}`, places, 'gps');
        this.createOutput(`${this.name}.gpsTracking`, `Updated GPS coordinates for ${type}: ${loader.cache.location.county || 'Unknown County'}, ${loader.cache.location.state || 'Unknown State'} (${loader.cache.location.lat}, ${loader.cache.location.lon})`);
        return { success: true, message: `Successfully tracked GPS coordinates for ${type}.`, location: loader.cache.location };
    }

    /**
      * @function convertCoordinatesToRequest
      * @description Converts latitude and longitude coordinates to a human-readable address using the OpenStreetMap Nominatim API.
      *
      * @param {string} pointer - The URL pointer found in loader.definitions.static_apis, this will replace ${X} and ${Y} with the latitude and longitude coordinates.
      * @param {number} lat - The latitude coordinate.
      * @param {number} lon - The longitude coordinate.
      */

    convertCoordinatesToRequest = async function(pointer, lat, lon) {
        let url = pointer.replace("${X}", lat).replace("${Y}", lon);
        try {
            let response = await this.createHttpRequest(url, 3);
            return response.success ? response.message : 'err';
        } catch {
            return 'err';
        }
    }

    /**
      * @function getRandomAlert
      * @description Gets a random alert from the cache and increments the index for the next call.
      * This will be used for the random alert feature in the overlay...
      */

    getRandomAlert = function() {
        let alerts = [...(Array.isArray(loader.cache.active) ? loader.cache.active : []), ...(Array.isArray(loader.cache.manual) ? loader.cache.manual : [])].filter(alert => alert && Object.keys(alert).length > 0);
        if (alerts.length == 0) {
            loader.cache.random = null;
            loader.cache.randomIndex = undefined;
            return { success: false, message: "No alerts available." };
        }
        loader.cache.randomIndex = (loader.cache.randomIndex || 0) % alerts.length;
        loader.cache.random = alerts[loader.cache.randomIndex++];
        return { success: true, message: "Successfully retrieved random alert." };
    }

    /**
     * @function createHttpRequest
     * @description Creates an HTTP request using the axios library and returns the response while properly handling errors and status code issues.
     * 
     * @param {string} url - The URL to send the HTTP request to.
     * @return {Promise<Object>} - A promise that resolves to an object containing the success status and the response message.
     */

    createHttpRequest = async function(url, timeoutOverride=undefined) {
        return new Promise(async (resolve) => {
            try {
                let defaultTimeout = loader.cache.configurations.project_settings.http_timeout * 1000;
                defaultTimeout = timeoutOverride !== undefined ? timeoutOverride : defaultTimeout;
                let details = { url, maxRedirects: 0, timeout: defaultTimeout * 1000, headers: { 'User-Agent': loader.cache.configurations.project_settings.http_useragent, 'Accept': 'application/geo+json, text/plain, */*; q=0.9', 'Accept-Language': 'en-US,en;q=0.9', }, httpsAgent: new loader.packages.https.Agent({ rejectUnauthorized: false }) };
                let response = await loader.packages.axios.get(details.url, {
                    headers: details.headers,
                    maxRedirects: details.maxRedirects,
                    timeout: details.timeout,
                    httpsAgent: details.httpsAgent,
                    validateStatus: (status) => status == 200 || status == 500
                });
                let { data: responseMessage, status: statusCode } = response;
                if (statusCode == 500) this.createLog(`${this.name}.onStatusCode500`, `Warning: Received status code 500`);
                if (!responseMessage) {
                    this.createLog(`${this.name}.onResponseMessageFail`, `Error: Response message is undefined`);
                    return resolve({ success: false, message: undefined });
                }
                resolve({ success: true, message: responseMessage });
            } catch (error) {
                this.createLog(`${this.name}.onAxiosError`, `Error: ${error.message}`);
                resolve({ success: false, message: undefined });
            }
        });
    }

    reloadConfigurations = function() {
        let configPath = loader.packages.path.join(__dirname, `../../configurations.json`);
        loader.cache.configurations = JSON.parse(loader.packages.fs.readFileSync(configPath, `utf-8`));
        loader.cache.public = {
            warning: "This is a public configuration, preventing access to private information.",
            tone_sounds: loader.cache.configurations.tone_sounds,
            default_text: loader.cache.configurations.project_settings.default_alert_text,
            scheme: loader.cache.configurations.scheme,
            spc_outlooks: loader.cache.configurations.spc_outlooks,
            third_party_services: loader.cache.configurations.third_party_services,
            forecasting_models: loader.cache.configurations.forecasting_models,
            widget_settings: loader.cache.configurations.widget_settings,
            realtime_irl: loader.cache.configurations.sources.miscellaneous_sources.realtime_irl,
            version: this.getCurrentVersion(),
        };
        let memoryUsage = process.memoryUsage();
        loader.cache.metrics = {
            memory: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
            cpu: `${loader.packages.os.cpus().length} cores`,
            platform: process.platform,
            arch: process.arch,
            uptime: `${(process.uptime() / 60).toFixed(2)} min`,
            node_version: process.version,
            hostname: loader.packages.os.hostname(),
            free_memory: `${(loader.packages.os.freemem() / 1024 / 1024).toFixed(2)} MB`,
            total_memory: `${(loader.packages.os.totalmem() / 1024 / 1024).toFixed(2)} MB`,
            loadavg: loader.packages.os.loadavg(),
        };
        return { success: true, message: "Configurations reloaded successfully." };
    }

    /**
      * @function filteringHtml
      * @description Filters HTML tags from a given string or object.
      *
      * @param {string|object} rawBody - The string or object to filter HTML tags from.
      * @return {string|object} - The filtered string or object with HTML tags removed.
      */

    filteringHtml = function(rawBody) {
        if (typeof rawBody == 'string') {
            try {
                rawBody = JSON.parse(rawBody);
            } catch {
                return rawBody.replace(/<[^>]*>/g, '');
            }
        }
        if (Array.isArray(rawBody)) return rawBody.map(item => this.filteringHtml(item));
        if (typeof rawBody == 'object' && rawBody !== null) {
            for (let key in rawBody) {
                let value = rawBody[key];
                rawBody[key] = typeof value == 'string' ? value.replace(/<[^>]*>/g, '') : this.filteringHtml(value);
            }
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
        let changelogsUrl = "https://k3yomi.github.io/update/atmosx_header.json";
        let versionUrl = "https://raw.githubusercontent.com/k3yomi/AtmosphericX/main/version";
        let currentVersion = this.getCurrentVersion();
        let latestVersionResponse = await this.createHttpRequest(versionUrl);
        let changelogsResponse = await this.createHttpRequest(changelogsUrl);
        if (!latestVersionResponse.success) return { success: false, message: "Failed to fetch the latest version." };
        if (!changelogsResponse.success) return { success: false, message: "Failed to fetch changelogs." };
        let latestVersion = latestVersionResponse.message;
        loader.cache.updates = changelogsResponse.message[currentVersion] || currentVersion;
        loader.cache.latestupdates = changelogsResponse.message[latestVersion] || [];
        if (latestVersion > currentVersion) {
            let changelogs = loader.cache.latestupdates.changelogs.join("\n\t ");
            this.createOutput(this.name, `\n\n[NOTICE] New version available: ${latestVersion} (Current version: ${currentVersion})\n\t Update by running update.sh or download the latest version from GitHub.\n\t =================== CHANGE LOGS ======================= \n\t ${changelogs}\n\n`);
        }
    }

    /**
      * @function displayLogo
      * @description Displays the logo of the project in the console.
      */

    displayLogo = function() {
        let logoPath = loader.packages.path.join(__dirname, `../../storage/logo`);
        let logoContent = loader.packages.fs.readFileSync(logoPath, `utf-8`).replace(`{VERSION}`, this.getCurrentVersion());
        console.clear();
        console.log(logoContent);
        return { success: true, message: `Logo displayed successfully.` };
    }

    /**
      * @function createLog
      * @description Creates a log entry with a header and message.
      * 
      * @param {string} inputHeader - The header for the log entry.
      * @param {string} inputMessage - The message for the log entry.
      */

    createLog = function(inputHeader = this.name, inputMessage = `No Message Specified`) {
        let logDir = loader.packages.path.join(__dirname, `../../storage/logs`);
        if (!loader.packages.fs.existsSync(logDir)) loader.packages.fs.writeFileSync(logDir, ``);
        loader.packages.fs.appendFileSync(logDir, `[${new Date().toLocaleString()}] [${inputHeader}] ${inputMessage}\n`);
        return { success: true, message: `Log entry created successfully.` };
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