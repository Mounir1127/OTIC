import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MessageService {
    private apiUrl = 'http://localhost:5000/api/messages';

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'x-auth-token': token || ''
        });
    }

    getContacts(): Observable<any> {
        return this.http.get(`${this.apiUrl}/contacts`, { headers: this.getHeaders() });
    }

    getConversation(userId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/conversation/${userId}`, { headers: this.getHeaders() });
    }

    sendMessage(receiverId: string, content: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/send`, { receiverId, content }, { headers: this.getHeaders() });
    }

    getUnreadCount(): Observable<any> {
        return this.http.get(`${this.apiUrl}/unread-count`, { headers: this.getHeaders() });
    }
}
