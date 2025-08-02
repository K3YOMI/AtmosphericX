

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

class Graphics {
    constructor(library) {
        this.library = library;
        this.storage = this.library.storage;
        this.name = `Graphics`;
        this.library.createOutput(`${this.name} Initialization`, `Successfully initialized ${this.name} module`);
    };

    /**
      * @function speedometer
      * @description Creates a speedometer graphic (Usually for displaying data like wind speed, temperature, etc.
      * 
      * @param {number} minValue - The minimum speed value for the speedometer.
      * @param {number} currentValue - The current speed value to display on the speedometer.
      * @param {number} maxValue - The maximum speed value for the speedometer.
      * @param {string} title - The title of the speedometer.
      * @param {string} subprefix - A sub-prefix to append to the current speed value.
      * @param {number} size - The scaling factor for the speedometer size.
      * @param {string} elementId - The ID of the HTML element where the speedometer will be rendered.
      */

    speedometer = function (minValue = 0, currentValue = 0, maxValue = 100, title = ``, subprefix = ``, size = 1.0, elementId) {
        let targetElement = document.getElementById(elementId);
        if (!targetElement) { return; }

        if (subprefix.toString().toLowerCase().includes(`undefined`) || subprefix.toString().toLowerCase().includes(`null`)) {
            subprefix = subprefix.replace(/undefined|null/g, `N/A`).trim();
        }
        let existingSpeedometer = targetElement.querySelector(`.speedometer`);
        if (existingSpeedometer) {
            let needle = existingSpeedometer.querySelector(`.speedometer-needle`);
            if (needle) {
                let newRotation = ((currentValue - minValue) / (maxValue - minValue)) * 180 - 88;
                needle.style.transition = `transform 0.5s ease-in-out`;
                needle.style.transform = `rotate(${newRotation}deg)`;
            }

            let currentLabel = existingSpeedometer.querySelector(`.speedometer-label.mid`);
            if (currentLabel) {
                currentLabel.innerText = parseFloat(currentValue.toFixed(2)) + (subprefix ? `${subprefix}` : ``);
            }
            return;
        }

        let speedometerElement = document.createElement(`div`);
        speedometerElement.className = `speedometer`;
        speedometerElement.style.display = `inline-block`;
        speedometerElement.style.margin = `10px`;

        let needle = document.createElement(`div`);
        needle.className = `speedometer-needle`;
        needle.style.transform = `rotate(${((currentValue - minValue) / (maxValue - minValue)) * 180 - 88}deg)`;

        let currentLabel = document.createElement(`span`);
        currentLabel.className = `speedometer-label mid`;
        currentLabel.innerText = parseFloat(currentValue.toFixed(2)) + (subprefix ? `${subprefix}` : ``);

        let ticksContainer = document.createElement(`div`);
        ticksContainer.className = `speedometer-ticks`;

        let step = Math.max(1, Math.ceil((maxValue - minValue) / 13)); 
        for (let i = minValue; i <= maxValue; i += step) {
            let tick = document.createElement(`div`);
            tick.className = `speedometer-tick`;
            tick.style.transform = `rotate(${((i - minValue) / (maxValue - minValue)) * 180 - 88}deg)`;
            ticksContainer.appendChild(tick);

            let tickLabel = document.createElement(`div`);
            tickLabel.className = `speedometer-tick-label`;
            tickLabel.innerText = Math.round(i);
            tickLabel.style.transform = `rotate(${-(i - minValue) / (maxValue - minValue) * 180 + 88}deg)`; 
            tick.appendChild(tickLabel);
        }    
        
        if (title) {
            let titleElement = document.createElement('div');
            titleElement.className = `speedometer-title`;
            titleElement.innerText = title;
            speedometerElement.appendChild(titleElement);
        }

        speedometerElement.append(needle, currentLabel, ticksContainer);
        speedometerElement.style.transform = `scale(${size})`;
        targetElement.appendChild(speedometerElement);
    };
}