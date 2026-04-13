import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private apiUrl = 'http://localhost:5000';
  private waterBrandsCache: any[] | null = null;

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
}
