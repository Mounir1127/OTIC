import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { LocationService } from '../../../services/location.service';
import { AuthService } from '../../../services/auth.service';
import { Api } from '../../../services/api';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-admin-management',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="admin-pro-container fade-in">
        <!-- Premium Header Area -->
        <div class="admin-header mb-5 p-5 rounded-4 shadow-sm position-relative overflow-hidden">
            <div class="header-overlay"></div>
            <div class="position-relative z-1 d-flex align-items-center justify-content-between">
                <div>
                    <div class="badge-super-admin mb-3 animate-slide-in">
                        <i class="bi bi-shield-check me-2"></i> SUPER ADMINISTRATION
                    </div>
                    <h1 class="display-5 fw-bold text-white mb-2">Centre de Contrôle OTIC</h1>
                    <p class="text-white opacity-75 mb-0 fs-5">Gestion globale des utilisateurs et des données stratégiques de la plateforme.</p>
                </div>
                <div class="header-icon d-none d-lg-block opacity-25">
                    <i class="bi bi-gear-wide-connected" style="font-size: 8rem; color: white;"></i>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-5">
            <!-- Stats Grid -->
            <div class="col-lg-8">
                <div class="row g-3">
                    <div class="col-md-6" *ngFor="let stat of getStatsList()">
                        <div class="stat-card-pro p-4 rounded-4 shadow-sm bg-white border-0 h-100 transition-all" 
                             [routerLink]="stat.link" [queryParams]="stat.params">
                            <div class="d-flex align-items-center mb-3">
                                <div class="icon-circle-pro p-3 rounded-3" [style.background]="stat.bgColor" [style.color]="stat.color">
                                    <i [class]="'bi ' + stat.icon + ' fs-4'"></i>
                                </div>
                                <div class="ms-3">
                                    <p class="text-muted small fw-bold text-uppercase mb-0 ls-1">{{ stat.label }}</p>
                                    <h3 class="fw-bold mb-0">{{ stat.value }}</h3>
                                </div>
                                <i class="bi bi-arrow-up-right ms-auto text-muted opacity-25"></i>
                            </div>
                            <div class="progress mt-3" style="height: 5px;">
                                <div class="progress-bar" [style.backgroundColor]="stat.color" [style.width]="'75%'"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Action: Security & Info -->
            <div class="col-lg-4">
                <div class="card border-0 shadow-sm rounded-4 h-100 bg-dark text-white p-4 position-relative overflow-hidden">
                    <div class="position-relative z-1">
                        <h4 class="fw-bold mb-3">Statut du Système</h4>
                        <div class="d-flex align-items-center mb-4">
                            <div class="status-pulse me-2"></div>
                            <span class="text-success fw-bold">OPÉRATIONNEL</span>
                        </div>
                        <div class="mb-4">
                            <label class="small text-muted text-uppercase fw-bold d-block mb-1">Dernière activité</label>
                            <p class="mb-0 fw-medium">Il y a quelques secondes</p>
                        </div>
                        <button routerLink="/dashboard/profile" class="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm">
                            <i class="bi bi-person-circle me-2"></i> Mon Profil Pro
                        </button>
                    </div>
                    <div class="position-absolute bottom-0 end-0 opacity-10">
                        <i class="bi bi-shield-lock" style="font-size: 10rem; transform: translate(25%, 25%);"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <!-- Main Content Area: User Management Tools -->
            <div class="col-12">
                <div class="card border-0 shadow-sm rounded-4 h-100">
                    <div class="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                        <div>
                            <h4 class="fw-bold mb-0 text-dark">Actions d'Administration</h4>
                            <p class="text-muted small mb-0">Gestion centralisée des structures et des données</p>
                        </div>
                    </div>
                    <div class="card-body p-4 pt-0">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="modern-action-item p-4 rounded-4 border transition-all clickable h-100" routerLink="/dashboard/admin-management/users">
                                    <div class="d-flex align-items-center">
                                        <div class="action-icon-circle purple me-4"><i class="bi bi-people-fill"></i></div>
                                        <div>
                                            <h5 class="fw-bold mb-1">Annuaire des Utilisateurs</h5>
                                            <p class="text-muted mb-0 small">Visualiser, modifier ou suspendre les comptes utilisateurs et administrateurs.</p>
                                        </div>
                                        <i class="bi bi-chevron-right ms-auto"></i>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <div class="modern-action-item p-4 rounded-4 border transition-all clickable h-100" routerLink="/dashboard/mineral-waters">
                                    <div class="d-flex align-items-center">
                                        <div class="action-icon-circle ocean me-4"><i class="bi bi-droplet-fill"></i></div>
                                        <div>
                                            <h5 class="fw-bold mb-1">Base de Données des Eaux</h5>
                                            <p class="text-muted mb-0 small">Contrôler la liste des marques d'eaux minérales et leurs compositions analytiques.</p>
                                        </div>
                                        <i class="bi bi-chevron-right ms-auto"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    styles: [`
        .admin-pro-container { padding: 30px; background: #f8fafc; min-height: 100vh; }
        
        /* Premium Header */
        .admin-header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 70%, #334155 100%);
            min-height: 240px;
        }
        .header-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent);
            z-index: 0;
        }
        .badge-super-admin {
            display: inline-block;
            background: rgba(251, 191, 36, 0.15);
            color: #fbbf24;
            padding: 8px 16px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 0.8rem;
            letter-spacing: 1px;
            border: 1px solid rgba(251, 191, 36, 0.3);
        }

        /* Stat Cards */
        .stat-card-pro { 
            border: 1px solid #f1f5f9;
            cursor: pointer;
        }
        .stat-card-pro:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
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

        /* Modern Actions */
        .modern-action-item {
            background: #ffffff;
            border-color: #f1f5f9 !important;
            cursor: pointer;
        }
        .modern-action-item:hover {
            background: #f8fafc;
            border-color: #3b82f666 !important;
            transform: translateX(5px);
        }
        .action-icon-circle {
            width: 54px;
            height: 54px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
        }
        .action-icon-circle.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .action-icon-circle.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .action-icon-circle.ocean { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; }

        /* Helpers & Animations */
        .premium-header-dark { background: #1e293b; }
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
        .animate-slide-in { animation: slideIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        
        .clickable { cursor: pointer; }
        .transition-all { transition: all 0.3s ease; }
    `]
})
export class AdminManagementComponent implements OnInit, OnDestroy {
    users: any[] = [];
    private refreshSub: Subscription = new Subscription();

