import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../../services/admin.service';
import { LocationService } from '../../../../services/location.service';

@Component({
    selector: 'app-edit-user',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './edit-user.component.html',
    styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent implements OnInit {
    editForm: FormGroup;
    userId: string = '';
    isLoading = false;
    successMsg = '';
    errorMsg = '';
    governorates: any[] = [];
    delegations: any[] = [];

    constructor(
        private fb: FormBuilder,
        private adminService: AdminService,
        private locationService: LocationService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.editForm = this.fb.group({
            nom: ['', Validators.required],
            prenom: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            telephone: ['', Validators.required],
            role: ['', Validators.required],
            adresse: this.fb.group({
                region: ['', Validators.required],
                ville: ['', Validators.required],
                codePostal: ['', Validators.required]
            })
        });
    }

    ngOnInit(): void {
        this.userId = this.route.snapshot.paramMap.get('id') || '';
        if (this.userId) {
            this.loadUser();
            this.loadLocations();
        } else {
            this.errorMsg = 'Utilisateur non trouvé';
        }
    }

    loadUser() {
        this.isLoading = true;
        this.adminService.getUserById(this.userId).subscribe({
            next: (user) => {
                this.editForm.patchValue(user);
                // Load delegations based on region if exists
                if (user.adresse?.region) {
                    this.onRegionChange(user.adresse.region);
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.errorMsg = 'Erreur lors du chargement des données utilisateur';
                this.isLoading = false;
            }
        });
    }

    loadLocations() {
        this.locationService.getGovernorates().subscribe({
            next: (data: any[]) => this.governorates = data,
            error: (err: any) => console.error(err)
        });
    }

    onRegionChange(regionName: string) {
        const selectedGov = this.governorates.find(g => g.governorate === regionName);
        this.delegations = selectedGov ? selectedGov.delegations : [];
    }

    onRegionSelect() {
        const region = this.editForm.get('adresse.region')?.value;
        this.onRegionChange(region);
        this.editForm.get('adresse.ville')?.setValue('');
        this.editForm.get('adresse.codePostal')?.setValue('');
    }

    onCityChange() {
        const city = this.editForm.get('adresse.ville')?.value;
        const selectedDel = this.delegations.find(d => d.name === city);
        if (selectedDel) {
            this.editForm.get('adresse.codePostal')?.setValue(selectedDel.zip);
        }
    }

    onSubmit() {
        if (this.editForm.invalid) return;

        this.isLoading = true;
        this.adminService.updateUser(this.userId, this.editForm.value).subscribe({
            next: () => {
                this.successMsg = 'Utilisateur mis à jour avec succès !';
                this.errorMsg = '';
                setTimeout(() => {
                    this.router.navigate(['/dashboard/admin-management/users']);
                }, 1500);
            },
            error: (err) => {
                console.error(err);
                this.errorMsg = err.error?.msg || 'Erreur lors de la mise à jour';
                this.isLoading = false;
            }
        });
    }
}
