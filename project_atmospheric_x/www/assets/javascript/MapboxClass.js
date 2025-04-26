

/*
              _                             _               _     __   __
         /\  | |                           | |             (_)    \ \ / /
        /  \ | |_ _ __ ___   ___  ___ _ __ | |__   ___ _ __ _  ___ \ V / 
       / /\ \| __| '_ ` _ \ / _ \/ __| '_ \| '_ \ / _ \ '__| |/ __| > <  
      / ____ \ |_| | | | | | (_) \__ \ |_) | | | |  __/ |  | | (__ / . \ 
     /_/    \_\__|_| |_| |_|\___/|___/ .__/|_| |_|\___|_|  |_|\___/_/ \_\
                                     | |                                 
                                     |_|                                                                                                                
    Written by: k3yomi@GitHuba
    Version: v7.0.0                              
*/

/**
  * @class Mapbox
  * @description Handles the creation and management of a Mapbox map, layers, stations, spotter points, and storm reports. 
  * This class integrates with Mapbox's API to render and update geographical data points, polygons, and markers.
  * 
  * The class also manages map-related UI elements and configurations for rendering radar stations, spotters, and alerts.
  */

class Mapbox { 
    constructor(_library) {
        this.library = _library
        this.storage = global
        this.widget = this.storage.configurations.widget_settings
        this.colors = this.storage.configurations.overlay_settings.color_scheme
        this.nexrad = static_nexrad_stations
        this.layers = [`mapbox-polygons`, `mapbox-nexread`, `mapbox-spotters`, `mapbox-reports`]
        this.name = `MapboxClass`
        this.library.PrintLog(`${this.name} Initialization`, `Successfully initialized ${this.name} module`)
        this._CreateMapBoxSession()
        this.UpdateThread()
        document.addEventListener('onCacheUpdate', (event) => {
            this.widget = event.detail.configurations.widget_settings
            this.colors = event.detail.configurations.overlay_settings.color_scheme
        })
    }

    /**
      * @function _CreateMapBoxSession
      * @description Creates a new Mapbox session and initializes the map with the given widget settings. 
      * If the map style isn't loaded, it waits for it to load before adding layers.
      * 
      * @async
      * @returns {Promise<void>} Resolves when the map session is created and layers are initialized.
      */   

    async _CreateMapBoxSession() {
        if (!this.storage.mapbox) {
            this.storage.mapbox = new mapboxgl.Map({...this.widget.mapbox.settings, accessToken: this.widget.mapbox.api_key})
            if (this.widget.mapbox.show_stations) { this._CreateStations() }    
            while (!this.storage.mapbox.isStyleLoaded()) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            this._CreateLayers(this.layers);    
        }
    }

    /**
      * @function _CreateStations
      * @description Creates and adds markers for radar stations on the map. The markers are styled based on user configurations and show tooltips on mouse events.
      * 
      * @async
      * @returns {Promise<void>} Resolves when all stations have been added to the map.
      */

    async _CreateStations() {
        for (let i = 0; i < this.nexrad.length; i++) {
            let station = this.nexrad[i]
            let x = station.x 
            let y = station.y
            let div = document.createElement('div')
            div.className = 'stations'
            div.innerHTML = station.station
            new mapboxgl.Marker(div).setLngLat([x, y]).addTo(this.storage.mapbox)
            div.addEventListener('mouseenter', () => {
                if (div.style.backgroundColor !== 'rgba(15, 238, 82, 0.84)') {
                    div.style.backgroundColor = 'rgba(50, 50, 50, 0.84)';
                    div.style.cursor = 'pointer';
                }
            });
            div.addEventListener('mouseleave', () => {
                if (div.style.backgroundColor !== 'rgba(15, 238, 82, 0.84)') {
                    div.style.backgroundColor = 'rgba(0, 0, 0, 0.84)';
                    div.style.cursor = 'default';
                }
            });
            div.addEventListener('click', () => {
                document.querySelectorAll('.p_station').forEach(marker => {
                    marker.style.backgroundColor = 'rgba(0, 0, 0, 0.84)';
                });
                div.style.backgroundColor = 'rgba(15, 238, 82, 0.84)';
                this.storage.station = this.nexrad[i].station
                // TODO: Add functionality to change/switch to the radar
            });
        }
    }

