
class endpointManager {
    constructor() {
        console.log(`[AtmosphericX Library] >> Loaded Endpoint Manager`);
        this.format = "returned from endpoint.js";
    }
    async manualPost(req, res) {
        try {
            let body = await new Promise((resolve, reject) => {
                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => { resolve(body); });
                req.on('error', error => { reject(error); }); // Handle request error
            });
            let jsonData = JSON.parse(body);
            let newData = formatConstructor.registerEvent(jsonData)
            if (Object.keys(newData).length == 0) {
                res.statusCode = HTTP_OK;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'success', message: 'Data added to the system' }));
                return
            }
            manual_data = newData['locations'] !== "" ? newData : [];
            res.statusCode = HTTP_OK;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'success', message: 'Data added to the system' }));
        } catch (error) {
            res.statusCode = HTTP_INTERNAL_SERVER_ERROR;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({message: 'Internal Server Error'}))
            toolsConstructor.log(`[Error] [manualPost] ${error.message}`);
        }
    }
    requestDataPost(req, res) {
        try {
            if (configurations.ACTIVE_ONLY == "true") { 
                apiConstructor.requestActive();
                toolsConstructor.log('Requested latest active alerts...');
            }else{
                apiConstructor.requestArchive();
                toolsConstructor.log('Requested latest alerts...');
            }
            res.statusCode = HTTP_CREATED;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({status: 'success', message: 'Requested latest data from the system'}));
        } catch (error) {
            res.statusCode = HTTP_INTERNAL_SERVER_ERROR;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({message: 'Internal Server Error'}))
            toolsConstructor.log(`[Error] [requestDataPost] ${error.message}`);
        }
    }
    async loginPost(req, res, http_ip) {
        try {
            let body = await new Promise((resolve, reject) => {
                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => { resolve(body); });
                req.on('error', error => { reject(error); }); // Handle request error
            });
            let jsonData = JSON.parse(body);
            let username = jsonData['username']
            let password = cryptography.createHash('sha256').update(jsonData['password']).digest('base64')
            let openLogins = JSON.parse(fs.readFileSync('./users.json', 'utf8'))
            let login = false
            let finduers = openLogins.filter(user => user.username == username.toString() && user.hash == password.toString())
            if (finduers.length > 0) {
                if (finduers[0].activated == true) {
                    if (!loginAuthorization.includes(http_ip)) {
                        loginAuthorization.push(http_ip)
                    }
                    login = true
                }else{
                    res.statusCode = HTTP_FORBIDDEN;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({status: 'error', message: 'Your account is not activated yet'}))
                    return;
                }
            }
            if (login == true) {
                res.statusCode = HTTP_OK;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({status: 'success', message: `Welcome back ${username}!`}))
                return;
            }else{
                res.statusCode = HTTP_FORBIDDEN;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({status: 'error', message: 'Failed to login with the provided credentials'}))
                return;
            }
        } catch (error) {
            res.statusCode = HTTP_INTERNAL_SERVER_ERROR;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({message: 'Internal Server Error'}))
            toolsConstructor.log(`[Error] [loginPost] ${error.message}`)
        }
    }
    async registerPost(req, res) {
        try {
            let body = await new Promise((resolve, reject) => {
                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => { resolve(body); });
                req.on('error', error => { reject(error); }); // Handle request error
            });
            let jsonData = JSON.parse(body);
            let username = jsonData['username']
            let password = cryptography.createHash('sha256').update(jsonData['password']).digest('base64')
            let openLogins = JSON.parse(fs.readFileSync('./users.json', 'utf8'))
            if (openLogins.filter(user => user.username == username.toString()).length > 0) {
                res.statusCode = HTTP_FORBIDDEN
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({status: 'error', message: 'This username is already taken'}))
                return;
            }
            openLogins.push({username: username.toString(), hash: password.toString(), activated: false})
            res.statusCode = HTTP_OK;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({status: 'success', message: 'You have successfully registered - please wait for an administrator to activate your account'}))
            fs.writeFileSync('./users.json', JSON.stringify(openLogins, null, 2))
            return;
        } catch (error) {
            res.statusCode = HTTP_INTERNAL_SERVER_ERROR;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({message: 'Internal Server Error'}))
            toolsConstructor.log(`[Error] [registerPost] ${error.message}`)
        }
    }
    async newPasswordPost(req, res, http_ip) {
        try {
            let body = await new Promise((resolve, reject) => {
                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => { resolve(body); });
                req.on('error', error => { reject(error); }); // Handle request error
            });
            let jsonData = JSON.parse(body);
            let username = jsonData['username']
            let password = cryptography.createHash('sha256').update(jsonData['password']).digest('base64')
            let newPassword = cryptography.createHash('sha256').update(jsonData['newPassword']).digest('base64')
            let openLogins = JSON.parse(fs.readFileSync('./users.json', 'utf8'))
            let finduers = openLogins.filter(user => user.username == username.toString() && user.hash == password.toString() && user.activated == true)
            if (finduers.length > 0) {
                let index = openLogins.findIndex(user => user.username == username.toString())
                openLogins[index].hash = newPassword.toString()
                res.statusCode = HTTP_OK;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({status: 'success', message: 'Successfully changed password!'}))
                fs.writeFileSync('./users.json', JSON.stringify(openLogins, null, 2))
                if (loginAuthorization.includes(http_ip)) {
                    loginAuthorization.splice(loginAuthorization.indexOf(http_ip), 1)
                }
                return;
            }else{
                res.statusCode = HTTP_FORBIDDEN;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({status: 'error', message: `Faield to change password to ${username} with the provided credentials`}))
                return;
            }
        } catch (error) {
            res.statusCode = HTTP_INTERNAL_SERVER_ERROR;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({message: 'Internal Server Error'}))
            toolsConstructor.log(`[Error] [newPasswordPost] ${error.message}`);
        }
    }
    async notificationPost(req, res) {
        try {
            let body = await new Promise((resolve, reject) => {
                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => { resolve(body); });
                req.on('error', error => { reject(error); }); // Handle request error
            });
            let { title, message } = JSON.parse(body);
            if (message) {
                active_notifications = { title, message };
                res.statusCode = HTTP_CREATED;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'success', message: 'Data added to the system' }));
            } else {
                active_notifications = [];
            }
        } catch (error) {
            res.statusCode = HTTP_INTERNAL_SERVER_ERROR;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({message: 'Internal Server Error'}))
            toolsConstructor.log(`[Error] [notificationPost] ${error.message}`);
        }
    }
    requestLogoutPost(req, res, http_ip) {
        try {
            if (loginAuthorization.includes(http_ip)) {
                loginAuthorization.splice(loginAuthorization.indexOf(http_ip), 1)
                res.statusCode = HTTP_OK
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({status: 'success', message: 'Logged out'}))
                return
            }else{
                res.statusCode = HTTP_OK
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({status: 'success', message: 'Logged out'}))
                return
            }
        } catch (error) {
            res.statusCode = HTTP_INTERNAL_SERVER_ERROR
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({message: 'Internal Server Error'}))
            toolsConstructor.log(`[Error] [requestLogoutPost] ${error.message}`)
        }
    }


    loginRedirect(req, res) {
        try {
            let fs_path = path.resolve('./www/login.html')
            res.statusCode = HTTP_NOT_FOUND;
            res.end(fs.readFileSync(fs_path))
            return;
        } catch (error) {
            res.statusCode = HTTP_INTERNAL_SERVER_ERROR;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({message: 'Internal Server Error'}))
            toolsConstructor.log(`[Error] [loginRedirect] ${error.message}`)
        }
    }
    dashboardRedirect(req, res) {
        try {
            let fs_path = path.resolve('./www/dashboard/index.html')
            res.statusCode = HTTP_NOT_FOUND;
            res.end(fs.readFileSync(fs_path))
            return;
        } catch (error) {
            res.statusCode = HTTP_INTERNAL_SERVER_ERROR;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({message: 'Internal Server Error'}))
            toolsConstructor.log(`[Error] [dashboardRedirect] ${error.message}`)
        }
    }
    redirectDashboard(req, res) {
        try {
            let fs_path = path.resolve('./www/redirect.html')
            res.statusCode = HTTP_OK;
            res.end(fs.readFileSync(fs_path))
            return;
        } catch (error) {
            res.statusCode = HTTP_INTERNAL_SERVER_ERROR;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({message: 'Internal Server Error'}))
            toolsConstructor.log(`[Error] [redirectDashboard] ${error.message}`)
        }
    }
    errorRedirect(req, res) {
        try {
            let fs_path = path.resolve('./www/404.html')
            res.statusCode = HTTP_NOT_FOUND;
            res.end(fs.readFileSync(fs_path))
            return;
        } catch (error) {
            res.statusCode = HTTP_INTERNAL_SERVER_ERROR;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({message: 'Internal Server Error'}))
            toolsConstructor.log(`[Error] [errorRedirect] ${error.message}`)
        }
    }
}


module.exports = endpointManager;
