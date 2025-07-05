

/*
              _                             _               _     __   __
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


class Dashboard { 
    constructor(library, isDashboard=false) {
        this.library = library
        this.storage = this.library.storage
        this.storage.muted = true
        this.name = `Dashboard`
        this.library.createOutput(`${this.name} Initialization`, `Successfully initialized ${this.name} module`)
        if (isDashboard) {
            this.triggerLocalStorageListener()
            this.populateSidebar()
            this.updateThread()
            this.spawnGeneralSetupHub()
            this.spawnExternalServices()
            this.spawnStormPredictionCenterModels()
            this.populateDevLogs()
            library.createNotification(`Welcome back <span style="color: green;">${localStorage.getItem('atmosx.cached.username') || 'Default User'}</span>`)
            document.addEventListener('onCacheUpdate', async (event) => {})
            window.addEventListener('resize', () => {this.updateSize()});
            window.addEventListener('zoom', () => {this.updateSize()});
        }
    }

    /**
      * @function addFormListener
      * @description Adds a listener to a form element that handles login, registration, and password reset actions.
      * It hashes the password using SHA256 and sends a POST request, please keep in mind that the SHA256 will be hashed twice, once on the client
      * and server to prevent and potential MITM attacks. While not full proof for handling sessions and cookies, it will do some protection 
      * for at least hiding the password from client to server.
      * 
      * @param {string} [domId=`login-form`] - The ID of the form element to attach the listener to. Defaults to `login-form`.
      * @param {string} [action=`login`] - The action to perform. Can be `login`, `register`, or `reset`. Defaults to `login`.
      */

    addFormListener = function(domId = `login-form`, action = `login`) {
        let successMessage = document.querySelector(`.success-message`);
        let errorMessage = document.querySelector(`.error-message`);
        document.getElementById('login-guest').addEventListener('click', function(e) {
            e.preventDefault();
            fetch(`/api/login-guest`, { 
                method: `POST`, 
                headers: { 'Content-Type': `application/json` }, 
                body: JSON.stringify({}) 
            }).then((response) => {
                response.json().then((jsonData) => {
                    if (response.ok) {
                        successMessage.innerHTML = jsonData.message;
                        successMessage.style.display = `block`;
                        errorMessage.style.display = `none`;
                        localStorage.setItem(`atmosx.cached.username`, `Guest`);
                        localStorage.setItem(`atmosx.cached.role`, jsonData.role);
                        document.cookie = `sessionFallback=${jsonData.session}; path=/; SameSite=Lax;`;
                        setTimeout(() => { window.location.replace(`/`) }, 1000);
                    } else {
                        errorMessage.innerHTML = jsonData.message;
                        errorMessage.style.display = `block`;
                        successMessage.style.display = `none`;
                    }
                });
            });
        });
        document.getElementById(domId).addEventListener(`submit`, (emitEvent) => {
            emitEvent.preventDefault();
            let username = document.getElementById(`username`).value;
            let hashedPassword = CryptoJS.SHA256(document.getElementById(`password`).value).toString();
            let requestBody = { username, password: hashedPassword };
            let endpoint = `/api/login`;
            if (action === `reset`) {
                let hashedNewPassword = CryptoJS.SHA256(document.getElementById(`new-password`).value).toString();
                requestBody.new_password = hashedNewPassword;
                endpoint = `/api/reset`;
            } else if (action === `register`) {
                endpoint = `/api/register`;
            }
            fetch(endpoint, { 
                method: `POST`, 
                headers: { 'Content-Type': `application/json` }, 
                body: JSON.stringify(requestBody) 
            }).then((response) => {
                response.json().then((jsonData) => {
                    if (response.ok) {
                        successMessage.innerHTML = jsonData.message;
                        successMessage.style.display = `block`;
                        errorMessage.style.display = `none`;
                        if (action === `login`) {
                            localStorage.setItem(`atmosx.cached.username`, username);
                            localStorage.setItem(`atmosx.cached.role`, jsonData.role);
                            document.cookie = `sessionFallback=${jsonData.session}; path=/; SameSite=Lax;`;
                        }
                        setTimeout(() => { window.location.replace(`/`) }, 1000);
                    } else {
                        errorMessage.innerHTML = jsonData.message;
                        errorMessage.style.display = `block`;
                        successMessage.style.display = `none`;
                    }
                });
            });
        });
    }
    
    /**
      * @function navigationListener
      * @description Handles navigation by animating the transition of content within a wrapper when a navigation item is clicked. 
      * It hides all navigation elements and only shows the clicked navigation item. The content transition effect involves moving the
      * wrapper off-screen before sliding it back into place with a smooth animation.
      * It also updates the thread to reflect the current state of the application and populates the content of the clicked navigation item.
      * @async
      * @param {string} [domClicked=`_navigation.home`] - The ID of the clicked navigation element. Defaults to `"_navigation.home"`.
      */
    
    navigationListener = async function(domClicked=`_navigation.home`) {
        let allElements = document.querySelectorAll(`[id^="_navigation"]`)
        let domWrapper = document.querySelector(`.wrapper`)
        if (domWrapper) { 
            domWrapper.style.transition = `transform 0.3s ease-in-out`
            domWrapper.style.transform = `translateX(300%)`;
            await this.library.createTimeout(100)
            domWrapper.style.transition = `none`;
            domWrapper.style.transform = `translateX(-300%)`;
            await this.library.createTimeout(100)
            domWrapper.style.transition = `transform 0.3s ease-in-out`;
            domWrapper.style.transform = `translateX(0)`;
            allElements.forEach(element => { element.style.display = `none`})
            document.getElementById(domClicked).style.display = `block`
        }
        this.updateThread()
    }

    /**
     * @function triggerHamburgerListener
     * @description Toggles the visibility of the sidebar menu by changing its state attribute and applying a CSS transform. 
     * The function animates the transition of the menu's position using CSS transitions for a smooth effect. ONLY FOR MOBILE DEVICES.
     * 
     * @param {string} [domSidebar=`.interactive-sidebar`] - The CSS selector for the sidebar menu element. Defaults to `.interactive-sidebar`.
     */

    triggerHamburgerListener = function(domSidebar=`.interactive-sidebar`, domWrapper=`.wrapper`, domHamburger=`hamburger`) {
        let sidebarMenu = document.querySelector(domSidebar)
        let wrapper = document.querySelector(domWrapper)
        let hamburgerButton = document.getElementById(domHamburger)
        let currentState = sidebarMenu.getAttribute(`data-state`)
        let isMobile = window.innerWidth <= 1270;
        if (currentState == `open`) {
            sidebarMenu.setAttribute(`data-state`, `closed`);
            hamburgerButton.className = `hamburger-menu fa fa-bars`;
            sidebarMenu.style.transform = `translateX(-280%)`;
            sidebarMenu.style.transition = `transform 0.3s ease-in-out`;
            if (!isMobile) {
                wrapper.style.width = `92%`;
                wrapper.style.transition = `width 0.3s ease-in-out`;
            }
            return;
        }
        sidebarMenu.setAttribute(`data-state`, `open`);
        hamburgerButton.className = `hamburger-menu fa fa-times`;
        sidebarMenu.style.transform = `translateX(0)`;
        sidebarMenu.style.transition = `transform 0.3s ease-in-out`;
        wrapper.style.width = `80%`;
        wrapper.style.transition = `width 0.3s ease-in-out`;
    }

    /**
      * @function triggerAccountListner
      * @description Clears any existing popups and triggers the display of an account settings notification. 
      * This notification includes two action buttons: one to log out the user and one to open the password reset page in a new window. 
      */

    triggerAccountListner = function() {
        this.clearAllPopups()
        this.injectNotification({
            title: `Account Settings`, 
            description: `Manage your account settings here. You can log out or change your password.`,
            rows: 2,
            parent: `_body.base`, 
            buttons: [
                { name: `Logout`, className: `button-danger`, function: () => { fetch(`/api/logout`, {method: `POST`, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})}); setTimeout(() => { window.location.replace(`/`) }, 500) }},
                { name: `Change Password`, className: `button-danger`, function: () => { window.open('/reset', '_blank', 'width=1000,height=1000') } }
            ],
            inputs: [],
            selects: null
        })
    }

    /**
      * @function triggerWidgetListener
      * @description Clears all existing popups and triggers the display of a notification with account settings options. 
      * This notification includes two action buttons: one for logging out the user and one for opening the password reset page in a new window.
      * 
      * @param {string} [domId=`_body.base`] - The ID of the parent element where the notification will be injected. Defaults to `_body.base`.
      */

    triggerWidgetListener = function() {
        this.clearAllPopups()
        this.injectNotification({
            title: `Alert and Notification Settings`, 
            description: `This is mostly used for testing purposes. You can use this to send a test alert or notification to the system.`,
            rows: 1,
            removeclose: true,
            parent: `_body.base`, 
            buttons: [
                { name: `Spawn Alert`, className: `button-ok`, function: () => { fetch(`/api/manual`, {method: `POST`, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: document.getElementById(`widget_alert_type`).value, properties: { senderName:"Manual Admin Override", event: document.getElementById(`widget_alert_type`).value, description: "N/A", messageType: document.getElementById(`widget_alert_status`).value, expires: "N/A", indicated: document.getElementById(`widget_alert_indicator`).value, areaDesc: document.getElementById(`widget_notification_alert_location`).value, parameters: {} } }), })}},
                { name: `Submit Status`, className: `button-ok`, function: () => { fetch(`/api/status`, { method: `POST`, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: document.getElementById(`widget_notification_announcement_title`).value })})}},
                { name: `Submit Notification`, className: `button-ok`, function: () => { fetch(`/api/notification`, { method: `POST`, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: document.getElementById(`widget_notification_announcement_title`).value, message: document.getElementById(`widget_notification_announcement_subtext`).value })})}},
                { name: `Submit Chatbot`, className: `button-ok`, function: () => { fetch(`/api/chatbot`, { method: `POST`, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: document.getElementById(`widget_notification_announcement_subtext`).value })})}}
            ],
            inputs: [ 
                { id: `widget_notification_alert_location`, type: `text`, className: `popup-input`, placeholder: `Location Here`}, 
                { id: `widget_notification_announcement_title`, type: `text`, className: `popup-input`, placeholder: `Announcement/Status Widget Title Here`}, 
                { id: `widget_notification_announcement_subtext`, type: `text`, className: `popup-input`, placeholder: `Announcement Widget Subtext Here`}, 
            ],
            selects: [
                { id: `widget_alert_type`, className: `popup-select`, options: static_alerts.map(alert => {return { name: alert, value: alert }})},
                { id: `widget_alert_status`, className: `popup-select`, options: [ { name: `Alert`, value: `Alert` }, { name: `Update`, value: `Update` } ]},
                { id: `widget_alert_indicator`, className: `popup-select`, options: [ { name: `OBSERVED`, value: `OBSERVED` }, { name: `RADAR INDICATED`, value: `RADAR INDICATED` } ]},
            ]
        })
        let popupBox = document.querySelector(`.popup-box`);
        popupBox.removeAttribute('style');
        popupBox.style.transform = `scale(0.9)`;
        popupBox.style.resize = `both`;
        popupBox.className = '';  
    }

    /**
      * @function injectCardData
      * @description Injects a card element into the DOM with the specified metadata. The card includes a title, description, and optional click event.
      * Also, it binds the click event to the current context of the class instance.
      * 
      * @param {Object} cardMetadata - The metadata object containing the content and attributes for the card.
      */

    injectCardData = function(cardMetadata) {
        let domCard = document.createElement('div')
        let h1 = document.createElement('h1')
        let hr = document.createElement('hr')
        let p = document.createElement('p')
        domCard.className = `data-card`
        h1.className = `data-card-title`
        h1.innerHTML = cardMetadata.title
        hr.className = `general-hr`
        p.className = `data-card-description`
        p.innerHTML = cardMetadata.content
        domCard.appendChild(h1)
        domCard.appendChild(hr)
        domCard.appendChild(p)
        document.getElementById(cardMetadata.parent).appendChild(domCard);
        if (cardMetadata.onclick) { domCard.onclick = cardMetadata.onclick.bind(this); }
        return domCard;
    }

    /**
      * @function injectNotification
      * @description Dynamically creates and injects a notification popup into the DOM. The popup can include a title, description, input fields, select dropdowns, and buttons. It is designed to be fully customizable using the `_metadata` parameter.
      * 
      * @param {Object} metadata - The metadata object containing the content and attributes for the notification.
      */

    injectNotification = function(metadata) {
        let arrButtons = metadata.buttons;
        let arrInputs = metadata.inputs;
        let arrSelects = metadata.selects;
        let arrCheckboxes = metadata.checkboxes;
        let removeX = metadata.removeclose;
        this.clearAllPopups();
        let popup = document.createElement('div');
        popup.className = `popup-box`;
        popup.style.display = `block`;
        popup.innerHTML = `<div class="popup-content"> <button class="popup-close" onclick="this.parentElement.parentElement.remove();">&times;</button> <h1 id='_popup.title' class="popup-title">${metadata.title}</h1> <hr class="popup-hr"> <p id='_popup.subtext' class="popup-description" style="${metadata.subtext && metadata.subtext.length > 250 ? 'max-height: 200px; overflow-y: auto;' : ''}">${metadata.subtext || ''}</p> <p id='_popup.description' class="popup-description" style="${metadata.description.length > 250 ? 'max-height: 300px; overflow-y: auto;' : ''}">${metadata.description}</p> <div class="popup-inputs" style="grid-template-columns: repeat(${metadata.rows}, 1fr);"></div> </div>`;
        let popupContent = popup.querySelector(`.popup-inputs`);
        if (metadata.subtext == undefined || metadata.subtext == ``) {
            let subtextElement = popup.querySelector(`#_popup\\.subtext`);
            if (subtextElement) { subtextElement.remove(); }
        }
        if (removeX) {
            let closeButton = popup.querySelector(`.popup-close`);
            if (closeButton) { closeButton.remove(); }
        }
        if (arrInputs) {
            arrInputs.forEach(input => { let element = document.createElement('input'); element.type = input.type || `text`; element.id = input.id; element.className = input.className || `popup-input`; element.placeholder = input.placeholder; element.value = input.value || ``; popupContent.appendChild(element); });
        }
        if (arrSelects) {
            arrSelects.forEach(select => { let element = document.createElement('select'); element.id = select.id; element.className = select.className || `popup-select`; select.options.forEach(option => { let option_element = document.createElement('option'); option_element.value = option.value; option_element.innerHTML = option.name; element.appendChild(option_element); }); popupContent.appendChild(element); });
        }
        if (arrCheckboxes) {
            arrCheckboxes.forEach(checkbox => { let label = document.createElement('label'); label.className = 'popup-checkbox-label'; let element = document.createElement('input'); element.type = 'checkbox'; element.id = checkbox.id; element.className = 'popup-checkbox'; element.checked = !!checkbox.checked; if (typeof checkbox.onchange === 'function') { element.onchange = checkbox.onchange.bind(this); } label.appendChild(element); let span = document.createElement('span'); span.innerText = checkbox.name || ''; label.appendChild(span); popupContent.appendChild(label); });
        }  
        if (arrButtons) {
            arrButtons.forEach(button => { let element = document.createElement('button'); element.className = button.className || `button-ok`; element.innerHTML = button.name; element.onclick = button.function.bind(this); popupContent.appendChild(element); });
        }
        document.getElementById(metadata.parent).appendChild(popup);
    }

    /**
      * @function clearAllPopups
      * @description Clears all existing popups from the DOM. This function selects all elements with the class `popup-box` 
      * and removes them from the document.
      */

    clearAllPopups = function() {
        let globalNotificationPopups = document.querySelectorAll('.popup-box')
        globalNotificationPopups.forEach(popup => { popup.remove() })
    }

    /**
      * @function triggerLocalStorageListener
      * @description Handles the display of the account username and prompts the user for donations if they haven't dismissed the prompt.
      * Note: Permissions are still handled by the server, this is just a client-side display function and will not affect the permissions of the user besides
      * showing certain features based on the client side storage :3
      * 
      * @param {string} [usernameSpan=`_home.accountname`] - The ID of the span element where the username will be displayed. Defaults to `_home.accountname`.
      */

    triggerLocalStorageListener = function(usernameSpan=`_home.accountname`) { 
        let username = localStorage.getItem('atmosx.cached.username') || 'Default User'; username = username.charAt(0).toUpperCase() + username.slice(1); 
        let role = localStorage.getItem('atmosx.cached.role'); let roleText = role === "1" ? "Administator" : (role === "0" ? "User" : "Administator"); 
        document.getElementById(usernameSpan).innerHTML = `${username} (Role: ${roleText})`; 
        this.storage.eas = localStorage.getItem('atmosx.cached.eas') === 'true' ? true : false;
        this.storage.sounds = localStorage.getItem('atmosx.cached.sounds') === 'true' ? true : false;
        if (role == null || role == undefined) { localStorage.setItem('atmosx.cached.role', "1"); }
        if (localStorage.getItem('atmosx.cached.donationprompt') === null) { 
            localStorage.setItem(`atmosx.cached.eas`, false)
            localStorage.setItem(`atmosx.cached.sounds`, false)
            this.injectNotification({ title: `[Introduction] Welcome to AtmosphericX, ${username}!`, description: `Thank you for using AtmosphericX! Your feedback and ideas are what makes this project go forward.<br><br><b>Support Us:</b> If you find this project helpful, consider donating. Every bit helps keep development going.<br><b>Get Involved:</b> Join our <a href="https://discord.gg/B8nKmhYMfz" target="_blank">Discord community</a> to share feedback, suggest features, or connect with other weather enthusiasts.<br><br>Feel free to select the settings you would like enabled so we can memorize them for yo<br><bMade with ❤️ by KiyomiWx and Starflight. We appreciate your support!`, rows: 2, parent: `_body.base`, buttons: [ { name: `Continue`, className: `button-danger`, function: () => { localStorage.setItem('atmosx.cached.donationprompt', true); this.clearAllPopups(); } }, { name: `Donate`, className: `button-ok`, function: () => { localStorage.setItem('atmosx.cached.donationprompt', true); window.open(`https://ko-fi.com/k3yomi`, `_blank`, 'width=1000,height=1000'); this.clearAllPopups(); } } ], checkboxes: [ { id: `atmosx.cached.eas`, className: `popup-checkbox`, name: `Enable EAS Alerts`, checked: this.storage.eas, onchange: (e) => { localStorage.setItem('atmosx.cached.eas', e.target.checked); this.storage.eas = e.target.checked; } }, { id: `atmosx.cached.sounds`, className: `popup-checkbox`, name: `Enable Alert Sounds`, checked: this.storage.sounds, onchange: (e) => { localStorage.setItem('atmosx.cached.sounds', e.target.checked); this.storage.sounds = e.target.checked; } } ], inputs: [], selects: null }); 
        }
    }

    /**
     * @function spawnAlertCards
     * @description The new improved alert card system (not really). I just combined the 2 functions into one so I can keep it simple... 
     * Basically, this function will spawn the alert cards in the specified DOM element. It will also handle the search bar and the recent alerts.
     *
     * @async
     * @param {string} [domDirectory=`child_atmosx_alerts.global_alerts`] - The ID of the DOM element where the alert cards will be injected. Defaults to `child_atmosx_alerts.global_alerts`.
     * @param {boolean} [recentOnly=false] - If true, only recent alerts will be shown. Defaults to `false`.
     * @param {string} [searchBar=`_alerts.alert_search`] - The ID of the search bar element. Defaults to `_alerts.alert_search`.
     * @param {string} [searchTerm=`] - The search term to filter the alerts. Defaults to an empty string.
     */

    spawnAlertCards = function(domDirectory=`child_atmosx_alerts.global_alerts`, recentOnly=false, searchBar=`_alerts.alert_search`, searchTerm=``) {
        let activeAlerts = this.storage.active
        let maxShownAlerts = activeAlerts.length
        if (!recentOnly) {
            if (document.getElementById(searchBar).value !== `` && searchTerm == `` && !recentOnly) { return }
            document.getElementById(searchBar).placeholder = `Search by location, event name, description, tracking id, status, or properties (x${activeAlerts.length})`
        }
        document.getElementById(domDirectory).innerHTML = ``
        this.resizeTable(domDirectory, 3);
        if (recentOnly) { maxShownAlerts = maxShownAlerts = 6 }
        if (activeAlerts.length == 0) {
            this.resizeTable(domDirectory, 1);
            this.injectCardData({ title: this.storage.configurations.default_text, content: `<center>No Alert Information Available</center>`, parent: domDirectory})
            return
        }
        activeAlerts.sort((a, b) => new Date(b.details.issued) - new Date(a.details.issued))
        for (let i = 0; i < maxShownAlerts; i++) {
            if (activeAlerts[i] == undefined) { continue }
            let alert = activeAlerts[i]
            let eventName = alert.details.name 
            let eventStatus = alert.details.type
            let locationsImpacted = alert.details.locations
            let eventIssued = alert.details.issued == undefined ? `No date found` : alert.details.issued
            let eventExpires = alert.details.expires
            let maxWindGust = alert.details.wind
            let maxHailSize = alert.details.hail
            let damageThreat = alert.details.damage
            let tornadoIndicator = alert.details.tornado
            let fullSendName = alert.details.sender
            let eventTags = alert.details.tag == undefined ? `No tags found` : alert.details.tag
            let eventTrackingID = alert.raw.tracking == undefined ? (alert.raw.properties.parameters.WMOidentifier && alert.raw.properties.parameters.WMOidentifier[0] !== undefined ? alert.raw.properties.parameters.WMOidentifier[0]  : `No ID found`) : alert.raw.tracking  
            let currentDescription = alert.details.description
            let eventHistory = alert.raw.history == undefined ? [] : alert.raw.history
            let time = library.getTimeInformation(eventExpires);
            let now = new Date()
            let seconds = Math.floor((new Date(time.unix * 1000) - now) / 1000)
            let minutes = Math.floor(seconds / 60)
            let hours = Math.floor(minutes / 60);
            let timeString = `${hours} hours ${minutes % 60} minutes ${seconds % 60} seconds`
            if (isNaN(hours)) { timeString = `No expiration date found` }
            if (hours < 0) { timeString = `Now...`}
            if (hours > 9999) { timeString = `Until further notice...`}
            eventTags = JSON.stringify(eventTags).replace(/\"/g, ``).replace(/,/g, `, `).replace(/\[/g, ``).replace(/\]/g, ``)
            if (locationsImpacted.length > 65) { locationsImpacted = locationsImpacted.substring(0, 65) + `...` }
            if (!recentOnly) { if (JSON.stringify(alert.details).toLowerCase().includes(searchTerm.toLowerCase()) == false) { continue } }
            this.injectCardData({
                title: `${eventName} (${eventStatus})`,
                content: `Event: ${eventName} (${eventStatus})<br>Locations: ${locationsImpacted}<br>Issued: ${eventIssued}<br>Expires in: ${timeString}<br>Wind Gust: ${maxWindGust} <br>Hail: ${maxHailSize}<br>Damage Threat: ${damageThreat}<br>Tornado: ${tornadoIndicator}<br>Tag: ${eventTags}<br>Sender: ${fullSendName}<br>Tracking ID: ${eventTrackingID}`,
                parent: domDirectory,
                onclick: () => {
                    let eventHistoryString = ``
                    eventHistory = eventHistory.sort((a, b) => new Date(b.time) - new Date(a.time))
                    for (let i = 0; i < eventHistory.length; i++) {
                        let descriptionSegement = eventHistory[i]
                        let genericDashline = "-".repeat(5)
                        eventHistoryString += `\n\n${genericDashline} ${descriptionSegement.act} (${descriptionSegement.time}) ${genericDashline}\n\n${descriptionSegement.desc}`;  
                    }
                    if (eventHistoryString == ``) { eventHistoryString = currentDescription } 
                    let eventSubtitle = `Event: ${eventName} (${eventStatus})<br>Locations: ${alert.details.locations}<br>Issued: ${eventIssued}<br>Expires in: ${timeString}<br>Wind Gust: ${maxWindGust} <br>Hail: ${maxHailSize}<br>Damage Threat: ${damageThreat}<br>Tornado: ${tornadoIndicator}<br>Tag: ${eventTags}<br>Sender: ${fullSendName}<br>Tracking ID: ${eventTrackingID}`
                    this.injectNotification({
                        title: `${eventName} (${eventStatus})`,  
                        subtext: eventSubtitle,
                        description: eventHistoryString.replace(/\n/g, `<br>`), 
                        rows: 3,  
                        parent: `_body.base`,  
                        buttons: [
                            { name: `<ic class="fa fa-copy"></ic> Card`, className: `button-ok`, function: () => { this.copyTextToClipboard(eventSubtitle.replace(/<br>/g, `\n`)) } },
                            { name: `<ic class="fa fa-copy"></ic> Description`, className: `button-ok`, function: () => { this.copyTextToClipboard(currentDescription) } },
                            { name: `<ic class="fa fa-copy"></ic> History`, className: `button-ok`, function: () => { this.copyTextToClipboard(eventHistoryString) } },
                            { name: `<ic class="fa fa-volume-up"></ic> Play Audio`, className: `button-ok`, function: () => { this.storage.alertsQueue = []; this.storage.alertsQueue.push(alert); alert_class.triggerAlertQueue() }},
                            { name: `<ic class="fa fa-volume-up"></ic> Play EAS`, className: `button-ok`, function: () => { this.storage.alertsQueue = []; this.storage.alertsQueue.push(alert); alert_class.createDashboardPriorityAlert(alert)} },
                            { name: `<ic class="fa fa-volume-up"></ic> Play Chatbot`, className: `button-ok`, function: () => { fetch('/api/chatbot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: currentDescription }) }) }},
                            { name: `Close`, className: `button-danger`, function: () => { this.clearAllPopups(); } }
                        ]
                    })  }
            })
        }   
        if (recentOnly) {
            for (let i = activeAlerts.length; i < maxShownAlerts; i++) {
                this.injectCardData({ title: this.storage.configurations.default_text, content: `<center>No Alert Information Available</center>`, parent: domDirectory})
            }
        }
    }

    /**
      * @function spawnStormReports
      * @description Retrieves and displays the latest storm reports from the `storage.reports` array. If there are no reports, it shows a message indicating that no storm reports are available. The reports are displayed as cards with relevant details such as event name, location, issued/expires times, and a description.
      * The reports are sorted by the issued time (most recent first) and displayed in a section of the webpage. Each report card has a click handler that opens an alert showing more detailed information about the storm report.
      * 
      * @param {string} [domDirectory=`child_atmosx_lsr.reports`] - The ID of the DOM element where the storm reports will be injected. Defaults to `child_atmosx_lsr.reports`.
      * @param {string} [searchBar=`_lsr.reports_search`] - The ID of the search bar element. Defaults to `_lsr.reports_search`.
      * @param {string} [searchTerm=`] - The search term to filter the reports. Defaults to an empty string.
      */

    spawnStormReports = function(domDirectory=`child_atmosx_lsr.reports`, searchBar=`_lsr.reports_search`, searchTerm=``) {
        let reports = this.storage.reports 
        if (document.getElementById(searchBar).value !== `` && searchTerm == ``) { return }
        document.getElementById(domDirectory).innerHTML = ``
        document.getElementById(searchBar).placeholder = `Search by report location or event name (x${reports.length})`
        this.resizeTable(domDirectory, 3);
        if (reports.length == 0) { 
            this.resizeTable(domDirectory, 1);
            this.injectCardData({ title: `Awaiting Storm Reports...` ,content: `<center>No Storm Report Information Available</center>`, parent: domDirectory})
            return
        }
        reports.sort((a, b) => new Date(b.issued) - new Date(a.issued))
        for (let i = 0; i < reports.length; i++) {
            if (reports[i] == undefined) { continue }
            let details = reports[i].description
            let expires = reports[i].expires
            let issued = reports[i].issued
            let locations = reports[i].location
            let event = reports[i].event 
            let sender = reports[i].sender
            if (event.includes(searchTerm) == false && details.includes(searchTerm) == false && locations.includes(searchTerm) == false) { continue }
            this.injectCardData({ 
                title: `${event}`, 
                content: `Location: ${locations}<br>Issued: ${issued}<br>Expires: ${expires}<br>Details: ${details}<br>Sender: ${sender}`, 
                parent: domDirectory,
                onclick: () => {
                    this.injectNotification({ title: `${event}`, description: `Location: ${locations}<br>Issued: ${issued}<br>Expires: ${expires}<br>Details: ${details}<br>Sender: ${sender}`, rows: 2, parent: `_body.base`, buttons: [{ name: `Close`, className: `button-danger`, function: () => { this.clearAllPopups(); } }, { name: `<ic class="fa fa-copy"></ic> Clipboard`, className: `button-ok`, function: () => { this.copyTextToClipboard(`Location: ${locations}\nIssued: ${issued}\nExpires: ${expires}\nDetails: ${details}\nSender: ${sender}`); } }] });
                } 
            });
        }
    }


    /**
      * @function spawnMesoscaleDiscussions
      * @description Retrieves and displays mesoscale discussions from the `storage.mesoscale` array. If there are no discussions, it shows a message indicating that no mesoscale discussions are available. Each discussion is displayed as a card with its respective content.
      * The mesoscale discussions are displayed in a section of the webpage. Each discussion card has a click handler that opens an alert showing more detailed information about the mesoscale discussion.
      * 
      * @param {string} [domDirectory=`child_atmosx_discussions.mesoscale`] - The ID of the DOM element where the mesoscale discussions will be injected. Defaults to `child_atmosx_discussions.mesoscale`.
      */

    spawnMesoscaleDiscussions = function(domDirectory=`child_atmosx_discussions.mesoscale`) {
        document.getElementById(domDirectory).innerHTML = ``
        let mesoscale = this.storage.discussions
        if (mesoscale.length == 0) {
            this.injectCardData({ title: `Awaiting Mesoscale Discussions...`, content: `<center>No Mesoscale Discussion Information Available</center>`, parent: domDirectory})
            return
        }
        for (let i = 0; i < mesoscale.length; i++) {
            let discussion = mesoscale[i]
            this.injectCardData({
                title: `Mesoscale Discussion #${i + 1}`,
                content: discussion,
                parent: domDirectory,
                onclick: () => {
                    this.injectNotification({ title: `Mesoscale Discussion #${i + 1}`, description: discussion, rows: 2, parent: `_body.base`, buttons: [{ name: `Close`, className: `button-danger`, function: () => { this.clearAllPopups(); } }, { name: `<ic class="fa fa-copy"></ic> Clipboard`, className: `button-ok`, function: () => { this.copyTextToClipboard(discussion); } }]}); 
                }
            });
        }
    }

    /**
      * @function spawnStormPredictionCenterModels
      * @description Retrieves and displays storm prediction center models from `storage.configurations.spc_outlooks`. For each model, it displays an image of the outlook and its title. Each outlook is displayed as a card in the webpage with an image and title.
      * This function iterates through all the storm prediction center outlooks stored in `storage.configurations.spc_outlooks`, creating a data card for each model. The card includes the title of the model and the image associated with it. Each card is clickable 
      * and opens the image in a new tab when clicked.
      * 
      * @param {string} [domDirectory=`hub_spc.models`] - The ID of the DOM element where the storm prediction center models will be injected. Defaults to `hub_spc.models`.
      */

    spawnStormPredictionCenterModels = function(domDirectory=`hub_spc.models`) {
        document.getElementById(domDirectory).innerHTML = ``
        let currentOutlooks = this.storage.configurations.spc_outlooks
        for (let i = 0; i < currentOutlooks.length; i++) {
            let outlook = currentOutlooks[i]
            let title = outlook.title
            let img = outlook.source
            this.injectCardData({
                title: `${title}`,
                content: `<img src="${img}" alt="${title}" style="width: 100%; height: auto;">`,
                parent: domDirectory,
                onclick: () => { window.open(img, '_blank', `width=1000,height=1000`) }
            });
        }
    }

    /**
      * @function spawnStormSpotterNetwork
      * @description Displays information about the spotter network including active, inactive, streaming, and idle spotters. For each spotter, a data card is created containing the spotter's location and description. The description is parsed to create clickable links if URLs are present.
      * 
      * @async 
      * @param {string} [domDirectory=`child_atmosx_spotternetwork.general`] - The ID of the DOM element where the spotter network information will be injected. Defaults to `child_atmosx_spotternetwork.general`.
      * @param {string} [searchBar=`_spotternetwork.spotter_search`] - The ID of the search bar element. Defaults to `_spotternetwork.spotter_search`.
      * @param {string} [searchTerm=`] - The search term to filter the spotters. Defaults to an empty string.
      */

    spawnStormSpotterNetwork = async function(domDirectory=`child_atmosx_spotternetwork.general`, searchBar=`_spotternetwork.spotter_search`, searchTerm=``) {
        let spotters = this.storage.spotters
        if (document.getElementById(searchBar).value !== `` && searchTerm == ``) { return }
        document.getElementById(domDirectory).innerHTML = ``
        document.getElementById(searchBar).placeholder = `Search by spotter description (x${spotters.length})`
        this.resizeTable(domDirectory, 3);
        if (spotters.length == 0) {
            this.resizeTable(domDirectory, 1);
            this.injectCardData({ title: `Awaiting Spotter Network...`,content: `<center>No Spotter Network Information Available<br>Are you sure you enabled it in the configurations?</center>`,parent: domDirectory})
        }
        await spotters.forEach(spotter => {
            let description = spotter.description.toString().replace(/\\n/g, '<br>').replace('"', '');
            spotter.description = description;
        });    
        let indicators = { streaming: "🟣", active: "🟢", idle: "🟡", inactive: "🔴"};
        for (let i = 0; i < spotters.length; i++) {
            let lat = spotters[i].lat
            let lon = spotters[i].lon
            let description = spotters[i].description
            let isActive = spotters[i].active 
            let isIdle = spotters[i].idle
            let isStreaming = spotters[i].streaming
            let isOffline = spotters[i].offline
            let currentIndicator = indicators.inactive
            if (isOffline == 1) { currentIndicator = indicators.inactive }
            if (isActive == 1) { currentIndicator = indicators.active }
            if (isIdle == 1) { currentIndicator = indicators.idle }
            if (isStreaming == 1) { currentIndicator = indicators.streaming }
            if (description.toLowerCase().includes(searchTerm.toLowerCase()) == false) { continue }
            this.injectCardData({
                title: `${currentIndicator} Spotter #${i + 1}`,
                content: `Location: ${lat}, ${lon}<br>Description: ${description}`,
                parent: domDirectory,
                onclick: () => {
                    let descriptionString = description.replace(/<a href="(.*?)">(.*?)<\/a>/g, `<a href="$1" target="_blank">$2</a>`);
                    this.injectNotification({
                        title: `Spotter #${i + 1}`, 
                        description: `Location: ${lat}, ${lon}<br>Description: ${descriptionString}`, 
                        rows: 2,
                        parent: `_body.base`,
                        buttons: [
                            { name: `Close`, className: `button-danger`, function: () => { this.clearAllPopups(); } },
                            { name: `<ic class="fa fa-copy"></ic> Clipboard`, className: `button-ok`, function: () => { this.copyTextToClipboard(`Location: ${lat}, ${lon}\nDescription: ${description}`); } }
                        ]
                    });
                }
            });
        }
    }

    /**
      * @function spawnExternalServices
      * @description Displays external third-party service links in the user interface by dynamically creating data cards for each service. Each card contains an image (if provided) and opens the associated URL when clicked.
      *
      * @param {string} [domDirectory=`child_atmosx_spotternetwork.general`] - The ID of the DOM element where the external services will be injected. Defaults to `child_atmosx_spotternetwork.general`.
      */
    
    spawnExternalServices = function(domDirectory=`hub_external.services`) {
        document.getElementById(domDirectory).innerHTML = ``
        let services = this.storage.configurations.third_party_services
        for (let i = 0; i < services.length; i++) {
            let service = services[i]
            let title = service.title
            let img = service.image
            let url = service.url
            this.injectCardData({
                title: `${title}`,
                content: `<img src="${img}" class="spcial-image" alt="${title}" style="width: 100%; height: auto;">`,
                parent: domDirectory,
                onclick: () => {
                    window.open(url, '_blank', 'width=1000,height=1000')
                }
            });
        }
    }

    /**
      * @function spawnWireOpenInterface
      * @description Displays NOAA Weather Wire Service reports in the user interface. Each report is displayed in a data card, and clicking the card shows the detailed message in an alert box.
      * 
      * The function retrieves the list of reports from `this.storage.wire` and for each report, creates a data card displaying the message. When clicked, the message is shown in a browser alert box.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM by creating and appending data cards for each NOAA Weather Wire Service report.
      */

    spawnWireOpenInterface = function(domDirectory=`child_atmosx_nwws.reports`) {
        document.getElementById(domDirectory).innerHTML = ``
        let wire = this.storage.wire 
        if (wire.length == 0) {
            this.injectCardData({ title: `Awaiting NOAA Weather Wire Service...`, content: `<center>No NOAA Weather Wire Service Information Available<br>Do you have valid credentials and did you enable it?</center>`, parent: domDirectory})
            return
        }
        wire.sort((a, b) => new Date(b.issued) - new Date(a.issued))
        for (let i = 0; i < wire.length; i++) {
            let message = wire[i].message.replace(/\n/g, '<br>')
            let issued = this.library.getTimeInformation(wire[i].issued)
            this.injectCardData({
                title: `NOAA Weather Wire Service #${i + 1} - ${issued.time}`,
                content: message.substring(0, 500) + `...`,
                parent: domDirectory,
                onclick: () => {
                    this.injectNotification({
                        title: `NOAA Weather Wire Service #${i + 1} - ${issued.time}`, 
                        description: message, 
                        rows: 2,
                        parent: `_body.base`,
                        buttons: [
                            { name: `Close`, className: `button-danger`, function: () => { this.clearAllPopups(); } },
                            { name: `<ic class="fa fa-copy"></ic> Clipboard`, className: `button-ok`, function: () => { this.copyTextToClipboard(wire[i].message); } 
                        }
                    ]});    
                }
            });
        }
    }

    /**
      * @function spawnTornadoProbabilities
      * @description Displays tornado probabilities from cells
      * 
      * @param {string} [domDirectory=`child_atmosx_tor.statistics`] - The ID of the DOM element where the tornado probabilities will be injected. Defaults to `child_atmosx_nwws.reports`.
      */

    spawnTornadoProbabilities = function(domDirectory=`child_atmosx_tor.statistics`) {
        document.getElementById(domDirectory).innerHTML = ``
        let stats = this.storage.torprob 
        this.resizeTable(domDirectory, 3);
        if (stats.length == 0) {
            this.resizeTable(domDirectory, 1);
            this.injectCardData({ title: `Awaiting Tornado Probabilities...`, content: `<center>No Tornado Probabilities Information Available</center>`, parent: domDirectory})
            return
        }
        stats.sort((a, b) => b.probability - a.probability);
        for (let i = 0; i < stats.length; i++) {
            this.injectCardData({
                title: `Percentage: ${stats[i].probability}% (${stats[i].id})`,
                content: stats[i].description.replace(/\\n/g, '\n').replace(/\n/g, '<br>').replace(/"/g, "").replace(/'/g, "").substring(0, 500),
                parent: domDirectory
            });    
        }
    }

    /**
      * @function spawnSevereProbabilities
      * @description Displays severe probabilities from cells
      * 
      * @param {string} [domDirectory=`child_atmosx_tor.statistics`] - The ID of the DOM element where the severe probabilities will be injected. Defaults to `child_atmosx_nwws.reports`.
      */

    spawnSevereProbabilities = function(domDirectory=`child_atmosx_svr.statistics`) {
        document.getElementById(domDirectory).innerHTML = ``
        let stats = this.storage.svrprob 
        this.resizeTable(domDirectory, 3);        
        if (stats.length == 0) {
            this.resizeTable(domDirectory, 1);
            this.injectCardData({ title: `Awaiting Severe Probabilities...`, content: `<center>No Severe Probabilities Information Available</center>`, parent: domDirectory})
            return
        }
        stats.sort((a, b) => b.probability - a.probability);
        for (let i = 0; i < stats.length; i++) {
            this.injectCardData({
                title: `Percentage: ${stats[i].probability}% (${stats[i].id})`,
                content: stats[i].description.replace(/\\n/g, '\n').replace(/\n/g, '<br>').replace(/"/g, "").replace(/'/g, "").substring(0, 500),
                parent: domDirectory
            });    
        }
    }
    
    /**
      * @function spawnRadioServices
      * @description Displays NOAA Radio Services in the user interface. Each radio service is displayed in a data card, and clicking the card toggles audio playback for that service.
      *
      * @param {string} [domDirectory=`hub_radio.noaa`] - The ID of the DOM element where the NOAA Radio Services will be injected. Defaults to `hub_radio.noaa`.
      * @param {string} [searchBar=`_noaa_radio_communications.radio_search`] - The ID of the search bar element. Defaults to `_spotternetwork.spotter_search`.
      * @param {string} [searchTerm=`] - The search term to filter the radio services. Defaults to an empty string.
      */

    spawnRadioServices = function(domDirectory=`hub_radio.noaa`, searchBar=`_noaa_radio_communications.radio_search`, searchTerm=``) {
        let radioServices = this.library.storage.wxRadio
        if (document.getElementById(searchBar).value !== `` && searchTerm == ``) { return }
        document.getElementById(domDirectory).innerHTML = ``
        if (radioServices.length == 0) {
            this.resizeTable(domDirectory, 1)
            this.injectCardData({ title: `Awaiting NOAA Radio Services...`, content: `<center>No NOAA Radio Streams Available.<br>Did you enable it within configurations?</center>`, parent: domDirectory})
            return
        }
        this.resizeTable(domDirectory, 3)
        
        if (!window._radioPlayers) window._radioPlayers = {};
        let cardRefs = [];
        for (let i = 0; i < radioServices.length; i++) {
            let source = radioServices[i]
            if (JSON.stringify(source).toLowerCase().includes(searchTerm.toLowerCase()) == false) { continue }
            let card = this.injectCardData({
                title: `${source.callsign} (${source.frequency}) - ${source.location}`,
                content: `Location: ${source.location}<br>Frequency: ${source.frequency}`,
                parent: domDirectory,
                onclick: () => {
                    let listenUrl = source.stream;
                    if (!window._radioPlayers) window._radioPlayers = {};
                    let currentAudio = window._radioPlayers[i];
                    if (currentAudio && !currentAudio.paused) {
                        currentAudio.pause();
                        delete window._radioPlayers[i];
                        card.style.outline = 'none';
                    } else {
                        let audio = new Audio(listenUrl);
                        window._radioPlayers[i] = audio;
                        audio.play();
                        audio.volume = 0.2; // Set volume to 50%
                        card.style.outline = '2px solid #00c853';
                    }
                }
            });
            cardRefs[i] = card;
            if (window._radioPlayers[i] && !window._radioPlayers[i].paused) { card.style.outline = '2px solid #00c853'; }
        }
    }

    /**
      * @function spawnGeneralSetupHub
      * @description Displays a setup hub for general configurations, including downloading templates, plugins, and links to community resources.
      * 
      * @param {string} [domDirectory=`hub.plugins`] - The ID of the DOM element where the setup hub will be injected. Defaults to `hub.plugins`.
      */

    spawnGeneralSetupHub = function(domDirectory=`hub.plugins`) {
        document.getElementById(domDirectory).innerHTML = ``
        let obsDownload = `${window.location.protocol || 'http'}//${window.location.hostname || 'localhost'}`;
        this.injectCardData({
            title: `Download Latest Template`,
            content: `<button class="button-ok" style="width: 100%; margin-top: 5px;">Download</button><br><small>Put the endpoint you used to connect to the dashboard, this will give you a template scene for OBS Studio.</small>`,
            parent: domDirectory,
            onclick: () => {
                this.injectNotification({
                    title: `Download Latest Template`,
                    description: `Put the endpoint you used to connect to the dashboard, this will automatically setup your template for you.`,
                    rows: 1,
                    parent: `_body.base`, 
                    buttons: [
                        { name: `Download Custom Scene`, className: `button-ok`, function: () => { 
                            fetch('/obs/OBSTemplate.json').then(response => response.text()).then(r => { 
                                let a = document.createElement('a'); 
                                a.href = window.URL.createObjectURL(new Blob([r.split('http://localhost:80/').join(document.getElementById('_obs_replace').value)], { type: 'application/json' })); 
                                a.download = 'OBSTemplate.json'; 
                                a.click(); 
                                window.URL.revokeObjectURL(a.href); 
                            }).catch(error => console.error('Error fetching template:', error));
                        }},
                    ],
                    inputs: [ 
                        { id: `_obs_replace`, className: `popup-input`, placeholder: `${obsDownload}/`, value: `${obsDownload}/` },
                    ]
                })
                
            }
        });
        this.injectCardData({
            title: `Public Discord Community`,
            content: `<button class="button-ok" style="width: 100%; margin-top: 5px;" onclick="window.open('https://discord.gg/B8nKmhYMfz', '_blank', 'width=1000,height=1000')">Join Discord</button><br><small>Join our public Discord community to get help, get custom unique themes, discuss weather, and talk with others.</small>`,
            parent: domDirectory,
            onclick: () => {}
        });
        this.injectCardData({
            title: `Public Community Theme`,
            content: `<button class="button-ok" style="width: 100%; margin-top: 5px;" onclick="window.open('https://github.com/K3YOMI/AtmosphericX/discussions/29', '_blank', 'width=1000,height=1000')">Community Theme</button><br><small>Put the endpoint you used to connect to the dashboard, this will automatically setup your template for you.</small>`,
            parent: domDirectory,
            onclick: () => {}
        });

        this.injectCardData({
            title: `Download Source Clone Plugin`,
            content: `<button class="button-ok" style="width: 100%; margin-top: 5px;" onclick="window.open('https://obsproject.com/forum/resources/source-clone.1632/', '_blank', 'width=1000,height=1000');">Download</button><br><small>Source Clone is a plugin for OBS Studio that allows you to create multiple instances of a source, which can be useful for creating complex scenes or overlays.</small>`,
            parent: domDirectory,
            onclick: () => {}
        });
        this.injectCardData({
            title: `Download Composite Blur Plugin`,
            content: `<button class="button-ok" style="width: 100%; margin-top: 5px;" onclick="window.open('https://obsproject.com/forum/resources/composite-blur.1780/', '_blank', 'width=1000,height=1000');">Download</button><br><small>Composite Blur is a plugin for OBS Studio that allows you to apply a blur effect to specific areas of your scene. This can be useful for hiding sensitive information or creating a more polished look for your stream.</small>`,
            parent: domDirectory,
            onclick: () => {}
        });
        this.injectCardData({
            title: `Submit an Issue/PR Request`,
            content: `<button class="button-ok" style="width: 100%; margin-top: 5px;" onclick="window.open('https://github.com/K3YOMI/AtmosphericX/issues/', '_blank', 'width=1000,height=1000');">Create Issue</button><br><br><button class="button-ok" style="width: 100%; margin-top: 5px;" onclick="window.open('https://github.com/K3YOMI/AtmosphericX/pulls', '_blank', 'width=1000,height=1000');">Create PR</button><br><small>If you have any issues to fix or changes you would like to see in the project, please submit a PR request. This will help me track changes and improve the project.</small>`,
            parent: domDirectory,
            onclick: () => {}
        });
    }


    /**
      * @function spawnConfigurations
      * @description Displays configurable configurations in the user interface. It retrieves the configurations from the storage and opens an editor for them.
      * 
      * @async
      * @param {string} [domDirectory=`hub.configurations`] - The ID of the DOM element where the configurations will be injected. Defaults to `hub.configurations`.
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM by creating and appending configurations data.
      */
    
    spawnConfigurations = async function(domDirectory = `hub.configurations`) {
        let container = document.getElementById(domDirectory);
        container.innerHTML = ``;
        let response = this.library.storage.configurableConfigurations;
        let configurations = await response.json()
        this.resizeTable(domDirectory, 1);
        cfg_class.openEditor(container, configurations.message)
    }

    /**
      * @function spawnSettings
      * @description Displays client and server data in the user interface. It retrieves the data from the performance and navigator objects, and displays it in a card format.
      *
      * @async
      * @param {string} [domDirectory=`hub.system`] - The ID of the
      *
      */

    spawnSettings = async function(domDirectory = `hub.system`) {
        document.getElementById(domDirectory).innerHTML = ``
        this.injectCardData({
            title: `Client Data`,
            content: `Memory: ${performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}<br>CPU Cores: ${navigator.hardwareConcurrency || 'N/A'}<br>Battery Level: ${navigator.getBattery ? (await navigator.getBattery()).level * 100 + '%' : 'N/A'}<br>User Agent: ${navigator.userAgent || 'N/A'}<br>Platform: ${navigator.platform || 'N/A'}<br>Screen Resolution: ${window.screen.width}x${window.screen.height}<br>Version: ${this.library.storage.updates.version || 'N/A'}<br>HTTPS: ${window.location.protocol === 'https:' ? 'Enabled' : 'Disabled'}<br>Current Role: ${localStorage.getItem('atmosx.cached.role') == "1" ? 'Administrator' : localStorage.getItem('atmosx.cached.role') == "2" ? 'Moderator' : localStorage.getItem('atmosx.cached.role') == "3" ? 'User' : 'Guest'}`,
            parent: domDirectory,
            onclick: () => {}
        });
        this.injectCardData({
            title: `Server Data`,
            content: `Memory: ${this.library.storage.metrics?.memory || 'N/A'}<br>CPU: ${this.library.storage.metrics?.cpu || 'N/A'}<br>Platform: ${this.library.storage.metrics?.platform || 'N/A'}<br>Arch: ${this.library.storage.metrics?.arch || 'N/A'}<br>Uptime: ${this.library.storage.metrics?.uptime || 'N/A'}<br>Node.js Version: ${this.library.storage.metrics?.node_version || 'N/A'}<br>Hostname: ${this.library.storage.metrics?.hostname || 'N/A'}<br>Free Memory: ${this.library.storage.metrics?.free_memory || 'N/A'}<br>Total Memory: ${this.library.storage.metrics?.total_memory || 'N/A'}<br>Load Avg: ${(this.library.storage.metrics?.loadavg || []).join(', ') || 'N/A'}<br>`,
            parent: domDirectory,
            onclick: () => {}
        });  
    }

    /**
      * @function copyTextToClipboard
      * @description Copies the provided text to the clipboard. If the copy operation is successful, a notification is displayed. If it fails, an error message is shown.
      * 
      * @param {string} text - The text to be copied to the clipboard.
      */

    copyTextToClipboard = function(text) {
        try {
        window.navigator.clipboard.writeText(text)
            this.library.createNotification(`<span style="color: green;">Copied</span> to clipboard!`);
        } catch (err) {
            this.library.createNotification(`You must enable <span style="color: red;">clipboard</span> permissions in your browser settings or be on a secure https session!`);
        }
    }

    /**
      * @function resizeTable
      * @description Resizes the grid template columns of a specified DOM element to a given size.
      * 
      * @param {string} [domDirectory=`child_atmosx_alerts.global_alerts`] - The ID of the DOM element whose grid template columns will be resized. Defaults to `child_atmosx_alerts.global_alerts`.
      * @param {number} [size=3] - The number of columns to set in the grid template. Defaults to 3.
      */

    resizeTable = function(domDirectory=`child_atmosx_alerts.global_alerts`, size=3) {
        let isMobile = window.innerWidth <= 1270;
        if (isMobile) { return }
        document.getElementById(domDirectory).setAttribute('data-original-grid-template-columns', size);  
        document.getElementById(domDirectory).style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    }

    /**
      * @function populateSidebar
      * @description Populates the sidebar with static dashboard items based on the user's role and permissions. Each item is created as a div element with an icon and label, and can trigger navigation or actions when clicked.
      * 
      * @param {string} [domDirectory=`_sidebar.data`] - The ID of the DOM element where the sidebar items will be injected. Defaults to `_sidebar.data`.
      */ 

    populateSidebar = function(domDirectory=`_sidebar.data`) {
        let staticSidebarItems = static_dashboard_directs
        let currentRole = localStorage.getItem('atmosx.cached.role') || '0';
        let dom = document.getElementById(domDirectory);
        for (let i = 0; i < staticSidebarItems.length; i++) {
            let item = staticSidebarItems[i];
            if (item.permission && currentRole !== item.permission.toString()) { continue; }
            let div = document.createElement('div');
            div.className = 'sidebar-item';
            div.innerHTML = `<i class="${item.icon}"></i><span>${item.label}</span>`;
            if (item.nav) { div.onclick = async () => {
                if (item.label === 'Configurations') { 
                    let response = await library.createHttpRequest(`/configurations`)
                    if (response.status == 200) { this.storage.configurableConfigurations = response; }
                    this.spawnConfigurations();
                }
                this.navigationListener(item.nav); 
            }}
            if (item.action) { 
                if (typeof item.action === 'function') {div.onclick = item.action; }
                if (typeof item.action === 'string') {div.onclick = () => this[item.action](); }}
            dom.appendChild(div);
        }
    }

    /**
      * @function populateDevLogs
      * @description Populates the development logs section with the latest changelogs and version information. If there are no changelogs available, it displays a message indicating that.
      */

    populateDevLogs = function(version=`version`, domDirectory=`_devlogs`, headlineDom=`data-card-headline-parent`, headlineClass=`.data-card-headline`, httpsClass=`atmosx.header.https`) {
        if (library.storage.updates.changelogs && Array.isArray(library.storage.updates.changelogs) && library.storage.updates.changelogs.length > 0) {
            document.getElementById(version).innerHTML = `v${library.storage.updates.version}`
            document.getElementById(httpsClass).innerHTML = `${library.storage.updates.updated} - v${library.storage.updates.version}<ul style="padding-left: 20px;">${library.storage.updates.changelogs.map(item => `<li>${item}</li>`).join('')}</ul>`;
            if (library.storage.updates.headline != ``) {
                document.getElementById(headlineDom).style.display = 'block'
                document.querySelector(headlineClass).innerHTML = library.storage.updates.headline
            }
        } else {
            document.getElementById(httpsClass).innerHTML = `No changelogs available for this version.`;
        }
    }

    /**
      * @function toggleMute
      * @description Toggles the mute state of alerts. If alerts are muted, it updates the storage and displays a notification indicating that alerts have been muted. If alerts are unmuted, it updates the storage and displays a notification indicating that alerts have been unmuted.
      * 
      */ 

    toggleMute = function() {
        if (this.storage.sounds == true) {
            this.storage.sounds = false;
            localStorage.setItem('atmosx.cached.sounds', false);
            this.library.createNotification(`<span style="color: red;">Alerts have been muted</span>`);
        } else {
            this.storage.sounds = true;
            localStorage.setItem('atmosx.cached.sounds', true);
            this.library.createNotification(`<span style="color: green;">Alerts have been unmuted</span>`);
        }
    }

    /**
      * @function toggleEAS
      * @description Toggles the EAS display
      */

    toggleEAS = function() {
        if (this.storage.eas == true) {
            this.storage.eas = false;
            localStorage.setItem('atmosx.cached.eas', false);
            this.library.createNotification(`<span style="color: red;">EAS Alerts have been disabled</span>`);
        } else {
            this.storage.eas = true;
            localStorage.setItem('atmosx.cached.eas', true);
            this.library.createNotification(`<span style="color: green;">EAS Alerts have been enabled</span>`);
        }
    }

    /**
      * @function updateThread
      * @description Updates various sections of the dashboard by calling specific 
      * functions to refresh data and display it in the user interface.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM to update various sections of the dashboard.
      */

    async updateSize() {
        let elements = document.querySelectorAll(`[class*="grid-area"]`);
        for (let i = 0; i < elements.length; i++) {
            if (window.innerWidth <= 1270) { 
                elements[i].style.gridTemplateColumns = 'repeat(1, 1fr)';
                continue;
            }
            let originalValue = elements[i].getAttribute('data-original-grid-template-columns');
            if (originalValue) {
                elements[i].style.gridTemplateColumns = 'repeat(' + originalValue + ', 1fr)';
            } else {
                elements[i].style.gridTemplateColumns = 'repeat(3, 1fr)';
            }
        }
    }

    async updateThread() {
        this.updateSize()
        this.spawnStormReports()
        this.spawnMesoscaleDiscussions()
        this.spawnStormSpotterNetwork()
        this.spawnWireOpenInterface()
        this.spawnTornadoProbabilities()
        this.spawnSevereProbabilities()
        this.spawnSettings()
        this.spawnAlertCards(`child_atmosx_alerts.global_alerts`, false, `_alerts.alert_search`, ``)
        this.spawnAlertCards(`child_atmosx_alerts.recent_alerts`, true, ``, ``)
        this.spawnRadioServices(`hub_radio.noaa`, `_noaa_radio_communications.radio_search`, ``)
        let elements = document.querySelectorAll(`[id^="child_atmosx_"]`)
        for (let i = 0; i < elements.length; i++) {
            let doc = elements[i]
            if (doc == undefined) { continue }
            if (doc.parentElement == undefined) { continue }
            if ((doc.parentElement).parentElement.parentElement.style.display == `none`) { doc.innerHTML = ``; continue; }
        }
    }
}