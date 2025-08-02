/*
                                            _               _     __   __
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


let loader = require(`../loader.js`)


class Placefiles { 
    constructor() {
        this.name = `Placefiles`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    /**      
      * @function createPlacefilePolygon
      * @description Creates a placefile in a polygon
      * 
      * @param {number} placefileRefresh - Refresh rate for the placefile
      * @param {number} placefileThreshold - Threshold for the placefile
      * @param {string} placefileTitle - Title for the placefile
      * @param {Array} data - Array of objects containing point data
      * @param {string} cachePointer - Cache pointer for the placefile
      */

    createPlacefilePolygon = function(placefileRefresh = 10, placefileThreshold = 999, placefileTitle = `Default Placefile Title`, data = [], cachePointer = `template`) {
        let placefileText = `Refresh: ${placefileRefresh}\nThreshold: ${placefileThreshold}\nTitle: ${placefileTitle}\n`;
        for (let item of data) {
            let { title = `No title provided`, description = `No description provided`, polygon = [], rgb = `255,255,255,255` } = item || {};
            rgb = rgb.replace(/,/g, ' ');
            let hasCoords = Array.isArray(polygon) && polygon.some(ring => 
                Array.isArray(ring) && ring.some(pt => Array.isArray(pt) && pt.length == 2 && typeof pt[0] == 'number' && typeof pt[1] == 'number')
            );
            if (!hasCoords) continue;
            placefileText += `\nColor: ${rgb}\n\nLine: 3,0, ${description}\n`;
            let points = [];
            for (let ring of polygon) {
                for (let pt of ring) {
                    if (Array.isArray(pt) && pt.length == 2) {
                        placefileText += `${pt[1]},${pt[0]}\n`;
                        points.push(pt);
                    }
                }
            }
            placefileText += `End:\n`;
        }
        loader.cache.placefiles[cachePointer] = placefileText;
    }

    /**      
      * @function createPlacefilePoint
      * @description Creates a placefile in a point
      * 
      * @param {number} placefileRefresh - Refresh rate for the placefile
      * @param {number} placefileThreshold - Threshold for the placefile
      * @param {string} placefileTitle - Title for the placefile
      * @param {Array} data - Array of objects containing point data
      * @param {string} cachePointer - Cache pointer for the placefile
      */

    createPlacefilePoint = function(placefileRefresh = 10, placefileThreshold = 999, placefileTitle = `Default Placefile Title`, data = [], cachePointer = `template`) {
        let placefileText = [
            `Refresh: ${placefileRefresh}`,
            `Threshold: ${placefileThreshold}`,
            `Title: ${placefileTitle}`,
            `Font: 1, 11, 0, "Courier New"`,
            `IconFile: 1, 30, 30, 15, 15, "https://www.spotternetwork.org/iconsheets/Spotternet_096.png"`,
            `IconFile: 2, 21, 35, 10, 17, "https://www.spotternetwork.org/iconsheets/Arrows_096.png"`,
            `IconFile: 6, 30, 30, 15, 15, "https://www.spotternetwork.org/iconsheets/Spotternet_New_096.png"`
        ].join('\n');
        for (let i = 0; i < data.length; i++) {
            let { description = `No description provided`, point = [], icon = '0,0,000,1,19', text = '0, 15, 1', title = '' } = data[i] || {};
            if (Array.isArray(point) && point.length == 2 && typeof point[0] == 'number' && typeof point[1] == 'number')  {
                placefileText += [
                    `\nObject: ${point[1]},${point[0]}`,
                    `Icon: ${icon},"${description.replace(/\n/g, '\\n')}"`,
                    `Text: ${text}, "${title.split('\n')[0]}"`,
                    `End:\n`
                ].join('\n');
            }
        }
        loader.cache.placefiles[cachePointer] = placefileText;
    }
}


module.exports = Placefiles;