import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private apiUrl = `${environment.apiUrl}/locations`;

    constructor(private http: HttpClient) { }

    getGovernorates(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    getDelegations(governorate: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${governorate}`);
    }
}
