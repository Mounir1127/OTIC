import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { AuthService } from '../../../../services/auth.service';
import { PdfService } from '../../../../services/pdf.service';
import { ChatbotService } from '../../../../services/chatbot.service';

@Component({
    selector: 'app-all-reclamations',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="admin-container fade-in">
        <div class="row mb-4 align-items-center">
            <div class="col-md-6">
                <h2 class="fw-bold text-dark mb-1">Toutes les Réclamations</h2>
                <p class="text-muted mb-0">
                    {{ userRole === 'admin_tre' ? 'Historique complet des réclamations de la diaspora' : 'Historique complet des réclamations de votre région' }}
                </p>
            </div>
            <div class="col-md-6 d-flex justify-content-md-end align-items-center gap-2 mt-3 mt-md-0">
                <!-- Date range for period -->
                <div class="d-flex align-items-center gap-2 me-2">
                    <input type="date" class="form-control form-control-sm rounded-pill" [(ngModel)]="startDate" (change)="applyFilters()">
                    <span class="text-muted small">à</span>
                    <input type="date" class="form-control form-control-sm rounded-pill" [(ngModel)]="endDate" (change)="applyFilters()">
                </div>
                
                <!-- Country filter for TRE -->
                <div *ngIf="userRole === 'admin_tre' || selectedTypeFilter === 'tre'" class="country-filter-wrap" style="min-width: 160px;">
                    <select class="form-select form-select-sm rounded-pill border-light-subtle bg-white shadow-sm" [(ngModel)]="selectedCountry" (change)="applyFilters()">
                        <option value="">Tous les pays</option>
                        <option *ngFor="let country of countries" [value]="country">{{ country }}</option>
                    </select>
                </div>

                <div class="btn-group shadow-sm rounded-pill overflow-hidden bg-white" *ngIf="userRole === 'super_admin'">
                    <button class="btn btn-sm px-3 py-2 border-0" [ngClass]="selectedTypeFilter === 'all' ? 'btn-primary' : 'btn-light'" (click)="setTypeFilter('all')">Tout</button>
                    <button class="btn btn-sm px-3 py-2 border-0" [ngClass]="selectedTypeFilter === 'regional' ? 'btn-primary' : 'btn-light'" (click)="setTypeFilter('regional')">Régional</button>
                    <button class="btn btn-sm px-3 py-2 border-0" [ngClass]="selectedTypeFilter === 'tre' ? 'btn-primary' : 'btn-light'" (click)="setTypeFilter('tre')">BDE (TRE)</button>
                </div>
            </div>
        </div>

        <div class="card list-card">
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Utilisateur</th>
                            <th>Type / Secteur</th>
                            <th>Statut</th>
                            <th>Date</th>
                            <th class="text-end">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let rec of filteredReclamations">
                            <td>
                                <span class="tracking-badge">{{rec.trackingCode}}</span>
                                <span *ngIf="!rec.lu" class="badge bg-danger ms-2 animate-pulse small">NOUVEAU</span>
                            </td>
                            <td>{{rec.user?.prenom}} {{rec.user?.nom}}</td>
                            <td>
                                <div class="small fw-bold">{{rec.type}}</div>
                                <div class="text-muted small">{{rec.secteur}}</div>
                            </td>
                            <td>
                                <span class="badge" [ngClass]="getStatusClass(rec.statut)">
                                    {{getStatusLabel(rec.statut)}}
                                </span>
                            </td>
                            <td>{{rec.dateCreation | date:'dd/MM/yyyy'}}</td>
                            <td class="text-end">
                                <button (click)="openDetails(rec)" 
                                        class="btn btn-primary btn-sm rounded-pill px-3">
                                    Détails
                                </button>
                            </td>
                        </tr>
                        <tr *ngIf="reclamations.length === 0 && !loading">
                            <td colspan="6" class="text-center py-5">
                                <i class="bi bi-inbox fs-1 text-muted opacity-50 mb-3 d-block"></i>
                                <h6 class="fw-bold text-muted">Aucune réclamation trouvée</h6>
                            </td>
                        </tr>
                        <tr *ngIf="reclamations.length === 0 && loading">
                            <td colspan="6" class="text-center py-5">
                                <div class="opacity-50 mb-3"><i class="bi bi-search fs-1"></i></div>
                                <h6 class="text-muted fw-light">Recherche des réclamations en cours...</h6>
                            </td>
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
                            <div class="mshell-header-eyebrow">Dossier Réclamation — Vue Admin</div>
                            <div class="mshell-header-code font-monospace">{{selectedReclamation?.trackingCode}}</div>
                        </div>
                        <div class="ms-auto d-flex align-items-center gap-3">
                            <span class="mshell-status-pill" [ngClass]="'status-' + selectedReclamation?.statut">
                                <i class="bi me-1"
                                   [class.bi-hourglass-split]="selectedReclamation?.statut === 'deposee'"
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

                    <!-- Fiche Professionnelle Template (Visible only on Print) -->
                    <div class="pro-sheet-container">
                        <!-- Header Section -->
                        <div class="sheet-header">
                            <div class="sheet-branding">
                                <h1 class="sheet-logo">OTIC</h1>
                                <p class="sheet-sub">Office du Thermalisme et de l'Hydrothérapie</p>
                            </div>
                            <div class="sheet-title-box">
                                <h2 class="sheet-doc-title">FICHE DE RÉCLAMATION</h2>
                                <p class="sheet-ref">Référence : #{{selectedReclamation.trackingCode}}</p>
                            </div>
                        </div>

                        <!-- Main Info Grid -->
                        <div class="sheet-grid">
                            <!-- Column 1: Identité -->
                            <div class="sheet-col">
                                <h3 class="sheet-section-h">1. IDENTITÉ DU PLAIGNANT</h3>
                                <div class="sheet-info-card">
                                    <div class="sheet-row"><span class="sheet-label">Nom & Prénom :</span> <span class="sheet-val">{{selectedReclamation.user?.prenom}} {{selectedReclamation.user?.nom}}</span></div>
                                    <div class="sheet-row"><span class="sheet-label">Email :</span> <span class="sheet-val">{{selectedReclamation.user?.email}}</span></div>
                                    <div class="sheet-row"><span class="sheet-label">Téléphone :</span> <span class="sheet-val">{{selectedReclamation.user?.telephone}}</span></div>
                                    <div class="sheet-row" *ngIf="selectedReclamation.user?.adresse">
                                        <span class="sheet-label">Adresse :</span> <span class="sheet-val">{{selectedReclamation.user?.adresse.ville}}, {{selectedReclamation.user?.adresse.region}} {{selectedReclamation.user?.adresse.codePostal}}</span>
                                    </div>
                                </div>
                            </div>
                            <!-- Column 2: Détails -->
                            <div class="sheet-col">
                                <h3 class="sheet-section-h">2. DÉTAILS DU DOSSIER</h3>
                                <div class="sheet-info-card">
                                    <div class="sheet-row"><span class="sheet-label">Date de dépôt :</span> <span class="sheet-val">{{selectedReclamation.dateCreation | date:'dd MMMM yyyy, HH:mm'}}</span></div>
                                    <div class="sheet-row"><span class="sheet-label">Statut actuel :</span> <span class="sheet-val status-text">{{getStatusLabel(selectedReclamation.statut)}}</span></div>
                                    <div class="sheet-row"><span class="sheet-label">Catégorie :</span> <span class="sheet-val">{{selectedReclamation.type}}</span></div>
                                    <div class="sheet-row"><span class="sheet-label">Secteur :</span> <span class="sheet-val">{{selectedReclamation.secteur}}</span></div>
                                </div>
                            </div>
                        </div>

                        <!-- Operator Info -->
                        <div class="sheet-full-row">
                            <h3 class="sheet-section-h">3. INCIDENT ET OPÉRATEUR CONCERNÉ</h3>
                            <div class="sheet-info-card">
                                <div class="sheet-row"><span class="sheet-label">Opérateur :</span> <span class="sheet-val highlight">{{selectedReclamation.operateur || 'Non spécifié'}}</span></div>
                                <div class="sheet-row"><span class="sheet-label">Activité :</span> <span class="sheet-val">{{selectedReclamation.activite || 'Générale'}}</span></div>
                                <div class="sheet-row" *ngIf="selectedReclamation.natures?.length">
                                    <span class="sheet-label">Nature du grief :</span> <span class="sheet-val">{{selectedReclamation.natures.join(' — ')}}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Description Section -->
                        <div class="sheet-full-row mt-4">
                            <h3 class="sheet-section-h">4. EXPOSÉ DES FAITS</h3>
                            <div class="sheet-description">
                                {{selectedReclamation.description || 'Aucune description détaillée fournie.'}}
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="sheet-footer-info">
                            <div class="sheet-cert">Document certifié conforme par la plateforme centrale de l'OTIC</div>
                            <div class="sheet-print-meta">Généré le {{ today | date:'dd/MM/yyyy HH:mm' }} — www.otic.tn</div>
                        </div>
                    </div>

                    <!-- EVERYTHING BELOW IS SCREEN-ONLY IN CSS -->
                    <div class="screen-only-content">
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
                                    <div class="mcard-meta-row" *ngIf="selectedReclamation.user?.adresse?.ville || selectedReclamation.user?.paysResidence">
                                        <i class="bi" [class.bi-geo-alt]="!selectedReclamation.user?.isTRE" [class.bi-globe]="selectedReclamation.user?.isTRE"></i>
                                        <span *ngIf="selectedReclamation.user?.isTRE">
                                            {{selectedReclamation.user?.paysResidence}}
                                        </span>
                                        <span *ngIf="!selectedReclamation.user?.isTRE">
                                            {{selectedReclamation.user?.adresse?.ville}}, {{selectedReclamation.user?.adresse?.region}} — CP {{selectedReclamation.user?.adresse?.codePostal}}
                                        </span>
                                    </div>
                                </div>
                                <!-- Professional info badge -->
                                <div *ngIf="selectedReclamation.complainantType === 'professionnel'" class="mt-3 pro-badge-info">
                                    <div class="pro-badge-label"><i class="bi bi-building-fill me-1"></i>Réclamation Professionnelle</div>
                                    <div class="pro-badge-row"><strong>{{selectedReclamation.raison_sociale}}</strong></div>
                                    <div class="pro-badge-row text-muted">MF: {{selectedReclamation.matricule_fiscal}}</div>
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
                                    <div class="mcard-meta-row"><i class="bi bi-grid-3x3-gap"></i><span>{{selectedReclamation.sous_secteur || 'N/A'}}</span></div>
                                    <div class="mcard-meta-row"><i class="bi bi-calendar3"></i><span>{{selectedReclamation.dateCreation | date:'dd MMMM yyyy, HH:mm'}}</span></div>
                                    <div class="mcard-meta-row"><i class="bi bi-geo"></i><span>Gouvernorat: {{selectedReclamation.gouvernorat || 'N/A'}}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section 2: Operator & Motifs -->
                    <div class="mshell-section-title"><i class="bi bi-building me-2"></i>Détails de l'Incident</div>
                    <div class="mshell-grid-2 mb-4">
                        <div class="mcard">
                            <div class="mcard-icon-wrap green"><i class="bi bi-shop"></i></div>
                            <div class="mcard-body">
                                <div class="mcard-label">Opérateur</div>
                                <div class="mcard-value">{{selectedReclamation.operateur || 'Non spécifié'}}</div>
                                <div class="mcard-meta mt-2">
                                    <div class="mcard-meta-row"><i class="bi bi-activity"></i><span>{{selectedReclamation.activite || 'Activité non spécifiée'}}</span></div>
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

                    <!-- Section 3: Description -->
                    <div class="mshell-section-title"><i class="bi bi-text-paragraph me-2"></i>Description des Faits</div>
                    <div class="description-block mb-4">
                        <div class="description-quote-icon"><i class="bi bi-quote"></i></div>
                        <p class="description-text">{{selectedReclamation.description || 'Aucune description fournie.'}}</p>
                    </div>

                    <!-- Section 4: Evidence -->
                    <ng-container *ngIf="selectedReclamation.preuves?.length">
                        <div class="mshell-section-title"><i class="bi bi-paperclip me-2"></i>Pièces Jointes & Preuves <span class="count-badge">{{selectedReclamation.preuves.length}}</span></div>
                        <div class="evidence-grid-pro mb-4">
                            <a *ngFor="let file of selectedReclamation.preuves" [href]="getFileUrl(file)" target="_blank" class="evidence-card-pro">
                                <div class="ev-thumb" *ngIf="isImage(file)">
                                    <img [src]="getFileUrl(file)" alt="Preuve" onerror="this.parentElement.innerHTML='<i class=&quot;bi bi-image-fill&quot;></i>'">
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

                    <!-- Section 5: History -->
                    <div class="mshell-section-title"><i class="bi bi-clock-history me-2"></i>Historique de Traitement</div>
                    <div class="timeline-container mb-4">
                        <div class="timeline-item" *ngFor="let entry of selectedReclamation.history">
                            <div class="timeline-marker" [ngClass]="getStatusClass(entry.statut)"></div>
                            <div class="timeline-content">
                                <div class="timeline-date">{{entry.date | date:'dd/MM/yyyy HH:mm'}}</div>
                                <!-- Comment removed from history view -->
                                <div class="timeline-status small opacity-75">{{getStatusLabel(entry.statut)}}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Section 6: Quick Status Update (Internal) with AI Copilot -->
                    <div class="mshell-section-title">
                        <i class="bi bi-gear-fill me-2"></i>Mettre à jour le dossier
                    </div>
                    <div class="card premium-card p-4 mb-4 status-update-card">
                        <div class="row g-3">
                            <!-- Dropdown column -->
                            <div class="col-md-4">
                                <label class="form-label fw-bold text-muted small mb-2">Statut du Dossier</label>
                                <select class="form-select status-select-new" [(ngModel)]="selectedStatus" [disabled]="selectedReclamation.statut === 'resolue' || selectedReclamation.statut === 'rejete'">
                                    <option value="deposee" [disabled]="selectedReclamation.statut === 'affectee_conventionne'">Déposée</option>
                                    <option value="en_cours" [disabled]="selectedReclamation.statut === 'affectee_conventionne'">En cours de traitement</option>
                                    <option value="demande_complement">Demande de complément</option>
                                    <option value="resolue">Résolue</option>
                                    <option value="rejete">Rejetée</option>
                                </select>

                                <div *ngIf="selectedReclamation.statut === 'resolue' || selectedReclamation.statut === 'rejete'" class="alert alert-info py-2 px-3 small mt-3 border-0 rounded-3">
                                    <i class="bi bi-info-circle me-1"></i> Le dossier est {{ getStatusLabel(selectedReclamation.statut).toLowerCase() }}.
                                </div>

                                <!-- AI Copilot Section Removed -->
                            </div>

                            <div class="col-md-8 d-flex flex-column justify-content-end">
                                <div class="d-flex justify-content-end align-items-center gap-3">
                                    <div *ngIf="statusUpdateSuccess" class="status-success-msg">
                                        <i class="bi bi-check-circle-fill me-1"></i> Dossier mis à jour !
                                    </div>
                                    
                                    <button class="mfooter-btn confirm px-5 py-3" 
                                            [disabled]="updatingStatus || selectedStatus === selectedReclamation.statut || generatingResponse || selectedReclamation.statut === 'resolue' || selectedReclamation.statut === 'rejete'" 
                                            (click)="updateStatus()">
                                        <i class="bi bi-check2-circle me-2" *ngIf="!updatingStatus"></i>
                                        <i class="bi bi-arrow-repeat spin me-2" *ngIf="updatingStatus"></i>
                                        Enregistrer les modifications
                                    </button>
                                </div>
                            </div>
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
                        <button class="mfooter-btn pdf" (click)="downloadSpecialPdf()">
                            <i class="bi bi-file-earmark-pdf-fill"></i> PDF Officiel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    styles: [`
        .admin-container { padding: 40px; background: #f1f5f9; min-height: 100vh; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .header-section { margin-bottom: 2.5rem; }
        .header-section h2 { color: #0f172a; font-weight: 800; letter-spacing: -0.025em; font-size: 2.25rem; margin-bottom: 0.5rem; }
        
        .tracking-badge { 
            background: #ffffff; border: 1px solid #e2e8f0; 
            padding: 5px 12px; border-radius: 8px; 
            font-family: 'JetBrains Mono', monospace; font-weight: 600; 
            font-size: 0.85rem; color: #475569;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .list-card { border: none; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05); overflow: hidden; background: white; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; }
        th { background: #f8fafc; padding: 16px 24px; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; }
        td { padding: 16px 24px; border-bottom: 1px solid #f8fafc; font-size: 0.95rem; color: #334155; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #f1f5f990; }
        
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

        /* Status badge styles - Premium Version */
        .badge { font-weight: 700; font-size: 0.75rem; text-transform: uppercase; padding: 6px 14px; border-radius: 8px; border: 1px solid transparent; }
        .bg-warning { background-color: #fffbeb !important; color: #92400e !important; border-color: #fde68a !important; }
        .bg-info { background-color: #f0f9ff !important; color: #075985 !important; border-color: #bae6fd !important; }
        .bg-primary { background-color: #eff6ff !important; color: #1e40af !important; border-color: #bfdbfe !important; }
        .bg-success { background-color: #f0fdf4 !important; color: #166534 !important; border-color: #bbf7d0 !important; }
        .bg-secondary { background-color: #f8fafc !important; color: #475569 !important; border-color: #e2e8f0 !important; }

        /* ========================= MODAL SHELL ========================= */
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(2, 6, 23, 0.82); backdrop-filter: blur(20px) saturate(180%);
            display: flex; align-items: center; justify-content: center;
            z-index: 2000; animation: fadeInOverlay 0.4s ease; padding: 16px;
        }
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        .modal-shell {
            background: #ffffff; border-radius: 28px; width: 100%; max-width: 850px;
            max-height: 92vh; display: flex; flex-direction: column;
            box-shadow: 0 60px 120px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15);
            animation: modalPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); overflow: hidden;
        }
        @keyframes modalPop {
            from { opacity: 0; transform: translateY(50px) scale(0.9); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* Header */
        .mshell-header { position: relative; overflow: hidden; flex-shrink: 0; padding: 28px 32px; }
        .mshell-header-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%); }
        .mshell-header-content { position: relative; z-index: 1; display: flex; align-items: center; gap: 20px; }
        .mshell-icon-wrap {
            width: 56px; height: 56px; flex-shrink: 0;
            background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.2); border-radius: 18px;
            display: flex; align-items: center; justify-content: center; font-size: 1.75rem; color: white;
        }
        .mshell-header-eyebrow { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: rgba(148,163,184,1); margin-bottom: 4px; }
        .mshell-header-code { font-size: 1.4rem; font-weight: 800; color: #fff; letter-spacing: 2px; }
        .mshell-close-btn {
            width: 40px; height: 40px; background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.15); border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            color: #fff; transition: all 0.3s; cursor: pointer; font-size: 1.1rem; flex-shrink: 0;
        }
        .mshell-close-btn:hover { background: rgba(255,255,255,0.25); transform: rotate(90deg) scale(1.1); }
        /* Status Pill */
        .mshell-status-pill { display: inline-flex; align-items: center; padding: 8px 16px; border-radius: 50px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid transparent; }
        .mshell-status-pill.status-en_attente { background: rgba(251,191,36,0.2); color: #fbbf24; border-color: rgba(251,191,36,0.3); }
        .mshell-status-pill.status-en_cours { background: rgba(59,130,246,0.2); color: #60a5fa; border-color: rgba(59,130,246,0.3); }
        .mshell-status-pill.status-traitee, .mshell-status-pill.status-resolue { background: rgba(34,197,94,0.2); color: #4ade80; border-color: rgba(34,197,94,0.3); }
        .mshell-status-pill.status-rejete, .mshell-status-pill.status-fermee { background: rgba(239,68,68,0.2); color: #f87171; border-color: rgba(239,68,68,0.3); }
        .mshell-status-pill.status-demande_complement { background: rgba(168,85,247,0.2); color: #c084fc; border-color: rgba(168,85,247,0.3); }
        /* Body */
        .mshell-body { overflow-y: auto; padding: 32px; flex: 1; background: #f8fafc; }
        .mshell-section-title { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 14px; display: flex; align-items: center; }
        .mshell-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        /* Info Cards */
        .mcard { background: #ffffff; border: 1px solid #e8edf5; border-radius: 20px; padding: 20px; display: flex; gap: 16px; align-items: flex-start; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .mcard:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.1); border-color: #c7d7f5; }
        .mcard-icon-wrap { width: 44px; height: 44px; flex-shrink: 0; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .mcard-icon-wrap.blue { background: #dbeafe; color: #2563eb; }
        .mcard-icon-wrap.purple { background: #ede9fe; color: #7c3aed; }
        .mcard-icon-wrap.green { background: #dcfce7; color: #16a34a; }
        .mcard-icon-wrap.orange { background: #ffedd5; color: #ea580c; }
        .mcard-body { flex: 1; min-width: 0; }
        .mcard-label { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 6px; }
        .mcard-value { font-size: 1.05rem; font-weight: 700; color: #0f172a; line-height: 1.3; }
        .mcard-meta { display: flex; flex-direction: column; gap: 5px; }
        .mcard-meta-row { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #64748b; }
        .mcard-meta-row i { color: #94a3b8; width: 14px; flex-shrink: 0; }
        /* Pro badge info */
        .pro-badge-info { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 12px; }
        .pro-badge-label { font-size: 0.75rem; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .pro-badge-row { font-size: 0.85rem; color: #1e40af; }
        /* Motif Chips */
        .motif-chip { background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; padding: 5px 14px; border-radius: 50px; font-size: 0.8rem; font-weight: 700; transition: all 0.2s; }
        .motif-chip:hover { background: #e0f2fe; border-color: #7dd3fc; color: #0369a1; }
        .motif-chip.autre { background: #ede9fe; border-color: #c4b5fd; color: #7c3aed; border-style: dashed; }
        /* Description */
        .description-block { background: #ffffff; border: 1px solid #e8edf5; border-radius: 20px; padding: 24px; position: relative; overflow: hidden; }
        .description-block::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: linear-gradient(180deg, #3b82f6, #8b5cf6); border-radius: 4px; }
        .description-quote-icon { font-size: 3rem; color: #dbeafe; line-height: 1; margin-bottom: 8px; }
        .description-text { color: #334155; line-height: 1.85; font-size: 0.97rem; margin: 0; padding-left: 8px; }
        /* Evidence Gallery */
        .count-badge { display: inline-flex; align-items: center; justify-content: center; background: #3b82f6; color: #fff; border-radius: 50px; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; margin-left: 8px; }
        .evidence-grid-pro { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
        .evidence-card-pro { background: #fff; border: 1px solid #e8edf5; border-radius: 16px; overflow: hidden; text-decoration: none; display: block; transition: all 0.3s; }
        .evidence-card-pro:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.15); border-color: #93c5fd; }
        .ev-thumb { height: 110px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
        .ev-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
        .evidence-card-pro:hover .ev-thumb img { transform: scale(1.08); }
        .ev-overlay { position: absolute; inset: 0; background: rgba(37,99,235,0.5); opacity: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; transition: opacity 0.3s; }
        .evidence-card-pro:hover .ev-overlay { opacity: 1; }
        .ev-doc { background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: #64748b; font-size: 2.5rem; }
        .ev-info { padding: 10px 12px; border-top: 1px solid #f1f5f9; }
        .ev-name { font-size: 0.72rem; font-weight: 700; color: #334155; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px; }
        .ev-action { font-size: 0.7rem; color: #3b82f6; font-weight: 600; }
        /* Footer */
        .mshell-footer { padding: 20px 32px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-shrink: 0; flex-wrap: wrap; }
        .mfooter-right-actions { display: flex; gap: 10px; }
        .mfooter-btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px; border-radius: 14px; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.3px; cursor: pointer; transition: all 0.3s; border: none; }
        .mfooter-btn.secondary { background: #f1f5f9; color: #475569; }
        .mfooter-btn.secondary:hover { background: #e2e8f0; color: #1e293b; transform: translateX(-4px); }
        .mfooter-btn.ghost { background: transparent; border: 1.5px solid #e2e8f0; color: #64748b; }
        .mfooter-btn.ghost:hover { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }
        .mfooter-btn.pdf { background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; box-shadow: 0 6px 20px -5px rgba(239,68,68,0.5); }
        .mfooter-btn.pdf:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 12px 24px -6px rgba(239,68,68,0.5); }
        .mfooter-btn.confirm { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
        .mfooter-btn.confirm:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .mfooter-btn.confirm:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        /* Status Update Zone */
        .status-update-zone { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .status-select { padding: 10px 14px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #334155; cursor: pointer; transition: all 0.2s; outline: none; flex: 1; min-width: 0; }
        .status-select:focus { border-color: #3b82f6; background: #eff6ff; }
        .status-success-msg { font-size: 0.82rem; font-weight: 700; color: #10b981; white-space: nowrap; }
        .spin { animation: spin 1.5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Timeline Styles */
        .timeline-container { position: relative; padding-left: 20px; }
        .timeline-container::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #e2e8f0; }
        .timeline-item { position: relative; margin-bottom: 20px; padding-bottom: 5px; }
        .timeline-marker { position: absolute; left: -25px; top: 2px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #e2e8f0; }
        .timeline-marker.bg-warning { background: #fbbf24; box-shadow: 0 0 0 2px rgba(251,191,36,0.2); }
        .timeline-marker.bg-info { background: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
        .timeline-marker.bg-primary { background: #8b5cf6; box-shadow: 0 0 0 2px rgba(139,92,246,0.2); }
        .timeline-marker.bg-success { background: #10b981; box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
        .timeline-marker.bg-secondary { background: #64748b; box-shadow: 0 0 0 2px rgba(100,116,139,0.2); }
        .timeline-marker.bg-danger { background: #ef4444; box-shadow: 0 0 0 2px rgba(239,68,68,0.2); }
        .timeline-date { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
        .timeline-action { font-size: 0.9rem; font-weight: 600; color: #334155; margin: 4px 0; }
        .timeline-status { font-size: 0.75rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; }

        /* Print Optimization - Using Global Styles */
        @media print {
            body { background: white !important; }
            .pro-sheet-container { display: block !important; visibility: visible !important; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }

        /* AI COPILOT PREMIUM COSMETICS */
        .status-update-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
            position: relative;
            overflow: hidden;
            transition: all 0.3s;
        }
        .status-update-card::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%);
            pointer-events: none;
        }
        .status-select-new {
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 0.9rem;
            font-weight: 600;
            border: 2px solid #e2e8f0;
            background: #f8fafc;
            color: #1e293b;
            outline: none;
            transition: all 0.2s;
            width: 100%;
        }
        .status-select-new:focus {
            border-color: #6366f1;
            background: #ffffff;
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        .ai-copilot-trigger-zone {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 1px dashed #cbd5e1;
            border-radius: 20px;
            padding: 18px;
            position: relative;
        }
        .ai-copilot-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            font-size: 0.65rem;
            font-weight: 800;
            letter-spacing: 1px;
            padding: 4px 10px;
            border-radius: 50px;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
            text-transform: uppercase;
        }
        .copilot-btn-glow {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 14px;
            font-size: 0.88rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
            position: relative;
            overflow: hidden;
        }
        .copilot-btn-glow:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(79, 70, 229, 0.45);
            filter: brightness(1.05);
        }
        .copilot-btn-glow:active:not(:disabled) {
            transform: translateY(1px);
        }
        .copilot-btn-glow:disabled {
            background: #94a3b8;
            box-shadow: none;
            cursor: not-allowed;
            opacity: 0.7;
        }
        .spin-copilot {
            animation: spin-ai 1.5s linear infinite;
        }
        @keyframes spin-ai {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.2); }
            100% { transform: rotate(360deg) scale(1); }
        }
        .status-textarea-new {
            padding: 16px;
            border-radius: 18px;
            font-size: 0.95rem;
            line-height: 1.6;
            border: 2px solid #e2e8f0;
            background: #ffffff;
            color: #334155;
            resize: none;
            outline: none;
            transition: all 0.3s;
            width: 100%;
            height: 100%;
            min-height: 180px;
        }
        .status-textarea-new:focus {
            border-color: #7c3aed;
            box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
        }
        .status-textarea-new:disabled {
            background: #f8fafc;
            color: #64748b;
        }
        .textarea-wrapper {
            position: relative;
        }
        .textarea-glow-pulse {
            position: absolute;
            inset: -2px;
            border-radius: 20px;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            z-index: -1;
            opacity: 0.4;
            animation: text-pulse 2s infinite alternate;
        }
        @keyframes text-pulse {
            0% { filter: blur(3px); opacity: 0.2; }
            100% { filter: blur(8px); opacity: 0.5; }
        }
        .ai-writing-status {
            font-size: 0.8rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            animation: text-blink 1.5s infinite;
        }
        @keyframes text-blink {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }
        .font-1-3 {
            font-size: 1.15rem;
        }

        .pro-sheet-container { display: none; }
    `]
})
export class AllReclamationsComponent implements OnInit {
    reclamations: any[] = [];
    selectedReclamation: any = null;
    showModal = false;
    loading = true;
    today = new Date();

