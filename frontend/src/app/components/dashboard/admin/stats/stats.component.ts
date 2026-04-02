import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { LocationService } from '../../../../services/location.service';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

Chart.register(...registerables);

@Component({
    selector: 'app-stats',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, AfterViewInit {
    @ViewChild('categoryChart') categoryChartRef!: ElementRef;
    @ViewChild('statusChart') statusChartRef!: ElementRef;
    @ViewChild('processingChart') processingChartRef!: ElementRef;
    @ViewChild('dashboardContent') dashboardContent!: ElementRef;
    @ViewChild('exportSection') exportSection!: ElementRef;

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
}
