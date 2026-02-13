import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../services/admin.service';

@Component({
    selector: 'app-complement-requests',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="admin-container fade-in">
        <div class="header-section">
            <h2>Demandes de Complément</h2>
            <p class="text-muted">Suivez les réclamations nécessitant des informations supplémentaires</p>
        </div>

        <div class="card list-card">
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Utilisateur</th>
                            <th>Type / Secteur</th>
                            <th>Date</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let rec of reclamations">
                            <td><span class="tracking-badge">{{rec.trackingCode}}</span></td>
                            <td>{{rec.user?.prenom}} {{rec.user?.nom}}</td>
                            <td>
                                <div class="small fw-bold">{{rec.type}}</div>
                                <div class="text-muted small">{{rec.secteur}}</div>
                            </td>
                            <td>{{rec.dateCreation | date:'dd/MM/yyyy'}}</td>
                            <td>
                                <span class="badge rounded-pill bg-warning text-dark px-3">En attente compléments</span>
                            </td>
                        </tr>
                        <tr *ngIf="reclamations.length === 0">
                            <td colspan="5" class="text-center py-4">Aucune demande de complément en cours</td>
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
        .tracking-badge { background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: bold; }
        .list-card { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f1f5f9; padding: 12px 15px; text-align: left; font-size: 0.85rem; text-transform: uppercase; color: #64748b; }
        td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    `]
})
export class ComplementRequestsComponent implements OnInit {
    reclamations: any[] = [];

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.adminService.getComplementReclamations().subscribe({
            next: (data) => this.reclamations = data,
            error: (err) => console.error(err)
        });
    }
}
