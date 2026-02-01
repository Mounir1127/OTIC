import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private apiUrl = 'http://localhost:4000/api/locations';

    constructor(private http: HttpClient) { }

    getGovernorates(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }
}
