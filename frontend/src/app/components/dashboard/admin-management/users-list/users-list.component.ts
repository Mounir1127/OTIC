import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../services/admin.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit, OnDestroy {
    users: any[] = [];
    stats = {
        totalUsers: 0,
        totalAdmins: 0,
        totalConsumers: 0
    };
    errorMsg = '';
    selectedFilter: string = 'all'; // 'all', 'admin', 'consommateur_simple'
    isLoading = false;
    private refreshSub: Subscription = new Subscription();

    constructor(
        private adminService: AdminService,
        private route: ActivatedRoute,
        private router: Router, // Add Router
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        const cached = localStorage.getItem('otic_admin_users_list');
        if (cached) {
            try {
                this.users = JSON.parse(cached);
                this.calculateStats();
                this.isLoading = false;
            } catch (e) { }
        } else {
            this.isLoading = true;
        }

        this.loadUsers();

        this.refreshSub.add(
            this.adminService.refreshUsers$.subscribe(() => {
                this.loadUsers();
            })
        );

        this.route.queryParams.subscribe(params => {
            if (params['filter']) {
                this.selectedFilter = params['filter'];
                this.cdr.detectChanges(); // Force update when filter changes
            }
        });
    }

    ngOnDestroy() {
        this.refreshSub.unsubscribe();
    }

    loadUsers() {
        // Only show loading if we don't have cached data yet
        if (this.users.length === 0) {
            this.isLoading = true;
        }
        this.adminService.getUsers().subscribe({
            next: (data: any[]) => {
                this.users = data;
                this.calculateStats();
                localStorage.setItem('otic_admin_users_list', JSON.stringify(this.users));
                this.isLoading = false;
                this.cdr.detectChanges(); // Force update
            },
            error: (err: any) => {
                console.error(err);
                this.errorMsg = err.error?.msg || 'Erreur lors du chargement des utilisateurs';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    calculateStats() {
        this.stats.totalUsers = this.users.length;
        this.stats.totalAdmins = this.users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
        this.stats.totalConsumers = this.users.filter(u => u.role === 'consommateur_simple').length;
    }

    setFilter(filter: string) {
        this.selectedFilter = filter;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { filter: filter },
            queryParamsHandling: 'merge'
        });
    }

    get filteredUsers() {
        if (this.selectedFilter === 'all') return this.users;
        if (this.selectedFilter === 'admin') {
            return this.users.filter(u => u.role === 'admin' || u.role === 'super_admin');
        }
        return this.users.filter(u => u.role === this.selectedFilter);
    }

    confirmDelete(user: any) {
        if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.prenom} ${user.nom} ? Cette action est irréversible.`)) {
            this.adminService.deleteUser(user._id).subscribe({
                next: () => {
                    alert('Utilisateur supprimé avec succès.');
                    this.adminService.triggerRefresh();
                },
                error: (err) => {
                    console.error(err);
                    alert(err.error?.msg || 'Erreur lors de la suppression.');
                }
            });
        }
    }


}
