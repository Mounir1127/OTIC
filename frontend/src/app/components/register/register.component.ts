import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { TUNISIA_DATA } from '../../data/tunisia-data';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    user = {
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        password: '',
        adresse: {
            ville: '',
            region: '',
            codePostal: ''
        }
    };
    error = '';
    governorates: any[] = TUNISIA_DATA;
    delegations: any[] = [];

    constructor(
        private authService: AuthService,
        private locationService: LocationService,
        private router: Router
    ) {
        // Optimistically set default data first
        this.governorates = TUNISIA_DATA;

        // Attempt to fetch fresh data, but don't clear existing if it fails
        this.locationService.getGovernorates().subscribe({
            next: (data) => {
                if (data && data.length > 0) {
                    console.log('Governorates loaded from server:', data);
                    this.governorates = data;
                }
            },
            error: (err) => {
                console.warn('Backend unavailable, using local Tunisia data:', err);
                // No action needed, defaults are already set
            }
        });
    }

    onRegionChange() {
        const selectedGov = this.governorates.find(g => g.governorate === this.user.adresse.region);
        this.delegations = selectedGov ? selectedGov.delegations : [];
        this.user.adresse.ville = '';
        this.user.adresse.codePostal = '';
    }

    onVilleChange() {
        const selectedVille = this.delegations.find(d => d.name === this.user.adresse.ville);
        if (selectedVille) {
            this.user.adresse.codePostal = selectedVille.zip;
        }
    }

    register() {
        this.authService.register(this.user).subscribe({
            next: (res) => {
                localStorage.setItem('token', res.token);
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.error = err.error.msg || 'Registration failed';
            }
        });
    }
}
