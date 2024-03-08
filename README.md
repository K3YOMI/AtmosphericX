




<h1 style='font-size: 65px'; align="center">AtmosphericX</h1>

<div align="center">
  	<p align = "center">A custom-built hosted project designed to fetch weather-related data from the National Weather Service</p>
  	<p align = "center">Documentation written by @k3yomi</p>
	<div align="center" style="border: none;">
		<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/K3YOMI/AtmosphericX">
		<img alt="GitHub forks" src="https://img.shields.io/github/forks/K3YOMI/AtmosphericX">
		<img alt="GitHub issues" src="https://img.shields.io/github/issues/K3YOMI/AtmosphericX">
		<img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/K3YOMI/AtmosphericX">
	</div>
</div>


# ⛈️ Table of Contents
- [Introduction](#doc_introduction)
- [Features](#doc_features)
- [Install Guide](#doc_install)
- [How to install](#install_guides)
- [Credits and Packages](#doc_credits)

<br><br>



# ⛈️ What is AtmosphericX? <a name = "doc_introduction"></a>
> AtmosphericX is a custom-built hosted project designed to fetch weather-related data from the National Weather Service (NWS) API. It is primarily used to provide weather information to users, whether they are individuals looking for local weather conditions or developers integrating weather data into their applications. 



# ⛈️ Current features and future updates <a name = "doc_features"></a>
- [x] Near realtime updates
	- Tornado Emergencies
	- PDS Warnings
	- Server Thunderstorm Warnings/Watches
	- Tornado Warnings/Watches
	- Flash Flood Warnings/Watches
	- Special Marine Warnings/Watches
	- Snow Squall Warnings
	- More!
- [x] Alert Effects and Audio
	- Animation Effect (Meant for OBS)
	- Audio Effect (Meant for OBS)
- [x] County Warning Detection
	- Detect a warning in a specified county (Special Alert)
- [x] Full whitelist based dashboard
- [x] OBS studio support
- [x] Discord.js support (Discord Bot)


# ⛈️ Installing and Requirements <a name = "doc_install"></a>

> The only requirement for this project to run properly is NodeJS. (https://nodejs.org/en)


## How to install <a name = "install_guides"></a>

	git clone https://github.com/K3YOMI/AtmosphericX
	cd AtmosphericX
	bash install.sh
 	# if above fails, do the following below
  	npm i request
   	npm i discord.js
	
> Setup the env file... (Make sure hostname is the ipv4 of that device) You can also use wildcards for API_ACCESS (* = ALL)


	# Environment Configuration
	VERSION=3.0.0

	# HOST NAME AND ACCESS
	HOSTNAME=192.168.X.XX
	PORT=3000
	API_ACCESS=[*]

	# GENERAL INFORMATION
	YOUR_LOCATION=COUNTY, STATE
	USER_AGENT=AtmosphericX-3.0

	# QUERY CONFIGURATION
	ACTIVE_ONLY=true
	REFRESH_RATE=30

	# DISCORD BOT CONFIGURATION (OPTIONAL)
	ENABLE_DISCORD_BOT=false
	DISCORD_TOKEN=DISCORD_TOKEN_HERE
	DISCORD_UPDATE_CHANNEL=DISCORD_CHANNEL_ID
	DISCORD_BOT_REFRESH_RATE=30

> Once configured....

	# node index.js

> All done, you should now have a working version of AtmosphericX running on a NodeJS webserver. If you have any issues, feel free to send an issue into the repository. This documentation will be further improved when I have the time to do so. Thank you!


# ⛈️ Contributors and Credits <a name = "doc_credits"></a>
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
