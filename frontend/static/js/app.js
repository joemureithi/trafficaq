// API Endpoint
const trafficAPI = 'http://34.253.207.153/api/fcdgeom/'

// Variables
let tCurrent = Date.now()/1000;
let timestamp = tCurrent
let lat = 48.910718;
let lon = 8.71003;

// DOM Elements
const timeslider = $("#timeslider");
const timeElement = $("#timeelement");


// Initialize Map
let map = L.map('map', {});
map.setView([lat, lon], 14);

// Add Basemaps
const osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; OSM Mapnik <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

const positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap, &copy; CartoDB'
}).addTo(map);

const esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

let baseMaps = {
    "CartoDB Positron": positron,
    "OpenStreetMap": osm,
    "ESRI World Imagery": esri

};

// Add Layer Styling
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

// Add Layers
let inrixTraffic = L.geoJSON(null, {
    style: fcdStyle,
    onEachFeature: function (feature, layer) {
        layer.bindTooltip(`${feature.properties.speed.toString()} km/h`);
    }
}).addTo(map);

let overlayMaps = {
    "FCD Speeds": {
        "INRIX": inrixTraffic,
    }
};

// Map Controls
let layerControl = L.control.groupedLayers(baseMaps, overlayMaps).addTo(map);

// Fetch Data
async function fetchData(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
};

// Traffic Layers
function trafficLayer(tUrl, tLayer){
    (async () => {
    let trafficData = await fetchData(tUrl)
    console.log(trafficData[0]['traffic']);
    tLayer.clearLayers();
    tLayer.addData(trafficData[0]['traffic']);
})();

}

// Load Data
function loadFCData(timestamp) {
    // Time Element
    let t = (((new Date(parseInt(timestamp * 1000))).toLocaleString()).replace('T', ' ')).replace('Z', ' ');
    // let t = (new Date(parseInt(timestamp*1000))).toUTCString();
    timeElement.html(t.slice(0, 20));

    // Traffic URLs
    let inrixTrafficUrl = `${trafficAPI}inrix?tQuery=${timestamp}`;
    
    // Load FCD Layers
    trafficLayer(inrixTrafficUrl, inrixTraffic);

};


function loadWeatherData(timestamp, lat, lon) {
    console.log(`Timestamp: ${new Date(parseInt(timestamp * 1000)).toLocaleString()}, Lat: ${lat}, Lon: ${lon}`)
}

// On Load
$(document).ready(function () {
    console.log("GO!");
    loadFCData(tCurrent);
    loadWeatherData(tCurrent, lat, lon);
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
    loadWeatherData(timestamp, lat, lon)

})

// On Map Move
map.on("moveend", function () {
    // console.log(L.latLng(map.getCenter()))
    lat = L.latLng(map.getCenter()).lat
    lon = L.latLng(map.getCenter()).lng
    loadWeatherData(timestamp, lat, lon);
});