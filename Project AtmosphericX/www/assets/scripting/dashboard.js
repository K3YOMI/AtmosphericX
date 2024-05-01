
let lib = new library();
let dash = new dashboard();


let latest = undefined
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

async function executeCustomAlert() {
    let submitButton = document.getElementById('submit_alert');
    let submitForceButton = document.getElementById('submit_force');

    submitForceButton.addEventListener('click', function(event) {

        let ipAddress = lib.getAddress();
        let url = ipAddress + "/api/forcerequest";
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
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
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });
    });
}



async function executeCustomNotification() {
    let submitButtonNotification = document.getElementById('submit_alert_notification');
    submitButtonNotification.addEventListener('click', function(event) {
        let alertTitle = document.getElementById('alert_title_anc').value;
        let alertMessage = document.getElementById('alert_msg_anc').value;
        let ipAddress = window.location.protocol + "//" + window.location.host;
        let url = ipAddress + "/api/notification"
        let postData = {
            "title": alertTitle,
            "message": alertMessage
        }
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        })
    });
}
async function executeQuery() {
    dash.resetDashboardListings();
    let activeAlerts = await lib.getAlertAPI(); 
    let activeWarnings = await lib.getActiveWarnings(); 
    let activeWatches = await lib.getActiveWatches();
    let activeManuals = await lib.getActiveManual();
    activeAlerts = JSON.parse(activeAlerts)
    activeWarnings = JSON.parse(activeWarnings)
    activeWatches = JSON.parse(activeWatches)
    activeManuals = JSON.parse(activeManuals)
    let activeLatest = activeAlerts[0]
    if (activeLatest != undefined) {
        let eventName = activeLatest.eventName
        let eventDesc = activeLatest.eventDescription
        let messageType = activeLatest.messageType
        let locations = activeLatest.locations
        let updated = activeLatest.issued
        if (latest != eventName + eventDesc + messageType + locations + updated) {
            latest = eventName + eventDesc + messageType + locations + updated
            document.getElementById("last_updated").innerHTML = `Last Updated: ${updated}`;
            document.getElementById("latest_message").innerHTML = `Event Name: ${eventName} (${messageType})`
            document.getElementById("latest_message_loco").innerHTML = `Locations Include: ${locations}`
            document.getElementById("latest_description").innerHTML = `Note: ${eventDesc}`
            let mySpecifiedLocation = await lib.getLocationAPI();
            if ((locations).includes(mySpecifiedLocation)) {
                setTimeout(() => {
                    alert(`Critical Information for ${mySpecifiedLocation} \n\n${eventName} (${messageType}) \n\n${eventDesc}`)
                }, 1000)
                let ipAddress = lib.getAddress();
                lib.playsoundlimited(`${ipAddress}/assets/media/audio/EASv2.mp3`)
            }
        }
    }
    for (let i = 0; i < activeWarnings.length; i++) {
        dash.importAlert(activeWarnings[i]);
    }
    for (let i = 0; i < activeWatches.length; i++) {
        dash.importAlert(activeWatches[i]);
    }
    dash.importAlert(activeManuals);
    total_warnings = activeWarnings.length
    total_watches = activeWatches.length
    document.getElementById("active_warnings").innerHTML = `${total_warnings} Active Warning(s) `;
    document.getElementById("active_watches").innerHTML = `${total_watches} Active Watche(s)`;
    dash.updateDashboardListings();

}


executeQuery();
setInterval(async () => {executeQuery()}, 8000);