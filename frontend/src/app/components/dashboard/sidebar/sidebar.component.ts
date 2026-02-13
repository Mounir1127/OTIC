import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark h-100 sidebar-container">
      <a href="/" class="d-flex align-items-center mb-4 mb-md-0 me-md-auto text-white text-decoration-none">
        <i class="bi bi-shield-check fs-2 me-2 text-warning"></i>
        <span class="fs-4 fw-bold">OTIC 
          <small class="fw-light fs-6 opacity-75 d-block" *ngIf="user">
            {{ user.role === 'super_admin' ? 'Administration' : 'Consommateur' }}
          </small>
        </span>
      </a>
      <hr class="border-secondary opacity-50">
      <ul class="nav nav-pills flex-column mb-auto mt-2">
        <!-- Consumer only links -->
        <li class="nav-item mb-1" *ngIf="user?.role === 'consommateur_simple'">
          <a routerLink="/dashboard/profile" routerLinkActive="active" class="nav-link text-white-50 d-flex align-items-center">
            <i class="bi bi-person-circle me-3 fs-5"></i>
            Profil
          </a>
        </li>
        <li class="nav-item mb-1" *ngIf="user?.role === 'consommateur_simple'">
          <a routerLink="/dashboard/reclamation" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}" class="nav-link text-white-50 d-flex align-items-center">
            <i class="bi bi-file-earmark-text me-3 fs-5"></i>
            Réclamations
          </a>
        </li>

        <!-- Admin Dashboard link (Common for both) -->
        <li class="nav-item mb-1" *ngIf="user?.role === 'super_admin' || user?.role === 'admin' || isAdminRoute()">
          <a [routerLink]="user?.role === 'super_admin' ? '/dashboard/admin-management' : '/dashboard/admin-home'" 
             routerLinkActive="active" 
             [routerLinkActiveOptions]="{exact: true}" 
             class="nav-link text-white-50 d-flex align-items-center">
            <i class="bi bi-speedometer2 me-3 fs-5"></i>
            Dashboard
          </a>
        </li>
        <li class="nav-item mb-1" *ngIf="user?.role === 'super_admin' || isAdminRoute()">
          <a routerLink="/dashboard/admin-management/users" routerLinkActive="active" class="nav-link text-white-50 d-flex align-items-center">
            <i class="bi bi-people-fill me-3 fs-5"></i>
            Utilisateurs
          </a>
        </li>
        <li class="nav-item mb-1" *ngIf="user?.role === 'super_admin' || isAdminRoute()">
          <a routerLink="/dashboard/admin-management/add" routerLinkActive="active" class="nav-link text-white-50 d-flex align-items-center">
            <i class="bi bi-person-plus-fill me-3 fs-5"></i>
            Ajouter Admin
          </a>
        </li>
        <li class="nav-item mb-1" *ngIf="user?.role === 'super_admin' || isAdminRoute()">
          <a routerLink="/dashboard/admin-management/security" routerLinkActive="active" class="nav-link text-white-50 d-flex align-items-center">
            <i class="bi bi-shield-lock-fill me-3 fs-5"></i>
            Sécurité
          </a>
        </li>

        <!-- Standard Admin links -->
        <li class="nav-item mb-1" *ngIf="user?.role === 'admin'">
          <a routerLink="/dashboard/admin/assign" routerLinkActive="active" class="nav-link text-white-50 d-flex align-items-center">
            <i class="bi bi-share-fill me-3 fs-5"></i>
            Affecter Réclamation
          </a>
        </li>
        <li class="nav-item mb-1" *ngIf="user?.role === 'admin'">
          <a routerLink="/dashboard/admin/complements" routerLinkActive="active" class="nav-link text-white-50 d-flex align-items-center">
            <i class="bi bi-plus-circle-fill me-3 fs-5"></i>
            Demandes Complément
          </a>
        </li>
        <li class="nav-item mb-1" *ngIf="user?.role === 'admin'">
          <a routerLink="/dashboard/admin/consumers" routerLinkActive="active" class="nav-link text-white-50 d-flex align-items-center">
            <i class="bi bi-people me-3 fs-5"></i>
            Consommateurs
          </a>
        </li>
      </ul>
      <hr class="border-secondary opacity-50">
      <div class="dropdown">
        <a href="#" class="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
          <div class="rounded-circle bg-warning d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
            <i class="bi bi-person-fill text-dark"></i>
          </div>
          <div class="d-flex flex-column">
            <strong *ngIf="user">{{ user.prenom }} {{ user.nom }}</strong>
            <strong *ngIf="!user">Mon Compte</strong>
          </div>
        </a>
        <ul class="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
          <li><button class="dropdown-item" (click)="logout()">Déconnexion</button></li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%) !important;
      box-shadow: 4px 0 10px rgba(0,0,0,0.1);
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

    .nav-link.active {
        background: rgba(59, 130, 246, 0.2) !important;
        color: #60a5fa !important;
        border-right: 4px solid #3b82f6;
        border-left: none;
    }
    
    .text-white-50 {
      color: rgba(255, 255, 255, 0.7) !important;
    }
  `]
})
export class SidebarComponent implements OnInit {
  user: any = null;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  isAdminRoute(): boolean {
    return this.router.url.includes('/admin-management');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
