import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../services/api';
import { SettingsService } from '../../../services/settings.service';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import Chart from 'chart.js/auto';
import * as L from 'leaflet';

@Component({
  selector: 'app-thermal-baths',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `

    <div class="otic-container py-4">
      <!-- Premium Toast Notification -->
      <div *ngIf="showSuccess" class="position-fixed bottom-0 end-0 p-4" style="z-index: 9999;">
        <div class="otic-success-toast animate-toast d-flex align-items-center gap-3 p-3 pe-4 rounded-4 shadow-lg">
          <div class="toast-icon-circle">
            <i class="bi bi-check-lg text-white fs-5"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold text-dark" style="font-size: 0.9rem;">{{ toastTitle }}</div>
            <div class="text-muted" style="font-size: 0.78rem;">{{ successMessage }}</div>
          </div>
          <button class="btn-close btn-close-sm ms-2" (click)="showSuccess = false"></button>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-4 bg-white p-4 rounded-4 shadow-sm border border-light">
        <div>
          <h2 class="fw-bold m-0 text-dark d-flex align-items-center">
            <i class="bi bi-water text-primary me-2 fs-3"></i>
            {{ translate('dashboard.thermalBaths.title', 'Stations Thermales') }}
          </h2>
          <p class="text-muted small mb-0">{{ translate('dashboard.thermalBaths.subtitle', 'Patrimoine thermal et thalasso de Tunisie') }}</p>
        </div>
        <div class="d-flex gap-2">
          <button (click)="refreshData()" class="btn btn-light rounded-pill px-3 py-2 border">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button *ngIf="isSuperAdmin" (click)="openAddModal()" class="btn btn-primary rounded-pill px-4 py-2 shadow-sm d-flex align-items-center gap-2">
            <i class="bi bi-plus-lg"></i>
            <span class="d-none d-md-inline">{{ translate('dashboard.thermalBaths.add', 'Ajouter une Station') }}</span>
          </button>
        </div>
      </div>

      <!-- Hero Stats -->
      <div class="row g-4 mb-4">
        <div class="col-md-3">
          <div class="otic-card-stat p-4 h-100 bg-white rounded-4 border-0 shadow-sm overflow-hidden position-relative">
            <div class="position-absolute end-0 bottom-0 opacity-10 p-3">
              <i class="bi bi-buildings fs-1"></i>
            </div>
            <h6 class="text-uppercase text-muted fw-bold small mb-3 ls-wide">{{ translate('dashboard.thermalBaths.total', 'Total Stations') }}</h6>
            <div class="d-flex align-items-baseline gap-2">
              <span class="display-5 fw-bold text-dark">{{ baths.length }}</span>
              <span class="text-success small fw-bold"><i class="bi bi-graph-up"></i> +12%</span>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="otic-card-stat p-4 h-100 bg-white rounded-4 border-0 shadow-sm overflow-hidden position-relative">
            <div class="position-absolute end-0 bottom-0 opacity-10 p-3">
              <i class="bi bi-thermometer-half fs-1"></i>
            </div>
            <h6 class="text-uppercase text-muted fw-bold small mb-3 ls-wide">{{ translate('dashboard.thermalBaths.avgTemp', 'Temp. Moyenne') }}</h6>
            <div class="d-flex align-items-baseline gap-2">
              <span class="display-5 fw-bold text-primary">{{ avgTemp | number:'1.1-1' }}°C</span>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="otic-card-stat p-4 h-100 bg-white rounded-4 border-0 shadow-sm overflow-hidden position-relative">
            <div class="position-absolute end-0 bottom-0 opacity-10 p-3">
              <i class="bi bi-check2-circle fs-1"></i>
            </div>
            <h6 class="text-uppercase text-muted fw-bold small mb-3 ls-wide">{{ translate('dashboard.thermalBaths.centers', 'Centres Actifs') }}</h6>
            <div class="d-flex align-items-baseline gap-2">
              <span class="display-5 fw-bold text-orange">{{ getCentresCount() }}</span>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="otic-card-stat p-4 h-100 bg-white rounded-4 border-0 shadow-sm overflow-hidden position-relative">
            <div class="position-absolute end-0 bottom-0 opacity-10 p-3">
              <i class="bi bi-stars fs-1"></i>
            </div>
            <h6 class="text-uppercase text-muted fw-bold small mb-3 ls-wide">{{ translate('dashboard.thermalBaths.satisfaction', 'Satisfaction') }}</h6>
            <div class="d-flex align-items-baseline gap-2">
              <span class="display-5 fw-bold text-indigo">4.6</span>
              <span class="text-muted small">/ 5</span>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Interactive Map Section -->
        <div class="col-lg-8">
          <div class="otic-card rounded-4 border-0 shadow-soft h-100 overflow-hidden position-relative map-card">
            <div class="card-header border-0 bg-transparent py-3 px-4 d-flex justify-content-between align-items-center border-bottom border-light">
              <div class="d-flex align-items-center">
                <i class="bi bi-geo-alt-fill text-danger me-2"></i>
                <h5 class="m-0 fw-bold">{{ translate('dashboard.thermalBaths.mapTitle', 'Exploration Géothermale') }}</h5>
                <span class="badge bg-primary-subtle text-primary border ms-3 rounded-pill" *ngIf="baths.length > 0">
                  <i class="bi bi-geo-fill me-1"></i> {{ baths.length }} établissements
                </span>
              </div>
              <div class="d-flex gap-2 align-items-center">
                <button class="btn btn-sm btn-light border rounded-pill px-3 shadow-sm" (click)="refreshData(true)">
                  <i class="bi bi-arrow-clockwise me-1"></i> Actualiser
                </button>
                <div class="map-controls-group d-flex ms-2">
                  <button (click)="zoomIn()" class="btn btn-sm btn-white border px-3" title="Zoom In"><i class="bi bi-plus-lg"></i></button>
                  <button (click)="zoomOut()" class="btn btn-sm btn-white border px-3" title="Zoom Out"><i class="bi bi-dash-lg"></i></button>
                </div>
              </div>
            </div>
            <div id="thermal-map" style="height: 550px; z-index: 1;"></div>

            <!-- Floating Details Panel (Hidden by default, shown on marker click) -->
            <div class="map-overlay-panel" *ngIf="selectedSpring">
              <div class="panel-glass rounded-4 p-4 shadow-lg border-0">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <span [class]="'otic-trust-badge otic-badge-shimmer ' + getBadgeClass(selectedSpring.trustScore)">
                    <i [class]="'bi ' + getBadgeIcon(selectedSpring.trustScore) + ' me-1'"></i>
                    {{ getBadgeLabel(selectedSpring.trustScore) }}
                  </span>
                  <button (click)="selectedSpring = null" class="btn-close btn-close-compact"></button>
                </div>
                
                <div class="spring-img-container mb-3 shadow-sm">
                  <img [src]="selectedSpring.imageUrl || 'logo.png'" alt="Spring">
                </div>
                
                <h4 class="fw-bold text-dark mb-1">{{ selectedSpring.name }}</h4>
                <p class="text-muted small d-flex align-items-center gap-1 mb-3">
                  <i class="bi bi-geo-alt-fill text-primary"></i> {{ selectedSpring.location }}
                </p>
                
                <div class="stat-row-mini mb-4">
                  <div class="mini-stat">
                    <span class="mini-stat label">Température</span>
                    <span class="mini-stat value text-danger">{{ selectedSpring.temperature }}°C</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-stat label">Note</span>
                    <span class="mini-stat value text-warning">
                      {{ selectedSpring.rating || '4.5' }} <i class="bi bi-star-fill small"></i>
                    </span>
                  </div>
                </div>
                
                <h6 class="fw-bold mb-2 small text-uppercase ls-wide">Indications Thérapeutiques</h6>
                <p class="text-muted small mb-4 line-height-md">{{ selectedSpring.indications || 'Traitement efficace des rhumatismes et des voies respiratoires.' }}</p>
                
                <div class="d-grid gap-2">
                  <a [href]="'https://www.google.com/search?q=' + encode(selectedSpring.name)" target="_blank" class="btn btn-primary rounded-pill py-2 shadow-sm">
                    Découvrir plus
                  </a>
                  <button *ngIf="isSuperAdmin" (click)="openEditModal(selectedSpring)" class="btn btn-light rounded-pill py-2 border">
                    <i class="bi bi-pencil me-1"></i> Modifier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <!-- Type Distribution Chart -->
          <div class="otic-card rounded-4 border-0 shadow-soft mb-4 p-4 bg-white h-auto">
            <h6 class="fw-bold mb-4 text-dark"><i class="bi bi-pie-chart-fill me-2 text-indigo"></i>{{ translate('dashboard.thermalBaths.distribution', 'Répartition par Type') }}</h6>
            <div style="height: 220px;">
              <canvas #typeChart></canvas>
            </div>
            <div class="mt-4 row g-2">
              <div class="col-12">
                <div class="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border border-white">
                  <span class="small fw-medium"><i class="bi bi-circle-fill text-primary me-2 small"></i>Stations Thermales</span>
                  <span class="badge bg-primary rounded-pill">65%</span>
                </div>
              </div>
              <div class="col-12">
                <div class="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border border-white">
                  <span class="small fw-medium"><i class="bi bi-circle-fill text-info me-2 small"></i>Thalasso</span>
                  <span class="badge bg-info rounded-pill">25%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Regional Distribution -->
          <div class="otic-card rounded-4 border-0 shadow-soft p-4 bg-white h-auto">
            <h6 class="fw-bold mb-4 text-dark"><i class="bi bi-map-fill me-2 text-primary"></i>{{ translate('dashboard.thermalBaths.regions', 'Stations par Gouvernorat') }}</h6>
            <div style="height: 200px;">
              <canvas #govChart></canvas>
            </div>
            <div class="mt-4 list-group list-group-flush border-top border-light">
              <div class="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-light">
                <span class="small">Tunis / Nord Est</span>
                <span class="fw-bold text-dark small">12 units</span>
              </div>
              <div class="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-light">
                <span class="small">Gabès / Sud Est</span>
                <span class="fw-bold text-dark small">8 units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Data Table -->
      <div class="otic-card rounded-4 border-0 shadow-soft mt-5 overflow-hidden">
        <div class="card-header bg-white border-0 py-4 px-4 border-bottom border-light">
          <div class="row align-items-center">
            <div class="col-md-6">
              <h5 class="fw-bold text-dark m-0">{{ translate('dashboard.thermalBaths.list', 'Annuaire des Stations') }}</h5>
              <p class="text-muted small mb-0">{{ baths.length }} établissements répertoriés</p>
            </div>
            <div class="col-md-6 d-flex justify-content-md-end mt-3 mt-md-0">
              <div class="search-box position-relative w-75">
                <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input type="text" (input)="onSearch($event)" 
                       [placeholder]="translate('dashboard.thermalBaths.searchPlaceholder', 'Rechercher un nom, une ville...')" 
                       class="form-control rounded-pill ps-5 border-light bg-light shadow-none">
              </div>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 custom-otic-table mt-2">
            <thead>
              <tr class="bg-light text-muted small text-uppercase">
                <th class="ps-4 border-0 py-3">{{ translate('dashboard.thermalBaths.station', 'Station') }}</th>
                <th class="border-0 py-3">{{ translate('dashboard.thermalBaths.location', 'Localisation') }}</th>
                <th class="border-0 py-3">{{ translate('dashboard.thermalBaths.temp', 'Température') }}</th>
                <th class="border-0 py-3 text-center">{{ translate('dashboard.thermalBaths.level', 'Certification') }}</th>
                <th class="border-0 py-3 text-center">{{ translate('dashboard.thermalBaths.rating', 'Note') }}</th>
                <th class="pe-4 border-0 py-3 text-end">{{ translate('dashboard.thermalBaths.actions', 'Actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bath of filteredBaths" class="otic-row-hover">
                <td class="ps-4 py-3">
                  <div class="d-flex align-items-center">
                    <div class="avatar-container me-3 shadow-sm rounded-3 overflow-hidden" style="width: 50px; height: 50px;">
                      <img [src]="bath.imageUrl || 'logo.png'" alt="Img" class="w-100 h-100 object-fit-cover">
                    </div>
                    <div>
                      <h6 class="fw-bold mb-0 text-dark">{{ bath.name }}</h6>
                      <span class="text-muted small">{{ bath.type }}</span>
                    </div>
                  </div>
                </td>
                <td class="py-3">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-geo-alt text-primary small"></i>
                    <span class="text-dark small fw-medium">{{ bath.location }}</span>
                  </div>
                </td>
                <td class="py-3">
                  <span class="fw-bold text-danger">{{ bath.temperature }}°C</span>
                </td>
                <td class="py-3 text-center">
                  <span [class]="'otic-trust-badge ' + getBadgeClass(bath.trustScore)">
                    <i [class]="'bi ' + getBadgeIcon(bath.trustScore) + ' me-1'"></i>
                    {{ getBadgeLabel(bath.trustScore).split(' ')[0] }}
                  </span>
                </td>
                <td class="py-3 text-center">
                  <div class="d-flex flex-column align-items-center">
                    <div class="text-warning small mb-1">
                      <i *ngFor="let s of getStarsArray(bath.rating)" [class]="'bi ' + s + ' me-1'"></i>
                    </div>
                    <span class="fw-bold small text-dark">{{ bath.rating || '4.0' }}</span>
                  </div>
                </td>
                <td class="pe-4 py-3 text-end">
                  <div class="btn-group shadow-sm rounded-pill overflow-hidden border">
                    <button (click)="openEditModal(bath)" class="btn btn-white btn-sm px-3 hover-primary" title="Editer">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button *ngIf="isSuperAdmin" (click)="onDelete(bath._id, bath.name)" class="btn btn-white btn-sm px-3 hover-danger" title="Supprimer">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredBaths.length === 0">
                <td colspan="6" class="text-center py-5">
                  <img src="assets/images/empty-state.svg" alt="Vide" style="width: 150px; opacity: 0.5;">
                  <p class="text-muted mt-3">Aucune station trouvée</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Dynamic Modal System -->
    <div *ngIf="showModal" class="otic-modal-overlay">
      <div class="otic-modal-card animate-modal shadow-2xl">
        <div class="modal-header-gradient p-4 rounded-top-4 d-flex justify-content-between align-items-center">
          <div>
            <h4 *ngIf="editingBathId" class="text-white fw-bold mb-0">Modifier l'Établissement</h4>
            <h4 *ngIf="!editingBathId" class="text-white fw-bold mb-0">Nouvel Établissement Thermal</h4>
            <span class="text-white text-opacity-75 small">Veuillez remplir les informations certifiées</span>
          </div>
          <button (click)="closeModal()" class="btn-close btn-close-white"></button>
        </div>
        
        <form (ngSubmit)="onSubmit()" class="p-4 bg-white rounded-bottom-4">
          <div class="row g-3">
            <div class="col-md-7">
              <label class="form-label fw-bold text-muted small text-uppercase">Nom de la Station</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0"><i class="bi bi-bookmark-plus"></i></span>
                <input type="text" name="name" [(ngModel)]="bathModel.name" class="form-control bg-light border-start-0" required placeholder="Ex: Korbous Thermal">
              </div>
            </div>
            <div class="col-md-5">
              <label class="form-label fw-bold text-muted small text-uppercase">Gouvernorat</label>
              <select name="location" [(ngModel)]="bathModel.location" class="form-select bg-light" required (change)="onLocationChange($event)">
                <option value="">Sélectionner...</option>
                <option *ngFor="let gov of Object.keys(govCoords)" [value]="gov">{{ gov }}</option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label fw-bold text-muted small text-uppercase">Température (°C)</label>
              <input type="number" name="temperature" [(ngModel)]="bathModel.temperature" class="form-control bg-light" required>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-bold text-muted small text-uppercase">Type</label>
              <select name="type" [(ngModel)]="bathModel.type" class="form-select bg-light">
                <option value="Station Thermale">Station Thermale</option>
                <option value="Centre de Thalassothérapie">Centre de Thalassothérapie</option>
                <option value="Hammam Thermal">Hammam Thermal</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-bold text-muted small text-uppercase">Trust Score (0-100)</label>
              <input type="number" name="trustScore" [(ngModel)]="bathModel.trustScore" class="form-control bg-light" max="100" min="0">
            </div>

            <!-- Coordinate System -->
            <div class="col-md-6">
              <label class="form-label fw-bold text-muted small text-uppercase">Latitude</label>
              <div class="input-group">
                <span class="input-group-text bg-light"><i class="bi bi-geo"></i></span>
                <input type="number" step="0.000001" name="latitude" [(ngModel)]="bathModel.latitude" class="form-control bg-light" placeholder="Ex: 36.8065">
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold text-muted small text-uppercase">Longitude</label>
              <div class="input-group">
                <span class="input-group-text bg-light"><i class="bi bi-geo"></i></span>
                <input type="number" step="0.000001" name="longitude" [(ngModel)]="bathModel.longitude" class="form-control bg-light" placeholder="Ex: 10.1815">
              </div>
            </div>

            <div class="col-12">
              <label class="form-label fw-bold text-muted small text-uppercase">Indications Thérapeutiques</label>
              <textarea name="indications" [(ngModel)]="bathModel.indications" class="form-control bg-light" rows="2" placeholder="Quels sont les bienfaits ?"></textarea>
            </div>

            <div class="col-12">
              <label class="form-label fw-bold text-muted small text-uppercase">Description Détaillée</label>
              <textarea name="description" [(ngModel)]="bathModel.description" class="form-control bg-light" rows="3" placeholder="Histoire, accès, services proposés..."></textarea>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-bold text-muted small text-uppercase">Latitude</label>
              <input type="number" step="0.000001" name="latitude" [(ngModel)]="bathModel.latitude" class="form-control bg-light">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold text-muted small text-uppercase">Longitude</label>
              <input type="number" step="0.000001" name="longitude" [(ngModel)]="bathModel.longitude" class="form-control bg-light">
            </div>

            <div class="col-12">
              <label class="form-label fw-bold text-muted small text-uppercase">Image de l'établissement</label>
              <div class="d-flex gap-2">
                <input type="file" (change)="onFileSelected($event)" class="form-control bg-light shadow-none" accept="image/*">
                <button type="button" class="btn btn-outline-info rounded-pill" (click)="searchGoogleImages()" [disabled]="!bathModel.name">
                  <i class="bi bi-google"></i>
                </button>
              </div>
              <div *ngIf="bathModel.imageUrl" class="mt-2 rounded-3 overflow-hidden shadow-sm d-inline-block" style="height: 60px;">
                <img [src]="bathModel.imageUrl" alt="Preview" class="h-100">
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4 pt-4 border-top border-light">
            <button type="button" (click)="closeModal()" class="btn btn-outline-secondary rounded-pill px-4 py-2">
              <i class="bi bi-x-lg me-1"></i> Annuler
            </button>
            <button *ngIf="!editingBathId" type="submit" class="btn btn-modal-submit rounded-pill px-5 py-2 shadow-sm">
              <i class="bi bi-plus-circle me-2"></i>
              Enregistrer la Station
            </button>
            <button *ngIf="editingBathId" type="submit" class="btn btn-modal-update rounded-pill px-5 py-2 shadow-sm">
              <i class="bi bi-pencil-square me-2"></i>
              Confirmer les Modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .otic-container { animation: fadeIn 0.6s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .otic-card-stat { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid #f1f5f9!important; }
    .otic-card-stat:hover { transform: translateY(-5px); box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.08)!important; }
    
    .ls-wide { letter-spacing: 0.1em; }
    .text-orange { color: #f97316; }
    .text-indigo { color: #6366f1; }
    .shadow-soft { box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05)!important; }

    /* Custom Table Styles */
    .custom-otic-table thead th { font-weight: 700; letter-spacing: 0.05em; }
    .otic-row-hover { transition: background 0.2s ease; cursor: pointer; }
    .otic-row-hover:hover { background: #f8fafc; }
    .hover-primary:hover { color: #3b82f6!important; background: #eff6ff!important; }
    .hover-danger:hover { color: #ef4444!important; background: #fef2f2!important; }

    /* Search Box */
    .search-box .form-control:focus { background: #fff!important; border-color: #3b82f6!important; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15)!important; }

    /* Modal Styles */
    .otic-modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px);
      z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .otic-modal-card {
      width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto;
      border-radius: 24px; position: relative; scrollbar-width: none;
    }
    .otic-modal-card::-webkit-scrollbar { display: none; }
    .modal-header-gradient { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
    .animate-modal { animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    
    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(30px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* === PREMIUM TOAST === */
    .otic-success-toast {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      min-width: 330px;
    }
    .toast-icon-circle {
      width: 42px; height: 42px; border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.35);
    }
    .animate-toast {
      animation: toastSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes toastSlideIn {
      from { transform: translateX(110%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    /* === MODAL SUBMIT BUTTONS === */
    .btn-modal-submit {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white; border: none; font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-modal-submit:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -5px rgba(34, 197, 94, 0.5)!important; color: white; }
    .btn-modal-update {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white; border: none; font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-modal-update:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -5px rgba(59, 130, 246, 0.5)!important; color: white; }

    /* === LEAFLET CUSTOM STYLES === */
    ::ng-deep .custom-pro-marker { background: none !important; border: none !important; }
    ::ng-deep .marker-pin-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    ::ng-deep .marker-pin {
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      background: #3b82f6;
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -15px 0 0 -15px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      transition: all 0.3s ease;
      z-index: 2;
    }
    ::ng-deep .marker-pin i {
      transform: rotate(45deg);
      color: white;
      font-size: 14px;
    }
    ::ng-deep .marker-pulse {
      position: absolute;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.4);
      animation: pulse-ring 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
      z-index: 1;
    }
    ::ng-deep .marker-label {
      position: absolute;
      top: 20px;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(4px);
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    ::ng-deep .custom-pro-marker:hover .marker-label { opacity: 1; }
    ::ng-deep .custom-pro-marker:hover .marker-pin { background: #1e3a8a; transform: rotate(-45deg) scale(1.1); }

    @keyframes pulse-ring {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }

    ::ng-deep .pro-leaflet-popup .leaflet-popup-content-wrapper {
      background: #0f172a;
      border-radius: 16px;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    ::ng-deep .pro-leaflet-popup .leaflet-popup-content { margin: 0; width: 260px!important; }
    ::ng-deep .pro-leaflet-popup .leaflet-popup-tip { background: #0f172a; }
    
    .pro-popup-card { display: flex; flex-direction: column; min-width: 260px; }
    .pro-popup-img {
      height: 120px;
      width: 100%;
      background-size: cover;
      background-position: center;
      border-bottom: 2px solid #fbbf24;
    }
    .pro-popup-header { background: linear-gradient(135deg, #1e293b, #0f172a); padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .pro-popup-body { padding: 15px; background: #0f172a; }

    .map-card {
      background: #ffffff!important;
      border: 1px solid #e2e8f0!important;
      transition: all 0.3s ease;
    }
    .map-card.card-header {
      background: #ffffff!important;
      border-bottom: 1px solid #f1f5f9!important;
      color: #1e293b!important;
    }
    .map-overlay-panel {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 320px;
      z-index: 1000;
      animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      max-height: 460px;
      display: flex;
      flex-direction: column;
    }
    .panel-glass {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1);
      color: #1e293b;
      overflow-y: auto;
      max-height: 460px;
    }
    .panel-glass::-webkit-scrollbar { width: 6px; }
    .panel-glass::-webkit-scrollbar-thumb { background: rgba(30, 41, 59, 0.15); border-radius: 10px; }
    
    .spring-img-container img { height: 150px; width: 100%; object-fit: cover; border-radius: 12px; }
    .stat-row-mini { display: flex; gap: 10px; }
    .mini-stat { background: #f8fafc; padding: 10px; flex: 1; border-radius: 10px; text-align: center; border: 1px solid #f1f5f9; }
    .mini-stat.label { display: block; font-size: 0.6rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
    .mini-stat.value { font-weight: 700; color: #0f172a; font-size: 1rem; }

    @keyframes slideInRight {
      from { transform: translateX(30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .map-controls {
      position: absolute;
      top: 20px;
      left: 20px;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 10, 0.05);
      overflow: hidden;
    }
    .control-btn {
      width: 40px; height: 40px; border: none; background: transparent; color: #1e293b;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: all 0.2s ease; cursor: pointer;
    }
    .control-btn:hover { background: #f8fafc; color: #3b82f6; }
    .control-divider { height: 1px; background: rgba(0, 0, 0, 0.05); margin: 0 8px; }

    /* Trust Badges */
    .otic-trust-badge {
      display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 50px;
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
      border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); color: #ffffff;
    }
    .otic-badge-gold { background: linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%); color: #5c3a00!important; }
    .otic-badge-silver { background: linear-gradient(135deg, #d3d3d3 0%, #ffffff 25%, #a9a9a9 50%, #ffffff 75%, #808080 100%); color: #2c3e50!important; }
    .otic-badge-bronze { background: linear-gradient(135deg, #804a00 0%, #fca5a5 25%, #b45309 50%, #fef08a 75%, #78350f 100%); color: #ffffff!important; }
    .otic-badge-shimmer { position: relative; overflow: hidden; }
    .otic-badge-shimmer::after {
      content: ''; position: absolute; top: -50%; left: -60%; width: 30%; height: 200%;
      background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0) 100%);
      transform: rotate(30deg); animation: otic-badge-sweep 3.5s infinite;
    }
    @keyframes otic-badge-sweep { 0% { left: -60%; } 30% { left: 140%; } 100% { left: 140%; } }

    @keyframes gold-halo { 0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.8); } 70% { box-shadow: 0 0 0 12px rgba(251, 191, 36, 0); } 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); } }
    @keyframes silver-halo { 0% { box-shadow: 0 0 0 0 rgba(148, 163, 184, 0.8); } 70% { box-shadow: 0 0 0 10px rgba(148, 163, 184, 0); } 100% { box-shadow: 0 0 0 0 rgba(148, 163, 184, 0); } }
    @keyframes bronze-halo { 0% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.6); } 70% { box-shadow: 0 0 0 8px rgba(217, 119, 6, 0); } 100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0); } }

    ::ng-deep .marker-pin-gold { background: linear-gradient(135deg, #fbbf24, #d97706)!important; border: 2px solid #fff5c5!important; animation: gold-halo 2.5s infinite!important; }
    ::ng-deep .marker-pin-silver { background: linear-gradient(135deg, #cbd5e1, #64748b)!important; border: 2px solid #f8fafc!important; animation: silver-halo 3s infinite!important; }
    ::ng-deep .marker-pin-bronze { background: linear-gradient(135deg, #f59e0b, #78350f)!important; border: 2px solid #fef3c7!important; animation: bronze-halo 3s infinite!important; }
    
    ::ng-deep .marker-pulse-gold { background: rgba(251, 191, 36, 0.3)!important; }
    ::ng-deep .marker-pulse-silver { background: rgba(148, 163, 184, 0.3)!important; }
    ::ng-deep .marker-pulse-bronze { background: rgba(217, 119, 6, 0.2)!important; }
  `]
})
export class ThermalBathsComponent implements OnInit, OnDestroy {
  @Input() hideTitle = false;
  @ViewChild('govChart') govChartRef!: ElementRef;
  @ViewChild('typeChart') typeChartRef!: ElementRef;

