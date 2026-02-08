import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReclamationService } from '../../../services/reclamation.service';
import { RECLAMATION_SECTORS, RECLAMATION_NATURES } from '../../../data/reclamation-taxonomy';

@Component({
    selector: 'app-add-reclamation',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="row justify-content-center">
      <div class="col-lg-10 col-xl-9">
        <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
          <!-- Wizard Header -->
          <div class="card-header bg-white border-0 pt-4 px-4 px-md-5 pb-0 d-flex justify-content-between align-items-center">
            <div>
                <h4 class="mb-1 text-primary fw-bold">Nouvelle Réclamation</h4>
                <p class="text-muted small mb-0 fw-medium">Suivez les étapes pour soumettre votre demande.</p>
            </div>
          </div>

          <div class="card-body p-4 p-md-5">
            
            <!-- Visual Step Indicator -->
            <div class="d-flex justify-content-between position-relative mb-5 mt-2 px-md-4">
                <div class="position-absolute top-50 start-0 translate-middle-y z-n1 bg-light rounded-pill" style="height: 4px; width: 100%;"></div>
                <div class="position-absolute top-50 start-0 translate-middle-y z-n1 bg-accent transition-width" style="height: 4px; transition: width 0.4s ease;" [style.width.%]="((step-1)/4)*100"></div>
                
                <div *ngFor="let s of [1,2,3,4,5]; let i = index" class="d-flex flex-column align-items-center z-1 bg-white px-2 cursor-default">
                    <div class="rounded-circle d-flex align-items-center justify-content-center border-2 transition-all shadow-sm" 
                         [class.bg-accent]="step >= s" 
                         [class.border-accent]="step >= s"
                         [class.text-white]="step >= s"
                         [class.bg-white]="step < s"
                         [class.text-muted]="step < s"
                         [class.border-light-subtle]="step < s"
                         style="width: 48px; height: 48px; border: 2px solid;">
                        <i class="bi fs-5" 
                           [class.bi-tag-fill]="s===1" 
                           [class.bi-list-ul]="s===2" 
                           [class.bi-file-earmark-text]="s===3" 
                           [class.bi-shop]="s===4" 
                           [class.bi-check-lg]="s===5"></i>
                    </div>
                    <span class="small fw-semibold mt-2 transition-colors text-uppercase ls-1" [class.text-accent]="step >= s" [class.text-muted]="step < s" style="font-size: 0.7rem;">
                        {{ ['Choix', 'Détails', 'Preuves', 'Opérat.', 'Valid.'][i] }}
                    </span>
                </div>
            </div>

            <!-- Success State -->
            <div *ngIf="successTrackingCode" class="text-center py-5 fade-in">
                <div class="mb-4 text-success display-1">
                    <i class="bi bi-check-circle-fill"></i>
                </div>
                <h2 class="fw-bold mb-3">Réclamation Enregistrée !</h2>
                <p class="lead text-muted mb-4">Votre demande a été transmise avec succès.</p>
                <div class="d-inline-block bg-light rounded-4 p-4 border border-dashed mb-4">
                    <small class="text-uppercase text-muted fw-bold ls-1 d-block mb-2">Code de suivi</small>
                    <span class="display-6 fw-bold text-dark user-select-all font-monospace">{{ successTrackingCode }}</span>
                </div>
                <p class="text-muted small mb-4">Veuillez conserver ce code pour suivre l'état de votre demande.</p>
                <button class="btn btn-outline-primary px-4 py-2 rounded-pill fw-medium me-3" (click)="resetForm()">Nouvelle réclamation</button>
                <button class="btn btn-primary px-4 py-2 rounded-pill fw-medium" routerLink="/dashboard/reclamation">Voir mes réclamations</button>
            </div>

            <!-- Form Wizard -->
            <form *ngIf="!successTrackingCode" (ngSubmit)="submit()" #f="ngForm" class="fade-in">
                
                <!-- STEP 1: Classification -->
                <div *ngIf="step === 1" class="step-content">
                    <h5 class="mb-4 pb-2 border-bottom text-primary fw-semibold"><i class="bi bi-tag me-2"></i>Classification</h5>
                    
                    <div class="mb-4">
                        <label class="form-label d-block mb-3">Quel est le type de votre demande ?</label>
                        <div class="row g-3">
                            <div class="col-sm-6">
                                <input type="radio" class="btn-check" name="type" id="typeProduit" value="Produit" [(ngModel)]="reclamation.type" required>
                                <label class="btn btn-outline-light text-dark border w-100 p-3 text-start d-flex align-items-center rounded-3 hover-shadow" for="typeProduit">
                                    <div class="icon-box bg-light text-primary rounded-circle p-2 me-3"><i class="bi bi-box-seam fs-5"></i></div>
                                    <div class="d-flex flex-column">
                                        <span class="fw-bold">Produit</span>
                                        <small class="text-muted">Bien de consommation</small>
                                    </div>
                                </label>
                            </div>
                            <div class="col-sm-6">
                                <input type="radio" class="btn-check" name="type" id="typeService" value="Service" [(ngModel)]="reclamation.type">
                                <label class="btn btn-outline-light text-dark border w-100 p-3 text-start d-flex align-items-center rounded-3 hover-shadow" for="typeService">
                                    <div class="icon-box bg-light text-primary rounded-circle p-2 me-3"><i class="bi bi-gear fs-5"></i></div>
                                    <div class="d-flex flex-column">
                                        <span class="fw-bold">Service</span>
                                        <small class="text-muted">Prestation immatérielle</small>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label">Secteur d'activité</label>
                        <select class="form-select form-select-lg" name="secteur" [(ngModel)]="reclamation.secteur" (change)="onSectorChange()" required>
                            <option value="" disabled selected>Sélectionnez un secteur...</option>
                            <option *ngFor="let s of sectors" [value]="s.name">{{ s.name }}</option>
                        </select>
                    </div>

                    <div class="mb-3" *ngIf="reclamation.secteur">
                        <label class="form-label">Sous-Secteur</label>
                        <select class="form-select" name="subSector" [(ngModel)]="reclamation.sous_secteur" required>
                            <option value="" disabled selected>Précisez le sous-secteur...</option>
                            <option *ngFor="let sub of availableSubSectors" [value]="sub">{{ sub }}</option>
                        </select>
                    </div>
                </div>

                <!-- STEP 2: Nature -->
                <div *ngIf="step === 2" class="step-content">
                     <h5 class="mb-4 pb-2 border-bottom text-primary fw-semibold"><i class="bi bi-list-check me-2"></i>Détails du problème</h5>
                     
                     <div class="mb-4">
                        <label class="form-label mb-3">Nature de la réclamation (Choix multiples)</label>
                        <div class="row g-3">
                            <div class="col-md-4 col-sm-6" *ngFor="let nat of naturesList">
                                <div class="form-check custom-check p-3 border rounded-3 bg-white h-100 position-relative">
                                    <input class="form-check-input position-absolute top-50 end-0 translate-middle-y me-3" type="checkbox" [value]="nat" 
                                        (change)="onNatureChange($event, nat)"
                                        [checked]="reclamation.natures.includes(nat)" id="check-{{nat}}">
                                    <label class="form-check-label w-100 text-start stretched-link fw-medium" for="check-{{nat}}">{{ nat }}</label>
                                </div>
                            </div>
                        </div>
                     </div>
                     
                     <div class="mt-4">
                        <label class="form-label">Description détaillée</label>
                        <textarea class="form-control" name="desc" rows="5" [(ngModel)]="reclamation.description" required placeholder="Décrivez le contexte, la date, et le problème rencontré le plus précisément possible..."></textarea>
                     </div>
                </div>

                <!-- STEP 3: Preuve -->
                <div *ngIf="step === 3" class="step-content">
                    <h5 class="mb-4 pb-2 border-bottom text-primary fw-semibold"><i class="bi bi-paperclip me-2"></i>Pièces Justificatives</h5>
                    
                    <div class="alert alert-light border-primary border-start border-4 shadow-sm mb-4">
                        <div class="d-flex">
                            <i class="bi bi-info-circle-fill text-primary fs-4 me-3"></i>
                            <div>
                                <h6 class="fw-bold mb-1">Pourquoi ajouter des preuves ?</h6>
                                <p class="mb-0 small text-muted">Les dossiers avec photos, factures ou contrats sont traités <strong>2x plus vite</strong>.</p>
                            </div>
                        </div>
                    </div>

                    <div class="upload-zone border-2 border-dashed rounded-4 p-5 text-center bg-light-subtle mb-4 cursor-pointer position-relative hover-border-primary">
                        <input type="file" class="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer" multiple (change)="onFileSelected($event)">
                        <i class="bi bi-cloud-arrow-up display-4 text-muted mb-3 d-block"></i>
                        <h6 class="fw-bold">Glissez vos fichiers ici ou cliquez pour parcourir</h6>
                        <p class="text-muted small mb-0">JPG, PNG, PDF acceptés (Max 5Mo)</p>
                    </div>

                    <div class="mt-4" *ngIf="reclamation.preuves.length > 0">
                        <h6 class="text-uppercase text-muted small fw-bold mb-3 ls-1">Fichiers Prêts à l'envoi</h6>
                        <div class="list-group list-group-flush">
                            <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-3 border-bottom" *ngFor="let file of reclamation.preuves">
                                <div class="d-flex align-items-center">
                                    <div class="icon-box bg-white border rounded p-2 me-3"><i class="bi bi-file-earmark-text text-primary"></i></div>
                                    <span class="fw-medium">{{ file }}</span>
                                </div>
                                <span class="badge bg-success-subtle text-success rounded-pill px-3"><i class="bi bi-check2 me-1"></i> OK</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- STEP 4: Opérateur -->
                <div *ngIf="step === 4" class="step-content">
                    <h5 class="mb-4 pb-2 border-bottom text-primary fw-semibold"><i class="bi bi-shop me-2"></i>Opérateur Concerné</h5>
                    
                    <div class="mb-4">
                        <label class="form-label">Nom de l'enseigne, entreprise ou organisme</label>
                        <div class="input-group input-group-lg">
                            <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control border-start-0 ps-0" name="operateur" [(ngModel)]="reclamation.operateur" placeholder="Ex: Magasin Général, Steg, Ooredoo..." required>
                        </div>
                        <div class="form-text mt-2">Essayez d'être précis sur le nom et la localisation si possible.</div>
                    </div>
                </div>

                <!-- STEP 5: Validation -->
                <div *ngIf="step === 5" class="step-content">
                    <h5 class="mb-4 pb-2 border-bottom text-primary fw-semibold"><i class="bi bi-check2-circle me-2"></i>Vérification</h5>
                    
                    <div class="alert alert-warning border-0 shadow-sm d-flex align-items-center mb-4">
                        <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                        <div>
                            <strong>Attention :</strong> Une fausse déclaration peut entraver le traitement. Veuillez vérifier les informations.
                        </div>
                    </div>

                    <div class="bg-light rounded-4 p-4 border form-review">
                        <dl class="row mb-0">
                            <dt class="col-sm-4 text-muted text-uppercase small fw-bold mb-1">Type</dt>
                            <dd class="col-sm-8 mb-4 fw-bold">{{ reclamation.type }}</dd>

                            <dt class="col-sm-4 text-muted text-uppercase small fw-bold mb-1">Secteur</dt>
                            <dd class="col-sm-8 mb-4">
                                <span class="d-block fw-bold">{{ reclamation.secteur }}</span>
                                <span class="text-muted small">{{ reclamation.sous_secteur }}</span>
                            </dd>

                            <dt class="col-sm-4 text-muted text-uppercase small fw-bold mb-1">Motifs</dt>
                            <dd class="col-sm-8 mb-4">
                                <span class="badge bg-white border text-dark me-1 mb-1" *ngFor="let m of reclamation.natures">{{ m }}</span>
                            </dd>

                            <dt class="col-sm-4 text-muted text-uppercase small fw-bold mb-1">Opérateur</dt>
                            <dd class="col-sm-8 mb-4 fw-bold">{{ reclamation.operateur }}</dd>
                            
                            <dt class="col-sm-4 text-muted text-uppercase small fw-bold mb-1">Description</dt>
                            <dd class="col-sm-8 mb-0 text-muted fst-italic">"{{ reclamation.description }}"</dd>
                        </dl>
                    </div>
                    
                    <div *ngIf="errorMessage" class="alert alert-danger mt-3">
                        {{ errorMessage }}
                    </div>
                </div>

                <!-- Navigation Buttons -->
                <div class="d-flex justify-content-between mt-5 pt-3 border-top">
                    <button type="button" class="btn btn-light btn-lg px-4 text-muted fw-medium border" (click)="prevStep()" [disabled]="step === 1">
                        Retour
                    </button>
                    
                    <button type="button" class="btn btn-primary btn-lg px-5 shadow-sm rounded-pill fw-bold" (click)="nextStep()" *ngIf="step < 5" [disabled]="!isStepValid()">
                        Suivant
                    </button>

                    <button type="submit" class="btn btn-success btn-lg px-5 shadow-lg rounded-pill fw-bold text-uppercase ls-1" *ngIf="step === 5" [disabled]="loading">
                        <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                        Confirmer et Envoyer
                    </button>
                </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .bg-accent { background-color: #d97706 !important; }
    .border-accent { border-color: #d97706 !important; }
    .text-accent { color: #d97706 !important; }
    .border-light-subtle { border-color: #e2e8f0 !important; }
    .ls-1 { letter-spacing: 1px; }
    .cursor-default { cursor: default; }
    .cursor-pointer { cursor: pointer; }
    .transition-width { transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
    .transition-colors { transition: color 0.3s ease; }
    .hover-shadow:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-color: #d97706 !important; }
    .custom-check:hover { background-color: #ffff; border-color: #d97706 !important; }
    .upload-zone:hover { border-color: #d97706 !important; background-color: #fffbeb !important; }
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AddReclamationComponent {
    step = 1;
    sectors = RECLAMATION_SECTORS;
    naturesList = RECLAMATION_NATURES;
    availableSubSectors: string[] = [];

    reclamation = {
        type: 'Produit',
        secteur: '',
        sous_secteur: '',
        natures: [] as string[],
        description: '',
        preuves: [] as string[],
        operateur: ''
    };

    loading = false;
    successTrackingCode = '';
    errorMessage = '';

    constructor(private reclamationService: ReclamationService) { }

    onSectorChange() {
        const selected = this.sectors.find(s => s.name === this.reclamation.secteur);
        this.availableSubSectors = selected ? selected.subSectors : [];
        this.reclamation.sous_secteur = '';
    }

    onNatureChange(e: any, nature: string) {
        if (e.target.checked) {
            this.reclamation.natures.push(nature);
        } else {
            const index = this.reclamation.natures.indexOf(nature);
            if (index > -1) {
                this.reclamation.natures.splice(index, 1);
            }
        }
    }

    onFileSelected(event: any) {
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            this.reclamation.preuves.push(files[i].name);
        }
    }

    isStepValid(): boolean {
        if (this.step === 1) return !!this.reclamation.type && !!this.reclamation.secteur && !!this.reclamation.sous_secteur;
        if (this.step === 2) return this.reclamation.natures.length > 0 && !!this.reclamation.description;
        if (this.step === 3) return true;
        if (this.step === 4) return !!this.reclamation.operateur;
        return true;
    }

    nextStep() {
        if (this.isStepValid()) this.step++;
    }

    prevStep() {
        if (this.step > 1) this.step--;
    }

    submit() {
        this.loading = true;
        this.errorMessage = '';

        this.reclamationService.createReclamation(this.reclamation).subscribe({
            next: (res) => {
                this.successTrackingCode = res.trackingCode; // Mocked or Real
                this.loading = false;
            },
            error: (err) => {
                this.errorMessage = "Une erreur technique est survenue.";
                this.loading = false;
            }
        });
    }

    resetForm() {
        this.step = 1;
        this.successTrackingCode = '';
        this.reclamation = {
            type: 'Produit',
            secteur: '',
            sous_secteur: '',
            natures: [],
            description: '',
            preuves: [],
            operateur: ''
        };
    }
}
