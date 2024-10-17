
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


let library = {}
let cache = {}
cache.warnings = []; cache.alerts = []
cache.watches = []; cache.manual = []
cache.broadcasts = []; cache.lastQueries = []
cache.queue = []; cache.config = []
cache.alert = 0
cache.latestManual = ``
cache.query = false
cache.streaming = false
cache.running = false
cache.isMobile = false
cache.channel1, cache.channel2, cache.channel3, cache.channel4 = undefined




library.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded API Functions`)
}
library.isMobile = async function() { // Checks the useragent for mobile devices and such to see if we can autoplay audio
    let isMobile = /iPhone|iPad|iPod|Android|Mac OS X|BlackBerry|IEMobile|WPDesktop/i.test(navigator.userAgent);
    if (isMobile) { cache.isMobile = true }
    console.log(`Mobile Device: ${isMobile}`)
    if (isMobile) {
        let interaction = document.createElement('button');
        interaction.innerHTML = `Mobile devices have disabled audio interaction. Click here to enable.`;
        interaction.style.position = `fixed`;
        interaction.style.top = `50%`;
        interaction.style.left = `50%`;
        interaction.style.transform = `translate(-50%, -50%)`;
        interaction.style.fontSize = `46px`;
        interaction.style.padding = `120px`;
        // append to the body 
        document.body.appendChild(interaction);
        interaction.onclick = function() {
            const channels = [];
            interaction.remove();
            for (let i = 1; i <= 4; i++) {
                const audio = new Audio();
                audio.src = `data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQDkAAAAAAAAAGw9wrNaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV`;
                audio.volume = 0.5;
                audio.play();
                channels.push(audio);
                console.log(`Audio Channel ${i} Played`);
            }
            [cache.channel1, cache.channel2, cache.channel3, cache.channel4] = channels;
        }
    }
}
library.play = async function(url, limited=false) { // Decides if we should play audio normally or on a channel
    if (!limited) {
        if (!cache.isMobile) {
            let audio = new Audio();
            audio.src = url;
            audio.autoplay = true;
            audio.volume = url.includes('EAS') ? 0.5 : 1;
            audio.play();
            audio.onended = function() {
                audio.remove();
            }
        } else { 
            let channels = [cache.channel1, cache.channel2, cache.channel3, cache.channel4];
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
    if (limited) { 
        if (cache.playable == undefined) { cache.playable = true }
        if (cache.playable == false) { return }
        cache.playeable = false;
        if (!cache.isMobile) {
            let audio = new Audio(url);
            audio.volume = url.includes('EAS') ? 0.5 : 1;
            audio.play();
            audio.onended = function() {
                audio.remove();
                cache.playable = true;
            }
        } else {
            let channels = [cache.channel1];
            for (let channel of channels) {
                if (channel.ended) {
                    channel.src = url;
                    channel.autoplay = true;
                    channel.volume = url.includes('EAS') ? 0.5 : 1;
                    channel.play();
                    channel.onended = function() {
                        cache.playable = true;
                    }
                }
            }
        }
    }
}
library.delay = async function(ms) { // Delay function
    return new Promise(resolve => setTimeout(resolve, ms));
}
library.request = async function(url) { // Manages all API requests and such
    return new Promise(async (resolve, reject) => {
        await fetch(url).then(response => response.text()).then(data => {
            resolve(data)
        }).catch(error => {})
    })
}
library.streaming = async function(bool) { // Enabled/Disables the streaming feature
    cache.streaming = bool;
}

