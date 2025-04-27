

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

let LOAD = require(`../loader.js`)

/**
 * @module Database
 * @description Database class for handling database operations
 * 
 * @requires sqlite3.
 * @requires fs
 * @requires path
 */

class Database { 
    constructor() {
        this.author = `k3yomi@GitHub`
        this.db = undefined
        this.production = true
        this.name = `Database`;
        LOAD.Library.Hooks.PrintLog(`${this.name}`, `Successfully initialized ${this.name} module`);
        this._CheckDatabaseDirectory()
    }

    /**
      * @function _CheckDatabaseDirectory 
      * @description Check if the database directory exists, if not create it and create the database file
      * If it does exists but the accounts table does not, create the accounts table and insert a dummy account
      * 
      * @async
      * @returns {Promise<void>} - Returns a promise that resolves when the database is ready
     */

    async _CheckDatabaseDirectory() {
        let exists = LOAD.Packages.FileSystem.existsSync(LOAD.Packages.PathSystem.join(__dirname, `../../storage/database.db`));
        if (!exists) { LOAD.Library.Hooks.PrintLog(`${this.name}`, `Database file not found, please check your installation`); LOAD.Packages.FileSystem.writeFileSync(LOAD.Packages.PathSystem.join(__dirname, `../../storage/database.db`), ``); LOAD.Library.Hooks.PrintLog(`${this.name}`, `Database file created`); }
        this.db = new LOAD.Packages.Sqllite3.Database(LOAD.Packages.PathSystem.join(__dirname, `../../storage/database.db`));
        this.db.serialize(() => {
            this.db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'`, async (err, row) => {
                if (err) { LOAD.Library.Hooks.PrintLog(`${this.name}`, `Error checking database: ${err}`); process.exit(1); }
                if (!row) { 
                    await new Promise((resolve, reject) => {
                        this.db.run(`CREATE TABLE accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, hash TEXT NOT NULL, activated INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`, (err) => {
                            if (err) {}
                            this.db.run(`INSERT INTO accounts (username, hash, activated) VALUES (?, ?, ?)`, [`root`, `hzf+LiRTX1pP+v335+TaeLSAWu136Ltqs26gebv7jBw=`, 1], (err) => {
                                if (err) { LOAD.Library.Hooks.PrintLog(`${this.name}`, `Error inserting dummy account: ${err}`); process.exit(1); }
                                LOAD.Library.Hooks.PrintLog(`${this.name}`, `Welcome to AtmosphericX, we've created an admin account for you. Username: root, Password: root`);
                            });
                        });
                    });
                }
            });
        });
    }

    /**
      * @function SendDatabaseQuery
      * @description Send a database query and return the result
      * @param {string} sql - The SQL query to execute
      * @param {Array} params - The parameters to bind to the query
      * @returns {Promise<Array>} - Returns a promise that resolves with the result of the query
      */

    async SendDatabaseQuery(_sql, _params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(_sql, _params, (err, rows) => {
                if (err) {
                    LOAD.Library.Hooks.PrintLog(`${this.name}`, `Error executing query: ${err} | ${_sql}`);
                    LOAD.Library.Hooks.Log(`${this.name} : Error executing query: ${err}`);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

}


module.exports = Database;