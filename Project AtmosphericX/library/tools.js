
class tools {
    constructor() {
        console.log(`[AtmosphericX Library] >> Loaded Tools Manager`);
        this.format = "returned from tools.js";
    }
    env(envPath) {
        try {
            let envFileContent = fs.readFileSync(envPath, 'utf8');
            let envVariables = JSON.parse(envFileContent);
            return envVariables;
        } catch (error) {
            toolsConstructor.log(`[Error] [tools.env] >> ${error.message}`);
        }
    }
    canAccess(clientAddresss) {
        return configurations['API_ACCESS'].includes(clientAddresss) || configurations['API_ACCESS'].includes('*');
    }
    log(message) {
        let date = new Date().toLocaleString();
        console.log(`[AtmosphericX] >> ${date} >> ${message}`);
    }
}


module.exports = tools;
