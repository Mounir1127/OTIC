import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { SettingsService, UserSettings } from '../../../services/settings.service';
import { ReclamationService } from '../../../services/reclamation.service';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page fade-in" [dir]="currentSettings.language === 'ar' ? 'rtl' : 'ltr'">
      
      <div *ngIf="!dataLoaded" class="d-flex flex-column align-items-center justify-content-center py-5">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <p class="text-muted">Chargement de votre profil...</p>
      </div>

      <ng-container *ngIf="dataLoaded">
      <!-- Premium Profile Header -->
      <div class="profile-header mb-4">
        <div class="cover-photo shadow-sm rounded-4">
          <div class="overlay"></div>
          <div class="header-content p-4 d-flex align-items-end">
            <div class="avatar-container position-relative">
              <div class="avatar-large shadow-lg rounded-circle border border-4 border-white">
                <i class="bi bi-person-fill" *ngIf="!user?.photoProfil"></i>
                <img [src]="user?.photoProfil" *ngIf="user?.photoProfil" class="rounded-circle img-fluid">
              </div>
              <button (click)="fileInput.click()" class="btn btn-sm btn-light rounded-circle edit-avatar shadow-sm position-absolute bottom-0 end-0">
                <i class="bi bi-camera-fill"></i>
              </button>
              <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" style="display: none;">
            </div>
            <div class="user-info ms-4 mb-2 text-white" [ngClass]="{'me-4': currentSettings.language === 'ar'}">
              <h2 class="fw-bold mb-0">{{ user?.prenom }} {{ user?.nom }}</h2>
              <p class="mb-0 opacity-75 d-flex align-items-center">
                <i class="bi bi-patch-check-fill me-2 text-info"></i>
                {{ user?.role?.replace('_', ' ') | uppercase }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="profile-nav mb-4 bg-white shadow-sm rounded-pill p-1 d-flex">
        <button *ngFor="let tab of tabs" 
                (click)="activeTab = tab.id"
                [class.active]="activeTab === tab.id"
                class="btn rounded-pill flex-grow-1 py-2 d-flex align-items-center justify-content-center transition-all">
          <i [class]="'bi ' + tab.icon + ' me-2'"></i>
          <span>{{ translate(tab.labelKey) }}</span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="tab-content" [ngSwitch]="activeTab">
        
        <!-- Tab: Overview -->
        <div *ngSwitchCase="'overview'" class="fade-in">
          <div class="row g-4">
            <!-- Quick Stats -->
            <div class="col-md-4" *ngFor="let stat of userStats">
              <div class="stat-card p-4 rounded-4 shadow-sm border-0 bg-white h-100 position-relative overflow-hidden">
                <div class="d-flex align-items-center mb-3">
                  <div class="icon-box rounded-3 p-3 text-white" [style.background]="stat.color">
                    <i [class]="'bi ' + stat.icon + ' fs-4'"></i>
                  </div>
                  <h6 class="ms-3 mb-0 text-muted fw-bold">{{ translate(stat.labelKey) }}</h6>
                </div>
                <h2 class="fw-bold mb-0">{{ stat.value }}</h2>
                <div class="position-absolute end-0 bottom-0 p-3 opacity-10">
                  <i [class]="'bi ' + stat.icon" style="font-size: 4rem;"></i>
                </div>
              </div>
            </div>

            <!-- Profile Summary Card -->
            <div class="col-lg-8">
              <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div class="card-header bg-white py-3 border-0">
                  <h5 class="fw-bold mb-0">Informations de base & Coordonnées</h5>
                </div>
                <div class="card-body p-4">
                  <div class="row g-3">
                    <div class="col-sm-6" *ngFor="let info of userFullInfo">
                      <div class="info-item p-3 rounded-3 bg-light-subtle border">
                        <small class="text-muted text-uppercase fw-bold d-block mb-1">{{ info.label }}</small>
                        <span class="fw-medium text-dark">{{ info.value || '---' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Activity Log Card -->
            <div class="col-lg-4">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-header bg-white py-3 border-0">
                  <h5 class="fw-bold mb-0">Activité Récente</h5>
                </div>
                <div class="card-body p-0">
                  <div class="list-group list-group-flush" *ngIf="recentActivities.length > 0">
                    <div *ngFor="let act of recentActivities" class="list-group-item px-4 py-3 border-light">
                      <div class="d-flex align-items-center mb-1">
                        <span class="badge rounded-pill bg-primary-subtle text-primary me-2">{{ act.type }}</span>
                        <small class="text-muted ms-auto">{{ act.date | date:'shortDate' }}</small>
                      </div>
                      <p class="small mb-0 text-truncate fw-medium">{{ act.title }}</p>
                    </div>
                  </div>
                  <div *ngIf="recentActivities.length === 0" class="p-5 text-center text-muted">
                    <i class="bi bi-calendar2-x fs-1 mb-2 opacity-25"></i>
                    <p class="small mb-0">Aucune activité récente</p>
                  </div>
                </div>
                <div class="card-footer bg-light border-0 text-center py-3" *ngIf="recentActivities.length > 0">
                  <a href="#" class="small fw-bold text-decoration-none">Tout voir <i class="bi bi-arrow-right ms-1"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Edit Profile -->
        <div *ngSwitchCase="'edit'" class="fade-in">
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-4 p-md-5">
              <h4 class="fw-bold mb-4">Gérer vos informations personnelles</h4>
              <form (submit)="onUpdateProfile()">
                <div class="row g-4">
                  <div class="col-md-6">
                    <div class="form-floating mb-3">
                      <input type="text" class="form-control rounded-3" id="firstNameInput" [(ngModel)]="editUser.prenom" name="prenom" placeholder="Prénom">
                      <label for="firstNameInput">Prénom</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating mb-3">
                      <input type="text" class="form-control rounded-3" id="lastNameInput" [(ngModel)]="editUser.nom" name="nom" placeholder="Nom">
                      <label for="lastNameInput">Nom</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating mb-3">
                      <input type="email" class="form-control rounded-3" id="emailInput" [(ngModel)]="editUser.email" name="email" placeholder="Email">
                      <label for="emailInput">Email</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating mb-3">
                      <input type="text" class="form-control rounded-3" id="phoneInput" [(ngModel)]="editUser.telephone" name="telephone" placeholder="Téléphone">
                      <label for="phoneInput">Téléphone</label>
                    </div>
                  </div>
                  <!-- Address Fields (only for non-TRE) -->
                  <ng-container *ngIf="!editUser.isTRE">
                    <div class="col-12">
                       <hr class="text-muted opacity-25 my-2">
                       <h6 class="fw-bold mb-3 d-flex align-items-center"><i class="bi bi-geo-alt me-2"></i>Adresse en Tunisie</h6>
                    </div>
                    <div class="col-md-4">
                      <div class="form-floating">
                        <input type="text" class="form-control rounded-3" id="regionInput" [(ngModel)]="editUser.adresse.region" name="region" placeholder="Région">
                        <label for="regionInput">Région (Gouvernorat)</label>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-floating">
                        <input type="text" class="form-control rounded-3" id="cityInput" [(ngModel)]="editUser.adresse.ville" name="ville" placeholder="Ville">
                        <label for="cityInput">Ville (Délégation)</label>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-floating">
                        <input type="text" class="form-control rounded-3" id="zipInput" [(ngModel)]="editUser.adresse.codePostal" name="codePostal" placeholder="Code Postal">
                        <label for="zipInput">Code Postal</label>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Country Field (only for TRE) -->
                  <ng-container *ngIf="editUser.isTRE">
                    <div class="col-12">
                       <hr class="text-muted opacity-25 my-2">
                       <h6 class="fw-bold mb-3 d-flex align-items-center"><i class="bi bi-globe me-2"></i>Tunisien à l'étranger</h6>
                    </div>
                    <div class="col-md-12">
                      <div class="form-floating">
                        <select class="form-select rounded-3 h-auto py-3" id="countryInput" [(ngModel)]="editUser.paysResidence" name="paysResidence">
                          <option *ngFor="let country of countries" [value]="country">{{ country }}</option>
                        </select>
                        <label for="countryInput">Pays de résidence</label>
                      </div>
                    </div>
                  </ng-container>
                  
                  <div class="col-12 mt-5 text-end">
                    <span class="me-3 text-success animate-fade" *ngIf="successMsg">{{ successMsg }}</span>
                    <span class="me-3 text-danger animate-fade" *ngIf="errorMsg">{{ errorMsg }}</span>
                    <button type="submit" class="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm" [disabled]="loading">
                      <span *ngIf="!loading">Enregistrer les modifications</span>
                      <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Tab: Security -->
        <div *ngSwitchCase="'security'" class="fade-in">
           <div class="row g-4">
              <div class="col-lg-6">
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4 p-md-5">
                    <div class="d-flex align-items-center mb-4">
                      <div class="icon-box bg-warning-subtle text-warning rounded-3 p-3 me-3">
                        <i class="bi bi-shield-lock-fill fs-4"></i>
                      </div>
                      <h4 class="fw-bold mb-0">Sécurité du compte</h4>
                    </div>
                    <p class="text-muted mb-4 small">Modifiez votre mot de passe régulièrement pour assurer la sécurité de vos données.</p>
                    
                    <form (submit)="onChangePassword()">
                      <div class="mb-3">
                        <label class="form-label fw-bold small text-uppercase ls-1">Mot de passe actuel</label>
                        <input type="password" class="form-control py-3 bg-light border-0 rounded-3" [(ngModel)]="passwordData.currentPassword" name="currentPassword">
                      </div>
                      <div class="mb-3">
                        <label class="form-label fw-bold small text-uppercase ls-1">Nouveau mot de passe</label>
                        <input type="password" class="form-control py-3 bg-light border-0 rounded-3" [(ngModel)]="passwordData.newPassword" name="newPassword">
                      </div>
                      <div class="mb-4">
                        <label class="form-label fw-bold small text-uppercase ls-1">Confirmer le nouveau mot de passe</label>
                        <input type="password" class="form-control py-3 bg-light border-0 rounded-3" [(ngModel)]="passwordData.confirmPassword" name="confirmPassword">
                      </div>
                      
                      <div class="d-flex align-items-center justify-content-between">
                         <span class="text-success small" *ngIf="pwdSuccessMsg">{{ pwdSuccessMsg }}</span>
                         <span class="text-danger small" *ngIf="pwdErrorMsg">{{ pwdErrorMsg }}</span>
                         <button type="submit" class="btn btn-dark px-4 py-3 rounded-pill fw-bold shadow-sm ms-auto" [disabled]="loading">Modifier le mot de passe</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-6">
                <div class="card border-0 shadow-sm rounded-4 h-100 bg-primary text-white overflow-hidden position-relative">
                   <div class="card-body p-5 position-relative z-1">
                      <i class="bi bi-fingerprint display-1 opacity-25 mb-4 d-block"></i>
                      <h3 class="fw-bold mb-3">Authentification à deux facteurs</h3>
                      <p class="opacity-75 mb-4">Ajoutez une couche de sécurité supplémentaire en exigeant un code de vérification sur votre téléphone.</p>
                      <button class="btn btn-white text-primary rounded-pill px-4 fw-bold shadow">Bientôt disponible</button>
                   </div>
                   <!-- Decor -->
                   <div class="position-absolute bottom-0 end-0 p-3 opacity-25">
                     <i class="bi bi-shield-check" style="font-size: 15rem; transform: translate(30%, 30%);"></i>
                   </div>
                </div>
              </div>
           </div>
        </div>

        <!-- Tab: Settings -->
        <div *ngSwitchCase="'settings'" class="fade-in">
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-4 p-md-5">
              <h4 class="fw-bold mb-4 d-flex align-items-center"><i class="bi bi-palette me-2"></i> Préférences & Apparence</h4>
              
              <div class="row g-5">
                <!-- Appearance -->
                <div class="col-md-6">
                  <h6 class="fw-bold mb-3 text-uppercase small ls-1 text-primary">Apparence</h6>
                  <div class="p-4 rounded-4 bg-light border transition-all">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                      <div class="d-flex align-items-center">
                        <div class="icon-circle bg-dark text-white me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; border-radius: 50%;">
                           <i class="bi" [ngClass]="currentSettings.darkMode ? 'bi-moon-stars-fill' : 'bi-sun-fill'"></i>
                        </div>
                        <div>
                          <p class="mb-0 fw-bold">{{ translate('dark_mode') }}</p>
                          <small class="text-muted">Passer entre le mode clair et sombre</small>
                        </div>
                      </div>
                      <div class="form-check form-switch p-0 m-0">
                        <input class="form-check-input ms-0" type="checkbox" [ngModel]="currentSettings.darkMode" (ngModelChange)="updateDarkMode($event)">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Language -->
                <div class="col-md-6">
                  <h6 class="fw-bold mb-3 text-uppercase small ls-1 text-primary">Langue de l'interface</h6>
                  <div class="p-4 rounded-4 bg-light border transition-all">
                    <div class="d-flex align-items-center mb-3">
                      <div class="icon-circle bg-info text-white me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; border-radius: 50%;">
                         <i class="bi bi-translate"></i>
                      </div>
                      <div class="flex-grow-1">
                        <select class="form-select border-0 bg-transparent fw-bold" [ngModel]="currentSettings.language" (ngModelChange)="updateLanguage($event)">
                          <option value="fr">Français (Tunisie)</option>
                          <option value="en">English (United States)</option>
                          <option value="ar">العربية (تونس)</option>
                        </select>
                        <small class="text-muted">Choisissez votre langue préférée</small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="col-12">
                   <div class="alert alert-info border-0 rounded-4 d-flex align-items-center">
                      <i class="bi bi-info-circle-fill fs-4 me-3"></i>
                      <div>
                        Les paramètres modifiés sont instantanément enregistrés localement sur cet appareil.
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> <!-- Close tab-content -->
    </ng-container> <!-- Close dataLoaded -->
  </div> <!-- Close profile-page -->
  `,
  styles: [`
    .profile-page { padding: 30px; max-width: 1200px; margin: 0 auto; min-height: 100vh; }
    
    /* Premium Header */
    .profile-header .cover-photo {
      height: 280px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      position: relative;
      overflow: hidden;
    }
    .cover-photo .overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');
      opacity: 0.2;
    }
    .header-content { height: 100%; position: relative; z-index: 2; }
    
    .avatar-large {
      width: 150px;
      height: 150px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      color: #94a3b8;
      overflow: hidden;
    }
    .avatar-large img { width: 100%; height: 100%; object-fit: cover; }
    .edit-avatar { width: 38px; height: 38px; border: none; }
    
    /* Tabs Navigation */
    .profile-nav .btn {
      color: #64748b;
      font-weight: 600;
      border: none;
      padding: 12px 0;
      font-size: 0.95rem;
    }
    .profile-nav .btn:hover { background: #f8fafc; color: #1e293b; }
    .profile-nav .btn.active {
      background: #3b82f6 !important;
      color: white !important;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    /* Stats & Info */
    .stat-card { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .stat-card:hover { transform: translateY(-8px); }
    .icon-box { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; }
    .ls-1 { letter-spacing: 0.5px; }
    
    /* Forms */
    .form-floating > .form-control:focus, .form-floating > .form-control:not(:placeholder-shown) {
      padding-top: 1.625rem;
      padding-bottom: 0.625rem;
    }
    .form-control { border: 1px solid #e2e8f0; }
    .form-control:focus { box-shadow: 0 0 0 3px rgba(59,130,246,0.1); border-color: #3b82f6; }
    
    .btn-white { background: white; color: #3b82f6; border: none; }
    .btn-white:hover { background: #f8fafc; }
    
    /* Switches */
    .form-switch .form-check-input { width: 3em; height: 1.5em; cursor: pointer; }
    
    .animate-fade { animation: fadeIn 0.4s ease-out; }
    .fade-in { animation: fadeIn 0.6s ease-out; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    [dir="rtl"] .me-4 { margin-left: 1.5rem !important; margin-right: 0 !important; }
    [dir="rtl"] .ms-auto { margin-right: auto !important; margin-left: 0 !important; }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: any = null;
  currentSettings: UserSettings = { darkMode: false, language: 'fr' };
  activeTab: string = 'overview';
  loading: boolean = false;
  dataLoaded: boolean = false;

  // Data for overview
  userStats: any[] = [];
  userFullInfo: any[] = [];
  recentActivities: any[] = [];

  // Data for editing
  editUser: any = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    isTRE: false,
    paysResidence: '',
    adresse: { ville: '', region: '', codePostal: '' }
  };
  countries: string[] = [
    'France', 'Italie', 'Allemagne', 'Canada', 'USA', 'Émirats Arabes Unis',
    'Qatar', 'Arabie Saoudite', 'Belgique', 'Suisse', 'Royaume-Uni',
    'Espagne', 'Pays-Bas', 'Suède', 'Libye', 'Algérie', 'Maroc', 'Égypte',
    'Turquie', 'Koweït', 'Oman', 'Autre'
  ].sort();

  // Password data
  passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };

  // Messages
  successMsg: string = '';
  errorMsg: string = '';
  pwdSuccessMsg: string = '';
  pwdErrorMsg: string = '';

  tabs = [
    { id: 'overview', icon: 'bi-grid-fill', labelKey: 'dashboard' },
    { id: 'edit', icon: 'bi-person-gear', labelKey: 'personal_info' },
    { id: 'security', icon: 'bi-shield-lock-fill', labelKey: 'security' },
    { id: 'settings', icon: 'bi-gear-fill', labelKey: 'settings' }
  ];

  private subscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private reclamationService: ReclamationService,
    private settingsService: SettingsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Sync Settings
    this.subscription.add(
      this.settingsService.settings$.subscribe(settings => {
        this.currentSettings = settings;
        this.cdr.detectChanges();
      })
    );

    // Sync Profile
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        console.log('👤 Profile Component - Received User:', user);
        if (user) {
          this.user = { ...user };
          this.initEditData(this.user);
          this.loadStats(this.user);
          this.prepareInfoGrid(this.user);
          this.dataLoaded = true;
          this.cdr.detectChanges();
        }
      })
    );

    // If not emitting yet, try to fetch it manually
    this.authService.getProfile().subscribe({
      next: (user) => {
        if (user) {
          this.user = { ...user };
          this.initEditData(this.user);
          this.loadStats(this.user);
          this.prepareInfoGrid(this.user);
          this.dataLoaded = true;
          this.cdr.detectChanges();
        }
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('📸 File selected:', file.name, file.size);
      this.loading = true;
      this.authService.uploadPhoto(file).subscribe({
        next: (res) => {
          console.log('✅ Upload success:', res);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Upload error:', err);
          this.loading = false;
          this.errorMsg = "Erreur lors de l'envoi de l'image";
          this.cdr.detectChanges();
        }
      });
    }
  }

  initEditData(user: any) {
    if (!user) return;
    this.editUser = {
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      telephone: user.telephone || '',
      isTRE: !!user.isTRE,
      paysResidence: user.paysResidence || '',
      adresse: {
        ville: user.adresse?.ville || '',
        region: user.adresse?.region || '',
        codePostal: user.adresse?.codePostal || ''
      }
    };
  }

  loadStats(user: any) {
    forkJoin({
      reclamations: this.reclamationService.getMyReclamations()
    }).subscribe({
      next: (res: any) => {
        const recs = res.reclamations || [];
        this.userStats = [
          { labelKey: 'Total Réclamations', icon: 'bi-file-earmark-text', value: recs.length, color: '#3b82f6' },
          { labelKey: 'En Cours', icon: 'bi-lightning-charge', value: recs.filter((r: any) => r.statut !== 'resolue' && r.statut !== 'rejete').length, color: '#f59e0b' },
          { labelKey: 'Résolues', icon: 'bi-check2-circle', value: recs.filter((r: any) => r.statut === 'resolue').length, color: '#10b981' }
        ];

        // Mock recent activity based on reclamations
        this.recentActivities = recs.slice(0, 3).map((r: any) => ({
          title: r.description,
          type: r.secteur,
          date: r.dateCreation
        }));

        this.cdr.detectChanges();
      }
    });
  }

  prepareInfoGrid(user: any) {
    this.userFullInfo = [
      { label: 'Prénom', value: user.prenom },
      { label: 'Nom', value: user.nom },
      { label: 'Email', value: user.email },
      { label: 'Téléphone', value: user.telephone },
      { label: 'CIN', value: user.cin }
    ];

    if (user.isTRE) {
      this.userFullInfo.push({ label: 'Pays de résidence', value: user.paysResidence });
    } else {
      this.userFullInfo.push({ label: 'Région', value: user.adresse?.region });
      this.userFullInfo.push({ label: 'Ville', value: user.adresse?.ville });
      this.userFullInfo.push({ label: 'Code Postal', value: user.adresse?.codePostal });
    }

    this.userFullInfo.push({
      label: 'Type de compte',
      value: user.isTRE ? 'Tunisien à l\'étranger' : 'Résident en Tunisie'
    });
  }

  onUpdateProfile() {
    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';

    this.authService.updateProfile(this.editUser).subscribe({
      next: (res) => {
        this.successMsg = 'Profil mis à jour avec succès !';
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err.error?.msg || 'Erreur lors de la mise à jour';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onChangePassword() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.pwdErrorMsg = 'Les nouveaux mots de passe ne correspondent pas';
      return;
    }

    this.loading = true;
    this.pwdSuccessMsg = '';
    this.pwdErrorMsg = '';

    this.authService.changePassword(this.passwordData).subscribe({
      next: (res) => {
        this.pwdSuccessMsg = 'Mot de passe modifié avec succès !';
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.pwdSuccessMsg = '', 3000);
      },
      error: (err) => {
        this.pwdErrorMsg = err.error?.msg || 'Erreur lors de la modification';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateDarkMode(value: boolean) {
    this.settingsService.updateSettings({ darkMode: value });
  }

  updateLanguage(value: 'fr' | 'en' | 'ar') {
    this.settingsService.updateSettings({ language: value });
  }

  translate(key: string): string {
    const val = this.settingsService.getTranslation(key);
    // Fallback if not in keys
    return val === key ? key.replace('_', ' ') : val;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
