let list = []
let lib = new library()
let alreadyQuerying = false
async function executeQuery() {
    list = []
    let activeAlerts = await lib.getAlertAPI()
    let activeManuals = await lib.getActiveManual()
    activeManuals = JSON.parse(activeManuals)
    activeAlerts = JSON.parse(activeAlerts)
    for (let i = 0; i < activeAlerts.length; i++) {
        let alert = activeAlerts[i]
        list.push(alert)
    }
    if (activeManuals.length != 0) {list.push(activeManuals)}   
    document.getElementById("uialert").innerHTML = `<tr><th>Type<hr></th><th>Location<hr></th></tr>`
    
    for (let i = 0; i < list.length; i++) {
        // only allow 20 alerts to be displayed
        if (i == 20) { break }
        let alert = list[i]
        let table = document.getElementById("uialert")
        let row = table.insertRow(-1)
        let cell1 = row.insertCell(0)
        let cell2 = row.insertCell(1)
        cell1.innerHTML = alert.eventName.substring(0, 30);
        cell2.innerHTML = alert.locations.substring(0, 20);
    }
    if (list.length > 20) {
        let table = document.getElementById("uialert")
        let row = table.insertRow(-1)
        let cell1 = row.insertCell(0)
        let cell2 = row.insertCell(1)
        cell1.innerHTML = "..."
        cell2.innerHTML = `+${list.length - 20} more`
    }
}

async function configSetup() {
    config = await lib.getConfigurations();
    let requestQueryRate = config['QUERY_RATE']
    let table = document.getElementById("uialert")
    table.innerHTML = `<tr><th>Type<hr></th><th>Location<hr></th></tr>`
    let row = table.insertRow(-1)
    let cell1 = row.insertCell(0)
    let cell2 = row.insertCell(1)
    cell1.innerHTML = "Syncing Stream"
    cell2.innerHTML = "Syncing Stream"
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
