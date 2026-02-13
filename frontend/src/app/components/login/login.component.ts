import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light-subtle py-5">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-5 col-lg-4">
            
            <div class="text-center mb-4 fade-in-up">
              <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-lg" style="width: 64px; height: 64px;">
                <i class="bi bi-shield-lock-fill fs-2"></i>
              </div>
              <h2 class="fw-bold text-primary">Connexion</h2>
              <p class="text-muted">Accédez à votre espace consommateur</p>
            </div>

            <div class="card shadow-lg border-0 rounded-4 fade-in-up delay-100">
              <div class="card-body p-4 p-md-5">
                
                <div *ngIf="error" class="alert alert-danger d-flex align-items-center mb-4 border-0 rounded-3 shadow-sm bg-danger-subtle text-danger">
                  <i class="bi bi-exclamation-octagon-fill me-2 lead"></i>
                  <div>{{ error }}</div>
                </div>

                <form (ngSubmit)="login()">
                  <div class="mb-4">
                    <label class="form-label text-uppercase small fw-bold text-muted ls-1">Email ou Téléphone</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-end-0 text-muted ps-3"><i class="bi bi-person"></i></span>
                        <input type="text" class="form-control bg-light border-start-0 py-3" [(ngModel)]="credentials.identifier" name="identifier" required placeholder="votre@email.com">
                    </div>
                  </div>
                  
                  <div class="mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <label class="form-label text-uppercase small fw-bold text-muted ls-1 mb-0">Mot de passe</label>
                        <a href="#" class="small text-decoration-none fw-medium">Oublié ?</a>
                    </div>
                    <div class="input-group">
                        <span class="input-group-text bg-light border-end-0 text-muted ps-3"><i class="bi bi-key"></i></span>
                        <input type="password" class="form-control bg-light border-start-0 py-3" [(ngModel)]="credentials.password" name="password" required placeholder="••••••••">
                    </div>
                  </div>

                  <button type="submit" class="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm mb-3 text-uppercase ls-1 btn-hover-rise">
                    Se Connecter
                  </button>

                  <div class="text-center">
                    <span class="text-muted small">Pas encore de compte ?</span>
                    <a routerLink="/register" class="text-primary fw-bold text-decoration-none ms-1">Créer un compte</a>
                  </div>
                </form>
              </div>
            </div>

            <div class="text-center mt-4 text-muted small">
              &copy; 2026 OTIC Tunisie. Tous droits réservés.
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-light-subtle { background-color: #f1f5f9; }
    .ls-1 { letter-spacing: 1px; }
    .btn-hover-rise { transition: transform 0.2s, box-shadow 0.2s; }
    .btn-hover-rise:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2) !important; }
    .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; transform: translateY(20px); }
    .delay-100 { animation-delay: 0.1s; }
    @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
  `]
})
export class LoginComponent {
  credentials = { identifier: '', password: '' };
  error = '';

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    this.credentials.identifier = this.credentials.identifier.trim();
    this.credentials.password = this.credentials.password.trim();
    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);

        // Redirect based on role
        if (res.user && res.user.role === 'super_admin') {
          this.router.navigate(['/dashboard/admin-management']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.error = err.error?.msg || 'Échec de la connexion';
      }
    });
  }
}
