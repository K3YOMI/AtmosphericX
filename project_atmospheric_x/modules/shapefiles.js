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
        let db = await loader.modules.database.runQuery(`SELECT name FROM sqlite_master WHERE type='table' AND name='shapefiles'`, []);
        if (!db.length) {
            await loader.modules.database.runQuery(`CREATE TABLE shapefiles (id TEXT PRIMARY KEY, location TEXT, geometry TEXT)`, []);
            return { success: false, message: `Shapefiles table created` };
        }
        return { success: true, message: `Shapefiles table already exists` };
    }

    /**
      * @function createZones
      * @description Create zones from shapefiles and insert them into the database
      * 
      * @param {Array} shapefiles - Array of shapefiles to be created
      */

    createZones = async function(shapefiles = []) {
        let checkFiles = await this.checkShapefiles();
        if (!checkFiles.success) {
            loader.modules.hooks.createOutput(this.name, `\n\n[NOTICE] DO NOT CLOSE ATMOSPHERICX UNTIL THE SHAPEFILES ARE DONE COMPLETING!\n\t THIS COULD TAKE A WHILE DEPENDING ON THE SPEED OF YOUR HARDWARE!!\n\t IF YOU CLOSE ATMOSPHERICX, THE SHAPEFILES WILL NOT BE CREATED AND YOU WILL NEED TO DELETE DATABASE.DB AND RESTART ATMOSPHERICX TO CREATE THEM AGAIN!\n\n`);
            for (let shapefile of shapefiles) {
                let { file, id: type } = shapefile;
                let filePath = `../storage/shapefiles/${file}`;
                let { features } = await loader.packages.shapefile.read(filePath, filePath);
                loader.modules.hooks.createOutput(this.name, `Successfully read ${file} (${type}) shapefile`);
                loader.modules.hooks.createLog(this.name, `Successfully read ${file} (${type}) shapefile`);
                for (let feature of features) {
                    let { properties, geometry } = feature;
                    let t, n;
                    if (properties.FIPS) {
                        t = `${properties.STATE}${type}${properties.FIPS.substring(2)}`;
                        n = `${properties.COUNTYNAME}, ${properties.STATE}`;
                    } else if (properties.STATE) {
                        t = `${properties.STATE}${type}${properties.ZONE}`;
                        n = `${properties.NAME}, ${properties.STATE}`;
                    } else if (properties.FULLSTAID) {
                        t = `${properties.ST}${type}-NoZone`;
                        n = `${properties.NAME}, ${properties.STATE}`;
                    } else {
                        t = properties.ID;
                        n = properties.NAME;
                    }
                    await loader.modules.database.runQuery(`INSERT OR REPLACE INTO shapefiles (id, location, geometry) VALUES (?, ?, ?)`, [t, n, JSON.stringify(geometry)]);
                }
            }
            return { success: true, message: `Successfully created shapefiles` };
        }
    }
}


module.exports = Routes;