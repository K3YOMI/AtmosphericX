
let lib = new library();
let streamlib = new stream();
let ipAddress = lib.getAddress();
let isStreaming = true;
let warningList = []
let watchList = []
let queryList = []
let lastQueries = []
let latestAlert = []
let latestManual = []
let queue = []
let alreadyQuerying = false
let firstRun = true

if (window.location.pathname.includes(`portable`)) {
    isStreaming = false;
    lib.setStreamMode(false)
    console.log(`Streaming Mode Disabled`)
}else{
    lib.setStreamMode(true)
}

async function executeQuery() {
    let activeAlerts = await lib.getAlertAPI();
    let activeWarnings = await lib.getActiveWarnings();
    let activeWatches = await lib.getActiveWatches();
    let activeManuals = await lib.getActiveManual();
    let getNotificationAPI = await lib.getNotificationAPI();
    activeWarnings = JSON.parse(activeWarnings)
    activeWatches = JSON.parse(activeWatches)
    activeAlerts = JSON.parse(activeAlerts)
    activeManuals = JSON.parse(activeManuals)
    getNotificationAPI = JSON.parse(getNotificationAPI)
    warningList = activeWarnings
    watchList = activeWatches
    if (activeManuals.length != 0) {
        let eventName = activeManuals.eventName
        let eventDescription = activeManuals['eventDescription']
        let eventMessage = activeManuals['messageType']
        activeAlerts.push(activeManuals)
        let inQueue = queue.find(x => x.eventName == eventName && x.eventDescription == eventDescription && x.messageType == eventMessage)
        if (eventName.includes(`Warning`)) {warningList.push(activeManuals)}
        if (eventName.includes(`Watch`)) {watchList.push(activeManuals)}
        if (eventName.includes(`Tornado Emergency`) || eventName.includes(`Flash Flood Emergency`) || eventName.includes(`Particularly Dangerous Situation`)) {
            warningList.push(activeManuals)
        }
        if (inQueue == undefined && latestManual != eventName + eventDescription + eventMessage) {
            latestManual = eventName + eventDescription + eventMessage
            queue.push(activeManuals)
        }
    }
    if (isStreaming) {
        if (getNotificationAPI.length != 0) {
            let notificationShow = document.getElementById('notificationBox');
            notificationShow.style.display = 'block';
            let notificationTitle = document.getElementById('warning_title');
            let notificationSubtitle = document.getElementById('warning_subtitle');
            notificationTitle.innerHTML = getNotificationAPI.title;
            notificationSubtitle.innerHTML = getNotificationAPI.message;
        } else {
            let notificationShow = document.getElementById('notificationBox');
            notificationShow.style.display = 'none';
        }
    }
    if (activeAlerts.length != 0) {
        for (let i = 0; i < activeAlerts.length; i++) {
            let latestAlert = activeAlerts[i]
            let eventName = latestAlert.eventName
            let eventDesc = latestAlert.eventDescription
            let messageType = latestAlert.messageType
            let timeIssued = latestAlert.issued
            let timeExpires = latestAlert.expires
            let findDuplicate = lastQueries.find(x => x.eventName == eventName && x.eventDescription == eventDesc && x.messageType == messageType && x.issued == timeIssued && x.expires == timeExpires)
            let currentTime = new Date().getTime() / 1000
            let timeCheck = currentTime - new Date(timeIssued).getTime() / 1000;
            if (timeCheck > 8 && timeCheck < 600 && findDuplicate == undefined && firstRun == false) {
                queue.push(latestAlert)
                lastQueries.push(latestAlert)
            }
            else if (firstRun == true && findDuplicate == undefined && timeCheck > 8 && timeCheck < 120) {
                queue.push(latestAlert)
                lastQueries.push(latestAlert)
            } else { 
                if (findDuplicate && timeCheck > 1600) {
                    let index = lastQueries.indexOf(findDuplicate)
                    if (index > -1) {
                        lastQueries.splice(index, 1)
                    }
                }
            }
        }
        firstRun = false
    }
    streamlib.runQuery(queue)
    if (isStreaming) {
        streamlib.updateDashboardListings(warningList, activeAlerts)
    }
}

async function configSetup() {
    setTimeout(() => {
        lib.isMobile()
        document.getElementById('random_alert').innerHTML = `<p>Syncing Stream</p>`;
        document.getElementById('random_alert_topic').innerHTML = `<p>Syncing Stream</p>`;
        document.getElementById('total_warnings').innerHTML = `<h2>Syncing Stream</h2>`;
    }, 1)
    let requestQueryRate = await lib.getQueryRate();
    setTimeout(() => {if (isStreaming) { streamlib.updateGeneralListings(warningList)}}, 10)
    setInterval(() => {if (isStreaming) { streamlib.updateGeneralListings(warningList)}}, 100)
    setInterval(() => {
        if (new Date().getSeconds() % requestQueryRate == 0) { // Every 10 seconds
            if (alreadyQuerying) {return}
            alreadyQuerying = true
            executeQuery();
            setTimeout(() => {alreadyQuerying = false}, 1000)
        }
    }, 200);
}
configSetup()



