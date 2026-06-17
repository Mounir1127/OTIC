import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SettingsService, UserSettings } from '../../services/settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <div class="d-flex h-100" [dir]="currentSettings.language === 'ar' ? 'rtl' : 'ltr'">
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
export class DashboardComponent implements OnInit, OnDestroy {
  currentSettings: UserSettings = { darkMode: false, language: 'fr' };
  private sub = new Subscription();

  constructor(private settingsService: SettingsService) { }

  ngOnInit() {
    this.sub.add(
      this.settingsService.settings$.subscribe(settings => {
        this.currentSettings = settings;
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
