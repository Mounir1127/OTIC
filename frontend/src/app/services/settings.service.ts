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
                add_brand: 'Ajouter une marque',
                actions: 'Actions',
                marque: 'Marque',
                notes: 'Notes',
                search_brand: 'Rechercher une marque...',
                water_brands_list: 'Liste des eaux minérales',
                Messagerie: 'Messagerie',
                thermal_baths: 'Bains Thermaux',
                thermal_baths_subtitle: 'Découvrez les stations thermales et centres de thalassothérapie en Tunisie.',
                role_super_admin: 'Super Administration',
                role_admin_regional: 'Administration Régionale',
                role_admin_tre: 'Administration Diaspora (TRE)',
                role_user: 'Espace Consommateur',
                account_ready_msg: 'Votre compte est prêt. Un email de bienvenue vous a été envoyé à votre adresse.',
                welcome_subtitle: 'Bienvenue dans votre espace de suivi.',
                total_reclamations: 'Total Réclamations',
                see_all: 'Voir tout',
                in_progress_short: 'En cours',
                waiting_processing: 'En attente de traitement',
                resolved_short: 'Résolues',
                successfully_processed: 'Traitées avec succès',
                recent_activity: 'Activité Récente',
                no_recent_activity: 'Aucune activité récente',
                problem_title: 'Un problème ?',
                problem_subtitle: 'Signalez un dysfonctionnement ou une réclamation en quelques clics.',
                new_reclamation_btn: 'Nouvelle Réclamation'
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
                admin_panel: 'Administration',
                manage_users: 'User Management',
                add_admin: 'Add Admin',
                security: 'Security',
                assign_reclamations: 'Assign Complaint',
                manage_consumers: 'Consumers',
                my_reclamations: 'My Complaints',
                all_reclamations: 'All Complaints',
                statistics: 'Statistics',
                status_en_attente: 'Pending',
                status_deposee: 'Submitted',
                status_en_cours: 'In Progress',
                status_affectee: 'Assigned to Partner',
                status_resolue: 'Resolved',
                status_fermee: 'Closed',
                status_rejete: 'Rejected',
                status_complement: 'Complement Required',
                mineral_waters: 'Mineral Waters',
                manage_conventionnes: 'Partners / Conventionnés',
                add_conventionne: 'Add Partner',
                add_brand: 'Add Brand',
                actions: 'Actions',
                marque: 'Brand',
                notes: 'Notes',
                search_brand: 'Search brand...',
                water_brands_list: 'Mineral Water List',
                Messagerie: 'Internal Chat',
                thermal_baths: 'Thermal Baths',
                thermal_baths_subtitle: 'Discover thermal stations and thalassotherapy centers in Tunisia.',
                role_super_admin: 'Super Administration',
                role_admin_regional: 'Regional Administration',
                role_admin_tre: 'Diaspora Administration (TRE)',
                role_user: 'Consumer Area'
            },
            ar: {
                dashboard: 'لوحة القيادة',
                profile: 'الملف الشخصي',
                reclamations: 'الشكاوى',
                settings: 'الإعدادات',
                logout: 'تسجيل الخروج',
                welcome: 'مرحباً بك',
                personal_info: 'المعلومات الشخصية',
                preferences: 'التفضيلات والإعدادات',
                dark_mode: 'الوضع الليلي',
                language: 'اللغة',
                admin_panel: 'لوحة التحكم',
                manage_users: 'إدارة المستخدمين',
                add_admin: 'إضافة مسؤول',
                security: 'الأمان',
                assign_reclamations: 'توزيع الشكاوى',
                manage_consumers: 'قائمة المستهلكين',
                my_reclamations: 'شكاواي',
                all_reclamations: 'كل الشكاوى',
                statistics: 'الإحصائيات',
                status_en_attente: 'في الانتظار',
                status_deposee: 'مرسلة',
                status_en_cours: 'قيد المعالجة',
                status_affectee: 'تم توجيهها للشريك',
                status_resolue: 'تم حلها',
                status_fermee: 'مغلقة',
                status_rejete: 'مرفوضة',
                status_complement: 'تكملة الملف',
                mineral_waters: 'المياه المعدنية',
                manage_conventionnes: 'الشركاء المتعاقدون',
                add_conventionne: 'إضافة شريك جديد',
                add_brand: 'إضافة علامة تجارية',
                actions: 'إجراءات',
                marque: 'العلامة التجارية',
                notes: 'ملاحظات',
                search_brand: 'بحث عن علامة...',
                water_brands_list: 'قائمة المياه المعدنية',
                Messagerie: 'المراسلات',
                thermal_baths: 'الحمامات الاستشفائية',
                thermal_baths_subtitle: 'استكشف المحطات الاستشفائية ومراكز العلاج بمياه البحر في تونس.',
                role_super_admin: 'الإدارة العامة',
                role_admin_regional: 'الإدارة الجهوية',
                role_admin_tre: 'إدارة التونسيين بالخارج',
                role_user: 'فضاء المستهلك'
            }
        };
        return translations[lang]?.[key] || key;
    }
}
