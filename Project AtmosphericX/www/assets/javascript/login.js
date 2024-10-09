
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


let login = {}
login.init = function() {
    console.log(`[Project AtmosphericX] [${new Date().toLocaleString()}] :..: Loaded Login Functions`)
}
login.login = function() { 
    document.getElementById(`login-form`).addEventListener('submit', function(event) {
        event.preventDefault();
        let username = document.getElementById(`username`).value;
        let password = document.getElementById(`password`).value;
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
                    window.location.replace(`/dashboard`);
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
login.register = function() {
    document.getElementById(`login-form`).addEventListener('submit', function(event) {
        event.preventDefault();
        let username = document.getElementById(`username`).value;
        let password = document.getElementById(`password`).value;
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
                    setTimeout(() => { window.location.replace(`/`) }, 2000);
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
login.reset = function() {
    document.getElementById(`login-form`).addEventListener('submit', function(event) {
        event.preventDefault();
        let username = document.getElementById(`username`).value;
        let password = document.getElementById(`password`).value;
        let newPassword = document.getElementById(`new-password`).value;
        fetch(`/api/reset`, {
            method: `POST`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password, newpassword: newPassword})    
        }).then(response => { 
            if (response.ok) {
                response.json().then(data => {
                    document.querySelector('.error-message2').innerHTML = data.message;
                    document.querySelector('.error-message2').style.display = 'block';
                    document.querySelector('.error-message').style.display = 'none';
                    setTimeout(() => { window.location.replace(`/`) }, 2000);
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