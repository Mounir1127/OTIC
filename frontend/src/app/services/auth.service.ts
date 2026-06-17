import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        // Hydrate user on init if token exists
        if (localStorage.getItem('token')) {
            this.getProfile().subscribe();
        }
    }

    register(user: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, user);
    }

    login(user: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/login`, user).pipe(
            tap(res => {
                if (res.token) {
                    localStorage.setItem('token', res.token);
                    this.getProfile().subscribe();
                }
            })
        );
    }

    getProfile(): Observable<any> {
        console.log('📡 Fetching profile from:', `${this.apiUrl}/me`);
        return this.http.get(`${this.apiUrl}/me`).pipe(
            tap(user => this.currentUserSubject.next(user))
        );
    }

    updateProfile(userData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/update-profile`, userData).pipe(
            tap(user => {
                const current = this.currentUserSubject.value;
                this.currentUserSubject.next({ ...current, ...user });
            })
        );
    }

    logout() {
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
    }

    changePassword(passwords: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/change-password`, passwords);
    }

    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/forgot-password`, { email });
    }

    resetPassword(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/reset-password`, data);
    }

    uploadPhoto(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('photo', file);
        return this.http.post(`${this.apiUrl}/upload-photo`, formData).pipe(
            tap((res: any) => {
                const current = this.currentUserSubject.value;
                if (current) {
                    this.currentUserSubject.next({ ...current, photoProfil: res.photoProfil });
                }
            })
        );
    }
}
