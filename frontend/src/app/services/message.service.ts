import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MessageService {
    private apiUrl = 'http://localhost:5000/api/messages';

    constructor(private http: HttpClient) { }

    getContacts(): Observable<any> {
        return this.http.get(`${this.apiUrl}/contacts`);
    }

    getConversation(userId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/conversation/${userId}`);
    }

    sendMessage(receiverId: string, content: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/send`, { receiverId, content });
    }

    getUnreadCount(): Observable<any> {
        return this.http.get(`${this.apiUrl}/unread-count`);
    }
}
