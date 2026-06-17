import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatsComponent } from './stats.component';
import { AdminService } from '../../../../services/admin.service';
import { AuthService } from '../../../../services/auth.service';
import { LocationService } from '../../../../services/location.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('StatsComponent', () => {
    let component: StatsComponent;
    let fixture: ComponentFixture<StatsComponent>;
    let mockAdminService: any;
    let mockAuthService: any;
    let mockLocationService: any;

    beforeEach(async () => {
        mockAdminService = {
            getStats: vi.fn().mockReturnValue(of({
                totalCount: 0,
                volumeByCategory: [],
                statusDistribution: [],
                averageProcessingTime: 0,
                resolutionRate: 0,
                avgProcessingPerCategory: []
            }))
        };

        mockAuthService = {
            currentUser$: of({ role: 'super_admin' })
        };

        mockLocationService = {
            getGovernorates: vi.fn().mockReturnValue(of([]))
        };

        await TestBed.configureTestingModule({
            imports: [StatsComponent, FormsModule, CommonModule],
            providers: [
                { provide: AdminService, useValue: mockAdminService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: LocationService, useValue: mockLocationService }
            ]
        }).compileComponents();

        // Mock window functions that might cause issues during init
        global.window.HTMLCanvasElement.prototype.getContext = vi.fn();

        fixture = TestBed.createComponent(StatsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default filters', () => {
        expect(component.filters.consumerType).toBe('');
    });

    it('should load stats on init', () => {
        expect(mockAdminService.getStats).toHaveBeenCalled();
    });

    it('should reload stats when filters change', () => {
        component.filters.consumerType = 'particulier';
        component.applyFilters();

        expect(mockAdminService.getStats).toHaveBeenCalledWith(expect.objectContaining({
            consumerType: 'particulier'
        }));
    });

    it('should reset filters correctly', () => {
        component.filters.consumerType = 'professionnel';
        component.resetFilters();

        expect(component.filters.consumerType).toBe('');
        expect(mockAdminService.getStats).toHaveBeenCalled();
    });
});

