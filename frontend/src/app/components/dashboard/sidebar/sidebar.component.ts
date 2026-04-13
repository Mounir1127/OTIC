import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SettingsService, UserSettings } from '../../../services/settings.service';
import { NotificationService } from '../../../services/notification.service';
import { MessageService } from '../../../services/message.service';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark h-100 sidebar-container" [dir]="currentSettings.language === 'ar' ? 'rtl' : 'ltr'">
      <a href="/" class="d-flex align-items-center mb-4 mb-md-0 text-white text-decoration-none" [ngClass]="currentSettings.language === 'ar' ? 'ms-auto' : 'me-md-auto'">
        <i class="bi bi-shield-check fs-2 me-2 text-warning" [ngClass]="{'ms-2': currentSettings.language === 'ar'}"></i>
        <span class="fs-4 fw-bold">OTIC 
          <small class="fw-light fs-6 opacity-75 d-block" *ngIf="user">
            {{ getRoleLabel() }}
          </small>
        </span>
      </a>
      <hr class="border-secondary opacity-50">
      <ul class="nav nav-pills flex-column mb-auto mt-2 p-0">
        <li class="nav-item mb-1" *ngFor="let item of menuItems">
          <a [routerLink]="item.path" 
             routerLinkActive="active" 
             [routerLinkActiveOptions]="{exact: item.exact}" 
             class="nav-link text-white-50 d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <i [class]="'bi ' + item.icon + ' fs-5'" [ngClass]="currentSettings.language === 'ar' ? 'ms-3' : 'me-3'"></i>
              {{ translate(item.labelKey) }}
            </div>
            <span *ngIf="item.labelKey === 'my_reclamations' && unreadNotifications > 0" 
                  class="badge bg-danger rounded-pill ms-2 pulse-badge">
              {{ unreadNotifications }}
            </span>
            <span *ngIf="item.labelKey === 'Messagerie' && unreadMessages > 0" 
                  class="badge bg-danger rounded-pill ms-2 pulse-badge">
              {{ unreadMessages }}
            </span>
          </a>
        </li>
      </ul>
      <hr class="border-secondary opacity-50">
      <div class="dropdown">
        <a href="#" class="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
          <div class="rounded-circle bg-warning d-flex align-items-center justify-content-center me-2" [ngClass]="{'ms-2': currentSettings.language === 'ar'}" style="width: 32px; height: 32px;">
            <i class="bi bi-person-fill text-dark"></i>
          </div>
          <div class="d-flex flex-column">
            <strong *ngIf="user">{{ user.prenom }} {{ user.nom }}</strong>
            <strong *ngIf="!user">{{ translate('profile') }}</strong>
          </div>
        </a>
        <ul class="dropdown-menu dropdown-menu-dark text-small shadow" [ngClass]="{'text-end': currentSettings.language === 'ar'}" aria-labelledby="dropdownUser1">
          <li><a class="dropdown-item" routerLink="/dashboard/profile">{{ translate('settings') }}</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><button class="dropdown-item" (click)="logout()">{{ translate('logout') }}</button></li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%) !important;
      box-shadow: 4px 0 10px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    
    .nav-link {
        border-radius: 8px;
        transition: all 0.2s;
        font-weight: 500;
        padding: 0.8rem 1rem;
    }

    .nav-link:hover {
        background-color: rgba(255, 255, 255, 0.05);
        color: white !important;
        transform: translateX(4px);
    }
    
    [dir="rtl"] .nav-link:hover {
        transform: translateX(-4px);
    }

    .nav-link.active {
        background: rgba(217, 119, 6, 0.15) !important; /* Gold tint */
        color: #fbbf24 !important; /* Gold text */
        border-right: 3px solid transparent;
        border-left: 3px solid transparent;
    }
    
    [dir="ltr"] .nav-link.active { border-left: 3px solid #fbbf24; }
    [dir="rtl"] .nav-link.active { border-right: 3px solid #fbbf24; }

    .nav-link i {
        min-width: 24px;
        text-align: center;
    }
    
    [dir="rtl"] .bi { transform: scaleX(-1); }

    .pulse-badge {
      animation: pulse-red 2s infinite;
      font-size: 0.7rem;
      padding: 0.35em 0.65em;
    }

    @keyframes pulse-red {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  user: any = null;
  currentSettings: UserSettings = { darkMode: false, language: 'fr' };
  menuItems: any[] = [];
  unreadNotifications: number = 0;
  unreadMessages: number = 0;
  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService,
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this.settingsService.settings$.subscribe(settings => {
        this.currentSettings = settings;
        this.cdr.detectChanges();
      })
    );

    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.generateMenu();

      if (user && user.role === 'consommateur_simple') {
        this.startNotificationPolling();
      }
      if (user && (user.role === 'admin_regional' || user.role === 'super_admin')) {
        this.startMessagePolling();
      }

      this.cdr.detectChanges();
    });

    if (!this.user) {
      this.authService.getProfile().subscribe();
    }
  }

  startNotificationPolling(): void {
    // Poll every 30 seconds for new notifications
    this.subscription.add(
      interval(30000).pipe(
        startWith(0),
        switchMap(() => this.notificationService.getUnreadCount())
      ).subscribe({
        next: (res) => {
          this.unreadNotifications = res.count;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Notification polling error:', err)
      })
    );
  }

  startMessagePolling(): void {
    // Poll every 10 seconds for new messages
    this.subscription.add(
      interval(10000).pipe(
        startWith(0),
        switchMap(() => this.messageService.getUnreadCount())
      ).subscribe({
        next: (res) => {
          this.unreadMessages = res.count;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Message polling error:', err)
      })
    );
  }

  generateMenu(): void {
    if (!this.user) {
      this.menuItems = [];
      return;
    }

    const roleConfigs: any = {
      super_admin: [
        { path: '/dashboard', icon: 'bi-grid-1x2-fill', labelKey: 'dashboard', exact: true },
        { path: '/dashboard/admin-management', icon: 'bi-speedometer2', labelKey: 'admin_panel', exact: true },
        { path: '/dashboard/admin-management/users', icon: 'bi-people-fill', labelKey: 'manage_users', exact: false },
        { path: '/dashboard/admin/stats', icon: 'bi-graph-up-arrow', labelKey: 'statistics', exact: true },
        { path: '/dashboard/admin/conventionnes', icon: 'bi-briefcase', labelKey: 'manage_conventionnes', exact: false },
        { path: '/dashboard/admin/messages', icon: 'bi-chat-dots-fill', labelKey: 'Messagerie', exact: false },
        { path: '/dashboard/mineral-waters', icon: 'bi-droplet-fill', labelKey: 'mineral_waters', exact: true },
        { path: '/dashboard/profile', icon: 'bi-person-circle', labelKey: 'profile', exact: false },
      ],
      consommateur_simple: [
        { path: '/dashboard', icon: 'bi-grid-1x2-fill', labelKey: 'dashboard', exact: true },
        { path: '/dashboard/reclamation', icon: 'bi-file-earmark-text', labelKey: 'my_reclamations', exact: false },
        { path: '/dashboard/mineral-waters', icon: 'bi-droplet-fill', labelKey: 'mineral_waters', exact: true },
        { path: '/dashboard/profile', icon: 'bi-person-circle', labelKey: 'profile', exact: false },
      ],
      admin_regional: [
        { path: '/dashboard', icon: 'bi-grid-1x2-fill', labelKey: 'dashboard', exact: true },
        { path: '/dashboard/admin/assign', icon: 'bi-share-fill', labelKey: 'assign_reclamations', exact: false },
        { path: '/dashboard/admin/all-reclamations', icon: 'bi-list-ul', labelKey: 'all_reclamations', exact: false },
        { path: '/dashboard/admin/consumers', icon: 'bi-people', labelKey: 'manage_consumers', exact: false },
        { path: '/dashboard/admin/stats', icon: 'bi-graph-up-arrow', labelKey: 'statistics', exact: true },
        { path: '/dashboard/admin/conventionnes', icon: 'bi-briefcase', labelKey: 'manage_conventionnes', exact: false },
        { path: '/dashboard/admin/messages', icon: 'bi-chat-dots-fill', labelKey: 'Messagerie', exact: false },
        { path: '/dashboard/mineral-waters', icon: 'bi-droplet-fill', labelKey: 'mineral_waters', exact: true },
        { path: '/dashboard/profile', icon: 'bi-person-circle', labelKey: 'profile', exact: false },
      ]
    };

    this.menuItems = roleConfigs[this.user.role] || [];
  }

  getRoleLabel(): string {
    if (!this.user) return '';
    switch (this.user.role) {
      case 'super_admin': return 'Super Administration';
      case 'admin_regional': return 'Administration Régionale';
      default: return 'Espace Consommateur';
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  translate(key: string): string {
    return this.settingsService.getTranslation(key);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
