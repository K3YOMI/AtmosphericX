
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
    let forecastOffice = cache.configurations['application:api']['primary:api']['nws:api']['nws:forecastoffice']
    let sameCode = cache.configurations['application:api']['primary:api']['nws:api']['nws:same']
    let zones = cache.configurations['application:api']['primary:api']['nws:api']['nws:zone']
    if (forecastOffice.length != 0) { data = data.filter(alert => forecastOffice.includes(alert['properties']['senderName'])) }
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
    try {
        cache.alerts.active = []
        cache.alerts.warnings = []
        cache.alerts.watches = []
        cache.alerts.reports = []
        if (data.nws != undefined && data.nws['features'].length > 0) {
            let nws = data.nws
            let customFiltering = functions.customfilter(nws['features'])
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
        }

        if (data.iem != undefined && data.iem['features'].length > 0) {
            let iem = data.iem.features
            for (let i = 0; i < iem.length; i++) {
                let alert = iem[i]
                let event = alert.properties.ps 
                let issued = alert.properties.issue
                let expired = alert.properties.expire
                let emergency = alert.properties.is_emergency
                let pds = alert.properties.is_pds
                let dmgtag = alert.properties.damagetag 
                let windtag = alert.properties.windtag
                let hailtag = alert.properties.hailtag
                let windThreat = alert.properties.windthreat
                let hailThreat = alert.properties.hailthreat
                let description = '--- no default description ---'
                if (event == 'Tornado Warning' && emergency == true) {description = 'Tornado Emergency - No Addtional Information'}
                if (event == 'Tornado warning' && pds == true) {description = 'Particularly Dangerous Situation - Tornado Warning'}
                if (event == 'Flash Flood Warning' && emergency == true) {description = 'Flash Flood Emergency - No Addtional Information'}
                if (event == 'Flash Flood warning' && pds == true) {description = 'Particularly Dangerous Situation - Flash Flood Warning'}
                let build = {
                    id: "n/a",
                    properties: {
                        "areaDesc": properties['county'] + ', ' + properties['state'],
                        "expires": expires,
                        "sent": sent,
                        "messageType": "Alert",
                        "event": alert.properties.ps,
                        "sender": "reported",
                        "senderName": properties['source'],
                        "description": properties['remark'] + ' - ' + properties['city'],
                        "parameters": {}
                    },
                }
            }
        }


        if (data.reports != undefined && data.reports.features.length > 0) {
            let reports = data.reports.features
            for (let i = 0; i < reports.length; i++) { 
                let properties = reports[i].properties
                if (properties['remark'] == undefined) {properties['remark'] = 'No Description'}
                if (properties['magf'] == undefined) {properties['magf'] = 'N/A'; properties['unit'] = ''}
                let expires = properties['valid'] = properties['valid'].replace('T', ' ').replace('Z', '')
                let sent = new Date().toISOString()
                let build = {id: "n/a",properties: {"areaDesc": properties['county'] + ', ' + properties['state'],"expires": expires,"sent": sent,"messageType": "Alert","event": properties['typetext'],"sender": "reported","senderName": properties['source'],"description": properties['remark'] + ' - ' + properties['city'],"parameters": {}}, value: properties['magf'] + ' ' + properties['unit'], lat: properties['lat'], lon: properties['lon']}
                let tData = core.functions.register(build)
                if (Object.keys(tData).length != 0) {
                    cache.alerts.reports.push(tData)
                }
            }
        }




        cache.alerts.active.sort((a, b) => new Date(a.details.issued) - new Date(b.details.issued))
        cache.alerts.warnings.sort((a, b) => new Date(a.details.issued) - new Date(b.details.issued))
        cache.alerts.watches.sort((a, b) => new Date(a.details.issued) - new Date(b.details.issued))
        cache.alerts.reports.sort((a, b) => new Date(a.details.expires) - new Date(b.details.expires))
        cache.alerts.active.reverse()
        cache.alerts.warnings.reverse()
        cache.alerts.watches.reverse()
        cache.alerts.reports.reverse()
    } catch (error) {console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Failed to build alerts: ${error}`)}
}
functions.request = function(url) {
    return new Promise(async (resolve, reject) => {
        let details = {url: url ,headers: { 'User-Agent': cache.configurations['application:information']['application:useragent'],'Accept': 'application/geo+json','Accept-Language': 'en-US'}}
        try {
            await axios.get(details.url, {headers: details.headers, timeout: 5000}).then((response) => {
                let data = response.data
                let error = response.error
                let statusCode = response.status
                if (error != undefined) {resolve([])}
                if (data == undefined) {resolve([])}
                if (statusCode != 200) {resolve([])}
                resolve(data)
            })
        } catch (error) { resolve([]) }
    })
}


class external {constructor() {this.functions = functions}}
module.exports = external;
