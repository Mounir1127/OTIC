import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { LocationService } from '../../../../services/location.service';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import * as L from 'leaflet';

Chart.register(...registerables);

@Component({
    selector: 'app-stats',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('categoryChart') categoryChartRef!: ElementRef;
    @ViewChild('statusChart') statusChartRef!: ElementRef;
    @ViewChild('processingChart') processingChartRef!: ElementRef;
    @ViewChild('dashboardContent') dashboardContent!: ElementRef;
    @ViewChild('exportSection') exportSection!: ElementRef;

    map: any;
    markers: any[] = [];

    // Coordonnées géographiques approximatives du centre de chaque gouvernorat tunisien
    governorateCoords: { [key: string]: { lat: number; lng: number } } = {
        'Ariana': { lat: 36.8624, lng: 10.1955 },
        'Béja': { lat: 36.7256, lng: 9.1817 },
        'Ben Arous': { lat: 36.7531, lng: 10.2222 },
        'Bizerte': { lat: 37.2744, lng: 9.8739 },
        'Gabès': { lat: 33.8814, lng: 10.0982 },
        'Gafsa': { lat: 34.4250, lng: 8.7842 },
        'Jendouba': { lat: 36.5011, lng: 8.7802 },
        'Kairouan': { lat: 35.6781, lng: 10.0963 },
        'Kasserine': { lat: 35.1675, lng: 8.8308 },
        'Kébili': { lat: 33.7043, lng: 8.9690 },
        'Le Kef': { lat: 36.1822, lng: 8.7148 },
        'Mahdia': { lat: 35.5039, lng: 11.0450 },
        'Manouba': { lat: 36.8078, lng: 10.0863 },
        'Médenine': { lat: 33.3549, lng: 10.4933 },
        'Monastir': { lat: 35.7833, lng: 10.8333 },
        'Nabeul': { lat: 36.4561, lng: 10.7376 },
        'Sfax': { lat: 34.7400, lng: 10.7600 },
        'Sidi Bouzid': { lat: 35.0382, lng: 9.4849 },
        'Siliana': { lat: 36.0840, lng: 9.3708 },
        'Sousse': { lat: 35.8256, lng: 10.6369 },
        'Tataouine': { lat: 32.9297, lng: 10.4518 },
        'Tozeur': { lat: 33.9197, lng: 8.1336 },
        'Tunis': { lat: 36.8065, lng: 10.1815 },
        'Zaghouan': { lat: 36.4029, lng: 10.1429 }
    };

    stats: any = {
        volumeByCategory: [],
        statusDistribution: [],
        averageProcessingTime: 0,
        resolutionRate: 0,
        avgProcessingPerCategory: [],
        totalCount: 0
    };

    filters: any = {
        startDate: '',
        endDate: '',
        region: '',
        consumerType: ''
    };

    regions: any[] = [];
    loading: boolean = true;
    chartCategory: any;
    chartStatus: any;
    chartProcessing: any;

    constructor(
        private adminService: AdminService,
        private locationService: LocationService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadRegions();
        
        // Load from cache for "direct" feel
        const cached = localStorage.getItem('otic_admin_full_stats');
        if (cached) {
            try {
                this.stats = JSON.parse(cached);
                this.loading = false;
                // We'll update charts in afterViewInit if we have data
            } catch (e) { }
        }
        
        this.loadStats();
    }

    ngAfterViewInit(): void {
        // If we loaded from cache, render charts immediately
        if (!this.loading && this.stats.totalCount > 0) {
            setTimeout(() => this.updateCharts(), 100);
        }
    }

    loadRegions(): void {
        this.locationService.getGovernorates().subscribe({
            next: (data) => {
                this.regions = data;
            },
            error: (err) => console.error('Error loading regions', err)
        });
    }

    loadStats(): void {
        // Only show loading if we don't have cached data
        if (!this.stats || this.stats.totalCount === 0) {
            this.loading = true;
        }
        
        this.adminService.getStats(this.filters).subscribe({
            next: (data) => {
                this.stats = data;
                this.loading = false;

                // Save to cache
                localStorage.setItem('otic_admin_full_stats', JSON.stringify(data));

                // Force change detection so *ngIf="!loading" is evaluated and canvas elements are created
                this.cdr.detectChanges();

                // Now charts can be updated safely
                this.updateCharts();
            },
            error: (err) => {
                console.error('Error loading stats', err);
                this.loading = false;
            }
        });
    }

    applyFilters(): void {
        this.loadStats();
    }

    resetFilters(): void {
        this.filters = {
            startDate: '',
            endDate: '',
            region: '',
            consumerType: ''
        };
        this.loadStats();
    }

    updateCharts(): void {
        if (!this.categoryChartRef || !this.statusChartRef || !this.processingChartRef) {
            console.warn('Chart elements not found yet, retrying...');
            setTimeout(() => this.updateCharts(), 50);
            return;
        }
        this.destroyCharts();
        this.createCategoryChart();
        this.createStatusChart();
        this.createProcessingChart();

        // Initialisation et mise à jour de la cartographie
        setTimeout(() => {
            this.initMap();
            this.updateMapMarkers();
        }, 150);
    }

    destroyCharts(): void {
        if (this.chartCategory) this.chartCategory.destroy();
        if (this.chartStatus) this.chartStatus.destroy();
        if (this.chartProcessing) this.chartProcessing.destroy();
    }

    createCategoryChart(): void {
        const ctx = this.categoryChartRef.nativeElement.getContext('2d');
        const data = this.stats.volumeByCategory;

        this.chartCategory = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map((d: any) => d.name),
                datasets: [{
                    label: 'Volume par catégorie',
                    data: data.map((d: any) => d.value),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    createStatusChart(): void {
        const ctx = this.statusChartRef.nativeElement.getContext('2d');
        const data = this.stats.statusDistribution;

        this.chartStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map((d: any) => this.formatStatus(d.name)),
                datasets: [{
                    data: data.map((d: any) => d.value),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(14, 165, 233, 0.6)',
                        'rgba(139, 92, 246, 0.6)',
                        'rgba(16, 185, 129, 0.6)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    createProcessingChart(): void {
        const ctx = this.processingChartRef.nativeElement.getContext('2d');
        const data = this.stats.avgProcessingPerCategory || [];

        this.chartProcessing = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map((d: any) => d.name),
                datasets: [{
                    label: 'Délai moyen (jours)',
                    data: data.map((d: any) => d.value),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y', // Horizontal bars for better readability of sector names
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { beginAtZero: true, title: { display: true, text: 'Jours' } }
                }
            }
        });
    }

    formatStatus(status: string): string {
        const labels: any = {
            'deposee': 'Déposée',
            'en_attente': 'En attente',
            'en_cours': 'En cours',
            'affectee_conventionne': 'Affectée',
            'traitee': 'Traitée',
            'resolue': 'Résolue',
            'rejete': 'Rejetée',
            'demande_complement': 'Complément dossier',
            'fermee': 'Fermée'
        };
        return labels[status] || (status ? status.replace('_', ' ') : '-');
    }

    exportPDF(): void {
        const data = this.exportSection.nativeElement;
        html2canvas(data, { scale: 2 }).then(canvas => {
            const imgWidth = 208;
            const pageHeight = 295;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            const contentDataURL = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const position = 0;
            pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
            pdf.save('Tableau-Bord-OTIC.pdf');
        });
    }

    exportExcel(): void {
        const wb = XLSX.utils.book_new();

        // 1. Summary Metrics
        const summaryData = [
            { "Indicateur": "Total Réclamations", "Valeur": this.stats.totalCount },
            { "Indicateur": "Taux de Résolution", "Valeur": `${this.stats.resolutionRate}%` },
            { "Indicateur": "Délai moyen de traitement", "Valeur": `${this.stats.averageProcessingTime} jours` },
            { "Indicateur": "Région filtrée", "Valeur": this.filters.region || "National" },
            { "Indicateur": "Période", "Valeur": `${this.filters.startDate || 'Debut'} - ${this.filters.endDate || 'Fin'}` }
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé");

        // 2. Categories Data
        const categoryData = this.stats.volumeByCategory.map((d: any) => ({
            "Secteur / Catégorie": d.name,
            "Nombre de Réclamations": d.value
        }));
        const wsCat = XLSX.utils.json_to_sheet(categoryData);
        XLSX.utils.book_append_sheet(wb, wsCat, "Volume par Catégorie");

        // 3. Status Data
        const statusData = this.stats.statusDistribution.map((d: any) => ({
            "Statut": this.formatStatus(d.name),
            "Nombre": d.value
        }));
        const wsStatus = XLSX.utils.json_to_sheet(statusData);
        XLSX.utils.book_append_sheet(wb, wsStatus, "Répartition Statuts");

        // 4. Raw Data (Full List of Reclamations)
        if (this.stats.reclamations && this.stats.reclamations.length > 0) {
            const rawData = this.stats.reclamations.map((r: any) => ({
                "Code Suivi": r.trackingCode || "-",
                "Date": new Date(r.dateCreation).toLocaleDateString(),
                "Utilisateur": r.user ? `${r.user.prenom} ${r.user.nom}` : "Anonyme",
                "Email": r.user?.email || "-",
                "Type": r.type || "-",
                "Secteur": r.secteur || "-",
                "Gouvernorat": r.gouvernorat || "-",
                "Statut": this.formatStatus(r.statut),
                "Description": r.description || "-",
                "Consommateur": r.complainantType || "particulier",
                "Date Résolution": r.dateResolution ? new Date(r.dateResolution).toLocaleDateString() : "-"
            }));
            const wsRaw = XLSX.utils.json_to_sheet(rawData);
            XLSX.utils.book_append_sheet(wb, wsRaw, "Détails des Réclamations");
        }

        // Write and Save
        XLSX.writeFile(wb, `Statistiques_OTIC_Complet_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    // ==========================================
    // LEAFLET MAP LOGIC
    // ==========================================
    initMap(): void {
        if (this.map) {
            setTimeout(() => this.map.invalidateSize(), 50);
            return;
        }

        const mapEl = document.getElementById('admin-geo-map');
        if (!mapEl) {
            console.warn('Map container element #admin-geo-map not found.');
            return;
        }

        // Initialiser la carte sur la Tunisie
        this.map = L.map('admin-geo-map', {
            center: [34.0, 9.5],
            zoom: 6.2,
            zoomControl: true,
            scrollWheelZoom: false,
            attributionControl: true
        });

        // Fond de carte premium Voyager
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors © CARTO'
        }).addTo(this.map);

        setTimeout(() => this.map.invalidateSize(), 150);
    }

    updateMapMarkers(): void {
        if (!this.map) return;

        // Effacer les anciens marqueurs
        this.markers.forEach(m => m.remove());
        this.markers = [];

        const reclamations = this.stats.reclamations || [];
        if (reclamations.length === 0) return;

        // Agréger les réclamations par gouvernorat
        const govData: { [key: string]: { count: number; service: number; produit: number } } = {};

        reclamations.forEach((r: any) => {
            const govName = r.gouvernorat;
            if (!govName) return;

            const normalizedGovName = this.normalizeGovName(govName);
            if (!this.governorateCoords[normalizedGovName]) return;

            if (!govData[normalizedGovName]) {
                govData[normalizedGovName] = { count: 0, service: 0, produit: 0 };
            }

            govData[normalizedGovName].count++;
            if (r.type === 'Service') {
                govData[normalizedGovName].service++;
            } else if (r.type === 'Produit') {
                govData[normalizedGovName].produit++;
            }
        });

        // Dessiner les marqueurs de réclamations
        Object.keys(govData).forEach(govName => {
            const data = govData[govName];
            const coords = this.governorateCoords[govName];

            // Calculer la taille (rayon) proportionnelle
            const radius = Math.min(25, Math.max(9, 9 + data.count * 0.8));

            // Définir la couleur selon la gravité
            let color = '#0ea5e9'; // Bleu cyan pour volume faible
            let fillColor = '#38bdf8';
            if (data.count > 8) {
                color = '#ef4444'; // Rouge pour volume critique
                fillColor = '#f87171';
            } else if (data.count >= 3) {
                color = '#f59e0b'; // Orange pour volume modéré
                fillColor = '#fbbf24';
            }

            const circle = L.circleMarker([coords.lat, coords.lng], {
                radius: radius,
                fillColor: fillColor,
                color: color,
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0.6
            });

            // Contenu du popup premium
            const popupContent = `
                <div class="map-popup-card">
                    <div class="popup-title">Gouv. ${govName}</div>
                    <div class="popup-stat-row">
                        <span class="label">Réclamations</span>
                        <span class="value badge-count" style="background-color: ${color}20; color: ${color}; border: 1px solid ${color}40;">
                            ${data.count}
                        </span>
                    </div>
                    <div class="popup-details">
                        <div class="detail-item"><i class="bi bi-gear-wide-connected me-1"></i><strong>Services :</strong> ${data.service}</div>
                        <div class="detail-item"><i class="bi bi-box-seam me-1"></i><strong>Produits :</strong> ${data.produit}</div>
                    </div>
                    <button class="btn-filter-map" onclick="window.angularStatsComponent.filterByRegion('${govName}')">
                        <i class="bi bi-filter-circle-fill me-1"></i> Filtrer cette région
                    </button>
                </div>
            `;

            circle.bindPopup(popupContent, {
                className: 'admin-leaflet-popup',
                closeButton: false
            });

            // Effets de survol
            circle.on('mouseover', (e: any) => {
                e.target.setStyle({ fillOpacity: 0.85, weight: 3 });
            });

            circle.on('mouseout', (e: any) => {
                e.target.setStyle({ fillOpacity: 0.6, weight: 2 });
            });

            circle.addTo(this.map);
            this.markers.push(circle);
        });

        // Rendre disponible globalement pour le bouton "Filtrer" du popup Leaflet
        (window as any).angularStatsComponent = this;
    }

    normalizeGovName(name: string): string {
        if (!name) return '';
        let n = name.trim();
        n = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
        
        if (n === 'Kef') return 'Le Kef';
        if (n === 'Benarous') return 'Ben Arous';
        if (n === 'Sidi bouzid') return 'Sidi Bouzid';
        return n;
    }

    filterByRegion(regionName: string): void {
        this.filters.region = regionName;
        this.applyFilters();
        if (this.map) {
            const coords = this.governorateCoords[regionName];
            if (coords) {
                this.map.flyTo([coords.lat, coords.lng], 9, {
                    duration: 1.2
                });
            }
        }
    }

    ngOnDestroy(): void {
        this.destroyCharts();
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        if ((window as any).angularStatsComponent === this) {
            delete (window as any).angularStatsComponent;
        }
    }
}
