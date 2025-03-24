
/*
                                            _               _     __   __
         /\  | |                           | |             (_)    \ \ / /
        /  \ | |_ _ __ ___   ___  ___ _ __ | |__   ___ _ __ _  ___ \ V / 
       / /\ \| __| '_ ` _ \ / _ \/ __| '_ \| '_ \ / _ \ '__| |/ __| > <  
      / ____ \ |_| | | | | | (_) \__ \ |_) | | | |  __/ |  | | (__ / . \ 
     /_/    \_\__|_| |_| |_|\___/|___/ .__/|_| |_|\___|_|  |_|\___/_/ \_\
                                     | |                                 
                                     |_|                                                                                                                
    
    Written by: k3yomi@GitHub                     Primary API: https://api.weather.gov
    Version: 6.0.0                              
*/


let dashboard = {}
dashboard.cache = {}
dashboard.cache.states = []
dashboard.cache.warnings = 0
dashboard.cache.watches = 0
dashboard.cache.total = 0
dashboard.cache.called = []

dashboard.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded Dashboard Functions`)
}
dashboard.logout = async function() {
    let logout = document.getElementById('logout');
    logout.addEventListener('click', function(event) {
        event.preventDefault();
        fetch(`/api/logout`, {
            method: `POST`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify()
        }).then(response => { 
            setTimeout(() => {
                window.location.replace(`/`);
            }, 100)
        }).catch(error => {})
    })  
}
dashboard.notification = async function() {
    let notification = document.getElementById('btn_submitNotification');
    notification.addEventListener('click', function(event) {
        event.preventDefault();
        let title =  document.getElementById('notificiation_announcement').value;
        let message = document.getElementById('notification_message').value;
        fetch(`/api/notification`, {
            method: `POST`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title, message: message })
        }).then(response => { }).catch(error => {})
    })
}
dashboard.status = async function() { 
    let notification = document.getElementById('btn_submitStatus');
    notification.addEventListener('click', function(event) {
        event.preventDefault();
        let title =  document.getElementById('status_message').value;
        fetch(`/api/status`, {
            method: `POST`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title })
        }).then(response => { }).catch(error => {})
    })
}
dashboard.forcerequest = async function() { 
    let forcerequest = document.getElementById('btn_forceRequest');
    forcerequest.addEventListener('click', function(event) {
        event.preventDefault();
        fetch(`/api/forcerequest`, {
            method: `POST`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        }).then(response => { }).catch(error => {})
    })
}
dashboard.manualrequest = async function() { 
    let forcerequest = document.getElementById('btn_submitAlert');
    forcerequest.addEventListener('click', function(event) {
        let eventType = document.getElementById('select_alerts').value;
        let action = document.getElementById('select_type').value;
        let observationtype = document.getElementById('select_reaction').value;
        let locations = document.getElementById('input_location').value;
        event.preventDefault();
        fetch(`/api/manual`, {
            method: `POST`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: eventType, properties: { senderName:"Manual Admin Override", event: eventType, description: "N/A", messageType: action, expires: "N/A", indicated: observationtype, areaDesc: locations, parameters: {} } }),
        }).then(response => { }).catch(error => {})
    })
}
dashboard.reset = async function() { 
    for (let i = 0; i < dashboard.cache.states.length; i++) {
        let state = dashboard.cache.states[i]
        state.alerts = []
    }
}
dashboard.states = async function() { 
    let result = JSON.parse(await library.request(`/api/states`))
    for (let i = 0; i < result.length; i++) {
        dashboard.cache.states.push( {
            state: result[i].name,
            abbreviation: result[i].abbreviation,
            alerts: []
        })
    }
}
dashboard.getAbbreviation = function(locations) {
    if (locations == undefined) { return `Other` }
    for (let i = 0; i < locations.length; i++) {
        if (locations[i] == ',') {
            let state = locations.substring(i + 2, i + 4);
            return state;
        }
    }
    return `Other`
}
dashboard.fillRegions = async function() {
    for (let i = 0; i < dashboard.cache.states.length; i++) {
        let state = dashboard.cache.states[i]
        for (let j = 0; j < cache.alerts.length; j++) {
            let alert = cache.alerts[j]
            let abbreviation = dashboard.getAbbreviation(alert.details.locations)
            if (abbreviation == state.abbreviation) {
                dashboard.cache.states[i].alerts.push(alert)
            }
        }
    }
}
dashboard.generatecards = async function(caller, storage, classname=`data-card`) {
    caller.innerHTML = '' 
    for (let i = 0; i < storage.length; i++) {
        let data = storage[i]
        let card = document.createElement('div')
        let title = document.createElement('h1')
        let hr = document.createElement('hr')
        let p = document.createElement('p')
        card.classList.add(classname)
        title.innerHTML = data.title
        p.id = data.id
        p.innerHTML = `${data.data}`
        card.appendChild(title)
        card.appendChild(hr)
        card.appendChild(p)
        caller.appendChild(card)
        if (data.onclick == undefined) {continue}
        card.onclick = function() {
            eval(data.onclick)
        }
        if (data.danger == true) {
            card.style.backgroundColor = `#cc1b1b`;
            card.style.transition = 'background-color 1s ease-in-out infinite';
            setInterval(() => {
                card.style.backgroundColor = card.style.backgroundColor === 'rgb(204, 27, 27)' ? '' : '#cc1b1b';
            }, 500);
            setTimeout(() => {
                if (dashboard.cache.called.includes(data.data + data.title + data.id)) {return}
                library.play(cache.config['application:sounds']['application:amber'], true)
                dashboard.cache.called.push(data.data + data.title + data.id)
                eval(data.onclick)
            }, 2000)
        }
    }
    if (storage.length == 0) {
        let p = document.createElement('h1')
        p.id = `no_data`
        p.innerHTML = `There is currently no data to display.`
        caller.appendChild(p)
    }
}
dashboard.execute = async function() {
    let response = JSON.parse(await library.request(`/api/all`))
    cache.warnings = response.warnings ? response.warnings : []
    cache.watches = response.watches ? response.watches : []
    cache.manual = response.manual ? response.manual : []
    cache.alerts = response.active ? response.active : []
    cache.broadcasts = response.broadcasts ? response.broadcasts : []
    cache.reports = response.reports  ? response.reports : []
    cache.config = response.configurations ? response.configurations : []
    cache.statistics = response.statistics ? response.statistics : []
    cache.mesoscale = response.mesoscale ? response.mesoscale : ``
    cache.lightning = response.lightning ? response.lightning : []
    cache.spotters = response.spotters ? response.spotters : []
    await dashboard.reset()
    await dashboard.fillRegions()
    let tReports = []
    let tStatisticsByCount = []
    let tStats = []
    let tMesoscale = []
    let tRecentAlerts = []
    let tLightning = []
    let tRegions = []
    let tActivityAlerts = [
        {title: `Alerts`,id: `active_alerts_int`,data: `<center><h1 style="font-size: 30px">${cache.alerts.length}</h1></center>`},
        {title: `Watches`,id: `active_watches_int`,data: `<center><h1 style="font-size: 30px">${cache.watches.length}</h1></center>`},
        {title: `Warnings`, id: `active_warnings_int`,data: `<center><h1 style="font-size: 30px">${cache.warnings.length}</h1></center>`},
        {title: `Reports`, id: `active_reports_int`, data: `<center><h1 style="font-size: 30px">${cache.reports.length}</h1></center>`},
        {title: `Lightning Strikes`, id: `active_lightning_int`, data: `<center><h1 style="font-size: 30px">${cache.lightning.length}</h1></center>`},
        {title: `Mesoscale Discussions`, id: `active_meso_int`, data: `<center><h1 style="font-size: 30px">${cache.mesoscale.length}</h1></center>`},
        {title: `Active Network Members`, id: `active_spotter_network_int`, data: `<center><h1 style="font-size: 30px">${cache.spotters.filter(spotter => spotter.active == 1).length}</h1></center>`},
        {title: `Streaming Network Members`, id: `streaming_spotter_network_int`, data: `<center><h1 style="font-size: 30px">${cache.spotters.filter(spotter => spotter.streaming == 1).length}</h1></center>`}

    ]
    let tHostingStats = [
        {title: `External Calls`, id: `operations_int`, data: `<center><h1 style="font-size: 30px">${cache.statistics.operations}</h1></center>`},
        {title: `Internal Calls`, id: `requests_int`, data: `<center><h1 style="font-size: 30px">${cache.statistics.requests}</h1></center>`},
        {title: `Memory`, id: `memory_int`, data: `<center><h1 style="font-size: 30px">${cache.statistics.memory}</h1></center>`},
        {title: `CPU`, id: `cpu_int`, data: `<center><h1 style="font-size: 30px">${cache.statistics.cpu}</h1></center>`}
    ]
    for (let i = 0; i < cache.reports.length; i++) {
        tReports.push({id: `report_${i}`, title: `${cache.reports[i].details.name}`, data: `Location: ${cache.reports[i].details.locations}<br>Sender: ${cache.reports[i].details.sender}<br>Value: ${cache.reports[i].raw.value}<br>Valid Thru: ${cache.reports[i].details.expires}<br>Description: ${cache.reports[i].details.description}`})
    }
    for (let i = 0; i < cache.mesoscale.length; i++) {
        if (cache.mesoscale[i] != "") {
            
            tMesoscale.push({id: `meso_${i}`, title: `Mesoscale Discussion #${i + 1}`, data: `${cache.mesoscale[i]}`, onclick: `alert(\`${cache.mesoscale[i]}\`);`})
        }
    }
    for (let i = 0; i < cache.lightning.length; i++) {
        tLightning.push({id: `lightning_${i}`, title: `Lightning Strike #${i + 1}`, data: `Latitude: ${cache.lightning[i].lat}<br>Longitude: ${cache.lightning[i].lon}`})
    }
    for (let i = 0; i < cache.alerts.length; i++) {
        if (!tStatisticsByCount.some(stat => stat.type == cache.alerts[i].details.name)) {
            tStatisticsByCount.push({type: cache.alerts[i].details.name, count: 1})
            continue
        }
        tStatisticsByCount[tStatisticsByCount.indexOf(tStatisticsByCount.filter(stat => stat.type == cache.alerts[i].details.name)[0])].count += 1
    }
    tStatisticsByCount.sort((a, b) => (a.count < b.count) ? 1 : -1)
    for (let i = 0; i < tStatisticsByCount.length; i++) {
        tStats.push({id: `stat_${i}`, title: `${tStatisticsByCount[i].type}`, data: `<h1>Total: ${tStatisticsByCount[i].count}</h1>`})
    }
    if (cache.manual.length != 0) {cache.alerts.unshift(JSON.parse(JSON.stringify(cache.manual)))}
    for (let i = 0; i < cache.alerts.length; i++) {
        if (i > 5) {break}
        let alert = cache.alerts[i]
        let location = cache.config['application:location']
        if (!alert.details.locations.includes(location)) {
            let payload = `alert(\`${alert.details.name} (${alert.details.type})\\n${alert.details.description}\`);`
            let builder = {id: `alert_${i}`, title: `${alert.details.name} (${alert.details.type})`, data: `<br>Location: ${alert.details.locations.substring(0, 55)}<br>Issued: ${alert.details.issued}<br>Expires: ${alert.details.expires}<br>Wind Speed: ${alert.details.wind}<br>Hail Threat: ${alert.details.hail}<br>Tornado Threat: ${alert.details.tornado}<br>Sender: ${alert.details.sender}<br>Link: <a href="${alert.details.link}">View Alert</a>`, onclick: payload}
            tRecentAlerts.push(builder)
        } else { 
            let payload = `alert(\`${alert.details.name} (${alert.details.type})\\n${alert.details.description}\`);`
            let builder = {id: `alert_${i}`, title: `${alert.details.name} (${alert.details.type})`, data: `<br>Location: ${alert.details.locations.substring(0, 55)}<br>Issued: ${alert.details.issued}<br>Expires: ${alert.details.expires}<br>Wind Speed: ${alert.details.wind}<br>Hail Threat: ${alert.details.hail}<br>Tornado Threat: ${alert.details.tornado}<br>Sender: ${alert.details.sender}<br>Link: <a href="${alert.details.link}">View Alert</a>`, onclick: payload, danger: true}
            tRecentAlerts.push(builder)
        }
    }
    for (let i = 0; i < dashboard.cache.states.length; i++) {
        let state = dashboard.cache.states[i]
        if (state.alerts.length == 0) {continue}
        let latest = state.alerts[state.alerts.length - 1]
        let payload = `let regionSelected = document.getElementById('region-selected'); let regionSelectedText = document.getElementById('region-selected-text'); let regionSelectedData = document.getElementById('region-selected-data'); let region = dashboard.cache.states.filter(state => state.state == "${state.state}"); regionSelectedText.innerHTML = "Alerts for " + region[0].state; regionSelectedData.innerHTML = ""; for (let i = 0; i < region[0].alerts.length; i++) { let talert = region[0].alerts[i]; let div = document.createElement('div'); let title = document.createElement('h1'); let hr = document.createElement('hr'); let p = document.createElement('p'); div.classList.add("mini-card"); title.innerHTML = talert.details.name + " (" + talert.details.type + ")"; div.style.gridTemplateColumns = "1fr 1fr 1fr 1fr"; p.innerHTML = "Location: " + talert.details.locations.substring(0, 55) + "<br>Issued: " + talert.details.issued + "<br>Expires: " + talert.details.expires + "<br>Wind Speed: " + talert.details.wind + "<br>Hail Threat: " + talert.details.hail + "<br>Tornado Threat: " + talert.details.tornado + "<br>Sender: " + talert.details.sender + "<br>Link: <a href='" + talert.details.link + "'>View Alert</a>"; div.appendChild(title); div.appendChild(hr); div.appendChild(p); div.onclick = function() { alert(talert.details.name + " (" + talert.details.type + ")\\n" + talert.details.description); }; regionSelectedData.appendChild(div); } regionSelected.style.display = "block"; document.getElementById('grid-dropdown-selected-container').style.display = 'block'; document.getElementById('grid-dropdown-selected').classList.remove('fa-chevron-right'); document.getElementById('grid-dropdown-selected').classList.add('fa-chevron-up'); document.getElementById('grid-dropdown-selected').scrollIntoView();`
        let builder = {
            id: `state_${i}`, 
            title: `${state.state}`, 
            data: `Total Alerts: ${state.alerts.length}<br>Latest Alert: ${latest.details.name} (${latest.details.type})<br>Location: ${latest.details.locations.substring(0, 55)}<br>Issued: ${latest.details.issued}<br>Expires: ${latest.details.expires}<br>Wind Speed: ${latest.details.wind}<br>Hail Threat: ${latest.details.hail}<br>Tornado Threat: ${latest.details.tornado}<br>Sender: ${latest.details.sender}<br>Link: <a href="${latest.details.link}">View Alert</a>`, onclick: payload}
        tRegions.push(builder)
    }
    dashboard.generatecards(document.getElementById('reports-center'), tReports)
    dashboard.generatecards(document.getElementById('warning-center'), tActivityAlerts, `mini-card`)
    dashboard.generatecards(document.getElementById('recent-alerts'), tRecentAlerts, `mini-card`)
    dashboard.generatecards(document.getElementById('regions'), tRegions, `mini-card`)
    dashboard.generatecards(document.getElementById('hosting-stats'), tHostingStats, `mini-card`)
    dashboard.generatecards(document.getElementById('warning-statistics'), tStats, `mini-card`)
    dashboard.generatecards(document.getElementById('meso-discussions'), tMesoscale, `mini-card`)
    dashboard.generatecards(document.getElementById('lightning-strikes'), tLightning, `mini-card`)
}

