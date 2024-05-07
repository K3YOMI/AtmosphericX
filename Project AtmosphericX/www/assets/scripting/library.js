let canPlay = true; // Audio rate limiter for the EAS tone
let streamModeEnabled = true
let usingMobileDevice = false
let audioInteractionChannel1 = undefined
let audioInteractionChannel2 = undefined
let audioInteractionChannel3 = undefined
let audioInteractionChannel4 = undefined

class library {
    constructor() {
        this.init = `Library Initialized`
    }
    isMobile() {
        let isMobile = /iPhone|iPad|iPod|Android|Mac OS X|BlackBerry|IEMobile|WPDesktop/i.test(navigator.userAgent);
        console.log(`Mobile Device: ${isMobile}`);
        if (isMobile) { usingMobileDevice = true; }
        if (isMobile) { 
            // make a button to allow interaction with the audio
            let audioInteractionBtn = document.createElement('button');
            audioInteractionBtn.innerHTML = `Mobile devices have disabled audio interaction. Click here to enable.`;
            audioInteractionBtn.style.position = `fixed`;
            audioInteractionBtn.style.top = `50%`;
            audioInteractionBtn.style.left = `50%`;
            audioInteractionBtn.style.transform = `translate(-50%, -50%)`;
            audioInteractionBtn.style.fontSize = `46px`;
            audioInteractionBtn.style.padding = `120px`;
            audioInteractionBtn.onclick = function() {
                const audioInteractionChannels = [];
                audioInteractionBtn.remove();
                for (let i = 1; i <= 4; i++) {
                    const audioInteractionChannel = new Audio();
                    audioInteractionChannel.src = `data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQDkAAAAAAAAAGw9wrNaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV`;
                    audioInteractionChannel.volume = 0.5;
                    audioInteractionChannel.play();
                    audioInteractionChannels.push(audioInteractionChannel);
                    console.log(`Audio Channel ${i} Played`);
                }
                [audioInteractionChannel1, audioInteractionChannel2, audioInteractionChannel3, audioInteractionChannel4] = audioInteractionChannels;
            }
            document.body.appendChild(audioInteractionBtn);
        }    
    }
    playsound(url) {
        if (!usingMobileDevice) {
            let audio = new Audio();
            audio.src = url;
            audio.autoplay = true;
            audio.volume = url.includes('EAS') ? 0.5 : 1;
            audio.play();
            audio.onended = function() {
                audio.remove();
            }
        }else{
            let channels = [audioInteractionChannel1, audioInteractionChannel2, audioInteractionChannel3, audioInteractionChannel4];
            for (let channel of channels) {
                if (channel.ended) {
                    channel.src = url;
                    channel.autoplay = true;
                    channel.volume = url.includes('EAS') ? 0.5 : 1;
                    channel.play();
                    return;
                }
            }
        }
    }
    playsoundlimited(url) {
        if (canPlay === false) { return; }
        canPlay = false;
        if (!usingMobileDevice) {
            let newAudio = new Audio(url);
            newAudio.volume = url.includes('EAS') ? 0.5 : 1;
            newAudio.play();
            newAudio.onended = function() {
                newAudio.remove();
                canPlay = true;
            }
        }else{
            let channels = [audioInteractionChannel1];
            for (let channel of channels) {
                if (channel.ended) {
                    channel.src = url;
                    channel.autoplay = true;
                    channel.volume = url.includes('EAS') ? 0.5 : 1;
                    channel.play();
                    // detect when the audio ends\
                    channel.onended = function() {
                        canPlay = true;
                    }
                }
            }
        }
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getAddress() {
        return window.location.protocol + "//" + window.location.host;
    }
    async getAlertAPI() {
        let ipAddress = this.getAddress();
        return new Promise(async (resolve, reject) => {
            await fetch(`${ipAddress}/api/alerts`).then(response => response.text()).then(data => {
                resolve(data)
            });
        })
    }
    async getActiveWarnings() {
        let ipAddress = this.getAddress();
        return new Promise(async (resolve, reject) => {
            await fetch(`${ipAddress}/api/active_warnings`).then(response => response.text()).then(data => {
                resolve(data)
            });
        })
    }
    async getActiveWatches() {
        let ipAddress = this.getAddress();
        return new Promise(async (resolve, reject) => {
            await fetch(`${ipAddress}/api/active_watches`).then(response => response.text()).then(data => {
                resolve(data)
            });
        });
    }
    async getActiveManual() {
        let ipAddress = this.getAddress();
        return new Promise(async (resolve, reject) => {
            await fetch(`${ipAddress}/api/active_manual`).then(response => response.text()).then(data => {
                resolve(data)
            });
        });
    }
    async getLocationAPI() {
        let ipAddress = this.getAddress();
        return new Promise(async (resolve, reject) => {
            await fetch(`${ipAddress}/api/location`).then(response => response.text()).then(data => {
                resolve(data)
            });
        })
    }
    async getQueryRate() {
        let ipAddress = this.getAddress();
        return new Promise(async (resolve, reject) => {
            await fetch(`${ipAddress}/api/queryrate`).then(response => response.text()).then(data => {
                resolve(data)
            });
        });
    }
    async getNotificationAPI() {
        let ipAddress = this.getAddress();
        return new Promise(async (resolve, reject) => {
            await fetch(`${ipAddress}/api/notifications`).then(response => response.text()).then(data => {
                resolve(data)
            });
        })
    }
    setStreamMode(bool) {
        streamModeEnabled = bool;
    }
}

class stream { 
    constructor() {
        this.init = `Stream Initialized`
    }
    async showAlert(gif, title, location) {
        if (streamModeEnabled) {
            document.getElementById('gif_notification').src = gif;
            if (location.length > 108) {location = location.substring(0, 100) + '...';}
            document.getElementById('gif_notification').style.display = 'block';
            setTimeout(function () {document.getElementById('gif_notification').src = 'https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png';}, 6800);
            setTimeout(function () {document.getElementById('notification_title_event').innerHTML = `<div class="notification_title_event" style="animation: fade 5s linear forwards; animation-delay: 0s;">${title}</div>`;}, 500);
            setTimeout(function () {document.getElementById('notification_subtitle_event').innerHTML = `<div class="notification_subtitle_event" style="animation: fade 4.5s linear forwards;animation-delay: 0s;">${location}</div>`;}, 700);
        }
    }
    async updateDashboardListings(warningList, data) {
        if (data.length == 0) {
            document.getElementById('random_alert').innerHTML = `<p>No Active Events</p>`;
            document.getElementById('random_alert_topic').innerHTML = `<p>No Active Events</p>`;
            document.getElementById('random_alert_topic_expire').innerHTML = `<p>No Active Events</p>`;
            document.getElementById('total_warnings').innerHTML = `<h2>No Active Events</h2>`;
            return;
        }
        let randomAlert = data[Math.floor(Math.random() * data.length)];
        let randomAlertTopic = randomAlert.eventName;
        let randomAlertLocation = randomAlert.locations;
        let randomAlertExpire = randomAlert.expires;
        let formatExpires = `N/A`;
        if (randomAlertLocation.length > 220) {randomAlertLocation = randomAlertLocation.substring(0, 220) + '...';}
        document.getElementById('random_alert').innerHTML = `<p>${(randomAlertLocation.toUpperCase())}</p>`;
        document.getElementById('random_alert_topic').innerHTML = `<p>${randomAlertTopic.toUpperCase()}</p>`;
        if (randomAlertExpire != `N/A` && randomAlertExpire != undefined) {
            let date = new Date(randomAlertExpire);
            let timeZone = date.getTimezoneOffset();
            let timeZoneOffsets = {"CDT": 300,"CST": 360,"EDT": 240,"EST": 300,"MDT": 360,"MST": 420,"PDT": 420,"PST": 480}
            let timeZoneObj = Object.keys(timeZoneOffsets).find(key => timeZoneOffsets[key] === timeZone);
            formatExpires = `${date.toLocaleString('default', { month: 'short', timeZone: 'MST' })} ${date.getDate()} ${date.getHours()}:${date.getMinutes()} ${timeZoneObj}`;
            if (date.getMinutes() == 0) {
                formatExpires = `${date.toLocaleString('default', { month: 'short', timeZone: 'MST' })} ${date.getDate()} ${date.getHours()}:0${date.getMinutes()} ${timeZoneObj}`;
            }
        }
        document.getElementById('random_alert_topic_expire').innerHTML = `<p>${formatExpires}</p>`;
        let activeTorOutbreak = warningList.filter(x => x.eventName.includes(`Tornado`)).length;
        let randomChance = Math.floor(Math.random() * 5);
        if (warningList.length > 5 && activeTorOutbreak > 5) {
            document.getElementById('total_warnings').innerHTML = (randomChance == 3) ? `<h2>OUTBREAK</h2>` : `<p>Active Warnings: ${warningList.length}<br>Active Watches: ${watchList.length}</p>`;
        } else { 
            document.getElementById('total_warnings').innerHTML = (randomChance == 3) ? `<h2>BREAKING WEATHER</h2>` : `<p>Active Warnings: ${warningList.length}<br>Active Watches: ${watchList.length}</p>`; 
        }
    }
    async updateGeneralListings(warningList) {
        let time = new Date();
        let second = time.getSeconds();
        let minute = time.getMinutes();
        let hour = time.getHours();  
        let currentMonth = time.getMonth();
        let currentDay = time.getDate();
        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const currentMonthName = monthNames[currentMonth];
        if (minute < 10) {minute = "0" + minute}
        if (second < 10) {second = "0" + second}
        if (hour < 10) { hour = "0" + hour}
        document.getElementById('time').innerHTML = `<p>${hour}:${minute}:${second}</p>`;
        document.getElementById('date').innerHTML = `<p>${currentMonthName} ${currentDay}</p>`;
        let totalTornadoEmergencies = warningList.filter(x => x.eventName == `Tornado Emergency`).length;
        let totalFlashFloodEmergencies = warningList.filter(x => x.eventName == `Flash Flood Emergency`).length;
        let totalPDS = warningList.filter(x => x.eventName == `Particularly Dangerous Situation`).length;
        let totalTornadoWarnings = warningList.filter(x => x.eventName.includes(`Tornado`)).length;
        let totalSevereThunderstormWarnings = warningList.filter(x => x.eventName.includes(`Severe Thunderstorm Warning`)).length;
        let totalFlashFloodWarnings = warningList.filter(x => x.eventName == `Flash Flood Warning`).length;
        let totalSpecialMarineWarnings = warningList.filter(x => x.eventName == `Special Marine Warning`).length;
        let totalSnowSquallWarnings = warningList.filter(x => x.eventName == `Snow Squall Warning`).length;
        let lightAreas = document.getElementsByClassName(`defaultBoxLight`)
        let darkAreas = document.getElementsByClassName(`defaultBox`)
        if (totalTornadoEmergencies > 0) {
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(209,38,215)`}
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(159,37,163)`}
        } else if (totalPDS > 0) {
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(249,56,54)`}
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(203,25,25)`}
        } else if (totalTornadoWarnings > 0) {

            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(249,56,54)` }
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(203,25,25)`}
        } else if (totalFlashFloodEmergencies > 0) {

            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(249,56,54)` }
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(203,25,25)`}
        } else if (totalSnowSquallWarnings > 0) {
    
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(249,56,54)` }
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(203,25,25)`}
        } else if (totalSevereThunderstormWarnings > 0) {

            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(224,162,42)`}
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(255,132,1)`}
        } else if (totalFlashFloodWarnings > 0) {
  
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(102,209,60)`}
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(73,155,40)`}
        } else if (totalSpecialMarineWarnings > 0) {
     
            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(28,61,181)`}
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(42,81,224)`}
        } else {

            for (let x = 0; x<lightAreas.length; x++){lightAreas[x].style.backgroundColor = `rgb(28,61,181)`}
            for (let x = 0; x<darkAreas.length; x++){darkAreas[x].style.backgroundColor = `rgb(42,81,224)`}
        }
    }
    async runQuery(queryData) {
        if (queryData.length == 0) { console.log(`empty queue`); return }
        let nextQuery = queryData.length - 1;
        let alert = queryData[nextQuery];
        let messageType = alert.messageType;
        let locations = alert.locations;
        let audioToUse = alert.audioToUse;
        let notifyCard = alert.notifyCard;
        let autoBeep = alert.autobeep;
        let eas = alert.eas;
        let siren = alert.siren;
        let gif = alert.gif;
        if (audioToUse === `../../assets/media/audio/BEEP-INTRO.mp3`) {
            lib.playsound(audioToUse);
            this.showAlert(gif, `${notifyCard} (${messageType})`, locations);
            await lib.delay(1300);
            if (eas || siren) {
                await lib.delay(3500);
                lib.playsound(eas ? `../../assets/media/audio/EASv2.mp3` : `../../assets/media/audio/TOR-EM-SIREN.mp3`);
            }
        } else {
            this.showAlert(gif, `${notifyCard} (${messageType})`, locations);
            if (autoBeep) {
                lib.playsound(`../../assets/media/audio/BEEP-INTRO.mp3`);
                await lib.delay(1300);
            }
            lib.playsound(audioToUse);
            if (eas || siren) {
                await lib.delay(3500);
                lib.playsound(eas ? `../../assets/media/audio/EASv2.mp3` : `../../assets/media/audio/TOR-EM-SIREN.mp3`);
            }
        }
        queryData.pop();
    }
}

