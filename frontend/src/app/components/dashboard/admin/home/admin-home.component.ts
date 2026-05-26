import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../../services/admin.service';
import { AuthService } from '../../../../services/auth.service';
import { Api } from '../../../../services/api';

@Component({
    selector: 'app-admin-home',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="admin-pro-container fade-in">
        <!-- Premium Regional/TRE Header -->
        <div class="regional-header mb-5 p-5 rounded-4 shadow-sm position-relative overflow-hidden"
             [ngClass]="{'tre-bg': user?.role === 'admin_tre'}">
            <div class="header-overlay"></div>
            <div class="position-relative z-1 d-flex align-items-center justify-content-between">
                <div>
                    <div class="badge-regional mb-3 animate-slide-in">
                        <i class="bi" [ngClass]="user?.role === 'admin_tre' ? 'bi-globe' : 'bi-geo-alt-fill'"></i> 
                        {{ user?.role === 'admin_tre' ? 'ADMINISTRATION DIASPORA (TRE)' : 'ADMINISTRATION RÉGIONALE' }}
                    </div>
                    <h1 class="display-5 fw-bold text-white mb-2">
                        {{ user?.role === 'admin_tre' ? "Gestion des Tunisiens à l'Étranger" : "Tableau de Bord de Proximité" }}
                    </h1>
                    <p class="text-white opacity-75 mb-0 fs-5">
                        {{ user?.role === 'admin_tre' ? "Supervision des réclamations et suivi de la diaspora tunisienne." : "Coordination des réclamations et suivi des consommateurs de votre région." }}
                    </p>
                </div>
                <div class="header-icon d-none d-lg-block opacity-25">
                    <i class="bi" [ngClass]="user?.role === 'admin_tre' ? 'bi-globe-central-south_asia' : 'bi-person-workspace'" style="font-size: 8rem; color: white;"></i>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-5">
            <!-- Stats Grid -->
            <div class="col-lg-8">
                <div class="row g-3">
                    <div class="col-md-4" *ngFor="let stat of getStatsList()">
                        <div class="stat-card-pro p-4 rounded-4 shadow-sm bg-white border-0 h-100 transition-all clickable" 
                             [routerLink]="stat.link">
                            <div class="d-flex align-items-center mb-3">
                                <div class="icon-circle-pro p-3 rounded-3" [style.background]="stat.bgColor" [style.color]="stat.color">
                                    <i [class]="'bi ' + stat.icon + ' fs-4'"></i>
                                </div>
                                <div class="ms-3">
                                    <p class="text-muted small fw-bold text-uppercase mb-0 ls-1">{{ stat.label }}</p>
                                    <h3 class="fw-bold mb-0">{{ stat.value }}</h3>
                                </div>
                            </div>
                            <div class="progress mt-3" style="height: 5px;">
                                <div class="progress-bar" [style.backgroundColor]="stat.color" [style.width]="'60%'"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Insight Panel -->
            <div class="col-lg-4">
                <div class="card border-0 shadow-sm rounded-4 h-100 bg-dark text-white p-4 position-relative overflow-hidden">
                    <div class="position-relative z-1">
                        <h4 class="fw-bold mb-3">Disponibilité Services</h4>
                        <div class="d-flex align-items-center mb-4">
                            <div class="status-pulse me-2"></div>
                            <span class="text-success fw-bold">RÉGION OPÉRATIONNELLE</span>
                        </div>
                        <div class="user-summary bg-white-10 p-3 rounded-3 mb-4">
                            <div class="d-flex justify-content-between small opacity-75 mb-2">
                                <span>Réclamations Traitées</span>
                                <span class="fw-bold">85%</span>
                            </div>
                            <div class="progress bg-secondary" style="height: 4px;">
                                <div class="progress-bar bg-info" style="width: 85%"></div>
                            </div>
                        </div>
                        <button routerLink="/dashboard/admin/messages" class="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm">
                            <i class="bi bi-chat-dots me-2"></i> Consulter Messagerie
                        </button>
                    </div>
                    <!-- Decorative back icon -->
                    <div class="position-absolute bottom-0 end-0 opacity-10">
                        <i class="bi bi-activity" style="font-size: 10rem; transform: translate(25%, 25%);"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Consumers Table -->
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            <div class="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                <div>
                    <h4 class="fw-bold mb-0 text-dark">Répertoire des Consommateurs</h4>
                    <p class="text-muted small mb-0">Données régionales récemment synchronisées</p>
                </div>
                <a routerLink="/dashboard/admin/consumers" class="btn btn-outline-primary btn-sm rounded-pill px-4 fw-bold">Voir l'annuaire complet</a>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 custom-table">
                    <thead class="bg-light">
                        <tr>
                            <th class="ps-4">Consommateur</th>
                            <th>Coordonnées</th>
                            <th>Localisation</th>
                            <th class="text-end pe-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let user of consumers" class="user-row">
                            <td class="ps-4">
                                <div class="d-flex align-items-center">
                                    <div class="avatar-circle-pro me-3 fw-bold overflow-hidden">
                                        <img [src]="user.photoProfil" *ngIf="user.photoProfil" class="img-fluid w-100 h-100" style="object-fit: cover;">
                                        <span *ngIf="!user.photoProfil">{{user.prenom?.[0]}}{{user.nom?.[0]}}</span>
                                    </div>
                                    <div>
                                        <h6 class="mb-0 fw-bold">{{user.prenom}} {{user.nom}}</h6>
                                        <small class="text-muted opacity-75">{{ user.isTRE ? 'Client Diaspora' : 'Client Régional' }}</small>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div><i class="bi bi-envelope small me-2 text-muted"></i>{{user.email}}</div>
                                <div class="small text-muted"><i class="bi bi-telephone small me-2"></i>{{user.telephone}}</div>
                            </td>
                            <td>
                                <span class="badge bg-light text-dark border-light-subtle fw-medium px-3 py-2 rounded-pill">
                                    <ng-container *ngIf="user.isTRE">
                                        <i class="bi bi-globe me-1"></i> {{ user.paysResidence }}
                                    </ng-container>
                                    <ng-container *ngIf="!user.isTRE">
                                        {{user.adresse?.region}} / {{user.adresse?.ville}}
                                    </ng-container>
                                </span>
                            </td>
                            <td class="text-end pe-4">
                                <button class="btn btn-light-pro btn-sm rounded-circle" [routerLink]="['/dashboard/admin/consumers']">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </td>
                        </tr>
                        <tr *ngIf="consumers.length === 0">
                            <td colspan="4" class="text-center py-5 text-muted">
                                <i class="bi bi-person-badge opacity-25 d-block fs-1 mb-2"></i>
                                Aucun consommateur à afficher pour le moment.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `,
    styles: [`
        .admin-pro-container { padding: 30px; background: #f8fafc; min-height: 100vh; }
        
        /* Premium Header */
        .regional-header {
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 70%, #60a5fa 100%);
            min-height: 240px;
        }
        .regional-header.tre-bg {
            background: linear-gradient(135deg, #064e3b 0%, #059669 70%, #34d399 100%);
        }
        .header-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.1), transparent);
            z-index: 0;
        }
        .badge-regional {
            display: inline-block;
            background: rgba(255, 255, 255, 0.15);
            color: white;
            padding: 8px 16px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 0.8rem;
            letter-spacing: 1px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
        }

        /* Stat Cards */
        .stat-card-pro { 
            border: 1px solid #f1f5f9;
        }
        .stat-card-pro:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05) !important;
            border-color: #3b82f633;
        }
        .icon-circle-pro {
            width: 56px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .ls-1 { letter-spacing: 1px; }

        /* Custom Table */
        .custom-table thead th {
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #64748b;
            border-bottom: 0;
            padding: 1.25rem 1rem;
        }
        .user-row { transition: all 0.2s; }
        .user-row:hover { background-color: #f8fafc; }
        .avatar-circle-pro {
            width: 40px; height: 40px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            background: #e0e7ff; color: #4338ca; font-size: 0.85rem;
        }

        .btn-light-pro { 
            background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0;
            width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
        }
        .btn-light-pro:hover { background: #3b82f6; color: white; border-color: #3b82f6; }

        .bg-white-10 { background: rgba(255, 255, 255, 0.1); }

        /* Status & Animation */
        .status-pulse {
            width: 10px; height: 10px;
            background: #22c55e;
            border-radius: 50%;
            box-shadow: 0 0 0 rgba(34, 197, 94, 0.4);
            animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .fade-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-in { animation: slideIn 0.5s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        
        .clickable { cursor: pointer; }
        .transition-all { transition: all 0.3s ease; }
    `]
})
export class AdminHomeComponent implements OnInit {
    user: any = null;
    consumers: any[] = [];
    stats = {
        consumers: 0,
        pending: 0,
        complements: 0
    };

    constructor(
        private adminService: AdminService,
        private authService: AuthService,
        private api: Api,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.authService.currentUser$.subscribe(u => {
            this.user = u;
            this.cdr.detectChanges();
        });
        this.loadCaches();
        this.loadData();
    }

    loadCaches() {
        const cached = localStorage.getItem('otic_admin_home_stats');
        if (cached) {
            try { this.stats = JSON.parse(cached); } catch (e) { }
        }
    }

    getStatsList() {
        return [
            { label: 'Consommateurs', value: this.stats.consumers, icon: 'bi-people-fill', bgColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', link: '/dashboard/admin/consumers' },
            { label: 'En Attente', value: this.stats.pending, icon: 'bi-hourglass-split', bgColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', link: '/dashboard/admin/assign' },
            { label: 'Compléments', value: this.stats.complements, icon: 'bi-plus-circle', bgColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', link: '/dashboard/admin/assign' }
        ];
    }

    loadData() {
        this.adminService.getConsumers().subscribe({
            next: (data) => {
                this.consumers = data.slice(0, 8);
                this.stats.consumers = data.length;
                this.saveStats();
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('❌ AdminHome: Consumers fetch error:', err);
                this.consumers = [];
                this.cdr.detectChanges();
            }
        });

        this.adminService.getPendingReclamations().subscribe({
            next: (data) => {
                this.stats.pending = data.length;
                this.saveStats();
                this.cdr.detectChanges();
            },
            error: (err) => console.error('❌ AdminHome: Pending fetch error:', err)
        });

        this.adminService.getComplementReclamations().subscribe({
            next: (data) => {
                this.stats.complements = data.length;
                this.saveStats();
                this.cdr.detectChanges();
            },
            error: (err) => console.error('❌ AdminHome: Complements fetch error:', err)
        });

        // Pre-fetch Water Brands for instant display in that component
        this.api.getWaterBrands().subscribe();
    }

    saveStats() {
        localStorage.setItem('otic_admin_home_stats', JSON.stringify(this.stats));
    }
}
