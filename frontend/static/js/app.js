// API Endpoint
const trafficAPI = 'http://34.253.207.153/api/fcdgeom/'

// Variables
let tCurrent = Date.now() / 1000;
let timestamp = tCurrent
let lat = 48.910718;
let lon = 8.71003;
let aqiToken = '4e076acf3306c7d8776893d2651a096cf0be2156';



// DOM Elements
const timeslider = $("#timeslider");
const timeElement = $("#timeelement");


// Initialize Map
let map = L.map('map', {});
map.setView([lat, lon], 14);

// Bounds
let bounds = map.getBounds();
bounds = `${bounds.getNorth()},${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()}`;


// Add Basemaps
const osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '| &copy; OSM Mapnik <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

const positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '| &copy; OpenStreetMap, &copy; CartoDB'
}).addTo(map);

const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '| &copy; OpenStreetMap, &copy; CartoDB'
});

const esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '| Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

let baseMaps = {
    "CartoDB Positron": positron,
    "CartoDB Dark": dark,
    "OpenStreetMap": osm,
    "ESRI World Imagery": esri

};

// Add FCD Layers Styling
function getColor(d) {
    return d > 80 ? '#0E970E' :
        d > 40 ? '#F1F627' :
            '#FF5733';
}

function fcdStyle(feature) {
    return {
        color: getColor(feature.properties.speed),
        weight: 5,
    };
}

// Add FCD Layers
let inrixTraffic = L.geoJSON(null, {
    style: fcdStyle,
    onEachFeature: function (feature, layer) {
        layer.bindTooltip(`${feature.properties.speed.toString()} km/h`);
    }
}).addTo(map);

let hereTraffic = L.geoJSON(null, {
    style: fcdStyle,
    onEachFeature: function (feature, layer) {
        layer.bindTooltip(`${feature.properties.speed.toString()} km/h`);
    }
});

let tomtomTraffic = L.geoJSON(null, {
    style: fcdStyle,
    onEachFeature: function (feature, layer) {
        layer.bindTooltip(`${feature.properties.speed.toString()} km/h`);
    }
});



// Fetch Data
async function fetchData(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
};

// Fetch Traffic Layers
function trafficLayer(tUrl, tLayer) {
    (async () => {
        let trafficData = await fetchData(tUrl)
        tLayer.clearLayers();
        tLayer.addData(trafficData[0]['traffic']);
    })();

}

// Load Datasets
// FCD
function loadFCData(timestamp) {
    let t = (((new Date(parseInt(timestamp * 1000))).toLocaleString()).replace('T', ' ')).replace('Z', ' ');
    // let t = (new Date(parseInt(timestamp*1000))).toUTCString();
    timeElement.html(t.slice(0, 22));

    // Traffic URLs
    let inrixTrafficUrl = `${trafficAPI}inrix?tQuery=${timestamp}`;
    let hereTrafficUrl = `${trafficAPI}here?tQuery=${timestamp}`;
    let tomtomTrafficUrl = `${trafficAPI}tomtom?tQuery=${timestamp}`;

    // Load Layers
    trafficLayer(inrixTrafficUrl, inrixTraffic);
    trafficLayer(hereTrafficUrl, hereTraffic);
    trafficLayer(tomtomTrafficUrl, tomtomTraffic);

};

// TODO : Add weather data
// Weather
function loadWeatherData(timestamp, lat, lon) {
    let weatherUrl = `http://api.weatherapi.com/v1/current.json?key=a219d673b1b843bc8ce214607210601&q=${lat},${lon}&unixdt=${timestamp}`
}


// AQI
// https://aqicn.org/faq/2015-09-18/map-web-service-real-time-air-quality-tile-api/
let waqiAttr = '| Air  Quality  Tiles  &copy;  <a  href="http://waqi.info">waqi.info</a>';
let waqiUrl = `https://tiles.waqi.info/tiles/usepa-aqi/{z}/{x}/{y}.png?token=${aqiToken}`;
let wAQI = L.tileLayer(waqiUrl, { attribution: waqiAttr }).addTo(map);



