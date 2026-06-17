import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddReclamationComponent } from './add-reclamation.component';
import { ReclamationService } from '../../../services/reclamation.service';
import { AuthService } from '../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('AddReclamationComponent', () => {
    let component: AddReclamationComponent;
    let fixture: ComponentFixture<AddReclamationComponent>;
    let mockReclamationService: any;
    let mockAuthService: any;

    beforeEach(async () => {
        mockReclamationService = {
            createReclamation: vi.fn().mockReturnValue(of({
                trackingCode: 'REC-2026-0099',
                qrCode: 'data:image/png;base64,MOCK_QR'
            }))
        };

        mockAuthService = {
            currentUser$: of({
                _id: 'user1',
                nom: 'Test',
                prenom: 'User',
                isTRE: false
            })
        };

        await TestBed.configureTestingModule({
            imports: [AddReclamationComponent, FormsModule, CommonModule],
            providers: [
                { provide: ReclamationService, useValue: mockReclamationService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AddReclamationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // ──────────────────────────────────────────────────
    // 1. INITIALISATION
    // ──────────────────────────────────────────────────
    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });

    it('devrait commencer à l\'étape 1', () => {
        expect(component.step).toBe(1);
    });

    it('devrait initialiser le type de plaignant à "particulier"', () => {
        expect(component.reclamation.complainantType).toBe('particulier');
    });

    it('devrait initialiser le type de réclamation à "Produit"', () => {
        expect(component.reclamation.type).toBe('Produit');
    });

    it('devrait charger les secteurs depuis la taxonomie', () => {
        expect(component.sectors.length).toBeGreaterThan(0);
        expect(component.sectors.some(s => s.name.includes('alimentaires'))).toBe(true);
    });

    // ──────────────────────────────────────────────────
    // 2. NAVIGATION WIZARD
    // ──────────────────────────────────────────────────
    it('devrait avancer à l\'étape suivante quand valide', () => {
        // Step 1 is valid by default (particulier)
        component.nextStep();
        expect(component.step).toBe(2);
    });

    it('ne devrait pas avancer si l\'étape est invalide', () => {
        component.step = 2;
        component.reclamation.type = '';
        component.nextStep();
        expect(component.step).toBe(2); // Should not advance
    });

    it('devrait reculer à l\'étape précédente', () => {
        component.step = 3;
        component.prevStep();
        expect(component.step).toBe(2);
    });

    it('ne devrait pas reculer en dessous de l\'étape 1', () => {
        component.step = 1;
        component.prevStep();
        expect(component.step).toBe(1);
    });

    // ──────────────────────────────────────────────────
    // 3. VALIDATION DES ÉTAPES
    // ──────────────────────────────────────────────────
    describe('Validation des étapes', () => {

        it('étape 1 — devrait être valide pour un particulier', () => {
            component.step = 1;
            component.reclamation.complainantType = 'particulier';
            expect(component.isStepValid()).toBe(true);
        });

        it('étape 1 — devrait être invalide pour un professionnel sans données', () => {
            component.step = 1;
            component.reclamation.complainantType = 'professionnel';
            component.reclamation.raison_sociale = '';
            component.reclamation.matricule_fiscal = '';
            expect(component.isStepValid()).toBe(false);
        });

        it('étape 1 — devrait être valide pour un professionnel avec données', () => {
            component.step = 1;
            component.reclamation.complainantType = 'professionnel';
            component.reclamation.raison_sociale = 'ACME SARL';
            component.reclamation.matricule_fiscal = '1234567/A/M/000';
            expect(component.isStepValid()).toBe(true);
        });

        it('étape 2 — devrait être invalide sans secteur ni sous-secteur', () => {
            component.step = 2;
            component.reclamation.type = 'Produit';
            component.reclamation.secteur = '';
            component.reclamation.sous_secteur = '';
            expect(component.isStepValid()).toBe(false);
        });

        it('étape 2 — devrait être valide avec type + secteur + sous-secteur', () => {
            component.step = 2;
            component.reclamation.type = 'Produit';
            component.reclamation.secteur = 'Produits alimentaires et agroalimentaires';
            component.reclamation.sous_secteur = 'Produits laitiers';
            expect(component.isStepValid()).toBe(true);
        });

        it('étape 3 — devrait être invalide sans natures ni description', () => {
            component.step = 3;
            component.reclamation.natures = [];
            component.reclamation.description = '';
            expect(component.isStepValid()).toBe(false);
        });

        it('étape 3 — devrait être valide avec natures et description', () => {
            component.step = 3;
            component.reclamation.natures = ['Qualité'];
            component.reclamation.description = 'Problème de qualité du produit';
            expect(component.isStepValid()).toBe(true);
        });

        it('étape 4 — devrait toujours être valide (preuves optionnelles)', () => {
            component.step = 4;
            expect(component.isStepValid()).toBe(true);
        });

        it('étape 5 — devrait être invalide sans opérateur', () => {
            component.step = 5;
            component.reclamation.operateur = '';
            expect(component.isStepValid()).toBe(false);
        });

        it('étape 5 — devrait être valide avec opérateur', () => {
            component.step = 5;
            component.reclamation.operateur = 'Magasin Général';
            expect(component.isStepValid()).toBe(true);
        });
    });

    // ──────────────────────────────────────────────────
    // 4. GESTION DES SECTEURS
    // ──────────────────────────────────────────────────
    it('devrait charger les sous-secteurs lors du changement de secteur', () => {
        component.reclamation.secteur = 'Produits alimentaires et agroalimentaires';
        component.onSectorChange();
        expect(component.availableSubSectors.length).toBeGreaterThan(0);
        expect(component.availableSubSectors).toContain('Produits laitiers');
    });

    it('devrait vider les sous-secteurs si le secteur est inconnu', () => {
        component.reclamation.secteur = 'Secteur Inconnu';
        component.onSectorChange();
        expect(component.availableSubSectors.length).toBe(0);
    });

    it('devrait réinitialiser le sous-secteur lors du changement de secteur', () => {
        component.reclamation.sous_secteur = 'Ancien sous-secteur';
        component.reclamation.secteur = 'Services financiers';
        component.onSectorChange();
        expect(component.reclamation.sous_secteur).toBe('');
    });

    // ──────────────────────────────────────────────────
    // 5. GESTION DES NATURES
    // ──────────────────────────────────────────────────
    it('devrait ajouter une nature lors d\'un check', () => {
        const event = { target: { checked: true } };
        component.onNatureChange(event, 'Qualité');
        expect(component.reclamation.natures).toContain('Qualité');
    });

    it('devrait retirer une nature lors d\'un uncheck', () => {
        component.reclamation.natures = ['Qualité', 'Prix'];
        const event = { target: { checked: false } };
        component.onNatureChange(event, 'Qualité');
        expect(component.reclamation.natures).not.toContain('Qualité');
        expect(component.reclamation.natures).toContain('Prix');
    });

    // ──────────────────────────────────────────────────
    // 6. RESET DU FORMULAIRE
    // ──────────────────────────────────────────────────
    it('devrait réinitialiser le formulaire correctement', () => {
        component.step = 5;
        component.reclamation.type = 'Service';
        component.reclamation.secteur = 'Services financiers';
        component.reclamation.natures = ['Prix', 'Qualité'];
        component.successTrackingCode = 'REC-2026-0001';
        component.successQrCode = 'data:image/png;base64,QR';

        component.resetForm();

        expect(component.step).toBe(1);
        expect(component.successTrackingCode).toBe('');
        expect(component.successQrCode).toBe('');
        expect(component.reclamation.type).toBe('Produit');
        expect(component.reclamation.secteur).toBe('');
        expect(component.reclamation.natures.length).toBe(0);
        expect(component.reclamation.complainantType).toBe('particulier');
    });
});
