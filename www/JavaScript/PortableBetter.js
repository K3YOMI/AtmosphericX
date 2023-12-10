
const home_ip_and_port = window.location.protocol + "//" + window.location.host;
const global_header = { 'User-Agent': 'AtmosphericX','Accept': 'application/geo+json','Accept-Language': 'en-US' }
const whitelisted_events = [ 'Flash Flood Watch',  'Severe Thunderstorm Watch',  'Tornado Watch', 'Special Marine Warning', 'Flash Flood Warning', 'Severe Thunderstorm Warning', 'Tornado Warning']
let debugging_allowed = true;


////// Arrays //////
let arr_ActiveWarnings = []
let arr_currentQueue = []

////// Integers //////
let int_latestAlert = 0
let int_resetPeriod = 0

////// Strings //////
let str_latestManualRequest = undefined
let str_currentSyncStatus = undefined
let str_latestAlert = undefined


////// Booleans //////
let boolean_isActiveEmergency = false // Tornado Emergency Activiation...
let boolean_inCard = false // If the stream is showing a notification card
let boolean_inQueue = false // If the stream is showing a notification from the queue
let boolean_canFetch = true // If the stream can fetch new data
let boolean_syncingEnabled = true // If syncing has been enabled...



////// Functions //////
function debug(st) {
    if (debugging_allowed) {
     console.log(`[AtmospericX Debug]: ${st}`); 
    }
}
function is_new_alert(alert_temp) { if (alert_temp == str_latestAlert) { return false; }else{return true;}}
function is_valid_alert(alert_temp) {for (let i = 0; i < whitelisted_events.length; i++) { if (alert_temp == whitelisted_events[i]) { return true;}}return false;}
function whithin_time_frame(time_end) { let time_epoch = new Date(time_end).getTime();let current_time = new Date().getTime();if (time_epoch > current_time) { return true;}return false;}
function format_locations(locations) { following_areas = locations.split(','); if (following_areas.length > 1) { return `${following_areas}`;}return following_areas[0];}
function _delay(ms) { return new Promise(resolve => setTimeout(resolve, ms))}
function play_sound(audio_file) { let path_area = `./Audio/`;let audio = new Audio(path_area + audio_file);audio.play(); }
function update_time_cdt() { let time = new Date();let second = time.getSeconds();let minute = time.getMinutes();let hour = time.getHours();  let current_month = time.getMonth();let current_day = time.getDate();if (current_month == 0) {current_month = "Jan";} else if (current_month == 1) {current_month = "Feb";} else if (current_month == 2) {current_month = "Mar";} else if (current_month == 3) {current_month = "Apr";} else if (current_month == 4) {current_month = "May";} else if (current_month == 5) {current_month = "June";} else if (current_month == 6) {current_month = "July";} else if (current_month == 7) {current_month = "Aug";} else if (current_month == 8) {current_month = "Sept";} else if (current_month == 9) {current_month = "Oct";} else if (current_month == 10) {current_month = "Nov";} else if (current_month == 11) {current_month = "Dec";}if (minute < 10) {minute = "0" + minute;}if (second < 10) {second = "0" + second;}if (hour < 10) { hour = "0" + hour;}let current_time = hour + ":" + minute + ":" + second;document.getElementById('time').innerHTML = `<p>${current_time}</p>`;document.getElementById('date').innerHTML = `<p>${current_month} ${current_day}</p>`;}





