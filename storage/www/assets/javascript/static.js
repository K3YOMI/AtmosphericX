

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
    
    
    All this literally does is hold information that we don't want to have to keep reloading through websockets...
*/

const static_dashboard_directs = [
    {
        category: "Dashboard",
        items: [
            { icon: "fas fa-house-user", label: "Home", nav: "_navigation.home", permission: 0 },
            { icon: "fas fa-exclamation-triangle", label: "Warnings & Advisories", nav: "_navigation.alerts", permission: 0 },
            { icon: "fas fa-flag", label: "Local Storm Reports", nav: "_navigation.lsr", permission: 0 },
            { icon: "fas fa-cloud-sun", label: "Mesoscale Discussions", nav: "_navigation.dicussions", permission: 0 },
            { icon: "fas fa-comments", label: "NOAA Weather Wire", nav: "_navigation.nwws", permission: 0 },
            { icon: "fas fa-thermometer-half", label: "Current Map", nav: null, permission: 0 , action: () => window.open('/widgets/mapbox', '_blank', 'width=1200,height=900') },
            { icon: "fas fa-sun", label: "Forecasts", nav: "_navigation.forecasts", permission: 0, disabled: true },
            { icon: "fas fa-map-marked-alt", label: "Satellite", nav: "_navigation.radar", permission: 0, disabled: true },
            { icon: "fas fa-chart-line", label: "Climate Data", nav: "_navigation.climate", permission: 0, disabled: true },
        ]
    },
    {
        category: "Forecast & Probabilities",
        items: [
            { icon: "fas fa-project-diagram", label: "Storm Prediction Center", nav: "_navigation.spc", permission: 0 },
            { icon: "fas fa-chart-bar", label: "Tornado Probability", nav: "_navigation.torProbability", permission: 0 },
            { icon: "fas fa-chart-bar", label: "Severe Probability", nav: "_navigation.svrProbability", permission: 0 },
        ]
    },
    {
        category: "Networks & Tools",
        items: [
            { icon: "fas fa-globe", label: "Active Spotter Network", nav: "_navigation.spotternetwork", permission: 0 },
            { icon: "fas fa-broadcast-tower", label: "Online NOAA Radio", nav: "_navigation.radio", permission: 0 },
            { icon: "fas fa-satellite-dish", label: "Third-Party Services", nav: "_navigation.external", permission: 0 },
            
        ]
    },
    {
        category: "Server Settings",
        items: [
            { icon: "fa fa-terminal", label: "Configurations", nav: "_navigation.configurations", permission: 1 },
            { icon: "fas fa-cog", label: "Widget Settings", nav: null, permission: 1, action: () => window.open('/settings', '_blank', 'width=602,height=850') },
            { icon: "fa fa-cogs", label: "System Settings", nav: "_navigation.system", permission: 1 },
            { icon: "fas fa-robot", label: "AI Chatbot", nav: null, permission: 1, action: '', disabled: true },
        ]
    },
    {
        category: "Client Settings",
        items: [
            { icon: "fas fa-bell", label: "Toggle Sounds", nav: null, permission: 0, action: 'toggleMute' },
            { icon: "fas fa-bell", label: "Toggle EAS", nav: null, permission: 0, action: 'toggleEAS' },
            { icon: "fas fa-user", label: "My Account", nav: null, permission: 0, action: 'triggerAccountListner' },
        ]
    },
    {
        category: "Hardware Settings",
        items: [
            { icon: "fas fa-wrench", label: "Mesonet Data (Network)", nav: null, permission: 1, action: '', disabled: true },
            { icon: "fas fa-microchip", label: "Sensor Status", nav: null, permission: 1, action: '', disabled: true },
            { icon: "fas fa-wifi", label: "Network Interfaces", nav: null, permission: 1, action: '', disabled: true },
        ]
    },
    {
        category: "Resources ",
        items: [
            { icon: "fas fa-external-link-square-alt", label: "Github", nav: null, permission: 0, action: () => window.open('https://github.com/k3yomi/atmosphericx', '_blank', 'width=1000,height=1000') },
            { icon: "fas fa-external-link-square-alt", label: "Documentation", nav: null, permission: 0, action: () => window.open('https://k3yomi.github.io/blog/posts/atmosphericx/', '_blank', 'width=1000,height=1000') },
            { icon: "fa fa-hands-helping", label: "General Support", nav: "_navigation.help", permission: 0 },
            { icon: "fas fa-donate", label: "Donate", nav: null, permission: 0, action: () => window.open('https://ko-fi.com/k3yomi', '_blank', 'width=1000,height=1000') }
        ]
    },
];



