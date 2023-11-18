const home_ip_and_port2 = window.location.protocol + "//" + window.location.host;

const global_header2 = { 'User-Agent': 'AtmosphericX','Accept': 'application/geo+json','Accept-Language': 'en-US' }
const whitelisted_events2 = [ 'Flash Flood Watch',  'Severe Thunderstorm Watch',  'Tornado Watch', 'Special Marine Warning', 'Flash Flood Warning', 'Severe Thunderstorm Warning', 'Tornado Warning']


let count_settings = {
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

let state_conversion = [
    {name: 'Alabama', abbreviation: 'AL', alerts : []},
    {name: 'Alaska', abbreviation: 'AK', alerts : []},
    {name: 'Arizona', abbreviation: 'AZ', alerts : []},
    {name: 'Arkansas', abbreviation: 'AR', alerts : []},
    {name: 'California', abbreviation: 'CA', alerts : []},
    {name: 'Colorado', abbreviation: 'CO', alerts : []},
    {name: 'Connecticut', abbreviation: 'CT', alerts : []},
    {name: 'Delaware', abbreviation: 'DE', alerts : []},
    {name: 'Florida', abbreviation: 'FL', alerts : []},
    {name: 'Georgia', abbreviation: 'GA', alerts : []},
    {name: 'Hawaii', abbreviation: 'HI', alerts : []},
    {name: 'Idaho', abbreviation: 'ID', alerts : []},
    {name: 'Illinois', abbreviation: 'IL', alerts : []},
    {name: 'Indiana', abbreviation: 'IN', alerts : []},
    {name: 'Iowa', abbreviation: 'IA', alerts : []},
    {name: 'Kansas', abbreviation: 'KS', alerts : []},
    {name: 'Kentucky', abbreviation: 'KY', alerts : []},
    {name: 'Louisiana', abbreviation: 'LA', alerts : []},
    {name: 'Maine', abbreviation: 'ME', alerts : []},
    {name: 'Maryland', abbreviation: 'MD', alerts : []},
    {name: 'Massachusetts', abbreviation: 'MA', alerts : []},
    {name: 'Michigan', abbreviation: 'MI', alerts : []},
    {name: 'Minnesota', abbreviation: 'MN', alerts : []},
    {name: 'Mississippi', abbreviation: 'MS', alerts : []},
    {name: 'Missouri', abbreviation: 'MO', alerts : []},
    {name: 'Montana', abbreviation: 'MT', alerts : []},
    {name: 'Nebraska', abbreviation: 'NE', alerts : []},
    {name: 'Nevada', abbreviation: 'NV', alerts : []},
    {name: 'New Hampshire', abbreviation: 'NH', alerts : []},
    {name: 'New Jersey', abbreviation: 'NJ', alerts : []},
    {name: 'New Mexico', abbreviation: 'NM', alerts : []},
    {name: 'New York', abbreviation: 'NY', alerts : []},
    {name: 'North Carolina', abbreviation: 'NC', alerts : []},
    {name: 'North Dakota', abbreviation: 'ND', alerts : []},
    {name: 'Ohio', abbreviation: 'OH', alerts : []},
    {name: 'Oklahoma', abbreviation: 'OK', alerts : []},
    {name: 'Oregon', abbreviation: 'OR', alerts : []},
    {name: 'Pennsylvania', abbreviation: 'PA', alerts : []},
    {name: 'Rhode Island', abbreviation: 'RI', alerts : []},
    {name: 'South Carolina', abbreviation: 'SC', alerts : []},
    {name: 'South Dakota', abbreviation: 'SD', alerts : []},
    {name: 'Tennessee', abbreviation: 'TN', alerts : []},
    {name: 'Texas', abbreviation: 'TX', alerts : []},
    {name: 'Utah', abbreviation: 'UT', alerts : []},
    {name: 'Vermont', abbreviation: 'VT', alerts : []},
    {name: 'Virginia', abbreviation: 'VA', alerts : []},
    {name: 'Washington', abbreviation: 'WA', alerts : []},
    {name: 'West Virginia', abbreviation: 'WV', alerts : []},
    {name: 'Wisconsin', abbreviation: 'WI', alerts : []},
    {name: 'Wyoming', abbreviation: 'WY', alerts : []},
    {name: 'Other', abbreviation: 'NotInStates', alerts : []},
]
function decyph_event(event_table) {  
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
}
function format_state(locations) {  
    for (let i = 0; i < locations.length; i++) {
        if (locations[i] == ',') {
            state = locations.substring(i + 2, i + 4);
            return state;
        }
    }
    return 'NotInStates';
}
function is_new_alert(alert_temp) { 
    if (alert_temp == count_settings.latest_string) { 
        return false; 
    }else{
        return true;
    }
}
function is_valid_alert(alert_temp) {
    for (let i = 0; i < whitelisted_events2.length; i++) { 
        if (alert_temp == whitelisted_events2[i]) { 
            return true;
        }
    }
    return false;
}
function format_locations(locations) { 
    following_areas = locations.split(','); 
    if (following_areas.length > 1) { 
        return `${following_areas}`;
    }
    return following_areas[0];
}
function whithin_time_frame(time_end) { 
    let time_epoch = new Date(time_end).getTime();
    let current_time = new Date().getTime();
    if (time_epoch > current_time) {
        return true;
    }
    return false;
}
function reset_active_alerts() {  
    count_settings.total_warnings = 0; 
    count_settings.total_watches = 0; 
    let countsettings = Object.keys(count_settings.event_counts); 
    for (let i = 0; i < countsettings.length; i++) { 
        count_settings.event_counts[countsettings[i]] = 0; 
    } 
    for (let i = 0; i < state_conversion.length; i++) {
        try { 
            state_conversion[i].alerts = [];
        } catch (error) {
            console.log(`I am too lazy to fix errors that do happen right now. Please report them if you see them on the Github Repository \n\n${error}`);
        }
    }
}
function import_alert(alert) {
    let get_state = format_state(alert.event_locations); 
    if (get_state == 'Other') { return; } 
    for (let i = 0; i < state_conversion.length; i++) { 
        if (state_conversion[i].abbreviation.toLowerCase() == get_state.toLowerCase()) { 
            state_conversion[i].alerts.push(alert); 
        } 
    } 
}

function remove_bad_literals(desc) { 
    desc = desc.replace(/\n/g, ' ');
    desc = desc.replace(/\r/g, ' ');
    desc = desc.replace(/\t/g, ' ');
    desc = desc.replace(/\"/g, ' ');
    desc = desc.replace(/\'/g, ' ');
    desc = desc.replace(/\//g, ' ');
    desc = desc.replace(/\-/g, ' ');
    desc = desc.replace(/\_/g, ' ');
    return desc;
}
function showWidget(data) {  
    document.getElementById("active_alerts_state").innerHTML = ``; 
    document.getElementById("widget").style.display = "block";  
    for (let i = 0; i < state_conversion.length; i++) {  
        if (state_conversion[i].name == data) {  
            data = state_conversion[i].alerts;  
            for (let x = 0; x < data.length; x++) {  
                document.getElementById("title_place").innerHTML = `${state_conversion[i].name}`;  
                if (data[x].event_locations.length > 25) {  
                    data[x].event_locations = data[x].event_locations.substring(0, 25) + "..."; 
                }   
                if (data[x].event_type == `Tornado Warning`) {
                    if (data[x].event_tornado_threat == `Not Calculated`) { 
                        data[x].event_message_type = `Cancelled/Expired`;
                    }
                }
                let new_desc = remove_bad_literals(data[x].event_desc); 
                document.getElementById("active_alerts_state").innerHTML += ` 
                <tr>
                <th scope="row">${data[x].event_type}</th> 
                <td>${data[x].event_locations}</td> 
                <td>${data[x].event_wind_gust}</td> 
                <td>${data[x].event_hail_size}</td> 
                <td>${data[x].event_tornado_threat}</td> 
                <td>${data[x].event_thunderstorm}</td>
                <td>${data[x].event_message_type}</td> 
                <td>${data[x].event_expires}</td> 
                <td><a onclick='alert("${new_desc}")' class="btn btn-primary btn-sm" role="button" aria-pressed="true">View</a></td> 
                <td><a href=${data[x].event_link} class="btn btn-primary btn-sm" role="button" aria-pressed="true">View</a></td></tr> `;  
            } 
        } 
    } 
}
function get_site_name() {
    let site_name = window.location.href;
    site_name = site_name.split('/');
    return site_name[site_name.length - 1];
}
function widget_close() {
    document.getElementById("active_alerts_state").innerHTML += ``; 
    document.getElementById("widget").style.display = "none";
}
function update_listings() {

        document.getElementById("active_alerts").innerHTML = ""; 
        for (let i = 0; i < state_conversion.length; i++) { 
            let table_state = state_conversion[i].name; 
            let table_warnings = state_conversion[i].alerts.length; 
            if (table_warnings == 0) { continue; } 
                document.getElementById("active_alerts").innerHTML += `
                <tr><th scope="row">${table_state}</th>
                <td>${table_warnings}</td>
                <td>${state_conversion[i].alerts[0].event_type}</td>
                <td>${state_conversion[i].alerts[0].event_sent}</td>
                <td><a onclick="showWidget('${table_state}')" class="btn btn-primary btn-sm" role="button" aria-pressed="true">View</a></td></tr>`; 
        } 
}
function request_active_alerts() {
    fetch(`${home_ip_and_port2}/api/active`, {headers: global_header2}).then(response => response.text()).then(data => {
        reset_active_alerts()
        let jsonData = JSON.parse(data);
        let alerts = jsonData.features;
        let updated = new Date(jsonData.updated);
        let better_time = new Date(updated).toLocaleString('default', { month: 'long' }) + ' ' + updated.getDate() + ', ' + updated.getFullYear() + ' ' + updated.getHours() + ':' + updated.getMinutes() + ':' + updated.getSeconds() + " - " + updated.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ')[2];
        if (updated.getMinutes() < 10) { better_time = new Date(updated).toLocaleString('default', { month: 'long' }) + ' ' + updated.getDate() + ', ' + updated.getFullYear() + ' ' + updated.getHours() + ':0' + updated.getMinutes() + ':' + updated.getSeconds() + " - " + updated.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ')[2];}
        document.getElementById("last_updated").innerHTML = `API Last Updated: ${better_time}`;
        for (let i = 0; i < alerts.length; i++) {
            let eventValid = is_valid_alert(alerts[i].properties.event)
            let eventExpire = whithin_time_frame(alerts[i].properties.expires)
            let eventLocations = alerts[i].properties.areaDesc
            let messageType = alerts[i].properties.messageType
            let eventType = alerts[i].properties.event
            let eventDesc = alerts[i].properties.description
            let tornadoThreat = alerts[i].properties.parameters.tornadoDetection
            let thunderstorm = alerts[i].properties.parameters.thunderstormDamageThreat
            let eventLink = alerts[i].id
            let eventHeadline = alerts[i].properties.headline
            let eventInstruction = alerts[i].properties.instruction
            let response = alerts[i].properties.response
            let windThreat = alerts[i].properties.parameters.windThreat
            let windGust = alerts[i].properties.parameters.maxWindGust
            let hailThreat = alerts[i].properties.parameters.hailThreat
            let hailSize = alerts[i].properties.parameters.maxHailSize
            let eventExpires = alerts[i].properties.expires
            let eventSender = alerts[i].properties.senderName
    
            if (eventValid == false || eventExpire == false) { continue; }
            if (eventType.includes(`Watch`)) { count_settings.total_watches += 1;} 
            if (eventType.includes(`Warning`)) { count_settings.total_warnings += 1;} 
            let lowerDesc = eventDesc.toLowerCase()
            what_is_it = decyph_event(alerts[i])
            if (what_is_it == `Tornado Emergency`) { count_settings.event_counts['Tornado Emergencies'] += 1;}
            if (what_is_it == `PDS Warning`) { count_settings.event_counts['PDS Warnings'] += 1;}
            if (what_is_it == `Confirmed Tornado Warning`) { count_settings.event_counts['Tornado Confirmed Warnings'] += 1;}
            if (what_is_it == `Radar Indiciated Tornado Warning`) { count_settings.event_counts['Tornado Radar Indicated Warnings'] += 1;}
            if (what_is_it == `Destructive Severe Thunderstorm Warning`) { count_settings.event_counts['Desctructive Severe Thunderstorm Warnings'] += 1;}
            if (what_is_it == `Considerable Severe Thunderstorm Warning`) { count_settings.event_counts['Considerable Desctructive Severe Thunderstorm Warnings'] += 1;}
            if (what_is_it == `Severe Thunderstorm Warning`) { count_settings.event_counts['Severe Thunderstorm Warnings'] += 1;}
            if (what_is_it == `Flash Flood Warning`) { count_settings.event_counts['Flash Flood Warnings'] += 1;}
            if (what_is_it == `Special Marine Warning`) { count_settings.event_counts['Special Marine Warnings'] += 1;}
            if (what_is_it == `Severe Thunderstorm Watch`) { count_settings.event_counts['Severe Thunderstorm Watches'] += 1;}
            if (what_is_it == `Tornado Watch`) { count_settings.event_counts['Tornado Watches'] += 1;}
            if (what_is_it == `Flash Flood Watch`) { count_settings.event_counts['Flash Flood Watches'] += 1;}

            if (messageType == `Alert`) { messageType = `Issued`;}
            if (messageType == `Update`) { messageType = `Updated`;}
            if (messageType == `Cancel`) { messageType = `Expired`;}
            if (hailSize == undefined) { hailSize = `Not Calculated`;}
            if (hailThreat == undefined) { hailThreat = `Not Calculated`;}
            if (windGust == undefined) { windGust = `Not Calculated`;}
            if (windThreat == undefined) { windThreat = `Not Calculated`;}
            if (tornadoThreat == undefined) { tornadoThreat = `Not Calculated`;}
            if (thunderstorm == undefined) { thunderstorm = `Not Calculated`;}

          
            if (get_site_name() == 'site_alerts.html') {
                let alert_temp  = { event_type: what_is_it,event_desc: eventDesc,event_locations: eventLocations,event_sender: eventSender,event_link: eventLink,event_headline: eventHeadline,event_instruction: eventInstruction,event_response: response,event_thunderstorm: thunderstorm,event_tornado_threat: tornadoThreat,event_hail_size: hailSize,event_hail_threat: hailThreat,event_wind_gust: windGust,event_wind_threat: windThreat,event_expires: eventExpires,event_message_type: messageType,event_sent : alerts[i].properties.sent,}
                import_alert(alert_temp)  
                update_listings()
            }
        }
        if (get_site_name() == 'site_dashboard.html') {
            document.getElementById("total_warnings").innerHTML = `${count_settings.total_warnings} Active Warnings `;
            document.getElementById("total_watches").innerHTML = `${count_settings.total_watches} Active Watches`;
            document.getElementById("total_tore_emergencies").innerHTML = `${count_settings.event_counts["Tornado Emergencies"]} Warnings`;
            document.getElementById("total_pds_warnings").innerHTML = `${count_settings.event_counts["PDS Warnings"]} Warnings`;
            document.getElementById("total_tore_confirmed_warnings").innerHTML = `${count_settings.event_counts["Tornado Confirmed Warnings"]} Warnings`;
            document.getElementById("total_tore_radar_warnings").innerHTML = `${count_settings.event_counts["Tornado Radar Indicated Warnings"]} Warnings`;
            document.getElementById("total_desctructive_severe_warnings").innerHTML = `${count_settings.event_counts["Desctructive Severe Thunderstorm Warnings"]} Warnings`;
            document.getElementById("total_considerable_severe_warnings").innerHTML = `${count_settings.event_counts["Considerable Desctructive Severe Thunderstorm Warnings"]} Warnings`;
            document.getElementById("total_severe_warnings").innerHTML = `${count_settings.event_counts["Severe Thunderstorm Warnings"]} Warnings`;
            document.getElementById("total_flash_flood_warnings").innerHTML = `${count_settings.event_counts["Flash Flood Warnings"]} Warnings`;
            document.getElementById("total_marine_warnings").innerHTML = `${count_settings.event_counts["Special Marine Warnings"]} Warnings`;
            document.getElementById("total_severe_watches").innerHTML = `${count_settings.event_counts["Severe Thunderstorm Watches"]} Watches`;
            document.getElementById("total_tornado_watches").innerHTML = `${count_settings.event_counts["Tornado Watches"]} Watches`;
            document.getElementById("total_flash_flood_watches").innerHTML = `${count_settings.event_counts["Flash Flood Watches"]} Watches`;
        }
    }).catch(error => {
        if (get_site_name() == 'site_alerts.html') {
            update_listings()
        }
        console.log(`I am too lazy to fix errors that do happen right now. Please report them if you see them on the Github Repository \n\n${error}`);
    });
}
request_active_alerts()
setInterval(request_active_alerts, 5000);