  baths: any[] = [];
  filteredBaths: any[] = [];
  avgTemp: number = 0;

  govChart: any;
  typeChart: any;

  isSuperAdmin = false;
  showModal = false;
  editingBathId: string | null = null;
  selectedSpring: any = null;
  map: any;
  markers: any[] = [];
  markerGroup: any;
  mapTimeout: any;
  chartsTimeout: any;
  bathModel: any = {
    name: '',
    location: '',
    temperature: '',
    indications: '',
    description: '',
    type: 'Station Thermale',
    trustScore: 85,
    rating: 4.2,
    imageUrl: '',
    latitude: 36.8,
    longitude: 10.1
  };

  public govCoords: { [key: string]: [number, number] } = {
    'Tunis': [36.8065, 10.1815], 'Ariana': [36.8625, 10.1956], 'Ben Arous': [36.7531, 10.2222], 'Manouba': [36.8078, 10.0864],
    'Nabeul': [36.4561, 10.7376], 'Zaghouan': [36.4029, 10.1429], 'Bizerte': [37.2744, 9.8739], 'Béja': [36.7333, 9.1833],
    'Jendouba': [36.5011, 8.7794], 'Kef': [36.1822, 8.7147], 'Siliana': [36.0841, 9.3708], 'Sousse': [35.8256, 10.6369],
    'Monastir': [35.778, 10.8262], 'Mahdia': [35.5047, 11.0622], 'Sfax': [34.7406, 10.7603], 'Kairouan': [35.6781, 10.0963],
    'Kasserine': [35.1676, 8.8319], 'Sidi Bouzid': [35.0382, 9.4849], 'Gabès': [33.8815, 10.0982], 'Medenine': [33.3549, 10.5053],
    'Tataouine': [32.9297, 10.4518], 'Gafsa': [34.425, 8.7842], 'Tozeur': [33.9197, 8.1336], 'Kebili': [33.7044, 8.969]
  };

