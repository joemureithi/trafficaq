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
bounds =
    bounds.getNorth() +
    "," +
    bounds.getWest() +
    "," +
    bounds.getSouth() +
    "," +
    bounds.getEast();


// Add Basemaps
const osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; OSM Mapnik <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

const positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap, &copy; CartoDB'
}).addTo(map);

const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap, &copy; CartoDB'
});

const esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
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
        // console.log(trafficData[0][' traffic']);
        tLayer.clearLayers();
        tLayer.addData(trafficData[0]['traffic']);
    })();

}

// Load Datasets
// FCD
function loadFCData(timestamp) {
    // Time Element
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


// Weather
function loadWeatherData(timestamp, lat, lon) {
    // console.log(`Timestamp: ${new Date(parseInt(timestamp * 1000)).toLocaleString()}, Lat: ${lat}, Lon: ${lon}`)
    let weatherUrl = `http://api.weatherapi.com/v1/current.json?key=a219d673b1b843bc8ce214607210601&q=${lat},${lon}&unixdt=${timestamp}`
}


// AQI
// https://aqicn.org/faq/2015-09-18/map-web-service-real-time-air-quality-tile-api/
let waqiAttr = 'Air  Quality  Tiles  &copy;  <a  href="http://waqi.info">waqi.info</a>';
let waqiUrl = `https://tiles.waqi.info/tiles/usepa-aqi/{z}/{x}/{y}.png?token=${aqiToken}`;
let wAQI = L.tileLayer(waqiUrl, { attribution: waqiAttr}).addTo(map);



// CAMS
// Round dates for CAMS
// https://stackoverflow.com/questions/10789384/round-a-date-to-the-nearest-5-minutes-in-javascript
let getRoundedDate = (minutes, d = new Date()) => {

    let ms = 1000 * 60 * minutes; // convert minutes to ms
    let roundedDate = new Date(Math.round(d.getTime() / ms) * ms);

    return roundedDate
};

// Load CAMS  Layers
let extent = L.latLngBounds(L.latLng(47, 5), L.latLng(55, 15));
let camsUrl = 'https://apps.ecmwf.int/wms/?token=public&request=GetCapabilities&version=1.3.0';
// PM2.5
let camsP25 = L.tileLayer.wms(camsUrl, {
    layers: 'composition_europe_pm2p5_forecast_surface',
    format: 'image/png',
    transparent: true,
    opacity: 0.7,
    useCache: true,
    bounds: extent,


});
// PM10
let camsP10 = L.tileLayer.wms(camsUrl, {
    layers: 'composition_europe_pm10_forecast_surface',
    format: 'image/png',
    transparent: true,
    opacity: 0.7,
});


// Update CAMS layers based on the timestamp
function updateCAMS(timestamp) {
    let camsTime = (getRoundedDate(60, new Date(parseInt(timestamp * 1000)))).toISOString();
    console.log(camsTime);
    camsP25.setParams({ time: camsTime, });
    camsP10.setParams({ time: camsTime, });

};


// On Load
$(document).ready(function () {
    console.log("GO!");
    loadFCData(tCurrent);
    updateCAMS(tCurrent);
    timeslider.attr('min', tCurrent - 84000);
    timeslider.attr('max', tCurrent);
    timeslider.attr('value', tCurrent);
    timeslider.attr('step', 600);

});

// On Slide
timeslider.on("input change", function (e) {
    timestamp = $(this).val()
    // console.log(timestamp);
    loadFCData(timestamp);
    updateCAMS(timestamp);

})

// On Map Move
map.on("moveend", function () {
    // console.log(L.latLng(map.getCenter()))
    lat = L.latLng(map.getCenter()).lat
    lon = L.latLng(map.getCenter()).lng
    // loadWeatherData(timestamp, lat, lon);
    bounds = map.getBounds();
    let boundsNew =
        bounds.getNorth() +
        "," +
        bounds.getWest() +
        "," +
        bounds.getSouth() +
        "," +
        bounds.getEast();

});


// FCD Legend
let FCDlegend = L.control({ position: 'bottomright' });

FCDlegend.onAdd = function (map) {

    let div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 40, 80],
        labels = ['<strong> FCD Speeds (km/h) </strong> <br>'],
        from, to;

    for (let i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(
            '<i style="background:' + getColor(from + 1) + '"></i> ' +
            from + (to ? ' &ndash; ' + to : '+'));
    }

    div.innerHTML = labels.join('<br>');
    return div;
};

FCDlegend.addTo(map);


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

    },
    "Air Quality Sensors": {
        "World Air Quality Index": wAQI,
    }
};


let options = {
    // Make the "Landmarks" group exclusive (use radio inputs)
    exclusiveGroups: ['FCD Speeds'],
    // Show a checkbox next to non-exclusive group labels for toggling all
    groupCheckboxes: true
};

let layerControl = L.control.groupedLayers(baseMaps, overlayMaps, options).addTo(map);


// // Panel

// let overLayers = [

//     {
//         group: 'FCD Speeds',
//         radio: true,
//         layers: [
//             {
//                 name: "INRIX",
//                 active: true,
//                 // icon: iconByName('bar'),
//                 layer: inrixTraffic
//             },
//             {
//                 name: "HERE",
//                 // icon: iconByName('drinking_water'),
//                 layer: hereTraffic
//             },
//             {
//                 name: "TomTom",
//                 // icon: iconByName('fuel'),
//                 layer: tomtomTraffic
//             }

//         ]
//     },



//     ];

// let baseLayers = [
// 	{
// 		group: "Basemaps",
// 		// icon: iconByName('parking'),
// 		// collapsed: true,
// 		layers: [
// 			{
// 				name: "CartoDB Positron",
// 				// icon: iconByName('drinking_water'),
// 				layer: positron
// 			},
// 			{
// 				name: "CartoDB Dark",
// 				// icon: iconByName('drinking_water'),
// 				layer: dark
// 			}
// 		]
// 	}
// ];

// let panelLayers = new L.Control.PanelLayers(baseLayers, overLayers, {
//     // collapsed: true,
//     title: 'Legend',
// 	compact: true
// });

// map.addControl(panelLayers);

