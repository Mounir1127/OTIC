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
        isTRE: false,
        paysResidence: '',
        adresse: {
            ville: '',
            region: '',
            codePostal: ''
        }
    };
    countries: string[] = [
        'France', 'Italie', 'Allemagne', 'Canada', 'USA', 'Émirats Arabes Unis',
        'Qatar', 'Arabie Saoudite', 'Belgique', 'Suisse', 'Royaume-Uni',
        'Espagne', 'Pays-Bas', 'Suède', 'Libye', 'Algérie', 'Maroc', 'Égypte',
        'Turquie', 'Koweït', 'Oman', 'Autre'
    ].sort();
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

    formatName(type: 'nom' | 'prenom') {
        const val = this.user[type];
        if (val) {
            // Capitalize first letter of each word and remove multiple spaces
            this.user[type] = val.trim()
                .replace(/\s+/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
    }

    register() {
        if (this.isSubmitting) return;
        this.error = '';

        // 1. Basic empty check
        if (!this.user.nom || !this.user.prenom || !this.user.email || !this.user.telephone || !this.user.password) {
            this.error = 'Veuillez remplir tous les champs obligatoires.';
            return;
        }

        // 2. Format names
        this.formatName('nom');
        this.formatName('prenom');

        // 3. Email Validation
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(this.user.email)) {
            this.error = 'Format d\'adresse email invalide.';
            return;
        }

        // 4. Tunisian Phone Validation
        const phone = this.user.telephone.replace(/\s/g, ''); // Remove spaces
        const phoneRegex = /^(?:\+216|00216)?([24579]\d{7})$/;
        const match = phone.match(phoneRegex);

        if (!match) {
            this.error = 'Téléphone invalide. Requis: 8 chiffres commençant par 2, 4, 5, 7 ou 9.';
            return;
        }
        this.user.telephone = match[1];

        // 5. CIN Validation
        if (this.user.cin) {
            const cinClean = this.user.cin.replace(/\s/g, '');
            if (!/^\d{8}$/.test(cinClean)) {
                this.error = 'Le numéro CIN doit comporter exactement 8 chiffres.';
                return;
            }
            this.user.cin = cinClean;
        }

        // 6. Password Validation
        if (this.user.password.length < 8) {
            this.error = 'Le mot de passe doit comporter au moins 8 caractères.';
            return;
        }

        // 7. Address Validation (if not TRE)
        if (!this.user.isTRE && (!this.user.adresse.region || !this.user.adresse.ville)) {
            this.error = 'Veuillez renseigner votre région et ville.';
            return;
        }

        // 8. Country Validation (if TRE)
        if (this.user.isTRE && !this.user.paysResidence) {
            this.error = 'Veuillez choisir votre pays de résidence.';
            return;
        }

        this.isSubmitting = true;

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
        window.location.href = `http://localhost:5000/auth/${platform}`;
    }
}
