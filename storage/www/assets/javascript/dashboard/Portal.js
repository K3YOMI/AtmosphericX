

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


class DashboardPortal { 
    constructor(library, setType=false) {
        this.library = library
        this.storage = this.library.storage
        this.name = `DashboardPortal`
        this.library.createOutput(`${this.name} Initialization`, `Successfully initialized ${this.name} module`)
        this.addFormListener(`login-form`, setType)
    }

    /**
      * @function createMessage
      * @description Creates a message element in the DOM to display success or error messages.
      * @param {string} type - The type of message to create, either `success` or `error`.
      * @param {string} message - The message to display.
      */ 

    createMessage = function(type, message) {
        let messageTypes = ['success', 'error'];
        messageTypes.forEach(msgType => {
            let messageElement = document.querySelector(`.${msgType}-message`);
            if (messageElement) {
                messageElement.style.display = msgType === type ? `block` : `none`;
                if (msgType === type) {
                    messageElement.innerHTML = message;
                }
            }
        });
    }

    /**
      * @function handleResponse
      * @description Handles the response from the server after a login, registration, or password reset request.
      * It checks if the response is successful, creates a success message, and redirects the user.
      * 
      * @param {Response} response - The response object from the fetch request.
      * @param {Object} jsonData - The JSON data returned from the server.
      * @param {string} [username=null] - The username of the user, used for caching. Defaults to `null`.
      * @param {number} [action=0] - The action performed, where 0 is login, 1 is reset, and 2 is register. Defaults to 0.
      */

    handleResponse = function(response, jsonData, username = null, action = 0) {
        if (response.ok) {
            this.createMessage(`success`, jsonData.message || `Success! Redirecting...`);
            if (action === 0 || action === 2) {
                localStorage.setItem(`atmosx.cached.username`, username || `Guest`);
                localStorage.setItem(`atmosx.cached.role`, jsonData.role);
                document.cookie = `sessionFallback=${jsonData.session}; path=/; SameSite=Lax;`;
            }
            setTimeout(() => { window.location.replace(`/`) }, 1000);
        } else {
            this.createMessage(`error`, jsonData.message || `An error occurred. Please try again.`);
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

    addFormListener(domId = `login-form`, action = 0) {
        let form = document.getElementById(domId);
        if (!form) return console.error(`Form "${domId}" not found.`);
        form.addEventListener(`submit`, async (event) => {
            event.preventDefault();
            let username = document.getElementById(`username`)?.value;
            let password = document.getElementById(`password`)?.value;
            if (!username || !password) return this.createMessage(`error`, `Missing fields.`);
            let requestBody = { username, password: CryptoJS.SHA256(password).toString() };
            let endpoint = action === 1 ? `/api/reset` : action === 2 ? `/api/register` : `/api/login`;
            if (action === 1) {
                let newPassword = document.getElementById(`new-password`)?.value;
                if (!newPassword) return this.createMessage(`error`, `Missing new password.`);
                requestBody.new_password = CryptoJS.SHA256(newPassword).toString();
            }
            try {
                let response = await fetch(endpoint, { method: `POST`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify(requestBody), });
                this.handleResponse(response, await response.json(), username, action);
            } catch {
                this.createMessage(`error`, `Request failed. Try again.`);
            }
        });
        if (action === 0) {
            document.getElementById('login-guest')?.addEventListener('click', async (e) => {
                e.preventDefault();
                let response = await fetch(`/api/login-guest`, { method: `POST`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify({}), });
                let jsonData = await response.json();
                if (response.ok) {
                    localStorage.setItem(`atmosx.cached.username`, `Guest`);
                    localStorage.setItem(`atmosx.cached.role`, jsonData.role);
                    document.cookie = `sessionFallback=${jsonData.session}; path=/; SameSite=Lax;`;
                    window.location.replace(`/`);
                } else {
                    this.createMessage(`error`, jsonData.message || `An error occurred. Please try again.`);
                }
            }) 
        }
    }
}