"use strict";
// OSM tiles
// Using CARTO tile server, see: https://carto.com/location-data-services/basemaps/
const OSM_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

var url = new URL(window.location.href);
var mark = url.searchParams.get("mark");
var all_data = url.searchParams.get("all");

// SRS tiles
const SRS_TILES_URL =
  "http://tiles.smartroadsense.it/api/v1/tiles/{z}/{x}/{y}/" +
  (mark == undefined ? "" : mark + "/") +
  (all_data == undefined ? "" : all_data + "/");
// SRS data used for PPE visualization
const SRS_DATA_BASE_URL = "";
// Geocoder
const GEOCODER_URL = "/search";

// create map
let map = L.map("mapdiv", {
  center: [43.9167, 12.9],
  zoom: 9,
});

// add osm background layer
L.tileLayer(OSM_URL, {
  attribution:
    'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://carto.com/attribution">CARTO</a> | Road data &copy; <a href="https://www.smartroadsense.it">SmartRoadSense</a> contributors',
}).addTo(map);

var info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create("div", "info-legend"); // create a div with a class "info"
  this.update();
  return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
  this._div.innerHTML = "<strong>Road Roughness<br>(PPE)</strong><ul>";

  var labels = [
    "0.0 - 0.3",
    "0.3 - 0.5",
    "0.5 - 0.7",
    "0.7 - 1.0",
    "1.0 - 1.7",
    "> 1.7",
  ];
  var colors = [
    "rgb(62,138,0)",
    "rgb(224,214,20)",
    "rgb(238,128,18)",
    "rgb(252,40,17)",
    "rgb(179,14,11)",
    "rgb(59,4,3)",
  ];

  for (var i = 0; i < labels.length; i++) {
    this._div.innerHTML +=
      '<i class="ppe-entry"><span class="circle" style="background: ' +
      colors[i] +
      '"></span>' +
      labels[i] +
      "</i>";
  }

  this._div.innerHTML += "</ul>";
};

info.addTo(map);

// add srs tiles layer
L.tileLayer(SRS_TILES_URL).addTo(map);

function createRMMarker(layer, map, lat, long, date, artist, location, url) {
  var marker = layer.marker([lat, long]);
  var when = new Date(date).toDateString();
  marker.bindPopup(
    "<b>" +
      when +
      " - " +
      artist +
      "</b><br>" +
      location +
      '<br><a href="' +
      url +
      '" target="_blank">RisorgiMarche</a>'
  );
  marker.addTo(map);

  return marker;
}

// pythagorean theorem
function distance(a, b) {
  return Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
}

// get the features near the click position
function getPath(clickPos) {
  let zoom = map.getZoom();
  // the offset determines the size of the border box
  let offset = 16 / Math.pow(2, zoom);
  // the vertexes (NW, SE) of the border box
  let nw = L.latLng(clickPos[0] - offset, clickPos[1] - offset);
  let se = L.latLng(clickPos[0] + offset, clickPos[1] + offset);
  // create the border box and generate the request path
  let bbox = L.latLngBounds(nw, se).toBBoxString();
  let path = "/ws/?bbox=" + bbox + "&zoom_level=" + zoom;
  return path;
}

// handle the features returned from the server
function handlePPEData(data, clickPos) {
  // exit if there aren't features
  if (data.features.length <= 0) return;

  // reversing lat lng
  for (let feature of data.features) {
    feature.geometry.coordinates.reverse();
  }

  // sort by distance
  data.features.sort(function (a, b) {
    a = a.geometry.coordinates;
    b = b.geometry.coordinates;
    return distance(a, clickPos) < distance(b, clickPos) ? -1 : 1;
  });

  // get the nearest feature
  let feature = data.features[0];
  let ppe = Math.round(feature.ppe * 1000) / 1000;

  // display the related popup
  L.popup()
    .setLatLng(feature.geometry.coordinates)
    .setContent(`<h3>PPE</h3><p>${ppe}</p>`)
    .openOn(map);
}

// GET request to SRS PPE API
function sendPPERequest(path, clickPos) {
  Get(SRS_DATA_BASE_URL + path, function (r) {
    handlePPEData(JSON.parse(r.responseText), clickPos);
  });
}

// ajax get request
function Get(url, onSuccess, onError) {
  let r = new XMLHttpRequest();
  r.onreadystatechange = function () {
    if (r.readyState !== XMLHttpRequest.DONE || r.status !== 200) {
      if (onError) onError(r);
    } else if (onSuccess) {
      onSuccess(r);
    }
  };

  // true is for async mode
  r.open("GET", url, true);
  r.send();
}

// handle the click event
map.on("click", function (e) {
  let clickPos = [e.latlng.lat, e.latlng.lng];
  let path = getPath(clickPos);
  sendPPERequest(path, clickPos);
});

function queryGeocoder(query) {
  Get(GEOCODER_URL + "/" + query + "?format=json", function (r) {
    handleGeocoderData(JSON.parse(r.responseText));
  });
}

function handleGeocoderData(data) {
  centerMap(data[0].lat, data[0].lon);
}

// center the map on the given coords
function centerMap(lat, lon) {
  map.panTo(new L.LatLng(lat, lon));
}

// triggered by the search button
function search() {
  let query = document.getElementById("geocode-input").value;
  if (query !== "") queryGeocoder(query);
}
