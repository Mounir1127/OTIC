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
                complement_requests: 'Demandes Complément',
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
                status_complement: 'Complément requis'
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
                language: 'Language',
                admin_panel: 'Admin Panel',
                manage_users: 'Users',
                add_admin: 'Add Admin',
                security: 'Security',
                assign_reclamations: 'Assign Complaint',
                complement_requests: 'Complement Requests',
                manage_consumers: 'Consumers',
                my_reclamations: 'My Complaints',
                all_reclamations: 'All Complaints',
                statistics: 'Statistics',
                status_en_attente: 'Pending',
                status_deposee: 'Deposited',
                status_en_cours: 'In Progress',
                status_affectee: 'Assigned to Partner',
                status_resolue: 'Resolved',
                status_fermee: 'Closed',
                status_rejete: 'Rejected',
                status_complement: 'Complement Required'
            },
            ar: {
                dashboard: 'لوحة القيادة',
                profile: 'الملف الشخصي',
                reclamations: 'الشكاوى',
                settings: 'الإعدادات',
                logout: 'تسجيل الخروج',
                welcome: 'أهلاً بك',
                personal_info: 'المعلومات الشخصية',
                preferences: 'التفضيلات والإعدادات',
                dark_mode: 'الوضع الليلي',
                language: 'اللغة',
                admin_panel: 'لوحة التحكم',
                manage_users: 'المستخدمين',
                add_admin: 'إضافة مسؤول',
                security: 'الأمان',
                assign_reclamations: 'توزيع الشكاوى',
                complement_requests: 'طلبات التكملة',
                manage_consumers: 'المستهلكين',
                my_reclamations: 'شكاواي',
                all_reclamations: 'كل الشكاوى',
                statistics: 'الإحصائيات',
                status_en_attente: 'قيد الانتظار',
                status_deposee: 'تم الإيداع',
                status_en_cours: 'قيد المعالجة',
                status_affectee: 'تم التعيين',
                status_resolue: 'تم الحل',
                status_fermee: 'مغلقة',
                status_rejete: 'مرفوضة',
                status_complement: 'تكملة الملف'
            }
        };
        return translations[lang]?.[key] || key;
    }
}
