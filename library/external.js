
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
functions.init = function () {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded NWS Functions`)
}

functions.is_cancelled = function (description) {
    if (description.includes('has been cancelled')) { return true }
    if (description.includes('will be allowed to expire')) { return true }
    if (description.includes('has diminished')) { return true }
    return false
}
functions.does_exist = function (arr, id) {
    let find = arr.filter(alert => alert['id'] == id)
    if (find == undefined || find.length == 0) { return false }
    return true
}
functions.custom_filter = function (data) {
    let forecastOffice = cache.configurations['application:api']['primary:api']['nws:api']['nws:forecastoffice']
    let sameCode = cache.configurations['application:api']['primary:api']['nws:api']['nws:same']
    let zones = cache.configurations['application:api']['primary:api']['nws:api']['nws:zone']
    if (forecastOffice.length != 0) { data = data.filter(alert => forecastOffice.includes(alert['properties']['senderName'])) }
    if (sameCode.length != 0) { data = data.filter(alert => alert['properties']['geocode']['SAME'].some(code => sameCode.includes(code))) }
    if (zones.length != 0) { data = data.filter(alert => alert['properties']['geocode']['UGC'].some(code => zones.includes(code))) }
    return data
}
functions.generic_filter = function (data) {
    let permittedEvents = cache.configurations['request:settings']['request:outbreakmode'] ? cache.configurations['request:settings']['request:outbreakalerts'] : cache.configurations['request:settings']['request:allalerts']
    let filter = data.filter(alert => permittedEvents.includes(alert['properties']['event'])).filter(alert => new Date(alert['properties']['expires']).getTime() / 1000 > new Date().getTime() / 1000)
    let warnings = filter.filter(alert => alert['properties']['event'].includes('Warning'))
    let watches = filter.filter(alert => alert['properties']['event'].includes('Watch'))
    let unknown = filter.filter(alert => !alert['properties']['event'].includes('Warning') && !alert['properties']['event'].includes('Watch'))
    return { warnings: warnings, watches: watches, unknown: unknown }
}


functions.extract = function (body) {
    return new Promise(async (resolve, reject) => {
        let lines = body.split('\n')
        lines = lines.filter(line => line.length > 0)
        /*  this is an example of what formatss warnings.cod.edu & warnings.allisonhouse.com use for this index, we can parse this and only look for new non cached data:
            <tr><td valign="top">&nbsp;</td><td><a href="2025031512.TOR">2025031512.TOR</a>         </td><td align="right">2025-03-15 12:22  </td><td align="right">1.5K</td><td>&nbsp;</td></tr>
        */
        let regex = /<a href="(.*)">(.*)<\/a>.*<td align="right">(.*)<\/td>.*<td align="right">(.*)<\/td>/ // Should work for both sites since they are using /index format
        let alerts = []
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]
            let match = line.match(regex)
            if (match != null) {
                let dID = match[1]
                let tDate = match[3]
                let tSize = match[4]
                let tName = dID.split('.')[0]
                if (isNaN(tName)) { continue }
                alerts.push({ id: dID, date: tDate, size: tSize })
            }
        }
        alerts.sort((a, b) => new Date(a.date) - new Date(b.date))
        alerts = alerts.slice(alerts.length - 25)
        resolve(alerts)
    })
}

functions.download = function (data, api) {
    return new Promise(async (resolve, reject) => {
        let alerts = []
        for (let i = 0; i < data.length; i++) {
            let dLink = `${api}/${data[i].id}`
            let details = { url: dLink, headers: { 'User-Agent': cache.configurations['application:information']['application:useragent'], 'Accept': 'application/geo+json', 'Accept-Language': 'en-US' } }
            try {
                await axios.get(details.url, { headers: details.headers, timeout: 1000 }).then((response) => {
                    let data = response.data
                    let error = response.error
                    let statusCode = response.status
                    let values = {}
                    let chunks = 0
                    if (error != undefined) { return }
                    if (data == undefined) { return }
                    if (statusCode != 200) { return }
                    data = data.split('\n')
                    for (let i = 0; i < data.length; i++) {
                        let line = data[i]
                        if (line.length == 0) { continue }
                        if (line.includes('$$')) { chunks++ }
                        values[chunks] = values[chunks] == undefined ? line : values[chunks] + '\n' + line
                    }
                    alerts.push({ id: dLink, values: values })
                })
            } catch (error) { console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Failed to download alert: ${error}`) }
        }
        resolve(alerts)
    })
}

