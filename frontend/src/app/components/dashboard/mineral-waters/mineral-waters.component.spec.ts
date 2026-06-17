import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MineralWatersComponent } from './mineral-waters.component';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { Api } from '../../../services/api';
import { SettingsService } from '../../../services/settings.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


// Mock Chart.js manually as global if needed, but not as vi.mock for now

describe('MineralWatersComponent', () => {
    let component: MineralWatersComponent;
    let fixture: ComponentFixture<MineralWatersComponent>;
    let mockAdminService: any;
    let mockAuthService: any;
    let mockApi: any;
    let mockSettingsService: any;

    const mockBrands = [
        { _id: '1', marque: 'Sabi', tds: '350', ph: '7.2', notes: 'Excellent' },
        { _id: '2', marque: 'Melliti', tds: '450', ph: '6.8', notes: 'Bien' }
    ];

    beforeEach(async () => {
        mockAdminService = {
            createWaterBrand: vi.fn().mockReturnValue(of({})),
            updateWaterBrand: vi.fn().mockReturnValue(of({})),
            deleteWaterBrand: vi.fn().mockReturnValue(of({}))
        };

        mockAuthService = {
            currentUser$: of({ role: 'super_admin' })
        };

        mockApi = {
            getWaterBrands: vi.fn().mockReturnValue(of(mockBrands))
        };

        mockSettingsService = {
            currentSettings: { language: 'fr' },
            getTranslation: vi.fn().mockImplementation(key => key)
        };

        // Mock Chart.js to avoid canvas errors
        global.window.HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
            fillRect: vi.fn(),
            clearRect: vi.fn(),
            getImageData: vi.fn(),
            putImageData: vi.fn(),
            createImageData: vi.fn(),
            setTransform: vi.fn(),
            drawImage: vi.fn(),
            save: vi.fn(),
            fillText: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            stroke: vi.fn(),
            translate: vi.fn(),
            scale: vi.fn(),
            rotate: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            measureText: vi.fn().mockReturnValue({ width: 0 }),
            transform: vi.fn(),
            rect: vi.fn(),
            clip: vi.fn(),
        });

        await TestBed.configureTestingModule({
            imports: [MineralWatersComponent, FormsModule, CommonModule],
            providers: [
                { provide: AdminService, useValue: mockAdminService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: Api, useValue: mockApi },
                { provide: SettingsService, useValue: mockSettingsService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MineralWatersComponent);
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

    it('should load water brands on init', () => {
        fixture.detectChanges();
        vi.advanceTimersByTime(150);
        expect(mockApi.getWaterBrands).toHaveBeenCalled();
        expect(component.brands.length).toBe(2);
    });

    it('should filter brands by search term', () => {
        fixture.detectChanges();
        vi.advanceTimersByTime(150);
        const event = { target: { value: 'Sabi' } };
        component.onSearch(event);
        expect(component.filteredBrands.length).toBe(1);
        expect(component.filteredBrands[0].marque).toBe('Sabi');
    });

    it('should open add modal correctly', () => {
        component.openAddModal();
        expect(component.showModal).toBe(true);
        expect(component.editingBrandId).toBeNull();
    });

    it('should call delete service when on some brand', () => {
        window.confirm = vi.fn().mockReturnValue(true);
        component.onDelete('1');
        expect(mockAdminService.deleteWaterBrand).toHaveBeenCalledWith('1');
    });
});
