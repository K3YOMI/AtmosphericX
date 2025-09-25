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
			{ command: `/help`, description: `List all commands`, function: `sendHelpSignal` },
			{ command: `/activate-account`, description: `Activates an account (0/1)`, function: `sendActivateSignal`, usage: `<username> <1 = Activate | 0 = Deactivate>` },
			{ command: `/account-role`, description: `Sets a user's role (0/1)`, function: `sendRoleSignal`, usage: `<username> <0 = Default User | 1 = Administrator>` },
			{ command: `/delete-account`, description: `Deletes an account`, function: `sendDeleteAccountSignal`, usage: `<username>` },
			{ command: `/force-update`, description: `Force update all clients`, function: `sendForceSignal` },
			{ command: `/clients`, description: `Get all clients`, function: `sendClientsSignal` },
			{ command: `/clear`, description: `Clear console`, function: `sendClearSignal` },
			{ command: `/memory-dump`, description: `Create a memory dump`, function: `sendMemoryDumpSignal` },
			{ command: `/hammer-time`, description: `Stress testing`, function: `sendHammerSignal` },
		]
		this.commandListner()
	}

	/**
	  * @function handleCommand
	  * @description Handles all commands using a switch-case statement.
	  * @param {string} command - The command string (e.g., "/help")
	  * @param {Array} args - Arguments for the command
	  */

	handleCommand = async (command, args) => {
		switch (command) {
			case '/help':
				console.log(`\n`);
				console.log(`Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MiB (${Math.round((loader.packages.os.totalmem() - loader.packages.os.freemem()) / loader.packages.os.totalmem() * 100)}%)`);
				console.table(this.commands.map(cmd => ({ Command: cmd.command, Description: cmd.description, Usage: cmd.usage || `No usage` })));
				break;
			case '/activate-account': {
				let username = args[0], enable = args[1] == 1 ? 1 : 0;
				if (username && enable != undefined) {
					await loader.modules.database.runQuery(`UPDATE accounts SET activated = ? WHERE username = ?`, [enable, username]);
					loader.modules.hooks.createLog(this.name, `Account ${username} activated: ${enable}`);
					loader.modules.hooks.createOutput(this.name, `Account ${username} activated: ${enable}`);
				}
				break;
			}
			case '/account-role': {
				let username = args[0], role = parseInt(args[1]);
				if (username && role != undefined) {
					if (role == 0 || role == 1) {
						await loader.modules.database.runQuery(`UPDATE accounts SET role = ? WHERE username = ?`, [role, username]);
						loader.modules.hooks.createLog(this.name, `Account ${username} role set to: ${role == 0 ? 'Default User' : 'Administrator'}`);
						loader.modules.hooks.createOutput(this.name, `Account ${username} role set to: ${role == 0 ? 'Default User' : 'Administrator'}`);
					} else loader.modules.hooks.createOutput(this.name, `Invalid role. Use 0 for Default User or 1 for Administrator.`);
				}
				break;
			}
			case '/delete-account': {
				let username = args[0];
				if (username) {
					await loader.modules.database.runQuery(`DELETE FROM accounts WHERE username = ?`, [username]);
					loader.modules.hooks.createLog(this.name, `Account ${username} deleted`);
					loader.modules.hooks.createOutput(this.name, `Account ${username} deleted`);
				}
				break;
			}
			case '/force-update': {
				let limits = loader.static.webSocketClientLimits;
				limits.forEach(limit => Object.keys(limit).forEach(key => { limit[key].time = 0; limit[key].hasCalled = false; }));
				loader.modules.hooks.reloadConfigurations();
				loader.modules.webcalling.nextRun();
				loader.modules.webcalling.nextRun(loader.cache.twire);
				loader.modules.websocket.onCacheReady();
				loader.modules.hooks.createOutput(this.name, `Successfully forced all clients to update their data`);
				break;
			}
			case '/clients': {
				let totalClients = loader.static.webSocketClients.length, totalAccountsOnline = loader.static.accounts.filter(account => account.session).length, accountsOnline = loader.static.accounts.filter(account => account.session);
				loader.modules.hooks.createOutput(this.name, `Total clients: ${totalClients}`);
				loader.modules.hooks.createOutput(this.name, `Total sessions: ${totalAccountsOnline}`);
				if (accountsOnline.length) console.table(accountsOnline.map((account, idx) => ({ '#': idx + 1, Username: account.username, Address: account.address, Guest: account.isGuest ? 'Yes' : 'No' })));
				let dbCall = await loader.modules.database.runQuery(`SELECT * FROM accounts`);
				if (dbCall.length) console.table(dbCall.map((row, idx) => ({ '#': idx + 1, Username: row.username, Activated: row.activated ? 'Yes' : 'No', Role: row.role == 0 ? 'Default User' : 'Administrator', Created: row.created_at })));
				break;
			}k;
			case '/clear': loader.modules.hooks.displayLogo(); break;
			case '/memory-dump': require('v8').writeHeapSnapshot(); loader.modules.hooks.createOutput(this.name, `Memory dump created`); loader.modules.hooks.createLog(this.name, `Memory dump created`); break;
			case '/hammer-time': for (let i = 0; i < 25; i++) loader.modules.wire.createDebugAlert(`RAW`); break;
			default: loader.modules.hooks.createOutput(this.name, `Command not found: ${command}`);
		}
	}

	/**
	  * @function validateCommand
	  * @description Validates the command and returns the function name
	  * 
	  * @param {string} command - The command to validate
	  */

	validateCommand = function (command) {
		let foundCommand = this.commands.find((c) => c.command == command)
		if (foundCommand) { return foundCommand.command }
	}

	/**
	  * @function commandListner
	  * @description Listens for commands from the console and executes
	  */

	commandListner = function () {
		process.stdin.setEncoding(`utf8`)
		process.stdin.on(`data`, (data) => {
			let d = data.trim()
			if (d.startsWith(`/`)) {
				let command = d.split(` `)[0]
				let args = d.split(` `).slice(1)
				let validCommand = this.validateCommand(command)
				if (validCommand) {
					this.handleCommand(command, args)
					loader.modules.hooks.createLog(this.name, `Executed Command: ${d}`)
					return { success: true, message: `Command: ${d}` }
				}
				loader.modules.hooks.createOutput(this.name, `Command not found: ${d}`)
			}
		})
	}
}


module.exports = Commands;
