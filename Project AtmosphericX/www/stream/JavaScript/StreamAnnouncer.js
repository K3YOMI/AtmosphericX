
const home_ip_and_port = window.location.protocol + "//" + window.location.host; // variable to get the api and host location

let streaming = false; // Flag to indicate if streaming is enabled
let warnings_list = []; // Array to store active warnings
let watch_list = []; // Array to store active watches
let query = []; // Array to store queries
let last_queries = []; // Array to store last queries
let latest = undefined; // Variable to store the latest alert
let latest_manual = undefined; // Variable to store the latest manual alert
let queue = [] // Array to store the queue of alerts

function play_sound(audio_file) { // Plays the audio file (alert based)
    const audio = new Audio(audio_file);
    audio.volume = audio_file.includes('EAS') ? 0.5 : 1;
    audio.play(); 
}
function toggleStream(bool) { // Detection of portable / overlay mode
    streaming = bool
}
async function show_alert(gif, t_event, t_location) { // Shows the alert on the user interface
    document.getElementById('gif_notification').src = gif;
    if (t_location.length > 108) {t_location = t_location.substring(0, 100) + '...';}
    document.getElementById('gif_notification').style.display = 'block';
    setTimeout(function () {document.getElementById('gif_notification').src = 'https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png';}, 6800);
    setTimeout(function () {document.getElementById('notification_title_event').innerHTML = `<div class="notification_title_event" style="animation: fade 5s linear forwards; animation-delay: 0s;">${t_event}</div>`;}, 500);
    setTimeout(function () {document.getElementById('notification_subtitle_event').innerHTML = `<div class="notification_subtitle_event" style="animation: fade 4.5s linear forwards;animation-delay: 0s;">${t_location}</div>`;}, 700);
}

