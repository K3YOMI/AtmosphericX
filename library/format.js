let action_tables = {
    "Considerable Destructive Severe Thunderstorm Warning": {
        triggeredBy: "Considerable Destructive Severe Thunderstorm Warning",
        new: "../../Media/Sounds/SVR-THUNDER-CON-WARNING-ISSUED.mp3",
        update: "../../Media/Sounds/SVR-THUNDER-CON-WARNING-UPDATED.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Severe Thunderstorm Warning (Considerable)",
        autobeep: true,
    },
    "Destructive Severe Thunderstorm Warning": {
        triggeredBy: "Destructive Severe Thunderstorm Warning",
        new: "../../Media/Sounds/SVR-THUNDER-DES-WARNING-ISSUED.mp3",
        update: "../../Media/Sounds/SVR-THUNDER-DES-WARNING-UPDATED.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Severe Thunderstorm Warning (Destructive)",
        autobeep: true,
    },
    "Severe Thunderstorm Warning": {
        triggeredBy: "Severe Thunderstorm Warning",
        new: "../../Media/Sounds/SVR-THUNDER-WARNING-ISSUED.mp3",
        update: "../../Media/Sounds/SVR-THUNDER-WARNING-UPDATED.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Severe Thunderstorm Warning",
        autobeep: true,
    },
    "Tornado Warning": {
        triggeredBy: "Tornado Warning",
        new: "../../Media/Sounds/RADAR-TORN-WARNING-ISSUED.mp3",
        update: "../../Media/Sounds/TOR-UPDATED.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Radar Indicated Tornado Warning",
        autobeep: true,
    },
    "Confirmed Tornado Warning": {
        triggeredBy: "Confirmed Tornado Warning",
        new: "../../Media/Sounds/CON-TORN-WARNING-ISSUED.mp3",
        update: "../../Media/Sounds/TOR-UPDATED.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Confirmed Tornado Warning",
        autobeep: true,
    },
    "Radar Indicated Tornado Warning": {
        triggeredBy: "Radar Indicated Tornado Warning",
        new: "../../Media/Sounds/RADAR-TORN-WARNING-ISSUED.mp3",
        update: "../../Media/Sounds/TOR-UPDATED.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Radar Indicated Tornado Warning",
        autobeep: true,
    },
    "Tornado Emergency": {
        triggeredBy: "Tornado Emergency",
        new: "../../Media/Sounds/TOR-UPGRADED.mp3",
        update: "../../Media/Sounds/TOR-UPDATED.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Tornado Emergency",
        autobeep: true,
    },
    "PDS": {
        triggeredBy: "PDS",
        new: "../../Media/Sounds/TOR-UPGRADED.mp3",
        update: "../../Media/Sounds/TOR-UPDATED.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Particularly Dangerous Situation",
        autobeep: true,
    },

    "Flash Flood Warning": {
        triggeredBy: "Flash Flood Warning",
        new: "../../Media/Sounds/FLASH-FLOOD-WARNING-ISSUED.mp3",
        update: "../../Media/Sounds/FLASH-FLOOD-WARNING-UPDATED.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Flash Flood Warning",
        autobeep: true,
    },
    "Special Marine Warning": {
        triggeredBy: "Special Marine Warning",
        new: "../../Media/Sounds/SPECIAL-MARINE-WARNING-ISSUED.mp3",
        update: "../../Media/Sounds/SPECIAL-MARINE-WARNING-UPDATED.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Special Marine Warning",
        autobeep: true,
    },
    "Flash Flood Watch": {
        triggeredBy: "Flash Flood Watch",
        new: "../../Media/Sounds/Beep.mp3",
        update: "../../Media/Sounds/Beep.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Flash Flood Watch",
        autobeep: false,
    },
    "Severe Thunderstorm Watch": {
        triggeredBy: "Severe Thunderstorm Watch",
        new: "../../Media/Sounds/Beep.mp3",
        update: "../../Media/Sounds/Beep.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Severe Thunderstorm Watch",
        autobeep: false,
    },
    "Tornado Watch": {
        triggeredBy: "Tornado Watch",
        new: "../../Media/Sounds/Beep.mp3",
        update: "../../Media/Sounds/Beep.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Tornado Watch",
        autobeep: false,
    },
    "Snow Squall Warning": {
        triggeredBy: "Snow Squall Warning",
        new: "../../Media/Sounds/SNOW-SQ-ISSUED.mp3",
        update: "../../Media/Sounds/SNOW-SQ-UPDATED.mp3",
        cancel: "../../Media/Sounds/Beep.mp3",
        notifyCard: "Snow Squall Warning",
        autobeep: true,
    },
}

