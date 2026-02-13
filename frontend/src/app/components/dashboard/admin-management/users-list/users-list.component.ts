import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../services/admin.service';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {
    users: any[] = [];
    stats = {
        totalUsers: 0,
        totalAdmins: 0,
        totalConsumers: 0
    };
    errorMsg = '';
    selectedFilter: string = 'all'; // 'all', 'admin', 'consommateur_simple'

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.adminService.getUsers().subscribe({
            next: (data: any[]) => {
                this.users = data;
                this.calculateStats();
            },
            error: (err: any) => {
                console.error(err);
                this.errorMsg = err.error?.msg || 'Erreur lors du chargement des utilisateurs';
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
    }

    get filteredUsers() {
        if (this.selectedFilter === 'all') return this.users;
        if (this.selectedFilter === 'admin') {
            return this.users.filter(u => u.role === 'admin' || u.role === 'super_admin');
        }
        return this.users.filter(u => u.role === this.selectedFilter);
    }
}