    /**
      * @function _CreateLayers
      * @description Adds specified layers to the map using GeoJSON data and custom styles.
      * 
      * @async
      * @param {Array<string>} _layers - An array of layer IDs to be added to the map.
      * @returns {Promise<boolean>} Resolves with `true` when all layers have been successfully added to the map.
      */

    async _CreateLayers(_layers=[]) {
        return new Promise((resolve) => {
            for (let i = 0; i < _layers.length; i++) {
                const layerId = _layers[i];
                this.storage.mapbox.addSource(layerId, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [ { type: 'Feature', geometry: { type: 'Point', coordinates: [] }, properties: { name: 'Example Point' }} ]
                    }
                });
                this.storage.mapbox.addLayer({
                    id: layerId,
                    type: 'circle',
                    source: layerId,
                    paint: { 'circle-radius': 10, 'circle-color': '#007cbf' }
                });
            }
            resolve(true);
        });
    }

    /**
      * @function _WipePointsAndPolys
      * @description Clears all points (e.g., markers) and polygons (e.g., alert polygons) from the map.
      * This method removes all previously drawn features and resets the corresponding storage.
      * 
      * @async
      * @returns {Promise<boolean>} Resolves when all points and polygons have been removed.
      */

    async _WipePointsAndPolys(_layers=[]) {
        return new Promise((resolve) => {
            let polygons = this.storage.polygons || [];
            polygons.forEach(polygonId => {
                if (this.storage.mapbox.getLayer(polygonId)) {
                    this.storage.mapbox.removeLayer(polygonId);
                }
            });
            let pointers = this.storage.points || [];
            pointers.forEach(pointer => { if (pointer.remove) { pointer.remove(); } else if (pointer.getElement) { pointer.getElement().remove() }});    
            this.storage.polygons = [];
            this.storage.points = [];
            const popups = document.querySelectorAll('.mapboxgl-popup');
            popups.forEach(popup => popup.remove());

            resolve(true);
        });
    }

    /**
      * @function _GenerateSpotterPoints
      * @description Generates and adds spotter points (markers) to the map based on the current spotter network settings and filtering options.
      * The markers' colors and tooltips are customized based on spotter data and their status (active, idle, streaming).
      * 
      * @async
      * @returns {Promise<void>} Resolves when all spotter markers have been generated and added to the map.
      */
    
    async _GenerateSpotterPoints() {
        let settings = this.widget.mapbox.spotter_network_settings
        let spotters = this.storage.spotters 
        let track = settings.spotter_network_tracking
        let scheme = this.widget.mapbox.spotter_network_settings.spotter_scheme
        for (let i = 0; i < spotters.length; i++) {
            let spotter = spotters[i]
            let color = scheme.default.color;
            let description = spotter.description.toString().replace(/\\n/g, '<br>').replace('"', '')
            if (description.includes('https://') || description.includes('http://')) {
                description = description.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
            }
            let split = description.split(`<br>`)
            if (split.length > 1) {
                for (let j = 0; j < split.length; j++) {
                    if (split[j].includes('www.') && !split[j].includes('https://') && !split[j].includes('http://')) {
                        split[j] = split[j].replace(/(www\.[\S]+)/g, '<a href="https://$1" target="_blank">$1</a>');
                    }
                }
            }
            description = split.join(`<br>`);
            if (spotter.idle == 1) { color = scheme.idle.color }
            if (spotter.active == 1) { color = scheme.active.color }
            if (spotter.streaming == 1) { color = scheme.streaming.color }
            let spotter_marker = new mapboxgl.Marker({ color: color }).setLngLat([spotter.lon, spotter.lat]).setPopup(new mapboxgl.Popup({ className: "widgets-custom-popup" }).setHTML(`<b>${description}</b>`)).addTo(this.storage.mapbox);
            if (this.storage.points == undefined) { this.storage.points = []; }
            this.storage.points.push(spotter_marker);
            spotter_marker.getElement().addEventListener('click', () => {
                let isOpen = spotter_marker.getPopup().isOpen();
                if (isOpen) {  spotter_marker.getPopup().remove(); return; }
                spotter_marker.getPopup().addTo(this.storage.mapbox);
            });
            if (track && track !== "SPOTTER_NAME_HERE" && description.includes(track)) {
                if (this.storage.eagle) { clearInterval(this.storage.eagle); }
                this.storage.eagle = setInterval(() => {
                    this.storage.mapbox.flyTo({
                        center: [spotter.lon, spotter.lat],
                        zoom: settings.spotter_network_tracking_zoom,
                        pitch: 70,
                        bearing: this.storage.mapbox.getBearing() + 1.0,
                        speed: 55.5
                    });
                }, 250.0);
                return
            }
            if (this.storage.eagle) { 
                clearInterval(this.storage.eagle); 
                this.storage.eagle = undefined;
            }
        }
    }

    /**
      * @function _GenerateAlertPolys
      * @description Generates alert polygons on the map based on active alerts. These polygons represent the geographical area of each alert.
      * The alert polygons are styled based on the alert's type and associated color scheme.
      * 
      * @async
      * @returns {Promise<void>} Resolves when all alert polygons have been generated and added to the map.
      */

    async _GenerateAlertPolys() {
        let active = this.storage.active;
        let scheme = this.colors
        let pin = false;
        active.sort((a, b) => new Date(b.details.issued) - new Date(a.details.issued))
        for (let i = 0; i < active.length; i++) {
            let alert = active[i];
            if (!alert.raw.geometry) { continue; }
            let location = alert.details.locations;
            let sender = alert.details.sender;
            let event_color = scheme.find(color => alert.details.name.toLowerCase().includes(color.type.toLowerCase())) || scheme.find(color => color.type === "Default");
            let coords = alert.raw.geometry.coordinates[0].map(point => [point[0], point[1]]);
            if (!pin && this.storage.eagle == undefined) {
                pin = true;
                this._CreatePolygon(`mapbox-polygons`,coords,event_color.color.light,`<b>${alert.details.name} (${alert.details.type})</b><br>${location}<br><br><b>Sender:</b> ${sender}`,true);
                continue;
            }
            this._CreatePolygon(`mapbox-polygons`,coords,event_color.color.light,`<b>${alert.details.name} (${alert.details.type})</b><br>${location}<br><br><b>Sender:</b> ${sender}`,false);
        }
    }

    /**
      * @function _GenerateStormReports
      * @description Generates and adds storm report markers to the map. Each report is represented as a marker with detailed information in a popup.
      * 
      * @async
      * @returns {Promise<void>} Resolves when all storm report markers have been generated and added to the map.
      */

    async _GenerateStormReports() {
        let reports = this.storage.reports
        for (let i = 0; i < reports.length; i++) {
            let report = reports[i]
            let lon = report.raw.lon
            let lat = report.raw.lat
            let description = report.details.description
            let name = report.details.name
            let locations = report.details.locations
            let reporter = report.details.sender
            let issued = report.details.issued
            let value = report.raw.value

            let marker = new mapboxgl.Marker({ color: 'white' }).setLngLat([lon, lat]).setPopup(new mapboxgl.Popup({ className: "widgets-custom-popup" }).setHTML(`<b>${name} (${locations})</b><br>${description}<br><br><b>Reporter:</b> ${reporter}<br><b>Issued:</b> ${issued}<br><b>Value:</b> ${value}`)).addTo(this.storage.mapbox);
            this.storage.points.push(marker);
            marker.getElement().addEventListener('click', () => {
                let isOpen = marker.getPopup().isOpen();
                if (isOpen) {  marker.getPopup().remove(); return; }
                marker.getPopup().addTo(this.storage.mapbox);
            });
        }
    }

    /**
      * @function _CreatePolygon
      * @description Creates and adds a custom polygon layer to the map based on given coordinates. The polygon is styled with a border color and a popup description.
      * Optionally, the map can automatically zoom to the polygon's area when it is created.
      * 
      * @async
      * @param {string} _layer - The ID of the layer where the polygon will be added.
      * @param {Array<Array<number>>} _geometry - The coordinates defining the polygon's geometry.
      * @param {string} _border - The color of the polygon's border.
      * @param {string} _description - The HTML description displayed in the polygon's popup.
      * @param {boolean} _autozoom - Flag indicating whether to automatically zoom to the polygon's area.
      * @returns {Promise<void>} Resolves when the polygon has been added to the map.
      */

    async _CreatePolygon(_layer = `default-layer`, _geometry, _border = `rgb(42,81,224)`, _description = `No Description Available`, _autozoom = true) {
        let id = Math.random().toString(36).substring(2, 15);
        if (!this.storage.mapbox.getLayer(_layer)) { return; }
        if (this.storage.polygons == undefined) { this.storage.polygons = []; }
        this.storage.polygons.push(id);
        const highlightLayer = {
            id: id,
            type: 'custom',
            onAdd: function (map, gl) {
                let vertexSource = `uniform mat4 u_matrix;attribute vec2 a_pos;void main() { gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0); }`;
                let fragmentSource = `precision mediump float;uniform vec3 u_color;void main() { gl_FragColor = vec4(${_border.replace('rgb(', '').replace(')', '').split(',').map(c => parseInt(c.trim()) / 255).join(', ')}, 1.0); }`;
                let vertexShader = gl.createShader(gl.VERTEX_SHADER);
                gl.shaderSource(vertexShader, vertexSource);
                gl.compileShader(vertexShader);
                let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                gl.shaderSource(fragmentShader, fragmentSource);
                gl.compileShader(fragmentShader);
                this.program = gl.createProgram();
                gl.attachShader(this.program, vertexShader);
                gl.attachShader(this.program, fragmentShader);
                gl.linkProgram(this.program);
                this.aPos = gl.getAttribLocation(this.program, 'a_pos');
                let coords = _geometry.map((point) => {
                    let mercator = mapboxgl.MercatorCoordinate.fromLngLat(point);
                    return [mercator.x, mercator.y];
                });
                this.buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords.flat()), gl.STATIC_DRAW);
            },
            render: function (gl, matrix) {
                gl.useProgram(this.program);
                gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'u_matrix'), false, matrix);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
                gl.enableVertexAttribArray(this.aPos);
                gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.lineWidth(3.0);
                gl.drawArrays(gl.LINE_LOOP, 0, _geometry.length);
            }
        };

        this.storage.mapbox.addLayer(highlightLayer, _layer);
        let centerLng = _geometry.reduce((sum, point) => sum + point[0], 0) / _geometry.length;
        let centerLat = _geometry.reduce((sum, point) => sum + point[1], 0) / _geometry.length;
        let popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: "widgets-custom-popup" })
            .setLngLat([centerLng, centerLat])
            .setHTML(`${_description}`);
        if (_autozoom) { popup.addTo(this.storage.mapbox); }

        if (_autozoom) {
            this.storage.mapbox.flyTo({ center: [centerLng, centerLat + 0.6], zoom: 7, speed: 0.5 });

            if (this.storage.eagle != undefined) { clearInterval(this.storage.eagle); }
        }
    }

    /**
      * @function UpdateThread
      * @description Periodically checks if the map style is loaded and updates the map with the latest points, polygons, spotter markers, and storm reports.
      * This method ensures that the map is always up to date with the latest data.
      * 
      * @async
      * @returns {Promise<void>} Resolves when the map has been updated with all relevant data.
      */

    async UpdateThread() {
        if (!this.storage.mapbox.isStyleLoaded()) {
            setTimeout(() => { this.UpdateThread() }, 1000);
            return;
        }
        await this._WipePointsAndPolys(this.layers)
        await this._GenerateAlertPolys()
        await this._GenerateSpotterPoints()
        await this._GenerateStormReports()
      
    }
}
