
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
    Version: 5.0                              
*/

let functions = {}
functions.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded NWS Functions`)
}
functions.request = function(url) {
    return new Promise(async (resolve, reject) => {
        let details = {url: url ,headers: { 'User-Agent': cache.configurations['application:information']['application:useragent'],'Accept': 'application/geo+json','Accept-Language': 'en-US'}}
        try {
            await axios.get(details.url, {headers: details.headers}).then((response) => {
                let data = response.data
                let error = response.error
                let statusCode = response.status
                    if (error != undefined) { 
                        console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Error: ${error}`)
                        return; 
                    }
                    if (data == undefined) { 
                        console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Error: No Data`)
                        return;
                    }
                    if (statusCode != 200) {
                        console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Error: ${statusCode}`)
                        return;
                    }
                    cache.alerts.active = []
                    cache.alerts.warnings = []
                    cache.alerts.watches = []
                    let events = []
                    if (cache.configurations['request:settings']['request:outbreakmode'] == true) {events = (cache.configurations['request:settings']['request:outbreakalerts']) } else { events = (cache.configurations['request:settings']['request:allalerts'])}
                    let isWhiteListed = data['features'].filter(alert => events.includes(alert['properties']['event']))
                    let withinTime = isWhiteListed.filter(alert => new Date(alert['properties']['expires']).getTime() / 1000 > new Date().getTime() / 1000)
                    let warnings = withinTime.filter(alert => alert['properties']['event'].includes('Warning'))
                    let watches = withinTime.filter(alert => alert['properties']['event'].includes('Watch'))
                    let doesntInclude = withinTime.filter(alert => !alert['properties']['event'].includes('Warning') && !alert['properties']['event'].includes('Watch'))
                    for (let i = 0; i < watches.length; i++) {
                        let alert = watches[i]
                        if (alert['properties']['description'].includes('will be allowed to expire')) {continue}
                        if (alert['properties']['description'].includes('has been cancelled')) {continue}
                        if (alert['properties']['description'].includes('has diminished')) {continue}
                        let newData = core.functions.register(alert)
                        let find_watch = cache.alerts.watches.filter(watch => watch['id'] == alert['id'])
                        if (find_watch == undefined || find_watch.length == 0) {
                            if (Object.keys(newData).length != 0) {
                                cache.alerts.watches.push(newData)
                                cache.alerts.active.push(newData)
                            }
                        }
                    }
                    for (let i = 0; i < warnings.length; i++) {
                        let alert = warnings[i]
                        if (alert['properties']['description'].includes('will be allowed to expire')) {continue}
                        if (alert['properties']['description'].includes('has been cancelled')) {continue}
                        if (alert['properties']['description'].includes('has diminished')) {continue}
                        let newData = core.functions.register(alert)
                        let find_warning = cache.alerts.warnings.filter(warning => warning['id'] == alert['id'])
                        if (find_warning == undefined || find_warning.length == 0) {
                            if (Object.keys(newData).length != 0) {
                                cache.alerts.warnings.push(newData)
                                cache.alerts.active.push(newData)
                            }
                        }
                    }
                    for (let i = 0; i < doesntInclude.length; i++) {
                        let alert = doesntInclude[i]
                        if (alert['properties']['description'] != null) {
                            if (alert['properties']['description'].includes('will be allowed to expire')) {continue}
                            if (alert['properties']['description'].includes('has been cancelled')) {continue}
                            if (alert['properties']['description'].includes('has diminished')) {continue}
                        }
                        let newData = core.functions.register(alert)
                        let find_warning = cache.alerts.warnings.filter(warning => warning['id'] == alert['id'])
                        if (find_warning == undefined || find_warning.length == 0) {
                            if (Object.keys(newData).length != 0) {
                                cache.alerts.warnings.push(newData)
                                cache.alerts.active.push(newData)
                            }
                        }
                    }
                    cache.alerts.active.sort((a, b) => new Date(a['issued']) - new Date(b['issued']))
                    cache.alerts.warnings.sort((a, b) => new Date(a['issued']) - new Date(b['issued']))
                    cache.alerts.watches.sort((a, b) => new Date(a['issued']) - new Date(b['issued']))
                    cache.alerts.active.reverse()
                    cache.alerts.warnings.reverse()
                    cache.alerts.watches.reverse()
            })
        } catch (error) { 
            console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Error: ${error.stack}`)
        }
    })
}


class nws {constructor() {this.functions = functions}}
module.exports = nws;
