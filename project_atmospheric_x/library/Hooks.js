

/*
              _                             _               _     __   __
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

/**
 * @module Hooks
 * @description The Hooks module provides a collection of utility functions and methods for managing configurations, logging, 
 * system statistics, and making HTTP requests. It is designed to support the AtmosphericX project by offering 
 * functionalities such as displaying logos, handling alerts, and performing periodic updates.
 * 
 * @requires fs - The file system module for reading and writing files.
 * @requires path - The path module for handling and transforming file paths.
 * @requires os - The operating system module for retrieving system information.
 * @requires axios - A promise-based HTTP client for making requests.
 * 
 * 
 * Note: For performance improvements or suggestions, feel free to reach out to me on GitHub or Discord @kiyomi (359794704847601674).

 */

class Hooks { 
    constructor() {
        this.author = `k3yomi@GitHub`
        this.production = true
        this.name = `Hooks`;
        this.PrintLog(`${this.name}`, `Successfully initialized ${this.name} module`);
        this.RefreshConfigurations()
        this._PrintLogo()
    }

    /**
     * @function _GetRandomAlert
     * @description This function selects a random alert from the active and manual alert lists stored in the `cache.alerts` object. 
     * It maintains a pointer (`random_index`) that tracks which alert was selected last, ensuring that the next call
     * to this function selects the next alert in the list. If there are no active or manual alerts, it resets the random
     * selection state and returns `null`.
     * 
     * @returns {Promise<void>} 
     * This function resolves with no value (`void`). It updates the `cache.alerts.random` object with the randomly selected alert 
     * and increments the `random_index` to point to the next alert for the subsequent function call.
     */

    async _GetRandomAlert() {
        return new Promise(async (resolve, reject) => {
            if (cache.alerts.active == undefined) { cache.alerts.active = [] }
            let alerts_table = [...cache.alerts.active, ...[cache.alerts.manual]].filter(alert => alert && Object.keys(alert).length > 0);
            if (alerts_table.length > 0) {
                if (cache.alerts.random_index == undefined || cache.alerts.random_index >= alerts_table.length) {
                    cache.alerts.random_index = 0;
                }
                cache.alerts.random = alerts_table[cache.alerts.random_index];
                cache.alerts.random_index++;
            } else {
                cache.alerts.random = null;
                cache.alerts.random_index = undefined;
            }
            resolve();
        });
    }

    /**
      * @function CleanupStorage
      * @description This function cleans up the storage directory by deleting files that exceed a specified size limit.
      * It traverses the storage directory and its subdirectories, checking the size of each file.
      * 
      * @async
      * @returns {Promise<void>}
      */

    async CleanupStorage() {
        let max_bytes = 25000000;
        let directory = path.join(__dirname, `../../storage/nwws-oi`);
        let files = [];
        let stack = [directory];
        while (stack.length > 0) {
            let currentDir = stack.pop();
            fs.readdirSync(currentDir).forEach(file => {
                let filePath = path.join(currentDir, file);
                if (fs.statSync(filePath).isDirectory()) { stack.push(filePath); } else { files.push({ file: filePath, size: fs.statSync(filePath).size }); }
            });
        }
        if (files.length == 0) { return; }
        let file = files.find(file => file.size > max_bytes);
        if (file) { fs.unlinkSync(file.file); }
    }

    /**
     * @function _PrintLogo
     * @description This function clears the console and then logs the content of a logo stored in a file located in the `../../storage/logo` path. 
     * The file is read as a UTF-8 encoded string and displayed in the console. This is typically used to display a logo 
     * or ASCII art in the console for visual branding or identification purposes.
     * 
     * @returns {Promise<void>}
     * This function does not return any value. It simply outputs the logo to the console.
     * 
     * @throws {Error} 
     * If there is an issue reading the logo file (e.g., file not found, read error), the error will be thrown.
     */

    async _PrintLogo() {
        console.clear()
        console.log(fs.readFileSync(path.join(__dirname, `../../storage/logo`), `utf8`))
    }