async function update_all_ui(warnings) {
    if (warnings.length == 0) {
        document.getElementById('random_alert').innerHTML = `<p>Not Enough Information</p>`;
        document.getElementById('random_alert_topic').innerHTML = `<p>No Events</p>`;
        document.getElementById('random_alert_topic_expire').innerHTML = `<p>No Events</p>`;
        document.getElementById('total_warnings').innerHTML = `<p>WARN COUNT: 0</p>`;
    }else{
        let alert_type = warnings[Math.floor(Math.random() * warnings.length)]
        console.log(alert_type)
        let event_type = alert_type.event;
        if (event_type == `Severe Thunderstorm Warning`) { event_type = `Severe T-Storm Warning`;}
        if (event_type == `Severe Thunderstorm Watch`) { event_type = `Severe T-Storm Watch`;}
        let event_location = alert_type.locations;
        let event_expires = alert_type.expires;
        let event_message_type = alert_type.messageType;
        let event_indicated = alert_type.indiciated;
        if (event_indicated == undefined && !(event_type.includes(`Watch`))) { event_indicated = "ISSUED";};
        if (event_indicated == undefined && (event_type.includes(`Watch`))) { event_indicated = "CONSIDERABLE";};
        if (event_location.length > 220) {event_location = event_location.substring(0, 220) + "..."};
        document.getElementById('random_alert').innerHTML = `<p>${event_indicated.toUpperCase()} : ${(event_location.toUpperCase())}</p>`;
        document.getElementById('random_alert_topic').innerHTML = `<p>${event_type.toUpperCase()}</p>`;
        let date = new Date(event_expires);
        let timezone = date.getTimezoneOffset();
        let time_zone_offsets = {"CDT": 300,"CST": 360,"EDT": 240,"EST": 300,"MDT": 360,"MST": 420,"PDT": 420,"PST": 480}
        let time_zone = Object.keys(time_zone_offsets).find(key => time_zone_offsets[key] === timezone);
        let foirmat = `Expires: ${date.toLocaleString('default', { month: 'short', timeZone: 'MST' })} ${date.getDate()} ${date.getHours()}:${date.getMinutes()} ${time_zone}`;
            if (date.getMinutes() == 0) {
                foirmat = `Expires: ${date.toLocaleString('default', { month: 'short', timeZone: 'MST' })} ${date.getDate()} ${date.getHours()}:0${date.getMinutes()} ${time_zone}`;
            }
            document.getElementById('random_alert_topic_expire').innerHTML = `<p>${foirmat}</p>`;
        }
        document.getElementById('total_warnings').innerHTML = `<p>WARN COUNT: ${warnings.length}</p>`;
}

async function show_alert(t_event, t_alert, t_location) {
    let list_of_gifs = {
        'Tornado Warning' : 'GIFs/TOR.gif',
        'Tornado Warning 2': 'GIFs/PDS.gif',
        'Tornado Watch' : 'GIFs/TOR.gif',
        'Tornado Emergency': 'GIFs/EM.gif',
        'PDS': 'GIFs/PDS.gif',
        'Severe Thunderstorm Warning' : 'GIFs/SVR.gif',
        'Considerable Destructive Severe Thunderstorm Warning' : 'GIFs/SVR.gif',
        'Destructive Severe Thunderstorm Warning' : 'GIFs/PDS.gif',
        'Severe Thunderstorm Watch' : 'GIFs/SVR.gif',
        'Flash Flood Warning' : 'GIFs/FLASH.gif',
        'Flash Flood Watch' : 'GIFs/FLASH.gif',
        'Special Marine Warning' : 'GIFs/Marine.gif'
    }; 
    let gif = list_of_gifs[t_event];document.getElementById(`gif_notification`).src = gif;
    if (t_location.length > 108) { t_location = t_location.substring(0, 108) + '...';}
    document.getElementById('gif_notification').style.display = "block";
    setTimeout(function () {
        boolean_inCard = false
    }, 6900);
    setTimeout(function () { 
        document.getElementById('gif_notification').src = "https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png" 
    }, 7000);
    setTimeout(function () {
        document.getElementById('notification_title_event').innerHTML = `<div class="notification_title_event" style="animation: fade 6s linear forwards; font-weight: bold; color: #ffffff; text-shadow: #000000 0px 0px 10px;  animation-delay: 0s; color: white;">${t_alert}</div>`;
    }, 500);
    setTimeout(function () {
        document.getElementById('notification_subtitle_event').innerHTML = `<div class="notification_subtitle_event" style="animation: fade 4.5s linear forwards; font-weight: bold; color: white;animation-delay: 0s; color: black;">${t_location}</div>`;
    }, 700);
}

