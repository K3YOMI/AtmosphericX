
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
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded Web Functions`)
}
functions.forbidden = async function(req, res, message=`You are not authorized to access this resource.`) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Forbidden', message: message}));
}
functions.internal = async function(req, res, message=`An error occurred while processing your request.`) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error', message: message}));
}
functions.success = async function(req, res, message=`Request processed successfully.`) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'success', message: message }));
}
functions.dashboard = async function(req, res) { // Handles the dashboard request (GET)
    try {
        if (req.session.account == undefined) {res.redirect('/'); return;}
        res.sendFile(path.join(__dirname, `../www/dashboard/index.html`))
    } catch (error) { functions.internal(req, res, error); return;}
}

class web {constructor() {this.functions = functions}}
module.exports = web;