  public api = inject(Api);
  public settings = inject(SettingsService);
  private auth = inject(AuthService);
  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  constructor() { }


  searchGoogleImages() {
    if (this.bathModel.name) {
      const query = encodeURIComponent('Source thermale ' + this.bathModel.name + ' Tunisie');
      window.open(`https://www.google.com/search?tbm=isch&q=${query}`, '_blank');
    }
  }

  public Object = Object;

  onLocationChange(event: any) {
    const gov = event.target.value;
    if (this.govCoords[gov]) {
      this.bathModel.latitude = this.govCoords[gov][0];
      this.bathModel.longitude = this.govCoords[gov][1];
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.adminService.uploadThermalBathImage(file).subscribe({
        next: (res: any) => {
          this.bathModel.imageUrl = res.imageUrl;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          alert('Erreur lors du téléchargement de l\'image: ' + (err.error?.msg || err.message));
        }
      });
    }
  }

  getBadgeClass(score: number): string {
    const s = score || 0;
    if (s >= 90) return 'otic-badge-gold';
    if (s >= 75) return 'otic-badge-silver';
    if (s >= 60) return 'otic-badge-bronze';
    return 'otic-badge-none';
  }

  getBadgeIcon(score: number): string {
    const s = score || 0;
    if (s >= 90) return 'bi-patch-check-fill';
    if (s >= 75) return 'bi-shield-check';
    if (s >= 60) return 'bi-award';
    return 'bi-x-circle';
  }

