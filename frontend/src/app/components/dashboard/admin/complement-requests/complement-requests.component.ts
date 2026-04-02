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
                            <th class="text-end">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let rec of reclamations">
                            <td>
                                <span class="tracking-badge">{{rec.trackingCode}}</span>
                                <span *ngIf="!rec.lu" class="badge bg-danger ms-2 animate-pulse small">NOUVEAU</span>
                            </td>
                            <td>{{rec.user?.prenom}} {{rec.user?.nom}}</td>
                            <td>
                                <div class="small fw-bold">{{rec.type}}</div>
                                <div class="text-muted small">{{rec.secteur}}</div>
                            </td>
                            <td>{{rec.dateCreation | date:'dd/MM/yyyy'}}</td>
                            <td>
                                <span class="badge rounded-pill bg-warning text-dark px-3">En attente compléments</span>
                            </td>
                            <td class="text-end">
                                <button (click)="openDetails(rec)" 
                                        class="btn btn-primary btn-sm rounded-pill px-3">
                                    Détails
                                </button>
                            </td>
                        </tr>
                        <tr *ngIf="reclamations.length === 0">
                            <td colspan="6" class="text-center py-4">Aucune demande de complément en cours</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Details Modal -->
        <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
            <div class="modal-content pro-modal" (click)="$event.stopPropagation()">
                <div class="modal-header pro-header">
                    <div class="header-icon">
                        <i class="bi bi-file-earmark-text"></i>
                    </div>
                    <div class="header-title">
                        <h5 class="mb-0 fw-bold">Détails de la Réclamation</h5>
                        <small class="text-muted font-monospace">{{selectedReclamation?.trackingCode}}</small>
                    </div>
                    <button class="btn-close-pro" (click)="closeModal()">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div class="modal-body pro-body p-4" *ngIf="selectedReclamation">
                    <div class="row g-4" id="print-area">
                        <!-- Information Grid -->
                        <div class="col-md-6">
                            <div class="pro-info-card">
                                <label class="pro-label">Utilisateur / Client</label>
                                <p class="pro-value mb-1">{{selectedReclamation.user?.prenom}} {{selectedReclamation.user?.nom}}</p>
                                <span class="pro-badge">{{selectedReclamation.user?.email || 'Email non fourni'}}</span>
                                <div class="mt-2 small text-muted">
                                    <i class="bi bi-geo-alt-fill me-1"></i>{{selectedReclamation.gouvernorat || 'Gouvernorat non spécifié'}}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="pro-info-card">
                                <label class="pro-label">Classification & Date</label>
                                <p class="pro-value mb-1">{{selectedReclamation.type}}</p>
                                <div class="mb-2"><span class="pro-badge light">{{selectedReclamation.secteur}}</span></div>
                                <small class="text-muted"><i class="bi bi-calendar3 me-1"></i>{{selectedReclamation.dateCreation | date:'dd/MM/yyyy HH:mm'}}</small>
                            </div>
                        </div>

                        <!-- Specific Details -->
                        <div class="col-md-6">
                            <div class="pro-info-card h-100">
                                <label class="pro-label">Activité & Sous-Secteur</label>
                                <p class="pro-value mb-1">{{selectedReclamation.sous_secteur || 'Non spécifié'}}</p>
                                <p class="text-muted small mb-0">{{selectedReclamation.activite || 'Activité non spécifiée'}}</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="pro-info-card h-100">
                                <label class="pro-label">Opérateur Concerné</label>
                                <p class="pro-value mb-1">{{selectedReclamation.operateur || 'Non spécifié'}}</p>
                                <span class="badge bg-light text-dark border"><i class="bi bi-building me-1"></i>ENTREPRISE</span>
                            </div>
                        </div>

                        <!-- Natures / Motifs -->
                        <div class="col-md-12">
                            <div class="pro-info-card">
                                <label class="pro-label">Motifs / Natures de la réclamation</label>
                                <div class="d-flex flex-wrap gap-2 mt-2">
                                    <span *ngFor="let nat of selectedReclamation.natures" class="nature-tag">
                                        {{nat}}
                                    </span>
                                    <span *ngIf="selectedReclamation.autre_nature" class="nature-tag autre">
                                        Autre: {{selectedReclamation.autre_nature}}
                                    </span>
                                    <span *ngIf="!selectedReclamation.natures?.length && !selectedReclamation.autre_nature" class="text-muted small">
                                        Aucun motif spécifié
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-12">
                            <div class="pro-info-card">
                                <label class="pro-label">Description détaillée</label>
                                <div class="pro-description">
                                    {{selectedReclamation.description || 'Aucune description fournie.'}}
                                </div>
                            </div>
                        </div>

                        <!-- Preuves / Images -->
                        <div class="col-md-12" *ngIf="selectedReclamation.preuves?.length">
                            <div class="pro-info-card">
                                <label class="pro-label">Pièces Jointes / Preuves ({{selectedReclamation.preuves.length}})</label>
                                <div class="evidence-grid mt-3">
                                    <div class="evidence-item" *ngFor="let file of selectedReclamation.preuves">
                                        <div class="evidence-preview bg-light position-relative">
                                            <ng-container *ngIf="isImage(file); else nonImage">
                                                <img [src]="getFileUrl(file)" style="width: 100%; height: 100%; object-fit: cover;" alt="Preuve" onerror="this.src='assets/images/placeholder.jpg'; this.onerror=null;">
                                            </ng-container>
                                            <ng-template #nonImage>
                                                <i class="bi bi-file-earmark-text fs-1 text-muted"></i>
                                            </ng-template>
                                        </div>
                                        <div class="evidence-meta text-center pb-2">
                                            <span class="file-name" [title]="file">{{file}}</span>
                                            <a [href]="getFileUrl(file)" target="_blank" class="btn btn-sm btn-link text-decoration-none fw-bold p-0 mt-1 d-block" style="font-size: 0.8rem;"><i class="bi bi-eye"></i> Voir le fichier</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer pro-footer">
                    <button class="btn-pro btn-pro-secondary" (click)="closeModal()">
                        <i class="bi bi-arrow-left me-2"></i>RETOUR
                    </button>
                    <button class="btn-pro btn-pro-print" (click)="printReclamation()">
                        <i class="bi bi-printer me-2"></i>IMPRIMER PDF
                    </button>
                </div>
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
        tr:hover { background: #f8fafc; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

        /* Pro Modal Styles */
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px);
            display: flex; align-items: center; justify-content: center;
            z-index: 2000; animation: fadeInOverlay 0.4s ease;
        }
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }

        .pro-modal {
            background: #ffffff; border-radius: 24px; width: 95%; max-width: 700px;
            overflow: hidden; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.2);
            animation: slideUpScale 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUpScale { 
            from { opacity: 0; transform: translateY(30px) scale(0.95); } 
            to { opacity: 1; transform: translateY(0) scale(1); } 
        }

        .pro-header {
            background: #f8fafc; padding: 24px 32px; border-bottom: 1px solid #e2e8f0;
            display: flex; align-items: center; position: relative;
        }
        .header-icon {
            width: 48px; height: 48px; background: #3b82f6; border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 1.5rem; margin-right: 20px;
            box-shadow: 0 8px 16px -4px rgba(59, 130, 246, 0.4);
        }
        .header-title h5 { color: #1e293b; font-size: 1.25rem; font-weight: 700; }
        .btn-close-pro {
            position: absolute; right: 24px; top: 24px;
            background: #f1f5f9; border: none; width: 36px; height: 36px;
            border-radius: 12px; display: flex; align-items: center; justify-content: center;
            color: #64748b; transition: all 0.2s; cursor: pointer;
        }
        .btn-close-pro:hover { background: #e2e8f0; color: #1e293b; transform: rotate(90deg); }

        .pro-body { background: #fff; padding: 32px !important; }
        .pro-info-card { 
            background: #f8fafc; padding: 20px; border-radius: 16px; 
            border: 1px solid #f1f5f9; transition: all 0.3s;
        }
        .pro-info-card:hover { transform: translateY(-2px); border-color: #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .pro-label { font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
        .pro-value { font-size: 1.1rem; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
        .pro-badge { background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; }
        
        .pro-description {
            background: white; border: 1px solid #e2e8f0; border-radius: 12px;
            padding: 20px; color: #475569; line-height: 1.7; font-size: 1rem;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); margin-top: 10px;
        }

        .pro-footer {
            padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0;
            display: flex; justify-content: flex-end;
        }
        .btn-pro {
            padding: 12px 24px; border-radius: 14px; font-weight: 700; font-size: 0.85rem;
            letter-spacing: 0.5px; transition: all 0.3s; border: none; display: flex; align-items: center;
        }
        .btn-pro-secondary { background: #64748b; color: white; }
        .btn-pro-secondary:hover { background: #475569; transform: translateX(-4px); }
        .btn-pro-print { background: #10b981; color: white; border: none; }
        .btn-pro-print:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }

        .nature-tag { background: #fff; border: 1px solid #e2e8f0; padding: 6px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 600; color: #475569; }
        .nature-tag.autre { border-style: dashed; border-color: #3b82f6; color: #3b82f6; }
        .pro-badge.light { background: #f1f5f9; color: #475569; }

        .evidence-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px; }
        .evidence-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; transition: all 0.2s; }
        .evidence-item:hover { border-color: #3b82f6; transform: scale(1.02); }
        .evidence-preview { height: 100px; background: #f8fafc; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #f1f5f9; }
        .evidence-meta { padding: 8px 12px; }
        .file-name { font-size: 0.75rem; color: #64748b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            .modal-overlay { background: white; backdrop-filter: none; }
            .pro-modal { box-shadow: none; border: none; width: 100% !important; max-width: none !important; }
            .pro-footer, .btn-close-pro { display: none !important; }
            .pro-info-card { border: 1px solid #e2e8f0 !important; page-break-inside: avoid; }
        }
    `]
})
export class ComplementRequestsComponent implements OnInit {
    reclamations: any[] = [];
    selectedReclamation: any = null;
    showModal = false;

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        // Load from cache for "direct" feel
        const cached = localStorage.getItem('otic_admin_complement_recs');
        if (cached) {
            try { this.reclamations = JSON.parse(cached); } catch (e) { }
        }
        this.loadData();
    }

    loadData() {
        this.adminService.getComplementReclamations().subscribe({
            next: (data) => {
                this.reclamations = data;
                localStorage.setItem('otic_admin_complement_recs', JSON.stringify(data));
            },
            error: (err) => console.error(err)
        });
    }

    openDetails(reclamation: any) {
        this.selectedReclamation = reclamation;
        this.showModal = true;

        // Mark as read when opening details
        if (!reclamation.lu && reclamation._id) {
            this.adminService.markAsRead(reclamation._id).subscribe({
                next: () => {
                    reclamation.lu = true;
                },
                error: (err) => console.error('Error marking as read:', err)
            });
        }
    }

    closeModal() {
        this.showModal = false;
        this.selectedReclamation = null;
    }

    printReclamation() {
        window.print();
    }

    isImage(file: string): boolean {
        if (!file) return false;
        return file.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) != null;
    }

    getFileUrl(file: string): string {
        if (!file) return '';
        if (file.startsWith('http://') || file.startsWith('https://') || file.startsWith('data:image')) {
            return file;
        }
        return `http://localhost:5000/uploads/${encodeURIComponent(file)}`;
    }
}
