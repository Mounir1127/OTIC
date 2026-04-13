import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { LocationService } from '../../../../services/location.service';
import { SettingsService } from '../../../../services/settings.service';

@Component({
    selector: 'app-conventionnes-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="mshell-container fade-in" [dir]="settings.currentSettings.language === 'ar' ? 'rtl' : 'ltr'">
        <!-- === PREMIUM HEADER === -->
        <div class="mshell-main-header mb-4">
            <div class="d-flex align-items-center gap-4">
                <div class="mshell-header-icon">
                    <i class="bi bi-briefcase-fill text-white"></i>
                </div>
                <div>
                    <h2 class="mshell-title mb-1 text-dark fw-bold">{{ translate('manage_conventionnes') }}</h2>
                    <p class="mshell-subtitle mb-0 text-muted">
                        <i class="bi bi-shield-check me-1"></i> 
                        {{ conventionnes.length }} partenaires conventionnés officiels
                    </p>
                </div>
                <div class="ms-auto">
                    <button class="btn mshell-btn-primary shadow-sm px-4 py-2" (click)="showAddForm = !showAddForm">
                        <i class="bi" [ngClass]="showAddForm ? 'bi-list-ul me-2' : 'bi-person-plus-fill me-2'"></i>
                        {{ showAddForm ? 'Voir la liste' : 'Nouveau Partenaire' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- === ALERT NOTIFICATIONS === -->
        <div *ngIf="successMsg" class="alert mshell-alert-success fade-in mb-4">
            <i class="bi bi-check-circle-fill me-2"></i> {{successMsg}}
        </div>
        <div *ngIf="errorMsg" class="alert mshell-alert-danger fade-in mb-4">
            <i class="bi bi-exclamation-triangle-fill me-2"></i> {{errorMsg}}
        </div>

        <!-- === OPTIMISTIC ADD FORM === -->
    <div *ngIf="showAddForm" class="mshell-card form-section shadow-sm animate-slide-down mb-4">
            <div class="mshell-card-header border-bottom-0 pb-0">
                <div class="mshell-section-title text-uppercase letter-spacing-1 small">
                    <i class="bi bi-plus-circle-fill me-2 text-primary"></i>Ajouter un Nouveau Partenaire
                </div>
            </div>
            <div class="mshell-card-body p-4 pt-3">
                <form (ngSubmit)="onSubmit()" #convForm="ngForm">
                    <div class="mshell-grid-3">
                        <div class="mshell-form-group">
                            <label class="mshell-label mb-2">Nom / Institution</label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="bi bi-bank text-primary"></i></span>
                                <input type="text" class="form-control border-start-0 ps-0 mshell-input" name="nom" 
                                       [(ngModel)]="newConv.nom" required placeholder="Ex: المندوبية...">
                            </div>
                        </div>
                        <div class="mshell-form-group">
                            <label class="mshell-label mb-2">Email Officiel</label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="bi bi-envelope text-primary"></i></span>
                                <input type="email" class="form-control border-start-0 ps-0 mshell-input" name="email" 
                                       [(ngModel)]="newConv.email" required placeholder="contact@otic.tn">
                            </div>
                        </div>
                        <div class="mshell-form-group">
                            <label class="mshell-label mb-2">Gouvernorat (Région)</label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="bi bi-geo-alt text-primary"></i></span>
                                <select class="form-select border-start-0 ps-0 mshell-input" name="region" 
                                        [(ngModel)]="newConv.region">
                                    <option value="">Toute la Tunisie (Global)</option>
                                    <option *ngFor="let gov of governorates" [value]="gov.governorate">{{gov.governorate}}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 d-flex gap-3 justify-content-end">
                        <button type="button" class="btn btn-light px-4 mshell-btn-secondary" (click)="showAddForm = false">Annuler</button>
                        <button type="submit" class="btn mshell-btn-primary px-5" [disabled]="!convForm.form.valid || loadingBtn">
                            <span *ngIf="loadingBtn" class="spinner-border spinner-border-sm me-2"></span>
                            {{ loadingBtn ? 'Enregistrement...' : 'Confirmer et Ajouter' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- === PREMIUM LIST TABLE === -->
        <div *ngIf="!showAddForm" class="mshell-card list-section shadow-sm border-0">
            <div class="table-responsive">
                <table class="table mshell-table align-middle mb-0">
                    <thead>
                        <tr>
                            <th class="ps-4">PARTENAIRE</th>
                            <th>CONTACT EMAIL</th>
                            <th class="text-center">RÉGION</th>
                            <th class="text-end pe-4">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let user of conventionnes" class="mshell-row" [ngClass]="{'mshell-row-temp': user.isTemp}">
                            <td class="ps-4">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="mshell-avatar-sm" [style.background]="'hsl(' + (user.nom.length * 15 % 360) + ', 70%, 90%)'">
                                        <span class="text-dark fw-bold">{{user.nom[0]}}</span>
                                    </div>
                                    <div>
                                        <div class="fw-bold text-dark fs-6">{{user.nom}}</div>
                                        <div *ngIf="user.isTemp" class="mshell-badge-loading">
                                            <span class="spinner-grow spinner-grow-sm me-1"></span> Synchronisation...
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="mshell-email-pill"><i class="bi bi-envelope-fill me-1 small"></i>{{user.email}}</span>
                            </td>
                            <td class="text-center">
                                <span class="badge border text-dark bg-light px-3 py-2 rounded-pill font-monospace small">
                                    {{ user.region || 'Toute la Tunisie' }}
                                </span>
                            </td>
                            <td class="text-end pe-4">
                                <button class="mshell-action-btn delete mb-0" 
                                        (click)="deleteUser(user._id)" 
                                        [disabled]="user.isTemp"
                                        title="Supprimer">
                                    <i class="bi bi-trash3"></i>
                                </button>
                            </td>
                        </tr>
                        
                        <!-- Empty State -->
                        <tr *ngIf="conventionnes.length === 0 && !loading">
                            <td colspan="4" class="text-center py-5">
                                <div class="opacity-25 mb-3"><i class="bi bi-file-earmark-person fs-1"></i></div>
                                <h5 class="text-muted fw-light">Aucun partenaire conventionné enregistré</h5>
                                <button class="btn btn-outline-primary btn-sm mt-2 px-4 rounded-pill" (click)="showAddForm = true">
                                    Ajouter le premier
                                </button>
                            </td>
                        </tr>

                        <!-- Loading State -->
                        <tr *ngIf="loading && conventionnes.length === 0">
                            <td colspan="4" class="text-center py-5">
                                <div class="mshell-loader-wrap">
                                    <div class="spinner-border text-primary me-2"></div>
                                    <div class="text-muted mt-2">Récupération des données...</div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `,
    styles: [`
        .mshell-container { padding: 30px; font-family: 'Outfit', sans-serif; background: #f8fafc; min-height: 100vh; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* HEADER */
        .mshell-header-icon { width: 56px; height: 56px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
        .mshell-title { font-size: 1.75rem; letter-spacing: -0.02em; }

        /* BUTTONS */
        .mshell-btn-primary { background: #2563eb; color: #fff; border: none; border-radius: 12px; font-weight: 600; transition: all 0.2s; }
        .mshell-btn-primary:hover { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(37,99,235,0.2); }
        .mshell-btn-secondary { background: #f1f5f9; color: #475569; border-radius: 12px; font-weight: 600; border: none; }

        /* CARDS & SECTIONS */
        .mshell-card { background: #fff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; }
        .mshell-section-title { color: #64748b; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 5px; }

        /* GRID & FORMS */
        .mshell-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .mshell-input { border-radius: 0 12px 12px 0; border: 1px solid #e2e8f0; padding: 12px; }
        .mshell-input:focus { box-shadow: none; border-color: #2563eb; }
        .mshell-label { font-size: 0.85rem; font-weight: 600; color: #475569; }

        /* TABLE */
        .mshell-table thead th { border-bottom: 2px solid #f1f5f9; padding: 1.2rem 1rem; color: #64748b; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.05em; }
        .mshell-row { transition: background 0.2s; border-bottom: 1px solid #f8fafc; }
        .mshell-row:hover { background: #f8fafc; }
        .mshell-row-temp { background: #eff6ff; }
        .mshell-avatar-sm { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
        .mshell-email-pill { background: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-family: 'Roboto Mono', monospace; }

        /* ALERTS */
        .mshell-alert-success { background: #ecfdf5; border: 1px solid #10b981; color: #065f46; border-radius: 12px; }
        .mshell-alert-danger { background: #fef2f2; border: 1px solid #ef4444; color: #991b1b; border-radius: 12px; }

        /* ACTION BTNS */
        .mshell-action-btn { width: 34px; height: 34px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .mshell-action-btn.delete { color: #94a3b8; background: transparent; }
        .mshell-action-btn.delete:hover { color: #dc2626; background: #fee2e2; }

        .mshell-badge-loading { font-size: 0.65rem; color: #2563eb; font-weight: 600; margin-top: 2px; }
        .pulse { animation: pulseAnim 1.5s infinite; }
        @keyframes pulseAnim { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
        .animate-slide-down { animation: slideDown 0.3s ease-out; }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `]
})
export class ConventionnesListComponent implements OnInit {
    conventionnes: any[] = [];
    governorates: any[] = [];
    loading = true;
    loadingBtn = false;
    showAddForm = false;
    
    newConv: any = {
        nom: '',
        email: '',
        region: ''
    };

    successMsg = '';
    errorMsg = '';

    constructor(
        private adminService: AdminService,
        private locationService: LocationService,
        public settings: SettingsService
    ) { }

    ngOnInit() {
        const cached = localStorage.getItem('otic_admin_conventionnes_list');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                // remove any temp items that might have been stuck in cache
                this.conventionnes = parsed.filter((p: any) => !p.isTemp);
                this.loading = false;
            } catch (e) { }
        }
        
        this.loadData();
        this.loadGovernorates();
    }

    loadGovernorates() {
        this.locationService.getGovernorates().subscribe({
            next: (data) => this.governorates = data,
            error: (err) => console.error(err)
        });
    }

    loadData() {
        if (this.conventionnes.length === 0) this.loading = true;
        this.adminService.getConventionnes().subscribe({
            next: (data) => {
                this.conventionnes = data;
                localStorage.setItem('otic_admin_conventionnes_list', JSON.stringify(this.conventionnes));
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    onSubmit() {
        if (!this.newConv.nom || !this.newConv.email) return;

        this.loadingBtn = true;
        this.errorMsg = '';
        this.successMsg = '';

        // OPTIMISTIC UI: Add to list immediately for "direct" feel
        const tempPartner = {
            _id: 'temp-' + Date.now(),
            nom: this.newConv.nom,
            email: this.newConv.email,
            region: this.newConv.region || 'Toute la Tunisie', // Show the selected region
            isTemp: true
        };
        
        this.conventionnes = [tempPartner, ...this.conventionnes];
        const originalList = [...this.conventionnes]; // backup if error
        
        // Save current data for resetting but keep it visible for a split second 
        // Or just clear right away
        const dataToSend = { ...this.newConv };
        this.resetForm();
        this.showAddForm = false; // Close form immediately

        this.adminService.createConventionne(dataToSend).subscribe({
            next: (res) => {
                // Replace temp with real data safely
                this.conventionnes = this.conventionnes.map(p => 
                    p._id === tempPartner._id ? res.partner : p
                );
                localStorage.setItem('otic_admin_conventionnes_list', JSON.stringify(this.conventionnes));
                this.loadingBtn = false;
            },
            error: (err) => {
                // Revert on error
                this.conventionnes = this.conventionnes.filter(p => p._id !== tempPartner._id);
                this.errorMsg = err.error.msg || 'Une erreur est survenue lors de la création.';
                this.loadingBtn = false;
                this.showAddForm = true; // Re-open if error
            }
        });
    }

    deleteUser(id: string) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce partenaire ?')) {
            this.adminService.deletePartner(id).subscribe({
                next: () => {
                    this.loadData();
                },
                error: (err) => alert('Erreur lors de la suppression')
            });
        }
    }

    resetForm() {
        this.newConv = {
            nom: '', email: '', region: ''
        };
    }

    translate(key: string): string {
        return this.settings.getTranslation(key);
    }
}
