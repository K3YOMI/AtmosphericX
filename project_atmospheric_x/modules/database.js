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
    Version: 7.0.5                             
*/


let loader = require(`../loader.js`)


class Database { 
    constructor() {
        this.name = `Database`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
        this.checkDatabase()
    }

    /**
      * @function createDatabase
      * @description Creates a new SQLite database and initializes the accounts table with a root account.
      */
    
    createDatabase = function() {
        loader.packages.fs.writeFileSync(loader.packages.path.join(__dirname, `../../storage/database.db`), ``);
        this.db = new loader.packages.sqlite3.Database(loader.packages.path.join(__dirname, `../../storage/database.db`));
        this.db.serialize(async () => {
            await this.db.run(`CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, hash TEXT NOT NULL, activated INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
            await this.db.run(`INSERT INTO accounts (username, hash, activated) VALUES (?, ?, ?)`, [`root`, `hzf+LiRTX1pP+v335+TaeLSAWu136Ltqs26gebv7jBw=`, 1], (err) => {})
            loader.modules.hooks.createLog(`${this.name}.createDatabase`, `Database created, created root account with the password: root`)
            loader.modules.hooks.createOutput(`${this.name}.createDatabase`, `Database created, created root account with the password: root`)
            return {status: true, message: `Database created`}
        })
    }

    /**
      * @function checkDatabase
      * @description Checks if the database file exists. If it does not, it creates a new database and initializes the accounts table with a root account.
      */

    checkDatabase = function() {
        let exists = loader.packages.fs.existsSync(loader.packages.path.join(__dirname, `../../storage/database.db`));
        if (!exists) { 
            this.createDatabase(); 
            return {status: false, message: `Database does not exist, creating database...` }; 
        }
        this.db = new loader.packages.sqlite3.Database(loader.packages.path.join(__dirname, `../../storage/database.db`));
        loader.modules.hooks.createOutput(this.name, `Database has successfully loaded`);
    }

    /**
      * @function runQuery
      * @description Executes a SQL query on the database and returns the result.
      * 
      * @param {string} query - The SQL query to execute.
      * @param {Array} params - An array of parameters to bind to the query.
      * @return {Promise<Array>} - A promise that resolves to an array of rows returned by the query.
      */

    runQuery = async function(query, params) { 
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) { resolve([]); }
                resolve(rows || []);
            });
        });
    }
}


module.exports = Database;