export interface defConfigurations { 
    project_settings?: any,
    internal_settings?: any,
    sources?: any,
    hosting?: any,
}

export interface defExternal {
    manual_alert?: any,
    active_alerts?: any,
    configurations?: any,
    changelogs?: any,
    version?: defVersion
}

export interface defInternal {
    webhook_queue?: any[],
    wire?: any,
    events?: any[],
}

export interface defVersion {
    error?: boolean,
    message?: string
}

export type LogOptions = { 
    title?: string, 
    echoFile?: boolean 
}

export type LatitudeAndLongitude = {
    coords: {lat?: number, lon?: number},
    coords2?: {lat?: number, lon?: number}
}

export type HTTPOptions = {
    timeout?: number | 5000,
    headers?: Record<string, string> | {},
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any
}