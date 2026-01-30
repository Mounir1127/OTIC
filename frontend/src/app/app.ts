import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Api } from './services/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  message = signal('');

  constructor(private api: Api) { }

  ngOnInit() {
    this.api.getMessage().subscribe({
      next: (data) => this.message.set(data),
      error: (err) => console.error(err)
    });
  }
}
