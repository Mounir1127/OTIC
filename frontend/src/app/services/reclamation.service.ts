import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReclamationService {
    private apiUrl = 'http://localhost:4000/api/reclamations';

    constructor(private http: HttpClient) { }

    getMyReclamations(): Observable<any> {
        const token = localStorage.getItem('token');
        return this.http.get(`${this.apiUrl}/me`, {
            headers: { 'x-auth-token': token || '' }
        });
    }

    createReclamation(reclamation: any): Observable<any> {
        const token = localStorage.getItem('token');
        return this.http.post(this.apiUrl, reclamation, {
            headers: { 'x-auth-token': token || '' }
        });
    }
}
