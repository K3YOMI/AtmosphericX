




<h1 style='font-size: 65px'; align="center">🌩️ Project AtmosphericX 🌪️</h1>

<div align="center">
  	<p align = "center">AtmosphericX is a web application that uses the National Weather Service API to provide near real-time weather alerts and outlooks. The application can be used by storm chasers, emergency management, or the general public to stay informed about severe weather or special alerts. Please note that this application is still in development and may not be fully functional. Also please note that information provided by this application should not be used as the sole source of information for severe weather events. Always refer to the National Weather Service for the most accurate and up-to-date information or your NOAA Weather Radio. I do not claim responsibility for any damages that may occur as a result of using this application. </p>
  	<p align = "center">Documentation written by @k3yomi</p>
	<div align="center" style="border: none;">
		<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/K3YOMI/AtmosphericX">
		<img alt="GitHub forks" src="https://img.shields.io/github/forks/K3YOMI/AtmosphericX">
		<img alt="GitHub issues" src="https://img.shields.io/github/issues/K3YOMI/AtmosphericX">
		<img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/K3YOMI/AtmosphericX">
	</div>
</div>

# ⛈️ Table of Contents
- [Features](#doc_features)
- [Install Guide](#doc_install)
- [Cloning Project](#doc_clone)
- [Configuration Guide](#doc_configure)
- [Post Configuration](#doc_post)
- [Dashboard Setup](#doc_dashboard)
- [Registration Documentation](#doc_accountcreation)
- [Endpoint Documentation](#doc_endoints)
- [Credits and Packages](#doc_credits)



# 🌪️ Support Features <a name="doc_features"></a>
- [x] Support up to ≈130 unique alerts
	- Tornado Alerts (Watches/Radar Indicated/Confirmed/PDS/Emergencies)
	- Severe Thunderstorm Alerts (Watches/Considerable/Destructive)
	- Flash Floods (Watches/Warnings/Emergencies)
	- Special Marine Warnings
	- Snow Squall Warnings
	- Much much more (Customizable)
- [x] Full dashboard
	- Login Page
		- Account Creation
		- Password Change Support
		- SHA256 Encryption (users.json)
	- Active Alerts & General Information
		- Active Alerts, Warnings, and Watches
		- Previous 3 Alerts (w/ interactable)
		- Region Alerts
	- External Services and Tools
		- Live Storm Chasing Cam Service (https://livestormchasing.com)
		- Hourly Mesoscale Analysis (https://www.spc.noaa.gov)
		- NexLab (https://weather.cod.edu/#)
		- GFS Model (https://www.tropicaltidbits.com/analysis/models/)
		- HRRR Model (https://www.tropicaltidbits.com/analysis/models/?model=hrrr)
		- Hodographs (https://www.pivotalweather.com/model.php?p=sbcape_hodo&fh=3)
	- SPC Day Risks and Outlooks (0600 and 1200)
		- Categorial (Days: 1, 2, and 3)
		- Tornado Risk (Days: 1 and 2)
		- Hail Risk (Days: 1 and 2)
		- Wind Risk (Days: 1 and 2)
	- Query/Notification Information
		- Force Request
		- Notification Settings
		- Debug Alerts
	- County Based Alerts
		- Red Warning Box (Previous 3 Alerts)
		- Audio Support
		- Notificiation Support
	- Logout Page
	- IP Whitelisting
- [x] Portable (Supports audio and active warnings)
- [x] Mobile Phone Audio Support
	- Requires at least once interaction
- [x] Full configuration support
- [x] Synced Alerts
- [x] SSL Certification Support


# 🌧️ Install Guide <a name="doc_install"></a>
To install Project AtmosphericX, you will need a few requirements. NodeJS / NPM and Git (optional)
If you are not wanting to install git, you can also clone the repository by downloading it as a ZIP. If you do not know how to install any of the requirements, feel free to refer to their documentation.

# 🌪 Cloning the project with Git <a name="doc_clone"></a>
once finished install git, clone the project with the command below (terminal/command prompt)

	git clone https://github.com/k3yomi/AtmosphericX

After cloning, navigate to the **AtmosphericX** directory. Inside, you'll find another directory titled **Project AtmosphericX**. This holds the main project itself. For better ease of access, feel free to drop the **Project AtmosphericX** directory into somewhere you'll remember.

# 🌩️ Configuration <a name="doc_configure"></a>
Configurating AtmosphericX is quite simple, the **configurations.json** holds all the configurations. Here is a general template below of the configuration and what each configuration does. 

**DO NOT COPY THE CONFIG AS THIS IS NOT A WORKING CONFIG**
```json


{
    "HOSTNAME": "0.0.0.0",
    "HTTPS": true,
    "SSL_PORT": 3011,
    "PORT": 3010,
    "API_ACCESS": ["*"],
    "SSL_CERT_PATHS": {
        "key": "./cert/your_key_here.key",
        "cert": "./cert/your_cert_here.crt"
    },

    "YOUR_LOCATION": "COUNTY, ST",
    "USER_AGENT": "AtmosphericX-4.5.0",

    "ACTIVE_ONLY": true,
    "REFRESH_RATE": 30,
    "QUERY_RATE": 10,
    "OUTBREAK_ONLY": true,
    "MAJOR_ALERTS": [],
    "ALL_ALERTS": [],

    "BEEP_ONLY": false,
    "ALLOW_UPDATES": false,
    "EXCLUDED_EVENTS": [],
    "DEFINED_SOUNDS": {},
    "DEFINED_BANNERS": {},
    "DEFINED_WARNINGS": {}
}

```


# ⛈️ Post Configuration <a name="doc_post"></a>
Once you have configured your **configurations.json** file. You are now ready to install dependencies in AtmosphericX! To simply install, you will need to run the command down below.

	npm install

After completing the install process, you can now run AtmosphericX! 

	node index.js

If you encounter an error regarding a **missing dependency**, you have two options to resolve it. You can manually run npm install for the specified dependency.

	npm install {package_name}



# 🌧️ Dashboard Setup <a name="doc_dashboard"></a>
To access the dashboard, which can be found at {ip}:{port} (e.g., http://192.168.1.92:3000), you will need to login. If you are unable to see the dashboard, ensure that the NodeJS web server is up and running. Additionally, verify that your IP address has been granted API access. If required, confirm that the wildcard (*) has been applied to API_ACCESS to allow access from all addresses.


    Username: root
    Password: root


Ensuring the security of your webserver is of importance. It's vital to promptly change this default password. To do so, simply navigate back to the login screen and select the "Change password?" option. It's worth noting that access to AtmosphericX's API and streaming functionalities remains open to all users, even those without login credentials, unless specific address configurations have been applied to the API_ACCESS setting in the environment file.


# 🌧️ Account Creation <a name="doc_accountcreation"></a>
If a user wants to register a new username and password, the host must activate the account via the users.json file. Below is an example of how the users.json file might be structured. To activate an account, simply switch false to true on the account you would like to activate.


```json
{
    "username": "root",
    "hash": "SBNJTRN+FjG7owHVrKtue7eqdM4RhdRWVl71HXN2d7I=",
    "activated": true
  },
  {
    "username": "test",
    "hash": "n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=",
    "activated": false
}
```





# 🌪️ API / Endpoints <a name="doc_endoints"></a>

**Dashboards and Overlays**
> Dashboard: {ip}:{port} (ex. *http://192.168.1.92:3000*)

> Stream Overlay: {ip}:{port}/stream/stream (ex. *http://192.168.1.92:3000/stream/stream*

> Stream Portable: {ip}:{port}/stream/portable (ex. *http://192.168.1.92:3000/stream/portable*)

> Stream Warnings: {ip}:{port}/stream/warnings (ex. *http://192.168.1.92:3000/stream/warnings*)


**Backend Endpoints**

> All Alerts: {ip}:{port}/api/alerts (ex. *http://192.168.1.92:3000/api/alerts*)

> Manual Alerts: {ip}:{port}/api/active_manual (ex. *http://192.168.1.92:3000/api/active_manual*)

> Active Warnings: {ip}:{port}/api/active_warnings (ex. *http://192.168.1.92:3000/api/active_warnings*)

> Active Watches: {ip}:{port}/api/active_watches (ex. *http://192.168.1.92:3000/api/active_watches*)



# 🌩️ Credits <a name="doc_credits"></a>
> This project was made possible by the following people. Please make sure to check them out and support them! <3

<table align="center" style="border-collapse: collapse; margin: 0 auto;">
	<tr align="center">
		<td align="center">
			<a href="https://ko-fi.com/k3yomi" style="text-decoration: none;">
				<img align="center" src='https://avatars.githubusercontent.com/u/54733885?s=55&v=4' width="55" height="55">
				<img align="center" src='https://ko-fi.com/img/githubbutton_sm.svg'>
			</a>
			<h3 align="center">k3yomi (Project Maintainer)</h3>
		</td>
	</tr>
</table>
