import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';

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
    governorates: any[] = [];
    delegations: any[] = [];

    constructor(
        private authService: AuthService,
        private locationService: LocationService,
        private router: Router
    ) {
        this.locationService.getGovernorates().subscribe({
            next: (data) => {
                console.log('Governorates loaded:', data);
                this.governorates = data;
            },
            error: (err) => console.error('Failed to load locations', err)
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
                this.router.navigate(['/']);
            },
            error: (err) => {
                this.error = err.error.msg || 'Registration failed';
            }
        });
    }
}
