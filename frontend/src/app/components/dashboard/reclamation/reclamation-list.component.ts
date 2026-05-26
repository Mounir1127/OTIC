import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ReclamationService } from '../../../services/reclamation.service';
import { NotificationService } from '../../../services/notification.service';
import { PdfService } from '../../../services/pdf.service';
import { AuthService } from '../../../services/auth.service';

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
                    <span class="input-group-text bg-white border-end-0 text-muted" [ngClass]="{'bg-dark-input': true}"><i class="bi bi-search"></i></span>
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
                    <thead class="bg-light-subtle text-primary">
                        <tr>
                            <th class="py-3 ps-4 text-uppercase small fw-bold ls-1 border-0">Code Suivi</th>
                            <th class="py-3 text-uppercase small fw-bold ls-1 border-0">Sujet / Type</th>
                            <th class="py-3 text-uppercase small fw-bold ls-1 border-0">Date</th>
                            <th class="py-3 text-uppercase small fw-bold ls-1 border-0">Statut</th>
                            <th class="py-3 pe-4 text-end text-uppercase small fw-bold ls-1 border-0">Actions</th>
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
                                        'bg-warning-subtle text-warning-emphasis': rec.statut === 'deposee' || rec.statut === 'en_attente',
                                        'bg-info-subtle text-info-emphasis': rec.statut === 'en_cours',
                                        'bg-primary-subtle text-primary-emphasis': rec.statut === 'affectee_conventionne' || rec.statut === 'demande_complement',
                                        'bg-success-subtle text-success': rec.statut === 'resolue' || rec.statut === 'fermee',
                                        'bg-danger-subtle text-danger': rec.statut === 'rejete'
                                    }">
                                    <i class="bi me-1" 
                                       [ngClass]="{
                                           'bi-hourglass-split': rec.statut === 'deposee' || rec.statut === 'en_attente',
                                           'bi-arrow-repeat': rec.statut === 'en_cours',
                                           'bi-person-check-fill': rec.statut === 'affectee_conventionne',
                                           'bi-check-circle-fill': rec.statut === 'resolue' || rec.statut === 'fermee',
                                           'bi-x-circle-fill': rec.statut === 'rejete'
                                       }"></i>
                                    {{ getStatusLabel(rec.statut) }}
                                </span>
                            </td>
                            <td class="pe-4 text-end">
                                <button (click)="openDetails(rec)" class="btn btn-sm btn-outline-secondary rounded-circle ms-2" title="Voir détails">
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
                        
                        <!-- Loading State -->
                        <tr *ngIf="loading && reclamations.length === 0">
                            <td colspan="5" class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Chargement...</span>
                                </div>
                                <p class="small text-muted mt-2 mb-0">Récupération de vos réclamations...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Details Modal - PREMIUM REDESIGN -->
        <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
            <div class="modal-shell" (click)="$event.stopPropagation()">

                <!-- === MODAL HEADER === -->
                <div class="mshell-header">
                    <div class="mshell-header-bg"></div>
                    <div class="mshell-header-content">
                        <div class="mshell-icon-wrap">
                            <i class="bi bi-file-earmark-medical-fill"></i>
                        </div>
                        <div class="mshell-header-text">
                            <div class="mshell-header-eyebrow">Dossier Réclamation Officiel</div>
                            <div class="mshell-header-code font-monospace">{{selectedReclamation?.trackingCode}}</div>
                        </div>
                        <div class="ms-auto d-flex align-items-center gap-3">
                            <span class="mshell-status-pill" [ngClass]="'status-' + selectedReclamation?.statut">
                                <i class="bi me-1"
                                   [class.bi-hourglass-split]="selectedReclamation?.statut === 'deposee' || selectedReclamation?.statut === 'en_attente'"
                                   [class.bi-arrow-repeat]="selectedReclamation?.statut === 'en_cours'"
                                   [class.bi-person-check-fill]="selectedReclamation?.statut === 'affectee_conventionne'"
                                   [class.bi-check-circle-fill]="selectedReclamation?.statut === 'resolue' || selectedReclamation?.statut === 'fermee'"
                                   [class.bi-x-circle-fill]="selectedReclamation?.statut === 'rejete'"
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

                <!-- === MODAL BODY === -->
                <div class="mshell-body" *ngIf="selectedReclamation" id="print-area">

                    <!-- Fiche Professionnelle Template (Visible only on Print) -->
                    <div class="pro-sheet-container">
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

                        <div class="sheet-grid">
                            <div class="sheet-col">
                                <h3 class="sheet-section-h">1. IDENTITÉ DU PLAIGNANT</h3>
                                <div class="sheet-info-card">
                                    <div class="sheet-row"><span class="sheet-label">Nom & Prénom :</span> <span class="sheet-val">{{selectedReclamation.user?.prenom}} {{selectedReclamation.user?.nom}}</span></div>
                                    <div class="sheet-row"><span class="sheet-label">Email :</span> <span class="sheet-val">{{selectedReclamation.user?.email}}</span></div>
                                    <div class="sheet-row"><span class="sheet-label">Téléphone :</span> <span class="sheet-val">{{selectedReclamation.user?.telephone}}</span></div>
                                </div>
                            </div>
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

                        <div class="sheet-full-row mt-4">
                            <h3 class="sheet-section-h">4. EXPOSÉ DES FAITS</h3>
                            <div class="sheet-description">
                                {{selectedReclamation.description || 'Aucune description détaillée fournie.'}}
                            </div>
                        </div>

                        <div class="sheet-footer-info">
                            <div class="sheet-cert">Document certifié conforme par la plateforme centrale de l'OTIC</div>
                            <div class="sheet-print-meta">Généré le {{ today | date:'dd/MM/yyyy HH:mm' }} — www.otic.tn</div>
                        </div>
                    </div>

                    <!-- EVERYTHING BELOW IS SCREEN-ONLY IN CSS -->
                    <div class="screen-only-content">
                        <div class="mshell-section-title"><i class="bi bi-person-vcard me-2"></i>Informations Générales</div>
                        <!-- REST OF THE MODAL BODY CONTENT -->
                    <div class="mshell-grid-2 mb-4">
                        <!-- Complainant Card -->
                        <div class="mcard">
                            <div class="mcard-icon-wrap blue"><i class="bi bi-person-fill"></i></div>
                            <div class="mcard-body">
                                <div class="mcard-label">Plaignant</div>
                                <div class="mcard-value">{{selectedReclamation.user?.prenom}} {{selectedReclamation.user?.nom}}</div>
                                <div class="mcard-meta mt-2">
                                    <div class="mcard-meta-row" *ngIf="selectedReclamation.user?.email">
                                        <i class="bi bi-envelope"></i>
                                        <span>{{selectedReclamation.user?.email}}</span>
                                    </div>
                                    <div class="mcard-meta-row" *ngIf="selectedReclamation.user?.telephone">
                                        <i class="bi bi-telephone"></i>
                                        <span>{{selectedReclamation.user?.telephone}}</span>
                                    </div>
                                    <div class="mcard-meta-row" *ngIf="selectedReclamation.user?.adresse?.ville">
                                        <i class="bi bi-geo-alt"></i>
                                        <span>{{selectedReclamation.user?.adresse?.ville}}, {{selectedReclamation.user?.adresse?.region}} — CP {{selectedReclamation.user?.adresse?.codePostal}}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Classification Card -->
                        <div class="mcard">
                            <div class="mcard-icon-wrap purple"><i class="bi bi-tags-fill"></i></div>
                            <div class="mcard-body">
                                <div class="mcard-label">Classification</div>
                                <div class="mcard-value">{{selectedReclamation.type || 'Réclamation'}}</div>
                                <div class="mcard-meta mt-2">
                                    <div class="mcard-meta-row">
                                        <i class="bi bi-grid"></i>
                                        <span>{{selectedReclamation.secteur}}</span>
                                    </div>
                                    <div class="mcard-meta-row">
                                        <i class="bi bi-grid-3x3-gap"></i>
                                        <span>{{selectedReclamation.sous_secteur || 'N/A'}}</span>
                                    </div>
                                    <div class="mcard-meta-row">
                                        <i class="bi bi-calendar3"></i>
                                        <span>{{selectedReclamation.dateCreation | date:'dd MMMM yyyy, HH:mm'}}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section 2: Operator & Motifs -->
                    <div class="mshell-section-title"><i class="bi bi-building me-2"></i>Détails de l'Incident</div>
                    <div class="mshell-grid-2 mb-4">
                        <!-- Operator Card -->
                        <div class="mcard">
                            <div class="mcard-icon-wrap green"><i class="bi bi-shop"></i></div>
                            <div class="mcard-body">
                                <div class="mcard-label">Opérateur</div>
                                <div class="mcard-value">{{selectedReclamation.operateur || 'Non spécifié'}}</div>
                                <div class="mcard-meta mt-2">
                                    <div class="mcard-meta-row">
                                        <i class="bi bi-activity"></i>
                                        <span>{{selectedReclamation.activite || 'Activité non spécifiée'}}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- QR Code & Motifs Card -->
                        <div class="mcard">
                            <div class="mcard-icon-wrap orange"><i class="bi bi-exclamation-diamond-fill"></i></div>
                            <div class="mcard-body d-flex gap-3">
                                <div class="flex-grow-1">
                                    <div class="mcard-label">Motifs &amp; Natures</div>
                                    <div class="d-flex flex-wrap gap-2 mt-2" *ngIf="selectedReclamation.natures?.length || selectedReclamation.autre_nature; else noNatures">
                                        <span *ngFor="let nat of selectedReclamation.natures" class="motif-chip">{{nat}}</span>
                                        <span *ngIf="selectedReclamation.autre_nature" class="motif-chip autre">{{selectedReclamation.autre_nature}}</span>
                                    </div>
                                    <ng-template #noNatures>
                                        <p class="text-muted small mt-2 mb-0">Aucun motif spécifié.</p>
                                    </ng-template>
                                </div>
                                <div class="qr-container" *ngIf="selectedReclamation.qrCode">
                                    <img [src]="selectedReclamation.qrCode" alt="QR Code" class="qr-img">
                                    <small class="qr-text">Scanner pour voir</small>
                                </div>
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
                        <div class="mshell-section-title"><i class="bi bi-paperclip me-2"></i>Pièces Jointes &amp; Preuves <span class="count-badge">{{selectedReclamation.preuves.length}}</span></div>
                        <div class="evidence-grid-pro mb-4">
                            <a *ngFor="let file of selectedReclamation.preuves" [href]="getFileUrl(file)" target="_blank" class="evidence-card-pro">
                                <div class="ev-thumb" *ngIf="isImage(file)">
                                    <img [src]="getFileUrl(file)" alt="Preuve" onerror="this.parentElement.innerHTML='<i class=&quot;bi bi-image-fill&quot;></i>'">
                                    <div class="ev-overlay"><i class="bi bi-zoom-in"></i></div>
                                </div>
                                <div class="ev-thumb ev-doc" *ngIf="!isImage(file)">
                                    <i class="bi bi-file-earmark-pdf-fill"></i>
                                </div>
                                <div class="ev-info">
                                    <span class="ev-name" [title]="file">{{file}}</span>
                                    <span class="ev-action">Ouvrir <i class="bi bi-arrow-up-right-square ms-1"></i></span>
                                </div>
                            </a>
                        </div>
                    </ng-container>

                    <!-- Section 5: Dynamic Stepper & Premium Interactive Timeline -->
                    <div class="mshell-section-title"><i class="bi bi-clock-history me-2"></i>Suivi en temps réel de votre demande</div>
                    
                    <!-- Beautiful Glowing Stepper Card -->
                    <div class="premium-stepper-card mb-4 shadow-sm">
                        <div class="stepper-progress-bar">
                            <div class="progress-fill" [style.width.%]="getStepperProgressWidth(selectedReclamation.statut)"></div>
                        </div>
                        
                        <div class="stepper-steps">
                            <!-- Step 1: Dépôt -->
                            <div class="step-item" [ngClass]="getStepClass(selectedReclamation.statut, 0)">
                                <div class="step-circle">
                                    <i class="bi bi-file-earmark-arrow-up"></i>
                                    <span class="step-check"><i class="bi bi-check-lg"></i></span>
                                </div>
                                <div class="step-title">Dépôt</div>
                                <div class="step-desc">Demande enregistrée</div>
                            </div>
                            
                            <!-- Step 2: Instruction -->
                            <div class="step-item" [ngClass]="getStepClass(selectedReclamation.statut, 1)">
                                <div class="step-circle">
                                    <i class="bi bi-search"></i>
                                    <span class="step-check"><i class="bi bi-check-lg"></i></span>
                                </div>
                                <div class="step-title">Instruction</div>
                                <div class="step-desc">Analyse du dossier</div>
                            </div>
                            
                            <!-- Step 3: Investigation -->
                            <div class="step-item" [ngClass]="getStepClass(selectedReclamation.statut, 2)">
                                <div class="step-circle">
                                    <i class="bi bi-gear-wide-connected"></i>
                                    <span class="step-check"><i class="bi bi-check-lg"></i></span>
                                </div>
                                <div class="step-title">Investigation</div>
                                <div class="step-desc">Enquête en cours</div>
                            </div>
                            
                            <!-- Step 4: Résolution -->
                            <div class="step-item" [ngClass]="getStepClass(selectedReclamation.statut, 3)">
                                <div class="step-circle">
                                    <i class="bi bi-check-circle-fill"></i>
                                    <span class="step-check"><i class="bi bi-check-lg"></i></span>
                                </div>
                                <div class="step-title">Résolution</div>
                                <div class="step-desc">Solution apportée</div>
                            </div>
                        </div>
                    </div>

                    <!-- Glowing Glassmorphic Event Timeline -->
                    <div class="glass-timeline mb-4">
                        <div class="timeline-event-card" *ngFor="let entry of selectedReclamation.history" [ngClass]="'status-' + entry.statut">
                            <div class="event-glow"></div>
                            <div class="event-icon-circle" [ngClass]="getStatusColorClass(entry.statut)">
                                <i class="bi" [ngClass]="{
                                    'bi-hourglass-split': entry.statut === 'deposee' || entry.statut === 'en_attente',
                                    'bi-arrow-repeat': entry.statut === 'en_cours',
                                    'bi-question-circle-fill': entry.statut === 'demande_complement',
                                    'bi-person-check-fill': entry.statut === 'affectee_conventionne',
                                    'bi-check-circle-fill': entry.statut === 'resolue' || entry.statut === 'fermee',
                                    'bi-x-circle-fill': entry.statut === 'rejete'
                                }"></i>
                            </div>
                            <div class="event-content">
                                <div class="event-header-row">
                                    <span class="event-status-label">{{ getStatusLabel(entry.statut) }}</span>
                                    <span class="event-date-text">{{ entry.date | date:'dd MMMM yyyy, HH:mm' }}</span>
                                </div>
                                <div class="event-body-text">{{ entry.action }}</div>
                            </div>
                        </div>
                        <div *ngIf="!selectedReclamation.history?.length" class="empty-timeline-card">
                            <i class="bi bi-clock-history fs-3 text-muted mb-2"></i>
                            <div class="text-muted small">L'historique détaillé sera disponible au fur et à mesure du traitement.</div>
                        </div>
                    </div>

                    <!-- Alert in-progress -->
                    <div class="status-alert status-en_cours" *ngIf="selectedReclamation.statut === 'en_cours'">
                        <i class="bi bi-arrow-repeat status-alert-icon spin"></i>
                        <div>
                            <div class="fw-bold">Traitement en cours</div>
                            <div class="small opacity-75">Votre dossier est activement examiné par nos équipes.</div>
                        </div>
                    </div>
                </div>
            </div>

                <!-- === MODAL FOOTER === -->
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
    </div>
  `,
    styles: [`
    /* ========================= BASE ========================= */
    .ls-1 { letter-spacing: 1px; }
    .cursor-pointer { cursor: pointer; }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .bg-info-subtle { background-color: #e0f2fe; } .text-info-emphasis { color: #0369a1; }
    .bg-warning-subtle { background-color: #fef3c7; } .text-warning-emphasis { color: #b45309; }
    .bg-success-subtle { background-color: #dcfce7; } .bg-danger-subtle { background-color: #fee2e2; }

    /* ========================= MODAL SHELL ========================= */
    .modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(2, 6, 23, 0.80); backdrop-filter: blur(20px) saturate(180%);
        display: flex; align-items: center; justify-content: center;
        z-index: 2000; animation: fadeInOverlay 0.4s ease;
        padding: 16px;
    }
    @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }

    .modal-shell {
        background: #ffffff; border-radius: 28px; width: 100%; max-width: 820px;
        max-height: 92vh; display: flex; flex-direction: column;
        box-shadow: 0 60px 120px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15);
        animation: modalPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
    }
    @keyframes modalPop {
        from { opacity: 0; transform: translateY(50px) scale(0.9); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ========================= HEADER ========================= */
    .mshell-header {
        position: relative; overflow: hidden; flex-shrink: 0;
        padding: 28px 32px; border-bottom: 1px solid #e2e8f0;
    }
    .mshell-header-bg {
        position: absolute; inset: 0;
        background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%);
    }
    .mshell-header-content {
        position: relative; z-index: 1;
        display: flex; align-items: center; gap: 20px;
    }
    .mshell-icon-wrap {
        width: 56px; height: 56px; flex-shrink: 0;
        background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.2); border-radius: 18px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.75rem; color: white;
    }
    .mshell-header-eyebrow { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: rgba(148,163,184,1); margin-bottom: 4px; }
    .mshell-header-code { font-size: 1.4rem; font-weight: 800; color: #fff; letter-spacing: 2px; }
    .mshell-close-btn {
        width: 40px; height: 40px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
        border-radius: 14px; display: flex; align-items: center; justify-content: center;
        color: #fff; transition: all 0.3s; cursor: pointer; font-size: 1.1rem; flex-shrink: 0;
    }
    .mshell-close-btn:hover { background: rgba(255,255,255,0.25); transform: rotate(90deg) scale(1.1); }

    /* Status Pill */
    .mshell-status-pill {
        display: inline-flex; align-items: center; padding: 8px 16px;
        border-radius: 50px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
        border: 1px solid transparent;
    }
    .mshell-status-pill.status-deposee { background: rgba(251,191,36,0.2); color: #fbbf24; border-color: rgba(251,191,36,0.3); }
    .mshell-status-pill.status-en_cours { background: rgba(59,130,246,0.2); color: #60a5fa; border-color: rgba(59,130,246,0.3); }
    .mshell-status-pill.status-affectee_conventionne { background: rgba(37,99,235,0.2); color: #3b82f6; border-color: rgba(37,99,235,0.3); }
    .mshell-status-pill.status-resolue, .mshell-status-pill.status-fermee { background: rgba(34,197,94,0.2); color: #4ade80; border-color: rgba(34,197,94,0.3); }
    .mshell-status-pill.status-rejete { background: rgba(239,68,68,0.2); color: #f87171; border-color: rgba(239,68,68,0.3); }
    .mshell-status-pill.status-demande_complement { background: rgba(168,85,247,0.2); color: #c084fc; border-color: rgba(168,85,247,0.3); }

    /* Timeline Styles */
    .timeline-container { position: relative; padding-left: 20px; }
    .timeline-container::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #e2e8f0; }
    .timeline-item { position: relative; margin-bottom: 20px; padding-bottom: 5px; }
    .timeline-marker { position: absolute; left: -25px; top: 2px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #e2e8f0; }
    .timeline-marker.bg-warning { background: #fbbf24; }
    .timeline-marker.bg-info { background: #3b82f6; }
    .timeline-marker.bg-primary { background: #6d28d9; }
    .timeline-marker.bg-success { background: #10b981; }
    .timeline-marker.bg-danger { background: #ef4444; }
    .timeline-date { font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .timeline-action { font-size: 0.92rem; font-weight: 600; color: #334155; margin: 4px 0; }
    .timeline-status { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; font-weight: 700; color: #64748b; }

    /* ========================= BODY ========================= */
    .mshell-body { overflow-y: auto; padding: 32px; flex: 1; background: #f8fafc; }

    .mshell-section-title {
        font-size: 0.72rem; font-weight: 800; text-transform: uppercase;
        letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 14px;
        display: flex; align-items: center;
    }

    /* 2-Column Grid */
    .mshell-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 600px) { .mshell-grid-2 { grid-template-columns: 1fr; } }

    /* Info Card */
    .mcard {
        background: #ffffff; border: 1px solid #e8edf5; border-radius: 20px;
        padding: 20px; display: flex; gap: 16px; align-items: flex-start;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .mcard:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.1); border-color: #c7d7f5; }
    .mcard-icon-wrap {
        width: 44px; height: 44px; flex-shrink: 0; border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.2rem;
    }
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

    /* Motif Chips */
    .motif-chip { background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; padding: 5px 14px; border-radius: 50px; font-size: 0.8rem; font-weight: 700; transition: all 0.2s; }
    .motif-chip:hover { background: #e0f2fe; border-color: #7dd3fc; color: #0369a1; }
    .motif-chip.autre { background: #ede9fe; border-color: #c4b5fd; color: #7c3aed; border-style: dashed; }

    /* Description Block */
    .description-block {
        background: #ffffff; border: 1px solid #e8edf5; border-radius: 20px;
        padding: 24px; position: relative; overflow: hidden;
    }
    .description-block::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: linear-gradient(180deg, #3b82f6, #8b5cf6); border-radius: 4px; }
    .description-quote-icon { font-size: 3rem; color: #dbeafe; line-height: 1; margin-bottom: 8px; }
    .description-text { color: #334155; line-height: 1.85; font-size: 0.97rem; margin: 0; padding-left: 8px; }

    /* Evidence Gallery */
    .count-badge { display: inline-flex; align-items: center; justify-content: center; background: #3b82f6; color: #fff; border-radius: 50px; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; margin-left: 8px; }
    .evidence-grid-pro { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
    .evidence-card-pro {
        background: #fff; border: 1px solid #e8edf5; border-radius: 16px;
        overflow: hidden; text-decoration: none; display: block; transition: all 0.3s;
    }
    .evidence-card-pro:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.15); border-color: #93c5fd; }
    .ev-thumb {
        height: 110px; background: #f1f5f9; display: flex; align-items: center; justify-content: center;
        overflow: hidden; position: relative;
    }
    .ev-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
    .evidence-card-pro:hover .ev-thumb img { transform: scale(1.08); }
    .ev-overlay {
        position: absolute; inset: 0; background: rgba(37,99,235,0.5); opacity: 0;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 1.5rem; transition: opacity 0.3s;
    }
    .evidence-card-pro:hover .ev-overlay { opacity: 1; }
    .ev-doc { background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: #64748b; font-size: 2.5rem; }
    .ev-info { padding: 10px 12px; border-top: 1px solid #f1f5f9; }
    .ev-name { font-size: 0.72rem; font-weight: 700; color: #334155; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px; }
    .ev-action { font-size: 0.7rem; color: #3b82f6; font-weight: 600; }

    /* Status Alerts */
    .status-alert {
        display: flex; align-items: center; gap: 16px; padding: 18px 22px;
        border-radius: 16px; margin-bottom: 16px; border: 1px solid transparent;
        font-weight: 600;
    }
    .status-alert-icon { font-size: 1.6rem; flex-shrink: 0; }
    .status-alert.status-en_cours { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
    .status-alert.status-demande_complement { background: #faf5ff; border-color: #ddd6fe; color: #6d28d9; }
    .spin { animation: spin 2s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* ========================= FOOTER ========================= */
    .mshell-footer {
        padding: 20px 32px; background: #ffffff; border-top: 1px solid #e2e8f0;
        display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-shrink: 0;
    }
    .mfooter-right-actions { display: flex; gap: 10px; }
    .mfooter-btn {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 11px 22px; border-radius: 14px; font-size: 0.85rem; font-weight: 700;
        letter-spacing: 0.3px; cursor: pointer; transition: all 0.3s; border: none;
    }
    .mfooter-btn.secondary { background: #f1f5f9; color: #475569; }
    .mfooter-btn.secondary:hover { background: #e2e8f0; color: #1e293b; transform: translateX(-4px); }
    .mfooter-btn.ghost { background: transparent; border: 1.5px solid #e2e8f0; color: #64748b; }
    .mfooter-btn.ghost:hover { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }
    .mfooter-btn.pdf { background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; box-shadow: 0 6px 20px -5px rgba(239,68,68,0.5); }
    .mfooter-btn.pdf:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 12px 24px -6px rgba(239,68,68,0.5); }
    
    /* QR Code Styles */
    .qr-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #fff;
        padding: 8px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        width: 100px;
        flex-shrink: 0;
    }
    .qr-img {
        width: 80px;
        height: 80px;
        object-fit: contain;
    }
    .qr-text {
        font-size: 0.6rem;
        color: #94a3b8;
        margin-top: 4px;
        font-weight: 700;
        text-transform: uppercase;
        text-align: center;
    }

        /* Print Optimization - Using Global Styles */
        @media print {
            body { background: white !important; }
            .pro-sheet-container { display: block !important; visibility: visible !important; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
        .pro-sheet-container { display: none; }

        /* ==========================================
           PREMIUM DYNAMIC STEPPER & TIMELINE
           ========================================== */
        .premium-stepper-card {
            background: #ffffff;
            border: 1px solid #e8edf5;
            border-radius: 24px;
            padding: 30px 20px;
            position: relative;
        }

        .stepper-progress-bar {
            position: absolute;
            top: 52px;
            left: 10%;
            right: 10%;
            height: 6px;
            background: #f1f5f9;
            border-radius: 10px;
            z-index: 1;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981);
            width: 0%;
            border-radius: 10px;
            transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .stepper-steps {
            display: flex;
            justify-content: space-between;
            position: relative;
            z-index: 2;
        }

        .step-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 20%;
            text-align: center;
        }

        .step-circle {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #ffffff;
            border: 3px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            color: #94a3b8;
            position: relative;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .step-check {
            position: absolute;
            inset: -3px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.1rem;
            font-weight: bold;
            opacity: 0;
            transform: scale(0.5);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* completed state */
        .step-item.completed .step-circle {
            border-color: #10b981;
            color: #10b981;
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2);
        }

        .step-item.completed .step-check {
            opacity: 1;
            transform: scale(1);
        }

        /* active state */
        .step-item.active .step-circle {
            border-color: #3b82f6;
            color: #3b82f6;
            background: #eff6ff;
            transform: scale(1.1) translateY(-2px);
            box-shadow: 0 10px 20px -3px rgba(59, 130, 246, 0.3);
            animation: pulse-step-blue 2s infinite;
        }

        @keyframes pulse-step-blue {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }

        .step-title {
            font-size: 0.85rem;
            font-weight: 700;
            color: #64748b;
            margin-top: 12px;
            transition: color 0.3s;
        }

        .step-item.active .step-title {
            color: #3b82f6;
        }

        .step-item.completed .step-title {
            color: #10b981;
        }

        .step-desc {
            font-size: 0.68rem;
            color: #94a3b8;
            margin-top: 2px;
            font-weight: 500;
        }

        @media (max-width: 576px) {
            .stepper-progress-bar { display: none; }
            .stepper-steps { flex-direction: column; gap: 20px; align-items: flex-start; padding-left: 20px; }
            .step-item { flex-direction: row; width: 100%; text-align: left; gap: 15px; }
            .step-title { margin-top: 0; }
            .step-desc { margin-top: 0; }
        }

        /* Glassmorphic Event Timeline */
        .glass-timeline {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .timeline-event-card {
            background: #ffffff;
            border: 1px solid #e8edf5;
            border-radius: 16px;
            padding: 16px 20px;
            display: flex;
            gap: 16px;
            align-items: center;
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .timeline-event-card:hover {
            transform: translateX(4px);
            box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.05);
            border-color: #cbd5e1;
        }

        .event-glow {
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: 4px;
            background: #e2e8f0;
        }

        /* Color borders by status */
        .timeline-event-card.status-deposee .event-glow,
        .timeline-event-card.status-en_attente .event-glow {
            background: #fbbf24;
        }
        .timeline-event-card.status-en_cours .event-glow {
            background: #3b82f6;
        }
        .timeline-event-card.status-demande_complement .event-glow {
            background: #a855f7;
        }
        .timeline-event-card.status-affectee_conventionne .event-glow {
            background: #2563eb;
        }
        .timeline-event-card.status-resolue .event-glow,
        .timeline-event-card.status-fermee .event-glow {
            background: #10b981;
        }
        .timeline-event-card.status-rejete .event-glow {
            background: #ef4444;
        }

        .event-icon-circle {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1rem;
            flex-shrink: 0;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .event-icon-circle.bg-warning { background: linear-gradient(135deg, #fbbf24, #d97706) !important; }
        .event-icon-circle.bg-info { background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important; }
        .event-icon-circle.bg-primary { background: linear-gradient(135deg, #a855f7, #6d28d9) !important; }
        .event-icon-circle.bg-success { background: linear-gradient(135deg, #10b981, #059669) !important; }
        .event-icon-circle.bg-danger { background: linear-gradient(135deg, #ef4444, #b91c1c) !important; }

        .event-content {
            flex: 1;
            min-width: 0;
        }

        .event-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        }

        .event-status-label {
            font-size: 0.78rem;
            font-weight: 800;
            text-transform: uppercase;
            color: #334155;
            letter-spacing: 0.3px;
        }

        .event-date-text {
            font-size: 0.7rem;
            color: #94a3b8;
            font-weight: 600;
        }

        .event-body-text {
            font-size: 0.88rem;
            color: #475569;
            font-weight: 500;
            line-height: 1.4;
        }

        .empty-timeline-card {
            background: #ffffff;
            border: 1px dashed #cbd5e1;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
        }
  `]

})
export class ReclamationListComponent implements OnInit {
    allReclamations: any[] = [];
    reclamations: any[] = [];
    loading = true;
    searchTerm = '';
    selectedReclamation: any = null;
    showModal = false;
    today = new Date();

    constructor(
        private reclamationService: ReclamationService,
        private notificationService: NotificationService,
        private authService: AuthService,
        private pdfService: PdfService,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        const cached = localStorage.getItem('otic_my_reclamations');
        if (cached) {
            try {
                this.allReclamations = JSON.parse(cached);
                this.reclamations = [...this.allReclamations];
                this.loading = false;
            } catch (e) { }
        } else {
            this.loading = true;
        }

        this.cdr.detectChanges();

        try {
            // Clear notifications when page is accessed
            this.notificationService.markAllAsRead().subscribe();

            console.log('📡 Fetching my reclamations...');
            const data = await firstValueFrom(this.reclamationService.getMyReclamations());
            this.allReclamations = data || [];
            this.reclamations = [...this.allReclamations];
            localStorage.setItem('otic_my_reclamations', JSON.stringify(this.allReclamations));
            console.log('✅ Reclamations loaded:', this.reclamations.length);

            // Check if we need to open a specific reclamation (from QR code/Link)
            const id = this.route.snapshot.paramMap.get('id');
            if (id) {
                const target = this.reclamations.find(r => r._id === id);
                if (target) {
                    this.openDetails(target);
                } else {
                    // If not found in user list, we might need to fetch it specifically
                    // but for now let's assume it's in the list if the user has access
                    this.reclamationService.getReclamationById(id).subscribe({
                        next: (rec) => this.openDetails(rec),
                        error: () => console.warn('Could not load specific reclamation')
                    });
                }
            }
        } catch (err) {
            console.error('❌ Error fetching reclamations:', err);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
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

    openDetails(reclamation: any) {
        this.selectedReclamation = reclamation;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.selectedReclamation = null;
    }

    printReclamation() {
        window.print();
    }

    async downloadSpecialPdf() {
        if (!this.selectedReclamation) return;

        let user = null;
        try {
            user = await firstValueFrom(this.authService.currentUser$);
        } catch (e) {
            console.warn('Could not get current user from stream, falling back to reclamation user');
        }

        // If user not in state, try to get from reclamation object or fetch profile
        if (!user && this.selectedReclamation.user) {
            user = this.selectedReclamation.user;
        }

        await this.pdfService.generateReclamationPdf(this.selectedReclamation, user);
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'en_attente': return 'En attente';
            case 'deposee': return 'Déposée';
            case 'en_cours': return 'En cours';
            case 'affectee_conventionne': return 'Affectée';
            case 'demande_complement': return 'Complément requis';
            case 'resolue': return 'Résolue';
            case 'fermee': return 'Fermée';
            case 'rejete': return 'Rejetée';
            default: return (status || '').replace('_', ' ');
        }
    }

    getStatusColorClass(status: string): string {
        switch (status) {
            case 'en_attente': return 'bg-warning';
            case 'deposee': return 'bg-warning';
            case 'en_cours': return 'bg-info';
            case 'affectee_conventionne': return 'bg-primary';
            case 'demande_complement': return 'bg-primary';
            case 'resolue': return 'bg-success';
            case 'fermee': return 'bg-success';
            case 'rejete': return 'bg-danger';
            default: return 'bg-secondary';
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
    // STEPPER LOGIC FOR REAL-TIME TRACKING
    // ==========================================
    getStepperStageIndex(status: string): number {
        if (!status) return 0;
        switch (status) {
            case 'deposee':
            case 'en_attente':
                return 0;
            case 'demande_complement':
            case 'en_cours':
                return 1;
            case 'affectee_conventionne':
                return 2;
            case 'resolue':
            case 'fermee':
            case 'rejete':
                return 3;
            default:
                return 0;
        }
    }

    getStepperProgressWidth(status: string): number {
        const stageIndex = this.getStepperStageIndex(status);
        return (stageIndex / 3) * 100;
    }

    getStepClass(status: string, stepIndex: number): string {
        if (!status) return 'pending';
        const currentStageIndex = this.getStepperStageIndex(status);
        if (currentStageIndex > stepIndex) {
            return 'completed';
        } else if (currentStageIndex === stepIndex) {
            return 'active';
        } else {
            return 'pending';
        }
    }
}
