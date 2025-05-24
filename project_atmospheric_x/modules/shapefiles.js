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


class Routes { 
    constructor() {
        this.name = `Shapefiles`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
    }

    /**
      * @function checkShapefiles
      * @description Check if the shapefiles table exists in the database if not create the table
      */

    checkShapefiles = async function() {
        let db = await loader.modules.database.runQuery(`SELECT name FROM sqlite_master WHERE type='table' AND name='shapefiles'`, [])
        if (db.length === 0) {
            await loader.modules.database.runQuery(`CREATE TABLE shapefiles (id TEXT PRIMARY KEY, location TEXT, geometry TEXT)`, [])
            return {success: false, message: `Shapefiles table created`}
        }
        return {success: true, message: `Shapefiles table already exists`}
    }

    /**
      * @function createZones
      * @description Create zones from shapefiles and insert them into the database
      * 
      * @param {Array} shapefiles - Array of shapefiles to be created
      */

    createZones = async function(shapefiles=[]) {
        let checkFiles = await this.checkShapefiles()
        if (!checkFiles.success) {
            loader.modules.hooks.createOutput(this.name, `\n\n[NOTICE] DO NOT CLOSE ATMOSPHERICX UNTIL THE SHAPEFILES ARE DONE COMPLETING!\n\t THIS COULD TAKE A WHILE DEPENDING ON THE SPEED OF YOUR HARDWARE!!\n\t IF YOU CLOSE ATMOSPHERICX, THE SHAPEFILES WILL NOT BE CREATED AND YOU WILL NEED TO DELETE DATABASE.DB AND RESTART ATMOSPHERICX TO CREATE THEM AGAIN!\n\n`)
            for (let i = 0; i < shapefiles.length; i++) {
                let file = shapefiles[i].file 
                let type = shapefiles[i].id
                let filePath = `../storage/shapefiles/${file}`
                let read = await loader.packages.shapefile.read(filePath, filePath)
                let features = read.features 
                loader.modules.hooks.createOutput(this.name, `Successfully read ${file} (${type}) shapefile`)
                loader.modules.hooks.createLog(this.name, `Successfully read ${file} (${type}) shapefile`)
                for (let a = 0; a < features.length; a++) {
                    let properties = features[a].properties;
                    let fipsExist = properties.FIPS != undefined;
                    let stateExists = properties.STATE != undefined;
                    let fullStateExists = properties.FULLSTAID != undefined;
                    if (fipsExist) {
                        let t = `${properties.STATE}${type}${properties.FIPS.substring(2)}`;
                        let n = `${properties.COUNTYNAME}, ${properties.STATE}`;
                        await loader.modules.database.runQuery(`INSERT OR REPLACE INTO shapefiles (id, location, geometry) VALUES (?, ?, ?)`, [t, n, JSON.stringify(features[a].geometry)]);
                    } else if (stateExists) {
                        let t = `${properties.STATE}${type}${properties.ZONE}`;
                        let n = `${properties.NAME}, ${properties.STATE}`;
                        await loader.modules.database.runQuery(`INSERT OR REPLACE INTO shapefiles (id, location, geometry) VALUES (?, ?, ?)`, [t, n, JSON.stringify(features[a].geometry)]);
                    } else if (fullStateExists) {
                        let t = `${properties.ST}${type}-NoZone`;
                        let n = `${properties.NAME}, ${properties.STATE}`;
                        await loader.modules.database.runQuery(`INSERT OR REPLACE INTO shapefiles (id, location, geometry) VALUES (?, ?, ?)`, [t, n, JSON.stringify(features[a].geometry)]);
                    } else {
                        let t = properties.ID;
                        let n = properties.NAME;
                        await loader.modules.database.runQuery(`INSERT OR REPLACE INTO shapefiles (id, location, geometry) VALUES (?, ?, ?)`, [t, n, JSON.stringify(features[a].geometry)]);
                    }
                }
            }
            return {success: true, message: `Successfully created shapefiles`}
        }
    }
}


module.exports = Routes;