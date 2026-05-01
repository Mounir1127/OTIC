import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Api } from '../../services/api';
import { MineralWatersComponent } from '../dashboard/mineral-waters/mineral-waters.component';
import { ThermalBathsComponent } from '../dashboard/thermal-baths/thermal-baths.component';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterModule, CommonModule, MineralWatersComponent, ThermalBathsComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    isScrolled = false;
    stats = {
        totalReclamations: '15k+',
        resolutionRate: '92%',
        totalGovernorates: '24',
        averageResponseTime: '48h'
    };

    constructor(private api: Api) { }

    ngOnInit() {
        this.api.getPublicStats().subscribe({
            next: (data) => {
                this.stats = {
                    totalReclamations: data.totalReclamations > 1000 ? (data.totalReclamations / 1000).toFixed(1) + 'k+' : data.totalReclamations.toString(),
                    resolutionRate: data.resolutionRate + '%',
                    totalGovernorates: data.totalGovernorates.toString(),
                    averageResponseTime: data.averageResponseTime
                };
            },
            error: (err) => console.error('Error fetching public stats:', err)
        });
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.isScrolled = window.scrollY > 300;
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
