import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../services/api';
import { SettingsService } from '../../../services/settings.service';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-mineral-waters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 2000;">
      <div *ngIf="showSuccess" class="toast show animate-success-toast align-items-center text-white bg-success border-0 shadow-lg" role="alert">
        <div class="d-flex p-3">
          <i class="bi bi-check-circle-fill fs-5 me-3"></i>
          <div class="toast-body p-0 fw-bold">
            {{ successMessage }}
          </div>
          <button type="button" class="btn-close btn-close-white ms-auto" (click)="showSuccess = false"></button>
        </div>
      </div>
    </div>

    <div class="container-fluid dashboard-fade-in" [ngClass]="hideTitle ? 'p-0' : 'p-4'" [dir]="settings.currentSettings.language === 'ar' ? 'rtl' : 'ltr'">
      <div class="row mb-4 align-items-center" *ngIf="!hideTitle">
        <div class="col-md-8">
          <h2 class="fw-bold text-gradient mb-1">
            <i class="bi bi-droplet-fill text-info me-2"></i>
            {{ settings.getTranslation('mineral_waters') }}
          </h2>
          <p class="text-muted mb-0">{{ translate('mineral_waters_subtitle', 'Analyses et statistiques comparatives des eaux embouteillées en Tunisie.') }}</p>
        </div>
        <div class="col-md-4 text-md-end mt-3 mt-md-0">
          <button *ngIf="isSuperAdmin" class="btn btn-add-brand rounded-pill px-4 py-2 me-3 shadow-lg" (click)="openAddModal()">
            <div class="d-flex align-items-center">
              <span class="icon-box me-2"><i class="bi bi-plus-lg"></i></span>
              <span class="fw-bold">{{ translate('add_brand', 'Ajouter une marque') }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Enhanced Stats Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="stat-card p-3 rounded-4 shadow-sm border-0 h-100 bg-white">
            <div class="d-flex align-items-center mb-2">
              <div class="icon-circle bg-primary-subtle text-primary me-3">
                <i class="bi bi-database-fill"></i>
              </div>
              <h6 class="mb-0 text-muted small uppercase fw-semibold ls-1">TOTAL MARQUES</h6>
            </div>
            <h3 class="fw-bold mb-1 text-dark">{{ brands.length }}</h3>
            <div class="progress mt-2" style="height: 4px;">
              <div class="progress-bar bg-primary" [style.width]="'100%'"></div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card p-3 rounded-4 shadow-sm border-0 h-100 bg-white">
            <div class="d-flex align-items-center mb-2">
              <div class="icon-circle bg-info-subtle text-info me-3">
                <i class="bi bi-award-fill"></i>
              </div>
              <h6 class="mb-0 text-muted small uppercase fw-semibold ls-1">TOP QUALITÉ</h6>
            </div>
            <h3 class="fw-bold mb-1 text-dark">{{ getQualityPercentage() }}%</h3>
            <p class="small text-muted mb-0">{{ countByCategory(['Excellent', 'Bien', 'Excellent (faible minéralisation)']) }} marques au top</p>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card p-3 rounded-4 shadow-sm border-0 h-100 bg-white">
            <div class="d-flex align-items-center mb-2">
              <div class="icon-circle bg-info-subtle text-info me-3">
                <i class="bi bi-lightning-charge-fill"></i>
              </div>
              <h6 class="mb-0 text-muted small uppercase fw-semibold ls-1">TDS MOYEN</h6>
            </div>
            <h3 class="fw-bold mb-1 text-dark">{{ avgTDS.toFixed(0) }} <small class="fs-6 fw-normal">mg/L</small></h3>
            <p class="small text-muted mb-0">Minéralisation modérée</p>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card p-3 rounded-4 shadow-sm border-0 h-100 bg-white">
            <div class="d-flex align-items-center mb-2">
              <div class="icon-circle bg-primary-subtle text-primary me-3">
                <i class="bi bi-activity"></i>
              </div>
              <h6 class="mb-0 text-muted small uppercase fw-semibold ls-1">PH MOYEN</h6>
            </div>
            <h3 class="fw-bold mb-1 text-dark">{{ avgPH.toFixed(1) }}</h3>
            <p class="small text-muted mb-0">Légèrement {{ avgPH > 7 ? 'alcaline' : 'acide' }}</p>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-header bg-white border-0 py-3">
              <h5 class="mb-0 fw-bold">Répartition par Qualité</h5>
            </div>
            <div class="card-body d-flex align-items-center justify-content-center p-4">
              <div style="height: 250px; width: 100%;">
                <canvas #qualityChart></canvas>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-header bg-white border-0 py-3">
              <h5 class="mb-0 fw-bold">Distribution du pH</h5>
            </div>
            <div class="card-body p-4">
              <div style="height: 250px; width: 100%;">
                <canvas #phChart></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div class="card-header bg-white py-3 border-0">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <h5 class="mb-3 mb-md-0 fw-bold text-dark">{{ translate('water_brands_list', 'Liste détaillée des marques') }}</h5>
            <div class="search-box position-relative">
              <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              <input type="text" class="form-control ps-5 rounded-pill border-light-subtle bg-light-subtle" 
                     [placeholder]="translate('search_brand', 'Filtrer par nom ou qualité...')"
                     (input)="onSearch($event)">
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 custom-table">
            <thead class="bg-light">
              <tr>
                <th class="ps-4 py-3">{{ translate('marque', 'Marque') }}</th>
                <th class="py-3">TDS (mg/L)</th>
                <th class="py-3">pH</th>
                <th class="py-3">Nitrates (NO₃⁻)</th>
                <th class="py-3">{{ translate('notes', 'Notes') }}</th>
                <th class="py-3 pe-4 text-end" *ngIf="isSuperAdmin">{{ translate('actions', 'Actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let brand of filteredBrands" class="brand-row">
                <td class="ps-4 fw-medium text-dark">
                  <div class="d-flex align-items-center">
                    <div class="brand-avatar me-3 text-white shadow-sm" style="background: linear-gradient(135deg, #3b82f6, #06b6d4) !important;">
                      {{ brand.marque.charAt(0) }}
                    </div>
                    {{ brand.marque }}
                  </div>
                </td>
                <td><span class="badge bg-light text-dark border px-3 py-2 rounded-pill font-monospace fw-normal">{{ brand.tds }}</span></td>
                <td><span class="badge bg-light text-dark border px-3 py-2 rounded-pill font-monospace fw-normal">{{ brand.ph }}</span></td>
                <td>
                    <span class="badge px-3 py-2 rounded-pill font-monospace fw-normal"
                          [ngClass]="getNitrateClass(brand.nitrates)">
                        {{ brand.nitrates }}
                    </span>
                </td>
                <td>
                  <span class="badge py-2 px-3 rounded-pill note-badge shadow-sm" [ngClass]="getNoteClass(brand.notes)">
                    {{ brand.notes }}
                  </span>
                </td>
                <td class="pe-4 text-end" *ngIf="isSuperAdmin">
                  <div class="btn-group shadow-sm rounded-pill overflow-hidden">
                    <button class="btn btn-sm btn-outline-primary border-0 px-3" (click)="openEditModal(brand)" title="Modifier">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger border-0 px-3" (click)="onDelete(brand._id)" title="Supprimer">
                      <i class="bi bi-trash-fill"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredBrands.length === 0">
                <td [attr.colspan]="isSuperAdmin ? 6 : 5" class="text-center py-5">
                  <div class="py-4">
                    <i class="bi bi-slash-circle fs-1 text-muted opacity-25 mb-3 d-block"></i>
                    <p class="text-muted">Aucune marque ne correspond à votre recherche.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal (Enhanced & Pro) -->
      <div class="custom-modal-backdrop" *ngIf="showModal" (click)="closeModal()"></div>
      <div class="custom-modal wide-modal" *ngIf="showModal">
        <div class="modal-wrapper">
          <div class="modal-inner shadow-2xl border-0 rounded-5 overflow-hidden border-glow">
            
            <div class="row g-0">
              <!-- Left Sidebar Decorative -->
              <div class="col-lg-4 d-none d-lg-block modal-sidebar-gradient p-5 text-white position-relative">
                <div class="position-relative z-1">
                  <span class="badge bg-white bg-opacity-20 text-white rounded-pill px-3 py-1 mb-4 small fw-bold ls-2 uppercase">Système OTIC</span>
                  <h2 class="fw-bold mb-4 mt-2 display-6">{{ editingBrandId ? 'Édition' : 'Nouvelle' }} <br><span class="text-white-50">Ressource</span></h2>
                  <p class="opacity-75 mb-5 lh-lg">Veuillez renseigner les paramètres physico-chimiques précis pour garantir l'intégrité de la base de données hydrologique.</p>
                  
                  <div class="feature-tip d-flex align-items-center mb-4 p-3 rounded-4 bg-white bg-opacity-10 backdrop-blur">
                    <div class="icon-sq me-3 bg-white text-primary rounded-3 shadow-sm">
                      <i class="bi bi-shield-check-fill"></i>
                    </div>
                    <div class="small">Données vérifiées par le Super Admin</div>
                  </div>

                  <div class="modal-water-art">
                    <i class="bi bi-droplet-half opacity-10"></i>
                  </div>
                </div>
              </div>

              <!-- Right Content Form -->
              <div class="col-lg-8 bg-white p-4 p-md-5">
                <div class="d-flex justify-content-between align-items-center mb-5">
                  <div>
                    <h3 class="fw-bold text-dark mb-1">{{ editingBrandId ? 'Modifier la marque' : 'Ajouter une nouvelle marque' }}</h3>
                    <p class="text-muted small">Remplissez les informations ci-dessous</p>
                  </div>
                  <button type="button" class="btn-close-custom" (click)="closeModal()"><i class="bi bi-x-lg"></i></button>
                </div>

                <form #brandForm="ngForm">
                  <div class="row g-4">
                    <!-- Brand Name -->
                    <div class="col-12">
                      <div class="form-floating custom-floating shadow-sm">
                        <input type="text" class="form-control" id="brandName" name="marque" 
                               [(ngModel)]="brandModel.marque" required placeholder="Nom de la marque">
                        <label for="brandName"><i class="bi bi-tag-fill me-2 text-primary"></i>Nom de la marque d'eau</label>
                      </div>
                    </div>

                    <!-- Grid for parameters -->
                    <div class="col-md-6 text-start">
                      <label class="form-label text-muted small fw-bold ls-1 mb-2">MINÉRALISATION (TDS)</label>
                      <div class="input-group pro-input-group shadow-sm">
                        <span class="input-group-text"><i class="bi bi-moisture"></i></span>
                        <input type="text" class="form-control" name="tds" [(ngModel)]="brandModel.tds" placeholder="Valeur TDS (mg/L)">
                      </div>
                    </div>

                    <div class="col-md-6 text-start">
                      <label class="form-label text-muted small fw-bold ls-1 mb-2">POTENTIEL HYDROGÈNE (pH)</label>
                      <div class="input-group pro-input-group shadow-sm">
                        <span class="input-group-text"><i class="bi bi-activity"></i></span>
                        <input type="text" class="form-control" name="ph" [(ngModel)]="brandModel.ph" placeholder="Valeur pH (0-14)">
                      </div>
                    </div>

                    <div class="col-12 text-start">
                      <label class="form-label text-muted small fw-bold ls-1 mb-2">TAUX DE NITRATES (NO₃⁻)</label>
                      <div class="input-group pro-input-group shadow-sm">
                        <span class="input-group-text"><i class="bi bi-virus"></i></span>
                        <input type="text" class="form-control" name="nitrates" [(ngModel)]="brandModel.nitrates" placeholder="Nitrates en mg/L">
                      </div>
                    </div>

                    <!-- Quality Fancy Selector -->
                    <div class="col-12 text-start">
                      <label class="form-label text-muted small fw-bold ls-1 mb-3">ÉVALUATION DE LA QUALITÉ</label>
                      <div class="row g-2">
                        <div class="col-3" *ngFor="let opt of ['Excellent', 'Bien', 'Passable', 'Inacceptable']" style="z-index: 10;">
                          <button type="button" 
                                  (click)="brandModel.notes = opt"
                                  class="btn w-100 py-3 rounded-4 quality-btn shadow-sm transition-all"
                                  [ngClass]="[brandModel.notes === opt ? 'active-quality' : '', 'q-btn-' + opt.toLowerCase()]">
                            <i class="bi d-block mb-1 fs-4" [ngClass]="getQualityIcon(opt)"></i>
                            <span class="tiny-text fw-bold">{{ opt }}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-5 pt-4 border-top d-flex gap-3">
                    <button type="button" class="btn btn-pro-cancel flex-grow-1 py-3 rounded-pill fw-bold" (click)="closeModal()">ANNULER</button>
                    <button type="button" class="btn btn-pro-submit flex-grow-1 py-3 rounded-pill fw-bold shadow-lg" 
                            [disabled]="!brandModel.marque" (click)="onSubmit()">
                      {{ editingBrandId ? 'CONFIRMER LES MODIFICATIONS' : 'ENREGISTRER EN BASE' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-gradient {
      background: linear-gradient(90deg, #0f172a, #0ea5e9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .ls-1 { letter-spacing: 0.05em; }

    .stat-card {
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.15) !important;
    }

    .icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }

    .brand-avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .custom-table thead th {
      font-size: 0.72rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom-width: 0;
      background-color: #f8fafc;
    }

    .brand-row:hover { background-color: #f1f5f9; }

    .note-badge { font-weight: 600; font-size: 0.8rem; }

    /* Enhanced Note Badges with Vibrancy */
    .bg-excellent { 
      background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important; 
      color: white !important; 
      border: none !important;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    }
    .bg-bien { 
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%) !important; 
      color: white !important; 
      border: none !important;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    }
    .bg-passable { 
      background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%) !important; 
      color: white !important; 
      border: none !important;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
    }
    .bg-inacceptable { 
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%) !important; 
      color: white !important; 
      border: none !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    }

    .bg-only-excellent { background-color: #22c55e; }
    .bg-only-bien { background-color: #10b981; }
    .bg-only-passable { background-color: #f59e0b; }
    .bg-only-inacceptable { background-color: #ef4444; }

    .nitrate-normal { background-color: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
    .nitrate-high { background-color: #ef4444; color: white; border: none; font-weight: 700; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2); }

    .search-box input {
      width: 320px;
      border: 1px solid #e2e8f0;
    }
    .search-box input:focus {
      box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
      border-color: #0ea5e9;
    }

    .dashboard-fade-in { animation: fadeIn 0.5s ease-out; }

    .btn-add-brand {
      background: linear-gradient(135deg, #0ea5e9, #2563eb);
      color: white;
      border: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .btn-add-brand:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4) !important;
      color: white;
    }
    .btn-add-brand .icon-box {
      background: rgba(255, 255, 255, 0.2);
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }

    /* Enhanced Modal Styles */
    .wide-modal {
      max-width: 950px !important;
    }

    .modal-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-inner {
      width: 100%;
      background: white;
      display: flex;
      flex-direction: column;
    }

    .custom-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      z-index: 1050;
    }

    .custom-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      max-width: 550px;
      z-index: 1060;
      animation: modalScaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .modal-sidebar-gradient {
      background: linear-gradient(165deg, #0f172a 0%, #1e293b 100%);
      border-right: 1px solid rgba(255,255,255,0.05);
    }

    .border-glow {
      box-shadow: 0 0 40px rgba(14,165,233,0.15);
    }
    
    .modal-water-art {
      position: absolute;
      bottom: -40px;
      right: -20px;
      font-size: 15rem;
      color: rgba(255,255,255,0.03);
      transform: rotate(-15deg);
    }

    .icon-sq {
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .backdrop-blur {
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.1);
    }

    .btn-close-custom {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: none;
      background: #f1f5f9;
      color: #94a3b8;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-close-custom:hover {
      background: #ef4444;
      color: white;
      transform: rotate(90deg);
    }

    .custom-floating {
      border: 2px solid #f1f5f9;
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .custom-floating:focus-within {
      border-color: #0ea5e9;
      background: white;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    }
    .custom-floating input {
      border: none;
      height: 64px;
      padding-top: 1.625rem;
      padding-left: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }
    .custom-floating label {
      padding-left: 1.25rem;
      color: #94a3b8;
    }

    .pro-input-group {
      border-radius: 14px;
      overflow: hidden;
      border: 2px solid #f1f5f9;
      transition: all 0.3s ease;
    }
    .pro-input-group:focus-within {
      border-color: #0ea5e9;
      box-shadow: 0 8px 12px -3px rgba(0, 0, 0, 0.05);
    }
    .pro-input-group .input-group-text {
      background: white;
      border: none;
      color: #64748b;
      padding-left: 1.2rem;
      font-size: 1.1rem;
    }
    .pro-input-group input {
      border: none;
      padding: 0.8rem 1rem;
      font-weight: 500;
    }

    .quality-btn {
      border: 2px solid #f8fafc;
      background: #f8fafc;
      color: #64748b;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .quality-btn:hover { transform: translateY(-3px); background: #f1f5f9; }
    
    .q-btn-excellent:hover, .active-quality.q-btn-excellent { border-color: #22c55e !important; color: white !important; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important; }
    .q-btn-bien:hover, .active-quality.q-btn-bien { border-color: #10b981 !important; color: white !important; background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; }
    .q-btn-passable:hover, .active-quality.q-btn-passable { border-color: #f59e0b !important; color: white !important; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important; }
    .q-btn-inacceptable:hover, .active-quality.q-btn-inacceptable { border-color: #ef4444 !important; color: white !important; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important; }

    .active-quality {
      transform: scale(1.05);
      border-width: 2px !important;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
    }

    .tiny-text { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.02em; }

    .btn-pro-cancel {
      background: #f8fafc;
      color: #64748b;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
    }
    .btn-pro-cancel:hover { background: #f1f5f9; color: #1e293b; }

    .btn-pro-submit {
      background: linear-gradient(135deg, #0ea5e9, #2563eb);
      color: white;
      border: none;
      transition: all 0.3s;
    }
    .btn-pro-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -6px rgba(37, 99, 235, 0.5) !important;
    }

    @keyframes pulse-slow {
      0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
      100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
    }

    @keyframes modalScaleUp {
      from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-success-toast {
      animation: toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      border-radius: 12px;
      min-width: 300px;
    }
    @keyframes toastSlideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class MineralWatersComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() hideTitle = false;
  @ViewChild('qualityChart') qualityChartRef!: ElementRef;
  @ViewChild('phChart') phChartRef!: ElementRef;

  brands: any[] = [];
  filteredBrands: any[] = [];
  avgTDS: number = 0;
  avgPH: number = 0;

  qualityChart: any;
  phChart: any;
  chartTimeout: any;

  isSuperAdmin = false;
  showModal = false;
  editingBrandId: string | null = null;
  brandModel: any = {
    marque: '',
    tds: '',
    ph: '',
    nitrates: '',
    notes: 'Bien'
  };

  showSuccess = false;
  successMessage = '';

  constructor(
    public api: Api,
    public settings: SettingsService,
    private auth: AuthService,
    private adminService: AdminService
  ) { }

  ngOnInit(): void {
    // Check if user is super admin
    this.auth.currentUser$.subscribe(user => {
      this.isSuperAdmin = user?.role === 'super_admin';
    });

    // 1. Try to load from localStorage for truly instant UI on page refresh
    const cached = localStorage.getItem('otic_water_brands');
    if (cached) {
      try {
        this.brands = JSON.parse(cached);
        this.filteredBrands = [...this.brands];
        this.calculateBasicStats();
        // Small delay to ensure DOM is ready for charts
        setTimeout(() => this.initCharts(), 100);
      } catch (e) { console.error('Error parsing cached water brands', e); }
    }

    // 2. Fetch from API (will use service cache if available)
    this.api.getWaterBrands().subscribe({
      next: (data) => {
        this.brands = data;
        this.filteredBrands = [...this.brands];
        this.calculateBasicStats();

        // Save to localStorage for next time
        localStorage.setItem('otic_water_brands', JSON.stringify(data));

        // Re-init charts with fresh data
        setTimeout(() => this.initCharts(), 100);
      },
      error: (err) => console.error('Error fetching water brands:', err)
    });
  }

  ngAfterViewInit(): void { }

  translate(key: string, defaultVal: string): string {
    const val = this.settings.getTranslation(key);
    return val === key ? defaultVal : val;
  }

  calculateBasicStats(): void {
    if (this.brands.length === 0) return;

    let totalTDS = 0, countTDS = 0;
    let totalPH = 0, countPH = 0;

    this.brands.forEach(b => {
      const tdsVal = this.parseNumeric(b.tds);
      if (tdsVal !== null) { totalTDS += tdsVal; countTDS++; }

      const phVal = this.parseNumeric(b.ph);
      if (phVal !== null) { totalPH += phVal; countPH++; }
    });

    this.avgTDS = countTDS > 0 ? totalTDS / countTDS : 0;
    this.avgPH = countPH > 0 ? totalPH / countPH : 0;
  }

  parseNumeric(val: string): number | null {
    if (!val || val === '~?' || val.includes('?')) return null;
    try {
      // Handle ranges like "371.7 / 447"
      if (val.includes('/')) {
        const parts = val.split('/').map(p => this.parseNumeric(p.trim())).filter(p => p !== null);
        return parts.length > 0 ? parts.reduce((a, b) => a! + b!, 0)! / parts.length : null;
      }
      const cleaned = val.replace('~', '').replace('>', '').replace(',', '.').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    } catch (e) { return null; }
  }

  getQualityPercentage(): number {
    const count = this.countByCategory(['Excellent', 'Bien']);
    return this.brands.length > 0 ? Math.round((count / this.brands.length) * 100) : 0;
  }

  countByCategory(categories: string[]): number {
    return this.brands.filter(b => categories.some(cat => b.notes && b.notes.includes(cat))).length;
  }

  getNoteClass(note: string, mode: 'full' | 'bg-only' = 'full'): string {
    if (!note) return mode === 'full' ? 'bg-light' : 'bg-secondary';
    const n = note.toLowerCase();
    let type = 'secondary';
    if (n.includes('excellent')) type = 'excellent';
    else if (n.includes('bien')) type = 'bien';
    else if (n.includes('passable')) type = 'passable';
    else if (n.includes('inacceptable')) type = 'inacceptable';

    return mode === 'full' ? `bg-${type}` : `bg-only-${type}`;
  }

  getNitrateClass(nitrates: string): string {
    const val = this.parseNumeric(nitrates);
    return (val !== null && val > 15) ? 'nitrate-high' : 'nitrate-normal';
  }

  getQualityIcon(note: string): string {
    if (!note) return 'bi-question-circle';
    const n = note.toLowerCase();
    if (n.includes('excellent')) return 'bi-star-fill';
    if (n.includes('bien')) return 'bi-check-circle-fill';
    if (n.includes('passable')) return 'bi-exclamation-circle-fill';
    if (n.includes('inacceptable')) return 'bi-x-circle-fill';
    return 'bi-info-circle';
  }



  onSearch(event: any): void {
    const term = event.target.value.toLowerCase();
    this.filteredBrands = this.brands.filter(b =>
      b.marque.toLowerCase().includes(term) ||
      b.notes?.toLowerCase().includes(term)
    );
  }

  initCharts(): void {
    this.initQualityChart();
    this.initPHChart();
  }

  initQualityChart(): void {
    if (!this.qualityChartRef) return;
    const ctx = this.qualityChartRef.nativeElement.getContext('2d');

    const data = {
      labels: ['Excellent', 'Bien', 'Passable', 'Inacceptable'],
      datasets: [{
        data: [
          this.countByCategory(['Excellent']),
          this.countByCategory(['Bien']),
          this.countByCategory(['Passable']),
          this.countByCategory(['Inacceptable'])
        ],
        backgroundColor: ['#22c55e', '#10b981', '#f59e0b', '#ef4444'],
        hoverOffset: 15,
        borderWidth: 0
      }]
    };

    if (this.qualityChart) this.qualityChart.destroy();
    this.qualityChart = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
        },
        cutout: '70%'
      }
    });
  }

  initPHChart(): void {
    if (!this.phChartRef) return;
    const ctx = this.phChartRef.nativeElement.getContext('2d');

    const phRanges = { 'Acide (< 7)': 0, 'Neutre (7)': 0, 'Alcaline (> 7)': 0 };
    this.brands.forEach(b => {
      const val = this.parseNumeric(b.ph);
      if (val !== null) {
        if (val < 7) phRanges['Acide (< 7)']++;
        else if (val === 7) phRanges['Neutre (7)']++;
        else phRanges['Alcaline (> 7)']++;
      }
    });

    if (this.phChart) this.phChart.destroy();
    this.phChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(phRanges),
        datasets: [{
          label: 'Nombre de marques',
          data: Object.values(phRanges),
          backgroundColor: '#0ea5e9',
          borderRadius: 8,
          barThickness: 40
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { display: false } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // --- CRUD Logic ---
  openAddModal() {
    this.editingBrandId = null;
    this.brandModel = { marque: '', tds: '', ph: '', nitrates: '', notes: 'Bien' };
    this.showModal = true;
  }

  openEditModal(brand: any) {
    this.editingBrandId = brand._id;
    this.brandModel = { ...brand };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmit() {
    if (this.editingBrandId) {
      this.adminService.updateWaterBrand(this.editingBrandId, this.brandModel).subscribe({
        next: () => {
          this.refreshData();
          this.closeModal();
          this.triggerSuccess('Modification effectuée avec succès !');
        },
        error: (err) => alert('Erreur lors de la modification : ' + (err.error?.msg || err.message))
      });
    } else {
      this.adminService.createWaterBrand(this.brandModel).subscribe({
        next: () => {
          this.refreshData();
          this.closeModal();
          this.triggerSuccess('Nouvelle marque ajoutée avec succès !');
        },
        error: (err) => alert('Erreur lors de l\'ajout : ' + (err.error?.msg || err.message))
      });
    }
  }

  triggerSuccess(msg: string) {
    this.successMessage = msg;
    this.showSuccess = true;
    setTimeout(() => this.showSuccess = false, 5000);
  }

  onDelete(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette marque ?')) {
      this.adminService.deleteWaterBrand(id).subscribe({
        next: () => this.refreshData(),
        error: (err) => alert('Erreur lors de la suppression: ' + (err.error?.msg || err.message))
      });
    }
  }

  refreshData() {
    this.api.getWaterBrands(true).subscribe({
      next: (data) => {
        this.brands = data;
        this.filteredBrands = [...this.brands];
        this.calculateBasicStats();
        localStorage.setItem('otic_water_brands', JSON.stringify(data));
        this.initCharts();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.qualityChart) this.qualityChart.destroy();
    if (this.phChart) this.phChart.destroy();
    if (this.chartTimeout) clearTimeout(this.chartTimeout);
  }
}
