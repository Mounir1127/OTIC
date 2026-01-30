import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    user = { username: '', email: '', password: '' };
    error = '';

    constructor(private authService: AuthService, private router: Router) { }

    register() {
        this.authService.register(this.user).subscribe({
            next: (res) => {
                // Save token and login immediately, or redirect to login
                localStorage.setItem('token', res.token);
                this.router.navigate(['/']);
            },
            error: (err) => {
                this.error = err.error.msg || 'Registration failed';
            }
        });
    }
}
