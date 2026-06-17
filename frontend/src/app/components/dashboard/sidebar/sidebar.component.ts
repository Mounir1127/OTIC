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
      <div class="dropdown mt-2">
        <div class="d-flex align-items-center profile-section-nav">
          <!-- Main Profile Link -->
          <a routerLink="/dashboard/profile" class="d-flex align-items-center text-white text-decoration-none flex-grow-1 profile-link-main" role="button">
            <div class="rounded-circle bg-warning d-flex align-items-center justify-content-center me-2 overflow-hidden shadow-sm" [ngClass]="{'ms-2': currentSettings.language === 'ar'}" style="width: 38px; height: 38px; border: 2px solid rgba(255,255,255,0.1);">
              <i class="bi bi-person-fill text-dark fs-5" *ngIf="!user?.photoProfil"></i>
              <img [src]="user?.photoProfil" *ngIf="user?.photoProfil" class="img-fluid w-100 h-100" style="object-fit: cover;">
            </div>
            <div class="d-flex flex-column text-truncate" style="max-width: 130px;">
              <strong *ngIf="user" class="text-truncate small">{{ user.prenom }} {{ user.nom }}</strong>
              <strong *ngIf="!user" class="small">{{ translate('profile') }}</strong>
              <span class="text-white-50" style="font-size: 0.65rem;">{{ translate('settings') }}</span>
            </div>
          </a>
          
          <!-- Dropdown Toggle Only -->
          <a href="javascript:void(0)" class="text-white-50 ms-auto dropdown-toggle-custom" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-three-dots-vertical"></i>
          </a>

          <ul class="dropdown-menu dropdown-menu-dark text-small shadow-lg border-secondary border-opacity-25" [ngClass]="{'text-end': currentSettings.language === 'ar'}" aria-labelledby="dropdownUser1">
            <li><a class="dropdown-item py-2" routerLink="/dashboard/profile"><i class="bi bi-person-circle me-2"></i> {{ translate('profile') }}</a></li>
            <li><hr class="dropdown-divider opacity-50"></li>
            <li><button class="dropdown-item py-2 text-danger" (click)="logout()"><i class="bi bi-box-arrow-right me-2"></i> {{ translate('logout') }}</button></li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%) !important;
      box-shadow: 4px 0 10px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      overflow-y: auto;
      overflow-x: hidden;
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

    /* Custom Scrollbar for Sidebar */
    .sidebar-container::-webkit-scrollbar {
      width: 5px;
    }
    .sidebar-container::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.05);
    }
    .sidebar-container::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
    }
    .sidebar-container::-webkit-scrollbar-thumb:hover {
      background: rgba(251, 191, 36, 0.3);
    }

    .profile-link-main {
      padding: 8px;
      border-radius: 12px;
      transition: all 0.2s;
    }
    .profile-link-main:hover {
      background: rgba(255,255,255,0.08);
    }
    .dropdown-toggle-custom {
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s;
      cursor: pointer;
    }
    .dropdown-toggle-custom:hover {
      background: rgba(255,255,255,0.1);
      color: white !important;
    }
    .dropdown-toggle-custom::after { display: none; } /* Hide bootstrap arrow */
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
      if (user && (user.role === 'admin_regional' || user.role === 'admin_tre' || user.role === 'super_admin')) {
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
        { path: '/dashboard/thermal-baths', icon: 'bi-water', labelKey: 'thermal_baths', exact: true },
        { path: '/dashboard/profile', icon: 'bi-person-circle', labelKey: 'profile', exact: false },
      ],
      consommateur_simple: [
        { path: '/dashboard', icon: 'bi-grid-1x2-fill', labelKey: 'dashboard', exact: true },
        { path: '/dashboard/reclamation', icon: 'bi-file-earmark-text', labelKey: 'my_reclamations', exact: false },
        { path: '/dashboard/mineral-waters', icon: 'bi-droplet-fill', labelKey: 'mineral_waters', exact: true },
        { path: '/dashboard/thermal-baths', icon: 'bi-water', labelKey: 'thermal_baths', exact: true },
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
        { path: '/dashboard/thermal-baths', icon: 'bi-water', labelKey: 'thermal_baths', exact: true },
        { path: '/dashboard/profile', icon: 'bi-person-circle', labelKey: 'profile', exact: false },
      ],
      admin_tre: [
        { path: '/dashboard', icon: 'bi-grid-1x2-fill', labelKey: 'dashboard', exact: true },
        { path: '/dashboard/admin/assign', icon: 'bi-share-fill', labelKey: 'assign_reclamations', exact: false },
        { path: '/dashboard/admin/all-reclamations', icon: 'bi-list-ul', labelKey: 'all_reclamations', exact: false },
        { path: '/dashboard/admin/consumers', icon: 'bi-people', labelKey: 'manage_consumers', exact: false },
        { path: '/dashboard/admin/stats', icon: 'bi-graph-up-arrow', labelKey: 'statistics', exact: true },
        { path: '/dashboard/admin/conventionnes', icon: 'bi-briefcase', labelKey: 'manage_conventionnes', exact: false },
        { path: '/dashboard/admin/messages', icon: 'bi-chat-dots-fill', labelKey: 'Messagerie', exact: false },
        { path: '/dashboard/mineral-waters', icon: 'bi-droplet-fill', labelKey: 'mineral_waters', exact: true },
        { path: '/dashboard/thermal-baths', icon: 'bi-water', labelKey: 'thermal_baths', exact: true },
        { path: '/dashboard/profile', icon: 'bi-person-circle', labelKey: 'profile', exact: false },
      ]
    };

    this.menuItems = roleConfigs[this.user.role] || [];
  }

  getRoleLabel(): string {
    if (!this.user) return '';
    switch (this.user.role) {
      case 'super_admin': return this.translate('role_super_admin');
      case 'admin_regional': return this.translate('role_admin_regional');
      case 'admin_tre': return this.translate('role_admin_tre');
      default: return this.translate('role_user');
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