  getBadgeLabel(score: number): string {
    const s = score || 0;
    if (s >= 90) return 'Excellent (Or)';
    if (s >= 75) return 'Qualité (Argent)';
    if (s >= 60) return 'Standard (Bronze)';
    return 'Non Certifié';
  }

  getStarsArray(rating: number): string[] {
    const r = rating || 4.0;
    const stars: string[] = [];
    const fullStars = Math.floor(r);
    const hasHalf = r % 1 >= 0.4;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('bi-star-fill');
      } else if (i === fullStars && hasHalf) {
        stars.push('bi-star-half');
      } else {
        stars.push('bi-star');
      }
    }
    return stars;
  }
  showSuccess = false;
  successMessage = '';
  toastTitle = '';

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user: any) => {
      this.isSuperAdmin = user?.role === 'super_admin';
    });

    // Initialize map immediately for 'direct' access feeling
    setTimeout(() => this.initMap(), 0);
    this.refreshData();
  }

  translate(key: string, defaultVal: string): string {
    const val = this.settings.getTranslation(key);
    return val === key ? defaultVal : val;
  }

  refreshData(forceRefresh = true) {
    this.api.getThermalBaths(forceRefresh).subscribe({
      next: (data: any[]) => {
        this.baths = data;
        this.filteredBaths = [...this.baths];
        this.calculateStats();
        this.cdr.detectChanges();

        if (this.map) {
          this.updateMarkers();
        } else {
          this.initMap();
        }
        this.initCharts();
      },
      error: (err: any) => console.error('Error fetching thermal baths:', err)
    });
  }

  calculateStats() {
    if (this.baths.length === 0) return;
    let totalTemp = 0;
    let countTemp = 0;

    this.baths.forEach(b => {
      const t = parseFloat(b.temperature);
      if (!isNaN(t)) {
        totalTemp += t;
        countTemp++;
      }
    });

    this.avgTemp = countTemp > 0 ? totalTemp / countTemp : 0;
  }

  getCentresCount(): number {
    return this.baths.filter(b => b.type === 'Station Thermale' || b.type === 'Centre de Thalassothérapie').length;
  }

  onSearch(event: any) {
    const term = event.target.value.toLowerCase();
    this.filteredBaths = this.baths.filter(b =>
      b.name.toLowerCase().includes(term) ||
      b.location.toLowerCase().includes(term) ||
      b.type.toLowerCase().includes(term)
    );
  }

  initCharts() {
    if (this.baths.length === 0) return;
    this.initGovChart();
    this.initTypeChart();
  }

  initGovChart() {
    if (!this.govChartRef) return;
    const ctx = this.govChartRef.nativeElement.getContext('2d');

    const govCounts: any = {};
    this.baths.forEach(b => {
      govCounts[b.location] = (govCounts[b.location] || 0) + 1;
    });

    if (this.govChart) this.govChart.destroy();
    this.govChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(govCounts),
        datasets: [{
          data: Object.values(govCounts),
          backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true } }
        }
      }
    });
  }

  initTypeChart() {
    if (!this.typeChartRef) return;
    const ctx = this.typeChartRef.nativeElement.getContext('2d');

    const typeCounts: any = {
      'Station Thermale': 0,
      'Centre de Thalassothérapie': 0,
      'Hammam Thermal': 0
    };
    this.baths.forEach(b => {
      if (typeCounts[b.type] !== undefined) typeCounts[b.type]++;
    });

    if (this.typeChart) this.typeChart.destroy();
    this.typeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(typeCounts),
        datasets: [{
          data: Object.values(typeCounts),
          backgroundColor: ['#2563eb', '#0891b2', '#6366f1'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true } }
        },
        cutout: '65%'
      }
    });
  }

  // --- CRUD ---
  openAddModal() {
    this.editingBathId = null;
    this.bathModel = {
      name: '', location: '', temperature: '', indications: '', description: '',
      type: 'Station Thermale', trustScore: 85, rating: 4.2, imageUrl: '',
      latitude: 36.8, longitude: 10.1
    };
    this.showModal = true;
  }

  openEditModal(bath: any) {
    this.editingBathId = bath._id;
    this.bathModel = { ...bath };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmit() {
    const bathName = this.bathModel.name || 'la station';
    if (this.editingBathId) {
      this.adminService.updateThermalBath(this.editingBathId, this.bathModel).subscribe({
        next: () => {
          this.toastTitle = 'Mise à jour réussie';
          this.successMessage = `"${bathName}" a été modifiée avec succès.`;
          this.showSuccess = true;
          this.refreshData();
          this.closeModal();
          setTimeout(() => this.showSuccess = false, 5500);
        },
        error: (err: any) => alert('Erreur : ' + (err.error?.msg || err.message))
      });
    } else {
      this.adminService.createThermalBath(this.bathModel).subscribe({
        next: () => {
          this.toastTitle = 'Station enregistrée';
          this.successMessage = `"${bathName}" a bien été ajoutée à la base de données.`;
          this.showSuccess = true;
          this.refreshData();
          this.closeModal();
          setTimeout(() => this.showSuccess = false, 5500);
        },
        error: (err: any) => alert('Erreur : ' + (err.error?.msg || err.message))
      });
    }
  }

  // --- Map ---
  initMap() {
    if (this.map) return; // Don't re-initialize if already exists

    const mapEl = document.getElementById('thermal-map');
    if (!mapEl) return;

    this.map = L.map('thermal-map', {
      center: [34.5, 9.5],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(this.map);

    this.updateMarkers();

    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
  }

  updateMarkers() {
    if (!this.map) return;

    // Clear existing group if it exists
    if (this.markerGroup) {
      this.markerGroup.clearLayers();
    } else {
      this.markerGroup = L.featureGroup().addTo(this.map);
    }

    this.markers = [];

    // Custom Professional Marker Icon
    const createCustomIcon = (name: string, score: number) => {
      let markerClass = 'marker-pin shadow-lg';
      let pulseClass = 'marker-pulse';

      const s = score || 85;
      if (s >= 90) {
        markerClass += ' marker-pin-gold';
        pulseClass += ' marker-pulse-gold';
      } else if (s >= 75) {
        markerClass += ' marker-pin-silver';
        pulseClass += ' marker-pulse-silver';
      } else if (s >= 60) {
        markerClass += ' marker-pin-bronze';
        pulseClass += ' marker-pulse-bronze';
      }

      return L.divIcon({
        className: 'custom-pro-marker',
        html: `
            <div class="marker-pin-wrapper">
              <div class="${pulseClass}"></div>
              <div class="${markerClass}">
                <i class="bi bi-water"></i>
              </div>
              <div class="marker-label">${name}</div>
            </div>
          `,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });
    };

    // Add Markers from Data
    const coordUsage: { [key: string]: number } = {};

    this.baths.forEach(spring => {
      let lat = Number(spring.latitude);
      let lng = Number(spring.longitude);

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        // Slight offset for overlapping markers
        const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        if (coordUsage[coordKey]) {
          lat += (Math.random() - 0.5) * 0.01;
          lng += (Math.random() - 0.5) * 0.01;
        }
        coordUsage[coordKey] = (coordUsage[coordKey] || 0) + 1;

        const marker = L.marker([lat, lng], {
          icon: createCustomIcon(spring.name, spring.trustScore)
        });

        marker.on('click', () => {
          this.selectedSpring = spring;
          this.map.flyTo([spring.latitude, spring.longitude], 12, {
            duration: 1.5,
            easeLinearity: 0.25
          });
          this.cdr.detectChanges();
        });

        const badgeClass = this.getBadgeClass(spring.trustScore);
        const badgeIcon = this.getBadgeIcon(spring.trustScore);
        const badgeLabel = this.getBadgeLabel(spring.trustScore);

        marker.bindPopup(`
            <div class="pro-popup-card" style="box-shadow: 0 10px 25px rgba(0,0,0,0.3); border-radius: 12px; overflow: hidden;">
              <div class="pro-popup-img" style="background-image: url('${spring.imageUrl || 'logo.png'}'); height: 130px; background-size: cover; background-position: center; border-bottom: 3px solid #0284c7;"></div>
              <div class="pro-popup-header" style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 12px 15px;">
                  <div class="d-flex align-items-center mb-1">
                    <span class="otic-trust-badge ${badgeClass}" style="padding: 2px 8px; font-size: 0.65rem; border-radius: 50px;">
                      <i class="bi ${badgeIcon} me-1"></i> ${badgeLabel}
                    </span>
                  </div>
                  <h6 class="fw-bold m-0 text-white" style="font-size: 0.95rem; letter-spacing: 0.02em;">♨️ ${spring.name}</h6>
              </div>
              <div class="pro-popup-body" style="padding: 15px; background: #0f172a;">
                  <p style="color: #94a3b8; font-size: 0.82rem; line-height: 1.5; text-align: justify; margin-bottom: 12px;">
                    ${spring.description || 'Cette station thermale de renom propose des soins thermaux exceptionnels basés sur des eaux minérales naturelles chaudes.'}
                  </p>
                  <div class="d-flex justify-content-between align-items-center mt-2 pt-2" style="border-top: 1px solid rgba(255,255,255,0.08);">
                      <span class="text-warning fw-bold small"><i class="bi bi-thermometer-half"></i> ${spring.temperature}°C</span>
                      <span style="color: #38bdf8; font-size: 0.76rem;"><i class="bi bi-geo-alt-fill"></i> ${spring.location}</span>
                  </div>
              </div>
            </div>
          `, {
          closeButton: false,
          className: 'pro-leaflet-popup'
        });

        marker.addTo(this.markerGroup);
        this.markers.push(marker);
      }
    });

    console.log(`📍 Updated map with ${this.markers.length} markers.`);

    if (this.markers.length > 0) {
      this.map.fitBounds(this.markerGroup.getBounds(), { padding: [80, 80] });
    }
  }

  encode(str: string): string {
    return encodeURIComponent('Source thermale ' + str + ' Tunisie');
  }

  zoomIn() {
    if (this.map) this.map.zoomIn();
  }

  zoomOut() {
    if (this.map) this.map.zoomOut();
  }

  onDelete(id: string, name?: string) {
    const stationName = name || 'cette station';
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${stationName}" ?`)) {
      this.adminService.deleteThermalBath(id).subscribe({
        next: () => {
          this.toastTitle = 'Station supprimée';
          this.successMessage = `"${stationName}" a été supprimée avec succès.`;
          this.showSuccess = true;
          this.refreshData(true);
          setTimeout(() => this.showSuccess = false, 5000);
        },
        error: (err: any) => alert('Erreur: ' + (err.error?.msg || err.message))
      });
    }
  }

  ngOnDestroy(): void {
    if (this.govChart) this.govChart.destroy();
    if (this.typeChart) this.typeChart.destroy();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    if (this.mapTimeout) clearTimeout(this.mapTimeout);
    if (this.chartsTimeout) clearTimeout(this.chartsTimeout);
  }
}
