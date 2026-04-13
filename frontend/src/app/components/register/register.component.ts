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
        cin: '',
        password: '',
        adresse: {
            ville: '',
            region: '',
            codePostal: ''
        }
    };
    error = '';
    isSubmitting = false;
    governorates: any[] = TUNISIA_DATA;
    delegations: any[] = [];

    constructor(
        private authService: AuthService,
        private locationService: LocationService,
        private router: Router
    ) {
        this.governorates = TUNISIA_DATA;
        this.locationService.getGovernorates().subscribe({
            next: (data) => {
                if (data && data.length > 0) {
                    this.governorates = data;
                }
            },
            error: (err) => console.warn('Backend unavailable, using local data')
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
        if (this.isSubmitting) return;
        this.isSubmitting = true;
        this.error = '';
        
        this.authService.register(this.user).subscribe({
            next: (res) => {
                // Success: Store token and a flag for the welcome message
                localStorage.setItem('token', res.token);
                localStorage.setItem('otic_show_welcome', 'true');
                
                // Direct navigation to dashboard as requested
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.error = err.error.msg || 'Une erreur est survenue lors de l\'inscription';
                this.isSubmitting = false;
            }
        });
    }

    socialLogin(platform: string) {
        window.location.href = `http://localhost:5000/api/auth/${platform}`;
    }
}
