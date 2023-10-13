import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as L from 'leaflet';
import { ApiService } from './api.service';

var url = new URL(window.location.href);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'leaflet-map';
  private map: any;
  serverData: any;

  tilesAcross = 7;
  tilesDown = 4;

  constructor(private http: HttpClient, private apiService: ApiService) {}

  ngOnInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [42.986211, 13.865771],
      zoom: 8,
    });

    var i = Math.ceil(Math.random() * 4);

    var positronLabels = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      {
        attribution: '©OpenStreetMap, ©CartoDB',
      }
    ).addTo(this.map);

    const tiles = L.tileLayer(`http://localhost:8000/test/{z}/{x}/{y}`, {
      maxZoom: 18,
      minZoom: 3,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    this.map.on('click', function (e: any) {
      console.log(e.latlng.lat);
    });

    //const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
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
    // this.initMap();
    this.requestTiles(12, 13.8106, 43.9985);
  }

  requestTiles(zoom: number, lat: number, lon: number) {
    const centerTile = this.latLngToTileCoords(lat, lon, zoom);

    for (
      let x_offset = -this.tilesAcross / 2;
      x_offset <= this.tilesAcross / 2;
      x_offset++
    ) {
      for (
        let y_offset = -this.tilesDown / 2;
        y_offset <= this.tilesDown / 2;
        y_offset++
      ) {
        const x = centerTile.x + x_offset;
        const y = centerTile.y + y_offset;

        // Construct the tile request URL
        const tileUrl = `http://localhost:8000/api/v1/tiles/${zoom}/${x}/${y}.png`;

        // Send an HTTP GET request to retrieve the tile
        this.http
          .get(tileUrl, { responseType: 'blob' })
          .subscribe((tileImage) => {
            // Process the tile image, e.g., display it on the map
            // You can use an <img> tag or other methods to display the image
          });
      }
    }
  }

  latLngToTileCoords(lat: number, lng: number, zoom: number) {
    const n = 2 ** zoom;
    const x_tile = Math.floor(((lng + 180) / 360) * n);
    const lat_rad = (lat * Math.PI) / 180;
    const y_tile = Math.floor(
      ((1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI) /
        2) *
        n
    );
    return { x: x_tile, y: y_tile };
  }
}
