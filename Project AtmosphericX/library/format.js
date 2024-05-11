let action_tables = {
    "Considerable Destructive Severe Thunderstorm Warning": {
        triggeredBy: "Considerable Destructive Severe Thunderstorm Warning",
        new: "../../assets/media/audio/SVR-THUNDER-CON-WARNING-ISSUED.mp3",
        update: "../../assets/media/audio/SVR-THUNDER-CON-WARNING-UPDATED.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Severe Thunderstorm Warning (Considerable)",
        autobeep: true,
    },
    "Destructive Severe Thunderstorm Warning": {
        triggeredBy: "Destructive Severe Thunderstorm Warning",
        new: "../../assets/media/audio/SVR-THUNDER-DES-WARNING-ISSUED.mp3",
        update: "../../assets/media/audio/SVR-THUNDER-DES-WARNING-UPDATED.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Severe Thunderstorm Warning (Destructive)",
        autobeep: true,
    },
    "Severe Thunderstorm Warning": {
        triggeredBy: "Severe Thunderstorm Warning",
        new: "../../assets/media/audio/SVR-THUNDER-WARNING-ISSUED.mp3",
        update: "../../assets/media/audio/SVR-THUNDER-WARNING-UPDATED.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Severe Thunderstorm Warning",
        autobeep: true,
    },
    "Tornado Warning": {
        triggeredBy: "Tornado Warning",
        new: "../../assets/media/audio/RADAR-TORN-WARNING-ISSUED.mp3",
        update: "../../assets/media/audio/TOR-UPDATED.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Radar Indicated Tornado Warning",
        autobeep: true,
    },
    "Confirmed Tornado Warning": {
        triggeredBy: "Confirmed Tornado Warning",
        new: "../../assets/media/audio/CON-TORN-WARNING-ISSUED.mp3",
        update: "../../assets/media/audio/TOR-UPDATED.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Confirmed Tornado Warning",
        autobeep: true,
    },
    "Radar Indicated Tornado Warning": {
        triggeredBy: "Radar Indicated Tornado Warning",
        new: "../../assets/media/audio/RADAR-TORN-WARNING-ISSUED.mp3",
        update: "../../assets/media/audio/TOR-UPDATED.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Radar Indicated Tornado Warning",
        autobeep: true,
    },
    "Tornado Emergency": {
        triggeredBy: "Tornado Emergency",
        new: "../../assets/media/audio/TOR-UPGRADED.mp3",
        update: "../../assets/media/audio/TOR-UPDATED.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Tornado Emergency",
        autobeep: true,
    },
    "Particularly Dangerous Situation": {
        triggeredBy: "Particularly Dangerous Situation",
        new: "../../assets/media/audio/TOR-UPGRADED.mp3",
        update: "../../assets/media/audio/TOR-UPDATED.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Particularly Dangerous Situation",
        autobeep: true,
    },
    "Flash Flood Emergency": {
        triggeredBy: "Flash Flood Emergency",
        new: "../../assets/media/audio/FLASH-FLOOD-WARNING-UPGRADED.mp3",
        update: "../../assets/media/audio/FLASH-FLOOD-WARNING-UPDATED.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Flash Flood Emergency",
        autobeep: true,
    },
    "Flash Flood Warning": {
        triggeredBy: "Flash Flood Warning",
        new: "../../assets/media/audio/FLASH-FLOOD-WARNING-ISSUED.mp3",
        update: "../../assets/media/audio/FLASH-FLOOD-WARNING-UPDATED.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Flash Flood Warning",
        autobeep: true,
    },
    "Special Marine Warning": {
        triggeredBy: "Special Marine Warning",
        new: "../../assets/media/audio/SPECIAL-MARINE-WARNING-ISSUED.mp3",
        update: "../../assets/media/audio/SPECIAL-MARINE-WARNING-UPDATED.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Special Marine Warning",
        autobeep: true,
    },
    "Flash Flood Watch": {
        triggeredBy: "Flash Flood Watch",
        new: "../../assets/media/audio/BEEP-INTRO.mp3",
        update: "../../assets/media/audio/BEEP-INTRO.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Flash Flood Watch",
        autobeep: false,
    },
    "Severe Thunderstorm Watch": {
        triggeredBy: "Severe Thunderstorm Watch",
        new: "../../assets/media/audio/BEEP-INTRO.mp3",
        update: "../../assets/media/audio/BEEP-INTRO.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Severe Thunderstorm Watch",
        autobeep: false,
    },
    "Tornado Watch": {
        triggeredBy: "Tornado Watch",
        new: "../../assets/media/audio/BEEP-INTRO.mp3",
        update: "../../assets/media/audio/BEEP-INTRO.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Tornado Watch",
        autobeep: false,
    },
    "Snow Squall Warning": {
        triggeredBy: "Snow Squall Warning",
        new: "../../assets/media/audio/SNOW-SQ-ISSUED.mp3",
        update: "../../assets/media/audio/SNOW-SQ-UPDATED.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Snow Squall Warning",
        autobeep: true,
    },
    "Earthquake Warning": {
        triggeredBy: "Earthquake Warning",
        new: "../../assets/media/audio/BEEP-INTRO.mp3",
        update: "../../assets/media/audio/BEEP-INTRO.mp3",
        cancel: "../../assets/media/audio/BEEP-INTRO.mp3",
        notifyCard: "Earthquake Warning",
        autobeep: true,
    },
}
let dangerMedia = []

