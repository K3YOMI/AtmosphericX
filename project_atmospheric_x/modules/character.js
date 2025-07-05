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


class Hooks { 
    constructor() {
        this.name = `CharacterAI`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function initCharacterAI
      * @description Sends an email using the nodemailer package. (Mostly for alerts...)
      */

    initCharacterAI = async function() {
        return new Promise(async (resolve, reject) => {
            let settings = loader.cache.configurations.sources.miscellaneous_sources.character_ai
            if (settings.enabled) {
                loader.packages.characterAI = require('node_characterai');
                loader.static.characterAI = new loader.packages.characterAI.CharacterAI();
                loader.static.characterAI.puppeteerPath = settings.chromium_path;
                loader.static.characterAI.authenticate(settings.auth_token).then(async() => {
                    loader.static.specifiedCharacterDm = await loader.static.characterAI.fetchCharacter(settings.auth_token);
                    loader.static.characterChat = await loader.static.specifiedCharacterDm.DM(settings.character_id);
                    loader.static.onChatbotLoaded = true;
                    loader.modules.hooks.createOutput(this.name, `Your CharacterAI chatbot has been successfully loaded!`);
                    resolve(loader.static.characterChat);
                });
            } else { 
                resolve()
            }
        })
    }

    /**
      * @function commitChat
      * @description Sends a message to the CharacterAI chat and returns the response.
      * @param {string} message - The message to send to the CharacterAI chat.
      */

    commitChat = async function(message = `AtmosphericX Lets go!!!`) {
        let settings = loader.cache.configurations.sources.miscellaneous_sources.character_ai
        if (settings.enabled && loader.static.onChatbotLoaded) {
            if (loader.static.inGeneratingChat == undefined) { loader.static.inGeneratingChat = false;}
            if (loader.static.inGeneratingChat) { return {success: false, message: `Already generating a chat response, please wait...`}; }
            loader.static.inGeneratingChat = true;
            loader.modules.hooks.createOutput(this.name, `CharacterAI: Sending message to chatbot... (This may take a bit)`);
            let response = await loader.static.characterChat.sendMessage(message, true);
            let vcMessageUrl = await response.getTTSUrl(settings.character_voice_id);
            loader.static.inGeneratingChat = false;
            return { success: true, message: vcMessageUrl };
        } else { 
            return { success: false, message: `CharacterAI is not enabled or not loaded yet.` };
        }
    }
}


module.exports = Hooks;