dashboard.page = async function(page) { 
    let pages = ['dashboard-home', 'external-services', 'outlooks', 'settings', 'map', 'storm-reports']
    for (let i = 0; i < pages.length; i++) {
        if (pages[i] == page) {
            document.getElementById(page).style.display = 'block';
        } else {
            document.getElementById(pages[i]).style.display = 'none';
        }
    }
}
dashboard.toggle = async function(parent, child) {
    let c = document.getElementById(child);
    let p = document.getElementById(parent);
    if (p.style.display == 'none') {
        p.style.display = 'block';
        c.classList.remove('fa-chevron-right');
        c.classList.add('fa-chevron-up');
    } else {
        p.style.display = 'none';
        c.classList.remove('fa-chevron-up');
        c.classList.add('fa-chevron-right');
    }
}
dashboard.config = async function() {
    let response = JSON.parse(await library.request(`/api/all`))
    cache.config = response.configurations
    await library.isMobile()
    dashboard.execute();
    dashboard.states();
    dashboard.generatesite();
    dashboard.logout();
    dashboard.notification();
    dashboard.status();
    dashboard.forcerequest();
    dashboard.manualrequest();
    setInterval(async () => {
        if (new Date().getSeconds() % cache.config['query:rate'] == 0) {
            if (cache.query) {return}
            cache.query = true
            setTimeout(() => {cache.query = false}, 1000)
            dashboard.execute();
        }
    }, 200);
}
dashboard.generatesite = function() {
    let externalServices = cache.config['external:services']
    let stormoutlookServices = cache.config['spc:outlooks']
    let external = document.getElementById('external-services-area');
    external.innerHTML = '';
    externalServices.forEach(service => {
        let card = document.createElement('div');
        card.classList.add('data-card');
        let title = document.createElement('h1');
        title.innerText = service.title;
        let hr = document.createElement('hr');
        let img = document.createElement('img');
        img.classList.add('service-img');
        img.src = service.image;
        img.onclick = () => window.open(service.url, '_blank', 'width=1000,height=1000');
        card.appendChild(title);
        card.appendChild(hr);
        card.appendChild(img);
        external.appendChild(card);
    });
    let outlook = document.getElementById('storm-outlook-area');
    outlook.innerHTML = '';
    stormoutlookServices.forEach(service => {
        let card = document.createElement('div');
        card.classList.add('data-card');
        let title = document.createElement('h1');
        title.innerText = service.title;
        let hr = document.createElement('hr');
        let img = document.createElement('img');
        img.classList.add('service-img-non-visual');
        img.src = service.source;
        card.appendChild(title);
        card.appendChild(hr);
        card.appendChild(img);
        outlook.appendChild(card);
    });
    let selectalerts = document.getElementById(`select_alerts`);
    for (let i = 0; i < cache.config['request:allalerts'].length; i++) {
        let option = document.createElement('option');
        option.value = cache.config['request:allalerts'][i];
        option.text = cache.config['request:allalerts'][i];
        selectalerts.appendChild(option);
    }
}
dashboard.config()