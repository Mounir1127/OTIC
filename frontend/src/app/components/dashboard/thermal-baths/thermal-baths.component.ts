import { Component, OnInit, ViewChild, ElementRef, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../services/api';
import { SettingsService } from '../../../services/settings.service';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import { Chart, registerables } from 'chart.js';
import * as L from 'leaflet';

Chart.register(...registerables);

@Component({
  selector: 'app-thermal-baths',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid dashboard-fade-in" [ngClass]="hideTitle ? 'p-0' : 'p-4'" [dir]="settings.currentSettings.language === 'ar' ? 'rtl' : 'ltr'">
      <div class="row mb-4 align-items-center" *ngIf="!hideTitle">
        <div class="col-md-8">
          <h2 class="fw-bold text-gradient mb-1">
            <i class="bi bi-water text-primary me-2"></i>
            {{ settings.getTranslation('thermal_baths') }}
          </h2>
          <p class="text-muted mb-0">{{ translate('thermal_baths_subtitle', 'Découvrez les stations thermales et centres de thalassothérapie en Tunisie.') }}</p>
        </div>
        <div class="col-md-4 text-md-end mt-3 mt-md-0">
          <button *ngIf="isSuperAdmin" class="btn btn-add-bath rounded-pill px-4 py-2 me-3 shadow-lg" (click)="openAddModal()">
            <div class="d-flex align-items-center">
              <span class="icon-box me-2"><i class="bi bi-plus-lg"></i></span>
              <span class="fw-bold">Ajouter une station</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="stat-card p-3 rounded-4 shadow-sm border-0 h-100 bg-white">
            <div class="d-flex align-items-center mb-2">
              <div class="icon-circle bg-primary-subtle text-primary me-3">
                <i class="bi bi-geo-alt-fill"></i>
              </div>
              <h6 class="mb-0 text-muted small uppercase fw-semibold ls-1">TOTAL STATIONS</h6>
            </div>
            <h3 class="fw-bold mb-1 text-dark">{{ baths.length }}</h3>
            <div class="progress mt-2" style="height: 4px;">
              <div class="progress-bar bg-primary" [style.width]="'100%'"></div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card p-3 rounded-4 shadow-sm border-0 h-100 bg-white">
            <div class="d-flex align-items-center mb-2">
              <div class="icon-circle bg-success-subtle text-success me-3">
                <i class="bi bi-thermometer-half"></i>
              </div>
              <h6 class="mb-0 text-muted small uppercase fw-semibold ls-1">TEMPÉRATURE MOYENNE</h6>
            </div>
            <h3 class="fw-bold mb-1 text-dark">{{ avgTemp.toFixed(1) }}°C</h3>
            <p class="small text-muted mb-0">Eaux hyperthermales</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card p-3 rounded-4 shadow-sm border-0 h-100 bg-white">
            <div class="d-flex align-items-center mb-2">
              <div class="icon-circle bg-info-subtle text-info me-3">
                <i class="bi bi-hospital-fill"></i>
              </div>
              <h6 class="mb-0 text-muted small uppercase fw-semibold ls-1">CENTRES CURATIFS</h6>
            </div>
            <h3 class="fw-bold mb-1 text-dark">{{ getCentresCount() }}</h3>
            <p class="small text-muted mb-0">Stations médicalisées</p>
          </div>
      </div>

      <!-- Interactive Map Section -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card border-0 shadow-lg rounded-4 overflow-hidden map-card">
            <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 class="mb-0 fw-bold"><i class="bi bi-map-fill text-warning me-2"></i>Carte Interactive des Stations</h5>
              <span class="badge bg-light text-muted border px-3 py-1 rounded-pill">Vue Satellite</span>
            </div>
            <div class="card-body p-0 position-relative">
              <div id="thermal-map" style="height: 500px; width: 100%; z-index: 1;"></div>
              
              <!-- Custom Zoom Controls -->
              <div class="map-controls">
                <button class="control-btn" (click)="zoomIn()" title="Zoomer">
                    <i class="bi bi-plus-lg"></i>
                </button>
                <div class="control-divider"></div>
                <button class="control-btn" (click)="zoomOut()" title="Dézoomer">
                    <i class="bi bi-dash-lg"></i>
                </button>
              </div>

              <!-- Floating Insights Panel (Integrated from test map project) -->
              <div class="map-overlay-panel" *ngIf="selectedSpring">
                <div class="panel-glass p-3 rounded-4 shadow-lg border border-white border-opacity-10">
                  <button class="btn-close btn-close-white float-end" (click)="selectedSpring = null"></button>
                  <div class="spring-img-container mb-3">
                    <img [src]="selectedSpring.imageUrl || 'logo.png'" class="img-fluid rounded-3 shadow-sm">
                  </div>
                  <h6 class="text-warning fw-bold mb-1">♨️ {{ selectedSpring.name }}</h6>
                  <p class="small text-white-50 mb-3">{{ selectedSpring.location }} ({{ selectedSpring.latitude }}, {{ selectedSpring.longitude }})</p>
                  <div class="stat-row-mini mb-3">
                    <div class="mini-stat">
                        <span class="label">TEMP.</span>
                        <span class="value">{{ selectedSpring.temperature }}°C</span>
                    </div>
                    <div class="mini-stat">
                        <span class="label">TYPE</span>
                        <span class="value">{{ selectedSpring.type }}</span>
                    </div>
                  </div>
                  <p class="small text-light opacity-75 mb-3">{{ selectedSpring.description }}</p>
                  <a [href]="'https://www.google.com/search?tbm=isch&q=' + encode(selectedSpring.name)" target="_blank" class="btn btn-sm btn-light w-100 rounded-pill fw-bold">
                    Voir plus d'images
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="row g-4 mb-4" *ngIf="baths.length > 0">
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-header bg-white border-0 py-3">
              <h5 class="mb-0 fw-bold">Répartition par Gouvernorat</h5>
            </div>
            <div class="card-body d-flex align-items-center justify-content-center p-4">
              <div style="height: 250px; width: 100%;">
                <canvas #govChart></canvas>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-header bg-white border-0 py-3">
              <h5 class="mb-0 fw-bold">Types d'Établissements</h5>
            </div>
            <div class="card-body p-4">
              <div style="height: 250px; width: 100%;">
                <canvas #typeChart></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div class="card-header bg-white py-3 border-0">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <h5 class="mb-3 mb-md-0 fw-bold text-dark">Liste des stations thermales</h5>
            <div class="search-box position-relative">
              <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              <input type="text" class="form-control ps-5 rounded-pill border-light-subtle bg-light-subtle" 
                     placeholder="Filtrer par nom, lieu ou type..."
                     (input)="onSearch($event)">
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 custom-table">
            <thead class="bg-light">
              <tr>
                <th class="ps-4 py-3">Station</th>
                <th class="py-3">Localisation</th>
                <th class="py-3">Type</th>
                <th class="py-3">Temp. (°C)</th>
                <th class="py-3">Indications Thérapeutiques</th>
                <th class="py-3 pe-4 text-end" *ngIf="isSuperAdmin">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bath of filteredBaths" class="bath-row">
                <td class="ps-4 fw-medium text-dark">
                  <div class="d-flex align-items-center">
                    <div class="bath-avatar me-3 text-white bg-primary shadow-sm" style="background: linear-gradient(135deg, #3b82f6, #06b6d4) !important;">
                      {{ bath.name.charAt(0) }}
                    </div>
                    {{ bath.name }}
                  </div>
                </td>
                <td><i class="bi bi-geo-alt text-danger me-1"></i> {{ bath.location }}</td>
                <td><span class="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 rounded-pill">{{ bath.type }}</span></td>
                <td><span class="badge bg-light text-dark border px-3 py-2 rounded-pill font-monospace fw-normal">{{ bath.temperature || 'N/A' }}</span></td>
                <td><small class="text-muted">{{ bath.indications || '-' }}</small></td>
                <td class="pe-4 text-end" *ngIf="isSuperAdmin">
                  <div class="btn-group shadow-sm rounded-pill overflow-hidden">
                    <button class="btn btn-sm btn-outline-primary border-0 px-3" (click)="openEditModal(bath)" title="Modifier">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger border-0 px-3" (click)="onDelete(bath._id)" title="Supprimer">
                      <i class="bi bi-trash-fill"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredBaths.length === 0">
                <td [attr.colspan]="isSuperAdmin ? 6 : 5" class="text-center py-5">
                  <div class="py-4">
                    <i class="bi bi-slash-circle fs-1 text-muted opacity-25 mb-3 d-block"></i>
                    <p class="text-muted">Aucune station ne correspond à votre recherche.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div class="custom-modal-backdrop" *ngIf="showModal" (click)="closeModal()"></div>
      <div class="custom-modal" *ngIf="showModal">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
            <div class="modal-header bg-gradient-primary text-white py-3">
              <h5 class="modal-title fw-bold">
                <i class="bi" [ngClass]="editingBathId ? 'bi-pencil-square' : 'bi-plus-lg'"></i>
                {{ editingBathId ? 'Modifier la station' : 'Ajouter une nouvelle station' }}
              </h5>
              <button type="button" class="btn-close btn-close-white" (click)="closeModal()"></button>
            </div>
            <div class="modal-body p-4 bg-light-subtle">
              <form #bathForm="ngForm">
                <div class="row g-4">
                  <div class="col-12">
                    <label class="form-label text-muted small fw-bold uppercase ls-1 mb-2">NOM DE LA STATION</label>
                    <div class="input-group custom-input-group shadow-sm">
                      <span class="input-group-text bg-white border-end-0"><i class="bi bi-water text-primary"></i></span>
                      <input type="text" class="form-control border-start-0 ps-0" name="name" [(ngModel)]="bathModel.name" required placeholder="Ex: Hammam Mellegue">
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-bold uppercase ls-1 mb-2">LOCALISATION (VILLE)</label>
                    <div class="input-group custom-input-group shadow-sm">
                      <span class="input-group-text bg-white border-end-0"><i class="bi bi-geo-alt text-danger"></i></span>
                      <input type="text" class="form-control border-start-0 ps-0" name="location" [(ngModel)]="bathModel.location" required placeholder="Ex: Kef">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-bold uppercase ls-1 mb-2">TEMPÉRATURE (°C)</label>
                    <div class="input-group custom-input-group shadow-sm">
                      <span class="input-group-text bg-white border-end-0"><i class="bi bi-thermometer-high text-warning"></i></span>
                      <input type="text" class="form-control border-start-0 ps-0" name="temperature" [(ngModel)]="bathModel.temperature" placeholder="Ex: 65">
                    </div>
                  </div>

                  <div class="col-12">
                    <label class="form-label text-muted small fw-bold uppercase ls-1 mb-2">TYPE D'ÉTABLISSEMENT</label>
                    <select class="form-select custom-input-group shadow-sm p-2 border-0" name="type" [(ngModel)]="bathModel.type">
                      <option value="Station Thermale">Station Thermale</option>
                      <option value="Centre de Thalassothérapie">Centre de Thalassothérapie</option>
                      <option value="Hammam Thermal">Hammam Thermal</option>
                    </select>
                  </div>

                  <div class="col-12">
                    <label class="form-label text-muted small fw-bold uppercase ls-1 mb-2">INDICATIONS THÉRAPEUTIQUES</label>
                    <textarea class="form-control custom-input-group shadow-sm border-0 p-3" rows="2" name="indications" [(ngModel)]="bathModel.indications" placeholder="Rhumatologie, Dermatologie..."></textarea>
                  </div>

                  <div class="col-12">
                    <label class="form-label text-muted small fw-bold uppercase ls-1 mb-2">DESCRIPTION</label>
                    <textarea class="form-control custom-input-group shadow-sm border-0 p-3" rows="2" name="description" [(ngModel)]="bathModel.description" placeholder="Courte description..."></textarea>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer border-0 p-4 bg-white">
              <button type="button" class="btn btn-light-soft rounded-pill px-4 fw-semibold" (click)="closeModal()">Annuler</button>
              <button type="button" class="btn btn-primary-gradient rounded-pill px-5 shadow animate-pulse-slow" 
                      [disabled]="!bathModel.name || !bathModel.location" (click)="onSubmit()">
                {{ editingBathId ? 'Mettre à jour' : 'Enregistrer la station' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-gradient {
      background: linear-gradient(90deg, #1e40af, #0891b2);
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

    .bath-avatar {
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

    .bath-row:hover { background-color: #f1f5f9; }

    .search-box input {
      width: 320px;
      border: 1px solid #e2e8f0;
    }
    .search-box input:focus {
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      border-color: #3b82f6;
    }

    .dashboard-fade-in { animation: fadeIn 0.5s ease-out; }

    .btn-add-bath {
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      color: white;
      border: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .btn-add-bath:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4) !important;
      color: white;
    }
    .btn-add-bath .icon-box {
      background: rgba(255, 255, 255, 0.2);
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }

    .bg-gradient-primary { background: linear-gradient(135deg, #0f172a, #1e293b); }

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
      max-width: 600px;
      z-index: 1060;
      animation: modalScaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .custom-input-group {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
    }
    .custom-input-group:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
    }

    .btn-primary-gradient {
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      color: white;
      border: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .btn-primary-gradient:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px -6px rgba(59, 130, 246, 0.5);
      color: white;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes modalScaleUp {
      from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    /* Professional Pro Markers */
    ::ng-deep .custom-pro-marker { background: none; border: none; }
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

    /* Professional Popups */
    ::ng-deep .pro-leaflet-popup .leaflet-popup-content-wrapper {
      background: #0f172a;
      border-radius: 16px;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255,255,255,0.1);
    }
    ::ng-deep .pro-leaflet-popup .leaflet-popup-content { margin: 0; width: 260px !important; }
    ::ng-deep .pro-leaflet-popup .leaflet-popup-tip { background: #0f172a; }
    
    .pro-popup-card { display: flex; flex-direction: column; min-width: 260px; }
    .pro-popup-img {
      height: 120px;
      width: 100%;
      background-size: cover;
      background-position: center;
      border-bottom: 2px solid #fbbf24;
    }
    .pro-popup-header { background: linear-gradient(135deg, #1e293b, #0f172a); padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .pro-popup-body { padding: 15px; background: #0f172a; }

    .map-card { 
      background: #ffffff !important; 
      border: 1px solid #e2e8f0 !important;
      transition: all 0.3s ease;
    }
    .map-card .card-header { 
      background: #ffffff !important; 
      border-bottom: 1px solid #f1f5f9 !important;
      color: #1e293b !important; 
    }

    .map-overlay-panel {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 320px;
      z-index: 1000;
      animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .panel-glass {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
      color: #1e293b;
    }
    .spring-img-container img {
      height: 150px;
      width: 100%;
      object-fit: cover;
      border-radius: 12px;
    }
    .stat-row-mini { display: flex; gap: 10px; }
    .mini-stat {
      background: #f8fafc;
      padding: 10px;
      flex: 1;
      border-radius: 10px;
      text-align: center;
      border: 1px solid #f1f5f9;
    }
    .mini-stat .label { display: block; font-size: 0.6rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .mini-stat .value { font-weight: 700; color: #0f172a; font-size: 1rem; }

    @keyframes slideInRight {
      from { transform: translateX(30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    /* Custom Zoom Controls Style */
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
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 1px solid rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .control-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      color: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .control-btn:hover {
      background: #f8fafc;
      color: #3b82f6;
    }
    .control-btn:active {
        transform: scale(0.95);
    }
    .control-divider {
      height: 1px;
      background: rgba(0,0,0,0.05);
      margin: 0 8px;
    }
  `]
})
export class ThermalBathsComponent implements OnInit {
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
  bathModel: any = {
    name: '',
    location: '',
    temperature: '',
    indications: '',
    description: '',
    type: 'Station Thermale'
  };

  constructor(
    public api: Api,
    public settings: SettingsService,
    private auth: AuthService,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => {
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

  refreshData() {
    // Use cache if available for 'instant' display, then update in background
    this.api.getThermalBaths(false).subscribe({
      next: (data) => {
        this.baths = data;
        this.filteredBaths = [...this.baths];
        this.calculateStats();
        this.cdr.detectChanges();
        
        // Update markers without re-initializing the whole map if it exists
        if (this.map) {
          this.updateMarkers();
        } else {
          this.initMap();
        }
        this.initCharts();
      },
      error: (err) => console.error('Error fetching thermal baths:', err)
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
    this.bathModel = { name: '', location: '', temperature: '', indications: '', description: '', type: 'Station Thermale' };
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
    if (this.editingBathId) {
      this.adminService.updateThermalBath(this.editingBathId, this.bathModel).subscribe({
        next: () => { this.refreshData(); this.closeModal(); },
        error: (err) => alert('Erreur: ' + (err.error?.msg || err.message))
      });
    } else {
      this.adminService.createThermalBath(this.bathModel).subscribe({
        next: () => { this.refreshData(); this.closeModal(); },
        error: (err) => alert('Erreur: ' + (err.error?.msg || err.message))
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

    // Clear existing markers if any
    this.markers.forEach(m => m.remove());
    this.markers = [];

    const markerGroup = L.featureGroup();

    // Custom Professional Marker Icon
    const createCustomIcon = (name: string) => {
      return L.divIcon({
        className: 'custom-pro-marker',
        html: `
          <div class="marker-pin-wrapper">
            <div class="marker-pulse"></div>
            <div class="marker-pin shadow-lg">
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
    this.baths.forEach(spring => {
      if (spring.latitude && spring.longitude) {
        const marker = L.marker([spring.latitude, spring.longitude], {
          icon: createCustomIcon(spring.name)
        });

        marker.on('click', () => {
          this.selectedSpring = spring;
          this.map.flyTo([spring.latitude, spring.longitude], 12, {
              duration: 1.5,
              easeLinearity: 0.25
          });
          this.cdr.detectChanges();
        });

        marker.bindPopup(`
          <div class="pro-popup-card">
            <div class="pro-popup-img" style="background-image: url('${spring.imageUrl || 'logo.png'}')"></div>
            <div class="pro-popup-header">
                <span class="badge bg-warning text-dark mb-1">STATION THERMALE</span>
                <h6 class="fw-bold m-0 text-white">${spring.name}</h6>
            </div>
            <div class="pro-popup-body">
                <p class="small text-light-emphasis mb-2">${spring.description || 'Station thermale de renom'}</p>
                <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-secondary border-opacity-25">
                    <span class="text-warning fw-bold small"><i class="bi bi-thermometer-half"></i> ${spring.temperature}°C</span>
                    <span class="text-info small"><i class="bi bi-geo-alt-fill"></i> ${spring.location}</span>
                </div>
            </div>
          </div>
        `, {
          closeButton: false,
          className: 'pro-leaflet-popup'
        });

        marker.addTo(markerGroup);
        this.markers.push(marker);
      }
    });

    markerGroup.addTo(this.map);

    if (this.markers.length > 0) {
      this.map.fitBounds(markerGroup.getBounds(), { padding: [80, 80] });
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

  onDelete(id: string) {
    if (confirm('Supprimer cette station ?')) {
      this.adminService.deleteThermalBath(id).subscribe({
        next: () => this.refreshData(),
        error: (err) => alert('Erreur: ' + (err.error?.msg || err.message))
      });
    }
  }
}
