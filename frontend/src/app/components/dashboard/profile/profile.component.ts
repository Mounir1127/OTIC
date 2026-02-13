import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { SettingsService, UserSettings } from '../../../services/settings.service';
import { Subscription } from 'rxjs';

@Component({
   selector: 'app-profile',
   standalone: true,
   imports: [CommonModule, FormsModule],
   template: `
    <div class="row justify-content-center fade-in pb-5" [dir]="currentSettings.language === 'ar' ? 'rtl' : 'ltr'">
      <div class="col-lg-9 col-xl-8">
        <div class="card shadow-lg border-0 rounded-4 overflow-hidden mb-4">
          
          <!-- Header / Cover -->
          <div class="card-header premium-header border-0 pt-5 pb-0 text-center position-relative">
             <div class="position-relative d-inline-block">
                <div class="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto border border-4 border-white shadow-md profile-avatar">
                    <i class="bi bi-person-fill text-secondary" style="font-size: 3.5rem;"></i>
                </div>
                <span class="position-absolute bottom-0 end-0 badge rounded-pill bg-success border border-2 border-white p-2">
                    <span class="visually-hidden">Active</span>
                </span>
             </div>
             
             <div class="mt-4" *ngIf="user">
                 <h3 class="fw-bold text-primary mb-1">{{ user.nom }} {{ user.prenom }}</h3>
                 <span class="badge bg-light text-primary px-3 py-2 rounded-pill fw-medium text-uppercase ls-1 border shadow-sm">
                    {{ user.role?.replace('_', ' ') }}
                 </span>
             </div>
          </div>
          
          <!-- Body: Personal Info -->
          <div class="card-body p-4 p-md-5 pt-4" *ngIf="user">
            <div class="row g-4">
               <!-- Section Header -->
               <div class="col-12 mb-2">
                   <h5 class="fw-bold text-dark d-flex align-items-center">
                     <i class="bi bi-person-lines-fill me-2 text-primary" [ngClass]="{'ms-2': currentSettings.language === 'ar'}"></i>
                     {{ translate('personal_info') }}
                   </h5>
                   <hr class="mt-2 mb-0 opacity-10">
               </div>

               <!-- Contact Info -->
               <div class="col-md-6">
                  <div class="p-3 rounded-3 bg-light-subtle border h-100 transition-hover">
                      <div class="d-flex align-items-center mb-1">
                         <small class="text-muted text-uppercase fw-bold" style="font-size: 0.65rem;">Email</small>
                      </div>
                      <div class="d-flex align-items-center">
                        <i class="bi bi-envelope text-primary me-2"></i>
                        <span class="fw-medium text-dark">{{ user.email }}</span>
                      </div>
                  </div>
               </div>

               <div class="col-md-6">
                  <div class="p-3 rounded-3 bg-light-subtle border h-100 transition-hover">
                      <div class="d-flex align-items-center mb-1">
                         <small class="text-muted text-uppercase fw-bold" style="font-size: 0.65rem;">Téléphone</small>
                      </div>
                      <div class="d-flex align-items-center">
                        <i class="bi bi-telephone text-primary me-2"></i>
                        <span class="fw-medium text-dark">{{ user.telephone || 'Non renseigné' }}</span>
                      </div>
                  </div>
               </div>

               <div class="col-12">
                  <div class="p-3 rounded-3 bg-light-subtle border h-100 transition-hover">
                      <div class="d-flex align-items-center mb-1">
                         <small class="text-muted text-uppercase fw-bold" style="font-size: 0.65rem;">Adresse Postale</small>
                      </div>
                      <div class="d-flex align-items-center">
                        <i class="bi bi-geo-alt text-primary me-2"></i>
                        <span class="fw-medium text-dark">
                            {{ user.adresse?.ville || 'Ville' }}, {{ user.adresse?.region || 'Région' }}
                            <small class="text-muted ms-2" *ngIf="user.adresse?.codePostal">({{ user.adresse?.codePostal }})</small>
                        </span>
                      </div>
                  </div>
               </div>
            </div>
          </div>

          <div class="card-footer bg-white p-4 text-center border-0 border-top">
             <button class="btn btn-outline-primary me-2 px-4 shadow-sm">Modifier</button>
             <button class="btn btn-light text-muted px-4">Sécurité</button>
          </div>
        </div>

        <!-- Settings Section -->
        <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
          <div class="card-body p-4 p-md-5">
            <div class="row g-4">
               <div class="col-12 mb-2">
                   <h5 class="fw-bold text-dark d-flex align-items-center">
                     <i class="bi bi-gear-fill me-2 text-primary"></i>
                     {{ translate('preferences') }}
                   </h5>
                   <hr class="mt-2 mb-0 opacity-10">
               </div>

               <!-- Appearance -->
               <div class="col-md-6">
                 <div class="p-3 rounded-3 bg-light-subtle border h-100">
                   <label class="form-label d-flex align-items-center justify-content-between mb-3">
                     <span>{{ translate('dark_mode') }}</span>
                     <div class="form-check form-switch p-0 m-0">
                       <input class="form-check-input ms-0" type="checkbox" [ngModel]="currentSettings.darkMode" (ngModelChange)="updateDarkMode($event)">
                     </div>
                   </label>
                   <p class="small text-muted mb-0">Activez le mode sombre pour reposer vos yeux.</p>
                 </div>
               </div>

               <!-- Language -->
               <div class="col-md-6">
                 <div class="p-3 rounded-3 bg-light-subtle border h-100">
                   <label class="form-label d-flex align-items-center mb-2">
                     <i class="bi bi-globe me-2 text-primary"></i>
                     <span>{{ translate('language') }}</span>
                   </label>
                   <select class="form-select form-select-sm" [ngModel]="currentSettings.language" (ngModelChange)="updateLanguage($event)">
                     <option value="fr">Français</option>
                     <option value="en">Anglais (English)</option>
                     <option value="ar">Arabe (العربية)</option>
                   </select>
                 </div>
               </div>
            </div>
          </div>
          <div class="card-footer bg-light p-3 text-center border-0">
             <small class="text-muted"><i class="bi bi-info-circle me-1"></i>Les paramètres sont enregistrés automatiquement sur cet appareil.</small>
          </div>
        </div>
      </div>
    </div>
  `,
   styles: [`
    .profile-avatar { 
        width: 120px; 
        height: 120px; 
        background: #f8fafc;
        transition: all 0.3s ease;
    }
    [data-theme="dark"] .profile-avatar {
        background: #1e293b;
        border-color: #334155 !important;
    }
    .ls-1 { letter-spacing: 1px; }
    .ls-2 { letter-spacing: 2px; }
    .transition-hover { transition: transform 0.2s, box-shadow 0.2s; }
    .transition-hover:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    .form-switch .form-check-input { width: 2.5em; height: 1.25em; cursor: pointer; }
    .form-check-input:checked { background-color: var(--accent-color); border-color: var(--accent-color); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    [dir="rtl"] .bi { transform: scaleX(-1); }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
   user: any = {};
   currentSettings: UserSettings = { darkMode: false, language: 'fr' };
   private subscription: Subscription = new Subscription();

   constructor(
      private authService: AuthService,
      private cdr: ChangeDetectorRef,
      private settingsService: SettingsService
   ) { }

   ngOnInit(): void {
      this.subscription.add(
         this.settingsService.settings$.subscribe(settings => {
            this.currentSettings = settings;
            this.cdr.detectChanges();
         })
      );

      this.authService.getProfile().subscribe({
         next: (data) => {
            this.user = data;
            this.cdr.detectChanges();
         },
         error: (err) => { console.error('❌ Profile Fetch Error:', err); }
      });
   }

   ngOnDestroy(): void {
      this.subscription.unsubscribe();
   }

   updateDarkMode(value: boolean) {
      this.settingsService.updateSettings({ darkMode: value });
   }

   updateLanguage(value: 'fr' | 'en' | 'ar') {
      this.settingsService.updateSettings({ language: value });
   }

   translate(key: string): string {
      return this.settingsService.getTranslation(key);
   }
}
