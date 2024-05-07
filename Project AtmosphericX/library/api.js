

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
                    if (response.statusCode !== 200) {
                        toolsConstructor.log(`An error occured while fetching data from api.weather.gov/alerts/active`)
                        toolsConstructor.log(`Error: ${response.statusCode} - ${response.statusMessage}`); 
                        return; 
                    }
                    let weatherData = JSON.parse(body)
                    let whitelistedEvents = []
                    if (configurations['OUTBREAK_ONLY'] == "true") {
                        whitelistedEvents = JSON.parse(configurations['MAJOR_ALERTS'])
                    }else{
                        whitelistedEvents = JSON.parse(configurations['ALL_ALERTS'])
                    }
                    let isWhiteListed = weatherData['features'].filter(alert => whitelistedEvents.includes(alert['properties']['event']))
                    let withinTime = isWhiteListed.filter(alert => new Date(alert['properties']['expires']).getTime() / 1000 > new Date().getTime() / 1000)
                    let warnings = withinTime.filter(alert => alert['properties']['event'].includes('Warning'))
                    let watches = withinTime.filter(alert => alert['properties']['event'].includes('Watch'))
                    let doesntInclude = withinTime.filter(alert => !alert['properties']['event'].includes('Warning') && !alert['properties']['event'].includes('Watch'))
                    for (let i = 0; i < watches.length; i++) {
                        let alert = watches[i]
                        if (alert['properties']['description'].includes('will be allowed to expire')) {continue}
                        let newData = formatConstructor.registerEvent(alert)
                        let find_watch = active_total_watches.filter(watch => watch['id'] == alert['id'])
                        if (find_watch == undefined || find_watch.length == 0) {
                            active_total_watches.push(newData)
                        }
                        generic_data.push(newData)
                    }
                    for (let i = 0; i < warnings.length; i++) {
                        let alert = warnings[i]
                        if (alert['properties']['description'].includes('will be allowed to expire')) {continue}
                        let newData = formatConstructor.registerEvent(alert)
                        let find_warning = active_total_warnings.filter(warning => warning['id'] == alert['id'])
                        if (find_warning == undefined || find_warning.length == 0) {
                            active_total_warnings.push(newData)
                        }
                        generic_data.push(newData)
                    }
                    for (let i = 0; i < doesntInclude.length; i++) {
                        let alert = doesntInclude[i]
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
                    if (response.statusCode !== 200) {
                        toolsConstructor.log(`An error occured while fetching data from api.weather.gov/alerts`)
                        toolsConstructor.log(`Error: ${response.statusCode} - ${response.statusMessage}`); 
                        return; 
                    }
                    let weatherData = JSON.parse(body)
                    let whitelistedEvents = []
                    if (configurations['OUTBREAK_ONLY'] == "true") {whitelistedEvents = JSON.parse(configurations['MAJOR_ALERTS'])}else{whitelistedEvents = JSON.parse(configurations['ALL_ALERTS'])}
                    let isWhiteListed = weatherData['features'].filter(alert => whitelistedEvents.includes(alert['properties']['event']))
                    let withinTime = isWhiteListed.filter(alert => new Date(alert['properties']['expires']).getTime() / 1000 > new Date().getTime() / 1000)
                    let warnings = withinTime.filter(alert => alert['properties']['event'].includes('Warning'))
                    let watches = withinTime.filter(alert => alert['properties']['event'].includes('Watch'))
                    for (let i = 0; i < watches.length; i++) {
                        let alert = watches[i]
                        if (alert['properties']['description'].includes('will be allowed to expire')) {continue}
                        let newData = formatConstructor.registerEvent(alert)
                        let find_watch = active_total_watches.filter(watch => watch['id'] == alert['id'])
                        if (find_watch == undefined || find_watch.length == 0) {
                            active_total_watches.push(newData)
                        }
                        generic_data.push(newData)
                    }
                    for (let i = 0; i < warnings.length; i++) {
                        let alert = warnings[i]
                        if (alert['properties']['description'].includes('will be allowed to expire')) {continue}
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
        })
    }
}


module.exports = api;
