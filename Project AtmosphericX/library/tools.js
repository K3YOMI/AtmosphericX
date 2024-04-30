
class tools {
    constructor() {
        console.log(`[AtmosphericX Library] >> Loaded Tools Manager`);
        this.format = "returned from tools.js";
    }
    env(envPath) {
        let envFileContent = fs.readFileSync(envPath, 'utf8');
        let envVariables = {};
        envFileContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (value && !value.startsWith('#')) {
                envVariables[key] = value.replace('\r', '');
            }
        });
        return envVariables;
    }
    canAccess(clientAddresss) {
        return configurations['API_ACCESS'].includes(clientAddresss) || configurations['API_ACCESS'].includes('*');
    }
    log(message) {
        let date = new Date();
        let time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        console.log(`[AtmosphericX] >> ${time} >> ${message}`);
    }
}


module.exports = tools;
