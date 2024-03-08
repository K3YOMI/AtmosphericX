
const home_ip_and_port = window.location.protocol + "//" + window.location.host;

let streaming = false; // Flag to indicate if streaming is enabled
let warnings_list = []; // Array to store active warnings
let watch_list = []; // Array to store active watches
let query = []; // Array to store queries
let last_queries = []; // Array to store last queries
let latest = undefined; // Variable to store the latest alert
let latest_manual = undefined; // Variable to store the latest manual alert
let queue = [] // Array to store the queue of alerts

/**
 * Function to play a sound (audio file)
 * @param {string} audio_file - The audio file to play.
 * @returns {void}
*/


function play_sound(audio_file) { 
    const audio = new Audio(audio_file);
    audio.volume = audio_file.includes('EAS') ? 0.5 : 1;
    audio.play(); 
}

/**
 * Function to toggle the streaming flag.
 * @param {boolean} bool - The flag to toggle the streaming.
 * @returns {void}
*/

function toggleStream(bool) {
    streaming = bool
}


/**
 * Function to abbreviate an event which helps for showing the event on the UI in a more compact way.
 * @param {string} event - The event to abbreviate.
 * @returns {string} - The abbreviated event.
*/


function abreveate_event(event) {
    switch (event) {
        case `Tornado Emergency`:
            return `TORRE`;
        case `PDS`:
            return `TORP`;
        case `Confirmed Tornado Warning`:
        case `Tornado Warning`:
        case `Radar Indicated Tornado Warning`:
            return `TORR`;
        case `Destructive Severe Thunderstorm Warning`:
            return `SVRD`;
        case `Considerable Destructive Severe Thunderstorm Warning`:
            return `SVRC`;
        case `Severe Thunderstorm Warning`:
            return `SVR`;
        case `Severe Thunderstorm Watch`:
            return `SVRW`;
        case `Flash Flood Warning`:
            return `FFW`;
        case `Flash Flood Watch`:
            return `FFA`;
        case `Special Marine Warning`:
            return `SMW`;
        case `Snow Squall Warning`:
            return `SQW`;
        default:
            return event;
    }
}

/**
 * Function to update the UI with the latest alerts.
 * @param {array} warnings - The array of warnings to update the UI with.
 * @returns {void}
*/


async function update_all_ui(warnings) {
    if (warnings.length == 0) {
        document.getElementById('random_alert').innerHTML = `<p>Not Enough Information</p>`;
        document.getElementById('random_alert_topic').innerHTML = `<p>No Events</p>`;
        document.getElementById('random_alert_topic_expire').innerHTML = `<p>No Events</p>`;
        document.getElementById('total_warnings').innerHTML = `<p>COUNTIES WARNED: 0</p>`;
    } else {
        let alert_type = warnings[Math.floor(Math.random() * warnings.length)]
        let tmpName = alert_type.eventName;
        if (alert_type.eventName == `Severe Thunderstorm Warning`) { tmpName = `Severe T-Storm Warning`;}
        if (alert_type.eventName == `Severe Thunderstorm Watch`) { tmpName = `Severe T-Storm Watch`;}
        if (alert_type.locations.length > 220) {alert_type.locations = alert_type.locations.substring(0, 220) + "..."};
        document.getElementById('random_alert').innerHTML = `<p>${alert_type.messageType} : ${(alert_type.locations.toUpperCase())}</p>`;
        document.getElementById('random_alert_topic').innerHTML = `<p>${tmpName.toUpperCase()}</p>`;
        let date = new Date(alert_type.expires);
        let timezone = date.getTimezoneOffset();
        let time_zone_offsets = {"CDT": 300,"CST": 360,"EDT": 240,"EST": 300,"MDT": 360,"MST": 420,"PDT": 420,"PST": 480}
        let time_zone = Object.keys(time_zone_offsets).find(key => time_zone_offsets[key] === timezone);
        let format = `Expires: ${date.toLocaleString('default', { month: 'short', timeZone: 'MST' })} ${date.getDate()} ${date.getHours()}:${date.getMinutes()} ${time_zone}`;
        if (date.getMinutes() == 0) {
            format = `Expires: ${date.toLocaleString('default', { month: 'short', timeZone: 'MST' })} ${date.getDate()} ${date.getHours()}:0${date.getMinutes()} ${time_zone}`;
        }
        document.getElementById('random_alert_topic_expire').innerHTML = `<p>${format}</p>`;
        document.getElementById('total_warnings').innerHTML = `<p>WARN: ${warnings_list.length} | WATCH: ${watch_list.length}</p>`;
    }
}


/**
 * Function to show an alert on the UI.
 * @param {string} gif - The gif to show on the alert.
 * @param {string} t_event - The event to show on the alert.
 * @param {string} t_location - The location to show on the alert.
 * @returns {void}
*/

async function show_alert(gif, t_event, t_location) {
    document.getElementById('gif_notification').src = gif;
    if (t_location.length > 108) {t_location = t_location.substring(0, 108) + '...';}
    document.getElementById('gif_notification').style.display = 'block';
    setTimeout(function () {document.getElementById('gif_notification').src = 'https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png';}, 7000);
    setTimeout(function () {document.getElementById('notification_title_event').innerHTML = `<div class="notification_title_event" style="animation: fade 6s linear forwards; font-weight: bold; color: #ffffff; text-shadow: #000000 0px 0px 10px;  animation-delay: 0s; color: white;">${t_event}</div>`;}, 500);
    setTimeout(function () {document.getElementById('notification_subtitle_event').innerHTML = `<div class="notification_subtitle_event" style="animation: fade 4.5s linear forwards; font-weight: bold; color: white;animation-delay: 0s; color: black;">${t_location}</div>`;}, 700);
}

