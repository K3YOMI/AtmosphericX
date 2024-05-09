
let lib = new library();
let dash = new dashboard();
let alreadyQuerying = false


let latest = []
let total_warnings = 0
let total_watches = 0 
let state_conversion = [ // Holds all alerts based on state
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



async function applicationEvents() {
    let submitLogout = document.getElementById('logout');
    let submitChangePassword = document.getElementById('changepassword');
    let submitButtonNotification = document.getElementById('submit_alert_notification');
    let submitButton = document.getElementById('submit_alert');
    let submitForceButton = document.getElementById('submit_force');

    submitChangePassword.addEventListener('click', function(event) {
        window.location.replace(window.location.protocol + "//" + window.location.host + "/newpassword.html")
    })


    submitLogout.addEventListener('click', function(event) {
        let ipAddress = window.location.protocol + "//" + window.location.host;
        let url = ipAddress + "/api/logout"
        fetch(url, {method: 'POST',headers: {'Content-Type': 'application/json'}})
        setTimeout(() => {
            window.location.replace(window.location.protocol + "//" + window.location.host)
        }, 100)
    });
    submitButtonNotification.addEventListener('click', function(event) {
        let alertTitle = document.getElementById('alert_title_anc').value;
        let alertMessage = document.getElementById('alert_msg_anc').value;
        let ipAddress = window.location.protocol + "//" + window.location.host;
        let url = ipAddress + "/api/notification"
        let postData = {
            "title": alertTitle,
            "message": alertMessage
        }
        fetch(url, {method: 'POST',headers: {'Content-Type': 'application/json'},body: JSON.stringify(postData)})
    });
    submitForceButton.addEventListener('click', function(event) {
        let ipAddress = lib.getAddress();
        let url = ipAddress + "/api/forcerequest";
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }});
    });
    submitButton.addEventListener('click', function(event) {
        let eventType = document.getElementById('eventType_sel').value;
        let eventAction = document.getElementById('eventAction_sel').value;
        let eventListing = document.getElementById('eventListing_sel').value;
        let locations = document.getElementById('alert_title').value;
        let ipAddress = lib.getAddress();
        let url = ipAddress + "/api/manual";
        let postData = {
            "event": eventType,
            "properties": {
                "event": eventType,
                "description": "N/A",
                "messageType": eventAction,
                "expires": "N/A",
                "indiciated": eventListing,
                "areaDesc": locations,
                "parameters": {}
            }
        };
        fetch(url, {method: 'POST',headers: {'Content-Type': 'application/json'},body: JSON.stringify(postData)});
    });
}

function showPage(page) {
    var pages = ['alert-page', 'external-services', 'outlooks', 'settings'];
    for (var i = 0; i < pages.length; i++) {
        if (pages[i] == page) {
            document.getElementById(page).style.display = 'block';
        } else {
            document.getElementById(pages[i]).style.display = 'none';
        }
    }
}

async function executeQuery() {
    dash.resetDashboardListings();
    let activeAlerts = await lib.getAlertAPI(); 
    let activeWarnings = await lib.getActiveWarnings(); 
    let activeWatches = await lib.getActiveWatches();
    let activeManuals = await lib.getActiveManual();
    let mySpecifiedLocation = await lib.getLocationAPI();
    activeAlerts = JSON.parse(activeAlerts)
    activeWarnings = JSON.parse(activeWarnings)
    activeWatches = JSON.parse(activeWatches)
    activeManuals = JSON.parse(activeManuals)
    let alertsBox = document.getElementById('recent-alerts');

    dash.importAlert(activeManuals);
    for (let i = 0; i < activeWarnings.length; i++) {
        dash.importAlert(activeWarnings[i]);
    }
    for (let i = 0; i < activeWatches.length; i++) {
        dash.importAlert(activeWatches[i]);
    }

    total_warnings = activeWarnings.length
    total_watches = activeWatches.length
    totalAlerts = total_warnings + total_watches + activeManuals
    document.getElementById("active_warnings_int").innerHTML = `${total_warnings} Active Warning(s) `;
    document.getElementById("active_watches_int").innerHTML = `${total_watches} Active Watche(s)`;
    document.getElementById("active_alerts_int").innerHTML = `${totalAlerts} Active Alert(s)`;
    alertsBox.innerHTML = '';
    for (let i = 0; i < activeAlerts.length; i++) {
        if (i > 2) {break}
        let activeLatest = activeAlerts[i];
        let eventName = activeLatest.eventName
        let eventDesc = activeLatest.eventDescription
        let messageType = activeLatest.messageType
        let locations = activeLatest.locations
        let alertsBox = document.getElementById('recent-alerts');
        let alertBox = document.createElement('div');
        alertBox.className = 'mini-card';
        let alertTitle = document.createElement('h1');
        alertTitle.className = 'alert-title';
        alertTitle.innerHTML = `${eventName} (${messageType})`;
        let alertDesc = document.createElement('p');
        alertDesc.className = 'alert-desc';
        alertDesc.innerHTML = `${locations.substring(0, 100)}`;
        alertBox.appendChild(alertTitle);
        alertBox.appendChild(alertDesc);
        alertsBox.appendChild(alertBox);
        alertBox.addEventListener('click', function() {
            alert(`Event Name: ${eventName}\nEvent Description: ${eventDesc}\nMessage Type: ${messageType}\nLocations: ${locations}`)
        });
        if ((locations).includes(mySpecifiedLocation)) {
            alertBox.style.backgroundColor = '#cc1b1b'
            if (!latest.includes(eventName + locations + eventDesc)) {
                latest.push(eventName + locations + eventDesc)
                let mySpecifiedLocation = await lib.getLocationAPI();
                let ipAddress = lib.getAddress();
                await lib.delay(500)
                lib.playsoundlimited(`${ipAddress}/assets/media/audio/EASv2.mp3`)
                setTimeout(() => {
                    alert(`Critical Information for ${mySpecifiedLocation}:\nEvent Name: ${eventName}\nEvent Description: ${eventDesc}\nMessage Type: ${messageType}\nLocations: ${locations}`)
                }, 500)
            }
        }
    }
    dash.updateDashboardListings();

}

async function configSetup() {
    let requestQueryRate = await lib.getQueryRate();
    document.getElementById("active_warnings_int").innerHTML = `Syncing Stream`;
    document.getElementById("active_watches_int").innerHTML = `Syncing Stream`;
    document.getElementById("active_alerts_int").innerHTML = `Syncing Stream`;
    lib.isMobile()
    setInterval(() => {
        if (new Date().getSeconds() % requestQueryRate == 0) { // Every 10 seconds
            if (alreadyQuerying) {return}
            alreadyQuerying = true
            executeQuery();
            setTimeout(() => {alreadyQuerying = false}, 1000)
        }
    }, 200);
}
executeQuery();
configSetup()