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


class Commands { 
    constructor() {
        this.name = `Commands`;
        loader.modules.hooks.createOutput(this.name, `Successfully initialized ${this.name} module`);
        loader.modules.hooks.createLog(this.name, `Successfully initialized ${this.name} module`);
        this.commands = [
            {command: `/help`, description: `List all commands`, function: `sendHelpSignal`},
            {command: `/activate`, description: `Activates an account`, function: `sendActivateSignal`, usage: `<username> <true/false>`},
            {command: `/set-role`, description: `Sets a user's role (0/1)`, function: `sendRoleSignal`, usage: `<username> <0 = Default User | 1 = Administrator>`},
            {command: `/del-account`, description: `Deletes an account`, function: `sendDeleteAccountSignal`, usage: `<username>`},
            {command: `/force`, description: `Force update all clients`, function: `sendForceSignal`},
            {command: `/clients`, description: `Get all clients`, function: `sendClientsSignal`},
            {command: `/safe-close`, description: `Close app safely`, function: `sendExitSignal`},
            {command: `/debug-xml`, description: `Debug XML alerts`, function: `sendDebugXmlSignal`},
            {command: `/debug-raw`, description: `Debug raw alerts`, function: `sendDebugRawSignal`},
            {command: `/debug-ugc`, description: `Debug raw alerts`, function: `sendDebugUgcSignal`},
            {command: `/clear`, description: `Clear console`, function: `sendClearSignal`},
            {command: `/memory-dump`, description: `Create a memory dump`, function: `sendMemoryDumpSignal`},
            {command: `/hammer-time`, description: `Stress testing`, function: `sendHammerSignal`},
        ]
        this.commandListner()
    }

    /**
      * @function sendClientsSignal
      * @description Sends a signal to the console with the total number of clients connected to the WebSocket server.
      */

    sendClientsSignal = function() {
        let totalClients = loader.static.webSocketClients.length
        loader.modules.hooks.createOutput(this.name, `Total clients: ${totalClients}`)
    }


    sendDebugUgcSignal = async function(args) {
		let start = new Date().getTime()
    	let ugc = args[0]
      	if (ugc != undefined) {
        	let zones = loader.modules.ugc.getZones(ugc)
        	let locations = await loader.modules.ugc.getLocations(zones)
        	loader.modules.hooks.createOutput(this.name, `Translated Locations: ${locations} (${locations.length}) (${new Date().getTime() - start}ms)`)
      	}
  	}

    /**
      * @function sendDebugRawSignal
      * @description Sends a raw debug alert
      * 
      * @note relies on previous cached alerts in nwws-oi storage
      */

    sendDebugRawSignal = function() {
        loader.modules.listener.createDebugAlert(`RAW`)
    }

    /**
      * @function sendDebugXmlSignal
      * @description Sends a debug XML alert\
      * 
      * @note relies on previous cached alerts in nwws-oi storage
      */

    sendDebugXmlSignal = function() {
        loader.modules.listener.createDebugAlert(`XML`)
    }

    /**
      * @function sendExitSignal
      * @description Sends an exit signal to the application, stopping all processes and exiting the application.
      */

    sendExitSignal = function() {
        if (loader.static.wiresession != undefined) {
            loader.static.wiresession.send(loader.packages.xmpp.xml('presence', {  type: 'unavailable' }));
            loader.static.wiresession.stop()
        }
        setTimeout(() => { loader.modules.hooks.createOutput(this.name, `Exiting...`); process.exit(0) }, 500)
    }

    /**
      * @function sendForceSignal
      * @description Forces all clients to update their data by resetting the cache and notifying the WebSocket clients.
      */

    sendForceSignal = async function() {
        let limits = loader.static.webSocketClientLimits
        for (let i = 0; i < limits.length; i++) {
            Object.keys(limits[i]).forEach(key => { limits[i][key].time = 0; limits[i][key].hasCalled = false; });
        }
        loader.modules.hooks.reloadConfigurations()
        loader.modules.webcalling.nextRun()
        loader.modules.webcalling.nextRun(loader.cache.twire)
        loader.modules.websocket.onCacheReady()
        loader.modules.hooks.createOutput(this.name, `Successfully forced all clients to update their data`)
    }

    /**
      * @function sendHammerSignal
      * @description Sends a hammer signal to the console to stress test the application.
      */

    sendHammerSignal = async function() {
        for (let i = 0; i < 25; i++) {
            loader.modules.listener.createDebugAlert(`RAW`) 
        }
    }