/**
 * Function to delay the execution of a function.
 * @param {number} ms - The number of milliseconds to delay the execution of the function.
 * @returns {Promise} - The promise to delay the execution of the function.
*/


async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



/**
 * Function to run a query.
 * @param {array} query - The array of queries to run.
 * @returns {void}
*/



async function run_query(query) {
    if (query.length == 0) { console.log(`Queue is empty`); return }
    let nextquery = query.length - 1;
    let alert = query[nextquery];
    let eventName = alert.eventName;
    let eventDesc = alert.eventDescription;
    let messageType = alert.messageType;
    let expires = alert.expires;
    let issued = alert.issued;
    let locations = alert.locations;
    let newAudio = alert.newAudio;
    let audioToUse = alert.audioToUse;
    let notifyCard = alert.notifyCard;
    let autoBeep = alert.autobeep;
    let eas = alert.eas;
    let siren = alert.siren;
    let updated = alert.issued;
    let gif = alert.gif;
    let location = locations;
    if (audioToUse == `../../Media/Sounds/Beep.mp3`) {
        play_sound(audioToUse);
        show_alert(gif, notifyCard + ` (${messageType})`, location);
        await delay(1300);
        if (eas) {
            await delay(3000);
            play_sound(`../../Media/Sounds/EAS.mp3`);
        }
        if (siren) {
            await delay(3000);
            play_sound(`../../Media/Sounds/TOR-EM-SIREN.mp3`);
        }
        return query.pop();
    } else {
        if (autoBeep) {
            play_sound(`../../Media/Sounds/Beep.mp3`);
            show_alert(gif, notifyCard + ` (${messageType})`, location);
            await delay(1300);
        }
        play_sound(audioToUse);
        if (eas) {
            await delay(3000);
            play_sound(`../../Media/Sounds/EAS.mp3`);
        }
        if (siren) {
            await delay(3000);
            play_sound(`../../Media/Sounds/TOR-EM-SIREN.mp3`);
        }
        query.pop();
    }
}


/**
 * Function to request active alerts.
 * @returns {void}
*/


async function request_active_alerts() {
    let newAlert = false;
    await fetch(`${home_ip_and_port}/api/active_warnings`).then(response => response.text()).then(data => {
        let jsonData = JSON.parse(data);
        warnings_list = jsonData
    })
    await fetch(`${home_ip_and_port}/api/active_watches`).then(response => response.text()).then(data => {
        let jsonData = JSON.parse(data);
        watch_list = jsonData
    })
    await fetch(`${home_ip_and_port}/api/active_manual`).then(response => response.text()).then(data => {
        let jsonData = JSON.parse(data)
        if (jsonData == undefined || jsonData.length == 0) { return }
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
        if (eventName.includes(`Tornado Emergency`)){
            warnings_list.push(jsonData);
        }
        if (eventName.includes(`PDS`)){
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
        if (streaming) { update_all_ui(jsonData); }
        for (let i = 0; i < jsonData.length; i++) {
            let latestAlert = jsonData[i];
            let eventName = latestAlert.eventName
            let eventDesc = latestAlert.eventDescription
            let messageType = latestAlert.messageType
            let timeIssued = latestAlert.issued
            let timeExpires = latestAlert.expires
            let findDuplicate = last_queries.find(x => x.eventName == eventName && x.eventDescription == eventDesc && x.messageType == messageType && x.issued == timeIssued && x.expires == timeExpires)
            let time = new Date().getTime() / 1000;
            let check = time - new Date(timeIssued).getTime() / 1000;
            if (check > 8 && check < 100 && findDuplicate == undefined) {
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
}

/**
 * Function to toggle the streaming flag.
 * @param {boolean} bool - The flag to toggle the streaming.
 * @returns {void}
*/


setInterval(function () {
    if (streaming) {
        let time = new Date();
        let second = time.getSeconds();
        let minute = time.getMinutes();
        let hour = time.getHours();  
        let current_month = time.getMonth();
        let current_day = time.getDate();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
        const current_month_name = monthNames[current_month];
        if (minute < 10) {
            minute = "0" + minute;
        }
        if (second < 10) {
            second = "0" + second;
        }
        if (hour < 10) {
            hour = "0" + hour;
        }
        let current_time = hour + ":" + minute + ":" + second;
        document.getElementById('time').innerHTML = `<p>${current_time} CST</p>`;
        document.getElementById('date').innerHTML = `<p>${current_month_name} ${current_day}</p>`;
        let totalTornadoEmergencies = warnings_list.filter(x => x.eventName == `Tornado Emergency`).length;
        let totalPDS = warnings_list.filter(x => x.eventName == `PDS`).length;
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

/**
 * Function to request active alerts.
 * @returns {void}
*/

setInterval(function () {
    request_active_alerts()
}, 8000);
request_active_alerts()
