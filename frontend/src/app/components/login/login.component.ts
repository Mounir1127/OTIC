import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  credentials = { identifier: '', password: '' };
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        localStorage.setItem('token', params['token']);
        // Fetch user info to redirect correctly
        this.authService.getProfile().subscribe({
          next: (user: any) => {
            if (user.role === 'super_admin') {
              this.router.navigate(['/dashboard/admin-management']);
            } else if (user.role === 'admin_regional') {
              this.router.navigate(['/dashboard/admin-home']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          },
          error: (err) => {
            console.error('Profile fetch failed after social login:', err);
            this.router.navigate(['/dashboard']);
          }
        });
      }
    });
  }

  login() {
    this.error = '';
    const id = this.credentials.identifier.trim().replace(/\s/g, '');
    const pass = this.credentials.password;

    if (!id || !pass) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }

    // 1. Basic format detection
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id);
    const isNumeric = /^\d+$/.test(id);
    const isInternationalPhone = /^(?:\+216|00216)/.test(id);

    let isValid = false;
    if (isEmail) {
      isValid = true;
    } else if (isNumeric || isInternationalPhone) {
      const cleanDigits = id.replace(/^(?:\+216|00216)/, '');
      if (cleanDigits.length === 8) {
        isValid = true;
      }
    }

    if (!isValid) {
      this.error = 'Identifiant non reconnu (Email, Téléphone ou CIN requis)';
      return;
    }

    if (pass.length < 8) {
      this.error = 'Le mot de passe doit comporter au moins 8 caractères';
      return;
    }

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        console.log('✅ Login successful, user role:', res.user?.role);
        localStorage.setItem('token', res.token);

        // Redirect based on role
        if (res.user && res.user.role === 'super_admin') {
          this.router.navigate(['/dashboard/admin-management']);
        } else if (res.user && res.user.role === 'admin_regional') {
          this.router.navigate(['/dashboard/admin-home']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        console.error('❌ Login error details:', err);
        this.error = err.error?.msg || 'Échec de la connexion. Vérifiez votre connexion internet ou le serveur.';
        // Force detection to avoid any "retard" in UI update
        this.cdr.detectChanges();
      }
    });
  }
  socialLogin(platform: string) {
    console.log(`Redirecting to ${platform} auth...`);
    window.location.href = `http://localhost:5000/auth/${platform}`;
  }
}