async function notify(t_event, t_location, t_type, t_detection) {
    let action_tables = {
        "Considerable Destructive Severe Thunderstorm Warning": {
            triggeredBy: "Considerable Destructive Severe Thunderstorm Warning",
            new: "S-Thunderstorm-Warning-Issued.mp3",
            update: "S-Thunderstorm-Warning-Updated.mp3",
            cancel: "Beep.mp3",
            notifyCard: "Severe Thunderstorm Warning (Considerable)",
        },
        "Destructive Severe Thunderstorm Warning": {
            triggeredBy: "Destructive Severe Thunderstorm Warning",
            new: "S-Thunderstorm-Warning-Issued.mp3",
            update: "S-Thunderstorm-Warning-Updated.mp3",
            cancel: "Beep.mp3",
            notifyCard: "Severe Thunderstorm Warning (Destructive)",
        },
        "Severe Thunderstorm Warning": {
            triggeredBy: "Severe Thunderstorm Warning",
            new: "S-Thunderstorm-Warning-Issued.mp3",
            update: "S-Thunderstorm-Warning-Updated.mp3",
            cancel: "Beep.mp3",
            notifyCard: "Severe Thunderstorm Warning",
        },
        "Tornado Warning": {
            triggeredBy: "Tornado Warning",
            new: "Tornado-Warning-Issued.mp3",
            update: "Tornado-Warning-Updated.mp3",
            cancel: "Beep.mp3",
            notifyCard: "Tornado Warning",
        },
        "Tornado Emergency": {
            triggeredBy: "Tornado Emergency",
            new: "Tornado-Emergency-Issued.mp3",
            update: "Tornado-Emergency-Issued.mp3",
            cancel: "Beep.mp3",
            notifyCard: "Tornado Emergency",
        },
        "PDS": {
            triggeredBy: "PDS",
            new: "PDS-Issued.mp3",
            update: "PDS-Issued.mp3",
            cancel: "Beep.mp3",
            notifyCard: "PARTICULARLY DANGEROUS SITUATION",
        },

        "Flash Flood Warning": {
            triggeredBy: "Flash Flood Warning",
            new: "Flash-Flood-Warning-Issued.mp3",
            update: "Flash-Flood-Warning-Updated.mp3",
            cancel: "Beep.mp3",
            notifyCard: "Flash Flood Warning",
        },
        "Special Marine Warning": {
            triggeredBy: "Special Marine Warning",
            new: "Special-Marine-Warning-Issued.mp3",
            update: "Special-Marine-Warning-Updated.mp3",
            cancel: "Beep.mp3",
            notifyCard: "Special Marine Warning",
        },
        "Flash Flood Watch": {
            triggeredBy: "Flash Flood Watch",
            new: "Beep.mp3",
            update: "Beep.mp3",
            cancel: "Beep.mp3",
            notifyCard: "Flash Flood Watch",
        },
        "Severe Thunderstorm Watch": {
            triggeredBy: "Severe Thunderstorm Watch",
            new: "Beep.mp3",
            update: "Beep.mp3",
            cancel: "Beep.mp3",
            notifyCard: "Severe Thunderstorm Watch",
        },
        "Tornado Watch": {
            triggeredBy: "Tornado Watch",
            new: "Beep.mp3",
            update: "Beep.mp3",
            cancel: "Beep.mp3",
            notifyCard: "Tornado Watch",
        },
    }



    if (boolean_inCard == false) { 
        boolean_inCard = true 
        console.log(t_detection)
        if (t_detection != undefined) {
            if (t_detection == `OBSERVED`) {
                t_detection = `Confirmed`
            }
            if (t_detection == `RADAR INDICATED`) {
                t_detection = `Radar Indicated`
            }
        }else{
            t_detection = `Expired`
        }
        for (let eventType in action_tables) {
            let t_triggeredBy = action_tables[eventType].triggeredBy
            let t_new = action_tables[eventType].new
            let t_update = action_tables[eventType].update
            let t_cancel = action_tables[eventType].cancel
            let t_notifyCard = action_tables[eventType].notifyCard
            if (t_event == t_triggeredBy) {
                if (t_type == `Alert`) {
                    play_sound(t_new)
                }
                if (t_type == `Update`) {
                    play_sound(t_update)
                }
                if (t_type == `Cancel`) {
                    play_sound(t_cancel)
                }
                if (t_type == `Alert`) {t_type = `Issued`}
                if (t_type == `Update`) {t_type = `Updated`}
                if (t_type == `Cancel`) {t_type = `Cancelled`}
                temp_event = t_event
                temp_event_txt = `${t_notifyCard} -  ${t_type}`
                if (t_event == "Tornado Warning"){
                    temp_event_txt = `${t_notifyCard} -  ${t_detection}`
                }
                if (t_event == "Tornado Warning" && t_detection == `Confirmed`) {
                    temp_event = `Tornado Warning 2`
                }
            }
        }
        boolean_inCard = false
    }
}


