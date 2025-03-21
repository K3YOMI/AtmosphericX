
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


let widgets = {}
widgets.cache = {}
widgets.cache.maplod = undefined
widgets.cache.pastalt = undefined
widgets.cache.focus = undefined
widgets.functions = {}

widgets.alert = {}
widgets.spc = {}
widgets.random = {}
widgets.bar = {}
widgets.map = {}
widgets.header = {}
widgets.warnings = {}
widgets.notifcations = {}

widgets.functions.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded Widget Functions`)
}
widgets.alert.send = function(animation_dict, alert_title, alert_description) {
    cache.alert++
    let doc_notification = document.getElementById(`alert_notification`)
    let doc_title = document.getElementById(`alert_title`)
    let doc_description = document.getElementById(`alert_description`)
    doc_notification.style.display = `block`;
    doc_notification.src = `${animation_dict}?alert=${cache.alert}`
    if (alert_description.length > 80) {alert_description = alert_description.substring(0, 80) + '...';}
    setTimeout(function() { 
        doc_notification.style.display = `none`; cache.running = false;
    }, 6800)
    setTimeout(function() { 
        doc_title.innerHTML = `<div class="alert_title" style="animation: fade 5s linear forwards; animation-delay: 0s;">${alert_title}</div>`;
    }, 500)
    setTimeout(function() {
        doc_description.innerHTML = `<div class="alert_description" style="animation: fade 4.5s linear forwards; animation-delay: 0s;">${alert_description}</div>`;
    }, 700)
}
widgets.spc.update = function(img, text) {
    if (widgets.spc.index == undefined) { widgets.spc.index = 0; }
    widgets.spc.index++
    let risks = cache.config['spc:outlooks']
    risks.sort((a, b) => a.day - b.day)
    widgets.spc.index = widgets.spc.index >= risks.length ? 0 : widgets.spc.index
    let risk = risks[widgets.spc.index]
    document.getElementById(img).src = risk.source
    document.getElementById(text).innerHTML = risk.title
}
widgets.random.set = async function(type='random_alert_title', strText, maxLength, animationStart='opacity0Animation', animationEnd='opacity100Animation') {
    if (strText.length > maxLength) { strText = strText.substring(0, maxLength) + '...';}
    if (cache.alerts.length == 1) {document.getElementById(type).innerHTML = strText; return;}
    if (cache.alerts.length == 0) {document.getElementById(type).innerHTML = 'Nothing to display'; return;}
    document.getElementById(type).style.animation = `${animationStart} 0.3s linear forwards`;
    await setTimeout(() => {
        document.getElementById(type).style.animation = `${animationEnd} 0.5s linear forwards`;
        document.getElementById(type).innerHTML = strText
    }, 500);
}
widgets.notifcations.set = function(id, titleid, subtitleid) {
    if (cache.broadcasts.length != 0) {
        if (cache.broadcasts.title.length > 20) { cache.broadcasts.title = cache.broadcasts.title.substring(0, 70) + '...'; }
        if (cache.broadcasts.message.length > 150) { cache.broadcasts.message = cache.broadcasts.message.substring(0, 150) + '...'; }
        document.getElementById(id).style.display = 'block';
        document.getElementById(titleid).innerHTML = cache.broadcasts.title;
        document.getElementById(subtitleid).innerHTML = cache.broadcasts.message;
    } else { 
        document.getElementById(id).style.display = 'none';
    }
}
widgets.bar.colorize = function() {
    let light = document.getElementsByClassName(`defaultBoxLight`)
    let dark = document.getElementsByClassName(`defaultBox`)
    let types = cache.config['overlay:settings']['color:scheme']
    types.forEach(type => {
        type.count = cache.alerts.filter(x => x.details.name.includes(type.type)).length;
    });
    let highest = types.find(type => {return type.count > 0; }) || types[types.length - 1];
    for (let x = 0; x<light.length; x++){
        light[x].style.backgroundColor = highest.color.light
    }
    for (let x = 0; x<dark.length; x++){
        dark[x].style.backgroundColor = highest.color.dark
    }
}
widgets.map.create = function() {
    document.getElementById('interactive-map').style.backgroundColor = 'black';
    if (!widgets.cache.maplod) {
        widgets.cache.maplod = L.map(document.getElementById('interactive-map'));
        widgets.cache.maplod.eachLayer(function (layer) { if (layer instanceof L.TileLayer) { widgets.cache.maplod.removeLayer(layer);}});
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {className: 'map-tiles'}).addTo(widgets.cache.maplod);
        widgets.cache.maplod.setView([42.0171798, -93.9254114], 5, { animate: true, duration: 6.5 });
    }
}
widgets.map.populate = function() {
    let active = cache.alerts
    let reports = cache.reports
    let spotters = cache.spotters
    let condition = false 
    let radar = cache.config['map:layers']['radar']['radar:layer:enable']
    let api = cache.config['map:layers']['radar']['radar:layer:api']
    let tracking = cache.config['map:layers']['tracking']
    widgets.cache.maplod.eachLayer(function (layer) { 
        if (!(layer instanceof L.TileLayer)) {
            if (radar == true) {
                widgets.cache.maplod.eachLayer(function (layer) {
                    if (layer.options && layer.options.className === 'map-tiles2') {
                        widgets.cache.maplod.removeLayer(layer);
                    }
                });
            }
 
            if (layer instanceof L.Polygon && layer != widgets.cache.focus) { widgets.cache.maplod.removeLayer(layer); }
            if (layer instanceof L.Circle) { widgets.cache.maplod.removeLayer(layer); }
        }
    });
    if (radar == true) { L.tileLayer(api, {className: 'map-tiles2', opacity: 0.4}).addTo(widgets.cache.maplod); }
    for (let i = 0; i < active.length; i++) {
        let alert = active[i]
        if (alert.raw.geometry == undefined) {continue}
        let coords = []
        for (let x = 0; x < alert.raw.geometry.coordinates.length; x++) {
            for (let y = 0; y < alert.raw.geometry.coordinates[x].length; y++) {
                coords.push(alert.raw.geometry.coordinates[x][y])
            }
        }
        let coordinates = alert.raw.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        let location = alert.details.locations;
        let sender = alert.details.sender;
        if (condition == false) {
            condition = true;
            if (widgets.cache.pastalt != JSON.stringify(alert)) { 
                widgets.cache.pastalt = JSON.stringify(alert);
                if (widgets.cache.focus) { widgets.cache.maplod.removeLayer(widgets.cache.focus); }
                let polygon = L.polygon(coordinates, {color: 'black', fillColor: 'red', fillOpacity: 0.1}).addTo(widgets.cache.maplod).bindPopup(`<b>${alert.details.name} (${alert.details.type})</b><br>${location}<br><br><b>Sender:</b> ${sender}</div>`)
                widgets.cache.focus = polygon;
                if (tracking == "" || tracking == "SPOTTER_NAME_HERE") { widgets.cache.maplod.fitBounds(polygon.getBounds(), {animate: true, duration: 2}); polygon.openPopup(); }
            }
        } else {
            L.polygon(coordinates, {color: 'black', fillColor: 'red', fillOpacity: 0.1, radius: 2000}).addTo(widgets.cache.maplod).bindPopup(`<b>${alert.details.name} (${alert.details.type})</b><br>${location}<br><br><b>Sender:</b> ${sender}`);
        }
    }
    for (let i = 0; i < reports.length; i++) {
        let report = reports[i];
        let location = report.details.locations;
        let lat = report.raw.lat;
        let lon = report.raw.lon;
        let sender = report.details.sender;
        let value = report.raw.value;
        L.circle([lat, lon], {color: 'white',fillColor: 'white',fillOpacity: 0.1,radius: 2000}).addTo(widgets.cache.maplod).bindPopup(`<b>${report.details.name} (${report.details.type})</b><br>${location}<br><br><b>Sender:</b> ${sender}<br><b>Value:</b> ${value}`)
    }
    for (let i = 0; i < spotters.length; i++) {
        let spotter = spotters[i];
        let description = spotter.description.toString().replace(/\\n/g, '<br>').replace('"', '');
        let { lat, lon, streaming } = spotter;
        let defaultColor = { color: 'red', fillColor: 'red', fillOpacity: 0.1, radius: 50 };
        let lastSeen = description.split('<br>')[1];
        let lastSeenTime = new Date(lastSeen + ' UTC').getTime();
        let currentTime = Date.now();
        let minutesElapsed = Math.floor((currentTime - lastSeenTime) / 60000);
        if (minutesElapsed < 30) {
            defaultColor = { color: 'yellow', fillColor: 'yellow', fillOpacity: 0.1, radius: 50 };
        }
        if (description.includes('Heading')) {
            defaultColor = { color: 'green', fillColor: 'green', fillOpacity: 0.1, radius: 50 };
        }
        if (streaming) {
            defaultColor = { color: 'blue', fillColor: 'blue', fillOpacity: 0.1, radius: 50 };
        }
        let circle = L.circle([lat, lon], defaultColor).addTo(widgets.cache.maplod).bindPopup(`<b>${description}</b>`);
        if (tracking && tracking !== "SPOTTER_NAME_HERE" && description.includes(tracking)) {
            circle.setStyle({ fillColor: 'pink', color: 'pink' });
            widgets.cache.maplod.fitBounds(circle.getBounds(), { maxZoom: 12, animate: true, duration: 2 });
        }
    }
}
widgets.header.update = function(id) {       
    if (cache.status == ``) {
        document.getElementById(id).innerHTML = `Active Warnings: ${cache.warnings.length}<br>Active Watches: ${cache.watches.length}` 
    } else { 
        if (cache.status.length > 15) {
            cache.status = cache.status.substring(0, 15) + '...';
        }
        document.getElementById(id).innerHTML = `${cache.status}`;
    }
}
widgets.warnings.update = function(id) {
    document.getElementById(id).innerHTML = `<tr><th>Type<hr></th><th>Location<hr></th></tr>`;
    cache.alerts.sort((a, b) => {return new Date(b.issued) - new Date(a.issued)})
    for (let i = 0; i < cache.alerts.length; i++) {
        if (i == 20) { break }
        let alert = cache.alerts[i]
        let table = document.getElementById(id)
        let row = table.insertRow(-1)
        let cell1 = row.insertCell(0)
        let cell2 = row.insertCell(1)
        cell1.innerHTML = alert.details.name.substring(0, 30);
        cell2.innerHTML = alert.details.locations.substring(0, 20);
    }
    if (cache.alerts.length > 20) {
        let table = document.getElementById(id)
        let row = table.insertRow(-1)
        let cell1 = row.insertCell(0)
        let cell2 = row.insertCell(1)
        cell1.innerHTML = "..."
        cell2.innerHTML = `+${cache.alerts.length - 20} more`
    }
}
