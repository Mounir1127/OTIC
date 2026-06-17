import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThermalBathsComponent } from './thermal-baths.component';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { Api } from '../../../services/api';
import { SettingsService } from '../../../services/settings.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


// Mock Chart.js manually as global if needed

// Mock Leaflet
vi.mock('leaflet', () => ({
    map: vi.fn().mockReturnValue({
        setView: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        remove: vi.fn(),
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
        addControl: vi.fn(),
        fitBounds: vi.fn(),
        flyTo: vi.fn(),
        invalidateSize: vi.fn()
    }),
    tileLayer: vi.fn().mockReturnValue({
        addTo: vi.fn().mockReturnThis()
    }),
    marker: vi.fn().mockReturnValue({
        addTo: vi.fn().mockReturnThis(),
        bindPopup: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        remove: vi.fn()
    }),
    featureGroup: vi.fn().mockReturnValue({
        addTo: vi.fn().mockReturnThis(),
        getBounds: vi.fn().mockReturnValue([[0, 0], [1, 1]]),
        addLayer: vi.fn()
    }),
    divIcon: vi.fn(),
    icon: vi.fn()
}));

describe('ThermalBathsComponent', () => {
    let component: ThermalBathsComponent;
    let fixture: ComponentFixture<ThermalBathsComponent>;
    let mockAdminService: any;
    let mockAuthService: any;
    let mockApi: any;
    let mockSettingsService: any;

    const mockBaths = [
        { _id: '1', name: 'Hammam Mellegue', location: 'Kef', type: 'Station Thermale', trustScore: 90, rating: 4.5 },
        { _id: '2', name: 'Korbous', location: 'Nabeul', type: 'Centre de Thalassothérapie', trustScore: 85, rating: 4.2 }
    ];

    beforeEach(async () => {
        mockAdminService = {
            createThermalBath: vi.fn().mockReturnValue(of({})),
            updateThermalBath: vi.fn().mockReturnValue(of({})),
            deleteThermalBath: vi.fn().mockReturnValue(of({})),
            uploadThermalBathImage: vi.fn().mockReturnValue(of({ imageUrl: 'test.jpg' }))
        };

        mockAuthService = {
            currentUser$: of({ role: 'super_admin' })
        };

        mockApi = {
            getThermalBaths: vi.fn().mockReturnValue(of(mockBaths))
        };

        mockSettingsService = {
            currentSettings: { language: 'fr' },
            getTranslation: vi.fn().mockImplementation(key => key)
        };

        // Mock Chart.js & Canvas
        global.window.HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
            measureText: vi.fn().mockReturnValue({ width: 0 }),
        });

        await TestBed.configureTestingModule({
            imports: [ThermalBathsComponent, FormsModule, CommonModule],
            providers: [
                { provide: AdminService, useValue: mockAdminService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: Api, useValue: mockApi },
                { provide: SettingsService, useValue: mockSettingsService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ThermalBathsComponent);
        component = fixture.componentInstance;
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should load thermal baths on init', () => {
        fixture.detectChanges();
        vi.advanceTimersByTime(150);
        expect(mockApi.getThermalBaths).toHaveBeenCalled();
        expect(component.baths.length).toBe(2);
    });

    it('should calculate averages correctly', () => {
        fixture.detectChanges();
        vi.advanceTimersByTime(150);
        // Mock data has no temperatures, so avgTemp should be 0 or handled
        expect(component.avgTemp).toBe(0);
        expect(component.getCentresCount()).toBe(2);
    });

    it('should open edit modal with bath data', () => {
        const bath = mockBaths[0];
        component.openEditModal(bath);
        expect(component.showModal).toBe(true);
        expect(component.editingBathId).toBe('1');
        expect(component.bathModel.name).toBe('Hammam Mellegue');
    });

    it('should call delete service when confirmed', () => {
        window.confirm = vi.fn().mockReturnValue(true);
        component.onDelete('2');
        expect(mockAdminService.deleteThermalBath).toHaveBeenCalledWith('2');
    });
});
