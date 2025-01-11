
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
    Version: 5.5.2                              
*/

let functions = {}
functions.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded NWS Functions`)
}

functions.isCancelled = function(description) {
    if (description.includes('has been cancelled')) {return true}
    if (description.includes('will be allowed to expire')) {return true}
    if (description.includes('has diminished')) {return true}
    return false
}
functions.doesExist = function(arr, id) {
    let find = arr.filter(alert => alert['id'] == id)
    if (find == undefined || find.length == 0) {return false}
    return true
}
functions.customfilter = function(data) {
    let forecastOffice = cache.configurations['application:information']['application:forecastoffice']
    let sameCode = cache.configurations['application:information']['application:same']
    let zones = cache.configurations['application:information']['application:zones']
    if (forecastOffice != "" && forecastOffice != "N/A") { data = data.filter(alert => alert['properties']['senderName'] == forecastOffice) }
    if (sameCode.length != 0) { data = data.filter(alert => alert['properties']['geocode']['SAME'].some(code => sameCode.includes(code))) }
    if (zones.length != 0) { data = data.filter(alert => alert['properties']['geocode']['UGC'].some(code => zones.includes(code))) }
    return data
}
functions.genericFilter = function(data) {
    let permittedEvents = cache.configurations['request:settings']['request:outbreakmode'] ? cache.configurations['request:settings']['request:outbreakalerts'] : cache.configurations['request:settings']['request:allalerts']
    let filter = data.filter(alert => permittedEvents.includes(alert['properties']['event'])).filter(alert => new Date(alert['properties']['expires']).getTime() / 1000 > new Date().getTime() / 1000)
    let warnings = filter.filter(alert => alert['properties']['event'].includes('Warning'))
    let watches = filter.filter(alert => alert['properties']['event'].includes('Watch'))
    let unknown = filter.filter(alert => !alert['properties']['event'].includes('Warning') && !alert['properties']['event'].includes('Watch'))
    return {warnings: warnings, watches: watches, unknown: unknown}
}

functions.build = function(data) {
    cache.alerts.active = []
    cache.alerts.warnings = []
    cache.alerts.watches = []
    let customFiltering = functions.customfilter(data['features'])
    let {warnings, watches, unknown} = functions.genericFilter(customFiltering)
    for (let i = 0; i < watches.length; i++) { // Watches
        let alert = watches[i]
        if (functions.isCancelled(alert['properties']['description'])) {continue}
        if (functions.doesExist(cache.alerts.watches, alert['id'])) {continue}
        let tData = core.functions.register(alert)
        if (Object.keys(tData).length != 0) {
            cache.alerts.watches.push(tData)
            cache.alerts.active.push(tData)
        }
    } 
    for (let i = 0; i < warnings.length; i++) { // Warnings
        let alert = warnings[i]
        if (functions.isCancelled(alert['properties']['description'])) {continue}
        if (functions.doesExist(cache.alerts.warnings, alert['id'])) {continue}
        let tData = core.functions.register(alert)
        if (Object.keys(tData).length != 0) {
            cache.alerts.warnings.push(tData)
            cache.alerts.active.push(tData)
        }
    }
    for (let i = 0; i < unknown.length; i++) { // Does haven't a defined warning/watch string in the eventName
        let alert = unknown[i]
        if (alert['properties']['description'] != null) {
            if (functions.isCancelled(alert['properties']['description'])) {continue}
        }
        if (functions.doesExist(cache.alerts.warnings, alert['id'])) {continue}
        let tData = core.functions.register(alert)
        if (Object.keys(tData).length != 0) {
            cache.alerts.warnings.push(tData)
            cache.alerts.active.push(tData)
        }
    }
    cache.alerts.active.sort((a, b) => new Date(a['issued']) - new Date(b['issued']))
    cache.alerts.warnings.sort((a, b) => new Date(a['issued']) - new Date(b['issued']))
    cache.alerts.watches.sort((a, b) => new Date(a['issued']) - new Date(b['issued']))
    cache.alerts.active.reverse()
    cache.alerts.warnings.reverse()
    cache.alerts.watches.reverse()
}

functions.request = function(url) {
    return new Promise(async (resolve, reject) => {
        let details = {url: url ,headers: { 'User-Agent': cache.configurations['application:information']['application:useragent'],'Accept': 'application/geo+json','Accept-Language': 'en-US'}}
        try {
            await axios.get(details.url, {headers: details.headers}).then((response) => {
                let data = response.data
                let error = response.error
                let statusCode = response.status
                if (error != undefined) {return;}
                if (data == undefined) {return;}
                if (statusCode != 200) {return;}
                functions.build(data)
            })
        } catch (error) { 
            console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Error: ${error.stack}`)
        }
    })
}


class nws {constructor() {this.functions = functions}}
module.exports = nws;
