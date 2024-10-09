
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


let layout = {}

layout.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded Stream Functions`)
    if (window.location.pathname == `/portable`) {
        api.streaming(false)
    }else{
        api.streaming(true)
    }
}
layout.execute = async function() {
    cache.warnings = JSON.parse(await api.request(`/api/warnings`))
    cache.watches = JSON.parse(await api.request(`/api/watches`))
    cache.alerts = JSON.parse(await api.request(`/api/alerts`))
    cache.broadcasts = JSON.parse(await api.request(`/api/notifications`))
    cache.manual = JSON.parse(await api.request(`/api/manual`))
    cache.config = JSON.parse( await api.request(`/api/configurations`))
    if (cache.streaming) { 
        if (cache.broadcasts.length != 0) {
            let notificaitonbox = document.getElementById('notificationBox');
            let notificationtitle = document.getElementById('warning_title');
            let notificationmessage = document.getElementById('warning_subtitle');
            notificaitonbox.style.display = 'block';
            notificationtitle.innerHTML = cache.broadcasts.title;
            notificationmessage.innerHTML = cache.broadcasts.message;
        } else { 
            let notificaitonbox = document.getElementById('notificationBox');
            notificaitonbox.style.display = 'none';
        }
    }
    if (cache.manual.length != 0) { 
        let event = cache.manual.eventName
        let description = cache.manual['eventDescription']
        let type = cache.manual['messageType']
        let ignored = cache.manual['ignoreWarning']
        if (ignored != true) {
            cache.alerts.push(cache.manual)
            let inQueue = cache.queue.find(x => x.eventName == event && x.eventDescription == description && x.messageType == type)
            if (event.includes(`Warning`)) {cache.warnings.push(cache.manual)}
            if (event.includes(`Watch`)) {cache.watches.push(cache.manual)}
            if (event.includes(`Tornado Emergency`) || event.includes(`Flash Flood Emergency`) || event.includes(`Particularly Dangerous Situation`)) {
                cache.warnings.push(cache.manual)
            }
            if (inQueue == undefined && cache.latestManual != event + description + type + cache.manual.location) {
                cache.latestManual = event + description + type + cache.manual.location
                cache.queue.push(cache.manual)
            }
        }
    }
    if (cache.alerts.length != 0) {
        for (let i = 0; i < cache.alerts.length; i++) {
            let alert = cache.alerts[i]
            let event = alert.eventName
            let description = alert.eventDescription
            let type = alert.messageType
            let issued = alert.issued
            let expires = alert.expires
            let ignored = alert.ignoreWarning
            if (ignored == true) {continue}
            let duplicate = cache.lastQueries.find(x => x.eventName == event && x.eventDescription == description && x.messageType == type && x.issued == issued && x.expires == expires)
            let time = new Date().getTime() / 1000
            let check = time - new Date(issued).getTime() / 1000;
            if (check > 8 && check < 600 && duplicate == undefined) {
                cache.queue.push(alert)
                cache.lastQueries.push(alert)
            } else { 
                if (duplicate && check > 1600) {
                    let index = cache.lastQueries.indexOf(duplicate)
                    if (index > -1) {
                        cache.lastQueries.splice(index, 1)
                    }
                }
            }
        }
        api.query(cache.queue)
        if (cache.streaming) { 
            api.colortables(cache.warnings, cache.watches, cache.alerts);
            api.time()
            api.listings(cache.warnings, cache.watches, cache.alerts);
        }
    }
}
layout.config = async function() {
    cache.config = JSON.parse( await api.request(`/api/configurations`))
    setTimeout(() => {
        api.isMobile()
        if (cache.streaming) {
            document.getElementById('random_alert').innerHTML = `<p>Syncing Server</p>`;
            document.getElementById('random_alert_topic').innerHTML = `<p>Syncing Server</p>`;
            document.getElementById('total_warnings').innerHTML = `<h2>Syncing Server</h2>`;
            document.getElementById('random_alert_topic_expire').innerHTML = `<p>Syncing Server</p>`;
        }
    }, 1)
    if (cache.streaming) {setInterval(() => { api.time() }, 100);}
    setInterval(async () => {
        if (new Date().getSeconds() % cache.config['query:rate'] == 0) {
            if (cache.query) {return}
            cache.query = true
            setTimeout(() => {cache.query = false}, 1000)
            cache.config = JSON.parse( await api.request(`/api/configurations`))
            layout.execute()
        }
    }, 200);
}