// CAMS
// Round dates for CAMS
// https://stackoverflow.com/questions/10789384/round-a-date-to-the-nearest-5-minutes-in-javascript
let getRoundedDate = (minutes, d = new Date()) => {

    let ms = 1000 * 60 * minutes; // convert minutes to ms
    let roundedDate = new Date(Math.round(d.getTime() / ms) * ms);

    return roundedDate
};

// CAMS  Layers
let extent = L.latLngBounds(L.latLng(47, 5), L.latLng(55, 15));
let camsUrl = 'https://apps.ecmwf.int/wms/?token=public&request=GetCapabilities&version=1.3.0';
let year = (new Date ()).getFullYear();;
let camsAttr = '| Generated using Copernicus Atmosphere Monitoring Service Information '+ year+'';

// Create CAMS Layers

function createCAMS(camsUrl, layer) {
    let camsLayer = L.tileLayer.wms(camsUrl, {
        layers: layer,
        format: 'image/png',
        transparent: true,
        bounds: extent,
        attribution: camsAttr,

    });
    return camsLayer;
};

// TODO CLEAN CODE: Create a CAMS object and iterate to create/update layers and legends
let camsP25 = createCAMS(camsUrl, 'composition_europe_pm2p5_forecast_surface')
let camsP10 = createCAMS(camsUrl, 'composition_europe_pm10_forecast_surface')
let camsNO2 = createCAMS(camsUrl, 'composition_europe_no2_forecast_surface')
let camsSO2 = createCAMS(camsUrl, 'composition_europe_so2_forecast_surface')


// Update CAMS layers based on the timestamp
function updateCAMS(timestamp) {
    let camsTime = (getRoundedDate(60, new Date(parseInt(timestamp * 1000)))).toISOString();
    camsP25.setParams({ time: camsTime, });
    camsP10.setParams({ time: camsTime, });
    camsNO2.setParams({ time: camsTime, });
    camsSO2.setParams({ time: camsTime, });

};

// Legends
// FCD Legend
function fcdLegend(layer, name) {
    let legend = L.control.htmllegend({
        position: 'bottomleft',
        legends: [{
            name: name,
            layer: layer,
            elements: [{
                label: '',
                html: `<br><br>
                <table>
                <caption>km/h</caption>
                                <tr>
                                  <td style="background-color: #0E970E; width: 20px;">&nbsp;</td>
                                  <td> > 80</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #F1F627;">&nbsp;</td>
                                  <td> 40 - 80</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #FF5733;">&nbsp;</td>
                                  <td> 0 - 40</td>
                                </tr>                             
                              </table>`
            }]
        }],
        defaultOpacity: 0.5,
        collapseSimple: false,
        detectStretched: true,
        visibleIcon: 'icon icon-eye',
        hiddenIcon: 'icon icon-eye-slash',
    }).addTo(map);

    return legend;
};

fcdLegend(inrixTraffic, 'INRIX');
fcdLegend(hereTraffic, 'HERE');
fcdLegend(tomtomTraffic, 'TomTom');

// WAQI Legend
L.control.htmllegend({
    position: 'bottomleft',
    legends: [{
        name: 'World AQI',
        layer: wAQI,
        elements: [{
            label: '',
            html: `
            <br><br>
                <table>
                <caption>Air Quality Levels</caption>
                                <tr>
                                  <td style="background-color: #7e0023; width: 20px;">&nbsp;</td>
                                  <td> > 300 (Hazardous)</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #660099;">&nbsp;</td>
                                  <td>201 - 300 (V. Unhealthy)</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #cc0033;">&nbsp;</td>
                                  <td>151 - 200 (Unhealthy)</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #ff9933;">&nbsp;</td>
                                  <td>101 - 150 (Risk Groups)</td>
                                </tr>  
                                <tr>
                                  <td style="background-color: #ffde33;">&nbsp;</td>
                                  <td>51 - 100 (Moderate)</td>
                                </tr>  
                                <tr>
                                  <td style="background-color: #009966;">&nbsp;</td>
                                  <td>0 - 50 (Good)</td>
                                </tr>                               
                              </table>
            `
        }]
    }],
    defaultOpacity: 1,
    collapseSimple: false,
    detectStretched: true,
    visibleIcon: 'icon icon-eye',
    hiddenIcon: 'icon icon-eye-slash',
}).addTo(map);


