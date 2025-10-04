/*
                                            _               _     __   __
         /\  | |                           | |             (_)    \ \ / /
        /  \ | |_ _ __ ___   ___  ___ _ __ | |__   ___ _ __ _  ___ \ V / 
       / /\ \| __| '_ ` _ \ / _ \/ __| '_ \| '_ \ / _ \ '__| |/ __| > <  
      / ____ \ |_| | | | | | (_) \__ \ |_) | | | |  __/ |  | | (__ / . \ 
     /_/    \_\__|_| |_| |_|\___/|___/ .__/|_| |_|\___|_|  |_|\___/_/ \_\
                                     | |                                 
                                     |_|                                                                                                                
    
    Written by: k3yomi@GitHub
    Version: v7.0.0                             
*/


let loader = require(`../loader.js`)


class Placefiles { 
    constructor() {
        this.name = `Placefiles`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    
    parsing = function(body = ``, type = undefined) {
        let imports = [];
        switch (type) {
            case 'weatherwise_storm_tracks':
                for (let data of body) {
                    imports.push({
                        name: data.name,
                        pressure: data.pressure + ` mb`,
                        wind_mph: data.wind_speed_mph + ` mph`,
                        ocean: data.ocean + ` Ocean`,
                        discussion: data.forecast_discussion,
                        last_updated: data.last_updated_at  
                    }); 
                }
                break 
            case 'tornado_probability':
                loader.packages.placefile.AtmosXPlacefileParser.parsePlacefile(body).then(parsed => {
                    for (let data of parsed) {
                        let probability = data.line.text.match(/ProbTor: (\d+)%/) ? data.line.text.match(/ProbTor: (\d+)%/)[1] : '0';
                        if (loader.cache.configurations.sources.miscellaneous_sources.tornado_probability.threshold > parseInt(probability)) continue;
                        imports.push({
                            type: 'tornado',
                            probability: probability,
                            shear: parseFloat(data.line.text.match(/Max LLAzShear: ([\d.]+)/) ? data.line.text.match(/Max LLAzShear: ([\d.]+)/)[1] : '0'),
                            description: data.line.text.replace(/\\n/g, '<br>')
                        });
                    }
                });
            break;
            case 'severe_probability':
                loader.packages.placefile.AtmosXPlacefileParser.parsePlacefile(body).then(parsed => {
                    for (let data of parsed) {
                        let probability = data.line.text.match(/PSv3: (\d+)%/) ? data.line.text.match(/PSv3: (\d+)%/)[1] : '0';
                        if (loader.cache.configurations.sources.miscellaneous_sources.severe_probability.threshold > parseInt(probability)) continue;
                        imports.push({
                            type: 'severe',
                            probability: probability,
                            shear: parseFloat(data.line.text.match(/Max LLAzShear: ([\d.]+)/) ? data.line.text.match(/Max LLAzShear: ([\d.]+)/)[1] : '0'),
                            description: data.line.text.replace(/\\n/g, '<br>')
                        });
                    }
                });
            break;
            case 'nwr_stations':  
                for (let data of body.sources) {
                    imports.push({
                        location: data.location || `N/A`,
                        lat: data.lat || `N/A`,
                        lon: data.lon || `N/A`,
                        callsign: data.callsign || `N/A`,
                        frequency: data.freq || `N/A`,
                        stream: data.listen_url || `No stream available`
                    })
                }
            break;
            case 'mesoscale_discussions':
                loader.packages.placefile.AtmosXPlacefileParser.parseGeoJSON(body).then(parsed => {
                    for (let data of parsed) {
                        if (data.properties.expires_at_ms < Date.now()) continue;
                        imports.push({
                            id: data.properties.number,
                            description: `${data.properties.text.replace(/\\n/g, '<br>')}<br><br><b>Areas Affected:</b> ${data.properties.tags.AREAS_AFFECTED.join(', ') || 'N/A'}<br><b>Concerns:</b> ${data.properties.tags.CONCERNING.join(', ') || 'N/A'}<br><b>Population Affected:</b> ${data.properties.population.people.toLocaleString()} people in ${data.properties.population.homes.toLocaleString()} homes.`,
                        })
                    }
                })
            break
            case 'spotter_network_members': 
                let { spotter_network, rtlirl } = loader.cache.configurations.sources.miscellaneous_sources.location_services;
                loader.packages.placefile.AtmosXPlacefileParser.parsePlacefile(body).then(parsed => {
                    for (let data of parsed) {
                        let isActive = (data.icon.scale == 6 && data.icon.type == '2') && spotter_network.show_active;
                        let isStreaming = (data.icon.scale == 1 && data.icon.type == '19') && spotter_network.show_streaming;
                        let isIdle = (data.icon.scale == 6 && data.icon.type == '6') && spotter_network.show_idle;
                        let distance = 99999;
                        if (!isActive && !isStreaming && (!isIdle || !spotter_network.show_offline)) continue;
                        if (loader.cache.location) { distance = loader.modules.hooks.getMilesAway(x[0], y[0], loader.cache.location.lat, loader.cache.location.lon) }
                        if (!rtlirl.enabled && spotter_network.tracking_name && data.icon.label.toLowerCase().includes(spotter_network.tracking_name.toLowerCase())) {
                            loader.modules.hooks.gpsTracking(data.object.coordinates[0], data.object.coordinates[1], `SpotterNetwork`);
                        }
                        imports.push({ lat: data.object.coordinates[0], lon: data.object.coordinates[1], description: data.icon.label, active: isActive, streaming: isStreaming, idle: isIdle, distance });
                    }
                })
            break;
            case 'spotter_network_reports':
                loader.packages.placefile.AtmosXPlacefileParser.parsePlacefile(body).then(parsed => {
                    for (let data of parsed) {
                        imports.push({ 
                            latitude: parseFloat(data.icon.x),
                            longitude: parseFloat(data.icon.y),
                            event: data.icon.label.split('\\n')[1]?.trim() || 'N/A',
                            reporter: data.icon.label.split('\\n')[0]?.replace('Reported By:', '').trim() || 'N/A',
                            size: data.icon.label.split('\\n')[2]?.replace('Size:', '').trim() || 'N/A',
                            notes: data.icon.label.split('\\n')[3]?.replace('Notes:', '').trim() || 'N/A',
                            sender: "Spotter Network",
                            description: data.icon.label.replace(/\\n/g, '<br>').trim() || 'N/A'
                        });
                    }
                });
                break;
            case 'gr_level_x':
                loader.packages.placefile.AtmosXPlacefileParser.parseTable(body).then(parsed => {
                    for (let data of parsed) {
                        imports.push({
                            latitude: parseFloat(data.lat),
                            longitude: parseFloat(data.lon),
                            location: `${data.city}, ${data.county}, ${data.state}`,
                            event: data.event,
                            sender: data.source,
                            description: `${data.event} reported at ${data.city}, ${data.county}, ${data.state}. ${data.comment || 'No additional details.'}`,
                            magnitude: data.mag,
                            office: data.office,
                            date: data.date,
                            time: data.time
                        });
                    }
                });
            break;
            case 'iem':
                for (let data of body) {
                    imports.push({
                        location: `${data.county}, ${data.state}`,
                        event: data.typetext,
                        sender: 'Iowa Environmental Mesonet (API)',
                        description: `${data.remark} - ${data.city} | ${data.magf} ${data.unit}`,
                        latitude: parseFloat(data.lat),
                        longitude: parseFloat(data.lon),
                    });
                }
                break;
            default: return { success: false, message: []}
        }
        return { success: true, message: imports }
    }


    /**      
      * @function createPlacefilePolygon
      * @description Creates a placefile in a polygon
      * 
      * @param {number} placefileRefresh - Refresh rate for the placefile
      * @param {number} placefileThreshold - Threshold for the placefile
      * @param {string} placefileTitle - Title for the placefile
      * @param {Array} data - Array of objects containing point data
      * @param {string} cachePointer - Cache pointer for the placefile
      */

    createPlacefilePolygon = function(placefileRefresh = 10, placefileThreshold = 999, placefileTitle = `Default Placefile Title`, data = [], cachePointer = `template`) {
        loader.packages.placefile.AtmosXPlacefileParser.createPlacefile(placefileRefresh, placefileThreshold, placefileTitle, ``, data, `polygon`).then((placefileText) => {
            loader.cache.placefiles[cachePointer] = placefileText;
        });
    }

    /**      
      * @function createPlacefilePoint
      * @description Creates a placefile in a point
      * 
      * @param {number} placefileRefresh - Refresh rate for the placefile
      * @param {number} placefileThreshold - Threshold for the placefile
      * @param {string} placefileTitle - Title for the placefile
      * @param {Array} data - Array of objects containing point data
      * @param {string} cachePointer - Cache pointer for the placefile
      */

    createPlacefilePoint = function(placefileRefresh = 10, placefileThreshold = 999, placefileTitle = `Default Placefile Title`, data = [], cachePointer = `template`) {
         let placefileText = [
            `Font: 1, 11, 0, "Courier New"`,
            `IconFile: 1, 30, 30, 15, 15, "https://www.spotternetwork.org/iconsheets/Spotternet_096.png"`,
            `IconFile: 2, 21, 35, 10, 17, "https://www.spotternetwork.org/iconsheets/Arrows_096.png"`,
            `IconFile: 6, 30, 30, 15, 15, "https://www.spotternetwork.org/iconsheets/Spotternet_New_096.png"`
        ].join('\n');
        loader.packages.placefile.AtmosXPlacefileParser.createPlacefile(placefileRefresh, placefileThreshold, placefileTitle, placefileText, data, `point`).then((placefileText) => {
            loader.cache.placefiles[cachePointer] = placefileText;
        });
    }
}


module.exports = Placefiles;