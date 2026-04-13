import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="auth-wrapper fade-in">
        <div class="auth-card shadow-lg rounded-4 overflow-hidden d-flex">
            <!-- Left Side: Visual -->
            <div class="auth-visual d-none d-lg-flex flex-column justify-content-center p-5 text-white">
                <div class="blob-shape"></div>
                <div class="position-relative z-1">
                    <h2 class="display-6 fw-bold mb-3">Sécurité OTIC</h2>
                    <p class="opacity-75 fs-5">Protection de vos données et accès simplifié à votre espace personnel.</p>
                </div>
            </div>

            <!-- Right Side: Form -->
            <div class="auth-form-side p-5 bg-white">
                <div class="text-center mb-5">
                    <div class="auth-icon-box mb-3 mx-auto">
                        <i class="bi bi-shield-lock-fill text-primary"></i>
                    </div>
                    <h3 class="fw-bold text-dark">{{ getTitle() }}</h3>
                    <p class="text-muted small">{{ getSubtitle() }}</p>
                </div>

                <!-- Step 1: Request Reset Link -->
                <div *ngIf="step === 'request'" class="animate-slide-in">
                    <div class="mb-4">
                        <label class="form-label fw-bold small text-uppercase ls-1">Votre adresse email</label>
                        <div class="input-group">
                            <span class="input-group-text bg-light border-end-0"><i class="bi bi-envelope text-muted"></i></span>
                            <input type="email" class="form-control bg-light border-start-0 py-3" 
                                   [(ngModel)]="email" placeholder="nom@exemple.com">
                        </div>
                    </div>

                    <div *ngIf="error" class="alert alert-danger border-0 rounded-3 py-2 small mb-4">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i> {{ error }}
                    </div>

                    <button class="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm" (click)="sendResetLink()">
                        Envoyer le lien
                    </button>
                    
                    <a routerLink="/login" class="btn btn-link w-100 mt-3 text-decoration-none text-muted small">
                         Retour à la connexion
                    </a>
                </div>

                <!-- Step 2: Email Sent Success -->
                <div *ngIf="step === 'sent'" class="text-center animate-fade-in">
                    <div class="success-icon mb-4">
                        <i class="bi bi-send-check text-primary"></i>
                    </div>
                    <h4 class="fw-bold">Lien envoyé !</h4>
                    <p class="text-muted">Nous avons envoyé votre accès à <strong>{{ email }}</strong>.</p>
                    <p class="small text-muted mb-4 opacity-75">S'il n'apparaît pas, vérifiez vos spams.</p>
                    <button (click)="step = 'request'" class="btn btn-outline-primary w-100 py-3 rounded-pill fw-bold">Réessayer</button>
                    <a routerLink="/login" class="btn btn-link w-100 mt-3 text-decoration-none text-muted small">Retour à la connexion</a>
                </div>

                <!-- Step 3: Enter New Password (from link) -->
                <div *ngIf="step === 'reset'" class="animate-slide-in">
                    <div class="mb-4">
                        <label class="form-label fw-bold small text-uppercase ls-1">Nouveau mot de passe</label>
                        <div class="input-group">
                            <span class="input-group-text bg-light border-end-0"><i class="bi bi-key text-muted"></i></span>
                            <input type="password" class="form-control bg-light border-start-0 py-3" 
                                   [(ngModel)]="newPassword" placeholder="••••••••">
                        </div>
                    </div>

                    <div *ngIf="error" class="alert alert-danger border-0 rounded-3 py-2 small mb-4">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i> {{ error }}
                    </div>

                    <button class="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm" (click)="confirmReset()">
                        Changer le mot de passe
                    </button>
                </div>

                <!-- Step 4: Final Success (Optimistic) -->
                <div *ngIf="step === 'done'" class="text-center animate-fade-in">
                    <div class="success-round mb-4">
                        <i class="bi bi-check-lg"></i>
                    </div>
                    <h4 class="fw-bold">Mot de passe mis à jour !</h4>
                    <p class="text-muted mb-4">Votre mot de passe a été changé instantanément.</p>
                    <button routerLink="/login" class="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm">Se connecter</button>
                </div>
            </div>
        </div>
    </div>
    `,
    styles: [`
        .auth-wrapper { min-height: 100vh; background: #f1f5f9; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .auth-card { width: 100%; max-width: 1000px; min-height: 600px; background: white; }
        .auth-visual { flex: 1; background: linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%); position: relative; overflow: hidden; }
        .blob-shape { position: absolute; top: -20%; right: -20%; width: 300px; height: 300px; background: rgba(59, 130, 246, 0.2); border-radius: 50%; filter: blur(50px); }
        .auth-form-side { flex: 1.2; display: flex; flex-direction: column; justify-content: center; }
        .auth-icon-box { width: 70px; height: 70px; background: rgba(37, 99, 235, 0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2rem; }
        .success-icon { font-size: 5rem; line-height: 1; }
        .success-round { width: 80px; height: 80px; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin: 0 auto; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3); }
        .ls-1 { letter-spacing: 1px; }
        .fade-in { animation: fadeIn 0.8s ease-out; }
        .animate-slide-in { animation: slideIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    `]
})
export class ForgotPasswordComponent implements OnInit {
    step: 'request' | 'sent' | 'reset' | 'done' = 'request';
    email = '';
    newPassword = '';
    error = '';
    isSubmitting = false;
    tokenFromUrl = '';

    constructor(
        private authService: AuthService, 
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['token'] && params['email']) {
                this.email = params['email'];
                this.tokenFromUrl = params['token'];
                this.step = 'reset';
            }
        });
    }

    getTitle() {
        if (this.step === 'reset') return 'Nouveau mot de passe';
        if (this.step === 'done') return 'Succès';
        return 'Réinitialisation';
    }

    getSubtitle() {
        if (this.step === 'reset') return 'Veuillez saisir votre nouveau mot de passe sécurisé.';
        if (this.step === 'sent') return 'Vérification en cours...';
        return 'Entrez votre email pour recevoir le lien.';
    }

    sendResetLink() {
        if (!this.email) {
            this.error = "Veuillez saisir votre email";
            return;
        }
        this.step = 'sent';
        this.error = '';
        this.authService.forgotPassword(this.email).subscribe({
            next: () => console.log('Reset link sent'),
            error: (err) => {
                this.error = "Email introuvable ou erreur réseau.";
                this.step = 'request';
            }
        });
    }

    confirmReset() {
        if (!this.newPassword) {
            this.error = "Veuillez saisir un mot de passe";
            return;
        }
        
        // Changement Instantané
        this.step = 'done';
        this.error = '';

        this.authService.resetPassword({
            email: this.email,
            code: this.tokenFromUrl,
            newPassword: this.newPassword
        }).subscribe({
            next: () => console.log('Password reset successful'),
            error: (err) => {
                this.error = "Le lien a expiré ou une erreur est survenue.";
                this.step = 'reset';
            }
        });
    }
}
