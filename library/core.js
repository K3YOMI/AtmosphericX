
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

let functions = {}


functions.init = function() {
    console.clear()
    let logo = fs.readFileSync(path.join(__dirname, `../cache/logo`), `utf8`)
    console.log(logo)
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded Core Functions`)
}
functions.config = function(path) {
    let content = fs.readFileSync(path, 'utf8');
    return JSON.parse(content);
}
functions.format = function(locations) {
    let splitLocation = locations.split(',')
    if (splitLocation.length == 1) {
        return locations
    }else{
        let newLocation = ''
        for (let i = 0; i < splitLocation.length; i++) {
            splitLocation[i] = splitLocation[i].trim()
            if (i == splitLocation.length - 1) {
                newLocation += `${splitLocation[i]}`
            }else{
                newLocation += `${splitLocation[i]}, `
            }
        }
        return newLocation
    }
}
functions.parameters = function(paramaters) { 
    if (paramaters == undefined) {return {hail: 'Not Calculated', wind: 'Not Calculated', tornado: 'Not Calculated', thunderstorm: 'Not Calculated'}}
    let maxHailSize = paramaters.maxHailSize ? `${paramaters.maxHailSize}` : 'Not Calculated';
    let maxWindGust = paramaters.maxWindGust ? `${paramaters.maxWindGust} (${paramaters.windThreat})` : 'Not Calculated';
    let tornadoDetection = paramaters.tornadoDetection || 'Not Calculated';
    let thunderstormDamageThreat = paramaters.thunderstormDamageThreat || 'Not Calculated';
    return {hail: maxHailSize, wind: maxWindGust, tornado: tornadoDetection, thunderstorm: thunderstormDamageThreat}
}
functions.getCustomEventSignature = function(data) {
    let description = (data.properties.description == undefined) ? `no description` : data['properties']['description'].toLowerCase()
    if (description.includes(`flash flood emergency`) && data.properties.event == `Flash Flood Warning`) { data.properties.event = `Flash Flood Emergency` }
    if (description.includes(`particularly dangerous situation`) && data.properties.event == `Tornado Warning`) { data.properties.event = `Particularly Dangerous Situation` }
    if (description.includes(`tornado emergency`)) { data.properties.event = `Tornado Emergency` }
    if (data.properties.event == `Tornado Warning`) {
        if (data.properties.parameters.tornadoDetection == `OBSERVED` || description.includes(`confirmed`)) { data.properties.parameters.tornadoDetection = `Confirmed`; data.properties.event = `Confirmed Tornado Warning` }
        else if (data.properties.parameters.tornadoDetection == `RADAR INDICATED`) { data.properties.parameters.tornadoDetection = `Radar Indicated`; data.properties.event = `Radar Indicated Tornado Warning` }
        else if (data.properties.parameters.tornadoDetection == `POSSIBLE`) { data.properties.parameters.tornadoDetection = `Cancel` }
    }
    if (data.properties.event == `Severe Thunderstorm Warning`) {
        if (data.properties.parameters.thunderstormDamageThreat == `CONSIDERABLE`) { data.properties.event = `Considerable Destructive Severe Thunderstorm Warning` }
        else if (data.properties.parameters.thunderstormDamageThreat == `DESTRUCTIVE`) { data.properties.event = `Destructive Severe Thunderstorm Warning` }
        else { data.properties.event = `Severe Thunderstorm Warning` }
    }
    return data.properties.event
}
functions.getSignature = function(data) {
    let audioToUse = cache.configurations['application:sounds']['application:beep']
    let eventAction = cache.configurations['application:warnings'][data.properties.event]
    if (eventAction == undefined) {
        eventAction = cache.configurations['application:warnings']['UNK'] 
        let newAlert = eventAction.new
        let updateAlert = eventAction.update
        let cancelAlert = eventAction.cancel
        if (data.properties.messageType == `Update`) {data.properties.messageType = `Updated`; audioToUse = updateAlert}
        if (data.properties.messageType == `Cancel`) {data.properties.messageType = `Expired`; audioToUse = cancelAlert}
        if (data.properties.messageType == `Alert`) {data.properties.messageType = `Issued`; audioToUse = newAlert}
        return {
            message: data.properties.messageType,
            audiopresets: {new: newAlert, update: updateAlert, cancel: cancelAlert},
            audio: audioToUse,
            gif: cache.configurations['application:banners']['UNK'],
            eas: cache.configurations['application:warnings']['UNK'].eas,
            siren: cache.configurations['application:warnings']['UNK'].siren,
            autobeep: cache.configurations['application:warnings']['UNK'].autobeep,
            notifyCard: cache.configurations['application:warnings']['UNK'].notifyCard,
        }
    } else { 
        let newAlert = eventAction.new
        let updateAlert = eventAction.update
        let cancelAlert = eventAction.cancel
        if (data.properties.messageType == `Update`) {data.properties.messageType = `Updated`; audioToUse = updateAlert}
        if (data.properties.messageType == `Cancel`) {data.properties.messageType = `Expired`; audioToUse = cancelAlert}
        if (data.properties.messageType == `Alert`) {data.properties.messageType = `Issued`; audioToUse = newAlert}
        return {
            message: data.properties.messageType,
            audiopresets: {new: newAlert, update: updateAlert, cancel: cancelAlert},
            audio: audioToUse,
            gif: cache.configurations['application:banners'][data.properties.event],
            eas: eventAction.eas,
            siren: eventAction.siren,
            autobeep: eventAction.autobeep,
            notifyCard: eventAction.card,
        }
    }
}

functions.register = function(data) { // This is crazy and is very message but It works and i'll make it better lol
    let audioToUse = cache.configurations['application:sounds']['application:beep']
    let beepOnly = cache.configurations['request:settings']['request:beeponly']
    let excludedEvents = (cache.configurations['request:settings']['request:alwaysrun'])
    let allowUpdateNotification = cache.configurations['request:settings']['request:updates'];
    let {hail, wind, tornado, thunderstorm} = functions.parameters(data.properties.parameters)
    data.properties.parameters = {maxHailSize: hail, maxWindGust: wind, tornadoDetection: tornado, thunderstormDamageThreat: thunderstorm}
    if (data.properties.description == undefined) { data.properties.description = `no description` }
    data.properties.areaDesc = functions.format(data.properties.areaDesc)
    data.properties.event = functions.getCustomEventSignature(data)
    let signature = functions.getSignature(data)
    data.properties.messageType = signature.message
    if (signature.eas == true || signature.siren == true) {
        if (!cache.alerts.danger.includes(`${data.properties.event}-${data.properties.areaDesc}-${data.properties.sent}-${data.properties.expires}-${data.properties.description}`)) {
            cache.alerts.danger.push(`${data.properties.event}-${data.properties.areaDesc}-${data.properties.sent}-${data.properties.expires}-${data.properties.description}`)
            audioToUse = signature.audiopresets.new
        } else { 
            signature.eas = false
            signature.siren = false
        }
    }
    if (beepOnly == true) {
        if (!excludedEvents.includes(data.properties.event)) {
            audioToUse = cache.configurations['application:sounds']['application:beep']
            onlyBeep = true
        }
    }
    if (allowUpdateNotification == false && data.properties.event.messageType == `Updated`) {
        if (!excludedEvents.includes(data.properties.event)) {
            ignoreWarning = true
        }
    }
    return {
        raw: data,
        details: {
            name: data.properties.event,
            type: data.properties.messageType,
            indication: data.properties.indicated,
            expires: data.properties.expires,
            issued: data.properties.sent,
            locations: data.properties.areaDesc,
            description: data.properties.description,
            hail: data.properties.parameters.maxHailSize,
            wind: data.properties.parameters.maxWindGust,
            tornado: data.properties.parameters.tornadoDetection,
            thunderstorm: data.properties.parameters.thunderstormDamageThreat,
            sender: data.properties.senderName,
            link: data.id
        },
        metadata: signature,
    }
}

class nws {constructor() {this.functions = functions}}
module.exports = nws;