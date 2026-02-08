import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <div class="d-flex h-100">
      <app-sidebar class="h-100"></app-sidebar>
      <div class="flex-grow-1 h-100 overflow-auto bg-light-subtle">
        <div class="p-4 dashboard-content">
            <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
        display: block;
        height: 100vh;
        overflow: hidden;
    }
    .dashboard-content {
        max-width: 1600px;
        margin: 0 auto;
    }
  `]
})
export class DashboardComponent { }
