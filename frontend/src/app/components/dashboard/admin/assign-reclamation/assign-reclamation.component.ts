import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';

@Component({
    selector: 'app-assign-reclamation',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="admin-container fade-in">
        <div class="header-section">
            <h2>Affecter Réclamations</h2>
            <p class="text-muted">Consultez les réclamations en attente d'affectation</p>
        </div>

        <div *ngIf="successMsg" class="alert alert-success">{{successMsg}}</div>
        <div *ngIf="errorMsg" class="alert alert-danger">{{errorMsg}}</div>

        <div class="card list-card">
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Utilisateur</th>
                            <th>Type / Secteur</th>
                            <th>Date</th>
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
                            <td class="text-end">
                                <button (click)="openDetails(rec)" 
                                        class="btn btn-primary btn-sm rounded-pill px-3">
                                    Détails
                                </button>
                            </td>
                        </tr>
                        <tr *ngIf="reclamations.length === 0">
                            <td colspan="5" class="text-center py-4">Aucune réclamation en attente d'affectation</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Details Modal - PREMIUM ADMIN DESIGN -->
        <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
            <div class="modal-shell" (click)="$event.stopPropagation()">

                <!-- === HEADER === -->
                <div class="mshell-header">
                    <div class="mshell-header-bg"></div>
                    <div class="mshell-header-content">
                        <div class="mshell-icon-wrap">
                            <i class="bi bi-file-earmark-medical-fill"></i>
                        </div>
                        <div class="mshell-header-text">
                            <div class="mshell-header-eyebrow">Affectation Réclamation — Vue Admin</div>
                            <div class="mshell-header-code font-monospace">{{selectedReclamation?.trackingCode}}</div>
                        </div>
                        <div class="ms-auto d-flex align-items-center gap-3">
                            <span class="mshell-status-pill" [ngClass]="'status-' + selectedReclamation?.statut">
                                <i class="bi me-1"
                                   [class.bi-hourglass-split]="selectedReclamation?.statut === 'deposee' || selectedReclamation?.statut === 'en_attente'"
                                   [class.bi-arrow-repeat]="selectedReclamation?.statut === 'en_cours'"
                                   [class.bi-check-circle-fill]="selectedReclamation?.statut === 'traitee' || selectedReclamation?.statut === 'resolue'"
                                   [class.bi-x-circle-fill]="selectedReclamation?.statut === 'rejete' || selectedReclamation?.statut === 'fermee'"
                                   [class.bi-question-circle-fill]="selectedReclamation?.statut === 'demande_complement'"
                                ></i>
                                {{getStatusLabel(selectedReclamation?.statut)}}
                            </span>
                            <button class="mshell-close-btn" (click)="closeModal()">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- === BODY === -->
                <div class="mshell-body" *ngIf="selectedReclamation" id="print-area">

                    <!-- Section 1: User & Classification -->
                    <div class="mshell-section-title"><i class="bi bi-person-vcard me-2"></i>Informations du Plaignant</div>
                    <div class="mshell-grid-2 mb-4">
                        <div class="mcard">
                            <div class="mcard-icon-wrap blue"><i class="bi bi-person-fill"></i></div>
                            <div class="mcard-body">
                                <div class="mcard-label">Identité</div>
                                <div class="mcard-value">{{selectedReclamation.user?.prenom}} {{selectedReclamation.user?.nom}}</div>
                                <div class="mcard-meta mt-2">
                                    <div class="mcard-meta-row" *ngIf="selectedReclamation.user?.email">
                                        <i class="bi bi-envelope"></i><span>{{selectedReclamation.user?.email}}</span>
                                    </div>
                                    <div class="mcard-meta-row" *ngIf="selectedReclamation.user?.telephone">
                                        <i class="bi bi-telephone"></i><span>{{selectedReclamation.user?.telephone}}</span>
                                    </div>
                                    <div class="mcard-meta-row" *ngIf="selectedReclamation.user?.adresse?.ville">
                                        <i class="bi bi-geo-alt"></i>
                                        <span>{{selectedReclamation.user?.adresse?.ville}}, {{selectedReclamation.user?.adresse?.region}}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mcard">
                            <div class="mcard-icon-wrap purple"><i class="bi bi-tags-fill"></i></div>
                            <div class="mcard-body">
                                <div class="mcard-label">Classification</div>
                                <div class="mcard-value">{{selectedReclamation.type || 'Réclamation'}}</div>
                                <div class="mcard-meta mt-2">
                                    <div class="mcard-meta-row"><i class="bi bi-grid"></i><span>{{selectedReclamation.secteur}}</span></div>
                                    <div class="mcard-meta-row"><i class="bi bi-calendar3"></i><span>{{selectedReclamation.dateCreation | date:'dd MMMM yyyy, HH:mm'}}</span></div>
                                    <div class="mcard-meta-row"><i class="bi bi-geo"></i><span>Gouvernorat: {{selectedReclamation.gouvernorat}}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section 2: Operator & Description -->
                    <div class="mshell-section-title"><i class="bi bi-building me-2"></i>Détails de l'Incident</div>
                    <div class="mshell-grid-2 mb-4">
                        <div class="mcard">
                            <div class="mcard-icon-wrap green"><i class="bi bi-shop"></i></div>
                            <div class="mcard-body">
                                <div class="mcard-label">Opérateur & Activité</div>
                                <div class="mcard-value">{{selectedReclamation.operateur || 'Non spécifié'}}</div>
                                <div class="mcard-meta mt-2">
                                    <div class="mcard-meta-row"><i class="bi bi-info-circle"></i><span>{{selectedReclamation.activite || 'Activité non spécifiée'}}</span></div>
                                    <div class="mcard-meta-row" *ngIf="selectedReclamation.sous_secteur"><i class="bi bi-grid-3x3-gap"></i><span>{{selectedReclamation.sous_secteur}}</span></div>
                                </div>
                            </div>
                        </div>
                        <div class="mcard">
                            <div class="mcard-icon-wrap orange"><i class="bi bi-exclamation-diamond-fill"></i></div>
                            <div class="mcard-body">
                                <div class="mcard-label">Motifs & Natures</div>
                                <div class="d-flex flex-wrap gap-2 mt-3" *ngIf="selectedReclamation.natures?.length || selectedReclamation.autre_nature; else noNatures">
                                    <span *ngFor="let nat of selectedReclamation.natures" class="motif-chip">{{nat}}</span>
                                    <span *ngIf="selectedReclamation.autre_nature" class="motif-chip autre">{{selectedReclamation.autre_nature}}</span>
                                </div>
                                <ng-template #noNatures><p class="text-muted small mt-2 mb-0">Aucun motif spécifié.</p></ng-template>
                            </div>
                        </div>
                    </div>

                    <div class="description-block mb-4">
                        <div class="description-quote-icon"><i class="bi bi-quote"></i></div>
                        <p class="description-text">{{selectedReclamation.description || 'Aucune description fournie.'}}</p>
                    </div>

                    <!-- Section Evidence -->
                    <ng-container *ngIf="selectedReclamation.preuves?.length">
                        <div class="mshell-section-title"><i class="bi bi-paperclip me-2"></i>Pièces Jointes <span class="count-badge">{{selectedReclamation.preuves.length}}</span></div>
                        <div class="evidence-grid-pro mb-4">
                            <a *ngFor="let file of selectedReclamation.preuves" [href]="getFileUrl(file)" target="_blank" class="evidence-card-pro">
                                <div class="ev-thumb" *ngIf="isImage(file)">
                                    <img [src]="getFileUrl(file)" alt="Preuve">
                                    <div class="ev-overlay"><i class="bi bi-zoom-in"></i></div>
                                </div>
                                <div class="ev-thumb ev-doc" *ngIf="!isImage(file)"><i class="bi bi-file-earmark-pdf-fill"></i></div>
                                <div class="ev-info">
                                    <span class="ev-name" [title]="file">{{file}}</span>
                                    <span class="ev-action">Ouvrir <i class="bi bi-arrow-up-right-square ms-1"></i></span>
                                </div>
                            </a>
                        </div>
                    </ng-container>

                    <!-- Section AFFECTATION - MATCHING SCREENSHOT -->
                    <div class="mshell-section-title text-uppercase letter-spacing-2">
                        <i class="bi bi-person-plus-fill me-2"></i>AFFECTATION AU PARTENAIRE CONVENTIONNÉ
                    </div>
                    <div class="assignment-card-img-style">
                        <div class="row g-3 align-items-center">
                            <div class="col-md-8">
                                <label class="mshell-header-eyebrow text-dark mb-2 d-block fw-bold">CHOISIR UN CONVENTIONNÉ</label>
                                <select class="form-select assignment-select-custom" [(ngModel)]="selectedConventionne">
                                    <option value="">-- Sélectionner un partenaire --</option>
                                    <option *ngFor="let conv of conventionnes" [value]="conv._id">
                                        {{conv.nom}} ({{conv.email}})
                                    </option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <button class="btn-affecter-now w-100" 
                                        [disabled]="!selectedConventionne || assigning"
                                        (click)="assignRec()">
                                    <i class="bi bi-send-fill me-2" *ngIf="!assigning"></i>
                                    <span *ngIf="!assigning">AFFECTER MAINTENANT</span>
                                    <span *ngIf="assigning" class="spinner-border spinner-border-sm me-2"></span>
                                    <span *ngIf="assigning">EN COURS...</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- === FOOTER === -->
                <div class="mshell-footer">
                    <button class="mfooter-btn secondary" (click)="closeModal()">
                        <i class="bi bi-arrow-left"></i> Fermer
                    </button>
                    <div class="mfooter-right-actions">
                        <button class="mfooter-btn ghost" (click)="printReclamation()">
                            <i class="bi bi-printer"></i> Imprimer
                        </button>
                    </div>
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

        /* ========================= MODAL SHELL PREMIUM ========================= */
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(2, 6, 23, 0.82); backdrop-filter: blur(20px) saturate(180%);
            display: flex; align-items: center; justify-content: center;
            z-index: 2000; animation: fadeInOverlay 0.4s ease; padding: 16px;
        }
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        .modal-shell {
            background: #ffffff; border-radius: 28px; width: 100%; max-width: 800px;
            max-height: 92vh; display: flex; flex-direction: column;
            box-shadow: 0 60px 120px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15);
            animation: modalPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); overflow: hidden;
        }
        @keyframes modalPop { from { opacity: 0; transform: translateY(50px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        .mshell-header { position: relative; overflow: hidden; flex-shrink: 0; padding: 24px 32px; }
        .mshell-header-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%); }
        .mshell-header-content { position: relative; z-index: 1; display: flex; align-items: center; gap: 20px; }
        .mshell-icon-wrap { width: 50px; height: 50px; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: white; }
        .mshell-header-eyebrow { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 2px; }
        .mshell-header-code { font-size: 1.25rem; font-weight: 800; color: #fff; letter-spacing: 2px; }
        .mshell-close-btn { width: 36px; height: 36px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: all 0.3s; }
        .mshell-close-btn:hover { background: rgba(255,255,255,0.25); transform: rotate(90deg); }
        
        .mshell-status-pill { display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; border: 1px solid transparent; }
        .mshell-status-pill.status-deposee, .mshell-status-pill.status-en_attente { background: rgba(251,191,36,0.2); color: #fbbf24; border-color: rgba(251,191,36,0.3); }
        .mshell-status-pill.status-en_cours { background: rgba(59,130,246,0.2); color: #60a5fa; border-color: rgba(59,130,246,0.3); }
        .mshell-status-pill.status-traitee, .mshell-status-pill.status-resolue { background: rgba(34,197,94,0.2); color: #4ade80; border-color: rgba(34,197,94,0.3); }
        .mshell-status-pill.status-rejete, .mshell-status-pill.status-fermee { background: rgba(239,68,68,0.2); color: #f87171; border-color: rgba(239,68,68,0.3); }
        .mshell-status-pill.status-demande_complement { background: rgba(168,85,247,0.2); color: #c084fc; border-color: rgba(168,85,247,0.3); }

        .mshell-body { overflow-y: auto; padding: 28px; flex: 1; background: #f8fafc; }
        .mshell-section-title { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 12px; display: flex; align-items: center; }
        .mshell-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        
        .mcard { background: #ffffff; border: 1px solid #e8edf5; border-radius: 18px; padding: 18px; display: flex; gap: 14px; align-items: flex-start; transition: all 0.3s; }
        .mcard:hover { transform: translateY(-3px); box-shadow: 0 15px 30px -10px rgba(0,0,0,0.08); border-color: #c7d7f5; }
        .mcard-icon-wrap { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .mcard-icon-wrap.blue { background: #dbeafe; color: #2563eb; }
        .mcard-icon-wrap.purple { background: #ede9fe; color: #7c3aed; }
        .mcard-icon-wrap.green { background: #dcfce7; color: #16a34a; }
        .mcard-icon-wrap.orange { background: #ffedd5; color: #ea580c; }
        .mcard-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
        .mcard-value { font-size: 1rem; font-weight: 700; color: #0f172a; line-height: 1.25; }
        .mcard-meta-row { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #64748b; margin-top: 4px; }
        
        .description-block { background: #ffffff; border: 1px solid #e8edf5; border-radius: 18px; padding: 20px; position: relative; overflow: hidden; }
        .description-block::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #3b82f6; }
        .description-quote-icon { font-size: 2.5rem; color: #dbeafe; opacity: 0.5; height: 30px; line-height: 1; }
        .description-text { color: #334155; line-height: 1.7; font-size: 0.92rem; margin: 0; }

        .motif-chip { background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 700; }
        .motif-chip.autre { background: #ede9fe; border-color: #c4b5fd; color: #7c3aed; border-style: dashed; }
        .letter-spacing-2 { letter-spacing: 2px !important; }

        .assignment-card-img-style { 
            background: #f0f7ff; 
            border: 2px solid #bfdbfe; 
            border-radius: 20px; 
            padding: 24px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.02);
            margin-bottom: 24px;
        }
        .assignment-select-custom {
            height: 60px;
            border-radius: 15px;
            border: 2.5px solid #bfdbfe;
            font-weight: 600;
            color: #1e3a8a;
            padding-left: 20px;
        }
        .assignment-select-custom:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 0.25rem rgba(59, 130, 246, 0.1);
        }
        .btn-affecter-now {
            height: 60px;
            background: #3b82f6;
            color: white;
            border-radius: 15px;
            border: none;
            font-weight: 800;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 16px rgba(59, 130, 246, 0.25);
            transition: all 0.3s;
        }
        .btn-affecter-now:hover:not(:disabled) {
            background: #2563eb;
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(59, 130, 246, 0.35);
        }
        .btn-affecter-now:disabled {
            background: #94a3b8;
            box-shadow: none;
            opacity: 0.7;
        }

        .mshell-footer { padding: 18px 32px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .mfooter-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; }
        .mfooter-btn.secondary { background: #f1f5f9; color: #475569; }
        .mfooter-btn.ghost { background: transparent; border: 1.5px solid #e2e8f0; color: #64748b; }
        .mfooter-btn.ghost:hover { background: #f8fafc; }

        .evidence-grid-pro { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
        .evidence-card-pro { background: #fff; border: 1px solid #e8edf5; border-radius: 14px; overflow: hidden; text-decoration: none; display: block; }
        .ev-thumb { height: 90px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
        .ev-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .ev-doc { font-size: 2rem; color: #64748b; }
        .ev-info { padding: 8px; border-top: 1px solid #f1f5f9; }
        .ev-name { font-size: 0.68rem; font-weight: 700; color: #334155; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ev-action { font-size: 0.65rem; color: #3b82f6; font-weight: 600; }
        .count-badge { background: #3b82f6; color: white; padding: 2px 6px; border-radius: 50px; font-size: 0.6rem; margin-left: 6px; }

        @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            .modal-overlay { background: white; backdrop-filter: none; }
            .modal-shell { box-shadow: none; border: none; width: 100% !important; max-width: none !important; }
            .mshell-footer, .mshell-close-btn { display: none !important; }
        }
    `]
})
export class AssignReclamationComponent implements OnInit {
    reclamations: any[] = [];
    conventionnes: any[] = [];
    selectedReclamation: any = null;
    selectedConventionne: string = '';
    showModal = false;
    assigning = false;
    successMsg = '';
    errorMsg = '';

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        // Load from cache for "direct" feel
        const cachedRecs = localStorage.getItem('otic_admin_pending_recs');
        const cachedConvs = localStorage.getItem('otic_admin_conventionnes_list');
        
        if (cachedRecs) {
            try { this.reclamations = JSON.parse(cachedRecs); } catch (e) { }
        }
        if (cachedConvs) {
            try { this.conventionnes = JSON.parse(cachedConvs); } catch (e) { }
        }

        this.loadData();
        this.loadConventionnes();
    }

    loadData() {
        this.adminService.getPendingReclamations().subscribe({
            next: (data) => {
                this.reclamations = data;
                localStorage.setItem('otic_admin_pending_recs', JSON.stringify(data));
            },
            error: (err) => console.error(err)
        });
    }

    loadConventionnes() {
        this.adminService.getConventionnes().subscribe({
            next: (data) => {
                this.conventionnes = data;
                localStorage.setItem('otic_admin_conventionnes_list', JSON.stringify(data));
            },
            error: (err) => console.error('Error fetching conventionnes:', err)
        });
    }

    openDetails(reclamation: any) {
        this.selectedReclamation = reclamation;
        this.selectedConventionne = '';
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

    assignRec() {
        if (!this.selectedReclamation || !this.selectedConventionne) return;
        this.assigning = true;
        this.adminService.assignReclamation(this.selectedReclamation._id, this.selectedConventionne).subscribe({
            next: () => {
                this.successMsg = `Réclamation ${this.selectedReclamation.trackingCode} affectée avec succès.`;
                this.assigning = false;
                this.closeModal();
                this.loadData();
                setTimeout(() => this.successMsg = '', 5000);
            },
            error: (err) => {
                console.error(err);
                this.errorMsg = 'Erreur lors de l’affectation.';
                this.assigning = false;
                setTimeout(() => this.errorMsg = '', 5000);
            }
        });
    }

    getStatusLabel(status: string): string {
        const labels:any = {
            'deposee': 'Déposée',
            'en_attente': 'En attente',
            'en_cours': 'En cours',
            'affectee_conventionne': 'Affectée',
            'traitee': 'Traitée',
            'resolue': 'Résolue',
            'rejete': 'Rejetée',
            'demande_complement': 'Complément',
            'fermee': 'Fermée'
        };
        return labels[status] || status;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'en_attente': return 'bg-warning';
            case 'deposee': return 'bg-warning';
            case 'en_cours': return 'bg-info';
            case 'affectee_conventionne': return 'bg-primary';
            case 'demande_complement': return 'bg-primary';
            case 'resolue': return 'bg-success';
            case 'fermee': return 'bg-secondary';
            case 'rejete': return 'bg-danger';
            default: return 'bg-dark';
        }
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
        if (file.startsWith('http')) return file;
        return `http://localhost:5000/uploads/${encodeURIComponent(file)}`;
    }
}
