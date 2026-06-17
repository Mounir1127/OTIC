import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReclamationListComponent } from './reclamation-list.component';
import { ReclamationService } from '../../../services/reclamation.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { PdfService } from '../../../services/pdf.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('ReclamationListComponent', () => {
    let component: ReclamationListComponent;
    let fixture: ComponentFixture<ReclamationListComponent>;
    let mockReclamationService: any;
    let mockNotificationService: any;
    let mockAuthService: any;
    let mockPdfService: any;

    const mockReclamations = [
        {
            _id: 'r1',
            trackingCode: 'REC-2026-0001',
            type: 'Produit',
            secteur: 'Produits alimentaires et agroalimentaires',
            sous_secteur: 'Produits laitiers',
            statut: 'deposee',
            dateCreation: '2026-01-15T10:00:00Z',
            description: 'Produit périmé',
            operateur: 'Supermarché X',
            user: { nom: 'Ben Ali', prenom: 'Mohamed', email: 'mba@test.com' }
        },
        {
            _id: 'r2',
            trackingCode: 'REC-2026-0002',
            type: 'Service',
            secteur: 'Services de télécommunications',
            sous_secteur: 'Internet',
            statut: 'en_cours',
            dateCreation: '2026-02-20T14:30:00Z',
            description: 'Coupure Internet prolongée',
            operateur: 'Ooredoo',
            user: { nom: 'Trabelsi', prenom: 'Fatima', email: 'ft@test.com' }
        },
        {
            _id: 'r3',
            trackingCode: 'REC-2026-0003',
            type: 'Produit',
            secteur: 'Produits industriels de consommation',
            sous_secteur: 'Électroménager',
            statut: 'resolue',
            dateCreation: '2026-03-05T09:15:00Z',
            description: 'Appareil défectueux',
            operateur: 'LG',
            user: { nom: 'Bouazizi', prenom: 'Ahmed', email: 'ab@test.com' }
        },
        {
            _id: 'r4',
            trackingCode: 'REC-2026-0004',
            type: 'Service',
            secteur: 'Services financiers',
            sous_secteur: 'Banques',
            statut: 'rejete',
            dateCreation: '2026-03-10T16:00:00Z',
            description: 'Frais bancaires abusifs',
            operateur: 'BIAT',
            user: { nom: 'Mejri', prenom: 'Leila', email: 'lm@test.com' }
        }
    ];

    beforeEach(async () => {
        mockReclamationService = {
            getMyReclamations: vi.fn().mockReturnValue(of(mockReclamations)),
            getReclamationById: vi.fn().mockReturnValue(of(mockReclamations[0]))
        };

        mockNotificationService = {
            markAllAsRead: vi.fn().mockReturnValue(of({}))
        };

        mockAuthService = {
            currentUser$: of({ _id: 'user1', nom: 'Test', prenom: 'User' })
        };

        mockPdfService = {
            generateReclamationPdf: vi.fn().mockResolvedValue(undefined)
        };

        await TestBed.configureTestingModule({
            imports: [ReclamationListComponent, FormsModule, CommonModule],
            providers: [
                { provide: ReclamationService, useValue: mockReclamationService },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: PdfService, useValue: mockPdfService },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ReclamationListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        // Wait for async ngOnInit
        await fixture.whenStable();
        fixture.detectChanges();
    });

    // ──────────────────────────────────────────────────
    // 1. INITIALISATION DU COMPOSANT
    // ──────────────────────────────────────────────────
    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });

    it('devrait charger les réclamations au démarrage', () => {
        expect(mockReclamationService.getMyReclamations).toHaveBeenCalled();
        expect(component.allReclamations.length).toBe(4);
        expect(component.reclamations.length).toBe(4);
    });

    it('devrait marquer les notifications comme lues', () => {
        expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    });

    // ──────────────────────────────────────────────────
    // 2. RECHERCHE / FILTRAGE
    // ──────────────────────────────────────────────────
    it('devrait filtrer les réclamations par code de suivi', () => {
        component.searchTerm = '0001';
        component.filterReclamations();
        expect(component.reclamations.length).toBe(1);
        expect(component.reclamations[0].trackingCode).toBe('REC-2026-0001');
    });

    it('devrait filtrer les réclamations par secteur', () => {
        component.searchTerm = 'télécommunications';
        component.filterReclamations();
        expect(component.reclamations.length).toBe(1);
        expect(component.reclamations[0].secteur).toContain('télécommunications');
    });

    it('devrait filtrer les réclamations par type', () => {
        component.searchTerm = 'Produit';
        component.filterReclamations();
        expect(component.reclamations.length).toBe(2);
    });

    it('devrait filtrer les réclamations par statut', () => {
        component.searchTerm = 'resolue';
        component.filterReclamations();
        expect(component.reclamations.length).toBe(1);
        expect(component.reclamations[0].statut).toBe('resolue');
    });

    it('devrait réinitialiser la liste si le terme de recherche est vide', () => {
        component.searchTerm = 'Produit';
        component.filterReclamations();
        expect(component.reclamations.length).toBe(2);

        component.searchTerm = '';
        component.filterReclamations();
        expect(component.reclamations.length).toBe(4);
    });

    // ──────────────────────────────────────────────────
    // 3. MODAL DÉTAILS
    // ──────────────────────────────────────────────────
    it('devrait ouvrir la modal des détails', () => {
        component.openDetails(mockReclamations[0]);
        expect(component.showModal).toBe(true);
        expect(component.selectedReclamation).toBe(mockReclamations[0]);
    });

    it('devrait fermer la modal des détails', () => {
        component.openDetails(mockReclamations[0]);
        component.closeModal();
        expect(component.showModal).toBe(false);
        expect(component.selectedReclamation).toBeNull();
    });

    // ──────────────────────────────────────────────────
    // 4. LABELS DE STATUT (MÉTIER)
    // ──────────────────────────────────────────────────
    it('devrait retourner le bon label pour chaque statut', () => {
        expect(component.getStatusLabel('deposee')).toBe('Déposée');
        expect(component.getStatusLabel('en_cours')).toBe('En cours');
        expect(component.getStatusLabel('affectee_conventionne')).toBe('Affectée');
        expect(component.getStatusLabel('resolue')).toBe('Résolue');
        expect(component.getStatusLabel('rejete')).toBe('Rejetée');
        expect(component.getStatusLabel('demande_complement')).toBe('Complément requis');
        expect(component.getStatusLabel('fermee')).toBe('Fermée');
    });

    // ──────────────────────────────────────────────────
    // 5. COULEURS DE STATUT
    // ──────────────────────────────────────────────────
    it('devrait retourner la bonne classe CSS pour chaque statut', () => {
        expect(component.getStatusColorClass('deposee')).toBe('bg-warning');
        expect(component.getStatusColorClass('en_cours')).toBe('bg-info');
        expect(component.getStatusColorClass('affectee_conventionne')).toBe('bg-primary');
        expect(component.getStatusColorClass('resolue')).toBe('bg-success');
        expect(component.getStatusColorClass('rejete')).toBe('bg-danger');
    });

    // ──────────────────────────────────────────────────
    // 6. STEPPER DE PROGRESSION
    // ──────────────────────────────────────────────────
    it('devrait calculer l\'index du stepper correctement', () => {
        expect(component.getStepperStageIndex('deposee')).toBe(0);
        expect(component.getStepperStageIndex('en_cours')).toBe(1);
        expect(component.getStepperStageIndex('affectee_conventionne')).toBe(2);
        expect(component.getStepperStageIndex('resolue')).toBe(3);
        expect(component.getStepperStageIndex('rejete')).toBe(3);
    });

    it('devrait calculer la largeur de la barre de progression', () => {
        expect(component.getStepperProgressWidth('deposee')).toBe(0);
        expect(component.getStepperProgressWidth('en_cours')).toBeCloseTo(33.33, 1);
        expect(component.getStepperProgressWidth('affectee_conventionne')).toBeCloseTo(66.67, 1);
        expect(component.getStepperProgressWidth('resolue')).toBe(100);
    });

    it('devrait retourner les bonnes classes de step CSS', () => {
        // Statut "en_cours" → step 0=completed, step 1=active, step 2=pending
        expect(component.getStepClass('en_cours', 0)).toBe('completed');
        expect(component.getStepClass('en_cours', 1)).toBe('active');
        expect(component.getStepClass('en_cours', 2)).toBe('pending');
        expect(component.getStepClass('en_cours', 3)).toBe('pending');
    });

    // ──────────────────────────────────────────────────
    // 7. UTILITAIRES FICHIERS
    // ──────────────────────────────────────────────────
    it('devrait détecter les images par extension', () => {
        expect(component.isImage('photo.jpg')).toBe(true);
        expect(component.isImage('facture.png')).toBe(true);
        expect(component.isImage('screenshot.webp')).toBe(true);
        expect(component.isImage('document.pdf')).toBe(false);
        expect(component.isImage('contrat.docx')).toBe(false);
        expect(component.isImage('')).toBe(false);
    });

    it('devrait construire la bonne URL de fichier', () => {
        expect(component.getFileUrl('test.pdf')).toBe('http://localhost:5000/uploads/test.pdf');
        expect(component.getFileUrl('https://cdn.example.com/photo.jpg')).toBe('https://cdn.example.com/photo.jpg');
        expect(component.getFileUrl('')).toBe('');
    });
});
