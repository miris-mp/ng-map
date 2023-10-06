import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:8000/api/v1/tiles';

  constructor(private http: HttpClient) {}

  getTilesData(zoom: number, x: number, y: number, mark: string, all: string): Observable<any> {
    const url = `${this.baseUrl}/${zoom}/${x}/${y}/${mark}/${all}`;
    return this.http.get(url);
  }
}
