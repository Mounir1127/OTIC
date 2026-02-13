import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../../services/admin.service';

@Component({
    selector: 'app-admin-home',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="admin-container fade-in">
        <div class="header-section mb-4">
            <h2 class="fw-bold text-primary">Tableau de Bord Administrateur</h2>
            <p class="text-muted">Vue d'ensemble de l'activité commerciale et des consommateurs</p>
        </div>

        <!-- Stats Row -->
        <div class="row g-4 mb-5">
            <div class="col-md-4">
                <div class="stat-card consumers shadow-sm">
                    <div class="d-flex align-items-center">
                        <div class="stat-icon me-3"><i class="bi bi-people-fill"></i></div>
                        <div>
                            <div class="stat-label">Consommateurs</div>
                            <div class="stat-value">{{stats.consumers}}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card pending shadow-sm">
                    <div class="d-flex align-items-center">
                        <div class="stat-icon me-3"><i class="bi bi-hourglass-split"></i></div>
                        <div>
                            <div class="stat-label">En Attente</div>
                            <div class="stat-value">{{stats.pending}}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card complements shadow-sm">
                    <div class="d-flex align-items-center">
                        <div class="stat-icon me-3"><i class="bi bi-plus-circle"></i></div>
                        <div>
                            <div class="stat-label">Compléments</div>
                            <div class="stat-value">{{stats.complements}}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Consumers List Section -->
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                <h5 class="fw-bold mb-0">Liste des Consommateurs (Base de données)</h5>
                <a routerLink="/dashboard/admin/consumers" class="btn btn-primary btn-sm rounded-pill px-3">Voir tout</a>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="ps-4">Consommateur</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th class="pe-4">Localisation</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let user of consumers">
                            <td class="ps-4">
                                <div class="d-flex align-items-center">
                                    <div class="avatar-small me-3">{{user.prenom[0]}}{{user.nom[0]}}</div>
                                    <span class="fw-medium">{{user.prenom}} {{user.nom}}</span>
                                </div>
                            </td>
                            <td>{{user.email}}</td>
                            <td>{{user.telephone}}</td>
                            <td class="pe-4">{{user.adresse?.region}} / {{user.adresse?.ville}}</td>
                        </tr>
                        <tr *ngIf="consumers.length === 0">
                            <td colspan="4" class="text-center py-5 text-muted">Chargement des consommateurs...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `,
    styles: [`
        .admin-container { padding: 30px; background: #f8fafc; min-height: 100vh; }
        .stat-card { background: white; padding: 25px; border-radius: 15px; transition: transform 0.2s; border-left: 5px solid transparent; }
        .stat-card:hover { transform: translateY(-3px); }
        .stat-card.consumers { border-left-color: #3b82f6; }
        .stat-card.pending { border-left-color: #f59e0b; }
        .stat-card.complements { border-left-color: #8b5cf6; }
        .stat-icon { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 1.5rem; background: #f1f5f9; color: #64748b; }
        .stat-label { color: #64748b; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; }
        .stat-value { font-size: 1.8rem; font-weight: 700; color: #1e293b; }
        .avatar-small { width: 35px; height: 35px; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.8rem; font-weight: bold; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `]
})
export class AdminHomeComponent implements OnInit {
    consumers: any[] = [];
    stats = {
        consumers: 0,
        pending: 0,
        complements: 0
    };

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.adminService.getConsumers().subscribe(data => {
            this.consumers = data.slice(0, 10);
            this.stats.consumers = data.length;
        });

        this.adminService.getPendingReclamations().subscribe(data => {
            this.stats.pending = data.length;
        });

        this.adminService.getComplementReclamations().subscribe(data => {
            this.stats.complements = data.length;
        });
    }
}
