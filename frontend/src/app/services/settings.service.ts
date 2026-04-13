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
                language: 'Langue',
                admin_panel: 'Administration',
                manage_users: 'Utilisateurs',
                add_admin: 'Ajouter Admin',
                security: 'Sécurité',
                assign_reclamations: 'Affecter Réclamation',
                manage_consumers: 'Consommateurs',
                my_reclamations: 'Mes Réclamations',
                all_reclamations: 'Toutes les Réclamations',
                statistics: 'Statistiques',
                status_en_attente: 'En attente',
                status_deposee: 'Déposée',
                status_en_cours: 'En cours',
                status_affectee: 'Affectée au conventionné',
                status_resolue: 'Résolue',
                status_fermee: 'Fermée',
                status_rejete: 'Rejetée',
                status_complement: 'Complément requis',
                mineral_waters: 'Eaux Minérales',
                manage_conventionnes: 'Conventionnés',
                add_conventionne: 'Ajouter Conventionné',
                Messagerie: 'Messagerie'
            },
            en: {
                dashboard: 'Dashboard',
// ... lines skipped ...
                status_fermee: 'Closed',
                status_rejete: 'Rejected',
                status_complement: 'Complement Required',
                mineral_waters: 'Mineral Waters',
                manage_conventionnes: 'Partners / Conventionnés',
                add_conventionne: 'Add Partner',
                Messagerie: 'Internal Chat'
            },
            ar: {
                dashboard: 'لوحة القيادة',
// ... lines skipped ...
                status_fermee: 'مغلقة',
                status_rejete: 'مرفوضة',
                status_complement: 'تكملة الملف',
                mineral_waters: 'المياه المعدنية',
                manage_conventionnes: 'الشركاء المتعاقدون',
                add_conventionne: 'إضافة شريك جديد',
                Messagerie: 'المراسلات'
            }
        };
        return translations[lang]?.[key] || key;
    }
}
