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


export class Alerts { 
    name: string
    constructor() {
        this.name = `submodule:networking`;
        this.initalize()
    }

    private initalize() {
        loader.submodules.utils.log(`${this.name} initialized.`)
        this.getUpdates();
        this.updateCache();
    }

    private async getDataFromSource(url: string): Promise<{error: boolean, message: any}> {
        try {
            const resp: any = await this.httpRequest(url);
            if (resp.error) { return { error: true, message: `Error fetching data from ${url}` }; }
            return { error: false, message: resp.message };
        } catch (e) {
            return { error: true, message: `Exception fetching data from ${url}: ${e}` };
        }
    }

    public httpRequest(url: string, options?: types.HTTPOptions): Promise<any> {
        return new Promise(async (resolve) => {
            try { 
                const config = loader.cache.internal.configurations as types.defConfigurations;
                const isOptionsProvided = options !== undefined;
                if (!isOptionsProvided) {
                    options = {
                        timeout: config.internal_settings.request_timeout * 1000,
                        headers: {
                            "User-Agent": `AtmosphericX/${loader.submodules.utils.version()}`,
                            "Accept": "application/geo+json, text/plain, */*; q=0.",
                            "Accept-Language": "en-US,en;q=0.9",
                        },
                        method: 'GET',
                        body: null,
                    }
                }
                const response = await loader.packages.axios.get(url, {
                    headers: options.headers,
                    maxRedirects: 0,
                    timeout: options.timeout,
                    httpsAgent: new loader.packages.https.Agent({ rejectUnauthorized: false }),
                    validateStatus: (status: number) => status == 200 || status == 500,
                });
                const { data: responseMessage } = response;
                return resolve({message: responseMessage, error: false});
            } catch (error) {
                return resolve({message: error, error: true});
            }
        });
    }

    public getUpdates(): Promise<{error: boolean, message: string}> {
        return new Promise(async (resolve) => {
            const onlineVersion = await this.httpRequest(`https://raw.githubusercontent.com/k3yomi/AtmosphericX/main/version`, undefined)
            const onlineChangelogs = await this.httpRequest(`https://raw.githubusercontent.com/k3yomi/AtmosphericX/main/changelogs-history.json`, undefined)
            const offlineVersion = loader.submodules.utils.version();

            if (onlineVersion.error == true || onlineChangelogs.error == true) { loader.submodules.utils.log(loader.strings.updated_required_failed, {echoFile: true}); return resolve({error: true, message: `Failed to check for updates.`}); }

            const onlineVersionParsed = onlineVersion.message.replace(/\n/g, ``);
            const onlineChangelogsParsed = onlineChangelogs.message[onlineVersion] ? 
                onlineChangelogs.message[onlineVersionParsed].changelogs.join(`\n\t`) : `No changelogs available.`;
            loader.cache.external.version = onlineVersionParsed;
            loader.cache.external.changelogs = onlineChangelogsParsed;

            const isNewerVersionDiscovered = (a: string, b: string) => {
                const [ma, mi, pa] = a.split(".").map(Number);
                const [mb, mi2, pb] = b.split(".").map(Number);
                return ma > mb || (ma === mb && mi > mi2) || (ma === mb && mi === mi2 && pa > pb);
            }

            if (isNewerVersionDiscovered(onlineVersionParsed, offlineVersion)) {
                loader.submodules.utils.log(loader.strings.updated_requied.replace(`{X_ONLINE_PARSED}`, onlineVersionParsed).replace(`{X_OFFLINE_VERSION}`, offlineVersion).replace(`{X_ONLINE_CHANGELOGS}`, onlineChangelogsParsed), {echoFile: true});
            }
            return {error: false, message: `Update check completed.`};
        });
    }

    public updateCache(isWire?: Record<string, any>): Promise<void> {
        return new Promise(async (resolve) => {
            const defConfig = loader.cache.internal.configurations as types.defConfigurations;
            const { atmosphericx_alerts_settings, ...sources } = defConfig.sources;
            const setTime = new Date().getTime();
            const structure = [];
            let data = {};
            let results = ``;
        
            if (isWire == undefined) {
                for (const topic in sources) {
                    for (const [key, value] of Object.entries(sources[topic])) {
                        const source = value as Record<string, unknown>;
                        structure.push({
                            name: key,
                            url: source.endpoint,
                            enabled: source.enabled,
                            cache: source.cache_time,
                            contradictions: source.contradictions || [],
                        })
                    }
                }
                for (const source of structure.filter(s => s.enabled).sort((a, b) => a.cache - b.cache)) {
                    source.contradictions.forEach((contradiction: string) => {
                        let index = structure.findIndex((h: any) => h.name == contradiction);
                        if (index !== -1 && structure[index].enabled && source.enabled) {
                            loader.submodules.utils.log({message: `Evoking contradiction: ${source.name} disables ${structure[index].name}`, echoFile: true});
                            structure[index].enabled = false;
                        }
                    });
                }
                const active = structure.filter(s => s.enabled);
                await Promise.all(active.map(async (source: any) => {
                     if (!loader.cache.internal.http_timers[source.name] || setTime - loader.cache.internal.http_timers[source.name] > source.cache * 1000) {
                        loader.cache.internal.http_timers[source.name] = setTime;
                        for (let retries = 0; retries < 3; retries++) {
                            const resp = await this.getDataFromSource(source.url)
                            if (resp.error) { 
                                if (retries == 2) {
                                    data[source.name] = undefined;
                                    results += `${source.name.slice(0, 10)}... (failed) `;
                                }
                                loader.submodules.utils.log({message: `Error fetching data from ${source.name.slice(0, 10)}}... Retrying... (${retries + 1}/3)`, echoFile: true});
                                continue;
                            }
                            data[source.name] = resp.message;
                            results += `${source.name.slice(0, 10)}... (ok) `;
                            break;
                        }
                     }
                }));
            }
            if (Object.keys(data).length > 0) {
                if (results) loader.submodules.utils.log(`Cache Updated: ${results.trim()} - Taken: ${Date.now() - setTime}ms`, {echoFile: true});
                loader.submodules.structure.create(data, isWire)
            }
            resolve();
        })
    }
}

export default Alerts;

