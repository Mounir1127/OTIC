import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
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
              <div class="icon-circle bg-success-subtle text-success me-3">
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
              <div class="icon-circle bg-warning-subtle text-warning me-3">
                <i class="bi bi-activity"></i>
              </div>
              <h6 class="mb-0 text-muted small uppercase fw-semibold ls-1">pH MOYEN</h6>
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
                    <div class="brand-avatar me-3 text-white" [ngClass]="getNoteClass(brand.notes, 'bg-only')">
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

      <!-- Add/Edit Modal -->
      <div class="custom-modal-backdrop" *ngIf="showModal" (click)="closeModal()"></div>
      <div class="custom-modal" *ngIf="showModal">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
            <div class="modal-header bg-gradient-primary text-white py-3">
              <h5 class="modal-title fw-bold">
                <i class="bi" [ngClass]="editingBrandId ? 'bi-pencil-square' : 'bi-plus-lg'"></i>
                {{ editingBrandId ? 'Modifier la marque' : 'Ajouter une nouvelle marque' }}
              </h5>
              <button type="button" class="btn-close btn-close-white" (click)="closeModal()"></button>
            </div>
            <div class="modal-body p-4 bg-light-subtle">
              <form #brandForm="ngForm">
                <div class="row g-4">
                  <!-- Name Input -->
                  <div class="col-12">
                    <label class="form-label text-muted small fw-bold uppercase ls-1 mb-2">IDENTITÉ DE LA MARQUE</label>
                    <div class="input-group custom-input-group shadow-sm">
                      <span class="input-group-text bg-white border-end-0"><i class="bi bi-tag text-primary"></i></span>
                      <input type="text" class="form-control border-start-0 ps-0" name="marque" [(ngModel)]="brandModel.marque" required placeholder="Nom de la marque (ex: Sabi)">
                    </div>
                  </div>

                  <!-- TDS & pH -->
                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-bold uppercase ls-1 mb-2">TDS (mg/L)</label>
                    <div class="input-group custom-input-group shadow-sm">
                      <span class="input-group-text bg-white border-end-0"><i class="bi bi-moisture text-info"></i></span>
                      <input type="text" class="form-control border-start-0 ps-0" name="tds" [(ngModel)]="brandModel.tds" placeholder="Valeur TDS">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-muted small fw-bold uppercase ls-1 mb-2">POTENTIEL pH</label>
                    <div class="input-group custom-input-group shadow-sm">
                      <span class="input-group-text bg-white border-end-0"><i class="bi bi-activity text-warning"></i></span>
                      <input type="text" class="form-control border-start-0 ps-0" name="ph" [(ngModel)]="brandModel.ph" placeholder="Valeur pH">
                    </div>
                  </div>

                  <!-- Nitrates -->
                  <div class="col-12">
                    <label class="form-label text-muted small fw-bold uppercase ls-1 mb-2">NITRATES (NO₃⁻)</label>
                    <div class="input-group custom-input-group shadow-sm">
                      <span class="input-group-text bg-white border-end-0"><i class="bi bi-virus text-danger"></i></span>
                      <input type="text" class="form-control border-start-0 ps-0" name="nitrates" [(ngModel)]="brandModel.nitrates" placeholder="Taux de nitrates">
                    </div>
                  </div>

                  <!-- Quality Selection -->
                  <div class="col-12">
                    <label class="form-label text-muted small fw-bold uppercase ls-1 mb-2">INDICE DE QUALITÉ</label>
                    <div class="quality-selector d-flex gap-2">
                       <div *ngFor="let opt of ['Excellent', 'Bien', 'Passable', 'Inacceptable']" 
                            (click)="brandModel.notes = opt"
                            [class.active]="brandModel.notes === opt"
                            class="quality-option flex-grow-1 text-center p-2 rounded-3 cursor-pointer transition"
                            [ngClass]="getNoteClass(opt)">
                         {{ opt }}
                       </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer border-0 p-4 bg-white">
              <button type="button" class="btn btn-light-soft rounded-pill px-4 fw-semibold" (click)="closeModal()">Annuler</button>
              <button type="button" class="btn btn-primary-gradient rounded-pill px-5 shadow animate-pulse-slow" 
                      [disabled]="!brandModel.marque" (click)="onSubmit()">
                {{ editingBrandId ? 'Mettre à jour' : 'Enregistrer la marque' }}
              </button>
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

    .bg-excellent { background-color: #dcfce7 !important; color: #15803d !important; border: 1px solid #bbf7d0; }
    .bg-bien { background-color: #f0fdf4 !important; color: #166534 !important; border: 1px solid #dcfce7; }
    .bg-passable { background-color: #fef9c3 !important; color: #854d0e !important; border: 1px solid #fef08a; }
    .bg-inacceptable { background-color: #fee2e2 !important; color: #b91c1c !important; border: 1px solid #fecaca; }

    .bg-only-excellent { background-color: #22c55e; }
    .bg-only-bien { background-color: #10b981; }
    .bg-only-passable { background-color: #f59e0b; }
    .bg-only-inacceptable { background-color: #ef4444; }

    .nitrate-normal { background-color: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
    .nitrate-high { background-color: #fff1f2; color: #be123c; border: 1px solid #fecaca; }

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

    .bg-gradient-primary {
      background: linear-gradient(135deg, #1e293b, #334155);
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

    .custom-input-group {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
    }
    .custom-input-group:focus-within {
      border-color: #0ea5e9;
      box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1) !important;
    }
    .custom-input-group .input-group-text {
      border: none;
      padding-left: 1.25rem;
    }
    .custom-input-group input {
      border: none;
      padding: 0.75rem 1rem;
      font-weight: 500;
    }
    .custom-input-group input:focus {
      box-shadow: none;
    }

    .quality-option {
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      opacity: 0.6;
      border: 2px solid transparent !important;
    }
    .quality-option:hover { opacity: 0.9; }
    .quality-option.active {
      opacity: 1;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-color: rgba(255,255,255,0.3) !important;
    }

    .btn-primary-gradient {
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white;
      border: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .btn-primary-gradient:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px -6px rgba(124, 58, 237, 0.5);
      color: white;
    }
    .btn-primary-gradient:disabled {
      background: #cbd5e1;
      transform: none;
      box-shadow: none;
    }

    .btn-light-soft {
      background: #f1f5f9;
      color: #64748b;
      border: none;
    }
    .btn-light-soft:hover { background: #e2e8f0; color: #475569; }

    .animate-pulse-slow {
      animation: pulse-slow 3s infinite;
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
  `]
})
export class MineralWatersComponent implements OnInit, AfterViewInit {
  @Input() hideTitle = false;
  @ViewChild('qualityChart') qualityChartRef!: ElementRef;
  @ViewChild('phChart') phChartRef!: ElementRef;

  brands: any[] = [];
  filteredBrands: any[] = [];
  avgTDS: number = 0;
  avgPH: number = 0;
  
  qualityChart: any;
  phChart: any;

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

  constructor(
    public api: Api,
    public settings: SettingsService,
    private auth: AuthService,
    private adminService: AdminService
  ) {}

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

  ngAfterViewInit(): void {}

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
        },
        error: (err) => alert('Erreur lors de la modification: ' + (err.error?.msg || err.message))
      });
    } else {
      this.adminService.createWaterBrand(this.brandModel).subscribe({
        next: () => {
          this.refreshData();
          this.closeModal();
        },
        error: (err) => alert('Erreur lors de l\'ajout: ' + (err.error?.msg || err.message))
      });
    }
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
}
