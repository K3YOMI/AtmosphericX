
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


let layout = {}

layout.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded Stream Functions`)
    if (window.location.pathname == `/portable`) {
        library.streaming(false)
    }else{
        library.streaming(true)
    }
}
layout.runaniamtions = async function() {
    return new Promise((resolve, reject) => {
        document.getElementById('random_alert').style.animation = `upToFadeOutAniamtion 0.3s linear forwards`;
        document.getElementById('random_alert_topic').style.animation = `opactity0Aniamtion 0.5s linear forwards`;
        setTimeout(() => {
            document.getElementById('random_alert').style.animation = `upToFadeInAniamtion 0.5s linear forwards`;
            document.getElementById('random_alert_topic').style.animation = `opactity100Aniamtion 0.5s linear forwards`;
            resolve()
        }, 500);
    })
}
layout.listings = async function(warnings, watches, data) {
    if (data.length == 0) { 
        document.getElementById('random_alert').innerHTML = `<p>No Active Events</p>`;
        document.getElementById('random_alert_topic').innerHTML = `<p>No Active Events</p>`;
        document.getElementById('random_alert_topic_expire').innerHTML = `<p>No Active Events</p>`;
        document.getElementById('total_warnings').innerHTML = `<h2>No Active Events</h2>`;
        return
    }
    if (data.length != 1) { await layout.runaniamtions(); }
    let random = data[Math.floor(Math.random() * data.length)];
    let topic = random.details.name; 
    let location = random.details.locations;
    let expires = random.details.expires;
    if (location.length > 90) { location = location.substring(0, 90) + '...';}
    if (topic.length > 25) { document.getElementById('random_alert_topic').style.fontSize = `25px`; } else { document.getElementById('random_alert_topic').style.fontSize = `30px`; }

    document.getElementById('random_alert').innerHTML = `<p>${(location.toUpperCase())}</p>`;
    document.getElementById('random_alert_topic').innerHTML = `<p>${topic.toUpperCase()}</p>`;
    if (expires != `N/A` && expires != undefined) { 
        document.getElementById('random_alert_topic_expire').innerHTML = `<p>${await layout.time(true, new Date(expires))}</p>`;
    } else {
        document.getElementById('random_alert_topic_expire').innerHTML = `<p>Expires: N/A</p>`;
    }
    let result = await library.request(`/api/status`)
    if (result == ``) { 
        let activeoutbreak = warnings.filter(warning => warning.details.name.includes('Tornado')).length;
        let chance = Math.floor(Math.random() * 5);
        if (warnings.length > 5 && activeoutbreak > 5) {
            document.getElementById('total_warnings').innerHTML = (chance == 3) ? `<h2>OUTBREAK</h2>` : `<p>Active Warnings: ${warnings.length}<br>Active Watches: ${watches.length}</p>`;
        } else { 
            document.getElementById('total_warnings').innerHTML = (chance == 3) ? `<h2>BREAKING WEATHER</h2>` : `<p>Active Warnings: ${warnings.length}<br>Active Watches: ${watches.length}</p>`; 
        }
    } else { 
        document.getElementById('total_warnings').innerHTML = `<h2>${result}</h2>`;
    }
}
layout.time = async function(convertTime=false, accu=0) {
    let time;
    if (accu == 0) { time = new Date() } else { time = accu }
    let formal = new Date(time.toLocaleString("en-US", { timeZone: cache.config['application:timezone'] }));
    let timezoneabr = new Date().toLocaleString("en-US", { timeZoneName: "short", timeZone: cache.config['application:timezone'] });
    let timezone = timezoneabr.split(' ')[3];
    let second = formal.getSeconds();
    let minute = formal.getMinutes();
    let hour = formal.getHours();
    let thismonth = formal.getMonth();
    let thisday = formal.getDate();
    let months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEPT","OCT","NOV","DEC"];
    if (minute < 10) {minute = "0" + minute}
    if (second < 10) {second = "0" + second}
    if (hour < 10) { hour = "0" + hour}
    if (!convertTime) {
        document.getElementById('time').innerHTML = `<p>${hour}:${minute}:${second}</p>`;
        document.getElementById('date').innerHTML = `<p>${months[thismonth]} ${thisday}</p>`;
    } else {
        // get my timezone abbreviation
        console.log(`${months[thismonth]} ${thisday} ${hour}:${minute}:${second} ${timezone}`)
        return `${months[thismonth]} ${thisday} ${hour}:${minute}:${second} ${timezone}`
    }
}
layout.colortables = async function(warnings) {
    let tore = warnings.filter(x => x.details.name == `Tornado Emergency`).length;
    let ffe = warnings.filter(x => x.details.name == `Flash Flood Emergency`).length;
    let torp = warnings.filter(x => x.details.name == `Particularly Dangerous Situation`).length;
    let tor = warnings.filter(x => x.details.name.includes(`Tornado`)).length;
    let svr = warnings.filter(x => x.details.name.includes(`Severe Thunderstorm Warning`)).length;
    let ffw = warnings.filter(x => x.details.name == `Flash Flood Warning`).length;
    let smw = warnings.filter(x => x.details.name == `Special Marine Warning`).length;
    let ssw = warnings.filter(x => x.details.name == `Snow Squall Warning`).length;
    let hur = warnings.filter(x => x.details.name == `Hurricane Warning`).length;
    let light = document.getElementsByClassName(`defaultBoxLight`)
    let dark = document.getElementsByClassName(`defaultBox`)
    let types = [
        { type: 'tore', color: { light: 'rgb(209,38,215)', dark: 'rgb(159,37,163)' }, count: tore },
        { type: 'torp', color: { light: 'rgb(249,56,54)', dark: 'rgb(203,25,25)' }, count: torp },
        { type: 'hur', color:  {light: 'rgb(249,56,54)', dark: 'rgb(203,25,25)' }, count: hur },
        { type: 'tor', color: { light: 'rgb(249,56,54)', dark: 'rgb(203,25,25)' }, count: tor },
        { type: 'ffe', color: { light: 'rgb(249,56,54)', dark: 'rgb(203,25,25)' }, count: ffe },
        { type: 'ssw', color: { light: 'rgb(249,56,54)', dark: 'rgb(203,25,25)' }, count: ssw },
        { type: 'svr', color: { light: 'rgb(224,162,42)', dark: 'rgb(255,132,1)' }, count: svr },
        { type: 'ffw', color: { light: 'rgb(102,209,60)', dark: 'rgb(73,155,40)' }, count: ffw },
        { type: 'smw', color: { light: 'rgb(28,61,181)', dark: 'rgb(42,81,224)' }, count: smw },
    ];
    let highest = types.find(type => {return type.count > 0; }) || types[types.length - 1];
    for (let x = 0; x<light.length; x++){
        light[x].style.backgroundColor = highest.color.light
    }
    for (let x = 0; x<dark.length; x++){
        dark[x].style.backgroundColor = highest.color.dark
    }
}
layout.alert = async function(animation, title, message) {
    if (cache.streaming) {
        cache.alert++
        let gifNotification = document.getElementById('gif_notification');
        if (message.length > 108) {message = message.substring(0, 100) + '...';}
        gifNotification.style.display = 'block';
        gifNotification.src = animation + "?alert=" + cache.alert;
        setTimeout(function () {
            gifNotification.style.display = 'none';
            cache.running = false;
        }, 6800);
        setTimeout(function () {
            document.getElementById('notification_title_event').innerHTML = `<div class="notification_title_event" style="animation: fade 5s linear forwards; animation-delay: 0s;">${title}</div>`;
        }, 500);
        setTimeout(function () {
            document.getElementById('notification_subtitle_event').innerHTML = `<div class="notification_subtitle_event" style="animation: fade 4.5s linear forwards;animation-delay: 0s;">${message}</div>`;
        }, 700);
    } 
}
layout.query = async function(data) { 
    if (cache.running == undefined) { cache.running = false }
    if (data.length == 0) {return }
    if (cache.running) { return }
    cache.running = true;
    let nextQuery = data.length - 1;
    let alert = data[nextQuery];
    console.log(alert)
    layout.alert(alert.metadata.gif, `${alert.details.name} (${alert.details.type})`, `${alert.details.locations}`);
    if (alert.metadata.autobeep) {
        library.play(cache.config['application:sounds']['application:beep'], false);
        if (!alert.details.onlyBeep) { await library.delay(1300); library.play(alert.metadata.audio, false); }
    } else { 
        library.play(alert.metadata.audio, false);
    }
    if (alert.metadata.eas || alert.metadata.siren) {
        await library.delay(3500);
        library.play(alert.metadata.eas ? cache.config['application:sounds']['application:eas'] : cache.config['application:sounds']['application:siren']);
    }
    if (!cache.streaming) { await library.delay(6800); cache.running = false; }
    data.pop();
}



layout.execute = async function() {
    cache.warnings = JSON.parse(await library.request(`/api/warnings`))
    cache.watches = JSON.parse(await library.request(`/api/watches`))
    cache.alerts = JSON.parse(await library.request(`/api/alerts`))
    cache.broadcasts = JSON.parse(await library.request(`/api/notifications`))
    cache.manual = JSON.parse(await library.request(`/api/manual`))
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
        if (cache.manual.details.ignored != true) {
            cache.alerts.push(cache.manual)
            let inQueue = cache.queue.find(x => x.details.name == cache.manual.details.name && x.details.description == cache.manual.details.description && x.details.type == cache.manual.details.type)
            if (cache.manual.details.name.includes(`Warning`)) {cache.warnings.push(cache.manual)}
            if (cache.manual.details.name.includes(`Watch`)) {cache.watches.push(cache.manual)}
            if (cache.manual.details.name.includes(`Tornado Emergency`) || cache.manual.details.name.includes(`Flash Flood Emergency`) || cache.manual.details.name.includes(`Particularly Dangerous Situation`)) {
                cache.warnings.push(cache.manual)
            }
            if (inQueue == undefined && cache.latestManual != cache.manual.details.name + cache.manual.details.description + cache.manual.details.type + cache.manual.details.location) {
                cache.latestManual = cache.manual.details.name + cache.manual.details.description + cache.manual.details.type + cache.manual.details.location
                cache.queue.push(cache.manual)
            }
        }
    }
    if (cache.alerts.length != 0) {
        for (let i = 0; i < cache.alerts.length; i++) {
            let alert = cache.alerts[i]
            if (alert.details.ignored == true) {continue}
            let duplicate = cache.lastQueries.find(x => x.details.name == alert.details.name && x.details.description == alert.details.description && x.details.type == alert.details.type && x.details.issued == alert.details.issued && x.details.expires == alert.details.expires)
            let time = new Date().getTime() / 1000
            let check = time - new Date(alert.details.issued).getTime() / 1000;
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
        layout.query(cache.queue)
    }
    if (cache.streaming) { 
        layout.colortables(cache.warnings, cache.watches, cache.alerts);
        layout.listings(cache.warnings, cache.watches, cache.alerts);
    }
}
layout.config = async function() {
    cache.config = JSON.parse( await library.request(`/api/configurations`))
    setTimeout(() => {
        library.isMobile()
        if (cache.streaming) {
            document.getElementById('random_alert').innerHTML = `<p>Syncing Server</p>`;
            document.getElementById('random_alert_topic').innerHTML = `<p>Syncing Server</p>`;
            document.getElementById('total_warnings').innerHTML = `<h2>Syncing Server</h2>`;
            document.getElementById('random_alert_topic_expire').innerHTML = `<p>Syncing Server</p>`;
        }
    }, 1)
    if (cache.streaming) {setInterval(() => { layout.time() }, 100);}
    setInterval(async () => {
        if (new Date().getSeconds() % cache.config['query:rate'] == 0) {
            if (cache.query) {return}
            cache.query = true
            setTimeout(() => {cache.query = false}, 1000)
            cache.config = JSON.parse( await library.request(`/api/configurations`))
            layout.execute()
        }
    }, 200);
}
