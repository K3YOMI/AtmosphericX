




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
	- Website Dashboard (HRRR, GSF, Nexlab, Mesoscale Analysis, and Live Chasers)
	- Active warnings and watches
	- Last notification send by the National Weather Service (Last Updated, Event Name, Locations, and Description)
	- Force Request (Bypasses Refresh Rate)
	- Active alerts table
	- Custom notification system (Stream Support)
	- Manual Override (Manual alerts)
	- SPC Outlook Moduels (Day 1 & 2)
	- County warning alerts (specified)
- [x] Whitelist (network-wide)
- [x] Portable (Supports audio and active warnings)
- [x] Discord.js / Discord Bot support (Latest warning)


# 🌧️ Install Guide <a name="doc_install"></a>
To install Project AtmosphericX, you will need a few requirements. NodeJS / NPM and Git (optional)
If you are not wanting to install git, you can also clone the repository by downloading it as a ZIP. If you do not know how to install any of the requirements, feel free to refer to their documentation.

# 🌪 Cloning the project with Git <a name="doc_clone"></a>
once finished install git, clone the project with the command below (terminal/command prompt)

	git clone https://github.com/k3yomi/AtmosphericX

After cloning, navigate to the **AtmosphericX** directory. Inside, you'll find another directory titled **Project AtmosphericX**. This holds the main project itself. For better ease of access, feel free to drop the **Project AtmosphericX** directory into somewhere you'll remember.

# 🌩️ Configuration <a name="doc_configure"></a>
Configurating AtmosphericX is quite simple, the **env** holds all the configurations and warnings to whitelist as well as the discord bot support configuration. Here is a general template below of the configuration and what each configuration does. 

**DO NOT COPY THE CONFIG AS THIS IS NOT A WORKING CONFIG**
```conf
# Environment Configuration
VERSION=4.0.0 # Hold the version (do not touch)

# HOST NAME AND ACCESS
HOSTNAME=192.168.X.XXX # Your local network address (LAN) (ipconfig)
PORT=3000 # Port you would like to host on your device
API_ACCESS=[*] # Which IP's are allowed to access (* = wildcard/all)

# GENERAL INFORMATION
YOUR_LOCATION=COUNTY_NAME, ST # Your county, state (abbreviated) - will be used to give you alerts in the dashboard for alerts in your area
USER_AGENT=AtmosphericX-4.0 # Custom UserAgent to the national weather service

# QUERY CONFIGURATION
ACTIVE_ONLY=false # Active only alerts
REFRESH_RATE=30 # How often your server queries the NWS API (execute every 30 seconds, provided the seconds component of the current system time)
QUERY_RATE=10 # How often your cleint queries the server API (execute every 10 seconds, provided the seconds component of the current system time)
OUTBREAK_ONLY=true # (true = only looks for major_alerts) (false = targets all_alerts)
MAJOR_ALERTS=[]
ALL_ALERTS=[]

# DISCORD BOT CONFIGURATION (OPTIONAL)
ENABLE_DISCORD_BOT=false # Enable the discord bot functionality
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN # Discord bot token
DISCORD_UPDATE_CHANNEL=YOUR_DISCORD_CHANNEL_ID # Channel ID
DISCORD_BOT_REFRESH_RATE=30 # How often your server queries the NWS API (Based on your system clock)
```


# ⛈️ Post Configuration <a name="doc_post"></a>
Once you have configured your **env** file. You are now ready to start AtmosphericX! To simply start it up, you will need to run the command down below.

	node index.js

If you encounter an error regarding a **missing dependency**, you have two options to resolve it. You can either manually run npm install for the specified dependency, or for convenience, execute the shell file named **install.sh** to automatically install all necessary requirements.

	npm install {package_name}


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
