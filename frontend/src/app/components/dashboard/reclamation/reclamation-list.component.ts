import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReclamationService } from '../../../services/reclamation.service';

@Component({
    selector: 'app-reclamation-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    template: `
    <div class="row justify-content-center fade-in">
      <div class="col-12">
        
        <!-- Header -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
            <div class="mb-3 mb-md-0">
                <h3 class="fw-bold text-primary mb-1">Mes Réclamations</h3>
                <p class="text-muted mb-0">Suivez l'état de vos demandes en temps réel.</p>
            </div>
            <div class="d-flex gap-3">
                <div class="input-group shadow-sm" style="width: 250px;">
                    <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control border-start-0 ps-0" placeholder="Rechercher..." [(ngModel)]="searchTerm" (input)="filterReclamations()">
                </div>
                <a routerLink="/dashboard/reclamation/new" class="btn btn-primary d-flex align-items-center shadow-sm px-4 py-2 rounded-pill">
                    <i class="bi bi-plus-lg me-2"></i>
                    <span class="fw-bold text-uppercase ls-1 small">Nouvelle</span>
                </a>
            </div>
        </div>

        <!-- List Card -->
        <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="py-3 ps-4 text-uppercase text-muted small fw-bold ls-1 border-0">Code Suivi</th>
                            <th class="py-3 text-uppercase text-muted small fw-bold ls-1 border-0">Sujet / Type</th>
                            <th class="py-3 text-uppercase text-muted small fw-bold ls-1 border-0">Date</th>
                            <th class="py-3 text-uppercase text-muted small fw-bold ls-1 border-0">Statut</th>
                            <th class="py-3 pe-4 text-end text-uppercase text-muted small fw-bold ls-1 border-0">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let rec of reclamations" class="cursor-pointer">
                            <td class="ps-4">
                                <span class="badge bg-light text-dark border font-monospace">{{ rec.trackingCode }}</span>
                            </td>
                            <td>
                                <div class="d-flex flex-column">
                                    <span class="fw-semibold text-dark">{{ rec.sujet || rec.secteur }}</span>
                                    <small class="text-muted">{{ rec.type }}</small>
                                </div>
                            </td>
                            <td class="text-muted">
                                {{ rec.dateCreation | date:'dd/MM/yyyy' }}
                            </td>
                            <td>
                                <span class="badge rounded-pill px-3 py-2 text-uppercase small fw-bold ls-1" 
                                    [ngClass]="{
                                        'bg-warning-subtle text-warning-emphasis': rec.statut === 'en_attente',
                                        'bg-info-subtle text-info-emphasis': rec.statut === 'en_cours',
                                        'bg-success-subtle text-success': rec.statut === 'traitee',
                                        'bg-danger-subtle text-danger': rec.statut === 'rejete'
                                    }">
                                    <i class="bi me-1" 
                                       [ngClass]="{
                                           'bi-hourglass-split': rec.statut === 'en_attente',
                                           'bi-arrow-repeat': rec.statut === 'en_cours',
                                           'bi-check-circle-fill': rec.statut === 'traitee',
                                           'bi-x-circle-fill': rec.statut === 'rejete'
                                       }"></i>
                                    {{ rec.statut.replace('_', ' ') }}
                                </span>
                            </td>
                            <td class="pe-4 text-end">
                                <button class="btn btn-sm btn-outline-secondary rounded-circle ms-2" title="Voir détails">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </td>
                        </tr>
                        
                        <!-- Empty State -->
                        <tr *ngIf="reclamations.length === 0 && !loading">
                            <td colspan="5" class="text-center py-5">
                                <i class="bi bi-inbox fs-1 text-muted opacity-50 mb-3 d-block"></i>
                                <h6 class="fw-bold text-muted">Aucune réclamation trouvée</h6>
                                <p class="small text-muted mb-0">Vos futures demandes apparaîtront ici.</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div *ngIf="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
            </div>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .ls-1 { letter-spacing: 1px; }
    .cursor-pointer { cursor: pointer; }
    .bg-info-subtle { background-color: #e0f2fe; }
    .text-info-emphasis { color: #0369a1; }
    .bg-warning-subtle { background-color: #fef3c7; }
    .text-warning-emphasis { color: #b45309; }
    .bg-success-subtle { background-color: #dcfce7; }
    .bg-danger-subtle { background-color: #fee2e2; }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]

})
export class ReclamationListComponent implements OnInit {
    allReclamations: any[] = [];
    reclamations: any[] = [];
    loading = true;
    searchTerm = '';

    constructor(private reclamationService: ReclamationService) { }

    ngOnInit(): void {
        this.reclamationService.getMyReclamations().subscribe({
            next: (data) => {
                this.allReclamations = data;
                this.reclamations = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    filterReclamations() {
        if (!this.searchTerm) {
            this.reclamations = this.allReclamations;
            return;
        }
        const lowerTerm = this.searchTerm.toLowerCase();
        this.reclamations = this.allReclamations.filter(rec =>
            rec.trackingCode?.toLowerCase().includes(lowerTerm) ||
            rec.secteur?.toLowerCase().includes(lowerTerm) ||
            rec.type?.toLowerCase().includes(lowerTerm) ||
            rec.statut?.toLowerCase().includes(lowerTerm)
        );
    }
}
