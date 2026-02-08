import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
   selector: 'app-profile',
   standalone: true,
   imports: [CommonModule],
   template: `
    <div class="row justify-content-center fade-in">
      <div class="col-lg-9 col-xl-8">
        <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
          
          <!-- Header / Cover -->
          <div class="card-header bg-white border-0 pt-5 pb-0 text-center position-relative">
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
          
          <!-- Body -->
          <div class="card-body p-4 p-md-5" *ngIf="user">
            <div class="row g-4 justify-content-center">
               
               <!-- Section Header -->
               <div class="col-12 text-center mb-2">
                   <h6 class="text-uppercase text-muted fw-bold small ls-2 position-relative d-inline-block section-title">
                        Coordonnées
                   </h6>
               </div>

               <!-- Contact Info -->
               <div class="col-md-6">
                  <div class="p-3 rounded-3 bg-light-subtle border h-100 transition-hover">
                      <div class="d-flex align-items-center mb-2">
                         <div class="icon-box bg-white text-primary rounded-circle shadow-sm p-2 me-3">
                            <i class="bi bi-envelope fs-5"></i>
                         </div>
                         <small class="text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">Email</small>
                      </div>
                      <div class="ps-5">
                        <span class="fw-medium text-dark">{{ user.email }}</span>
                      </div>
                  </div>
               </div>

               <div class="col-md-6">
                  <div class="p-3 rounded-3 bg-light-subtle border h-100 transition-hover">
                      <div class="d-flex align-items-center mb-2">
                         <div class="icon-box bg-white text-primary rounded-circle shadow-sm p-2 me-3">
                            <i class="bi bi-telephone fs-5"></i>
                         </div>
                         <small class="text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">Téléphone</small>
                      </div>
                      <div class="ps-5">
                        <span class="fw-medium text-dark">{{ user.telephone }}</span>
                      </div>
                  </div>
               </div>

               <div class="col-12">
                  <div class="p-3 rounded-3 bg-light-subtle border h-100 transition-hover">
                      <div class="d-flex align-items-center mb-2">
                         <div class="icon-box bg-white text-primary rounded-circle shadow-sm p-2 me-3">
                            <i class="bi bi-geo-alt fs-5"></i>
                         </div>
                         <small class="text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">Adresse Postale</small>
                      </div>
                      <div class="ps-5">
                        <span class="fw-medium text-dark d-block">
                            {{ user.adresse?.ville || 'Ville non renseignée' }}, {{ user.adresse?.region || 'Région non renseignée' }}
                        </span>
                        <small class="text-muted" *ngIf="user.adresse?.codePostal">Code Postal: {{ user.adresse?.codePostal }}</small>
                      </div>
                  </div>
               </div>

            </div>
          </div>


          
          <!-- Footer -->
          <div class="card-footer bg-white p-4 text-center border-0">
             <button class="btn btn-outline-primary me-2 px-4 shadow-sm">Modifier</button>
             <button class="btn btn-light text-muted px-4">Sécurité</button>
          </div>
        </div>
      </div>
    </div>
  `,
   styles: [`
    .profile-avatar { width: 120px; height: 120px; background: #f8fafc; }
    .ls-1 { letter-spacing: 1px; }
    .ls-2 { letter-spacing: 2px; }
    .bg-light-subtle { background-color: #f8fafc; }
    .transition-hover { transition: transform 0.2s, box-shadow 0.2s; }
    .transition-hover:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); background: white; }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProfileComponent implements OnInit {
   user: any = {};

   constructor(private authService: AuthService) { }

   ngOnInit(): void {
      this.authService.getProfile().subscribe({
         next: (data) => { this.user = data; },
         error: (err) => { console.error(err); }
      });
   }
}
