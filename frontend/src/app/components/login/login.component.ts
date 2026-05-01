import { Component } from '@angular/core';
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
      private route: ActivatedRoute
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
    if (!this.credentials.identifier || !this.credentials.password) {
        this.error = 'Veuillez remplir tous les champs';
        return;
    }

    this.error = '';
    this.credentials.identifier = this.credentials.identifier.trim();
    // No trimming for password to allow spaces if intended
    const passwordToSend = this.credentials.password;

    console.log('📡 Attempting login for:', this.credentials.identifier);

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
      }
    });
  }
  socialLogin(platform: string) {
    console.log(`Redirecting to ${platform} auth...`);
    window.location.href = `http://localhost:5000/auth/${platform}`;
  }
}
