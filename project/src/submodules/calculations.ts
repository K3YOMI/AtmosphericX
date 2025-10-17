/*
              _                             _               _     __   __
         /\  | |                           | |             (_)    \ \ / /
        /  \ | |_ _ __ ___   ___  ___ _ __ | |__   ___ _ __ _  ___ \ V / 
       / /\ \| __| '_ ` _ \ / _ \/ __| '_ \| '_ \ / _ \ '__| |/ __| > <  
      / ____ \ |_| | | | | | (_) \__ \ |_) | | | |  __/ |  | | (__ / . \ 
     /_/    \_\__|_| |_| |_|\___/|___/ .__/|_| |_|\___|_|  |_|\___/_/ \_\
                                     | |                                 
                                     |_|                                                                                                                
    
    Written by: KiyoWx (k3yomi) & StarflightWx      
                          
*/


import * as loader from '../bootstrap';
import * as types from '../types';




export class Calculations { 
    NAME_SPACE: string
    constructor() {
        this.NAME_SPACE = `submodule:calculations`;
        this.initialize();
    }

    private initialize() {
        loader.submodules.utils.log(`${this.NAME_SPACE} initialized.`)
    }

    public degreesToCardinal(degrees: number): string { 
        if (degrees > 360 || degrees < 0) return `Invalid`;
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }

    public getDistanceBetweenCoordinates(LatitudeAndLongitude: types.LatitudeAndLongitude, type: 'kilometers' | 'miles' = 'miles'): string | 0 {
        if (!LatitudeAndLongitude) return 0;
        const { coords = {lat: 0, lon: 0}, coords2 = {lat: 0, lon: 0} } = LatitudeAndLongitude;
        const lat1 = coords.lat
        const lon1 = coords.lon;
        const lat2 = coords2.lat;
        const lon2 = coords2.lon;
        const toRad = (deg: number) => deg * Math.PI / 180;
        let earthRadius = type == 'miles' ? 3958.8 : 6371,
            dLat = (toRad(lat2) - toRad(lat1)),
            dLon = (toRad(lon2) - toRad(lon1)),
            a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2, 
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), 
            distance = earthRadius * c;
        return isNaN(distance) ? undefined : distance.toFixed(2);
    }
    
}

export default Calculations;

