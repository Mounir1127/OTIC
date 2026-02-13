import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';

@Component({
    selector: 'app-security-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './security-settings.component.html',
    styleUrls: ['./security-settings.component.css']
})
export class SecuritySettingsComponent {
    passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    pwdSuccessMsg = '';
    pwdErrorMsg = '';

    constructor(private authService: AuthService) { }

    onSubmitPasswordChange() {
        if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
            this.pwdErrorMsg = 'Les nouveaux mots de passe ne correspondent pas';
            return;
        }

        this.authService.changePassword({
            currentPassword: this.passwordData.currentPassword,
            newPassword: this.passwordData.newPassword
        }).subscribe({
            next: (res) => {
                this.pwdSuccessMsg = 'Mot de passe modifié avec succès !';
                this.pwdErrorMsg = '';
                this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
            },
            error: (err) => {
                this.pwdErrorMsg = err.error.msg || 'Erreur lors de la modification';
                this.pwdSuccessMsg = '';
            }
        });
    }
}
