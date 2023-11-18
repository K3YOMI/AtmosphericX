# AtmosphericX v1.2
[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=1&duration=2000&pause=1000&color=F70000&width=435&lines=Have+Questions%3F;Feel+free+to+contact+me!)](https://git.io/typing-svg)

## 📋 Project Introduction
AtmosphericX is a custom-built hosted project designed to fetch weather-related data from the National Weather Service (NWS) API. It is primarily used to provide weather information to users, whether they are individuals looking for local weather conditions or developers integrating weather data into their applications.

### 🔑 Key Features
<img align="right" height="250vh" src="https://github.com/K3YOMI/AtmosphericX/assets/54733885/e6cdf44a-ea6e-4acb-9386-e19ed1506507">

 - **real-time updates**
 - **Customizable queries**
 - **Custom alert sounds**
 - **Partial dashboard**
 - **Animated alerts**
 - **HTML Overlay** (OBS Studio)

### 🛠️ How AtmosphericX Works

 1. Once AtmosphericX is fully initialized, it will begin to fetch weather data from the NWS API. It will then replicate said data into 2 files. (active.json and archive.json)
 2. Any device on your network can access said information (*if whitelisted*) by accessing http://[ip-here]:[port]/api/active and http://[ip-here]:[port]/api/archive to fetch said information without sending multiple requests to the NWS API.
 3. Anything after that is up to you! You can use the data to create your own custom alerts, or use the built-in alert system to create alerts based on the data provided or just leave it as it is and use it as a dashboard for your stream!

#### Configuration File
```js
// start of webserver.js
const hostname = "192.168.X.XXX" // IPv4 address of the host.
const port = 420; // Port.
const location = "County, State" // The county to check for warnings, watches, emergencies, etc. (This will play a tone)
const api_access = ['*'] // IPv4's allowed to access the built-in api (use "*" to allow all)
const dashboard_access = ['*'] //  IPv4's allowed to access the built-in dashboard (use "*" to allow all)
const query_refresh = 8 // How often to refresh the query in seconds (Default: 8, seems to be the fastest without getting rate limited)
const global_header = { 'User-Agent': 'AtmosphericX-######','Accept': 'application/geo+json','Accept-Language': 'en-US'}
```

### 📋 Required Dependencies / Modules
- NodeJS 20.9.0 LTS (https://nodejs.org/en/)
- Node Modules:
   - Required: `request`
     - `> npm i request`
   - Required: ``fs``
     - `> npm i fs`
   - Required: ``path``
     - `> npm i path`






