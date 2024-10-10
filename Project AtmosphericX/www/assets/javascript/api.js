
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


let api = {}
let cache = {}
cache.warnings = []; cache.alerts = []
cache.watches = []; cache.manual = []
cache.broadcasts = []; cache.lastQueries = []
cache.queue = []; cache.config = []
cache.latestManual = ``
cache.query = false
cache.streaming = false
cache.running = false
cache.isMobile = false
cache.channel1, cache.channel2, cache.channel3, cache.channel4 = undefined




api.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded API Functions`)
}
api.isMobile = async function() { // Checks the useragent for mobile devices and such to see if we can autoplay audio
    let isMobile = /iPhone|iPad|iPod|Android|Mac OS X|BlackBerry|IEMobile|WPDesktop/i.test(navigator.userAgent);
    if (isMobile) { cache.isMobile = true }
    console.log(`Mobile Device: ${isMobile}`)
    if (isMobile) {
        let interaction = document.createElement('button');
        interaction.innerHTML = `Mobile devices have disabled audio interaction. Click here to enable.`;
        interaction.style.position = `fixed`;
        interaction.style.top = `50%`;
        interaction.style.left = `50%`;
        interaction.style.transform = `translate(-50%, -50%)`;
        interaction.style.fontSize = `46px`;
        interaction.style.padding = `120px`;
        // append to the body 
        document.body.appendChild(interaction);
        interaction.onclick = function() {
            const channels = [];
            interaction.remove();
            for (let i = 1; i <= 4; i++) {
                const audio = new Audio();
                audio.src = `data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQDkAAAAAAAAAGw9wrNaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV`;
                audio.volume = 0.5;
                audio.play();
                channels.push(audio);
                console.log(`Audio Channel ${i} Played`);
            }
            [cache.channel1, cache.channel2, cache.channel3, cache.channel4] = channels;
        }
    }
}
api.play = async function(url, limited=false) { // Decides if we should play audio normally or on a channel
    if (!limited) {
        if (!cache.isMobile) {
            let audio = new Audio();
            audio.src = url;
            audio.autoplay = true;
            audio.volume = url.includes('EAS') ? 0.5 : 1;
            audio.play();
            audio.onended = function() {
                audio.remove();
            }
        } else { 
            let channels = [cache.channel1, cache.channel2, cache.channel3, cache.channel4];
            for (let channel of channels) {
                if (channel.ended) {
                    channel.src = url;
                    channel.autoplay = true;
                    channel.volume = url.includes('EAS') ? 0.5 : 1;
                    channel.play();
                    return;
                }
            }
        }
    } 
    if (limited) { 
        if (cache.playable == undefined) { cache.playable = true }
        if (cache.playable == false) { return }
        cache.playeable = false;
        if (!cache.isMobile) {
            let audio = new Audio(url);
            audio.volume = url.includes('EAS') ? 0.5 : 1;
            audio.play();
            audio.onended = function() {
                audio.remove();
                cache.playable = true;
            }
        } else {
            let channels = [cache.channel1];
            for (let channel of channels) {
                if (channel.ended) {
                    channel.src = url;
                    channel.autoplay = true;
                    channel.volume = url.includes('EAS') ? 0.5 : 1;
                    channel.play();
                    channel.onended = function() {
                        cache.playable = true;
                    }
                }
            }
        }
    }
}
api.delay = async function(ms) { // Delay function
    return new Promise(resolve => setTimeout(resolve, ms));
}
api.request = async function(url) { // Manages all API requests and such
    return new Promise(async (resolve, reject) => {
        await fetch(url).then(response => response.text()).then(data => {
            resolve(data)
        }).catch(error => {})
    })
}
api.streaming = async function(bool) { // Enabled/Disables the streaming feature
    cache.streaming = bool;
}
api.alert = async function(animation, title, message) {
    if (cache.streaming) {
        let gifNotification = document.getElementById('gif_notification');
        if (message.length > 108) {message = message.substring(0, 100) + '...';}
        gifNotification.style.display = 'block';
        gifNotification.src = animation + "?" + Math.random();
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
api.listings = async function(warnings, watches, data) {
    if (data.length == 0) { 
        document.getElementById('random_alert').innerHTML = `<p>No Active Events</p>`;
        document.getElementById('random_alert_topic').innerHTML = `<p>No Active Events</p>`;
        document.getElementById('random_alert_topic_expire').innerHTML = `<p>No Active Events</p>`;
        document.getElementById('total_warnings').innerHTML = `<h2>No Active Events</h2>`;
        return
    }
    let random = data[Math.floor(Math.random() * data.length)];
    let topic = random.eventName; 
    let location = random.locations;
    let expires = random.expires;
    if (location.length > 220) { 
        location = location.substring(0, 220) + '...';
    }
    document.getElementById('random_alert').innerHTML = `<p>${(location.toUpperCase())}</p>`;
    document.getElementById('random_alert_topic').innerHTML = `<p>${topic.toUpperCase()}</p>`;
    if (expires != `N/A` && expires != undefined) { 
        let date = new Date(expires)
        let timezone = date.getTimezoneOffset(); 
        let offsets = {"CDT": 300,"CST": 360,"EDT": 240,"EST": 300,"MDT": 360,"MST": 420,"PDT": 420,"PST": 480}
        let object = Object.keys(offsets).find(key => offsets[key] === timezone);
        expires = `${date.toLocaleString('default', { month: 'short', timeZone: 'MST' })} ${date.getDate()} ${date.getHours()}:${date.getMinutes()} ${object}`;

        if (date.getMinutes() == 0) {
            expires = `${date.toLocaleString('default', { month: 'short', timeZone: 'MST' })} ${date.getDate()} ${date.getHours()}:0${date.getMinutes()} ${object}`;
        }
        document.getElementById('random_alert_topic_expire').innerHTML = `<p>${expires}</p>`;
        let result = await api.request(`/api/status`)
        if (result == ``) { 
            let activeoutbreak = warnings.filter(warning => warning.eventName.includes('Tornado')).length;
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
}
api.time = async function() {
    let time = new Date();
    let second = time.getSeconds();
    let minute = time.getMinutes();
    let hour = time.getHours();  
    let thismonth = time.getMonth();
    let thisday = time.getDate();
    let months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEPT","OCT","NOV","DEC"];
    if (minute < 10) {minute = "0" + minute}
    if (second < 10) {second = "0" + second}
    if (hour < 10) { hour = "0" + hour}
    document.getElementById('time').innerHTML = `<p>${hour}:${minute}:${second}</p>`;
    document.getElementById('date').innerHTML = `<p>${months[thismonth]} ${thisday}</p>`;
}
api.colortables = async function(warnings) {
    let tore = warnings.filter(x => x.eventName == `Tornado Emergency`).length;
    let ffe = warnings.filter(x => x.eventName == `Flash Flood Emergency`).length;
    let torp = warnings.filter(x => x.eventName == `Particularly Dangerous Situation`).length;
    let tor = warnings.filter(x => x.eventName.includes(`Tornado`)).length;
    let svr = warnings.filter(x => x.eventName.includes(`Severe Thunderstorm Warning`)).length;
    let ffw = warnings.filter(x => x.eventName == `Flash Flood Warning`).length;
    let smw = warnings.filter(x => x.eventName == `Special Marine Warning`).length;
    let ssw = warnings.filter(x => x.eventName == `Snow Squall Warning`).length;
    let hur = warnings.filter(x => x.eventName == `Hurricane Warning`).length;
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
api.query = async function(data) { 
    if (cache.running == undefined) { cache.running = false }
    if (data.length == 0) {return }
    if (cache.running) { return }
    cache.running = true;
    let nextQuery = data.length - 1;
    let alert = data[nextQuery];
    let messageType = alert.messageType;
    let locations = alert.locations;
    let audioToUse = alert.audioToUse;
    let notifyCard = alert.notifyCard;
    let autoBeep = alert.autobeep;
    let onlyBeep = alert.onlyBeep;
    let eas = alert.eas;
    let siren = alert.siren;
    let gif = alert.gif;
    api.alert(gif, `${notifyCard} (${messageType})`, `${locations}`);
    if (autoBeep) {
        api.play(cache.config['application:sounds']['application:beep'], false);
        if (!onlyBeep) { await api.delay(1300); api.play(audioToUse, false); }
    } else { 
        api.play(audioToUse, false);
    }
    if (eas || siren) {
        await api.delay(3500);
        api.play(eas ? cache.config['application:sounds']['application:eas'] : cache.config['application:sounds']['application:siren']);
    }
    if (!cache.streaming) {
        await api.delay(6800);
        cache.running = false;
    }
    data.pop();
}
