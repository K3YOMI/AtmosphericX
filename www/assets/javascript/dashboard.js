
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
    Version: 5.5.2                              
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
    try {
        dashboard.reset()
        cache.warnings = JSON.parse(await library.request(`/api/warnings`))
        cache.watches = JSON.parse(await library.request(`/api/watches`))
        cache.alerts = JSON.parse(await library.request(`/api/alerts`))
        cache.broadcasts = JSON.parse(await library.request(`/api/notifications`))
        cache.manual = await library.request(`/api/manual`)

        cache.config = JSON.parse( await library.request(`/api/configurations`))
        let tActivity = [
            {title: `Active Alerts`,id: `active_alerts_int`,data: cache.alerts.length},
            {title: `Active Watches`,id: `active_watches_int`,data: cache.watches.length},
            {title: `Active Warnings`, id: `active_warnings_int`,data: cache.warnings.length},
        ]

        dashboard.generatecards(document.getElementById('warning-center'), tActivity)
        if (cache.manual != `[]`) {cache.alerts.unshift(JSON.parse(cache.manual))}
        let tRecentAlerts = []
        for (let i = 0; i < cache.alerts.length; i++) {
            if (i > 5) {break}
            let alert = cache.alerts[i]
            let location = cache.config['application:location']
            if (!alert.details.locations.includes(location)) {
                let payload = `alert(\`${alert.details.name} (${alert.details.type})\\n${alert.details.description}\`);`
                let builder = {id: `alert_${i}`, title: `${alert.details.name} (${alert.details.type})`, data: `${alert.details.locations.substring(0, 250)}`, onclick: payload}
                tRecentAlerts.push(builder)
            }else {
                let payload = `alert(\`${alert.details.name} (${alert.details.type})\\n${alert.details.description}\`);`
                let builder = {id: `alert_${i}`, title: `${alert.details.name} (${alert.details.type})`, data: `${alert.details.locations.substring(0, 250)}`, onclick: payload, danger: true}
                tRecentAlerts.push(builder)
            }
        }
        dashboard.generatecards(document.getElementById('recent-alerts'), tRecentAlerts, `mini-card`)
        await dashboard.fillRegions()
        let tRegions = []
        for (let i = 0; i < dashboard.cache.states.length; i++) {
            let state = dashboard.cache.states[i]
            if (state.alerts.length == 0) {continue}
            let latest = state.alerts[state.alerts.length - 1]
            let payload = `let regionSelected = document.getElementById('region-selected'); let regionSelectedText = document.getElementById('region-selected-text'); let regionSelectedData = document.getElementById('region-selected-data'); let region = dashboard.cache.states.filter(state => state.state == "${state.state}"); regionSelectedText.innerHTML = "Alerts for " + region[0].state; regionSelectedData.innerHTML = ""; for (let i = 0; i < region[0].alerts.length; i++) { let talert = region[0].alerts[i]; let div = document.createElement('div'); let title = document.createElement('h1'); let hr = document.createElement('hr'); let p = document.createElement('p'); div.classList.add("mini-card"); title.innerHTML = talert.details.name + " (" + talert.details.type + ")"; div.style.gridTemplateColumns = "1fr 1fr 1fr 1fr"; p.innerHTML = "Location: " + talert.details.locations.substring(0, 55) + "<br>Issued: " + talert.details.issued + "<br>Expires: " + talert.details.expires + "<br>Wind Speed: " + talert.details.wind + "<br>Hail Threat: " + talert.details.hail + "<br>Tornado Threat: " + talert.details.tornado + "<br>Sender: " + talert.details.sender + "<br>Link: <a href='" + talert.details.link + "'>View Alert</a>"; div.appendChild(title); div.appendChild(hr); div.appendChild(p); div.onclick = function() { alert(talert.details.name + " (" + talert.details.type + ")\\n" + talert.details.description); }; regionSelectedData.appendChild(div); } regionSelected.style.display = "block";`
            let builder = {
                id: `state_${i}`, 
                title: `${state.state}`, 
                data: `Total Alerts: ${state.alerts.length}<br>Latest Alert: ${latest.details.name} (${latest.details.type})<br>Location: ${latest.details.locations.substring(0, 55)}<br>Issued: ${latest.details.issued}<br>Expires: ${latest.details.expires}<br>Wind Speed: ${latest.details.wind}<br>Hail Threat: ${latest.details.hail}<br>Tornado Threat: ${latest.details.tornado}<br>Sender: ${latest.details.sender}<br>Link: <a href="${latest.details.link}">View Alert</a>`, onclick: payload}
            tRegions.push(builder)
        }
        dashboard.generatecards(document.getElementById('regions'), tRegions, `mini-card`)
    } catch (error) {console.log(error)}

}
dashboard.page = async function(page) { 
    let pages = ['dashboard-home', 'external-services', 'outlooks', 'settings', 'map'];
    for (let i = 0; i < pages.length; i++) {
        if (pages[i] == page) {
            document.getElementById(page).style.display = 'block';
        } else {
            document.getElementById(pages[i]).style.display = 'none';
        }
    }
}
dashboard.config = async function() {
    cache.config = JSON.parse( await library.request(`/api/configurations`))
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
            cache.config = JSON.parse( await library.request(`/api/configurations`))
            dashboard.execute();
        }
    }, 200);
}
dashboard.generatesite = function() {
    let externalServices = [
        { title: "Live Storm Chasing", url: "https://livestormchasing.com/", imgSrc: "/assets/media/misc/storm-live-logo.png" },
        { title: "Hourly Mesoscale Analysis", url: "https://www.spc.noaa.gov/exper/mesoanalysis/new/viewsector.php?sector=19&parm=pmsl", imgSrc: "/assets/media/misc/mesoscale-logo.png" },
        { title: "Nexlab", url: "https://weather.cod.edu/#", imgSrc: "/assets/media/misc/nexlab-logo.png" },
        { title: "GFS Model", url: "https://www.tropicaltidbits.com/analysis/models/", imgSrc: "/assets/media/misc/tropical-logo.png" },
        { title: "HRRR Model", url: "https://www.tropicaltidbits.com/analysis/models/?model=hrrr", imgSrc: "/assets/media/misc/tropical-logov2.png" },
        { title: "Pivotal Weather (Hodographs)", url: "https://www.pivotalweather.com/model.php?p=sbcape_hodo&fh=3", imgSrc: "/assets/media/misc/pivotal-weather.png" }
    ];
    let stormoutlookServices = [
        { title: "Day 1 Categorial Risk", imgSrc: "https://www.spc.noaa.gov/products/outlook/day1otlk.gif" },
        { title: "Day 2 Categorial Risk", imgSrc: "https://www.spc.noaa.gov/products/outlook/day2otlk.gif" },
        { title: "Day 3 Categorial Risk", imgSrc: "https://www.spc.noaa.gov/products/outlook/day3otlk.gif" },
        { title: "Day 1 Tornado Risk", imgSrc: "https://www.spc.noaa.gov/products/outlook/day1probotlk_torn.gif" },
        { title: "Day 1 Wind Risk", imgSrc: "https://www.spc.noaa.gov/products/outlook/day1probotlk_wind.gif" },
        { title: "Day 1 Hail Risk", imgSrc: "https://www.spc.noaa.gov/products/outlook/day1probotlk_hail.gif" },
        { title: "Day 2 Tornado Risk", imgSrc: "https://www.spc.noaa.gov/products/outlook/day2probotlk_torn.gif" },
        { title: "Day 2 Wind Risk", imgSrc: "https://www.spc.noaa.gov/products/outlook/day2probotlk_wind.gif" },
        { title: "Day 2 Hail Risk", imgSrc: "https://www.spc.noaa.gov/products/outlook/day2probotlk_hail.gif" }
    ];
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
        img.src = service.imgSrc;
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
        img.src = service.imgSrc;
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