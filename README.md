# AtmosphericX v1
[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=1&duration=2000&pause=1000&color=F70000&width=435&lines=Have+Questions%3F;Feel+free+to+contact+me!)](https://git.io/typing-svg)

## 📋 Project Introduction
AtmosphericX is a custom-built hosted project designed to fetch weather-related data from the National Weather Service (NWS) API. It is primarily used to provide weather information to users, whether they are individuals looking for local weather conditions or developers integrating weather data into their applications.

### 🔑 Key Features
<img align="right" height="250vh" src="https://github.com/K3YOMI/AtmosphericX/assets/54733885/e6cdf44a-ea6e-4acb-9386-e19ed1506507">

 - **Real-time updates**
 - **Customizable Queries**
 - **Custom Alert Sounds**
 - **Full Dashboard**
 - **Animated Alerts**
 - **Location Based Priority Alerts**
 - **Integrated API**
 - **HTML Overlay**


### 🛠️ How AtmosphericX Works

 1. Once AtmosphericX is fully initialized, it will begin to fetch weather data from the NWS API. It will then replicate said data into 2 files. (active.json and archive.json)
 2. Any device on your network can access said information (*if whitelisted*) by accessing http://[ip-here]:[port]/api/active and http://[ip-here]:[port]/api/archive to fetch said information without sending multiple requests to the NWS API.
 3. Anything after that is up to you! You can use the data to create your own custom alerts, or use the built-in alert system to create alerts based on the data provided or just leave it as it is and use it as a dashboard for your stream!

### 👌 Use Cases
- Locally Hosted Weather Dashboard
- Streaming Interface
- Application Integration
- Research
- Curiosty



# Hosting and Deployment
AtmosphericX is a self-hosted service, which means organizations or individuals can set up their own instances of the service on their servers or cloud platforms. This gives users full control over the service's information.

#### Configuration File
```js
// This is the start.js file
const hostname = "192.168.x.xx" // The Hosts IP Address
const port = 4280; // The Port to run the server on
const location = "County, ST" // The location of you (The Host) , used to send private alerts to you during severe weather events.
const api_access = [''] // IP Addresses that can access the API and dashboard. (You can also do a wildcard '*' to allow all IP Addresses to access the API and dashboard.)
const dashboard_access = [''] // IP Addresses that can access the dashboard. (You can also do a wildcard '*' to allow all IP Addresses to access the dashboard.)
const query_refresh = 8 // How often to refresh the query in seconds (Default: 8, seems to be the fastest without getting rate limited)
const global_header = { 'User-Agent': 'Any-US-Here','Accept': 'application/geo+json','Accept-Language': 'en-US'}
```

### Required Dependencies
- NodeJS
  - npm i http (*if needed*)
  - npm i fs (*if needed*)
  - npm i path (*if needed*)