    /**
     * @function RefreshConfigurations
     * @description This function reads the `configurations.json` file located in the parent directory and parses its content 
     * as a JSON object. The parsed data is then stored in the `cache.configurations` variable for further use.
     * 
     * The function expects the `configurations.json` file to exist and be properly formatted as valid JSON.
     * This function does not return any value but modifies the global `cache.configurations` object.
     * 
     * @returns {Promise<void>} 
     * This function does not return anything. It simply loads and parses the configuration file into memory.
     * 
     * @throws {Error}
     * If there is an issue reading the `configurations.json` file (e.g., file not found, invalid JSON), 
     * an error will be thrown during execution.
     */

    async RefreshConfigurations() {
        cache.configurations = JSON.parse(fs.readFileSync(path.join(__dirname, `../../configurations.json`)))
    }

    /**
      * @function PrintLog
      * @description This function prints a formatted log message to the console. It includes a timestamp, a header (e.g., 
      * a category or log level), and the provided message.
      * 
      * The message will be printed in the following format:
      * `[Project AtmosphericX] [timestamp] << header >> message`
      * 
      * @param {string} _header - The header or category of the log message (default is `"Info"`).
      * @param {string} _message - The actual message to be logged (default is `"No message provided."`).
      * 
      * @returns {Promise<void>}
      * This function does not return any value. It simply prints the log message to the console.
      */