    stats = {
        totalUsers: 0,
        totalAdmins: 0,
        totalConsumers: 0,
        totalWaterBrands: 0
    };

    constructor(
        private adminService: AdminService,
        private authService: AuthService,
        private api: Api,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadCaches();
        this.loadUsers();
        this.loadWaterStats();

        this.refreshSub.add(
            this.adminService.refreshUsers$.subscribe(() => {
                this.loadUsers();
            })
        );
    }

    loadCaches() {
        const cachedStats = localStorage.getItem('otic_admin_stats');
        if (cachedStats) {
            try { this.stats = JSON.parse(cachedStats); } catch (e) { }
        }
    }

    getStatsList() {
        return [
            { label: 'Utilisateurs', value: this.stats.totalUsers, icon: 'bi-people-fill', bgColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', link: '/dashboard/admin-management/users', params: { filter: 'all' } },
            { label: 'Administrateurs', value: this.stats.totalAdmins, icon: 'bi-shield-shaded', bgColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', link: '/dashboard/admin-management/users', params: { filter: 'admin' } },
            { label: 'Consommateurs', value: this.stats.totalConsumers, icon: 'bi-person-check-fill', bgColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', link: '/dashboard/admin-management/users', params: { filter: 'consommateur_simple' } },
            { label: 'Eaux Minérales', value: this.stats.totalWaterBrands, icon: 'bi-droplet-fill', bgColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', link: '/dashboard/mineral-waters', params: {} }
        ];
    }

    loadUsers() {
        this.adminService.getUsers().subscribe({
            next: (data: any[]) => {
                this.users = data;
                this.calculateStats();
                this.cdr.detectChanges();
            },
            error: (err: any) => console.error(err)
        });
    }

    calculateStats() {
        this.stats.totalUsers = this.users.length;
        this.stats.totalAdmins = this.users.filter(u => u.role === 'admin_regional' || u.role === 'super_admin').length;
        this.stats.totalConsumers = this.users.filter(u => u.role === 'consommateur_simple').length;
        localStorage.setItem('otic_admin_stats', JSON.stringify(this.stats));
    }

    loadWaterStats() {
        this.api.getWaterBrands().subscribe({
            next: (data) => {
                this.stats.totalWaterBrands = data.length;
                localStorage.setItem('otic_admin_stats', JSON.stringify(this.stats));
                this.cdr.detectChanges();
            },
            error: (err: any) => console.error(err)
        });
    }

    ngOnDestroy() {
        this.refreshSub.unsubscribe();
    }
}
