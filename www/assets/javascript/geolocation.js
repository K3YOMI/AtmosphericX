
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
        geolocation.cache.map.setView([0, 0], 6, { animate: true, duration: 6.5 });
    }
}

geolocation.plot = async function(latest) {
    let location = latest.details.locations.split(',')[0]
    let state = latest.details.locations.split(',')[1].split(';')[0]
    fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + location + ', ' + state).then(response => response.json()).then(data => {
        if (data.length == 0) {return}
        let lat = data[0].lat
        let lon = data[0].lon
        geolocation.cache.map.setView([lat, lon], 6, {animate: true,duration: 10});
        geolocation.cache.map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {geolocation.cache.map.removeLayer(layer)}
            if (layer instanceof L.Circle) {geolocation.cache.map.removeLayer(layer)}
        });
        let circle = L.circle([lat, lon], {color: 'black',fillColor: 'red',fillOpacity: 0.1,radius: 50000}).addTo(geolocation.cache.map).bindPopup(`<b>${latest.details.name} (${latest.details.type})</b><br>${latest.details.locations}`).openPopup();
        geolocation.cache.map.fitBounds(circle.getBounds());
        let opacity = 0.1;
        let fadeIn = true;
        setInterval(() => circle.setStyle({ fillOpacity: (fadeIn = opacity >= 0.5 ? false : opacity <= 0.1 ? true : fadeIn) ? opacity += 0.05 : opacity -= 0.05 }), 100);
    })
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
        if (manual.length != 0) {geolocation.cache.alerts.push(manual)}  
        let alert = manual.length != 0 ? manual : geolocation.cache.alerts[0]
        if (geolocation.cache.latest != JSON.stringify(alert)) {
            console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: New Alert Detected`)
            geolocation.cache.latest = JSON.stringify(alert)
            if (alert.details.locations.includes(',')) {
                geolocation.plot(alert)
            }
        }
    } catch (error) {console.log(error)}
}

geolocation.config = async function() {
    cache.config = JSON.parse( await library.request(`/api/configurations`))
    geolocation.create()
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

