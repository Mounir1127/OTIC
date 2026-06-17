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

    getUsers(): Observable<any> {
        return this.http.get(`${this.apiUrl}/users`);
    }

    getConsumers(): Observable<any> {
        return this.http.get(`${this.apiUrl}/consumers`);
    }

    getConventionnes(): Observable<any> {
        return this.http.get(`${this.apiUrl}/conventionnes`);
    }

    getPendingReclamations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/reclamations/pending`);
    }

    getComplementReclamations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/reclamations/complements`);
    }

    getAllReclamations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/reclamations/all`);
    }

    assignReclamation(reclamationId: string, conventionneId: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/reclamation/${reclamationId}/assign`, { conventionneId });
    }

    createAdmin(adminData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/create-admin`, adminData);
    }

    createConventionne(userData: any): Observable<any> {
        // Now include region for the new field
        const payload = {
            nom: userData.nom,
            email: userData.email,
            region: userData.region
        };
        return this.http.post(`${this.apiUrl}/create-conventionne`, payload);
    }

    deletePartner(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/conventionne/${id}`);
    }

    deleteUser(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/user/${id}`);
    }

    updateUserRole(id: string, role: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/user/${id}/role`, { role });
    }

    toggleUserStatus(id: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/user/${id}/toggle-status`, {});
    }

    getUserById(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/user/${id}`);
    }

    updateUser(id: string, userData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/user/${id}`, userData);
    }

    markAsRead(reclamationId: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/reclamation/${reclamationId}/mark-read`, {});
    }

    updateReclamationStatus(reclamationId: string, statut: string, comment?: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/reclamation/${reclamationId}/status`, { statut, comment });
    }

    getStats(filters: any = {}): Observable<any> {
        let params = '';
        if (filters.startDate) params += `&startDate=${filters.startDate}`;
        if (filters.endDate) params += `&endDate=${filters.endDate}`;
        if (filters.region) params += `&region=${filters.region}`;
        if (filters.consumerType) params += `&consumerType=${filters.consumerType}`;
        if (filters.isTRE !== undefined) params += `&isTRE=${filters.isTRE}`;
        if (filters.country) params += `&country=${filters.country}`;

        if (params) {
            params = '?' + params.substring(1);
        }

        return this.http.get(`${this.apiUrl}/stats${params}`);
    }

    createWaterBrand(brandData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/water-brands`, brandData);
    }

    updateWaterBrand(id: string, brandData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/water-brand/${id}`, brandData);
    }

    deleteWaterBrand(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/water-brand/${id}`);
    }

    createThermalBath(bathData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/thermal-baths`, bathData);
    }

    updateThermalBath(id: string, bathData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/thermal-bath/${id}`, bathData);
    }

    deleteThermalBath(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/thermal-bath/${id}`);
    }

    uploadThermalBathImage(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('image', file);
        return this.http.post(`${this.apiUrl}/thermal-baths/upload-image`, formData);
    }

    triggerRefresh() {
        this.refreshUsersSource.next();
    }
}
