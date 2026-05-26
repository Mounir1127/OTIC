import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../services/admin.service';

@Component({
    selector: 'app-consumers-list',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="admin-container fade-in">
        <div class="header-section">
            <h2>Liste des Consommateurs</h2>
            <p class="text-muted">Gérez les comptes des consommateurs simples inscrits sur la plateforme</p>
        </div>

        <div class="card list-card">
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Nom & Prénom</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Région / Ville</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let user of users">
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="avatar me-2">{{user.prenom[0]}}{{user.nom[0]}}</div>
                                    {{user.prenom}} {{user.nom}}
                                </div>
                            </td>
                            <td>{{user.email}}</td>
                            <td>{{user.telephone}}</td>
                             <td>
                                <span class="badge bg-light text-dark border-light-subtle fw-medium px-3 py-1 rounded-pill">
                                    <ng-container *ngIf="user.isTRE">
                                        <i class="bi bi-globe me-1"></i> {{ user.paysResidence }}
                                    </ng-container>
                                    <ng-container *ngIf="!user.isTRE">
                                        {{user.adresse?.region}} / {{user.adresse?.ville}}
                                    </ng-container>
                                </span>
                            </td>
                        </tr>
                        <tr *ngIf="users.length === 0 && !loading">
                            <td colspan="4" class="text-center py-5 text-muted">
                                <i class="bi bi-people opacity-25 d-block fs-1 mb-2"></i>
                                Aucun consommateur répertorié.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `,
    styles: [`
        .admin-container { padding: 30px; background: #f8fafc; min-height: 100%; }
        .header-section { margin-bottom: 2rem; }
        .list-card { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f1f5f9; padding: 12px 15px; text-align: left; font-size: 0.85rem; text-transform: uppercase; color: #64748b; }
        td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
        .avatar { width: 32px; height: 32px; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.8rem; font-weight: bold; }
    `]
})
export class ConsumersListComponent implements OnInit {
    users: any[] = [];
    loading = true;

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        const cached = localStorage.getItem('otic_admin_consumers_list');
        if (cached) {
            try {
                this.users = JSON.parse(cached);
                this.loading = false;
            } catch (e) { }
        }
        this.loadData();
    }

    loadData() {
        if (this.users.length === 0) this.loading = true;
        this.adminService.getConsumers().subscribe({
            next: (data) => {
                this.users = data;
                localStorage.setItem('otic_admin_consumers_list', JSON.stringify(this.users));
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }
}
