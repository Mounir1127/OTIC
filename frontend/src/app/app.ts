import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Api } from './services/api';
import { ChatbotComponent } from './components/chatbot/chatbot';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatbotComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  message = signal('');
  showChatbot = true;
  chatbotType = 'SIMPLE';

  constructor(private api: Api, private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.showChatbot = !url.includes('/login') && !url.includes('/register');

      if (url.includes('/dashboard/admin')) {
        this.chatbotType = 'ADMIN';
      } else {
        this.chatbotType = url.includes('/tunisians-abroad') ? 'TRE' : 'SIMPLE';
      }
    });
  }

  ngOnInit() {
    this.api.getMessage().subscribe({
      next: (data) => this.message.set(data),
      error: (err) => console.error(err)
    });
  }
}