functions.parser = function (data) {
    return new Promise((resolve, reject) => {
        let alerts = [];
        let tCache = {}
        tCache.features = []
        let permittedEvents = cache.configurations['request:settings']['request:outbreakmode'] ? cache.configurations['request:settings']['request:outbreakalerts'] : cache.configurations['request:settings']['request:allalerts']
        for (let i = 0; i < data.length; i++) {
            let parent = data[i].values
            let children = Object.keys(parent)
            let paragraphs = []
            for (let i = 0; i < children.length; i++) {
                let chunk = parent[children[i]]
                let lines = chunk.split('\n')
                let paragraph = ''
                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i]
                    if (line.includes('$$')) { continue }
                    paragraph = paragraph + line + '\n'
                }
                paragraphs.push(paragraph)
            }
            let latest = paragraphs[paragraphs.length - 2]
            alerts.push({ id: data[i].id, values: latest })
        }
        for (let i = 0; i < alerts.length; i++) {
            let events = permittedEvents.filter(event => new RegExp(event, 'i').test(alerts[i].values));
            let tNaderDetection = alerts[i].values.includes('TORNADO...') ? alerts[i].values.split('TORNADO...')[1].split('\n')[0].trim() : 'N/A';
            let tHailDetection = alerts[i].values.includes('HAIL THREAT...') ? alerts[i].values.split('HAIL THREAT...')[1].split('\n')[0].trim() : 'N/A';
            let tWindDetection = alerts[i].values.includes('WIND THREAT...') ? alerts[i].values.split('WIND THREAT...')[1].split('\n')[0].trim() : 'N/A';
            let tMaxHailSize = alerts[i].values.includes('MAX HAIL SIZE...') ? alerts[i].values.split('MAX HAIL SIZE...')[1].split('\n')[0].trim() : 'N/A';
            let tMaxWindSpeed = alerts[i].values.includes('MAX WIND GUST...') ? alerts[i].values.split('MAX WIND GUST...')[1].split('\n')[0].trim() : 'N/A';
            let tIssued = alerts[i].values.includes('At ') ? alerts[i].values.split('At ')[1].split(',')[0].trim() : 'N/A';
            let tLocation = alerts[i].values.includes('LOCATION...') ? alerts[i].values.split('LOCATION...')[1].split('\n')[0].trim() : 'N/A';
            if (events.length == 0) { continue }
            let parsedEvents = events[0]
            let build = { 
                id: alerts[i].id, 
                properties: { 
                    "areaDesc": tLocation,
                    "expires": new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
                    "sent": tIssued,
                    "messageType": "Alert", 
                    "event": parsedEvents, 
                    "sender": "N/A", 
                    "senderName": "N/A", 
                    "description": alerts[i].values, 
                    "parameters": { 
                        "tornado": tNaderDetection, 
                        "hail": tHailDetection, 
                        "wind": tWindDetection, 
                        "maxHailSize": tMaxHailSize, 
                        "maxWindSpeed": tMaxWindSpeed 
                    } 
                }
            }
            tCache.features.push(build)
        }
        resolve(tCache)
    });
}


