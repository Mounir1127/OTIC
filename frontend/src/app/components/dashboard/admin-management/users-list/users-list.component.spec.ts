import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersListComponent } from './users-list.component';
import { AdminService } from '../../../../services/admin.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('UsersListComponent', () => {
    let component: UsersListComponent;
    let fixture: ComponentFixture<UsersListComponent>;
    let mockAdminService: any;
    let mockActivatedRoute: any;

    const mockUsers = [
        { _id: '1', nom: 'Doe', prenom: 'John', email: 'john@example.com', role: 'super_admin', isActive: true },
        { _id: '2', nom: 'Smith', prenom: 'Jane', email: 'jane@example.com', role: 'consommateur_simple', isActive: false },
        { _id: '3', nom: 'Brown', prenom: 'Charlie', email: 'charlie@example.com', role: 'admin_regional', isActive: true }
    ];

    beforeEach(async () => {
        mockAdminService = {
            getUsers: vi.fn().mockReturnValue(of(mockUsers)),
            toggleUserStatus: vi.fn().mockReturnValue(of({ isActive: true }))
        };

        mockActivatedRoute = {
            queryParams: of({})
        };

        await TestBed.configureTestingModule({
            imports: [UsersListComponent, FormsModule, CommonModule],
            providers: [
                { provide: AdminService, useValue: mockAdminService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UsersListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load users on init', () => {
        expect(mockAdminService.getUsers).toHaveBeenCalled();
        expect(component.allUsers.length).toBe(3);
        expect(component.filteredUsers.length).toBe(3);
    });

    it('should calculate stats correctly', () => {
        expect(component.stats.totalUsers).toBe(3);
        expect(component.stats.totalAdmins).toBe(2); // super_admin + admin_regional
        expect(component.stats.totalConsumers).toBe(1);
    });

    it('should filter users by search term', () => {
        component.searchTerm = 'Jane';
        component.onSearch();
        expect(component.filteredUsers.length).toBe(1);
        expect(component.filteredUsers[0].prenom).toBe('Jane');
    });

    it('should filter users by category', () => {
        component.setFilter('admin');
        expect(component.filteredUsers.length).toBe(2);

        component.setFilter('consommateur_simple');
        expect(component.filteredUsers.length).toBe(1);
    });

    it('should toggle user status', () => {
        window.confirm = vi.fn().mockReturnValue(true);
        const userToToggle = component.allUsers[1]; // Jane (inactive)

        component.onToggleStatus(userToToggle);

        expect(mockAdminService.toggleUserStatus).toHaveBeenCalledWith('2');
        expect(userToToggle.isActive).toBe(true);
    });
});
