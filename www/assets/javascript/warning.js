
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

let warning = {}
warning.cache = {}
warning.cache.alerts = []

warning.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded Warning Functions`)
}
warning.execute = async function() { 
    try {
        let active = JSON.parse(await library.request(`/api/alerts`))
        let manual = JSON.parse(await library.request(`/api/manual`))
        cache.config = JSON.parse( await library.request(`/api/configurations`))
        warning.cache.alerts = []
        for (let i = 0; i < active.length; i++) {
            let alert = active[i]
            warning.cache.alerts.push(alert) 
        }
        if (manual.length != 0) {warning.cache.alerts.push(manual)}  
        document.getElementById("uialert").innerHTML = `<tr><th>Type<hr></th><th>Location<hr></th></tr>`
        for (let i = 0; i < warning.cache.alerts.length; i++) {
            if (i == 20) { break }
            let alert = warning.cache.alerts[i]
            let table = document.getElementById("uialert")
            let row = table.insertRow(-1)
            let cell1 = row.insertCell(0)
            let cell2 = row.insertCell(1)
            cell1.innerHTML = alert.details.name.substring(0, 30);
            cell2.innerHTML = alert.details.locations.substring(0, 20);
        }
        if (warning.cache.alerts.length > 20) {
            let table = document.getElementById("uialert")
            let row = table.insertRow(-1)
            let cell1 = row.insertCell(0)
            let cell2 = row.insertCell(1)
            cell1.innerHTML = "..."
            cell2.innerHTML = `+${warning.cache.alerts.length - 20} more`
        }
    } catch (error) {console.log(error)}
}

warning.config = async function() {
    cache.config = JSON.parse( await library.request(`/api/configurations`))
    let table = document.getElementById("uialert")
    table.innerHTML = `<tr><th>Type<hr></th><th>Location<hr></th></tr>`
    setInterval(async () => {
        if (new Date().getSeconds() % cache.config['query:rate'] == 0) {
            if (cache.query) {return}
            cache.query = true
            setTimeout(() => {cache.query = false}, 1000)
            cache.config = JSON.parse( await library.request(`/api/configurations`))
            warning.execute();
        }
    }, 100);
}

warning.config()