// CAMS legend
function camsLegend(layer, name) {
    let legend = L.control.htmllegend({
        position: 'bottomleft',
        legends: [{
            name: name,
            layer: layer,
            elements: [{
                label: '',
                html: `<br><br>
                <table>
                <caption>µg/m<sup>3</sup></caption>
                                <tr>
                                  <td style="background-color: #f00081; width: 20px;">&nbsp;</td>
                                  <td>200 - 500</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #fa3c3c;">&nbsp;</td>
                                  <td>150 - 200</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #f08127;">&nbsp;</td>
                                  <td>100 - 150</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #e5af2d;">&nbsp;</td>
                                  <td>75 - 100</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #e5dc31;">&nbsp;</td>
                                  <td>50 - 75</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #a0e531;">&nbsp;</td>
                                  <td>40 - 50</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #50f050;">&nbsp;</td>
                                  <td>30 - 40</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #00dc00;">&nbsp;</td>
                                  <td>20 - 30</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #50a4f4;">&nbsp;</td>
                                  <td>10 - 20</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #2781f0;">&nbsp;</td>
                                  <td>5 - 10</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #1363d1;">&nbsp;</td>
                                  <td>2 - 5</td>
                                </tr>
                                <tr>
                                  <td style="background-color: #dcdcdc;">&nbsp;</td>
                                  <td> > 2</td>
                                </tr>
                              
                              </table>`
            }]
        }],
        defaultOpacity: 0.5,
        collapseSimple: false,
        detectStretched: true,
        visibleIcon: 'icon icon-eye',
        hiddenIcon: 'icon icon-eye-slash',
    }).addTo(map);

    return legend;
}

camsLegend(camsP25, 'Particulate Matter: < 2.5µm');
camsLegend(camsP10, 'Particulate Matter: < 10µm');
camsLegend(camsNO2, 'Nitrogen Dioxide');
camsLegend(camsSO2, 'Sulphur Dioxide');


// MAP Controls
let overlayMaps = {
    "FCD Speeds": {
        "INRIX": inrixTraffic,
        "HERE": hereTraffic,
        "TomTom": tomtomTraffic,
    },
    "Copernicus Atmosphere Monitoring Service - CAMS": {
        "PM 2.5": camsP25,
        "PM 10": camsP10,
        "NO2": camsNO2,
        "SO2": camsSO2,

    },
    "Air Quality Sensors": {
        "World Air Quality Index": wAQI,
    }
};


let options = {
    exclusiveGroups: ['FCD Speeds', 'Copernicus Atmosphere Monitoring Service - CAMS'],
    groupCheckboxes: false
};

let layerControl = L.control.groupedLayers(baseMaps, overlayMaps, options).addTo(map);

// On Load
$(document).ready(function () {
    loadFCData(tCurrent);
    updateCAMS(tCurrent);
    timeslider.attr('min', tCurrent - 84000);
    timeslider.attr('max', tCurrent + 84000);
    timeslider.attr('value', tCurrent);
    timeslider.attr('step', 600);

});

// On Slide
timeslider.on("input change", function (e) {
    timestamp = $(this).val()
    updateCAMS(timestamp);
    if (timestamp > tCurrent) {
        loadFCData(tCurrent);
    } else {
        loadFCData(timestamp);
        
    }

})

// On Map Move
map.on("moveend", function () {
    lat = L.latLng(map.getCenter()).lat
    lon = L.latLng(map.getCenter()).lng
    bounds = map.getBounds();
    let boundsNew = `${bounds.getNorth()},${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()}`;

});



