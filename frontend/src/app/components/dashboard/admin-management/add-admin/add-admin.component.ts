import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { LocationService } from '../../../../services/location.service';

@Component({
    selector: 'app-add-admin',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './add-admin.component.html',
    styleUrls: ['./add-admin.component.css']
})
export class AddAdminComponent implements OnInit {
    newAdmin: any = {
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

    governorates: any[] = [];
    delegations: any[] = [];
    successMsg = '';
    errorMsg = '';

    constructor(
        private adminService: AdminService,
        private locationService: LocationService
    ) { }

    ngOnInit() {
        this.loadLocations();
    }

    loadLocations() {
        this.locationService.getGovernorates().subscribe({
            next: (data) => this.governorates = data,
            error: (err) => console.error(err)
        });
    }

    onRegionChange() {
        if (this.newAdmin.adresse.region) {
            this.locationService.getDelegations(this.newAdmin.adresse.region).subscribe({
                next: (data) => {
                    this.delegations = data;
                    this.newAdmin.adresse.ville = '';
                    this.newAdmin.adresse.codePostal = '';
                },
                error: (err) => console.error(err)
            });
        }
    }

    onCityChange() {
        const city = this.delegations.find(d => d.name === this.newAdmin.adresse.ville);
        if (city) {
            this.newAdmin.adresse.codePostal = city.zip;
        }
    }

    onSubmit() {
        this.adminService.createAdmin(this.newAdmin).subscribe({
            next: (res) => {
                this.successMsg = 'Administrateur créé avec succès !';
                this.errorMsg = '';
                this.resetForm();
            },
            error: (err) => {
                this.errorMsg = err.error.msg || 'Une erreur est survenue';
                this.successMsg = '';
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