const action_media = {
    'Tornado Warning': '../../Media/Content/TOR.gif',
    'Radar Indicated Tornado Warning': '../../Media/Content/TOR.gif',
    'Confirmed Tornado Warning': '../../Media/Content/PDS.gif',
    'Tornado Watch': '../../Media/Content/TOR.gif',
    'Tornado Emergency': '../../Media/Content/EM.gif',
    'PDS': '../../Media/Content/PDS.gif',
    'Severe Thunderstorm Warning': '../../Media/Content/SVR.gif',
    'Considerable Destructive Severe Thunderstorm Warning': '../../Media/Content/SVR.gif',
    'Destructive Severe Thunderstorm Warning': '../../Media/Content/PDS.gif',
    'Severe Thunderstorm Watch': '../../Media/Content/SVR.gif',
    'Flash Flood Warning': '../../Media/Content/FLASH.gif',
    'Flash Flood Watch': '../../Media/Content/FLASH.gif',
    'Special Marine Warning': '../../Media/Content/Marine.gif',
    'Snow Squall Warning': '../../Media/Content/PDS.gif',
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
        let eventName = data['properties']['event']
        let eventDescription = data['properties']['description']
        let thunderstormThreat = data['properties']['parameters']['thunderstormDamageThreat']
        let hailThreat = data['properties']['parameters']['maxHailSize'] + ` (${data['properties']['parameters']['hailThreat']})`
        let windThreat = data['properties']['parameters']['maxWindGust'] + ` (${data['properties']['parameters']['windThreat']})`
        if (data['properties']['parameters']['maxHailSize'] == undefined) { hailThreat = `Not Calculated` }
        if (data['properties']['parameters']['maxWindGust'] == undefined) { windThreat = `Not Calculated` }
        if (data['properties']['parameters']['thunderstormDamageThreat'] == undefined) { thunderstormThreat = `Not Calculated` }
        let tornadoThreat = data['properties']['parameters']['tornadoDetection'] ? data['properties']['parameters']['tornadoDetection'] : `Not Calculated`
        let messageType = data['properties']['messageType']
        let indication = data['properties']['indiciated']
        let expires = data['properties']['expires']
        let issued = data['properties']['sent']
        let locations = this.formatLocations(data['properties']['areaDesc'])
        if (eventDescription.includes(`tornado emegergency`) && eventName == `Tornado Warning`) { eventName = `Tornado Emergency` }
        if (eventDescription.includes(`particularly dangerous situation`) && eventName == `Tornado Warning`) { eventName = `PDS` }
        if (eventName == `Tornado Warning`) {
            if (tornadoThreat == `OBSERVED`) { tornadoThreat = `Confirmed`; eventName = `Confirmed Tornado Warning` }
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
        if (messageType == `New`) {
            messageType = `New`
        }
        for (let eventType in action_tables) {
            let eas = false 
            let siren = false
            let triggeredBy = action_tables[eventType]['triggeredBy']
            let newAudio = action_tables[eventType]['new']
            let updateAudio = action_tables[eventType]['update']
            let cancelAudio = action_tables[eventType]['cancel']
            let notifyCard = action_tables[eventType]['notifyCard']
            let gif = action_media[eventName]
            let autobeep = action_tables[eventType]['autobeep']
            if (eventName == triggeredBy) {
                let audioToUse = `../../Media/Sounds/Beep.mp3`
                if (messageType == `Alert`) { audioToUse = newAudio }
                if (messageType == `Updated`) { audioToUse = updateAudio }
                if (messageType == `Expired/Cancelled`) { audioToUse = cancelAudio }
                if (eventName == `Tornado Emergency` && messageType == `Alert` ) { siren = true }
                if (eventName == `PDS` && messageType == `Alert`) { eas = true }
                if (eventName == `Confirmed Tornado Warning` && messageType == `Alert`) { eas = true }
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
                    gif: gif,
                    eas: eas,
                    siren: siren,
                    notifyCard: notifyCard,
                    autobeep: autobeep,
                    link: data['id']
                }
            }
        }
    }
}


module.exports = format;
