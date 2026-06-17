import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private apiUrl = environment.apiUrl.replace('/api', ''); // Base URL for public
  private waterBrandsCache: any[] | null = null;
  private thermalBathsCache: any[] | null = null;

  constructor(private http: HttpClient) { }

  getMessage(): Observable<any> {
    return this.http.get(`${this.apiUrl}/`, { responseType: 'text' });
  }

  getPublicStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/public/stats`);
  }

  getWaterBrands(forceRefresh = false): Observable<any[]> {
    if (this.waterBrandsCache && !forceRefresh) {
      return of(this.waterBrandsCache);
    }
    return this.http.get<any[]>(`${this.apiUrl}/api/public/water-brands`).pipe(
      tap(brands => this.waterBrandsCache = brands)
    );
  }

  getThermalBaths(forceRefresh = false): Observable<any[]> {
    if (this.thermalBathsCache && !forceRefresh) {
      return of(this.thermalBathsCache);
    }
    return this.http.get<any[]>(`${this.apiUrl}/api/public/thermal-baths`).pipe(
      tap(baths => this.thermalBathsCache = baths)
    );
  }
}