const static_alerts = [
    "Tornado Emergency", 
    "Particularly Dangerous Situation (TOR WARNING)",
    "Particularly Dangerous Situation (TOR WATCH)",
    "Destructive Severe Thunderstorm Warning",
    "Confirmed Tornado Warning", 
    "Radar Indicated Tornado Warning", 
    "Flash Flood Emergency", 
    "Flash Flood Watch",
    "Severe Thunderstorm Watch",
    "Tornado Watch",
    "Special Marine Warning", "Areal Flood Warning",
    "Flash Flood Warning",
    "Considerable Severe Thunderstorm Warning",
    "Severe Thunderstorm Warning",
    "Tornado Warning",
    "Snow Squall Warning",
    "Earthquake Warning",
    "Administrative Message",
    "Air Quality Alert",
    "Air Stagnation Advisory",
    "Arroyo And Small Stream Flood Advisory",
    "Ashfall Advisory",
    "Ashfall Warning",
    "Avalanche Advisory",
    "Avalanche Warning",
    "Avalanche Watch",
    "Beach Hazards Statement",
    "Blizzard Warning",
    "Blizzard Watch",
    "Blowing Dust Advisory",
    "Blowing Dust Warning",
    "Brisk Wind Advisory",
    "Child Abduction Emergency",
    "Civil Danger Warning",
    "Civil Emergency Message",
    "Coastal Flood Advisory",
    "Coastal Flood Statement",
    "Coastal Flood Warning",
    "Coastal Flood Watch",
    "Dense Fog Advisory",
    "Dense Smoke Advisory",
    "Dust Advisory",
    "Dust Storm Warning",
    "Earthquake Warning",
    "Evacuation - Immediate",
    "Excessive Heat Warning",
    "Excessive Heat Watch",
    "Extreme Cold Warning",
    "Extreme Cold Watch",
    "Extreme Fire Danger",
    "Extreme Wind Warning",
    "Fire Warning",
    "Fire Weather Watch",
    "Flash Flood Statement",
    "Flash Flood Warning",
    "Flash Flood Watch",
    "Flood Advisory",
    "Flood Statement",
    "Flood Warning",
    "Flood Watch",
    "Freeze Warning",
    "Freeze Watch",
    "Freezing Fog Advisory",
    "Freezing Rain Advisory",
    "Freezing Spray Advisory",
    "Frost Advisory",
    "Gale Warning",
    "Gale Watch",
    "Hard Freeze Warning",
    "Hard Freeze Watch",
    "Hazardous Materials Warning",
    "Hazardous Seas Warning",
    "Hazardous Seas Watch",
    "Hazardous Weather Outlook",
    "Heat Advisory",
    "Heavy Freezing Spray Warning",
    "Heavy Freezing Spray Watch",
    "High Surf Advisory",
    "High Surf Warning",
    "High Wind Warning",
    "High Wind Watch",
    "Hurricane Force Wind Warning",
    "Hurricane Force Wind Watch",
    "Hurricane Local Statement",
    "Hurricane Warning",
    "Hurricane Watch",
    "Hydrologic Advisory",
    "Hydrologic Outlook",
    "Ice Storm Warning",
    "Lake Effect Snow Advisory",
    "Lake Effect Snow Warning",
    "Lake Effect Snow Watch",
    "Lake Wind Advisory",
    "Lakeshore Flood Advisory",
    "Lakeshore Flood Statement",
    "Lakeshore Flood Warning",
    "Lakeshore Flood Watch",
    "Law Enforcement Warning",
    "Local Area Emergency",
    "Low Water Advisory",
    "Marine Weather Statement",
    "Nuclear Power Plant Warning",
    "Radiological Hazard Warning",
    "Red Flag Warning",
    "Rip Current Statement",
    "Severe Thunderstorm Warning",
    "Severe Thunderstorm Watch",
    "Severe Weather Statement",
    "Shelter In Place Warning",
    "Short Term Forecast",
    "Small Craft Advisory",
    "Small Craft Advisory For Hazardous Seas",
    "Small Craft Advisory For Rough Bar",
    "Small Craft Advisory For Winds",
    "Small Stream Flood Advisory",
    "Snow Squall Warning",
    "Special Marine Warning",
    "Special Weather Statement",
    "Storm Surge Warning",
    "Storm Surge Watch",
    "Storm Warning",
    "Storm Watch",
    "Test",
    "Tornado Warning",
    "Tornado Watch",
    "Tropical Depression Local Statement",
    "Tropical Storm Local Statement",
    "Tropical Storm Warning",
    "Tropical Storm Watch",
    "Tsunami Advisory",
    "Tsunami Warning",
    "Tsunami Watch",
    "Typhoon Local Statement",
    "Typhoon Warning",
    "Typhoon Watch",
    "Urban And Small Stream Flood Advisory",
    "Volcano Warning",
    "Wind Advisory",
    "Wind Chill Advisory",
    "Wind Chill Warning",
    "Wind Chill Watch",
    "Winter Storm Warning",
    "Winter Storm Watch",
    "Winter Weather Advisory"
]