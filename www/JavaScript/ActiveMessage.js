
const home_ip_and_port = window.location.protocol + "//" + window.location.host;
const global_headers = { 'User-Agent': 'AtmosphericX','Accept': 'application/geo+json','Accept-Language': 'en-US' }
const whitelisted_events = [ 'Flash Flood Watch',  'Severe Thunderstorm Watch',  'Tornado Watch', 'Special Marine Warning', 'Flash Flood Warning', 'Severe Thunderstorm Warning', 'Tornado Warning']
let count_settings3 = {
    latest_string : '',
    latest_int : 0,
    total_warnings: 0,
    total_watches: 0,
    event_counts : { 
        'Tornado Emergencies': 0,
        'PDS Warnings': 0,
        'Tornado Confirmed Warnings': 0,
        'Tornado Radar Indicated Warnings': 0,
        'Desctructive Severe Thunderstorm Warnings': 0,
        'Considerable Desctructive Severe Thunderstorm Warnings': 0,
        'Severe Thunderstorm Warnings': 0,
        'Flash Flood Warnings': 0,
        'Special Marine Warnings': 0,
        'Severe Thunderstorm Watches': 0,
        'Tornado Watches': 0,
        'Flash Flood Watches': 0,
    }
}
fileLocation = `../Audio/eas.mp3`
audios = new Audio(fileLocation)
playAllowed = true
function playAudio () {
    if (playAllowed == false) {return;}
    playAllowed = false
    console.log(`Playing Audio: ${fileLocation}`)
    audios.volume = 0.5
    audios.play()
    setTimeout(() => {playAllowed = true}, 5000)
}


function decyph_event_1(event_table) {  
    let eventType = event_table.properties.event; 
    let eventDesc = event_table.properties.description.toLowerCase(); 
    let tornadoThreat = event_table.properties.parameters.tornadoDetection;
    let thunderstorm = event_table.properties.parameters.thunderstormDamageThreat; 
    if (eventDesc.includes(`particularly dangerous situation`)) { 
        return `PDS Warning`; 
    } else if (eventDesc.includes(`tornado emergency`) && eventType == `Tornado Warning`) { 
        return `Tornado Emergency`; 
    } else if (eventType == `Tornado Warning`) {  
        if (tornadoThreat == `RADAR INDICATED`) {
             return `Radar Indiciated Tornado Warning`; 
        } else if (tornadoThreat == `OBSERVED`) {
            return `Confirmed Tornado Warning`; 
        } else { 
            return `Tornado Warning`; 
        } 
    } else if (eventType == `Severe Thunderstorm Warning`) { 
        if (thunderstorm == `DESTRUCTIVE`) { 
            return `Destructive Severe Thunderstorm Warning`; 
        } else if (thunderstorm == `CONSIDERABLE`) { 
            return `Considerable Severe Thunderstorm Warning`;
        } else { 
            return `Severe Thunderstorm Warning`; 
        } 
    }else{ 
        return eventType; 
    }
}function format_state_1(locations) {  
    for (let i = 0; i < locations.length; i++) {
        if (locations[i] == ',') {
            state = locations.substring(i + 2, i + 4);
            return state;
        }
    }
    return 'NotInStates';
}
function is_new_alert_1(alert_temp) { 
    if (alert_temp == count_settings3.latest_string) { 
        return false; 
    }else{
        return true;
    }
}
function is_valid_alert_1(alert_temp) {
    for (let i = 0; i < whitelisted_events.length; i++) { 
        if (alert_temp == whitelisted_events[i]) { 
            return true;
        }
    }
    return false;
}
function format_locations_1(locations) { 
    following_areas = locations.split(','); 
    if (following_areas.length > 1) { 
        return `${following_areas}`;
    }
    return following_areas[0];
}
function whithin_time_frame_1(time_end) { 
    let time_epoch = new Date(time_end).getTime();
    let current_time = new Date().getTime();
    if (time_epoch > current_time) { 
        return true;
    }
    return false;
}
function reset_active_alerts_1() { 
     count_settings3.total_warnings = 0; 
     count_settings3.total_watches = 0; 
     let countsettings = Object.keys(count_settings3.event_counts); 
     for (let i = 0; i < countsettings.length; i++) { 
        count_settings3.event_counts[countsettings[i]] = 0; 
    } 
}