    async PrintLog(_header=`Info`, _message=`No message provided.`) {
        console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] << ${_header} >> ${_message}`)
    }

    /**
     * @function Log
     * @description This function logs a message to a log file located in the `cache/logs` directory. 
     * If the log file does not exist, it is created. The message is appended to the log file
     * along with a timestamp and the provided header.
     * 
     * The log entry will be in the following format:
     * `[timestamp] : header : message`
     * 
     * @param {string} _header - The header or category of the log message (default is `"Info"`).
     * @param {string} _message - The actual message to be logged (default is `"No message provided."`).
     * 
     * @returns {Promise<void>}
     * This function does not return any value. It simply appends the log message to the log file.
     */

    async Log(_message=`No message provided.`) {
        if (fs.existsSync(path.join(__dirname, `../../storage/logs`)) == false) {fs.writeFileSync(path.join(__dirname, `../../storage/logs`), ``)}
        fs.appendFileSync(path.join(__dirname, `../../storage/logs`), `[${new Date().toLocaleString()}] : ${_message}\n`)
    }

    /**
     * @function StartProcess
     * @description This function initializes and starts the system by triggering the necessary API calls and periodic updates. It performs the following:
     * 1. Starts the next API call using the `APICalls.Next()` function.
     * 2. Calls the `_GetRandomAlert` function to update the random alert.
     * 3. Sets up a periodic interval (every 100ms) to:
     *   - Call `_GetRandomAlert` periodically to update the random alert.
     *   - Check if it's time to refresh the synchronized requests based on the `global_update` configuration.
     *   - If it's time to refresh, it ensures no other requests are being processed (`cache.requesting` flag), refreshes the configuration, updates random alert, and gathers stats.
     *   - It then triggers the next API call and ensures no race conditions by using `setTimeout` to reset the `cache.requesting` flag after a brief period.
     * 
     * @returns {Promise<void>}
     * This function does not return any value but continuously updates the system at regular intervals.
     */

    async StartProcess() {
        await APICalls.Next()
        await this.CleanupStorage()
        setInterval(async () => {
            if (new Date().getSeconds() % cache.configurations.project_settings.global_update == 0) {
                if (cache.requesting) {return}
                cache.requesting = true
                await this.RefreshConfigurations()
                await this.GetLatestHostingStats(true)
                await this.CleanupStorage()
                setTimeout(async () => { 
                    await APICalls.Next()
                    await APICalls.Next(cache.wire);
                    cache.requesting = false; 
                }, 1000);
            }   
        }, 100);
    }

    /**
      * @function GetLatestHostingStats
      * @description This function updates the system statistics and tracks operations and requests. It stores the current CPU load, memory usage,
      * and increments operation and request counters if specified.
      * 
      * The function checks the following:
      * - **CPU Load**: It retrieves the system's average CPU load for the last 1 minute and formats it as a percentage.
      * - **Memory Usage**: It calculates the percentage of memory used by subtracting the free memory from the total memory, and then calculating the percentage of memory usage.
      * - **Operations & Requests Counters**: If specified by the `_operations` and `_requests` flags, it increments the respective counters in the `cache.statistics` object.
      * 
      * @param {boolean} _operations - Flag to increment the operations counter (defaults to `false`).
      * @param {boolean} _requests - Flag to increment the requests counter (defaults to `false`).
      * 
      * @returns {Promise<void>} 
      * This function does not return any value, but updates the `cache.statistics` object with the current CPU, memory usage statistics, 
      * and increments the counters for operations and requests if the corresponding flags are set to `true`.
      */

    async GetLatestHostingStats(_operations, _requests) {
        cache.statistics.cpu = (Math.round(os.loadavg()[0] * 100) + '%') == '0%' ? 'Unsupported (%)' : Math.round(os.loadavg()[0] * 100) + '%';
        cache.statistics.memory = Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100) + '%';
        if (_operations) { cache.statistics.operations++}
        if (_requests) { cache.statistics.requests++}
    }

    /**
      * @function CallHTTPS
      * @description This function makes an HTTP GET request to a specified URL and returns the response body in a Promise. It is used for fetching data from a remote API, handling errors, and logging any issues encountered during the request. 
      * It allows for custom user-agent headers to be passed and ensures that the request complies with certain configurations (like timeouts and redirect handling).
      * 
      * @param {string} [_url='https://warnings.cod.edu'] - The URL to send the GET request to. Defaults to 'https://warnings.cod.edu'.
      * @param {string|false} [_useragent=false] - Optional custom User-Agent string for the request. If not provided, it uses the default user-agent from the configurations.
      * 
      * @returns {Promise<Object|Array>} 
      * - Returns a Promise that resolves with the response data in case of a successful request (body as an object or array).
      * - In case of an error, the Promise resolves with an empty array and logs the error.
      * - If the response body is empty or the status code is not 200, the Promise resolves with an empty array.
      */

    async CallHTTPS(_url=`https://warnings.cod.edu`, _useragent=false) {
        return new Promise(async (resolve, reject) => {
            try { 
                let details = {
                    url: _url,
                    maxRedirects: 0,
                    timeout: 5000,
                    headers: { 
                        'User-Agent': cache.configurations.project_settings.http_useragent, 
                        'Accept': 'application/geo+json, text/plain', 
                        'Accept-Language': 'en-US',
                    }
                }
                if (_useragent != false) { details.headers['User-Agent'] = _useragent }
                await axios.get(details.url, { headers: details.headers, maxRedirects: details.maxRedirects, timeout: details.timeout }).then((response) => {
                    let data = response.data;
                    let error = response.error;
                    let code = response.status;
                    if (error != undefined) { resolve(undefined); this.Log(`REQUEST.ERROR`, `Request failed with error: ${error}`); return; }
                    if (data == undefined) { resolve(undefined); this.Log(`REQUEST.ERROR`, `Response body is empty`); return; }
                    if (code != 200) { resolve(undefined); this.Log(`REQUEST.ERROR`, `Request failed with status code ${code}`); return; }
                    resolve(data);
                })
            } catch (error) {
                resolve(undefined)
                this.Log(`REQUEST.ERROR`, `${error}`)
                return
            }
        })
    }

    /**
      * @function CallClientConfigurations
      * @description Retrieves configuration data and alert information from the server's cache, 
      * and prepares a combined object containing various project settings, statistics, 
      * and alerts to be sent to the client.
      * 
      * @async
      * @returns {Promise<Object>} 
      * A Promise that resolves to an object containing the full set of client configurations, 
      * including alert data, project settings, and statistics.
      * 
      * **Configuration data includes:**
      * - Project settings like `alert_dictionary`, `global_update`, `http_useragent`, and more.
      * - Alert-related configurations such as `alert_banners`, `alert_dictionary`, `nexrad_stations`, etc.
      * - Widget settings and third-party service configurations.
      * - Alert data and project statistics.
      */

    async CallClientConfigurations() {
        return new Promise(async (resolve, reject) => {
            let client = {
                configurations: {
                    warning: "This is configuration data routed from the server, please use this data for client development purposes only.",
                    alerts: cache.configurations.project_settings.alerts,
                    global_update: cache.configurations.project_settings.global_update,
                    http_useragent: cache.configurations.project_settings.http_useragent,
                    use_web_tts: cache.configurations.project_settings.use_web_tts,
                    tone_sounds: cache.configurations.tone_sounds,
                    alert_banners: cache.configurations.alert_banners,
                    alert_dictionary: cache.configurations.alert_dictionary,
                    overlay_settings: cache.configurations.overlay_settings,
                    spc_outlooks: cache.configurations.spc_outlooks,
                    third_party_services: cache.configurations.third_party_services,
                    widget_settings: cache.configurations.widget_settings,
                    nexrad_stations: cache.configurations.nexrad_stations,
                },
            }
            client = { ...client, ...cache.alerts, statistics: cache.statistics }
            resolve(client)
        })
    }

    /**
      * @function CreateManualAlert
      * @description Handles the creation of a manual activation alert. 
      * It first checks if the requestor has a valid session. If the session is valid, 
      * it processes the alert data, registers the event, and updates the cache with the manual alert details.
      * It also logs the action and sends a response to the client indicating success or failure.
      * 
      * @async
      * @param {Object} _req 
      * The incoming HTTP request object containing the session data and alert details.
      * 
      * @param {Object} _res 
      * The HTTP response object used to send the appropriate response to the client.
      * 
      * @returns {void}
      * A Promise that resolves after the alert has been processed, logged, and client data synced.
      * 
      * **Behavior includes:**
      * - Verifying that the requestor has a valid session.
      * - Parsing and registering the manual alert data.
      * - Updating the cache with the manual alert details.
      * - Logging the alert creation or clearing event.
      * - Sending a response to the client.
      * - Syncing the client data after the operation.
      */

    async CreateManualAlert(_req, _res) {
        let account = await Routes._DoesRequestHaveSession(_req);
        if (!account) {
            Routes._GiveResponseToSession(_req, _res, { code: 403, message: `You do not have permission to access this resource.` });
            return;
        }
        let body = JSON.parse(await new Promise((resolve, reject) => {
            let body = ``;
            _req.on(`data`, (data) => { body += data; });
            _req.on(`end`, () => { resolve(body); });
        }));
        let registration = await Formats.RegisterEvent(body);
        cache.alerts.manual = registration.details.locations !== "" ? registration : [];
        Routes._GiveResponseToSession(_req, _res, { code: 200, message: `Manual activation alert sent successfully.` });
        if (cache.alerts.manual.length != 0) {
            this.Log(`${this.name}.Manual : ${cache.accounts[_req.session.account].username} sent manual activation alert (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`);
            this.PrintLog(`${this.name}.Manual`, `Manual activation alert sent successfully by ${cache.accounts[_req.session.account].username}`);
        } else {
            this.Log(`${this.name}.Manual : ${cache.accounts[_req.session.account].username} cleared manual activation alert (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`);
            this.PrintLog(`${this.name}.Manual`, `Manual activation alert cleared by ${cache.accounts[_req.session.account].username}`);
        }
        Routes.SyncClients(false)
    }

    /**
      * @function CreateNotification
      * @description Handles the creation or clearing of a broadcast notification. 
      * It first checks if the requestor has a valid session. If the session is valid, 
      * it processes the notification data. If both title and message are provided, 
      * it creates a notification and updates the cache with the notification details. 
      * If either title or message is missing, it clears the notification from the cache.
      * It then logs the action and sends a response to the client indicating success or failure.
      * 
      * @async
      * @param {Object} _req 
      * The incoming HTTP request object containing the session data and notification details.
      * 
      * @param {Object} _res 
      * The HTTP response object used to send the appropriate response to the client.
      * 
      * @returns {void}
      * A Promise that resolves after the notification has been created or cleared, 
      * logged, and client data synced.
      * 
      * **Behavior includes:**
      * - Verifying that the requestor has a valid session.
      * - Parsing the notification data (title and message).
      * - Creating or clearing the notification in the cache based on the provided data.
      * - Logging the creation or clearing of the notification.
      * - Sending a response to the client indicating the result of the operation.
      * - Syncing the client data after the operation.
      */

    async CreateNotification(_req, _res) {
        let account = await Routes._DoesRequestHaveSession(_req);
        if (!account) {
            Routes._GiveResponseToSession(_req, _res, { code: 403, message: `You do not have permission to access this resource.` });
            return;
        }
        let body = JSON.parse(await new Promise((resolve, reject) => {
            let body = ``;
            _req.on(`data`, (data) => { body += data; });
            _req.on(`end`, () => { resolve(body); });
        }));
        let title = body.title;
        let message = body.message;
        if (message != '' && title != '') {
            cache.alerts.broadcasts = { title: title, message: message };
            Routes._GiveResponseToSession(_req, _res, { code: 200, message: `Notification sent successfully.` });
            this.Log(`${this.name}.Notification : ${cache.accounts[_req.session.account].username} sent a notification with title: ${title} and description: ${message} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`);
            this.PrintLog(`${this.name}.Notification`, `Notification sent successfully by ${cache.accounts[_req.session.account].username} with title: ${title} and description: ${message}`);
        } else { 
            cache.alerts.broadcasts = {};
            this.Log(`${this.name}.Notification : ${cache.accounts[_req.session.account].username} cleared the notification (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`);
            this.PrintLog(`${this.name}.Notification`, `Notification cleared by ${cache.accounts[_req.session.account].username}`);
            Routes._GiveResponseToSession(_req, _res, { code: 200, message: `Notification cleared successfully.` });
        }
        Routes.SyncClients(false)
    }

    /**
      * @function CreateStatusMarker
      * @description Handles the creation or clearing of a status marker alert. 
      * It first checks if the requestor has a valid session. If the session is valid, 
      * it processes the status alert data. If the title is provided, it sets the status 
      * alert in the cache and logs the action. If the title is empty or undefined, 
      * it clears the status alert from the cache. Afterward, it sends a response to the client 
      * indicating success or failure, and syncs client data.
      * 
      * @async
      * @param {Object} _req 
      * The incoming HTTP request object containing the session data and status alert details.
      * 
      * @param {Object} _res 
      * The HTTP response object used to send the appropriate response to the client.
      * 
      * @returns {void}
      * A Promise that resolves after the status alert has been created or cleared, 
      * logged, and client data synced.
      * 
      * **Behavior includes:**
      * - Verifying that the requestor has a valid session.
      * - Parsing the status alert data (title).
      * - Setting or clearing the status alert in the cache based on the provided title.
      * - Logging the creation or clearing of the status alert.
      * - Sending a response to the client indicating the result of the operation.
      * - Syncing the client data after the operation.
      */


    async CreateStatusMarker(_req, _res) {
        let account = await Routes._DoesRequestHaveSession(_req);
        if (!account) {
            Routes._GiveResponseToSession(_req, _res, { code: 403, message: `You do not have permission to access this resource.` });
            return;
        }
        let body = JSON.parse(await new Promise((resolve, reject) => {
            let body = ``;
            _req.on(`data`, (data) => { body += data; });
            _req.on(`end`, () => { resolve(body); });
        }));
        let title = body.title;
        if (title != "" && title != undefined) {
            cache.alerts.status = title;
            this.Log(`${this.name}.Status : ${cache.accounts[_req.session.account].username} sent status alert with title: ${title} (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`);
            this.PrintLog(`${this.name}.Status`, `Status alert sent successfully by ${cache.accounts[_req.session.account].username} with title: ${title}`);
            Routes._GiveResponseToSession(_req, _res, { code: 200, message: `Status alert sent successfully.` });
        } else {
            cache.alerts.status = "";
            this.Log(`${this.name}.Status : ${cache.accounts[_req.session.account].username} cleared status alert (IP: ${_req.connection.remoteAddress}, UA: ${_req.headers['user-agent']})`);
            this.PrintLog(`${this.name}.Status`, `Status alert cleared by ${cache.accounts[_req.session.account].username}`);
            Routes._GiveResponseToSession(_req, _res, { code: 200, message: `Status alert cleared successfully.` });
        }
        Routes.SyncClients(false)
    }
}

module.exports = Hooks