async function delay(ms) { // Generic delay async function
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function update_all_ui(warnings) { // Alerts the user interface with the latest alerts and cycles through them
    console.log(warnings.length)
    if (warnings.length == 0) {
        document.getElementById('random_alert').innerHTML = `<p>Not Enough Information</p>`;
        document.getElementById('random_alert_topic').innerHTML = `<p>No Events</p>`;
        document.getElementById('random_alert_topic_expire').innerHTML = `<p>No Events</p>`;
        document.getElementById('total_warnings').innerHTML = `<h2>No Active Events</h2>`;
    } else {
        let alert_type = warnings[Math.floor(Math.random() * warnings.length)]
        let tmpName = alert_type.eventName;
        if (alert_type.locations.length > 220) {alert_type.locations = alert_type.locations.substring(0, 220) + "..."};
        document.getElementById('random_alert').innerHTML = `<p>${(alert_type.locations.toUpperCase())}</p>`;
        document.getElementById('random_alert_topic').innerHTML = `<p>${tmpName.toUpperCase()}</p>`;
        let format = `Expires: N/A`;
        console.log(alert_type.expires)
        if (alert_type.expires != "N/A" && alert_type.expires != undefined) {
            let date = new Date(alert_type.expires);
            let timezone = date.getTimezoneOffset();
            let time_zone_offsets = {"CDT": 300,"CST": 360,"EDT": 240,"EST": 300,"MDT": 360,"MST": 420,"PDT": 420,"PST": 480}
            let time_zone = Object.keys(time_zone_offsets).find(key => time_zone_offsets[key] === timezone);
            format = `Expires: ${date.toLocaleString('default', { month: 'short', timeZone: 'MST' })} ${date.getDate()} ${date.getHours()}:${date.getMinutes()} ${time_zone}`;
            if (date.getMinutes() == 0) {
                format = `Expires: ${date.toLocaleString('default', { month: 'short', timeZone: 'MST' })} ${date.getDate()} ${date.getHours()}:0${date.getMinutes()} ${time_zone}`;
            }
        }
        document.getElementById('random_alert_topic_expire').innerHTML = `<p>${format}</p>`;
        let totalTornadoWarnings = warnings_list.filter(x => x.eventName.includes(`Tornado`)).length;
        let random_chance = Math.floor(Math.random() * 5);
        if (warnings_list.length > 5 && totalTornadoWarnings > 5) {
            document.getElementById('total_warnings').innerHTML = (random_chance == 3) ? `<h2>OUTBREAK</h2>` : `<p>Active Warnings: ${warnings_list.length}<br>Active Watches: ${watch_list.length}</p>`;
        } else {
            document.getElementById('total_warnings').innerHTML = (random_chance == 3) ? `<h2>BREAKING WEATHER</h2>` : `<p>Active Warnings: ${warnings_list.length}<br>Active Watches: ${watch_list.length}</p>`;
        }
    }
}


async function run_query(query) { // Runs the query and plays the audio
    if (query.length == 0) { console.log(`Queue is empty`); return }
    let nextquery = query.length - 1;
    let alert = query[nextquery];
    let messageType = alert.messageType;
    let locations = alert.locations;
    let audioToUse = alert.audioToUse;
    let notifyCard = alert.notifyCard;
    let autoBeep = alert.autobeep;
    let eas = alert.eas;
    let siren = alert.siren;
    let gif = alert.gif;
    let location = locations;
    if (audioToUse === `../../assets/media/audio/BEEP-INTRO.mp3`) {
        play_sound(audioToUse);
        show_alert(gif, notifyCard + ` (${messageType})`, location);
        await delay(1300);
        if (eas || siren) {
            await delay(3500);
            play_sound(eas ? `../../assets/media/audio/EASv2.mp3` : `../../assets/media/audio/TOR-EM-SIREN.mp3`);
        }
    } else {
        show_alert(gif, notifyCard + ` (${messageType})`, location);
        if (autoBeep) {
            play_sound(`../../assets/media/audio/BEEP-INTRO.mp3`);
            await delay(1300);
        }
        play_sound(audioToUse);
        if (eas || siren) {
            await delay(3500);
            play_sound(eas ? `../../assets/media/audio/EASv2.mp3` : `../../assets/media/audio/TOR-EM-SIREN.mp3`);
        }
    }
    query.pop();
}

async function request_active_alerts() { // Requests alerts from the self-hosted API endpoint, then process the data.
    let active_stuffz = []
    await fetch(`${home_ip_and_port}/api/active_warnings`).then(response => response.text()).then(data => {
        let jsonData = JSON.parse(data);
        warnings_list = jsonData
    })
    await fetch(`${home_ip_and_port}/api/active_watches`).then(response => response.text()).then(data => {
        let jsonData = JSON.parse(data);
        watch_list = jsonData
    })
    if (streaming) { 
        await fetch(`${home_ip_and_port}/api/notifications`).then(response => response.text()).then(data => {
            let jsonData = JSON.parse(data);
            if (jsonData.length != 0) {
                let notificationShow = document.getElementById('notificationBox');
                notificationShow.style.display = 'block';
                let notificationTitle = document.getElementById('warning_title');
                let notificationSubtitle = document.getElementById('warning_subtitle');
                notificationTitle.innerHTML = jsonData.title;
                notificationSubtitle.innerHTML = jsonData.message;
            }else {
                let notificationShow = document.getElementById('notificationBox');
                notificationShow.style.display = 'none';
            }
        })
    }
    await fetch(`${home_ip_and_port}/api/active_manual`).then(response => response.text()).then(data => {
        let jsonData = JSON.parse(data)
        if (jsonData == undefined || jsonData.length == 0) { return }
        if (streaming) { active_stuffz.push(jsonData); }
        let eventName = jsonData.eventName
        let eventDesc = jsonData.eventDescription
        let messageType = jsonData.messageType
        let inqueue = queue.find(x => x.eventName == eventName && x.eventDescription == eventDesc && x.messageType == messageType)
        if (eventName.includes(`Warning`)) {
            warnings_list.push(jsonData);
        }
        if (eventName.includes(`Watch`)) {
            watch_list.push(jsonData);
        }
        if (eventName.includes(`Tornado Emergency`) || eventName.includes(`Flash Flood Emergency`) || eventName.includes(`Particularly Dangerous Situation`)) {
            warnings_list.push(jsonData);
        }
        if (inqueue == undefined && latest_manual != eventName + eventDesc + messageType) {
            latest_manual = eventName + eventDesc + messageType
            console.log(`Adding ${eventName} to the queue`)
            queue.push(jsonData);
        }
    })
    await fetch(`${home_ip_and_port}/api/alerts`).then(response => response.text()).then(async data => {
        let jsonData = JSON.parse(data)
        if (jsonData == undefined || jsonData.length == 0) { return }
        for (let i = 0; i < jsonData.length; i++) {
            if (streaming) { active_stuffz.push(jsonData[i]); }
            let latestAlert = jsonData[i];
            let eventName = latestAlert.eventName
            let eventDesc = latestAlert.eventDescription
            let messageType = latestAlert.messageType
            let timeIssued = latestAlert.issued
            let timeExpires = latestAlert.expires
            let findDuplicate = last_queries.find(x => x.eventName == eventName && x.eventDescription == eventDesc && x.messageType == messageType && x.issued == timeIssued && x.expires == timeExpires)
            let time = new Date().getTime() / 1000;
            let check = time - new Date(timeIssued).getTime() / 1000;
            if (check > 8 && check < 340 && findDuplicate == undefined) {
                console.log(`Added ${eventName} to the queue with an expiration of ${timeExpires}`)
                console.log(`Location: ${latestAlert.locations}`)
                queue.push(latestAlert);
                last_queries.push(latestAlert);
            } else { 
                if (findDuplicate && check > 1600) {
                    let index = last_queries.indexOf(findDuplicate);
                    if (index > -1) {
                        last_queries.splice(index, 1);
                    }
                }
            }
        }
    })
    run_query(queue)
    if (streaming) { update_all_ui(active_stuffz); }
}

setInterval(function () { // Updates the time/date and changes the color scheme based on on the active alerts (severity-based)
    if (streaming) {
        let time = new Date();
        let second = time.getSeconds();
        let minute = time.getMinutes();
        let hour = time.getHours();  
        let current_month = time.getMonth();
        let current_day = time.getDate();
        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const current_month_name = monthNames[current_month];
        if (minute < 10) {minute = "0" + minute}
        if (second < 10) {second = "0" + second}
        if (hour < 10) { hour = "0" + hour}
        let current_time = hour + ":" + minute + ":" + second;
        document.getElementById('time').innerHTML = `<p>${current_time}</p>`;
        document.getElementById('date').innerHTML = `<p>${current_month_name} ${current_day}</p>`;
        let totalTornadoEmergencies = warnings_list.filter(x => x.eventName == `Tornado Emergency`).length;
        let totalFlashFloodEmergencies = warnings_list.filter(x => x.eventName == `Flash Flood Emergency`).length;
        let totalPDS = warnings_list.filter(x => x.eventName == `Particularly Dangerous Situation`).length;
        let totalTornadoWarnings = warnings_list.filter(x => x.eventName.includes(`Tornado`)).length;
        let totalSevereThunderstormWarnings = warnings_list.filter(x => x.eventName.includes(`Severe Thunderstorm Warning`)).length;
        let totalFlashFloodWarnings = warnings_list.filter(x => x.eventName == `Flash Flood Warning`).length;
        let totalSpecialMarineWarnings = warnings_list.filter(x => x.eventName == `Special Marine Warning`).length;
        let totalSnowSquallWarnings = warnings_list.filter(x => x.eventName == `Snow Squall Warning`).length;
        if (totalTornadoEmergencies > 0) {
            lightAreas = document.getElementsByClassName(`defaultBoxLight`)
            darkAreas = document.getElementsByClassName(`defaultBox`)
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(209,38,215)`}
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(159,37,163)`}
        } else if (totalPDS > 0) {
            lightAreas = document.getElementsByClassName(`defaultBoxLight`)
            darkAreas = document.getElementsByClassName(`defaultBox`)
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(249,56,54)`}
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(203,25,25)`}
        } else if (totalTornadoWarnings > 0) {
            lightAreas = document.getElementsByClassName(`defaultBoxLight`)
            darkAreas = document.getElementsByClassName(`defaultBox`)
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(249,56,54)` }
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(203,25,25)`}
        } else if (totalFlashFloodEmergencies > 0) {
            lightAreas = document.getElementsByClassName(`defaultBoxLight`)
            darkAreas = document.getElementsByClassName(`defaultBox`)
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(249,56,54)` }
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(203,25,25)`}
        } else if (totalSnowSquallWarnings > 0) {
            lightAreas = document.getElementsByClassName(`defaultBoxLight`)
            darkAreas = document.getElementsByClassName(`defaultBox`)
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(249,56,54)` }
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(203,25,25)`}
        } else if (totalSevereThunderstormWarnings > 0) {
            lightAreas = document.getElementsByClassName(`defaultBoxLight`)
            darkAreas = document.getElementsByClassName(`defaultBox`)
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(224,162,42)`}
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(255,132,1)`}
        } else if (totalFlashFloodWarnings > 0) {
            lightAreas = document.getElementsByClassName(`defaultBoxLight`)
            darkAreas = document.getElementsByClassName(`defaultBox`)
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(102,209,60)`}
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(73,155,40)`}
        } else if (totalSpecialMarineWarnings > 0) {
            lightAreas = document.getElementsByClassName(`defaultBoxLight`)
            darkAreas = document.getElementsByClassName(`defaultBox`)
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(28,61,181)`}
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(42,81,224)`}
        } else {
            lightAreas = document.getElementsByClassName(`defaultBoxLight`)
            darkAreas = document.getElementsByClassName(`defaultBox`)
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(28,61,181)`}
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(42,81,224)`}
        }
    }
}, 1000);

request_active_alerts()
setInterval(function () { request_active_alerts() }, 8000); // Requests the active alerts every 8 seconds