function request_active_alerts_1() {
    fetch(`${home_ip_and_port}/api/archive`, {headers: global_headers}).then(response => response.text()).then(data => {
        reset_active_alerts_1()
        let jsonData = JSON.parse(data);
        let alerts = jsonData.features;
        let updated = new Date(jsonData.updated);
        let better_time = new Date(updated).toLocaleString('default', { month: 'long' }) + ' ' + updated.getDate() + ', ' + updated.getFullYear() + ' ' + updated.getHours() + ':' + updated.getMinutes() + ':' + updated.getSeconds() + " - " + updated.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ')[2];
        if (updated.getMinutes() < 10) { better_time = new Date(updated).toLocaleString('default', { month: 'long' }) + ' ' + updated.getDate() + ', ' + updated.getFullYear() + ' ' + updated.getHours() + ':0' + updated.getMinutes() + ':' + updated.getSeconds() + " - " + updated.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ')[2];}
        document.getElementById("last_updated").innerHTML = `API Last Updated: ${better_time}`;
        for (let i = 0; i < alerts.length; i++) {
            let eventValid = is_valid_alert_1(alerts[i].properties.event)
            let eventExpire = whithin_time_frame_1(alerts[i].properties.expires)
            let eventLocations = alerts[i].properties.areaDesc
            let messageType = alerts[i].properties.messageType
            let eventType = alerts[i].properties.event
            let eventDesc = alerts[i].properties.description
            let tornadoThreat = alerts[i].properties.parameters.tornadoDetection
            let thunderstorm = alerts[i].properties.parameters.thunderstormDamageThreat
            if (eventValid == false || eventExpire == false) { continue; }
            if (eventType.includes(`Watch`)) { count_settings3.total_watches += 1;} 
            if (eventType.includes(`Warning`)) { count_settings3.total_warnings += 1;}      
            if (messageType == `Alert`) { messageType = `Issued`;}
            if (messageType == `Update`) { messageType = `Updated`;}
            if (messageType == `Cancel`) { messageType = `Expired/Cancelled`;}
            let time_frame =  alerts[i].properties.sent
            let time_start_time = new Date(time_frame).getTime()
            if (time_start_time > count_settings3.latest_int) {
                count_settings3.latest_int = time_start_time
                lat_text = "<p><i>Latest Response - " + messageType + "</i><br>" + eventType + " : " + format_locations_1(eventLocations) + "</p>"
                if (is_new_alert_1(lat_text) == true) {
                    if (messageType == `Alert`) { messageType = `Issued`;}
                    if (messageType == `Update`) { messageType = `Updated`;}
                    if (messageType == `Cancel`) { messageType = `Expired/Cancelled`;}
                    if (eventType == `Tornado Warning`) {if (tornadoThreat == undefined) {messageType = "Expired/Cancelled";}}
                    let what_is_event = decyph_event_1(alerts[i])
                    document.getElementById("latest_message").innerHTML = `${what_is_event} (${messageType})`
                    document.getElementById("latest_message_loco").innerHTML = `${format_locations_1(eventLocations)}`
                    // check if its mylocation 
                    fetch(`${home_ip_and_port}/api/location`, {headers: global_headers}).then(response => response.text()).then(data => {
                        if (format_locations_1(eventLocations).includes(data)) {
                            setTimeout(() => {
                                alert(`Critical Information for ${data} \n\n${what_is_event} (${messageType}) \n\n${eventDesc}`)
                            }, 1000)
                            playAudio()
                        }
                    })
                }
            }
        }
    }).catch(error => {
        console.log(`Error: ${error}`);
        console.log(`I am too lazy to fix errors that do happen right now. Please report them if you see them on the Github Repository \n\n${error}`);
    });
}
request_active_alerts_1()
setInterval(request_active_alerts_1, 8000);