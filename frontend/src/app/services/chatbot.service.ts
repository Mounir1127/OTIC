import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = `${environment.apiUrl}/chatbot`;

  constructor(private ngZone: NgZone) { }

  async sendMessageStream(message: string, userType: string, onChunk: (chunk: string) => void, onComplete: () => void, onError: (err: any) => void) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, userType })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.content) {
                this.ngZone.run(() => onChunk(parsed.content));
              }
              if (parsed.error) {
                this.ngZone.run(() => onError(parsed.error));
              }
            } catch (e) {
              // Partial JSON, wait for next chunk
            }
          }
        }
      }
      this.ngZone.run(() => onComplete());

    } catch (err) {
      this.ngZone.run(() => onError(err));
    }
  }

  async generateCopilotResponse(reclamation: any, onChunk: (chunk: string) => void, onComplete: () => void, onError: (err: any) => void) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiUrl}/copilot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ reclamation })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.content) {
                this.ngZone.run(() => onChunk(parsed.content));
              }
              if (parsed.error) {
                this.ngZone.run(() => onError(parsed.error));
              }
            } catch (e) {
              // Partial JSON, wait for next chunk
            }
          }
        }
      }
      this.ngZone.run(() => onComplete());

    } catch (err) {
      this.ngZone.run(() => onError(err));
    }
  }

  async sendAdminMessageStream(message: string, onChunk: (chunk: string) => void, onComplete: () => void, onError: (err: any) => void) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiUrl}/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.content) {
                this.ngZone.run(() => onChunk(parsed.content));
              }
              if (parsed.error) {
                this.ngZone.run(() => onError(parsed.error));
              }
            } catch (e) {
              // Partial JSON
            }
          }
        }
      }
      this.ngZone.run(() => onComplete());

    } catch (err) {
      this.ngZone.run(() => onError(err));
    }
  }
}
