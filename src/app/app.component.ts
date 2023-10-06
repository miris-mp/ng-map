import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as L from 'leaflet';
import { ApiService } from './api.service';

var url = new URL(window.location.href);
var mark = url.searchParams.get('mark');
var all_data = url.searchParams.get('all');

const WOM_TILES_URL =
  'http://localhost:8000/api/v1/tiles/{z}/{x}/{y}/' +
  (mark == undefined ? '' : mark + '/') +
  (all_data == undefined ? '' : all_data + '/');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'leaflet-map';
  private map: any;
  serverData: any;

  constructor(private http: HttpClient, private apiService: ApiService) {}

  ngOnInit(): void {}

  private initMap(): void {
    this.map = L.map('map', {
      center: [43.8985, 12.8788],
      zoom: 10,
    });

    var i = Math.ceil(Math.random() * 4);

    var positronLabels = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      {
        attribution: '©OpenStreetMap, ©CartoDB',
      }
    ).addTo(this.map);

    //const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
    const tiles = L.tileLayer(
      'http://localhost:8000/api/v1/tiles/10/13.8412642/42.9857861/',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    ).addTo(this.map);

    this.map.on('click', function (e: any) {
      console.log(e.latlng.lat);

      let clickPos = [e.latlng.lat, e.latlng.lng];
      getPath(clickPos);
    });

    function getPath(clickPos: any) {
      let zoom = 10;
      // the offset determines the size of the border box
      let offset = 16 / Math.pow(2, zoom);
      // the vertexes (NW, SE) of the border box
      let nw = L.latLng(clickPos[0] - offset, clickPos[1] - offset);
      let se = L.latLng(clickPos[0] + offset, clickPos[1] + offset);
      console.log('NW ', nw);
      console.log('SE ', se);
      // create the border box and generate the request path
      let bbox = L.latLngBounds(nw, se).toBBoxString();
      let path = '/ws/?bbox=' + bbox + '&zoom_level=' + zoom;
      return path;
    }
  }

  // GET request to SRS PPE API
  sendPPERequest(path: string, clickPos: any) {
    this.getApi(WOM_TILES_URL + path, (r: any) => {
      this.handlePPEData(JSON.parse(r.responseText), clickPos);
    });
  }

  // ajax get request
  getApi(url: any, onSuccess: any) {
    let r = new XMLHttpRequest();
    r.onreadystatechange = function () {
      if (r.readyState !== XMLHttpRequest.DONE || r.status !== 200) {
        // if (onError) onError(r);
      } else if (onSuccess) {
        onSuccess(r);
      }
    };

    // true is for async mode
    r.open('GET', url, true);
    r.send();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  handlePPEData(data: any, clickPos: any) {
    // exit if there aren't features
    if (data.features.length <= 0) return;

    // reversing lat lng
    for (let feature of data.features) {
      feature.geometry.coordinates.reverse();
    }

    // sort by distance
    data.features.sort((a: any, b: any) => {
      a = a.geometry.coordinates;
      b = b.geometry.coordinates;
      return this.distance(a, clickPos) < this.distance(b, clickPos) ? -1 : 1;
    });

    // get the nearest feature
    let feature = data.features[0];
    let ppe = Math.round(feature.ppe * 1000) / 1000;

    // display the related popup
    L.popup()
      .setLatLng(feature.geometry.coordinates)
      .setContent(`<h3>PPE</h3><p>${ppe}</p>`)
      .openOn(this.map);
  }

  // pythagorean theorem
  distance(a: any, b: any) {
    return Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
  }
}