functions.build = function (data) {
    try {
        let tCacheActive = []
        let tCacheWarnings = []
        let tCacheWatches = []
        let tCacheReports = []
        if (data.nws != undefined && data.nws.features.length > 0) {
            let nws = data.nws
            let customFiltering = functions.custom_filter(nws['features'])
            let { warnings, watches, unknown } = functions.generic_filter(customFiltering)
            for (let i = 0; i < watches.length; i++) { // Watches
                let alert = watches[i]
                if (alert['properties']['description'] != null) {
                    if (functions.is_cancelled(alert['properties']['description'])) { continue }
                }
                if (functions.does_exist(tCacheWatches, alert['id'])) { continue }
                let tData = core.functions.register(alert)
                if (Object.keys(tData).length != 0) {
                    if (tData.details.ignored == true) { continue }
                    tCacheWatches.push(tData)
                    tCacheActive.push(tData)
                }
            }
            for (let i = 0; i < warnings.length; i++) { // Warnings
                let alert = warnings[i]
                if (alert['properties']['description'] != null) {
                    if (functions.is_cancelled(alert['properties']['description'])) { continue }
                }
                if (functions.does_exist(tCacheWarnings, alert['id'])) { continue }
                let tData = core.functions.register(alert)
                if (Object.keys(tData).length != 0) {
                    if (tData.details.ignored == true) { continue }
                    tCacheWarnings.push(tData)
                    tCacheActive.push(tData)
                }
            }
            for (let i = 0; i < unknown.length; i++) { // Does haven't a defined warning/watch string in the eventName
                let alert = unknown[i]
                if (alert['properties']['description'] != null) {
                    if (functions.is_cancelled(alert['properties']['description'])) { continue }
                }
                if (functions.does_exist(tCacheWarnings, alert['id'])) { continue }
                let tData = core.functions.register(alert)
                if (Object.keys(tData).length != 0) {
                    if (tData.details.ignored == true) { continue }
                    tCacheWarnings.push(tData)
                    tCacheActive.push(tData)
                }
            }
        }
        if (data.reports != undefined && data.reports.features.length > 0) {
            let reports = data.reports.features
            for (let i = 0; i < reports.length; i++) {
                let properties = reports[i].properties
                if (properties['remark'] == undefined) { properties['remark'] = 'No Description' }
                if (properties['magf'] == undefined) { properties['magf'] = 'N/A'; properties['unit'] = '' }
                let expires = properties['valid'] = properties['valid'].replace('T', ' ').replace('Z', '')
                let sent = new Date().toISOString()
                let build = { id: "n/a", properties: { "areaDesc": properties['county'] + ', ' + properties['state'], "expires": expires, "sent": sent, "messageType": "Alert", "event": properties['typetext'], "sender": "reported", "senderName": properties['source'], "description": properties['remark'] + ' - ' + properties['city'], "parameters": {} }, value: properties['magf'] + ' ' + properties['unit'], lat: properties['lat'], lon: properties['lon'] }
                let tData = core.functions.register(build)
                if (Object.keys(tData).length != 0) {
                    if (tData.details.ignored == true) { continue }
                    tCacheReports.push(tData)
                }
            }
        }
        if (data.generic != undefined && data.generic.features.length > 0) {
            let generic = data.generic.features
            let customFiltering = functions.custom_filter(generic)
            let { warnings, watches, unknown } = functions.generic_filter(customFiltering)
            for (let i = 0; i < watches.length; i++) { // Watches
                let alert = watches[i]
                if (functions.is_cancelled(alert['properties']['description'])) { continue }
                if (functions.does_exist(tCacheWatches, alert['id'])) { continue }
                let tData = core.functions.register(alert)
                if (Object.keys(tData).length != 0) {
                    if (tData.details.ignored == true) { continue }
                    tCacheWatches.push(tData)
                    tCacheActive.push(tData)
                }
            }
            for (let i = 0; i < warnings.length; i++) { // Warnings
                let alert = warnings[i]
                if (functions.is_cancelled(alert['properties']['description'])) { continue }
                if (functions.does_exist(tCacheWarnings, alert['id'])) { continue }
                let tData = core.functions.register(alert)
                if (Object.keys(tData).length != 0) {
                    if (tData.details.ignored == true) { continue }
                    tCacheWarnings.push(tData)
                    tCacheActive.push(tData)
                }
            }
            for (let i = 0; i < unknown.length; i++) { // Does haven't a defined warning/watch string in the eventName
                let alert = unknown[i]
                if (alert['properties']['description'] != null) {
                    if (functions.is_cancelled(alert['properties']['description'])) { continue }
                }
                if (functions.does_exist(tCacheWarnings, alert['id'])) { continue }
                let tData = core.functions.register(alert)
                if (Object.keys(tData).length != 0) {
                    if (tData.details.ignored == true) { continue }
                    tCacheWarnings.push(tData)
                    tCacheActive.push(tData)
                }
            }

        }
        cache.alerts.active = tCacheActive
        cache.alerts.warnings = tCacheWarnings
        cache.alerts.watches = tCacheWatches
        cache.alerts.reports = tCacheReports
        cache.alerts.random = cache.alerts.active[Math.floor(Math.random() * cache.alerts.active.length)]
        cache.alerts.active.sort((a, b) => new Date(a.details.issued) - new Date(b.details.issued))
        cache.alerts.warnings.sort((a, b) => new Date(a.details.issued) - new Date(b.details.issued))
        cache.alerts.watches.sort((a, b) => new Date(a.details.issued) - new Date(b.details.issued))
        cache.alerts.reports.sort((a, b) => new Date(a.details.expires) - new Date(b.details.expires))
        cache.alerts.active.reverse()
        cache.alerts.warnings.reverse()
        cache.alerts.watches.reverse()
        cache.alerts.reports.reverse()
    } catch (error) { console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Failed to build alerts: ${error}`) }
}
functions.request = function (url) {
    return new Promise(async (resolve, reject) => {
        let details = { url: url, headers: { 'User-Agent': cache.configurations['application:information']['application:useragent'], 'Accept': 'application/geo+json', 'Accept-Language': 'en-US' } }
        try {
            await axios.get(details.url, { headers: details.headers, timeout: 1000 }).then((response) => {
                let data = response.data
                let error = response.error
                let statusCode = response.status
                if (error != undefined) { resolve([]) }
                if (data == undefined) { resolve([]) }
                if (statusCode != 200) { resolve([]) }
                resolve(data)
            })
        } catch (error) { resolve([]) }
    })
}


class external { constructor() { this.functions = functions } }
module.exports = external;
