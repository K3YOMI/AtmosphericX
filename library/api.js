let whitelistedEvents = [
    'Flash Flood Watch',
    'Severe Thunderstorm Watch',
    'Tornado Watch',
    'Special Marine Warning',
    'Flash Flood Warning',
    'Severe Thunderstorm Warning',
    'Tornado Warning',
    'Snow Squall Warning'
];



class api {
    constructor() {
        console.log(`[AtmosphericX Library] >> Loaded API Manager`);
        this.api = "returned from api.js";
    }
    requestActive() {
        return new Promise(async (resolve, reject) => {
            let active = {url: `https://api.weather.gov/alerts/active`, method: 'GET',headers: { 'User-Agent': configurations['USER_AGENT'],'Accept': 'application/geo+json','Accept-Language': 'en-US'}}
            await req(active, (error, response, body) => {
                try {
                    if (error) { toolsConstructor.log(`Error: ${error.message}`); return; }
                    active_total_warnings = []
                    active_total_watches = []
                    generic_data = []
                    if (body == undefined) { toolsConstructor.log('No data recieved from api.weather.gov/alerts/active'); return;}
                    let weatherData = JSON.parse(body)
                    let isWhiteListed = weatherData['features'].filter(alert => whitelistedEvents.includes(alert['properties']['event']))
                    let withinTime = isWhiteListed.filter(alert => new Date(alert['properties']['expires']).getTime() / 1000 > new Date().getTime() / 1000)
                    let warnings = withinTime.filter(alert => alert['properties']['event'].includes('Warning'))
                    let watches = withinTime.filter(alert => alert['properties']['event'].includes('Watch'))
                    for (let i = 0; i < watches.length; i++) {
                        let alert = watches[i]
                        let newData = formatConstructor.registerEvent(alert)
                        let find_watch = active_total_watches.filter(watch => watch['id'] == alert['id'])
                        if (find_watch == undefined || find_watch.length == 0) {
                            active_total_watches.push(newData)
                        }
                        generic_data.push(newData)
                    }
                    for (let i = 0; i < warnings.length; i++) {
                        let alert = warnings[i]
                        let newData = formatConstructor.registerEvent(alert)
                        let find_warning = active_total_warnings.filter(warning => warning['id'] == alert['id'])
                        if (find_warning == undefined || find_warning.length == 0) {
                            active_total_warnings.push(newData)
                        }
                        generic_data.push(newData)
                    }
                    generic_data.sort((a, b) => new Date(a['issued']) - new Date(b['issued']))
                    active_total_warnings.sort((a, b) => new Date(a['issued']) - new Date(b['issued']))
                    active_total_watches.sort((a, b) => new Date(a['issued']) - new Date(b['issued']))
                    generic_data.reverse()
                    active_total_warnings.reverse()
                    active_total_watches.reverse()
                }catch (error) {
                    toolsConstructor.log(`Error: ${error.message}`)
                }
            })
            setTimeout(() => { this.requestActive(configurations) }, configurations['REFRESH_RATE'] * 1000)
        })
    }
    requestArchive() {
        return new Promise(async (resolve, reject) => {
            let archive = {url: `https://api.weather.gov/alerts`, method: 'GET',headers: { 'User-Agent': configurations['USER_AGENT'],'Accept': 'application/geo+json','Accept-Language': 'en-US'}}
            await req(archive, (error, response, body) => {
                try {
                    if (error) { toolsConstructor.log(`Error: ${error.message}`); return; }
                    active_total_warnings = []
                    active_total_watches = []
                    generic_data = []
                    if (body == undefined) { toolsConstructor.log('No data recieved from api.weather.gov/alerts/active'); return;}
                    let weatherData = JSON.parse(body)
                    let isWhiteListed = weatherData['features'].filter(alert => whitelistedEvents.includes(alert['properties']['event']))
                    let withinTime = isWhiteListed.filter(alert => new Date(alert['properties']['expires']).getTime() / 1000 > new Date().getTime() / 1000)
                    let warnings = withinTime.filter(alert => alert['properties']['event'].includes('Warning'))
                    let watches = withinTime.filter(alert => alert['properties']['event'].includes('Watch'))
                    for (let i = 0; i < watches.length; i++) {
                        let alert = watches[i]
                        let newData = formatConstructor.registerEvent(alert)
                        let find_watch = active_total_watches.filter(watch => watch['id'] == alert['id'])
                        if (find_watch == undefined || find_watch.length == 0) {
                            active_total_watches.push(newData)
                        }
                        generic_data.push(newData)
                    }
                    for (let i = 0; i < warnings.length; i++) {
                        let alert = warnings[i]
                        let newData = formatConstructor.registerEvent(alert)
                        let find_warning = active_total_warnings.filter(warning => warning['id'] == alert['id'])
                        if (find_warning == undefined || find_warning.length == 0) {
                            active_total_warnings.push(newData)
                        }
                        generic_data.push(newData)
                    }
                    generic_data.sort((a, b) => new Date(a['issued']) - new Date(b['issued']))
                    active_total_warnings.sort((a, b) => new Date(a['issued']) - new Date(b['issued']))
                    active_total_watches.sort((a, b) => new Date(a['issued']) - new Date(b['issued']))
                    generic_data.reverse()
                    active_total_warnings.reverse()
                    active_total_watches.reverse()
                }catch (error) {
                    toolsConstructor.log(`Error: ${error.message}`)
                }
            })
            setTimeout(() => { this.requestActive(configurations) }, configurations['REFRESH_RATE'] * 1000)
        })
    }
}


module.exports = api;
