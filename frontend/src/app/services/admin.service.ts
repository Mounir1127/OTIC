import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private apiUrl = 'http://localhost:4000/api/admin';

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'x-auth-token': token || ''
        });
    }

    getUsers(): Observable<any> {
        return this.http.get(`${this.apiUrl}/users`, { headers: this.getHeaders() });
    }

    getConsumers(): Observable<any> {
        return this.http.get(`${this.apiUrl}/consumers`, { headers: this.getHeaders() });
    }

    getConventionnes(): Observable<any> {
        return this.http.get(`${this.apiUrl}/conventionnes`, { headers: this.getHeaders() });
    }

    getPendingReclamations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/reclamations/pending`, { headers: this.getHeaders() });
    }

    getComplementReclamations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/reclamations/complements`, { headers: this.getHeaders() });
    }

    assignReclamation(reclamationId: string, conventionneId: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/reclamation/${reclamationId}/assign`, { conventionneId }, { headers: this.getHeaders() });
    }

    createAdmin(adminData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/create-admin`, adminData, { headers: this.getHeaders() });
    }
}
