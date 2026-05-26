import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private apiUrl = 'http://localhost:5000/api/admin';

    private refreshUsersSource = new Subject<void>();
    refreshUsers$ = this.refreshUsersSource.asObservable();

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

    getAllReclamations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/reclamations/all`, { headers: this.getHeaders() });
    }

    assignReclamation(reclamationId: string, conventionneId: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/reclamation/${reclamationId}/assign`, { conventionneId }, { headers: this.getHeaders() });
    }

    createAdmin(adminData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/create-admin`, adminData, { headers: this.getHeaders() });
    }

    createConventionne(userData: any): Observable<any> {
        // Now include region for the new field
        const payload = {
            nom: userData.nom,
            email: userData.email,
            region: userData.region
        };
        return this.http.post(`${this.apiUrl}/create-conventionne`, payload, { headers: this.getHeaders() });
    }

    deletePartner(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/conventionne/${id}`, { headers: this.getHeaders() });
    }

    deleteUser(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/user/${id}`, { headers: this.getHeaders() });
    }

    updateUserRole(id: string, role: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/user/${id}/role`, { role }, { headers: this.getHeaders() });
    }

    toggleUserStatus(id: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/user/${id}/toggle-status`, {}, { headers: this.getHeaders() });
    }

    getUserById(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/user/${id}`, { headers: this.getHeaders() });
    }

    updateUser(id: string, userData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/user/${id}`, userData, { headers: this.getHeaders() });
    }

    markAsRead(reclamationId: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/reclamation/${reclamationId}/mark-read`, {}, { headers: this.getHeaders() });
    }

    updateReclamationStatus(reclamationId: string, statut: string, comment?: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/reclamation/${reclamationId}/status`, { statut, comment }, { headers: this.getHeaders() });
    }

    getStats(filters: any = {}): Observable<any> {
        let params = '';
        if (filters.startDate) params += `&startDate=${filters.startDate}`;
        if (filters.endDate) params += `&endDate=${filters.endDate}`;
        if (filters.region) params += `&region=${filters.region}`;
        if (filters.consumerType) params += `&consumerType=${filters.consumerType}`;

        if (params) {
            params = '?' + params.substring(1);
        }

        return this.http.get(`${this.apiUrl}/stats${params}`, { headers: this.getHeaders() });
    }

    createWaterBrand(brandData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/water-brands`, brandData, { headers: this.getHeaders() });
    }

    updateWaterBrand(id: string, brandData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/water-brand/${id}`, brandData, { headers: this.getHeaders() });
    }

    deleteWaterBrand(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/water-brand/${id}`, { headers: this.getHeaders() });
    }

    createThermalBath(bathData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/thermal-baths`, bathData, { headers: this.getHeaders() });
    }

    updateThermalBath(id: string, bathData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/thermal-bath/${id}`, bathData, { headers: this.getHeaders() });
    }

    deleteThermalBath(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/thermal-bath/${id}`, { headers: this.getHeaders() });
    }

    uploadThermalBathImage(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('image', file);
        return this.http.post(`${this.apiUrl}/thermal-baths/upload-image`, formData, { headers: this.getHeaders() });
    }

    triggerRefresh() {
        this.refreshUsersSource.next();
    }
}