    selectedStatus = '';
    statusComment = '';
    updatingStatus = false;
    statusUpdateSuccess = false;
    generatingResponse = false;

    userRole: string = '';
    selectedTypeFilter: string = 'all';
    filteredReclamations: any[] = [];

    // TRE Filters
    selectedCountry: string = '';
    startDate: string = '';
    endDate: string = '';
    countries: string[] = [
        'France', 'Italie', 'Allemagne', 'Canada', 'USA', 'Émirats Arabes Unis',
        'Qatar', 'Arabie Saoudite', 'Belgique', 'Suisse', 'Royaume-Uni',
        'Espagne', 'Pays-Bas', 'Suède', 'Libye', 'Algérie', 'Maroc', 'Égypte',
        'Turquie', 'Koweït', 'Oman'
    ].sort();

    constructor(
        private adminService: AdminService,
        private authService: AuthService,
        private pdfService: PdfService,
        private chatbotService: ChatbotService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.authService.currentUser$.subscribe(u => {
            this.userRole = u?.role || '';
            // Re-apply filters when role is known
            this.applyFilters();
        });

        const cached = localStorage.getItem('otic_admin_all_reclamations');
        if (cached) {
            try {
                this.reclamations = JSON.parse(cached);
                this.applyFilters(); // Show cached values immediately
                this.loading = false;
            } catch (e) { }
        }
        this.loadData();
    }