class dashboard { 
    constructor() {
        this.init = `Dashboard Initialized`
    }
    updateDashboardListings() {
        document.getElementById("active_alerts").innerHTML = ""; 
        for (let i = 0; i < state_conversion.length; i++) { 
            let table_state = state_conversion[i].name; 
            let table_warnings = state_conversion[i].alerts.length; 
            if (table_warnings == 0) { continue; } 
            document.getElementById("active_alerts").innerHTML += `
            <tr>
                <th scope="row">${table_state}</th>
                <td>${table_warnings}</td>
                <td>${state_conversion[i].alerts[0].eventName}</td>
                <td>${state_conversion[i].alerts[0].issued}</td>
                <td><a onclick="dash.showWidget('${table_state}')" aria-pressed="true">View</a></td>
            </tr>`;
        }
    }
    resetDashboardListings() {
        total_warnings = 0;
        total_watches = 0;
        for (let i = 0; i < state_conversion.length; i++) {
            try {
                state_conversion[i].alerts = [];
            } catch (error) {
                console.log(error)
            }
        }
    }
    getSiteName() {
        return window.location.host.split('/')[0];
    }
    widgetClose() {
        document.getElementById("active_alerts_state").innerHTML += ``; 
        document.getElementById("widget").style.display = "none";
    }
    formatState(data) {
        if (data == undefined) { return 'Other'; } 
        for (let i = 0; i < data.length; i++) {
            if (data[i] == ',') {
                let state = data.substring(i + 2, i + 4);
                return state;
            }
        }
        return 'NotInStates';
    }
    importAlert(data) {
        let get_state = this.formatState(data.locations); 
        if (get_state == 'Other') { return; } 
        for (let i = 0; i < state_conversion.length; i++) { 
            if (state_conversion[i].abbreviation.toLowerCase() == get_state.toLowerCase()) { 
                state_conversion[i].alerts.push(data); 
            } 
        } 
    }
    removeBadLiterals(data) {
        data = data.replace(/\n/g, ' ');
        data = data.replace(/\r/g, ' ');
        data = data.replace(/\t/g, ' ');
        data = data.replace(/\"/g, ' ');
        data = data.replace(/\'/g, ' ');
        data = data.replace(/\//g, ' ');
        data = data.replace(/\-/g, ' ');
        data = data.replace(/\_/g, ' ');
        return data;
    }
    showWidget(data) {
        document.getElementById("active_alerts_state").innerHTML = ``; 
        document.getElementById("widget").style.display = "block";  
        for (let i = 0; i < state_conversion.length; i++) {  
            if (state_conversion[i].name == data) {  
                data = state_conversion[i].alerts;  
                for (let x = 0; x < data.length; x++) {  

                    if (!document.getElementById("title_place_back").innerHTML.includes("BACK")) {
                        document.getElementById("title_place_back").innerHTML = `<span class="close" onclick="dash.widgetClose()">&#8592;</span>`;
                        document.getElementById("title_place").innerHTML = `${state_conversion[i].name}`;
                    }else{
                        document.getElementById("title_place_back").innerHTML = `<span class="close" onclick="dash.widgetClose()">&#8592;</span>`;
                        document.getElementById("title_place").innerHTML = `${state_conversion[i].name}`;
                    }
                    if (data[x].locations.length > 25) {  
                        data[x].locations = data[x].locations.substring(0, 25) + "..."; 
                    }   
                    if (data[x].event_type == `Tornado Warning`) {
                        if (data[x].event_tornado_threat == `Not Calculated`) { 
                            data[x].messageType = `Cancelled/Expired`;
                        }
                    }
                    let new_desc = this.removeBadLiterals(data[x].eventDescription); 
                    document.getElementById("active_alerts_state").innerHTML += ` 
                    <tr>
                    <th scope="row">${data[x].eventName}</th> 
                    <td>${data[x].locations}</td> 
                    <td>${data[x].windThreat}</td> 
                    <td>${data[x].hailThreat}</td> 
                    <td>${data[x].tornadoThreat}</td> 
                    <td>${data[x].thunderstormThreat}</td>
                    <td>${data[x].messageType}</td> 
                    <td>${data[x].expires}</td> 
                    <td><a onclick='alert("${new_desc}")' class="btn btn-primary btn-sm" role="button" aria-pressed="true">View</a></td> 
                    <td><a href=${data[x].link} style="text-decoration: none; color: rgb(198, 198, 198);" aria-pressed="true">View</a></td></tr> `;
                } 
            } 
        } 
    }
}