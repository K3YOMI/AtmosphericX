




<h1 style='font-size: 65px'; align="center">🌩️ Project AtmosphericX 🌪️</h1>

<div align="center">
  	<p align = "center">AtmosphericX is a web application that uses the National Weather Service API and other similar APIs to provide near real-time weather alerts and outlooks. The application can be used by storm chasers, emergency management, or the general public to stay informed about severe weather or special alerts. Please note that this application is still in development and may not be fully functional. Also please note that information provided by this application should not be used as the sole source of information for severe weather events. Always refer to the National Weather Service for the most accurate and up-to-date information or your NOAA Weather Radio. I do not claim responsibility for any damages that may occur as a result of using this application. </p>
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
- [OBS Importing Documentation](#doc_obs)
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
		- SHA256 Hashing (users.json)
	- Active Alerts & General Information
		- Active Alerts, Warnings, and Watches
		- Local Storm Reports (Hail, Rain, Damages, Etc)
		- Previous 6 Alerts (w/ interactions and map)
		- Region Alerts (Forecast Office, Direct Location, SAME ID, or UGC ID)
	- External Services and Tools
		- Live Storm Chasing Cam Service (https://livestormchasing.com)
		- Hourly Mesoscale Analysis (https://www.spc.noaa.gov)
		- NexLab (https://weather.cod.edu/#)
		- GFS Model (https://www.tropicaltidbits.com/analysis/models/)
		- HRRR Model (https://www.tropicaltidbits.com/analysis/models/?model=hrrr)
		- Hodographs (https://www.pivotalweather.com/model.php?p=sbcape_hodo&fh=3)
	- SPC Day Risks and Outlooks
		- Categorial (Days: 1, 2, and 3)
		- Tornado Risk (Days: 1 and 2)
		- Hail Risk (Days: 1 and 2)
		- Wind Risk (Days: 1 and 2)
	- Query/Notification Information
		- Force Request
		- Notification Settings
        - Status Alert
		- Debug Alerts
	- County Based Alerts
		- Red Warning Box (Previous 6 Alerts)
		- Audio Support
		- Notificiation Support
- [x] Portable Mode (/premade/portable)
- [x] Mobile Phone Audio Support
	- Requires at least once interaction
- [x] Full configuration support
- [x] Synced Alerts
- [x] SSL Certification Support
- [x] Full widget support
- [x] OBS Support


# 🌧️ Install Guide <a name="doc_install"></a>
Documentation Video Reference: https://youtu.be/dmCLYmTKeNg (**OUTDATED**)

To install Project AtmosphericX, you will need a few requirements. NodeJS / NPM and Git (optional)
If you are not wanting to install git, you can also clone the repository by downloading it as a ZIP. If you do not know how to install any of the requirements, feel free to refer to their documentation.

# 🌪 Cloning the project with Git <a name="doc_clone"></a>
once finished install git, clone the project with the command below (terminal/command prompt)

	git clone https://github.com/k3yomi/AtmosphericX

After cloning, navigate to the **AtmosphericX** directory. This holds the main project itself.

# 🌩️ Configuration <a name="doc_configure"></a>
Configurating AtmosphericX is quite simple, the **configurations.json** holds all the configurations. Here is a general template below of the configuration and what each configuration does. 

**DO NOT COPY THE CONFIG AS THIS IS NOT A WORKING CONFIG**
```json

{
    {
    "hosting:settings": {
        "https:enabled": false,
        "https:port": 3011,
        "http:port": 3010,
        "cookie:maxage": 86400000,
        "ssl:path": {
            "ssl:key": "./cert/generated.key",
            "ssl:cert": "./cert/generated.crt"
        }
    },
    "application:api": {
        "primary:api": {
            "nws:api": {
                "nws:enabled": true,
                "nws:api": "https://api.weather.gov/alerts/active",
                "nws:state": "",
                "nws:forecastoffice": [],
                "nws:same": [],
                "nws:zone": []
            },
            "allisonhouse:warnings": {
                "allisonhouse:warnings:enable": false,
                "allisonhouse:warnings:api": "https://warnings.allisonhouse.com"
            },
            "cod:warnings": {
                "cod:warnings:enable": false,
                "cod:warnings:api": "https://warnings.cod.edu"
            }
        },
        "misc:api": {
            "iem:stormreports": {
                "iem:stormreports:enable": true,
                "iem:stormreports:state": "",
                "iem:stormreports:hours": 1,
                "iem:stormreports:api": "https://mesonet.agron.iastate.edu/geojson/lsr.geojson?"
            }
        }
    },
    "application:information": {
        "application:location": "Somewhere, USA",
        "application:timezone": "America/New_York",
        "application:useragent": "AtmosphericX-v6"
    },
     "request:settings": {
        "request:refresh_synced": 30,
        "request:query_sycned": 10,
        "request:outbreakmode": false,
        "request:outbreakalerts": [],
        "request:allalerts": [],
        "request:beeponly": false,
        "request:updates": true,
        "request:alwaysrun": []
    },
    "application:sounds": {},
    "application:banners": {},
    "application:warnings": {},
    "application:states": []
}

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
To access the dashboard, which can be found at ``http://localhost:{port}`` (Ex. http://localhost:3010), you will need to login. If you are unable to see the dashboard, ensure that the NodeJS web server is up and running.

    Username: root
    Password: root


Ensuring the security of your webserver is of importance. It's vital to promptly change this default password. To do so, simply navigate back to the login screen and select the "Change password?" option. It's worth noting that access to AtmosphericX's API and streaming functionalities remains open to all users, even those without login credentials.


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



# 🔴 Open Broadcasting Software Setup <a name="doc_obs"></a>

### ⚠️ PLEASE READ BEFORE IMPORTING ⚠️
> If you are **NOT** running this project on your local machine or you have **changed the default port**, it's imperative to change the links in the .json file for the exported obs scene.
If not, you will have to manually change them in the sources. 

Setting up AtmosphericX with [OBS](https://obsproject.com/) Studio is quite simple and can be time consuming depending if you want the full experince.
A few plugins are required before proceeding with OBS studio, assuming you already have it installed.
One of the required plugins is [Source Clone](https://obsproject.com/forum/resources/source-clone.1632/) and [Composite Blur](https://obsproject.com/forum/resources/composite-blur.1780/)

The templates located in the `/obs` directory under the project folder include these essential exported files. Getting these plugins are highly beneficial and can enhance your OBS Studio experience, even outside the scope of AtmosphericX. They provide additional functionality and customization options to improve your streaming or recording setup. 

To import: Scene Collection > Import > *.json

Once you import the scene, you will see two new scenes. ``Template Scene`` and ``Template Overlay Source``, it's highly encouraged you don't touch either scenes and make a new scene that uses the ``soure clone`` source to then copy the overlay source and modify from there. You can see widget urls located down below.

If you have no idea how to perform this or don't feel like modifying your own custom setup of AtmosphericX, you can simply import a browser source and use the URL ``[yourip/localhost]:[port]/premade/stream``. This will give you the old stream overlay with **full** functionality. 


# 🌪️ API / Widgets <a name="doc_endoints"></a>
```
[Login Portal]
- (GET)  (PUBLIC) /registration
- (GET)  (PUBLIC) /reset
- (POST) (PUBLIC) /api/login
- (POST) (PUBLIC) /api/logout
- (POST) (PUBLIC) /api/register
- (POST) (PUBLIC) /api/reset

[Public API]
- (GET)  (PUBLIC) /api/alerts
- (GET)  (PUBLIC) /api/manual
- (GET)  (PUBLIC) /api/warnings
- (GET)  (PUBLIC) /api/watches
- (GET)  (PUBLIC) /api/notifications
- (GET)  (PUBLIC) /api/status
- (GET)  (PUBLIC) /api/configurations
- (GET)  (PUBLIC) /api/states
- (GET)  (PUBLIC) /reports

[Private API]
- (GET)  (PUBLIC) /dashboard
- (POST) (PUBLIC) /api/forcerequest
- (POST) (PUBLIC) /api/notification
- (POST) (PUBLIC) /api/manual
- (POST) (PUBLIC) /api/status

[Widgets]
- (GET)  (PUBLIC) /widgets/alert
- (GET)  (PUBLIC) /widgets/map
- (GET)  (PUBLIC) /widgets/warnings
- (GET)  (PUBLIC) /widgets/light
- (GET)  (PUBLIC) /widgets/dark
- (GET)  (PUBLIC) /widgets/random_description
- (GET)  (PUBLIC) /widgets/random_title
- (GET)  (PUBLIC) /widgets/random_location
- (GET)  (PUBLIC) /widgets/random_expires
- (GET)  (PUBLIC) /widgets/local_time
- (GET)  (PUBLIC) /widgets/local_date
- (GET)  (PUBLIC) /widgets/header
- (GET)  (PUBLIC) /widgets/notification

[Premade Overlays]
- (GET)  (PUBLIC) /premade/stream
- (GET)  (PUBLIC) /premade/portable
```


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
