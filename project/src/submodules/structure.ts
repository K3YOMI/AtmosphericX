/*
              _                             _               _     __   __
         /\  | |                           | |             (_)    \ \ / /
        /  \ | |_ _ __ ___   ___  ___ _ __ | |__   ___ _ __ _  ___ \ V / 
       / /\ \| __| '_ ` _ \ / _ \/ __| '_ \| '_ \ / _ \ '__| |/ __| > <  
      / ____ \ |_| | | | | | (_) \__ \ |_) | | | |  __/ |  | | (__ / . \ 
     /_/    \_\__|_| |_| |_|\___/|___/ .__/|_| |_|\___|_|  |_|\___/_/ \_\
                                     | |                                 
                                     |_|                                                                                                                
    
    Written by: KiyoWx (k3yomi) & StarflightWx      
                          
*/


import * as loader from '../bootstrap';
import * as types from '../types';




export class Calculations { 
    NAME_SPACE: string
    constructor() {
        this.NAME_SPACE = `submodule:structure`;
        this.initialize();
    }

    private initialize() {
        loader.submodules.utils.log(`${this.NAME_SPACE} initialized.`)
    }

    private parsing(body?: any, type?: string): Promise<any> {
        return new Promise(async (resolve) => {
            const defConfig = loader.cache.internal.configurations as types.defConfigurations;
            let imports: any = [];
            switch (type) {
                case 'spotter_network_feed': 
                    imports = { type: 'FeatureCollection', features: [] }
                    const feedConfig = defConfig.sources?.location_settings?.spotter_network_feed;
                    loader.packages.placefile.AtmosXPlacefileParser.parsePlacefile(body).then((parsed: unknown) => {
                        for (const feature of parsed as any[]) {
                            let distance = 0;
                            const isActive = (feature.icon.scale == 6 && feature.icon.type == '2') && feedConfig.pins.active;
                            const isStreaming = (feature.icon.scale == 1 && feature.icon.type == '19') && feedConfig.pins.streaming;
                            const isIdle = (feature.icon.scale == 6 && feature.icon.type == '6') && feedConfig.pins.idle;
                            if (!isActive && !isStreaming && (!isIdle || !feedConfig.pins.offline)) { continue; }
                            if (loader.cache.external.locations.spotter_network.length != 0) {
                                distance = loader.submodules.calculations.getDistanceBetweenCoordinates(
                                    {lat: feature.object.coordinates[1], lon: feature.object.coordinates[0]}, 
                                    {lat: loader.cache.external.locations.spotter_network[0].latitude, lon: loader.cache.external.locations.spotter_network[0].longitude}
                                );
                            }
                            if (feedConfig.pin_by_name != `` || feedConfig.pin_by_name != `SN_NAME_HERE_OR_DESCRIPTION`) {
                                if (feature.icon.label.toLowerCase().includes(feedConfig.pin_by_name.toLowerCase())) {
                                    loader.cache.external.locations.spotter_network = [
                                        feature.object.coordinates[1],
                                        feature.object.coordinates[0]
                                    ]
                                }
                            }
                            imports.features.push({
                                type: 'Feature',
                                geometry: {type: 'Point', coordinates: [feature.object.coordinates[0], feature.object.coordinates[1]]},
                                properties: {
                                    description: feature.icon.label.replace(/\\n/g, `<br>`),
                                    distance: distance,
                                    status: isActive ? `Active` : isStreaming ? `Streaming` : isIdle ? `Idle` : `Unknown`,
                                }
                            });
                        }
                    })  
                break;
                case 'storm_prediction_center_mesoscale': 
                    imports = { type: 'FeatureCollection', features: [] }
                    loader.packages.placefile.AtmosXPlacefileParser.parseGeoJSON(body).then((parsed: unknown) => {
                        for (const feature of (parsed as any)) {
                            if (feature.properties.expires_at_ms < Date.now()) { continue }
                            const torProb = loader.packages.nwws.TextParser.textProductToString(feature.properties.text, `MOST PROBABLE PEAK TORNADO INTENSITY...`, []);
                            const winProb = loader.packages.nwws.TextParser.textProductToString(feature.properties.text, `MOST PROBABLE PEAK WIND GUST...`, []);
                            const hagProb = loader.packages.nwws.TextParser.textProductToString(feature.properties.text, `MOST PROBABLE PEAK HAIL SIZE...`, []);
                            imports.features.push({
                                type: 'Feature',
                                geometry: { type: 'Polygon', coordinates: feature.coordinates, },
                                properties: {
                                    mesoscale_id: feature.properties.number,
                                    expires: new Date(feature.properties.expires_at_ms).toLocaleString(),
                                    issued: new Date(feature.properties.issued_at_ms).toLocaleString(),
                                    description: loader.packages.nwws.TextParser.textProductToDescription(feature.properties.text).replace(/\n/g, '<br>'),
                                    locations: feature.properties.tags.AREAS_AFFECTED.join(', '),
                                    outlook: feature.properties.tags.CONCERNING.join(', '),
                                    population: feature.properties.population.people.toLocaleString(),
                                    homes: feature.properties.population.homes.toLocaleString(),
                                    parameters: {
                                        tornado_probability: torProb,
                                        wind_probability: winProb,
                                        hail_probability: hagProb,
                                    },
                                }
                            })
                        }
                    })
                break;
                case 'spotter_reports': 
                    imports = { type: 'FeatureCollection', features: [] }
                    loader.packages.placefile.AtmosXPlacefileParser.parsePlacefile(body).then(parsed => {
                        for (const feature of parsed as any[]) {
                            imports.features.push({
                                type: 'Feature',
                                geometry: {type: 'Point', coordinates: [parseFloat(feature.icon.x), parseFloat(feature.icon.y)]},
                                properties: {
                                    event: feature.icon.label.split('\\n')[1]?.trim() || 'N/A',
                                    reporter: feature.icon.label.split('\\n')[0]?.replace('Reported By:', '').trim() || 'N/A',
                                    size: feature.icon.label.split('\\n')[2]?.replace('Size:', '').trim() || 'N/A',
                                    notes: feature.icon.label.split('\\n')[3]?.replace('Notes:', '').trim() || 'N/A',
                                    sender: "Spotter Network",
                                    description: feature.icon.label.replace(/\\n/g, '<br>').trim() || 'N/A'
                                }
                            })
                        }
                    })
                break;
                case 'grlevelx_reports': 
                    imports = { type: 'FeatureCollection', features: [] }
                    loader.packages.placefile.AtmosXPlacefileParser.parseTable(body).then((parsed: any) => {
                        for (const feature of parsed) {
                            imports.features.push({
                                type: 'Feature',
                                geometry: {type: 'Point', coordinates: [parseFloat(feature.lat), parseFloat(feature.lon)]},
                                properties: {
                                    location: `${feature.city}, ${feature.county}, ${feature.state}`,
                                    event: feature.event, sender: feature.source,
                                    description: `${feature.event} reported at ${feature.city}, ${feature.county}, ${feature.state}. ${feature.comment || 'No additional details.'}`,
                                    magnitude: feature.mag, office: feature.office,
                                    date: feature.date, time: feature.time
                                }
                            })
                        }
                    })
                break;
                case 'tropical_storm_tracks': 
                    for (const feature of body as any) {
                        imports.push({
                            type: 'Feature',
                            properties: {
                                name: feature.name,
                                discussion: feature.forecast_discussion,
                                classification: feature.classification,
                                pressure: feature.pressure,
                                wind_speed: feature.wind_speed_mph,
                                last_updated: feature.last_update_at.toLocaleString(),
                            }
                        })
                    }
                break;
                case 'tornado': 
                    const torThreshold = defConfig.sources?.probability_settings?.tornado?.percentage_treshold;
                    loader.packages.placefile.AtmosXPlacefileParser.parsePlacefile(body).then(parsed => {
                        for (let feature of parsed) {
                            let probability = feature.line.text.match(/ProbTor: (\d+)%/) ? feature.line.text.match(/ProbTor: (\d+)%/)[1] : '0';
                            if (torThreshold > parseInt(probability)) continue;
                            imports.push({
                                type: 'tornado',
                                probability: probability,
                                shear: parseFloat(feature.line.text.match(/Max LLAzShear: ([\d.]+)/) ? feature.line.text.match(/Max LLAzShear: ([\d.]+)/)[1] : '0'),
                                description: feature.line.text.replace(/\\n/g, '<br>')
                            });
                        }
                    })
                break;
                case 'severe': 
                    const svrThreshold = defConfig.sources?.probability_settings?.severe?.percentage_treshold;
                    loader.packages.placefile.AtmosXPlacefileParser.parsePlacefile(body).then(parsed => {
                        for (let feature of parsed) {
                            let probability = feature.line.text.match(/PSv3: (\d+)%/) ? feature.line.text.match(/PSv3: (\d+)%/)[1] : '0';
                            if (svrThreshold > parseInt(probability)) continue;
                            imports.push({
                                type: 'severe',
                                probability: probability,
                                shear: parseFloat(feature.line.text.match(/Max LLAzShear: ([\d.]+)/) ? feature.line.text.match(/Max LLAzShear: ([\d.]+)/)[1] : '0'),
                                description: feature.line.text.replace(/\\n/g, '<br>')
                            });
                        }
                    })
                break;
                case 'sonde_project_weather_eye': 
                    for (const feature of body as any) {
                        imports.push(feature);
                    }
                break;
                case 'wx_radio': 
                    imports = { type: 'FeatureCollection', features: [] }
                    for (const feature of body.sources as any) {
                        imports.features.push({
                            type: 'Feature',
                            geometry: {type: 'Point', coordinates: [parseFloat(feature.lon), parseFloat(feature.lat)]},
                            properties: {
                                location: feature?.location,
                                callsign: feature?.callsign,
                                frequency: feature?.frequency,
                                stream: feature?.listen_url,
                            }
                        })
                    }
                break;
                default: return resolve([]);
            }
            resolve(imports);
        })
    }

    public create(data: unknown, isWire: boolean): Promise<void> {
        return new Promise(async (resolve) => {
            const clean = loader.submodules.utils.filterWebContent(data)
            const dataTypes = [
                { key: 'spotter_network_feed', cache: 'spotter_network_feed' },
                { key: 'spotter_reports', cache: 'spotter_reports' },
                { key: 'grlevelx_reports', cache: 'grlevelx_reports' },
                { key: 'storm_prediction_center_mesoscale', cache: 'storm_prediction_center_mesoscale' },
                { key: 'tropical_storm_tracks', cache: 'tropical_storm_tracks' },
                { key: 'tornado', cache: 'tornado' },
                { key: 'severe', cache: 'severe' },
                { key: 'sonde_project_weather_eye', cache: 'sonde_project_weather_eye' },
                { key: 'wx_radio', cache: 'wx_radio' },
            ]
            for (const { key, cache } of dataTypes) { if (clean[key]) { loader.cache.external[cache] = await this.parsing(clean[key], key); } }
            console.log((loader.cache.external))
            if ((clean.noaa_weather_wire_service && isWire) || clean.national_weather_service) {}
        })
    }
    
}

export default Calculations;