const action_media = {
    'Tornado Warning': '../../assets/media/gif/red_box.gif',
    'Radar Indicated Tornado Warning': '../../assets/media/gif/red_box.gif',
    'Confirmed Tornado Warning': '../../assets/media/gif/red_warning.gif',
    'Tornado Watch': '../../assets/media/gif/red_box.gif',
    'Tornado Emergency': '../../assets/media/gif/purple_warning.gif',
    'Particularly Dangerous Situation': '../../assets/media/gif/red_warning.gif',
    'Severe Thunderstorm Warning': '../../assets/media/gif/orange_box.gif',
    'Considerable Destructive Severe Thunderstorm Warning': '../../assets/media/gif/orange_box.gif',
    'Destructive Severe Thunderstorm Warning': '../../assets/media/gif/red_warning.gif',
    'Severe Thunderstorm Watch': '../../assets/media/gif/orange_box.gif',
    'Flash Flood Emergency': '../../assets/media/gif/red_warning.gif',
    'Flash Flood Warning': '../../assets/media/gif/green_box.gif',
    'Flash Flood Watch': '../../assets/media/gif/green_box.gif',
    'Special Marine Warning': '../../assets/media/gif/blue_box.gif',
    'Snow Squall Warning': '../../assets/media/gif/red_warning.gif',
    'Earthquake Warning': '../../assets/media/gif/red_warning.gif',
};


