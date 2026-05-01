import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AdminService } from '../../../../services/admin.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="users-list-container fade-in">
        <div class="row mb-5 align-items-center">
            <div class="col-12">
                <h2 class="fw-bold text-dark mb-1">Annuaire des Utilisateurs</h2>
                <p class="text-muted mb-0">Gestion centralisée des comptes et des permissions.</p>
            </div>
        </div>

        <!-- Advanced Stats Bar -->
        <div class="row g-3 mb-4">
            <div class="col-md-4" *ngFor="let s of statsList">
                <div class="filter-card p-4 rounded-4 shadow-sm border-0 bg-white clickable transition-all" 
                     [class.active]="selectedFilter === s.id" (click)="setFilter(s.id)">
                    <div class="d-flex align-items-center">
                        <div class="icon-circle shadow-sm me-3" [class]="s.id">
                            <i [class]="'bi ' + s.icon"></i>
                        </div>
                        <div>
                            <p class="small text-muted fw-bold mb-0 text-uppercase">{{ s.label }}</p>
                            <h3 class="fw-bold mb-0">{{ s.value }}</h3>
                        </div>
                        <i class="bi bi-funnel ms-auto opacity-25" *ngIf="selectedFilter === s.id"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search & Control Table -->
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            <div class="card-header bg-white p-4 border-0">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <div class="search-box position-relative">
                            <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                            <input type="text" class="form-control ps-5 rounded-pill border-light-subtle bg-light-subtle" 
                                   [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Rechercher par nom ou email...">
                        </div>
                    </div>
                    <div class="col-md-8 text-md-end mt-2 mt-md-0">
                        <span class="small text-muted">Affichage de <strong>{{ filteredUsers.length }}</strong> résultats</span>
                    </div>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 custom-table">
                    <thead class="bg-light">
                        <tr>
                            <th class="ps-4">Identité</th>
                            <th>Contact</th>
                            <th>Région</th>
                            <th>Rôle</th>
                            <th class="text-end pe-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let user of filteredUsers" class="user-row">
                            <td class="ps-4">
                                <div class="d-flex align-items-center">
                                    <div class="avatar-circle me-3 fw-bold" [class]="user.role">
                                        {{ user.prenom[0] }}{{ user.nom[0] }}
                                    </div>
                                    <div>
                                        <h6 class="mb-0 fw-bold">{{ user.prenom }} {{ user.nom }}</h6>
                                        <small class="text-muted opacity-75">ID: {{ user._id.substring(0,8) }}</small>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div><i class="bi bi-envelope small me-2 text-muted"></i>{{ user.email }}</div>
                                <div class="small text-muted"><i class="bi bi-telephone small me-2"></i>{{ user.telephone || '---' }}</div>
                            </td>
                            <td>
                                <span class="badge bg-light text-dark border-light-subtle fw-medium px-3 py-2 rounded-pill">
                                    {{ user.adresse?.region || '---' }}
                                </span>
                            </td>
                            <td>
                                <span class="role-pill" [class]="user.role">
                                    <i class="bi bi-dot me-1"></i>{{ user.role.replace('_', ' ') }}
                                </span>
                            </td>
                             <td class="text-end pe-4">
                                 <div class="btn-group" *ngIf="user.role !== 'super_admin'">
                                     <button class="btn btn-light-pro btn-sm rounded-circle me-2" [routerLink]="['/dashboard/admin-management/users/edit', user._id]" title="Modifier">
                                         <i class="bi bi-pencil"></i>
                                     </button>
                                     <button class="btn btn-light-pro btn-sm rounded-circle text-danger" (click)="confirmDelete(user)" title="Supprimer">
                                         <i class="bi bi-trash"></i>
                                     </button>
                                 </div>
                                 <div *ngIf="user.role === 'super_admin'" class="text-muted small">
                                     <i class="bi bi-shield-lock-fill me-1"></i> Protégé
                                 </div>
                             </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div *ngIf="filteredUsers.length === 0" class="p-5 text-center">
                <i class="bi bi-people fs-1 text-muted opacity-25 mb-3 d-block"></i>
                <p class="text-muted">Aucun utilisateur ne correspond à vos critères.</p>
                <button class="btn btn-outline-primary btn-sm rounded-pill px-4" (click)="setFilter('all'); searchTerm=''">Effacer tout</button>
            </div>
        </div>
    </div>
  `,
  styles: [`
    .users-list-container { padding: 0; }
    
    /* Stats Bar */
    .filter-card { border: 1px solid #f1f5f9; position: relative; }
    .filter-card:hover { transform: translateY(-4px); border-color: #3b82f666; }
    .filter-card.active { 
        background: #f8fafc;
        border: 2px solid #3b82f6 !important; 
    }
    
    .icon-circle {
        width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
        border-radius: 12px; font-size: 1.4rem;
    }
    .icon-circle.all { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .icon-circle.admin { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    .icon-circle.consommateur_simple { background: rgba(16, 185, 129, 0.1); color: #10b981; }

    /* Custom Table */
    .custom-table thead th {
        font-size: 0.75rem;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.5px;
        color: #64748b;
        border-bottom: 0;
        padding: 1.25rem 1rem;
    }
    .user-row { transition: all 0.2s; }
    .user-row:hover { background-color: #f8fafc; }
    
    .avatar-circle {
        width: 40px; height: 40px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: #f1f5f9; color: #64748b; font-size: 0.85rem;
    }
    .avatar-circle.super_admin { background: #fee2e2; color: #ef4444; }
    .avatar-circle.admin_regional { background: #f3e8ff; color: #8b5cf6; }
    
    .role-pill {
        display: inline-flex; align-items: center;
        padding: 4px 12px; border-radius: 50px;
        font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .role-pill.super_admin { background: #fee2e2; color: #991b1b; }
    .role-pill.admin_regional { background: #f3e8ff; color: #6b21a8; }
    .role-pill.consommateur_simple { background: #f1f5f9; color: #475569; }

    .btn-light-pro { 
        background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0;
        width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    }
    .btn-light-pro:hover { background: #e2e8f0; color: #1e293b; }

    .search-box input { width: 100%; border-color: #e2e8f0; }
    .search-box input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); }
    
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class UsersListComponent implements OnInit {
  allUsers: any[] = [];
  filteredUsers: any[] = [];
  stats = { totalUsers: 0, totalAdmins: 0, totalConsumers: 0 };
  selectedFilter: string = 'all';
  searchTerm: string = '';
  isLoading: boolean = true;
  errorMsg: string = '';

  statsList: any[] = [];

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['filter']) {
        this.selectedFilter = params['filter'];
      }
      this.loadUsers();
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getUsers().subscribe({
      next: (data: any[]) => {
        this.allUsers = data;
        this.calculateStats();
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = 'Impossible de charger la liste des utilisateurs.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats() {
    this.stats.totalUsers = this.allUsers.length;
    this.stats.totalAdmins = this.allUsers.filter(u => u.role === 'admin_regional' || u.role === 'super_admin').length;
    this.stats.totalConsumers = this.allUsers.filter(u => u.role === 'consommateur_simple').length;
    
    this.statsList = [
      { id: 'all', label: 'Utilisateurs', icon: 'bi-people', value: this.stats.totalUsers },
      { id: 'admin', label: 'Admins', icon: 'bi-shield-shaded', value: this.stats.totalAdmins },
      { id: 'consommateur_simple', label: 'Consommateurs', icon: 'bi-person', value: this.stats.totalConsumers }
    ];
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  onSearch() {
    this.applyFilter();
  }

  applyFilter() {
    let result = this.allUsers;

    // Apply category filter
    if (this.selectedFilter === 'admin') {
      result = result.filter(u => u.role === 'admin_regional' || u.role === 'super_admin');
    } else if (this.selectedFilter === 'consommateur_simple') {
      result = result.filter(u => u.role === 'consommateur_simple');
    }

    // Apply search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(u => 
        u.nom.toLowerCase().includes(term) || 
        u.prenom.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term)
      );
    }

    this.filteredUsers = result;
  }

  confirmDelete(user: any) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.prenom} ${user.nom} ? Cette action est irréversible.`)) {
      this.adminService.deleteUser(user._id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          alert('Erreur lors de la suppression : ' + (err.error?.msg || err.message));
        }
      });
    }
  }
}