    /**
      * @function sendDeleteAccountSignal
      * @description Deletes an account from the database based on the provided username.
      * 
      * @param {Array} args - An array containing the username of the account to delete.
      *  - args[0] {string} - The username of the account to delete.
      */ 

    sendDeleteAccountSignal = async function(args) {
        let username = args[0]
        if (username != undefined) {
            await loader.modules.database.runQuery(`DELETE FROM accounts WHERE username = ?`, [username])
            loader.modules.hooks.createLog(this.name, `Account ${username} deleted`)
            loader.modules.hooks.createOutput(this.name, `Account ${username} deleted`)
        }
    }

    /**
      * @function sendMemoryDumpSignal
      * @description Creates a memory dump of the current process and saves it to the current working directory.
      */

    sendMemoryDumpSignal = function() {
        require('v8').writeHeapSnapshot();
        loader.modules.hooks.createOutput(this.name, `Memory dump created`)
        loader.modules.hooks.createLog(this.name, `Memory dump created`)
    }

    /**
      * @function sendClearSignal
      * @description Clears the console and displays the logo
      */

    sendClearSignal = function() {
        loader.modules.hooks.displayLogo()
    }

    /**
      * @function sendActivateSignal
      * @description Activates or deactivates an account based on the provided username and activation status.
      * 
      * @param {Array} args - An array containing the username and activation status (true/false).
      *  - args[0] {string} - The username of the account to activate/deactivate.
      *  - args[1] {string} - The activation status (true/false).
      */

    sendActivateSignal = async function(args) {
        let username = args[0]
        let enable = (args[1] === `true`) ? 1 : 0
        if (username != undefined && enable != undefined) {
            await loader.modules.database.runQuery(`UPDATE accounts SET activated = ? WHERE username = ?`, [enable, username])
            loader.modules.hooks.createLog(this.name, `Account ${username} activated: ${enable}`)
            loader.modules.hooks.createOutput(this.name, `Account ${username} activated: ${enable}`)
        }
    }

	/**
	  * @function sendRoleSignal
	  * @description Sets the role of an account based on the provided username and role.
	  *
	  * @param {Array} args - An array containing the username and role.
	  *  - args[0] {string} - The username of the account to set the role for.
	  *  - args[1] {number} - The role to set (0 for Default User, 1 for Administrator).
	  */

	sendRoleSignal = async function(args) {
		let username = args[0]
		let role = parseInt(args[1])
		if (username != undefined && role != undefined) {
			if (role === 0 || role === 1) {
				await loader.modules.database.runQuery(`UPDATE accounts SET role = ? WHERE username = ?`, [role, username])
				loader.modules.hooks.createLog(this.name, `Account ${username} role set to: ${role === 0 ? 'Default User' : 'Administrator'}`)
				loader.modules.hooks.createOutput(this.name, `Account ${username} role set to: ${role === 0 ? 'Default User' : 'Administrator'}`)
			}
			else {
				loader.modules.hooks.createOutput(this.name, `Invalid role. Use 0 for Default User or 1 for Administrator.`)
			}
		}
	}

    /**
      * @function sendHelpSignal
      * @description Sends help interface to the console to show all commands and their descriptions
      */
 
    sendHelpSignal = function() {
        console.log(`\n`)
        console.log(`Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MiB (${Math.round((loader.packages.os.totalmem() - loader.packages.os.freemem()) / loader.packages.os.totalmem() * 100) + '%'})`)
        console.table(this.commands.map((cmd) => {
            return { Command: cmd.command, Description: cmd.description, Usage: cmd.usage ? cmd.usage : `No usage` }
        }))
    }

    /**
      * @function validateCommand
      * @description Validates the command and returns the function name
      * 
      * @param {string} command - The command to validate
      */

    validateCommand = function(command) { 
        let foundCommand = this.commands.find((c) => c.command === command)
        if (foundCommand) { return foundCommand.function }
    }

    /**
      * @function commandListner
      * @description Listens for commands from the console and executes
      */

    commandListner = function() { 
        process.stdin.setEncoding(`utf8`)
        process.stdin.on(`data`, (data) => {
            let d = data.trim()
            if (d.startsWith(`/`)) {
                let find = this.validateCommand(d.split(` `)[0])
                if (find) { 
                    this[find](d.split(` `).slice(1)) 
                    loader.modules.hooks.createLog(this.name, `Executed Comamnd: ${d}`)
                    return {success: true, message: `Command: ${d}`}
                } 
                loader.modules.hooks.createOutput(this.name, `Command not found: ${d}`)
            }
        })
    }
}


module.exports = Commands;