class format {
    constructor() {
        console.log(`[AtmosphericX Library] >> Loaded Format Manager`);
        this.format = "returned from format.js";
    }
    formatLocations(locations) {
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
    registerEvent(data) {
        try {
            let beepOnly = configurations['BEEP_ONLY']
            let excludedEvents = JSON.parse(configurations['EXCLUDED_EVENTS'])
            let allowUpdateNotificiation = configurations['ALLOW_UPDATES']


            let eventName = data['properties']['event']
            let eventDescription = data['properties']['description']
            let hailThreat = `Not Calculated`
            let windThreat = `Not Calculated`
            let tornadoThreat = `Not Calculated`
            let thunderstormThreat = `Not Calculated`
            if (data['properties']['parameters'] && data['properties']['parameters']['maxHailSize'] == undefined) { 
                hailThreat = `Not Calculated` }
            else{
                hailThreat = data['properties']['parameters']['maxHailSize'] + ` (${data['properties']['parameters']['hailThreat']})`
            }
            if (data['properties']['parameters'] && data['properties']['parameters']['maxWindGust'] == undefined) { 
                windThreat = `Not Calculated` 
            }else{
                windThreat = data['properties']['parameters']['maxWindGust'] + ` (${data['properties']['parameters']['windThreat']})`
            }
            if (data['properties']['parameters'] && data['properties']['parameters']['tornadoDetection'] == undefined) { 
                tornadoThreat = `Not Calculated` 
            }else{
                tornadoThreat = data['properties']['parameters']['tornadoDetection']
            }
            if (data['properties']['parameters'] && data['properties']['parameters']['thunderstormDamageThreat'] == undefined) { 
                thunderstormThreat = `Not Calculated` 
            }else{
                thunderstormThreat = data['properties']['parameters']['thunderstormDamageThreat']
            }
            let messageType = data['properties']['messageType']
            let indication = data['properties']['indiciated']
            let expires = data['properties']['expires']
            let issued = data['properties']['sent']
            if (eventDescription == undefined) { eventDescription = `No Description` }
            let eventLower = eventDescription.toLowerCase()
            let locations = this.formatLocations(data['properties']['areaDesc'])
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
            if (messageType == `Update`) {
                messageType = `Updated`
            }
            if (messageType == `Cancel`) {
                messageType = `Expired`
            }
            if (messageType == `Alert`) {
                messageType = `Issued`
            }
            let eventAction = action_tables[eventName]
            if (eventAction != undefined) {
                let eas = false 
                let siren = false
                let triggeredBy = eventAction['triggeredBy']
                let newAudio = eventAction['new']
                let updateAudio = eventAction['update']
                let cancelAudio = eventAction['cancel']
                let notifyCard = eventAction['notifyCard']
                let gif = action_media[eventName]
                let ignoreWarning = false
                let autobeep = eventAction['autobeep']
                if (eventName == triggeredBy) {
                    let audioToUse = `../../assets/media/audio/BEEP-INTRO.mp3`
                    if (messageType == `Issued`) { audioToUse = newAudio }
                    if (messageType == `Updated`) { audioToUse = updateAudio }
                    if (messageType == `Expired`) { audioToUse = cancelAudio }
                    if (messageType == `Updated`) {
                        if (eventName == `Tornado Emergency` || eventName == `Particularly Dangerous Situation` || eventName == `Flash Flood Emergency` || eventName == `Confirmed Tornado Warning` || eventName == `Destructive Severe Thunderstorm Warning`) {
                            if (!dangerMedia.includes(`${eventName}-${locations}-${data['id']}-${eventDescription}`)) {
                                dangerMedia.push(`${eventName}-${locations}-${data['id']}-${eventDescription}`)
                                audioToUse = newAudio
                                if (eventName == `Tornado Emergency`) { siren = true }
                                if (eventName == `Particularly Dangerous Situation`) { eas = true }
                                if (eventName == `Flash Flood Emergency`) { eas = true }
                                if (eventName == `Confirmed Tornado Warning`) { eas = true }
                                if (eventName == `Destructive Severe Thunderstorm Warning`) { eas = true }
                            }
                        }
                    }
                    if (messageType == `Issued`) {
                        if (eventName == `Tornado Emergency`) { siren = true }
                        if (eventName == `Particularly Dangerous Situation`) { eas = true }
                        if (eventName == `Flash Flood Emergency`) { eas = true }
                        if (eventName == `Confirmed Tornado Warning`) { eas = true }
                        if (eventName == `Destructive Severe Thunderstorm Warning`) { eas = true }
                    }
                    if (beepOnly == "true") {
                        if (!excludedEvents.includes(eventName)) {
                            audioToUse = `../../assets/media/audio/BEEP-INTRO.mp3`
                        }
                    }

                    if (allowUpdateNotificiation == "false" && messageType == `Updated`) {
                        if (!excludedEvents.includes(eventName)) {
                            ignoreWarning = true
                        }
                    }
                    return {
                        eventName: eventName,
                        eventDescription: eventDescription,
                        thunderstormThreat: thunderstormThreat,
                        hailThreat: hailThreat,
                        windThreat: windThreat,
                        tornadoThreat: tornadoThreat,
                        messageType: messageType,
                        indication: indication,
                        expires: expires,
                        issued: issued,
                        locations: locations,
                        audioToUse : audioToUse,
                        ignoreWarning: ignoreWarning,
                        gif: gif,
                        eas: eas,
                        siren: siren,
                        notifyCard: notifyCard,
                        autobeep: autobeep,
                        link: data['id']
                    }
                }
            }else{
                let audioToUse = `../../assets/media/audio/BEEP-INTRO.mp3`
                let ignoreWarning = false
                if (messageType == `Issued`) { audioToUse = `../../assets/media/audio/UNK-SPECIAL-ISSUED.mp3` }
                if (messageType == `Updated`) { audioToUse = `../../assets/media/audio/UNK-SPECIAL-UPDATED.mp3` }
                if (messageType == `Expired`) { audioToUse = `../../assets/media/audio/BEEP-INTRO.mp3` }

                if (beepOnly == "true") {
                    if (!excludedEvents.includes(eventName)) {
                        audioToUse = `../../assets/media/audio/BEEP-INTRO.mp3`
                    }
                }

                if (allowUpdateNotificiation == "false" && messageType == `Updated`) {
                    if (!excludedEvents.includes(eventName)) {
                        ignoreWarning = true
                    }
                }


                return {
                    eventName: eventName,
                    eventDescription: eventDescription,
                    thunderstormThreat: thunderstormThreat,
                    hailThreat: hailThreat,
                    windThreat: windThreat,
                    tornadoThreat: tornadoThreat,
                    messageType: messageType,
                    indication: indication,
                    expires: expires,
                    issued: issued,
                    locations: locations,
                    audioToUse : audioToUse,
                    ignoreWarning: ignoreWarning,
                    gif: `../../assets/media/gif/red_warning.gif`,
                    eas: false,
                    siren: false,
                    notifyCard: eventName,
                    autobeep: false,
                    link: data['id']
                }
            }
        } catch (error) {
            toolsConstructor.log(`[Error] [Format Manager] >> ${error.message}`)
        }
    }
}


module.exports = format;