async function async_playQueue() {
    boolean_inQueue = true
    if (arr_currentQueue.length > 0) {
        for (let i = 0; i < arr_currentQueue.length; i++) {
            let t_currentAlert = arr_currentQueue[i]
            let t_event = t_currentAlert.event
            let t_message = t_currentAlert.messageType
            let t_desc = t_currentAlert.description.toLowerCase()
            let t_thunder = t_currentAlert.thunder
            let t_tornado = t_currentAlert.tornado
            let t_location = t_currentAlert.locations
            let t_id = i 
            if (t_desc.includes(`tornado emergency`)) {
                debug(`NOTIFY | ${t_event} >> ${t_location} playing...`)
                notify(`Tornado Emergency`, t_location, t_message, t_tornado)
            }else if (t_desc.includes(`particulary dangerous situation`) && t_event == `Tornado Warning`) {
                // notify functions here
                debug(`NOTIFY | ${t_event} >> ${t_location} playing...`)
                notify(`PDS`, t_location, t_message, t_tornado)
            }else{
                if (t_event == `Severe Thunderstorm Warning`) {
                    if (t_thunder == `CONSIDERABLE`) {
                        t_event = `Considerable Destructive Severe Thunderstorm Warning`
                        debug(`NOTIFY | ${t_event} >> ${t_location} playing...`)
                    }
                    if (t_thunder == `DESTRUCTIVE`) {
                        t_event = `Destructive Severe Thunderstorm Warning`
                    }
                }
                debug(`NOTIFY | ${t_event} >> ${t_location} playing...`)
                notify(t_event, t_location, t_message, t_tornado)
            }
            await _delay(8000)
        }
        arr_currentQueue = []
        boolean_inQueue = false
    }else{
        boolean_inQueue = false
    }
}

