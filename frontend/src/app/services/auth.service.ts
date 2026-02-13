import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:4000/api/auth';
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
                if (res.user) {
                    this.currentUserSubject.next(res.user);
                }
            })
        );
    }

    getProfile(): Observable<any> {
        const token = localStorage.getItem('token');
        return this.http.get(`${this.apiUrl}/me`, {
            headers: { 'x-auth-token': token || '' }
        }).pipe(
            tap(user => this.currentUserSubject.next(user))
        );
    }

    logout() {
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
    }

    changePassword(passwords: any): Observable<any> {
        const token = localStorage.getItem('token');
        return this.http.post(`${this.apiUrl}/change-password`, passwords, {
            headers: { 'x-auth-token': token || '' }
        });
    }
}
