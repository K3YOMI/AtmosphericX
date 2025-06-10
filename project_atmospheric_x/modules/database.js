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
      * 
      * 
      * Schema:
      * Default Account: root
      * Password : root
      * Role: 1 (Administrator) // 0 = Default User
      */

    createDatabase = function() {
        let dbPath = loader.packages.path.join(__dirname, `../../storage/database.db`);
        this.db = new loader.packages.sqlite3(dbPath);
        try {
            this.db.prepare(`CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, hash TEXT NOT NULL, activated INTEGER NOT NULL DEFAULT 0, role INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
            let rootExists = this.db.prepare(`SELECT 1 FROM accounts WHERE username = ?`).get('root');
            if (rootExists === undefined) {
                this.db.prepare(`INSERT INTO accounts (username, hash, role, activated) VALUES (?, ?, ?, ?)`).run('root', 'hzf+LiRTX1pP+v335+TaeLSAWu136Ltqs26gebv7jBw=', 1, 1);
                loader.modules.hooks.createLog(`${this.name}.createDatabase`, `Database created, created root account with the password: root`);
                loader.modules.hooks.createOutput(`${this.name}.createDatabase`, `Database created, created root account with the password: root`);
            } else {
                loader.modules.hooks.createLog(`${this.name}.createDatabase`, `Database created, root account already exists`);
                loader.modules.hooks.createOutput(`${this.name}.createDatabase`, `Database created, root account already exists`);
            }
            return {status: true, message: `Database created`};
        } catch (err) {
            loader.modules.hooks.createLog(`${this.name}.createDatabase`, `Failed to create database: ${err.message}`);
            return {status: false, message: `Failed to create database`};
        }
    }

    /**
      * @function modifiedChangesCheck
      * @description This function is used to ensure that all accounts have a defined setting as some updates may hinder checks.
      */

    modifiedChangesCheck = function() {
        let rows = this.runQuery(`SELECT * FROM accounts`);
        if (rows.length > 0) {
            rows.forEach(row => {
                if (row.role == undefined) { 
                    this.runQuery(`ALTER TABLE accounts ADD COLUMN role INTEGER DEFAULT 0`); 
                    this.runQuery(`UPDATE accounts SET role = ? WHERE id = ?`, [0, row.id]);
                }
            });
        }
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
        this.db = new loader.packages.sqlite3(loader.packages.path.join(__dirname, `../../storage/database.db`));
        this.modifiedChangesCheck()
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

    runQuery = function(query, params = []) { 
        try {
            if (!Array.isArray(params)) params = [];
            let stmt = this.db.prepare(query);
            if (/^\s*select/i.test(query)) {
                let rows = stmt.all(...params);
                return rows;
            } else {
                let result = stmt.run(...params);
                return result;
            }
        } catch (err) {
            loader.modules.hooks.createLog(`${this.name}.runQuery`, `Query failed: ${err.message}`);
            return [];
        }
    }
}


module.exports = Database;