async function async_fetchAlerts() { 
    boolean_canFetch = false 
    arr_ActiveWarnings = []
    // Manual Alerts //
    try {
        fetch(`${home_ip_and_port}/api/manual`, {headers: global_header}).then(response => response.text()).then(data => {
            let arr_json = JSON.parse(data)
            if ( arr_json.eventType != undefined) {
                if (arr_json.locations != "") {
                    if (str_latestManualRequest != arr_json.eventType + arr_json.eventAction + arr_json.eventListing) {
                        str_latestManualRequest = arr_json.eventType + arr_json.eventAction + arr_json.eventListing
                        let q_build = { 
                            event: arr_json.eventType,
                            locations: arr_json.locations,
                            expires: `2024-05-20T23:00:00-05:00`,
                            messageType: arr_json.eventAction,
                            indicated: arr_json.eventListing,
                            thunder: `CONSIDERABLE`,
                            hail: undefined,
                            wind: undefined,
                            description: `N/A`,
                            tornado: arr_json.eventListing,
                        }
                        if (arr_currentQueue.includes(q_build) == false) {
                            arr_currentQueue.push(q_build)
                            debug(`QUEUE |  ${arr_json.eventType} >> Added`)
                        }
                    }
                    arr_ActiveWarnings.push({ event: arr_json.eventType, locations: arr_json.locations, expires: `2024-05-20T23:00:00-05:00`, messageType: arr_json.eventAction, indicated: arr_json.eventListing})
                }
            }
                fetch(`${home_ip_and_port}/api/active`, {headers: global_header}).then(response => response.text()).then(data => {
                let arr_json = JSON.parse(data)
                if ( arr_json.features != undefined) {
                    for (let i = 0; i < arr_json.features.length; i++) {  
                        let boolean_isValid = is_valid_alert(arr_json.features[i].properties.event)
                        let boolean_isTime = whithin_time_frame(arr_json.features[i].properties.expires)
                        let str_formattedLocations = format_locations(arr_json.features[i].properties.areaDesc)    
                        if (boolean_isValid && boolean_isTime) {
                            if (arr_ActiveWarnings.includes({event: arr_json.features[i].properties.event,locations: str_formattedLocations,expires: arr_json.features[i].properties.expires,messageType: arr_json.features[i].properties.messageType,indiciated: arr_json.features[i].properties.indiciated}) == false) {
                                arr_ActiveWarnings.push({event: arr_json.features[i].properties.event,locations: str_formattedLocations,expires: arr_json.features[i].properties.expires,messageType: arr_json.features[i].properties.messageType,indiciated: arr_json.features[i].properties.indiciated})
                                debug(`ACTIVE | ${arr_json.features[i].properties.event} >> Added`)
                            }
                        }
                    }
                }
                fetch(`${home_ip_and_port}/api/archive`, {headers: global_header}).then(response => response.text()).then(data => {
                    let arr_json = JSON.parse(data)
                    let int_sent_range = undefined 
                    if ( arr_json.features != undefined) {
                        for (let i = 0; i < arr_json.features.length; i++) {  
                            let boolean_isValid = is_valid_alert(arr_json.features[i].properties.event)
                            let boolean_isTime = whithin_time_frame(arr_json.features[i].properties.expires)
                            let str_formattedLocations = format_locations(arr_json.features[i].properties.areaDesc)    
                            if (boolean_isValid && boolean_isTime) {
                                let int_timeFrame = new Date(arr_json.features[i].properties.sent).getTime()
                                if (int_timeFrame > int_latestAlert) { 
                                    int_latestAlert = int_timeFrame
                                    str_latestAlert_tmp = `${arr_json.features[i].properties.event} ${arr_json.features[i].properties.messageType} ${str_formattedLocations}`
                                    let q_build = {
                                        event: arr_json.features[i].properties.event,
                                        locations: str_formattedLocations,
                                        expires: arr_json.features[i].properties.expires,
                                        messageType: arr_json.features[i].properties.messageType,
                                        indiciated: arr_json.features[i].properties.indiciated,
                                        thunder: arr_json.features[i].properties.parameters.thunderstormDamageThreat,
                                        hail: arr_json.features[i].properties.parameters.hailSize,
                                        wind: arr_json.features[i].properties.parameters.windGust,
                                        description: arr_json.features[i].properties.description,
                                        tornado: arr_json.features[i].properties.parameters.tornadoDetection,
                                    }
                                    if (is_new_alert(str_latestAlert_tmp)) {
                                        if (arr_currentQueue.includes(q_build) == false) {
                                            arr_currentQueue.push(q_build)
                                            str_latestAlert = str_latestAlert_tmp
                                            debug(`QUEUE | ${arr_json.features[i].properties.event} >> Added`)
                                        }
                                        let int_range_temp = new Date(arr_json.features[i].properties.expires).getTime()
                                        int_sent_range = int_range_temp
                                        let int_get_range = int_sent_range - 1000
                                        let int_unix = new Date().getTime()
                                        let int_diff = int_unix - int_get_range
                                        if (int_diff < 1 && arr_currentQueue.includes(q_build) == false) { 
                                            if (arr_currentQueue.includes(q_build) == false) {
                                                arr_currentQueue.push(q_build)
                                                debug(`QUEUE | ${arr_json.features[i].properties.event} >> Added`)
                                            }

                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (boolean_inQueue == false) {
                        async_playQueue()
                    }
                    setTimeout(() => {
                        debug(`CURRENT QUEUE | ${arr_currentQueue.length}`)
                        debug(`ACTIVE WARNINGS | ${arr_ActiveWarnings.length}`)
                        debug(`TIMER | Fetching is now enabled...`)
                        boolean_canFetch = true
                    }, 1000)
                })
            })
        })
    }catch(error) {
        boolean_canFetch = true
        debug(`ERROR | ${error}`)
    }
}



async function async_checkSyncing() {  // Syncing Clock
    fetch(`${home_ip_and_port}/api/sync`, {headers: global_header}).then(response => response.text()).then(data => {
        str_currentSyncStatus = data
    })
}




//// Timeouts and Intervals //////
setInterval(() => {
    async_checkSyncing();
    if (str_currentSyncStatus == -2 && boolean_syncingEnabled) {
        debug(`TIMER | Fetching is now disabled...`)
        boolean_syncingEnabled = false;
        if (boolean_canFetch == true) { 
            debug(`--------------------------------------------------------------`)
            async_fetchAlerts();
        }
    }else{
        async_checkSyncing();
        boolean_syncingEnabled = true;
    }
}, 500);
