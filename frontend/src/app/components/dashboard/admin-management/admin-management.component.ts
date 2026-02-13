import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { LocationService } from '../../../services/location.service';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-admin-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-management.component.html',
    styleUrls: ['./admin-management.component.css']
})
export class AdminManagementComponent implements OnInit {
    users: any[] = [];
    governorates: any[] = [];
    delegations: any[] = [];

    newAdmin = {
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

    stats = {
        totalUsers: 0,
        totalAdmins: 0,
        totalConsumers: 0
    };

    passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    successMsg = '';
    errorMsg = '';
    pwdSuccessMsg = '';
    pwdErrorMsg = '';

    constructor(
        private adminService: AdminService,
        private locationService: LocationService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.loadUsers();
        this.loadLocations();
    }

    loadUsers() {
        this.adminService.getUsers().subscribe({
            next: (data: any[]) => {
                this.users = data;
                this.calculateStats();
            },
            error: (err: any) => console.error(err)
        });
    }

    calculateStats() {
        this.stats.totalUsers = this.users.length;
        this.stats.totalAdmins = this.users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
        this.stats.totalConsumers = this.users.filter(u => u.role === 'consommateur_simple').length;
    }

    loadLocations() {
        this.locationService.getGovernorates().subscribe({
            next: (data: any[]) => this.governorates = data,
            error: (err: any) => console.error(err)
        });
    }

    onRegionChange() {
        const selectedGov = this.governorates.find(g => g.governorate === this.newAdmin.adresse.region);
        this.delegations = selectedGov ? selectedGov.delegations : [];
        this.newAdmin.adresse.ville = '';
        this.newAdmin.adresse.codePostal = '';
    }

    onCityChange() {
        const selectedDel = this.delegations.find(d => d.name === this.newAdmin.adresse.ville);
        this.newAdmin.adresse.codePostal = selectedDel ? selectedDel.zip : '';
    }

    onSubmit() {
        this.adminService.createAdmin(this.newAdmin).subscribe({
            next: (res) => {
                this.successMsg = 'Administrateur créé avec succès !';
                this.errorMsg = '';
                this.loadUsers();
                this.resetForm();
            },
            error: (err) => {
                this.errorMsg = err.error.msg || 'Erreur lors de la création';
                this.successMsg = '';
            }
        });
    }

    onSubmitPasswordChange() {
        if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
            this.pwdErrorMsg = 'Les nouveaux mots de passe ne correspondent pas';
            return;
        }

        this.authService.changePassword({
            currentPassword: this.passwordData.currentPassword,
            newPassword: this.passwordData.newPassword
        }).subscribe({
            next: (res) => {
                this.pwdSuccessMsg = 'Mot de passe modifié avec succès !';
                this.pwdErrorMsg = '';
                this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
            },
            error: (err) => {
                this.pwdErrorMsg = err.error.msg || 'Erreur lors de la modification';
                this.pwdSuccessMsg = '';
            }
        });
    }

    resetForm() {
        this.newAdmin = {
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
    }
}
