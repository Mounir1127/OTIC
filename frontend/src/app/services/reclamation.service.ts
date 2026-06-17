import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReclamationService {
    private apiUrl = `${environment.apiUrl}/reclamations`;

    constructor(private http: HttpClient) { }

    getMyReclamations(): Observable<any> {
        const token = localStorage.getItem('token');
        return this.http.get(`${this.apiUrl}/me`, {
            headers: { 'x-auth-token': token || '' }
        });
    }

    createReclamation(reclamation: any): Observable<any> {
        const token = localStorage.getItem('token');
        const headers = { 'x-auth-token': token || '' };

        return this.http.post(this.apiUrl, reclamation, { headers });
    }

    getReclamationById(id: string): Observable<any> {
        const token = localStorage.getItem('token');
        return this.http.get(`${this.apiUrl}/${id}`, {
            headers: { 'x-auth-token': token || '' }
        });
    }
}
