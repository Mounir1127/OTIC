import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReclamationService } from '../../../services/reclamation.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="fade-in">
      <!-- Welcome Toast Overlay -->
      <div *ngIf="showWelcomeToast" class="welcome-toast-overlay">
        <div class="welcome-toast p-4 rounded-4 shadow-lg animate-slide-up">
            <div class="d-flex align-items-center mb-2">
                <div class="icon-circle me-3"><i class="bi bi-envelope-check-fill"></i></div>
                <h5 class="fw-bold mb-0">Bienvenue chez OTIC !</h5>
                <button (click)="closeToast()" class="btn-close ms-auto"></button>
            </div>
            <p class="mb-0 text-muted small">Votre compte est prêt. Un email de bienvenue vous a été envoyé à votre adresse.</p>
        </div>
      </div>

      <div class="mb-5">
        <h2 class="fw-bold text-primary mb-1">Tableau de Bord</h2>
        <p class="text-muted">Bienvenue dans votre espace de suivi.</p>
      </div>

      <!-- Summary Cards -->
      <div class="row g-4 mb-5">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100 overflow-hidden card-hover">
            <div class="card-body p-4 position-relative">
              <div class="d-flex align-items-center mb-3">
                <div class="icon-box bg-primary-subtle text-primary rounded-4 p-3 me-3">
                  <i class="bi bi-file-earmark-text-fill fs-4"></i>
                </div>
                <h6 class="text-uppercase text-muted fw-bold mb-0 small ls-1">Total Réclamations</h6>
              </div>
              <h2 class="display-4 fw-bold mb-0">{{ stats.total }}</h2>
              <div class="position-absolute bottom-0 end-0 p-3 opacity-10">
                <i class="bi bi-file-earmark-text" style="font-size: 5rem;"></i>
              </div>
            </div>
            <div class="card-footer bg-light border-0 py-3">
                <a routerLink="/dashboard/reclamation" class="text-primary fw-bold text-decoration-none small">Voir tout <i class="bi bi-arrow-right ms-1"></i></a>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100 overflow-hidden card-hover">
            <div class="card-body p-4 position-relative">
              <div class="d-flex align-items-center mb-3">
                <div class="icon-box bg-warning-subtle text-warning rounded-4 p-3 me-3">
                  <i class="bi bi-hourglass-split fs-4"></i>
                </div>
                <h6 class="text-uppercase text-muted fw-bold mb-0 small ls-1">En Cours</h6>
              </div>
              <h2 class="display-4 fw-bold mb-0">{{ stats.inProgress }}</h2>
              <div class="position-absolute bottom-0 end-0 p-3 opacity-10">
                <i class="bi bi-clock-history" style="font-size: 5rem;"></i>
              </div>
            </div>
             <div class="card-footer bg-light border-0 py-3">
                <small class="text-muted">En attente de traitement</small>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100 overflow-hidden card-hover">
            <div class="card-body p-4 position-relative">
              <div class="d-flex align-items-center mb-3">
                <div class="icon-box bg-success-subtle text-success rounded-4 p-3 me-3">
                  <i class="bi bi-check-circle-fill fs-4"></i>
                </div>
                <h6 class="text-uppercase text-muted fw-bold mb-0 small ls-1">Résolues</h6>
              </div>
              <h2 class="display-4 fw-bold mb-0">{{ stats.resolved }}</h2>
              <div class="position-absolute bottom-0 end-0 p-3 opacity-10">
                <i class="bi bi-patch-check" style="font-size: 5rem;"></i>
              </div>
            </div>
             <div class="card-footer bg-light border-0 py-3">
                <small class="text-success fw-medium"><i class="bi bi-graph-up-arrow me-1"></i>Traitées avec succès</small>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
         <div class="col-lg-8">
            <div class="card border-0 shadow-sm rounded-4 h-100 text-dark">
                <div class="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold mb-0">Activité Récente</h5>
                    <a routerLink="/dashboard/reclamation" class="btn btn-light btn-sm rounded-pill px-3">Tout voir</a>
                </div>
                <div class="card-body p-0">
                    <div *ngIf="recentReclamations.length === 0" class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-1 mb-3 d-block opacity-25"></i>
                        Aucune activité récente
                    </div>
                    <div class="list-group list-group-flush">
                        <a *ngFor="let rec of recentReclamations" routerLink="/dashboard/reclamation" class="list-group-item list-group-item-action p-4 border-light-subtle d-flex align-items-center">
                            <div class="rounded-circle bg-light d-flex align-items-center justify-content-center me-3 flex-shrink-0" style="width: 48px; height: 48px;">
                                <i class="bi" [ngClass]="getHostIcon(rec.secteur)"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between mb-1">
                                    <h6 class="fw-bold mb-0 text-dark">{{ rec.secteur }} <small class="text-muted fw-normal ms-2">{{ rec.trackingCode }}</small></h6>
                                    <span class="badge rounded-pill" [ngClass]="getStatusBadge(rec.statut)">{{ rec.statut?.replace('_', ' ') || 'En Attente' }}</span>
                                </div>
                                <p class="text-muted small mb-0 text-truncate" style="max-width: 400px;">{{ rec.description }}</p>
                            </div>
                            <div class="ms-3 text-end">
                                <small class="text-muted d-block">{{ rec.dateCreation | date:'dd MMM' }}</small>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
         </div>
         
         <div class="col-lg-4">
            <div class="card bg-primary text-white border-0 shadow-lg rounded-4 overflow-hidden mb-4 position-relative">
                <div class="card-body p-4 position-relative z-1 text-center">
                    <div class="mb-4">
                        <div class="bg-white bg-opacity-25 rounded-circle d-inline-flex p-3 mb-3">
                            <i class="bi bi-megaphone-fill fs-2"></i>
                        </div>
                        <h4 class="fw-bold">Un problème ?</h4>
                        <p class="mb-0 opacity-75">Signalez un dysfonctionnement ou une réclamation en quelques clics.</p>
                    </div>
                    <a routerLink="/dashboard/reclamation/new" class="btn btn-white text-primary w-100 py-3 rounded-pill fw-bold shadow-sm">Nouvelle Réclamation</a>
                </div>
                 <div class="position-absolute top-0 end-0 p-3 opacity-25">
                    <i class="bi bi-lightning-charge-fill" style="font-size: 10rem; transform: rotate(15deg) translate(20px, -20px);"></i>
                 </div>
            </div>
         </div>
      </div>
    </div>
  `,
  styles: [`
    .ls-1 { letter-spacing: 1px; }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* Welcome Toast Overlay */
    .welcome-toast-overlay {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 9999;
    }
    .welcome-toast {
        background: #ffffff;
        border-left: 5px solid #10b981;
        min-width: 350px;
        border-right: 1px solid #f1f5f9;
        border-top: 1px solid #f1f5f9;
        border-bottom: 1px solid #f1f5f9;
    }
    .icon-circle {
        width: 40px; height: 40px;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%;
        font-size: 1.2rem;
    }
    .animate-slide-up { animation: slideUp 0.5s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DashboardHomeComponent implements OnInit {
  stats = {
    total: 0,
    inProgress: 0,
    resolved: 0
  };
  recentReclamations: any[] = [];
  showWelcomeToast = false;

  constructor(
    private reclamationService: ReclamationService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.checkWelcomeFlag();

    const cached = localStorage.getItem('otic_dash_home_stats');
    if (cached) {
      try { this.stats = JSON.parse(cached); } catch (e) { }
    }

    this.authService.currentUser$.subscribe(user => {
      if (user?.role === 'super_admin') {
        this.router.navigate(['/dashboard/admin-management']);
      } else if (user?.role === 'admin_regional' || user?.role === 'admin_tre') {
        this.router.navigate(['/dashboard/admin-home']);
      }
    });

    this.reclamationService.getMyReclamations().subscribe({
      next: (data: any) => {
        if (data) {
          this.stats.total = data.length;
          this.stats.inProgress = data.filter((r: any) => r.status !== 'Résolue' && r.status !== 'Rejetée').length;
          this.stats.resolved = data.filter((r: any) => r.status === 'Résolue').length;
          this.recentReclamations = data.slice(0, 5);
          localStorage.setItem('otic_dash_home_stats', JSON.stringify(this.stats));
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  checkWelcomeFlag() {
    if (localStorage.getItem('otic_show_welcome') === 'true') {
        this.showWelcomeToast = true;
        localStorage.removeItem('otic_show_welcome');
        // Auto close after 8 seconds
        setTimeout(() => this.closeToast(), 8000);
    }
  }

  closeToast() {
    this.showWelcomeToast = false;
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'En Attente': return 'bg-warning-subtle text-warning';
      case 'En Cours': return 'bg-info-subtle text-info';
      case 'Résolue': return 'bg-success-subtle text-success';
      case 'Rejetée': return 'bg-danger-subtle text-danger';
      default: return 'bg-light text-muted border';
    }
  }

  getHostIcon(sector: string): string {
    if (sector?.toLowerCase().includes('comm')) return 'bi-shop text-primary';
    if (sector?.toLowerCase().includes('bank')) return 'bi-bank text-success';
    if (sector?.toLowerCase().includes('sant')) return 'bi-hospital text-danger';
    return 'bi-tag-fill text-muted';
  }
}