    loadData() {
        if (this.reclamations.length === 0) {
            this.loading = true;
        }
        this.adminService.getAllReclamations().subscribe({
            next: (data) => {
                this.reclamations = data;
                this.applyFilters();
                localStorage.setItem('otic_admin_all_reclamations', JSON.stringify(this.reclamations));
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching reclamations:', err);
                this.loading = false;
            }
        });
    }

    setTypeFilter(filter: string) {
        this.selectedTypeFilter = filter;
        this.applyFilters();
    }

    applyFilters() {
        let result = this.reclamations;

        // 1. Role/Type Filter
        if (this.userRole === 'super_admin') {
            if (this.selectedTypeFilter === 'regional') {
                result = result.filter(r => !r.isTRE);
            } else if (this.selectedTypeFilter === 'tre') {
                result = result.filter(r => r.isTRE);
            }
        }

        // 2. Country Filter (Only for TRE records)
        if (this.selectedCountry) {
            result = result.filter(r => r.isTRE && r.user?.paysResidence === this.selectedCountry);
        }

        // 3. Date Range Filter (Period)
        if (this.startDate) {
            const start = new Date(this.startDate);
            result = result.filter(r => new Date(r.dateCreation) >= start);
        }
        if (this.endDate) {
            const end = new Date(this.endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter(r => new Date(r.dateCreation) <= end);
        }

        this.filteredReclamations = result;
    }

    openDetails(reclamation: any) {
        this.selectedReclamation = reclamation;
        this.selectedStatus = reclamation.statut;
        this.statusComment = '';
        this.statusUpdateSuccess = false;
        this.showModal = true;

        if (!reclamation.lu && reclamation._id) {
            this.adminService.markAsRead(reclamation._id).subscribe({
                next: () => reclamation.lu = true,
                error: (err) => console.error(err)
            });
        }
    }

    closeModal() {
        this.showModal = false;
        this.selectedReclamation = null;
        this.statusUpdateSuccess = false;
    }

    printReclamation() {
        window.print();
    }

    async updateStatus() {
        if (!this.selectedReclamation || !this.selectedStatus) return;
        this.updatingStatus = true;
        this.statusUpdateSuccess = false;
        this.adminService.updateReclamationStatus(this.selectedReclamation._id, this.selectedStatus, this.statusComment).subscribe({
            next: (res) => {
                this.selectedReclamation.statut = this.selectedStatus;
                this.statusUpdateSuccess = true;
                this.updatingStatus = false;

                // Add to temporary local history for immediate feedback
                if (!this.selectedReclamation.history) this.selectedReclamation.history = [];
                this.selectedReclamation.history.push({
                    date: new Date(),
                    statut: this.selectedStatus,
                    action: this.statusComment || `Mise à jour par l'administration`
                });

                // Update in the list too
                const idx = this.reclamations.findIndex(r => r._id === this.selectedReclamation._id);
                if (idx !== -1) {
                    this.reclamations[idx].statut = this.selectedStatus;
                    this.reclamations[idx].history = this.selectedReclamation.history;
                }

                this.statusComment = '';
                setTimeout(() => this.statusUpdateSuccess = false, 3000);
            },
            error: (err) => {
                console.error('Status update error:', err);
                this.updatingStatus = false;
            }
        });
    }

    async downloadSpecialPdf() {
        if (!this.selectedReclamation) return;
        const user = this.selectedReclamation.user;
        await this.pdfService.generateReclamationPdf(this.selectedReclamation, user);
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'en_attente': return 'En attente';
            case 'deposee': return 'Déposée';
            case 'en_cours': return 'En cours';
            case 'affectee_conventionne': return 'Affectée';
            case 'demande_complement': return 'Complément';
            case 'resolue': return 'Résolue';
            case 'rejete': return 'Rejetée';
            default: return status;
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'en_attente': return 'bg-warning';
            case 'deposee': return 'bg-warning';
            case 'en_cours': return 'bg-info';
            case 'affectee_conventionne': return 'bg-primary';
            case 'demande_complement': return 'bg-primary';
            case 'resolue': return 'bg-success';
            case 'rejete': return 'bg-danger';
            default: return 'bg-dark';
        }
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

    // ==========================================
    // IA COPILOT - PROFESSIONAL RESPONSE GENERATION
    // ==========================================
    async generateAIResponse() {
        if (!this.selectedReclamation) return;
        this.generatingResponse = true;
        this.statusComment = '';

        this.chatbotService.generateCopilotResponse(
            this.selectedReclamation,
            (chunk) => {
                this.statusComment += chunk;
                this.cdr.detectChanges(); // Force UI update during streaming
            },
            () => {
                this.generatingResponse = false;
                this.cdr.detectChanges();
            },
            (err) => {
                console.error('Copilot Generation Error:', err);
                this.generatingResponse = false;
                this.statusComment = "Désolé, une erreur s'est produite lors de la génération de la réponse par le Copilote IA.";
                this.cdr.detectChanges();
            }
        );
    }
}
