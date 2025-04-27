

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
    constructor(_library) {
        this.library = _library
        this.storage = global
        this.alert_class = undefined
        this.name = `Dashboard`
        this.library.PrintLog(`${this.name} Initialization`, `Successfully initialized ${this.name} module`)
        document.addEventListener('onCacheUpdate', async (event) => {})
    }

    /**
      * @function SendLoginListener
      * @description Sets up an event listener for the login form submission. When the form is submitted, it prevents the default action, hashes the password using SHA-256, and sends a POST request to the `/api/login` endpoint with the username and hashed password. Based on the response, it displays either a success or error message and redirects the user to the homepage if the login is successful.
      * 
      * @async
      * @returns {Promise<void>} 
      * Resolves once the login request has been processed, either with a successful redirect or displaying an error message.
      */

    async SendLoginListener(_dir=`login-form`) {
        document.getElementById(_dir).addEventListener('submit', function(event) {
            event.preventDefault();
            let username = document.getElementById(`username`).value;
            let password = CryptoJS.SHA256(document.getElementById(`password`).value).toString();
            fetch(`/api/login`, {
                method: `POST`,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password })
            }).then(response => { 
                if (response.ok) {
                    response.json().then(data => {
                        document.querySelector('.error-message2').innerHTML = data.message;
                        document.querySelector('.error-message2').style.display = 'block';
                        document.querySelector('.error-message').style.display = 'none';
                        localStorage.setItem('atmosx.cached.username', username)
                        setTimeout(() => { window.location.replace(`/`) }, 100);
                    })
                } else { 
                    response.json().then(data => {
                        document.querySelector('.error-message').innerHTML = data.message;
                        document.querySelector('.error-message').style.display = 'block';
                        document.querySelector('.error-message2').style.display = 'none';
                    })
                }
            }).catch(error => {
                document.querySelector('.error-message').innerHTML = 'An error occurred while processing your request.';
                document.querySelector('.error-message').style.display = 'block';
                document.querySelector('.error-message2').style.display = 'none';
            })
        })
    }

    /**
      * @function ResetPasswordListener
      * @description Sets up an event listener for the password reset form submission. When the form is submitted, it prevents the default action, hashes the current password and new password using SHA-256, and sends a POST request to the `/api/reset` endpoint with the username, current password, and new password. Based on the response, it displays either a success or error message and redirects the user to the homepage if the reset is successful.
      * 
      * @async
      * @returns {Promise<void>} 
      * Resolves once the password reset request has been processed, either with a successful redirect or displaying an error message.
      */

    async ResetPasswordListener(_dir=`login-form`) {
        document.getElementById(_dir).addEventListener('submit', function(event) {
            event.preventDefault();
            let username = document.getElementById(`username`).value;
            let password = CryptoJS.SHA256(document.getElementById(`password`).value).toString();
            let new_password = CryptoJS.SHA256(document.getElementById(`new-password`).value).toString();
            fetch(`/api/reset`, {
                method: `POST`,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password, new_password: new_password})    
            }).then(response => { 
                if (response.ok) {
                    response.json().then(data => {
                        document.querySelector('.error-message2').innerHTML = data.message;
                        document.querySelector('.error-message2').style.display = 'block';
                        document.querySelector('.error-message').style.display = 'none';
                        setTimeout(() => { window.location.replace(`/`) }, 100);
                    })
                } else { 
                    response.json().then(data => {
                        document.querySelector('.error-message').innerHTML = data.message;
                        document.querySelector('.error-message').style.display = 'block';
                        document.querySelector('.error-message2').style.display = 'none';
                    })
                }
            }).catch(error => {
                document.querySelector('.error-message').innerHTML = 'An error occurred while processing your request.';
                document.querySelector('.error-message').style.display = 'block';
                document.querySelector('.error-message2').style.display = 'none';
            })
        })
    }

    /**
      * @function RegisterAccountListener
      * @description Sets up an event listener for the account registration form submission. When the form is submitted, it prevents the default action, hashes the password using SHA-256, and sends a POST request to the `/api/register` endpoint with the username and hashed password. Based on the response, it displays either a success or error message and redirects the user to the homepage if the registration is successful.
      * 
      * @async
      * @returns {Promise<void>} 
      * Resolves once the registration request has been processed, either with a successful redirect or displaying an error message.
      */

    async RegisterAccountListener(_dir=`login-form`) {
        document.getElementById(_dir).addEventListener('submit', function(event) {
            event.preventDefault();
            let username = document.getElementById(`username`).value;
            let password = CryptoJS.SHA256(document.getElementById(`password`).value).toString();
            fetch(`/api/register`, {
                method: `POST`,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password })
            }).then(response => { 
                if (response.ok) {
                    response.json().then(data => {
                        document.querySelector('.error-message2').innerHTML = data.message;
                        document.querySelector('.error-message2').style.display = 'block';
                        document.querySelector('.error-message').style.display = 'none';
                        setTimeout(() => { window.location.replace(`/`) }, 100);
                    })
                } else { 
                    response.json().then(data => {
                        document.querySelector('.error-message').innerHTML = data.message;
                        document.querySelector('.error-message').style.display = 'block';
                        document.querySelector('.error-message2').style.display = 'none';
                    })
                }
            }).catch(error => {
                document.querySelector('.error-message').innerHTML = 'An error occurred while processing your request.';
                document.querySelector('.error-message').style.display = 'block';
                document.querySelector('.error-message2').style.display = 'none';
            })
        })
    }
    
    /**
      * @function NavigationListener
      * @description Handles navigation by animating the transition of content within a wrapper when a navigation item is clicked. It hides all navigation elements and only shows the clicked navigation item. The content transition effect involves moving the wrapper off-screen before sliding it back into place with a smooth animation.
      * 
      * @async
      * @param {string} [_clicked="_navigation.home"] - The ID of the navigation element that was clicked. Defaults to `"_navigation.home"`.
      * 
      * @returns {Promise<void>} 
      * Resolves after the navigation transition has been completed and the appropriate content is displayed.
      */
    
    async NavigationListener(_clicked=`_navigation.home`) {
        let elements = Array.from(document.querySelectorAll(`[id^="_navigation"]`))
        let wrapper = document.querySelector(`.wrapper`);
        if (wrapper) {
            wrapper.style.transition = `transform 0.3s ease-in-out`;
            wrapper.style.transform = `translateX(300%)`;
            await this.library.CreateTimeout(100)
            wrapper.style.transition = `none`;
            wrapper.style.transform = `translateX(-300%)`;
            await this.library.CreateTimeout(100)
            wrapper.style.transition = `transform 0.3s ease-in-out`;
            wrapper.style.transform = `translateX(0)`;
            elements.forEach(element => { element.style.display = `none`})
            document.getElementById(_clicked).style.display = `block`
        }
        this.UpdateThread()
    }

    /**
     * @function TriggerHamburgerListener
     * @description Toggles the visibility of the sidebar menu by changing its state attribute and applying a CSS transform. 
     * The function animates the transition of the menu's position using CSS transitions for a smooth effect. ONLY FOR MOBILE DEVICES.
     * 
     * @async
     * @param {string} [_clicked="_navigation.home"] - The ID of the navigation element that was clicked. Defaults to `"_navigation.home"`.
     * 
     * @returns {Promise<void>}
     */

    async TriggerHamburgerListener(_sidebar=`.interactive-sidebar`) {
        let menu = document.querySelector(_sidebar);
        let state = menu.getAttribute(`data-state`);
        if (state == `open`) {
            menu.setAttribute(`data-state`, `closed`);
            // change menu class to <i class="fa-solid fa-arrow-left"></i>
            menu.style.transform = `translateX(-280%)`; // Keep a portion visible for clicking
            menu.style.transition = `transform 0.3s ease-in-out`;
            return;
        }
        menu.setAttribute(`data-state`, `open`);
        menu.style.transform = `translateX(0)`;
        menu.style.transition = `transform 0.3s ease-in-out`;
        return;
    }

    /**
      * @function TriggerAccountListener
      * @description Clears any existing popups and triggers the display of an account settings notification. This notification includes two action buttons: one to log out the user and one to open the password reset page in a new window. 
      * 
      * @async
      * @returns {Promise<void>} 
      * Resolves after the notification is displayed, allowing the user to interact with it.
      */

    async TriggerAccountListener() {
        this._ClearAllPopups()
        this._InjectNotification({
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
      * @function TriggerAccountListener
      * @description Clears all existing popups and triggers the display of a notification with account settings options. This notification includes two action buttons: one for logging out the user and one for opening the password reset page in a new window.
      * 
      * @async
      * @returns {Promise<void>} 
      * Resolves after the notification is injected, enabling the user to interact with it.
      */
    
    async TriggerWidgetListener() {
        this._ClearAllPopups()
        this._InjectNotification({
            title: `Widget Settings`, 
            description: `This is mostly used for testing purposes. You can use this to send a test alert or notification to the system.`,
            rows: 3,
            parent: `_body.base`, 
            buttons: [
                { name: `Spawn Alert`, className: `button-danger`, function: () => { fetch(`/api/manual`, {method: `POST`, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: document.getElementById(`widget_alert_type`).value, properties: { senderName:"Manual Admin Override", event: document.getElementById(`widget_alert_type`).value, description: "N/A", messageType: document.getElementById(`widget_alert_status`).value, expires: "N/A", indicated: document.getElementById(`widget_alert_indicator`).value, areaDesc: document.getElementById(`widget_notification_alert_location`).value, parameters: {} } }), })}},
                { name: `Submit Status`, className: `button-ok`, function: () => { fetch(`/api/status`, { method: `POST`, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: document.getElementById(`widget_notification_announcement_title`).value })})}},
                { name: `Submit Notification`, className: `button-ok`, function: () => { fetch(`/api/notification`, { method: `POST`, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: document.getElementById(`widget_notification_announcement_title`).value, message: document.getElementById(`widget_notification_announcement_subtext`).value })})}},
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
    }

    /**
      * @function ToggleDropDown
      * @description Toggles the visibility of a dropdown element. When triggered, the function either shows or hides the dropdown content, depending on its current state. It applies smooth animations to the dropdown and stats content using CSS transitions for opacity and transformation.
      * 
      * @async
      * @param {string} dropdownId - The ID of the dropdown element to rotate.
      * @param {string} statsId - The ID of the content (stats) element to show or hide.
      * @returns {Promise<void>} 
      * Resolves after the dropdown and stats have been toggled with the appropriate animations.
      */

    async ToggleDropDown(dropdownId, statsId) {
        let dropdown = document.getElementById(dropdownId);
        let stats = document.getElementById(statsId);
        if (stats.style.display === 'grid' || stats.style.display === '') {
            stats.style.transition = 'opacity 0.3s ease-in-out, max-height 0.3s ease-in-out';
            stats.style.opacity = 0;
            setTimeout(() => { stats.style.display = 'none'; }, 300);
            dropdown.style.transition = 'transform 0.3s ease-in-out';
            dropdown.style.transform = 'rotate(0deg)';
        } else {
            stats.style.display = 'grid';
            stats.style.transition = 'opacity 0.3s ease-in-out, max-height 0.3s ease-in-out';
            stats.style.opacity = 0;
            setTimeout(() => { stats.style.opacity = 1; }, 1);
            dropdown.style.transition = 'transform 0.3s ease-in-out';
            dropdown.style.transform = 'rotate(-90deg)';
        }
    }

    /**
      * @function _GetStateAbbreviation
      * @description Extracts the state abbreviation from a given location string. The function assumes the state abbreviation is located two characters after the first comma and space in the location string.
      * If the location string is undefined or does not contain a valid state abbreviation, it returns "Other".
      * 
      * @async
      * @param {string} _locations - The location string containing the state information. Expected format should include a comma followed by a space and the state abbreviation (e.g., "City, State").
      * @returns {Promise<string>} 
      * Resolves with the state abbreviation as a string, or "Other" if not found or the location is undefined.
      */

    async _GetStateAbbreviation(_locations) {
        if (_locations == undefined) { return `Other` }
        for (let i = 0; i < _locations.length; i++) {
            if (_locations[i] == ',') {
                let state = _locations.substring(i + 2, i + 4);
                return state;
            }
        }
        return `Other`
    }

    /**
      * @function _InjectDataCard
      * @description Dynamically creates a data card element and injects it into the DOM. 
      * The data card contains a title, a horizontal rule, and a description. Optionally, it can have an `onclick` event handler.
      * 
      * @async
      * @param {Object} _metadata - The metadata object containing the content and attributes for the data card.
      * @param {string} _metadata.title - The title of the data card.
      * @param {string} _metadata.content - The description/content of the data card.
      * @param {string} _metadata.parent - The ID of the parent element where the data card will be appended.
      * @param {function} [_metadata.onclick] - An optional function to be bound to the `onclick` event of the data card.
      * 
      * @returns {Promise<void>} 
      * This function doesn't return a value, it directly modifies the DOM by adding the created data card to the specified parent element.
      */

    async _InjectDataCard(_metadata) {
        let card = document.createElement('div')
        card.className = `data-card`
        let h1 = document.createElement('h1')
        h1.className = `data-card-title`
        h1.innerHTML = _metadata.title
        let hr = document.createElement('hr')
        hr.className = `general-hr`
        let p = document.createElement('p')
        p.className = `data-card-description`
        p.innerHTML = _metadata.content
        card.appendChild(h1)
        card.appendChild(hr)
        card.appendChild(p)
        document.getElementById(_metadata.parent).appendChild(card);
        if (_metadata.onclick) {
            card.onclick = _metadata.onclick.bind(this)
        }
    }

    /**
      * @function _InjectNotification
      * @description Dynamically creates and injects a notification popup into the DOM. The popup can include a title, description, input fields, select dropdowns, and buttons. It is designed to be fully customizable using the `_metadata` parameter.
      * 
      * @async
      * @param {Object} _metadata - The metadata object containing the content and attributes for the notification popup.
      * @param {string} _metadata.title - The title of the popup notification.
      * @param {string} _metadata.description - The description of the popup notification.
      * @param {string} _metadata.parent - The ID of the parent element where the popup will be appended.
      * @param {number} _metadata.rows - The number of rows for the grid layout of input fields.
      * @param {Array<Object>} [_metadata.buttons] - An optional array of button configurations for the popup.
      * @param {Array<Object>} [_metadata.inputs] - An optional array of input field configurations for the popup.
      * @param {Array<Object>} [_metadata.selects] - An optional array of select dropdown configurations for the popup.
      * 
      * @returns {Promise<void>} 
      * This function doesn't return a value, it directly modifies the DOM by adding the notification popup to the specified parent element.
      */

    async _InjectNotification(_metadata) {
        let array_buttons = _metadata.buttons
        let array_inputs = _metadata.inputs
        let array_selects = _metadata.selects
        this._ClearAllPopups()
        let popup = document.createElement('div');
        popup.className = `popup-box`;
        popup.style.display = `block`;
        popup.innerHTML = `
            <div class="popup-content">
                <button class="popup-close" onclick="this.parentElement.parentElement.remove();">&times;</button>
                <h1 id='_popup.title' class="popup-title">${_metadata.title}</h1>
                <hr class="popup-hr">
                <p id='_popup.description' class="popup-description" style="${_metadata.description.length > 500 ? 'max-height: 400px; overflow-y: auto;' : ''}">${_metadata.description}</p>
                <div class="popup-inputs" style="grid-template-columns: repeat(${_metadata.rows}, 1fr);"></div>
            </div>`;    
        let popup_content = popup.querySelector(`.popup-inputs`);
        if (array_inputs) {
            array_inputs.forEach(input => {
                let input_element = document.createElement('input');
                input_element.type = input.type || `text`;
                input_element.id = input.id;
                input_element.className = input.className || `popup-input`;
                input_element.placeholder = input.placeholder;
                input_element.value = input.value || ``;
                popup_content.appendChild(input_element);
            });
        }
        if (array_selects) {
            array_selects.forEach(select => {
                let select_element = document.createElement('select');
                select_element.id = select.id;
                select_element.className = select.className || `popup-select`;
                select.options.forEach(option => {
                    let option_element = document.createElement('option');
                    option_element.value = option.value;
                    option_element.innerHTML = option.name;
                    select_element.appendChild(option_element);
                });
                popup_content.appendChild(select_element);
            });
        }
        if (array_buttons) {
            array_buttons.forEach(button => {
                let button_element = document.createElement('button');
                button_element.className = button.className || `button-ok`;
                button_element.innerHTML = button.name;
                button_element.onclick = button.function.bind(this);
                popup_content.appendChild(button_element);
            });
        }
        document.getElementById(_metadata.parent).appendChild(popup);
    }

    /**
      * @function _ClearAllPopups
      * @description Clears (removes) all currently displayed popup boxes in the DOM.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value, it directly manipulates the DOM to remove all popups.
      */

    async _ClearAllPopups() {
        let popups = document.querySelectorAll('.popup-box')
        popups.forEach(popup => { popup.remove() })
    }

    /**
      * @function _TriggerSettingsListener
      * @description Handles the display of account-related settings and prompts the user for donations if they haven't dismissed the prompt.
      * 
      * This function updates the username display from `localStorage` and shows a donation prompt to users who have not yet dismissed it.
      * The prompt includes options for the user to either donate or decline. The user's choice is stored in `localStorage`.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It directly updates the UI based on the current state and user interaction.
      */

    async _TriggerSettingsListener(_span=`_home.accountname`) {
        document.getElementById(_span).innerHTML = localStorage.getItem('atmosx.cached.username') || `Unable to load username`
        if (localStorage.getItem('atmosx.cached.donationprompt') === null) {
            this._InjectNotification({title: `Donations are appreciated`, description: `As the sole developer of this project, your donations would greatly help in maintaining and improving this project. Contributions would allow me to dedicate more time to development, cover hosting costs (if any), and implement new features to enhance your experience.`,rows: 2,parent: `_body.base`, buttons: [ { name: `No Thank You`, className: `button-danger`, function: () => { localStorage.setItem('atmosx.cached.donationprompt', true); this._ClearAllPopups()} }, { name: `I'd like to donate!`, className: `button-ok`, function: () => { localStorage.setItem('atmosx.cached.donationprompt', true); window.open(`https://ko-fi.com/k3yomi`, `_blank`, 'width=1000,height=1000'); this._ClearAllPopups()} } ],inputs: [],selects: null})    
        }
    }

    /**
      * @function _SpawnHostingStatistics
      * @description Displays the current hosting consumption statistics in various categories such as operations, requests, memory, cpu
      * and other project statistics
      * 
      * This function retrieves the hosting consumption statistics (operations, requests, memory, and CPU) from the `storage.statistics` object and displays them on the webpage.
      * It uses the `_InjectDataCard` helper function to inject individual data cards for each statistic into the element with the ID `child_atmosx_home.hosting_stats`.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM to display hosting statistics.
      */
    
    async _SpawnHostingStatistics(_dir=`child_atmosx_home.hosting_stats`) {
        let hosting = this.storage.statistics
        let operations = hosting.operations
        let requests = hosting.requests
        let memory = hosting.memory
        let cpu = hosting.cpu
        let active = this.storage.active
        let warnings = this.storage.warnings
        let watches = this.storage.watches
        let stations = this.storage.stations
        let spotters = this.storage.spotters 
        let lightning = this.storage.lightning
        let mesoscale = this.storage.mesoscale
        let spotters_streaming = spotters.filter(spotter => spotter.streaming == 1).length
        let spotters_active = spotters.filter(spotter => spotter.active == 1).length
        let spotters_inactive = spotters.filter(spotter => spotter.active == 0).length
        let spotters_idle = spotters.filter(spotter => spotter.idle == 1).length
        let stations_operational = stations.filter(station => station.properties.rda && station.properties.rda.properties && station.properties.rda.properties.mode === `Operational`).length
        let stations_superres =  stations.filter(station => station.properties.rda && station.properties.rda.properties && station.properties.rda.properties.superResolutionStatus === `Enabled`).length

        document.getElementById(_dir).innerHTML = ``
        this._InjectDataCard({ title: `Global`,content: `<center>${operations}</center>`,parent: _dir})
        this._InjectDataCard({ title: `Local`,content: `<center>${requests}</center>`,parent: _dir})
        this._InjectDataCard({ title: `Memory`,content: `<center>${memory}</center>`,parent: _dir})
        this._InjectDataCard({ title: `CPU`,content: `<center>${cpu}</center>`,parent: _dir})
        this._InjectDataCard({ title: `Total Alerts`,content: `<center>${active.length}</center>`,parent: _dir})
        this._InjectDataCard({ title: `Total Warnings`,content: `<center>${warnings.length}</center>`,parent: _dir})
        this._InjectDataCard({ title: `Total Watches`,content: `<center>${watches.length}</center>`,parent: _dir})
        this._InjectDataCard({ title: `Total Stations`,content: `<center>${stations.length}</center>`,parent: _dir})
        this._InjectDataCard({ title: `Stations Operational`,content: `<center>${stations_operational}</center>`,parent: _dir})
        this._InjectDataCard({ title: `Stations SuperRes`,content: `<center>${stations_superres}</center>`,parent: _dir})
        this._InjectDataCard({ title: `Total Spotters`,content: `<center>${spotters.length}</center>`,parent: _dir})
        this._InjectDataCard({ title: `Spotters Active`, content: `<center>${spotters_active}</center>`, parent: _dir})
        this._InjectDataCard({ title: `Spotters Streaming`, content: `<center>${spotters_streaming}</center>`, parent: _dir})
        this._InjectDataCard({ title: `Spotters Idle`, content: `<center>${spotters_idle}</center>`, parent: _dir})
        this._InjectDataCard({ title: `Spotters Inactive`, content: `<center>${spotters_inactive}</center>`, parent: _dir})
        this._InjectDataCard({ title: `Total Lightning`,content: `<center>${lightning.length}</center>`,parent: _dir})
        this._InjectDataCard({ title: `Total Dicussions`,content: `<center>${mesoscale.length}</center>`,parent: _dir})
    }
    
    /**
      * @function _SpawnRecentAlerts
      * @description Retrieves the 6 most recent active alerts, sorts them by their issue date in descending order, and displays them in a section on the webpage. If there are fewer than 6 active alerts, it will show placeholders for the missing alerts.
      * 
      * This function processes the `active` alerts stored in `storage`, sorts them by their issued date, and injects each alert's relevant information (title, status, location, issued date, expiration, wind speed, hail size, tornado threat, sender, and a link) into the page using the `_InjectDataCard` function.
      * 
      * Additionally, each alert card is clickable and opens a simple alert dialog with detailed information about the selected alert.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM to display recent alert data.
      */

    async _SpawnRecentAlerts(_dir=`child_atmosx_alerts.recent_alerts`) {
        document.getElementById(_dir).innerHTML = ``
        let alerts = this.storage.active 
        alerts.sort((a, b) => new Date(b.details.issued) - new Date(a.details.issued))
        for (let i = 0; i < 6; i++) {
            let alert = alerts[i];
            if (alert == undefined) {
                this._InjectDataCard({ title: `Awaiting Alert....`,content: `<center>No Alert Information Available</center>`,parent: _dir})
                continue
            }
            let title = alert.details.name;
            let status = alert.details.type;
            let location = alert.details.locations.substring(0, 55);
            let issued = alert.details.issued;
            let expires = alert.details.expires;
            let wind = alert.details.wind;
            let hail = alert.details.hail;
            let dmg = alert.details.thunderstorm;
            let tornado = alert.details.tornado;
            let tag = JSON.stringify(alert.details.tag).replace(/\"/g, ``).replace(/,/g, `, `).replace(/\[/g, ``).replace(/\]/g, ``);
            let sender = alert.details.sender;
            let id = alert.raw.tracking == undefined ? `N/A` : alert.raw.tracking;
            let description = alert.details.description
            let history = alert.raw.history == undefined ? [] : alert.raw.history
            let time = await library.GetTimeInformation(expires);
            let unix = time.unix
            let mytime = new Date(unix * 1000)
            let now = new Date()
            let seconds = Math.floor((mytime - now) / 1000);
            let minutes = Math.floor(seconds / 60);
            let hours = Math.floor(minutes / 60);
            seconds = seconds % 60;
            minutes = minutes % 60;
            if (!hail.includes(`IN`) && hail != `N/A`) { hail += ` IN`}
            if (!wind.includes(`MPH`) && wind != `N/A`) { wind += ` MPH`}
            let t_string = `Expires in: ${hours} hours ${minutes} minutes ${seconds} seconds`
            if (hours < 0) { t_string = `Expires in: Now`}
            if (hours > 9999) { t_string = `Expires in: Until Further Notice`}
            this._InjectDataCard({
                title: `${title} (${status})`,
                content: `Location: ${location}<br>Issued: ${issued}<br>${t_string}<br>Wind Gust: ${wind} <br>Hail: ${hail}<br>Damage Threat: ${dmg}<br>Tornado: ${tornado}<br>Tag: ${tag}<br>Sender: ${sender}<br>Tracking ID: ${id}`,
                parent: _dir,
                onclick: () => {
                    let description_history = ``
                    for (let i = 0; i < history.length; i++) {
                        let segment = history[i]
                        description_history += `\n\n==================== ${segment.act} ====================\n\n${segment.desc}`;
                    }
                    if (description_history == ``) { description_history = description }
                    this._InjectNotification({ title: `${title} (${status})`,  description: description_history.replace(/\n/g, `<br>`), rows: 2,  parent: `_body.base`,  buttons: [ { name: `Close`, className: `button-danger`, function: () => { this._ClearAllPopups(); } }, { name: `Copy to Clipboard`, className: `button-ok`, function: () => { navigator.clipboard.writeText(description_history); } }, ]});    
                }
            });
        }
    }

    /**
      * @function _SpawnAlertsIndex
      * @description Retrieves and displays the active alerts from the `storage.active` array. If there are no alerts, it shows a message indicating that 
      * no alert information is available. The alerts are displayed as cards with relevant details such as event name, status, location, issued/expires times, 
      * wind speed, hail size, tornado threat, sender, and tracking ID.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM to display regional alert data.
      */

    async _SpawnAlertsIndex(_dir=`child_atmosx_alerts.global_alerts`, _search=`_alerts.alert_search`, _keyword=``) {
        if (document.getElementById(_search).value !== `` && _keyword == ``) { return }
        let alerts = this.storage.active
        document.getElementById(_dir).innerHTML = ``
        document.getElementById(_search).placeholder = `Search by location, event name, description, tracking id, status, or properties (x${alerts.length})`
        document.getElementById(_dir).style.gridTemplateColumns = 'repeat(3, 1fr)';
        if (alerts.length == 0) {
            document.getElementById(_dir).style.gridTemplateColumns = 'repeat(1, 1fr)';
            this._InjectDataCard({ title: `Awaiting Alert....`,content: `<center>No Alert Information Available</center>`,parent: _dir})
            return
        }
        alerts.sort((a, b) => new Date(b.details.issued) - new Date(a.details.issued))
        for (let i = 0; i < alerts.length; i++) {
            let alert = alerts[i];
            let title = alert.details.name;
            let status = alert.details.type;
            let location = alert.details.locations.substring(0, 55);
            let issued = alert.details.issued;
            let expires = alert.details.expires;
            let wind = alert.details.wind;
            let hail = alert.details.hail;
            let dmg = alert.details.thunderstorm;
            let tornado = alert.details.tornado;
            let sender = alert.details.sender;
            let tag = JSON.stringify(alert.details.tag).replace(/\"/g, ``).replace(/,/g, `, `).replace(/\[/g, ``).replace(/\]/g, ``);
            let id = alert.raw.tracking == undefined ? `N/A` : alert.raw.tracking;
            let description = alert.details.description
            let history = alert.raw.history == undefined ? [] : alert.raw.history
            let time = await library.GetTimeInformation(expires);
            let unix = time.unix
            let mytime = new Date(unix * 1000)
            let now = new Date()
            let seconds = Math.floor((mytime - now) / 1000);
            let minutes = Math.floor(seconds / 60);
            let hours = Math.floor(minutes / 60);
            seconds = seconds % 60;
            minutes = minutes % 60;

            if (!hail.includes(`IN`) && hail != `N/A`) { hail += ` IN`}
            if (!wind.includes(`MPH`) && wind != `N/A`) { wind += ` MPH`}

            let t_string = `Expires in: ${hours} hours ${minutes} minutes ${seconds} seconds`
            if (hours < 0) { t_string = `Expires in: Now`}
            if (hours > 9999) { t_string = `Expires in: Until Further Notice`}
            if (JSON.stringify(alert.details).toLowerCase().includes(_keyword.toLowerCase()) == false) { continue }
            this._InjectDataCard({
                title: `${title} (${status})`,
                content: `Location: ${location}<br>Issued: ${issued}<br>${t_string}<br>Wind Gust: ${wind} <br>Hail: ${hail} <br>Damage Threat: ${dmg}<br>Tornado: ${tornado}<br>Tag: ${tag}<br>Sender: ${sender}<br>Tracking ID: ${id}`,
                parent: _dir,
                onclick: () => {
                    let description_history = ``
                    for (let i = 0; i < history.length; i++) {
                        let segment = history[i]
                        description_history += `\n\n==================== ${segment.act} ====================\n\n${segment.desc}`;
                    }
                    if (description_history == ``) { description_history = description }
                    this._InjectNotification({ title: `${title} (${status})`,  description: description_history.replace(/\n/g, `<br>`), rows: 2,  parent: `_body.base`,  buttons: [ { name: `Close`, className: `button-danger`, function: () => { this._ClearAllPopups(); } }, { name: `Copy to Clipboard`, className: `button-ok`, function: () => { navigator.clipboard.writeText(description_history); } }, ]});    
                }
            });
        }
        
    }

    /**
      * @function _SpawnStormReports
      * @description Retrieves and displays the latest storm reports from the `storage.reports` array. If there are no reports, it shows a message indicating that no storm reports are available. The reports are displayed as cards with relevant details such as event name, location, issued/expires times, and a description.
      * 
      * The reports are sorted by the issued time (most recent first) and displayed in a section of the webpage. Each report card has a click handler that opens an alert showing more detailed information about the storm report.
      * 
      * @async
      * @param {string} _dir - The ID of the parent element where the storm report cards will be injected.
      * @param {string} _search - The ID of the search input element to update with the number of reports.
      * @param {string} [_keyword] - An optional keyword to filter the storm reports based on the event name or description.
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM to display storm report data.
      */

    async _SpawnStormReports(_dir=`child_atmosx_lsr.reports`, _search=`_lsr.reports_search`, _keyword=``) {
        let reports = this.storage.reports 
        if (document.getElementById(_search).value !== `` && _keyword == ``) { return }
        document.getElementById(_dir).innerHTML = ``
        document.getElementById(_dir).style.gridTemplateColumns = 'repeat(3, 1fr)';
        document.getElementById(_search).placeholder = `Search by report location or event name (x${reports.length})`
        if (reports.length == 0) { 
            document.getElementById(_dir).style.gridTemplateColumns = 'repeat(1, 1fr)';
            this._InjectDataCard({ title: `Awaiting Storm Reports...`,content: `<center>No Storm Report Information Available</center>`,parent: _dir})
            return
        }
        reports.sort((a, b) => new Date(b.details.issued) - new Date(a.details.issued))
        for (let i = 0; i < reports.length; i++) {
            if (reports[i] == undefined) { continue }
            let details = reports[i].details.description
            let expires = reports[i].details.expires
            let issued = reports[i].details.issued
            let locations = reports[i].details.locations
            let event = reports[i].details.name 
            let sender = reports[i].details.sender
            if (JSON.stringify(reports[i]).toLowerCase().includes(_keyword.toLowerCase()) == false) { continue }
            this._InjectDataCard({ title: `${event}`, content: `Location: ${locations}<br>Issued: ${issued}<br>Expires: ${expires}<br>Details: ${details}<br>Sender: ${sender}`, parent: _dir, onclick: () => {} });
        }
    }

    /**
      * @function _SpawnLightningReports
      * @description Retrieves and displays the latest lightning reports from the `storage.lightning` array. If there are no reports, it shows a message indicating that no lightning reports are available. Each lightning report is displayed as a card with its respective location (latitude and longitude).
      * 
      * The lightning reports are displayed in a section of the webpage. Each report card has a click handler that opens an alert showing more detailed information about the lightning report's location.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM to display lightning report data.
      */

    async _SpawnLightningReports(_dir=`child_atmosx_lightning.reports`) {
        let lightning = this.storage.lightning
        document.getElementById(_dir).innerHTML = ``
        document.getElementById(_dir).style.gridTemplateColumns = 'repeat(3, 1fr)';
        if (lightning.length == 0) { 
            document.getElementById(_dir).style.gridTemplateColumns = 'repeat(1, 1fr)';
            this._InjectDataCard({ title: `Awaiting Lightning Reports...`,content: `<center>No Lightning Report Information Available</center>`,parent: _dir})
            return
        }
        for (let i = 0; i < lightning.length; i++) {
            let lat = lightning[i].lat
            let lon = lightning[i].lon
            this._InjectDataCard({
                title: `Lightning Report #${i + 1}`,
                content: `Location: ${lat}, ${lon}`,
                parent: `child_atmosx_lightning.reports`,
                onclick: () => {}
            });
        }
    }

    /**
      * @function _SpawnMesoscaleDiscussions
      * @description Retrieves and displays mesoscale discussions from the `storage.mesoscale` array. If there are no discussions, it shows a message indicating that no mesoscale discussions are available. Each discussion is displayed as a card with its respective content.
      * 
      * The mesoscale discussions are displayed in a section of the webpage. Each discussion card has a click handler that opens an alert showing more detailed information about the mesoscale discussion.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM to display mesoscale discussion data.
      */

    async _SpawnMesoscaleDiscussions(_dir=`child_atmosx_discussions.mesoscale`) {
        document.getElementById(_dir).innerHTML = ``
        let mesoscale = this.storage.mesoscale
        if (mesoscale.length == 0) {
            this._InjectDataCard({ title: `Awaiting Mesoscale Discussions...`,content: `<center>No Mesoscale Discussion Information Available</center>`,parent: _dir})
            return
        }
        for (let i = 0; i < mesoscale.length; i++) {
            let discussion = mesoscale[i]
            this._InjectDataCard({
                title: `Mesoscale Discussion #${i + 1}`,
                content: discussion,
                parent: _dir,
                onclick: () => {
                    this._InjectNotification({ title: `Mesoscale Discussion #${i + 1}`, description: discussion, rows: 2, parent: `_body.base`, buttons: [{ name: `Close`, className: `button-danger`, function: () => { this._ClearAllPopups(); } }, { name: `Copy to Clipboard`, className: `button-ok`, function: () => { navigator.clipboard.writeText(wire[i].message); } }]}); 
                }
            });
        }
    }

    /**
      * @function _SpawnStormPredictionCenterModels
      * @description Retrieves and displays storm prediction center models from `storage.configurations.spc_outlooks`. For each model, it displays an image of the outlook and its title. Each outlook is displayed as a card in the webpage with an image and title.
      * 
      * This function iterates through all the storm prediction center outlooks stored in `storage.configurations.spc_outlooks`, creating a data card for each model. The card includes the title of the model and the image associated with it. Each card is clickable, though currently the `onclick` handler does nothing.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM to display storm prediction center models.
      */

    async _SpawnStormPredictionCenterModels(_dir=`hub_spc.models`) {
        document.getElementById(_dir).innerHTML = ``
        let outlooks = this.storage.configurations.spc_outlooks
        for (let i = 0; i < outlooks.length; i++) {
            let outlook = outlooks[i]
            let title = outlook.title
            let img = outlook.source
            this._InjectDataCard({
                title: `${title}`,
                content: `<img src="${img}" alt="${title}" style="width: 100%; height: auto;">`,
                parent: _dir,
                onclick: () => {}
            });
        }
    }

    /**
      * @function _SpawnSpotterNetwork
      * @description Displays information about the spotter network including active, inactive, streaming, and idle spotters. For each spotter, a data card is created containing the spotter's location and description. The description is parsed to create clickable links if URLs are present.
      * 
      * The function retrieves spotter data from `this.storage.spotters` and categorizes them into four groups based on their status:
      * 1. **Streaming** spotters
      * 2. **Active** spotters
      * 3. **Idle** spotters
      * 4. **Inactive** spotters
      * 
      * For each spotter, a data card is created with the title "Spotter #x" (where x is the spotter's index), displaying their location (latitude and longitude), and their description. If the description contains URLs, they are converted into clickable links.
      * 
      * The cards are added to the respective parent categories: `streaming`, `active`, `idle`, or `inactive`.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM by creating and appending data cards based on spotter network data.
      */

    async _SpawnSpotterNetwork(_dir=`child_atmosx_spotternetwork.general`, _search=`_spotternetwork.spotter_search`, _keyword=``) {
        let spotters = this.storage.spotters
        if (document.getElementById(_search).value !== `` && _keyword == ``) { return }
        document.getElementById(_dir).innerHTML = ``
        document.getElementById(_dir).style.gridTemplateColumns = 'repeat(3, 1fr)';
        document.getElementById(_search).placeholder = `Search by spotter description (x${spotters.length})`
        if (spotters.length == 0) {
            document.getElementById(_dir).style.gridTemplateColumns = 'repeat(1, 1fr)';
            this._InjectDataCard({ title: `Awaiting Spotter Network...`,content: `<center>No Spotter Network Information Available<br>Are you sure you enabled it in the configurations?</center>`,parent: _dir})
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
            let is_active = spotters[i].active
            let is_idle = spotters[i].idle
            let is_streaming = spotters[i].streaming
            let indicator = indicators.inactive
            if (is_active == 1) { indicator = indicators.active }
            if (is_idle == 1) { indicator = indicators.idle }
            if (is_streaming == 1) { indicator = indicators.streaming }
            if (description.toLowerCase().includes(_keyword.toLowerCase()) == false) { continue }
            this._InjectDataCard({
                title: `${indicator} Spotter #${i + 1}`,
                content: `Location: ${lat}, ${lon}<br>Description: ${description}`,
                parent: _dir,
                onclick: () => {}
            });
        }
    }

    /**
      * @function _SpawnExternalLinks
      * @description Displays external third-party service links in the user interface by dynamically creating data cards for each service. Each card contains an image (if provided) and opens the associated URL when clicked.
      * 
      * The function retrieves the list of external services from `this.storage.configurations.third_party_services`. For each service, a data card is created that displays the service's title and image. When the user clicks on a service card, a new tab is opened with the service's URL.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM by creating and appending data cards for each third-party service.
      */
    
    async _SpawnExternalLinks(_dir=`hub_external.services`) {
        document.getElementById(_dir).innerHTML = ``
        let services = this.storage.configurations.third_party_services
        for (let i = 0; i < services.length; i++) {
            let service = services[i]
            let title = service.title
            let img = service.image
            let url = service.url
            this._InjectDataCard({
                title: `${title}`,
                content: `<img src="${img}" class="spcial-image" alt="${title}" style="width: 100%; height: auto;">`,
                parent: _dir,
                onclick: () => {
                    window.open(url, '_blank', 'width=1000,height=1000')
                }
            });
        }
    }

    /**
      * @function _SpawnWireCache
      * @description Displays NOAA Weather Wire Service reports in the user interface. Each report is displayed in a data card, and clicking the card shows the detailed message in an alert box.
      * 
      * The function retrieves the list of reports from `this.storage.wire` and for each report, creates a data card displaying the message. When clicked, the message is shown in a browser alert box.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM by creating and appending data cards for each NOAA Weather Wire Service report.
      */

    async _SpawnWireCache(_dir=`child_atmosx_nwws.reports`) {
        document.getElementById(_dir).innerHTML = ``
        let wire = this.storage.wire 
        if (wire.length == 0) {
            this._InjectDataCard({ title: `Awaiting NOAA Weather Wire Service...`,content: `<center>No NOAA Weather Wire Service Information Available<br>Do you have valid credentials and did you enable it?</center>`,parent: _dir})
        }
        wire.reverse()
        for (let i = 0; i < wire.length; i++) {
            let message = wire[i].message.replace(/\n/g, '<br>')
            let issued = await this.library.GetTimeInformation(wire[i].issued)
            this._InjectDataCard({
                title: `NOAA Weather Wire Service #${i + 1} - ${issued.time}`,
                content: message.substring(0, 500) + `...`,
                parent: _dir,
                onclick: () => {
                    this._InjectNotification({
                        title: `NOAA Weather Wire Service #${i + 1} - ${issued.time}`, 
                        description: message, rows: 2,parent: `_body.base`,
                        buttons: [
                            { name: `Close`, className: `button-danger`, function: () => { this._ClearAllPopups(); } },
                            { name: `Copy to Clipboard`, className: `button-ok`, function: () => { navigator.clipboard.writeText(wire[i].message); } 
                        }
                    ]});    
                }
            });
        }
    }

    /**
      * @function _SpawnGeneralSetupHub
      * @description Displays a setup hub for general configurations, including downloading templates, plugins, and links to community resources.
      * 
      * @async
      * @param {string} _dir - The ID of the parent element where the setup hub cards will be injected.
      * @param {string} _dir2 - The ID of the parent element for additional setup cards.
      */

    async _SpawnGeneralSetupHub(_dir=`hub.plugins`) {
        document.getElementById(_dir).innerHTML = ``
        let url = window.location.hostname || 'localhost'; // Default to localhost if no hostname is specified
        let port = window.location.port || '80'; // Default to 80 if no port is specified
        let protocol = window.location.protocol || 'http'; // Default to http if no protocol is specified     
        this._InjectDataCard({
            title: `Download Latest Template`,
            content: `<button class="button-ok" style="width: 100%; margin-top: 5px;">Download</button>`,
            parent: _dir,
            onclick: () => {
                this._InjectNotification({
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
                        { id: `_obs_replace`, className: `popup-input`, placeholder: `${protocol}//${url}:${port}/`, value: `${protocol}//${url}:${port}/` },
                    ]
                })
                
            }
        });
        this._InjectDataCard({
            title: `Public Community Theme`,
            content: `<button class="button-ok" style="width: 100%; margin-top: 5px;" onclick="window.open('https://github.com/K3YOMI/AtmosphericX/discussions/29', '_blank', 'width=1000,height=1000')">Community Theme</button><br><small>Put the endpoint you used to connect to the dashboard, this will automatically setup your template for you.</small>`,
            parent: _dir,
            onclick: () => {}
        });

        this._InjectDataCard({
            title: `Download Source Clone Plugin`,
            content: `<button class="button-ok" style="width: 100%; margin-top: 5px;" onclick="window.open('https://obsproject.com/forum/resources/source-clone.1632/', '_blank', 'width=1000,height=1000');">Download</button><br><small>Source Clone is a plugin for OBS Studio that allows you to create multiple instances of a source, which can be useful for creating complex scenes or overlays.</small>`,
            parent: _dir,
            onclick: () => {}
        });
        this._InjectDataCard({
            title: `Download Composite Blur Plugin`,
            content: `<button class="button-ok" style="width: 100%; margin-top: 5px;" onclick="window.open('https://obsproject.com/forum/resources/composite-blur.1780/', '_blank', 'width=1000,height=1000');">Download</button><br><small>Composite Blur is a plugin for OBS Studio that allows you to apply a blur effect to specific areas of your scene. This can be useful for hiding sensitive information or creating a more polished look for your stream.</small>`,
            parent: _dir,
            onclick: () => {}
        });
        this._InjectDataCard({
            title: `Submit an Issue/PR Request`,
            content: `<button class="button-ok" style="width: 100%; margin-top: 5px;" onclick="window.open('https://github.com/K3YOMI/AtmosphericX/issues/', '_blank', 'width=1000,height=1000');">Create Issue</button><br><br><button class="button-ok" style="width: 100%; margin-top: 5px;" onclick="window.open('https://github.com/K3YOMI/AtmosphericX/pulls', '_blank', 'width=1000,height=1000');">Create PR</button><br><small>If you have any issues to fix or changes you would like to see in the project, please submit a PR request. This will help me track changes and improve the project.</small>`,
            parent: _dir,
            onclick: () => {}
        });

        this._InjectDataCard({
            title: `Join our community`,
            content: `<button class="button-ok" style="width: 100%; margin-top: 5px;" onclick="window.open('https://discord.gg/B8nKmhYMfz', '_blank', 'width=1000,height=1000');">Submit</button><br><small>Want to join our community? Join our Discord server and get help from other users. You can also submit a PR request if you have any changes you would like to see in the project.</small>`,
            parent: _dir,
            onclick: () => {}
        });
    }

    /**
      * @function UpdateThread
      * @description Updates various sections of the dashboard by calling specific 
      * functions to refresh data and display it in the user interface.
      * 
      * @async
      * @returns {Promise<void>} This function does not return any value. It manipulates the DOM to update various sections of the dashboard.
      */

    async UpdateThread() {
        await this._SpawnHostingStatistics()
        await this._TriggerSettingsListener()
        await this._SpawnStormReports()
        await this._SpawnLightningReports()
        await this._SpawnMesoscaleDiscussions()
        await this._SpawnSpotterNetwork()
        await this._SpawnWireCache()
        await this._SpawnRecentAlerts()
        await this._SpawnAlertsIndex()
        let elements = document.querySelectorAll(`[id^="child_atmosx_"]`)
        for (let i = 0; i < elements.length; i++) {
            let doc = elements[i]
            if (doc == undefined) { continue }
            if (doc.parentElement == undefined) { continue }
            if ((doc.parentElement).parentElement.parentElement.style.display == `none`) {
                doc.innerHTML = ``; 
                continue;
            }
        }
    }
}