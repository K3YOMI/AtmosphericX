const home_ip_and_port2 = window.location.protocol + "//" + window.location.host;


let count_settings = {
    total_warnings: 0,
    total_watches: 0,
    event_counts: {
        "Tornado Emergencies": 0,
        "PDS Warnings": 0,
        "Tornado Confirmed Warnings": 0,
        "Tornado Radar Indicated Warnings": 0,
        "Desctructive Severe Thunderstorm Warnings": 0,
        "Considerable Desctructive Severe Thunderstorm Warnings": 0,
        "Severe Thunderstorm Warnings": 0,
        "Flash Flood Warnings": 0,
        "Special Marine Warnings": 0,
        "Severe Thunderstorm Watches": 0,
        "Tornado Watches": 0,
        "Flash Flood Watches": 0,
        "Snow Squall Warnings": 0,
    }
}

let state_conversion = [ // Yeah, Idk why I did this. I could have just used the state abbreviation.
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

/**
 * Formats the state.
 * @param {string} locations
 * @returns {string}
*/

function format_state(locations) {  
    for (let i = 0; i < locations.length; i++) {
        if (locations[i] == ',') {
            state = locations.substring(i + 2, i + 4);
            return state;
        }
    }
    return 'NotInStates';
}

/**
 * Resets the active alerts.
 * @returns {void}
*/


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

/**
 * Imports an alert.
 * @param {object} alert
 * @returns {void}
*/


function import_alert(alert) {
    let get_state = format_state(alert.locations); 
    if (get_state == 'Other') { return; } 
    for (let i = 0; i < state_conversion.length; i++) { 
        if (state_conversion[i].abbreviation.toLowerCase() == get_state.toLowerCase()) { 
            state_conversion[i].alerts.push(alert); 
        } 
    } 
}

/**
 * Removes bad literals from the description.
 * @param {string} desc
 * @returns {string}
*/


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

/**
 * Shows the widget.
 * @param {string} data
 * @returns {void}
*/


function showWidget(data) {  
    document.getElementById("active_alerts_state").innerHTML = ``; 
    document.getElementById("widget").style.display = "block";  
    for (let i = 0; i < state_conversion.length; i++) {  
        if (state_conversion[i].name == data) {  
            data = state_conversion[i].alerts;  
            for (let x = 0; x < data.length; x++) {  
                document.getElementById("title_place").innerHTML = `Viewing ${state_conversion[i].name}`;  
                if (data[x].locations.length > 25) {  
                    data[x].locations = data[x].locations.substring(0, 25) + "..."; 
                }   
                if (data[x].event_type == `Tornado Warning`) {
                    if (data[x].event_tornado_threat == `Not Calculated`) { 
                        data[x].messageType = `Cancelled/Expired`;
                    }
                }
                let new_desc = remove_bad_literals(data[x].eventDescription); 
                document.getElementById("active_alerts_state").innerHTML += ` 
                <tr>
                <th scope="row">${data[x].eventName}</th> 
                <td>${data[x].locations}</td> 
                <td>${data[x].windThreat}</td> 
                <td>${data[x].hailThreat}</td> 
                <td>${data[x].tornadoThreat}</td> 
                <td>${data[x].thunderstormThreat}</td>
                <td>${data[x].messageType}</td> 
                <td>${data[x].expires}</td> 
                <td><a onclick='alert("${new_desc}")' class="btn btn-primary btn-sm" role="button" aria-pressed="true">View</a></td> 
                <td><a href=${data[x].link} style="text-decoration: none; color: rgb(198, 198, 198);" aria-pressed="true">View</a></td></tr> `;
            } 
        } 
    } 
}

/**
 * Gets the name of the site.
 * @returns {string}
*/


function get_site_name() {
    let site_name = window.location.href;
    site_name = site_name.split('/');
    return site_name[site_name.length - 1];
}

/**
 * Closes the widget.
 * @returns {void}
*/


function widget_close() {
    document.getElementById("active_alerts_state").innerHTML += ``; 
    document.getElementById("widget").style.display = "none";
}


/**
 * Updates the active alerts and watches on the page.
 * @returns {void}
 * 
*/

function update_listings() {
    document.getElementById("active_alerts").innerHTML = ""; 
    for (let i = 0; i < state_conversion.length; i++) { 
        let table_state = state_conversion[i].name; 
        let table_warnings = state_conversion[i].alerts.length; 
        console.log(table_state, table_warnings);
        if (table_warnings == 0) { continue; } 
        document.getElementById("active_alerts").innerHTML += `
        <tr><th scope="row">${table_state}</th>
        <td>${table_warnings}</td>
        <td>${state_conversion[i].alerts[0].eventName}</td>
        <td>${state_conversion[i].alerts[0].issued}</td>
        <td><a onclick="showWidget('${table_state}')" aria-pressed="true">View</a></td></tr>`; 
    } 
}


/**
 * Fetches the active alerts and watches from the server and updates the active alerts and watches on the page.
 * @returns {Promise<void>}
*/


async function request_active_alerts() {
    reset_active_alerts();
    await fetch(`${home_ip_and_port2}/api/active_warnings`).then(response => response.text()).then(data => {
        let jsonData = JSON.parse(data);
        for (let i = 0; i < jsonData.length; i++) {
            import_alert(jsonData[i]);
        }
        count_settings.total_warnings = jsonData.length
    })
    await fetch(`${home_ip_and_port2}/api/active_watches`).then(response => response.text()).then(data => {
        let jsonData = JSON.parse(data);
        for (let i = 0; i < jsonData.length; i++) {
            import_alert(jsonData[i]);
        }
        count_settings.total_watches = jsonData.length
    })
    update_listings()
    document.getElementById("active_warnings").innerHTML = `${count_settings.total_warnings} Active Warnings `;
    document.getElementById("active_watches").innerHTML = `${count_settings.total_watches} Active Watches`;
}
request_active_alerts()
setInterval(request_active_alerts, 5000);

