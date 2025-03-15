
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

let geolocation = {}
geolocation.cache = {}
geolocation.cache.alerts = []

geolocation.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded Geolocation Functions`)
}
geolocation.create = function() {
    document.getElementById('atmospheric-alert-map').style.backgroundColor = 'black';
    if (!geolocation.cache.map) {
        geolocation.cache.map = L.map(document.getElementById('atmospheric-alert-map'));
        geolocation.cache.map.eachLayer(function (layer) { if (layer instanceof L.TileLayer) { geolocation.cache.map.removeLayer(layer);}});
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {className: 'map-tiles'}).addTo(geolocation.cache.map);
        geolocation.cache.map.setView([42.0171798, -93.9254114], 5, { animate: true, duration: 6.5 });
    }
}

geolocation.stormreports = async function() {
    let reports = JSON.parse(await library.request(`/api/reports`))
    let active = JSON.parse(await library.request(`/api/alerts`))
    for (let i = 0; i < active.length; i++) {
        // check if latest 
        let alert = active[i]
        if (alert.raw.geometry == undefined) {continue}
        let lat = alert.raw.geometry.coordinates[0][0][1]
        let lon = alert.raw.geometry.coordinates[0][1][0]
        let location = alert.details.locations;
        let sender = alert.details.sender;
        if (i == 0) {
            geolocation.cache.map.setView([lat, lon], 6, {animate: true, duration: 10});
            geolocation.cache.map.eachLayer(function (layer) {
                if (layer instanceof L.Marker) {geolocation.cache.map.removeLayer(layer)}
                if (layer instanceof L.Circle) {geolocation.cache.map.removeLayer(layer)}
            });
            let circle = L.circle([lat, lon], {color: 'black', fillColor: 'red', fillOpacity: 0.1, radius: 50000}).addTo(geolocation.cache.map).bindPopup(`<b>${alert.details.name} (${alert.details.type})</b><br>${location}`).openPopup();
            geolocation.cache.map.fitBounds(circle.getBounds());
            let opacity = 0.1;
            let fadeIn = true;
            setInterval(() => circle.setStyle({ fillOpacity: (fadeIn = opacity >= 0.5 ? false : opacity <= 0.1 ? true : fadeIn) ? opacity += 0.05 : opacity -= 0.05 }), 100);
        } else {
            L.circle([lat, lon], {color: 'black',fillColor: 'red',fillOpacity: 0.1,radius: 10000}).addTo(geolocation.cache.map).bindPopup(`<b>${alert.details.name} (${alert.details.type})</b><br>${location}<br><br><b>Sender:</b> ${sender}`)
        }
    }
    for (let i = 0; i < reports.length; i++) {
        console.log(reports[i]);
        let report = reports[i];
        let location = report.details.locations;
        let lat = report.raw.lat;
        let lon = report.raw.lon;
        let sender = report.details.sender;
        let value = report.raw.value;
        L.circle([lat, lon], {color: 'black',fillColor: 'blue',fillOpacity: 0.1,radius: 2000}).addTo(geolocation.cache.map).bindPopup(`<b>${report.details.name} (${report.details.type})</b><br>${location}<br><br><b>Sender:</b> ${sender}<br><b>Value:</b> ${value}`)
    }
}
geolocation.execute = async function() { 
    try {
        let active = JSON.parse(await library.request(`/api/alerts`))
        let manual = JSON.parse(await library.request(`/api/manual`))
        cache.config = JSON.parse( await library.request(`/api/configurations`))
        geolocation.cache.alerts = []
        for (let i = 0; i < active.length; i++) {
            let alert = active[i]
            geolocation.cache.alerts.push(alert) 
        }
        geolocation.stormreports()
        if (manual.length != 0) {geolocation.cache.alerts.push(manual)}  
    } catch (error) {console.log(error)}
}
geolocation.config = async function() {
    cache.config = JSON.parse( await library.request(`/api/configurations`))
    geolocation.create()
    geolocation.execute();
    setInterval(async () => {
        if (new Date().getSeconds() % cache.config['query:rate'] == 0) {
            if (cache.query) {return}
            cache.query = true
            setTimeout(() => {cache.query = false}, 1000)
            cache.config = JSON.parse( await library.request(`/api/configurations`))
            geolocation.execute();
        }
    }, 100);
}

