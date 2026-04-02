import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../../services/api';
import { SettingsService } from '../../../services/settings.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-mineral-waters',
  standalone: true,
  imports: [CommonModule],
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
          <span class="badge bg-info-subtle text-info px-3 py-2 rounded-pill border border-info-subtle">
            <i class="bi bi-calendar3 me-2"></i>Dernière mise à jour: Mars 2026
          </span>
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
                <th class="py-3 pe-4">{{ translate('notes', 'Notes') }}</th>
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
                <td class="pe-4">
                  <span class="badge py-2 px-3 rounded-pill note-badge shadow-sm" [ngClass]="getNoteClass(brand.notes)">
                    {{ brand.notes }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="filteredBrands.length === 0">
                <td colspan="5" class="text-center py-5">
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

  constructor(
    public api: Api,
    public settings: SettingsService
  ) {}

  ngOnInit(): void {
    this.api.getWaterBrands().subscribe({
      next: (data) => {
        this.brands = data;
        this.filteredBrands = [...this.brands];
        this.calculateBasicStats();
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
}
