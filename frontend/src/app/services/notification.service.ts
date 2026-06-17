import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = 'http://localhost:5000/api/notifications';
    private unreadCountSubject = new BehaviorSubject<number>(0);
    unreadCount$ = this.unreadCountSubject.asObservable();

    constructor(private http: HttpClient) { }

    getNotifications(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    getUnreadCount(): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(`${this.apiUrl}/unread/count`)
            .pipe(
                tap(res => this.unreadCountSubject.next(res.count))
            );
    }

    markAsRead(id: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/read`, {})
            .pipe(
                tap(() => {
                    const currentCount = this.unreadCountSubject.value;
                    if (currentCount > 0) this.unreadCountSubject.next(currentCount - 1);
                })
            );
    }

    markAllAsRead(): Observable<any> {
        return this.http.put(`${this.apiUrl}/read-all`, {})
            .pipe(
                tap(() => this.unreadCountSubject.next(0))
            );
    }
}
