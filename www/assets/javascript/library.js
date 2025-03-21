
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


let library = {}
let cache = {
    warnings: [],
    alerts: [],
    reports: [],
    watches: [],
    manual: [],
    broadcasts: [],
    lastQueries: [],
    random: [],
    status: ``,
    queue: [],
    config: [],
    alert: 0,
    statistics: { operations: 0, requests: 0, memory: 0, cpu: 0 },
    latestManual: ``,
    query: false,
    alertbox: false,
    running: false,
    playable: true,
    isMobile: false,
    channels: [undefined, undefined, undefined, undefined]
}

library.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded Frontend Library Functions`)
}
library.isMobile = function() { // Detects if the frontend device is a mobile device, ex. iPhone, iPad, Android, etc.
    let isMobile = /iPhone|iPad|iPod|Android|Mac OS X|BlackBerry|IEMobile|WPDesktop/i.test(navigator.userAgent);
    if (isMobile) {
        cache.isMobile = true
        let interaction = document.createElement('button');
        interaction.innerHTML = `Mobile devices have disabled audio interaction. Click here to enable.`;
        interaction.style.position = `fixed`;
        interaction.style.top = `50%`;
        interaction.style.left = `50%`;
        interaction.style.transform = `translate(-50%, -50%)`;
        interaction.style.fontSize = `46px`;
        interaction.style.padding = `120px`;
        document.body.appendChild(interaction);
        interaction.onclick = function() {
            let tChannels = [];
            interaction.remove();
            for (let i = 0; i < 4; i++) {
                const audio = new Audio();
                audio.src = `data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQDkAAAAAAAAAGw9wrNaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV`;
                audio.volume = 0.5;
                audio.play();
                tChannels.push(audio);
            }
            cache.channels = tChannels;
        }
    }
}
library.play = function(uri, limited=false) { // Plays frontend audio (Limited to 4 channels on mobile devices)
    if (!cache.isMobile) { 
        if (limited && !cache.playable) { return }
        if (limited) { cache.playable = false }
        let audio = new Audio()
        audio.src = uri
        audio.autoplay = true;
        audio.volume = 1.0;
        audio.play();
        audio.onended = function() { 
            audio.remove(); 
            if (limited) { cache.playable = true } 
        }
    } else  {
        let channels = undefined
        if (limited && !cache.playable) { return }
        if (limited) { cache.playable = false; channels = [cache.channels[0]] } else { channels = cache.channels }
        for (let channel of channels) {
            if (channel.ended || channel.paused) {
                channel.src = uri
                channel.autoplay = true;
                channel.volume = 1.0;
                channel.play()
                channel.onended = function() {
                    if (limited) { cache.playable = true }
                }
                break;
            }
        }
    }
}
library.time = function(value=0) { 
    let time;
    let tMonthDictionary = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"];
    let timezone = cache.config['application:timezone'];
    let t12Hour = cache.config['application:12hour'];
    
    if (value == 0) { 
        time = new Date(); 
    } else { 
        time = value; 
    }
    let tFormal = new Date(time.toLocaleString("en-US", { timeZone: cache.config['application:timezone'] }));
    let tFormalAbreviation = new Date().toLocaleString("en-US", { timeZoneName: "short", timeZone: cache.config['application:timezone'] });
    let tTimezone = tFormalAbreviation.split(' ')[3];
    let tSecond = tFormal.getSeconds();
    let tMinute = tFormal.getMinutes();
    let tHour = tFormal.getHours();
    let tMonth = tFormal.getMonth();
    let tDay = tFormal.getDate();
    let tExtension = tHour >= 12 ? "PM" : "AM";
    
    if (t12Hour) {
        tHour = tHour % 12 || 12; // Convert to 12-hour format
    }
    
    if (tMinute < 10) { tMinute = "0" + tMinute; }
    if (tSecond < 10) { tSecond = "0" + tSecond; }
    if (tHour < 10 && !t12Hour) { tHour = "0" + tHour; }
    tMonth = tMonthDictionary[tMonth];
    
    return {
        time: `${tHour}:${tMinute}:${tSecond}${t12Hour ? " " + tExtension : ""}`,
        date: `${tMonth} ${tDay}`,
        timezone: tTimezone,
        unix: tFormal.getTime() / 1000
    };
}
library.delay = async function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
library.request = async function(url) {
    return new Promise(async (resolve, reject) => {
        await fetch(url).then(response => response.text()).then(data => {
            resolve(data)
        }).catch(error => {})
    })
}
library.createSession = async function() {
    let response = JSON.parse(await library.request(`/api/all`))
    cache.config = response.configurations
    return
}
library.checkSession = async function() {
    return new Promise(async (resolve, reject) => {
        if (new Date().getSeconds() % cache.config['query:rate'] == 0) {
            if (cache.query) { resolve(false); return }
            resolve(true); cache.query = true; setTimeout(() => { cache.query = false }, 1000);
        }
        resolve(false)
    })
}
library.sync = async function() {
    return new Promise(async (resolve, reject) => {
        let response = JSON.parse(await library.request(`/api/all`))
        cache.alerts = response.active
        cache.reports = response.reports
        cache.manual = response.manual
        cache.warnings = response.warnings
        cache.watches = response.watches
        cache.broadcasts = response.broadcasts
        cache.config = response.configurations
        cache.random = response.random
        cache.status = response.status
        if (cache.manual.length != 0) {
            if (cache.manual.details.ingored != true) { 
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
        }
        resolve()
    })
}
library.query = async function(queue) { 
    return new Promise(async (resolve, reject) => {
        if (queue.length == 0) {return}
        if (cache.running) { return } else { cache.running = true; }
        let nextQuery = queue.length - 1;
        let nextAlert = queue[nextQuery]
        if (cache.alertbox) { widgets.alert.send(nextAlert.metadata.gif, `${nextAlert.details.name} (${nextAlert.details.type})`, nextAlert.details.locations) }
        if (nextAlert.metadata.autobeep) {
            library.play(cache.config['application:sounds']['application:beep'], false);
            if (!nextAlert.details.onlyBeep) { 
                await library.delay(1300); 
                library.play(nextAlert.metadata.audio, false); 
            }
        } else { 
            library.play(nextAlert.metadata.audio, false);
        }
        if (nextAlert.metadata.eas || nextAlert.metadata.siren) {
            await library.delay(3.8 * 1000)
            library.play(nextAlert.metadata.eas ? cache.config['application:sounds']['application:eas'] : cache.config['application:sounds']['application:siren'], false)
        }
        queue.pop()
        resolve()
    })
}