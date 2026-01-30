import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private apiUrl = 'http://localhost:4000';

  constructor(private http: HttpClient) { }

  getMessage(): Observable<any> {
    return this.http.get(`${this.apiUrl}/`, { responseType: 'text' });
  }
}
