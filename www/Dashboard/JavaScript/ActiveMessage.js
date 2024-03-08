
const home_ip_and_port = window.location.protocol + "//" + window.location.host;
let latest = undefined

/**
 * Plays a sound from the given url (aka audio file)
 * @param {*} url 
*/

function playAudio (url) {
    let audios = new Audio(url)
    audios.volume = 0.5
    audios.play()
}

/**
 * Requests the active alerts from the server and updates the dashboard with the latest alert
 * @param {*} url
 * @param {*} options
 * @returns
*/
function request_active_alerts_1() {
    fetch(`${home_ip_and_port}/api/alerts`).then(response => response.text()).then(data => {
        let jsonData = JSON.parse(data);
        let latestAlert = jsonData[0]
        if (latestAlert == undefined) { return }
        let eventName = latestAlert.eventName
        let eventDesc = latestAlert.eventDescription
        let messageType = latestAlert.messageType
        let locations = latestAlert.locations
        let updated = latestAlert.issued
        if (latest != eventName + eventDesc + messageType) {
            latest = eventName + eventDesc + messageType
            document.getElementById("last_updated").innerHTML = `Updated: ${updated}`;
            document.getElementById("latest_message").innerHTML = `Type: ${eventName} (${messageType})`
            document.getElementById("latest_message_loco").innerHTML = `Locations: ${locations}`
            fetch(`${home_ip_and_port}/api/location`).then(response => response.text()).then(data => {
                if ((locations).includes(data)) {
                    setTimeout(() => {
                        alert(`Critical Information for ${data} \n\n${eventName} (${messageType}) \n\n${eventDesc}`)
                    }, 1000)
                    playAudio(`${home_ip_and_port}/Media/Sounds/EAS.mp3`)
                }
            })
        }
    })
}
request_active_alerts_1()
setInterval(request_active_alerts_1, 8000);