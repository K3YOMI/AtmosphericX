
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
    Version: 5.0                              
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
functions.register = function(data) {
    let audioToUse = cache.configurations['application:sounds']['application:beep']
    let beepOnly = cache.configurations['request:settings']['request:beeponly']
    let excludedEvents = (cache.configurations['request:settings']['request:alwaysrun'])
    let allowUpdateNotificiation = cache.configurations['request:settings']['request:updates']
    let eventName = data['properties']['event']
    let eventDescription = data['properties']['description']
    let hailThreat = `Not Calculated`
    let windThreat = `Not Calculated`
    let tornadoThreat = `Not Calculated`
    let thunderstormThreat = `Not Calculated`
    if (data['properties']['parameters']) {
        hailThreat = data['properties']['parameters']['maxHailSize'] ? `${data['properties']['parameters']['maxHailSize']}` : 'Not Calculated';
        windThreat = data['properties']['parameters']['maxWindGust'] ? `${data['properties']['parameters']['maxWindGust']} (${data['properties']['parameters']['windThreat']})` : 'Not Calculated';
        tornadoThreat = data['properties']['parameters']['tornadoDetection'] || 'Not Calculated';
        thunderstormThreat = data['properties']['parameters']['thunderstormDamageThreat'] || 'Not Calculated';
    } else {
        hailThreat = 'Not Calculated';
        windThreat = 'Not Calculated';
        tornadoThreat = 'Not Calculated';
        thunderstormThreat = 'Not Calculated';
    }
    let messageType = data['properties']['messageType']
    let indication = data['properties']['indiciated']
    let expires = data['properties']['expires']
    let issued = data['properties']['sent']
    if (eventDescription == undefined) { eventDescription = `No Description` }
    let eventLower = eventDescription.toLowerCase()
    let locations = functions.format(data['properties']['areaDesc'])
    if (eventLower.includes(`flash flood emergency`) && eventName == `Flash Flood Warning`) { eventName = `Flash Flood Emergency` }
    if (eventLower.includes(`particularly dangerous situation`) && eventName == `Tornado Warning`) { eventName = `Particularly Dangerous Situation` }
    if (eventLower.includes(`tornado emergency`)) { eventName = `Tornado Emergency` }
    if (eventName == `Tornado Warning`) {
        if (tornadoThreat == `OBSERVED` || eventLower.includes(`confirmed`)) { tornadoThreat = `Confirmed`; eventName = `Confirmed Tornado Warning` }
        else if (tornadoThreat == `RADAR INDICATED`) { tornadoThreat = `Radar Indicated`; eventName = `Radar Indicated Tornado Warning` }
        else if (tornadoThreat == `POSSIBLE`) { tornadoThreat = `Cancel` }
    }
    if (eventName == `Severe Thunderstorm Warning`) {
        if (thunderstormThreat == `CONSIDERABLE`) { eventName = `Considerable Destructive Severe Thunderstorm Warning` }
        else if (thunderstormThreat == `DESTRUCTIVE`) { eventName = `Destructive Severe Thunderstorm Warning` }
        else { eventName = `Severe Thunderstorm Warning` }
    }
    if (messageType == `Update`) {messageType = `Updated`}
    if (messageType == `Cancel`) {messageType = `Expired`}
    if (messageType == `Alert`) {messageType = `Issued`}
    let eventAction = cache.configurations['application:warnings'][eventName]
    if (eventAction != undefined) {
        let onlyBeep = false
        let ignoreWarning = false
        let triggered = eventAction['triggered']
        let newAudio = eventAction['new']
        let updateAudio = eventAction['update']
        let cancelAudio = eventAction['cancel']
        let notifyCard = eventAction['card']
        let gif = cache.configurations['application:banners'][eventName]
        let autobeep = eventAction['autobeep']
        let eas = eventAction['eas'] 
        let siren = eventAction['siren']
        if (eventName == triggered) {
            if (messageType == `Issued`) { audioToUse = newAudio }
            if (messageType == `Updated`) { audioToUse = updateAudio }
            if (messageType == `Expired`) { audioToUse = cancelAudio }
            if (messageType == `Updated`) {
                if (eas || siren) { 
                    if (!cache.alerts.danger.includes(`${eventName}-${locations}-${issued}-${expires}-${eventDescription}`)) {
                        cache.alerts.danger.push(`${eventName}-${locations}-${issued}-${expires}-${eventDescription}`)
                        audioToUse = newAudio
                    } else { 
                        eas = false
                        siren = false
                    }
                }
            }
          
            if (beepOnly == true) {
                if (!excludedEvents.includes(eventName)) {
                    audioToUse = cache.configurations['application:sounds']['application:beep']
                    onlyBeep = true
                }
            }

            if (allowUpdateNotificiation == false && messageType == `Updated`) {
                if (!excludedEvents.includes(eventName)) {
                    ignoreWarning = true
                }
            }
            return {eventName: eventName,eventDescription: eventDescription,thunderstormThreat: thunderstormThreat,hailThreat: hailThreat,windThreat: windThreat,tornadoThreat: tornadoThreat,messageType: messageType,indication: indication,expires: expires,issued: issued,locations: locations,audioToUse : audioToUse,ignoreWarning: ignoreWarning,gif: gif,eas: eas,siren: siren,onlyBeep: onlyBeep,notifyCard: notifyCard,autobeep: autobeep,link: data['id']}
        }
    }else{
        let unknownEvent = cache.configurations['application:warnings']['UNK']
        let onlyBeep = false
        let ignoreWarning = false
        if (messageType == `Issued`) { audioToUse = unknownEvent['new'] }
        if (messageType == `Updated`) { audioToUse = unknownEvent['update'] }
        if (messageType == `Expired`) { audioToUse = unknownEvent['cancel'] }
        if (beepOnly == true) {
            if (!excludedEvents.includes(eventName)) {
                audioToUse = cache.configurations['application:sounds']['application:beep']
                onlyBeep = true
            }
        }
        if (allowUpdateNotificiation == false && messageType == `Updated`) {
            if (!excludedEvents.includes(eventName)) {
                ignoreWarning = true
            }
        }
        return {eventName: eventName,eventDescription: eventDescription,thunderstormThreat: thunderstormThreat,hailThreat: hailThreat,windThreat: windThreat,tornadoThreat: tornadoThreat,messageType: messageType,indication: indication,expires: expires,issued: issued,locations: locations,audioToUse : audioToUse,ignoreWarning: ignoreWarning,gif: cache.configurations['application:banners']['UNK'],eas: false,siren: false,onlyBeep: onlyBeep,notifyCard: eventName,autobeep: unknownEvent['autobeep'],link: data['id']}
    }
}

class nws {constructor() {this.functions = functions}}
module.exports = nws;