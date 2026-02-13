import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UserSettings {
    darkMode: boolean;
    language: 'fr' | 'en' | 'ar';
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private defaultSettings: UserSettings = {
        darkMode: false,
        language: 'fr'
    };

    private settingsSubject = new BehaviorSubject<UserSettings>(this.loadSettings());
    settings$ = this.settingsSubject.asObservable();

    constructor() {
        this.applyTheme(this.settingsSubject.value.darkMode);
    }

    private loadSettings(): UserSettings {
        const saved = localStorage.getItem('user_settings');
        return saved ? JSON.parse(saved) : this.defaultSettings;
    }

    updateSettings(updates: Partial<UserSettings>) {
        const newSettings = { ...this.settingsSubject.value, ...updates };
        this.settingsSubject.next(newSettings);
        localStorage.setItem('user_settings', JSON.stringify(newSettings));

        if (updates.darkMode !== undefined) {
            this.applyTheme(updates.darkMode);
        }
    }

    private applyTheme(isDark: boolean) {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-theme');
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.body.classList.remove('dark-theme');
        }
    }

    get currentSettings(): UserSettings {
        return this.settingsSubject.value;
    }

    // Simple Translation Helper
    getTranslation(key: string, lang: string = this.settingsSubject.value.language): string {
        const translations: any = {
            fr: {
                dashboard: 'Tableau de Bord',
                profile: 'Profil',
                reclamations: 'Réclamations',
                settings: 'Paramètres',
                logout: 'Déconnexion',
                welcome: 'Bienvenue',
                personal_info: 'Coordonnées Personnelles',
                preferences: 'Préférences & Paramètres',
                dark_mode: 'Mode Sombre',
                language: 'Langue'
            },
            en: {
                dashboard: 'Dashboard',
                profile: 'Profile',
                reclamations: 'Complaints',
                settings: 'Settings',
                logout: 'Logout',
                welcome: 'Welcome',
                personal_info: 'Personal Information',
                preferences: 'Preferences & Settings',
                dark_mode: 'Dark Mode',
                language: 'Language'
            },
            ar: {
                dashboard: 'لوحة القيادة',
                profile: 'الملف الشخصي',
                reclamations: 'الشكاوى',
                settings: 'الإعدادات',
                logout: 'تسجيل الخروج',
                welcome: 'مرحباً',
                personal_info: 'المعلومات الشخصية',
                preferences: 'التفضيلات والإعدادات',
                dark_mode: 'الوضع الليلي',
                language: 'اللغة'
            }
        };
        return translations[lang]?.[key] || key;
    }
}
