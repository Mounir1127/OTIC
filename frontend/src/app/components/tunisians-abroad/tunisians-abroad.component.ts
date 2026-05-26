import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface ComplaintCategory {
  id: string;
  title: string;
  icon: string;
  desc: string;
  stats: string;
  urgent?: boolean;
}

interface FAQ {
  q: string;
  a: string;
}

interface DashboardStat {
  title: string;
  value: string;
  icon: string;
  trend: string;
}

@Component({
  selector: 'app-tunisians-abroad',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './tunisians-abroad.component.html',
  styleUrls: ['./tunisians-abroad.component.css']
})
export class TunisiansAbroadComponent implements OnInit {

  currentLang: 'fr' | 'ar' = 'fr';

  // =========================
  // BIG DATA DASHBOARD
  // =========================
  dashboardStats: DashboardStat[] = [
    {
      title: 'Réclamations Traitées',
      value: '128,540',
      icon: 'bi-bar-chart-fill',
      trend: '+18%'
    },
    {
      title: 'Tunisiens Assistés',
      value: '94,200',
      icon: 'bi-people-fill',
      trend: '+25%'
    },
    {
      title: 'Pays Connectés',
      value: '42',
      icon: 'bi-globe-europe-africa',
      trend: '+8%'
    },
    {
      title: 'IA Accuracy',
      value: '97%',
      icon: 'bi-cpu-fill',
      trend: '+12%'
    }
  ];

  // =========================
  // ANALYTICS DATA
  // =========================
  analytics = {
    topCountries: [
      { country: 'France', complaints: 5420 },
      { country: 'Italie', complaints: 3120 },
      { country: 'Allemagne', complaints: 2210 },
      { country: 'Canada', complaints: 1980 },
      { country: 'Qatar', complaints: 1200 }
    ],

    monthlyReports: [
      { month: 'Jan', value: 1200 },
      { month: 'Fév', value: 1800 },
      { month: 'Mars', value: 2500 },
      { month: 'Avr', value: 3100 },
      { month: 'Mai', value: 4200 }
    ]
  };

  // =========================
  // TRANSLATIONS
  // =========================
  translations = {

    fr: {

      heroTitle: 'OTIC Smart Platform',
      heroSubtitle:
        'Plateforme intelligente de protection des consommateurs tunisiens à l’étranger utilisant IA, Big Data et Analyse Prédictive.',

      categoriesTitle: 'Services Intelligents',
      categoriesSubtitle:
        'Déclarez vos réclamations et profitez des analyses avancées OTIC.',

      faqTitle: 'Centre d’Aide',
      faqSubtitle:
        'Informations officielles et assistance intelligente.',

      dashboardTitle: 'Statistiques Nationales',
      dashboardSubtitle:
        'Analyse en temps réel des données des Tunisiens à l’étranger.',

      langSwitch: 'العربية',

      categories: <ComplaintCategory[]>[
        {
          id: 'transfers',
          title: 'Transferts Bancaires',
          icon: 'bi-bank2',
          desc: 'Analyse intelligente des retards et frais bancaires.'
        },
        {
          id: 'luggage',
          title: 'Bagages & Aéroports',
          icon: 'bi-luggage-fill',
          desc: 'Suivi IA des pertes et incidents de voyage.',
          urgent: true
        },
        {
          id: 'tourism',
          title: 'Tourisme',
          icon: 'bi-airplane-fill',
          desc: 'Protection contre les fraudes touristiques.'
        },
        {
          id: 'fraud',
          title: 'Fraude Commerciale',
          icon: 'bi-shield-lock-fill',
          desc: 'Détection automatique des arnaques et abus.',
          urgent: true
        },
        {
          id: 'admin',
          title: 'Services Administratifs',
          icon: 'bi-file-earmark-lock2-fill',
          desc: 'Assistance pour consulats et documents officiels.'
        },
        {
          id: 'investment',
          title: 'Investissements TRE',
          icon: 'bi-graph-up-arrow',
          desc: 'Accompagnement des investissements tunisiens.'
        }
      ],

      faqs: <FAQ[]>[
        {
          q: 'Comment fonctionne l’IA OTIC ?',
          a: 'Le système analyse les réclamations via Big Data afin de détecter automatiquement les problèmes récurrents.'
        },
        {
          q: 'Puis-je suivre ma réclamation ?',
          a: 'Oui, chaque utilisateur dispose d’un tableau de bord intelligent avec notifications en temps réel.'
        },
        {
          q: 'Les données sont-elles sécurisées ?',
          a: 'Oui, la plateforme utilise JWT, chiffrement AES et authentification sécurisée.'
        }
      ],


      ctaLogin: 'Connexion',
      ctaRegister: 'Créer un compte'
    },

    ar: {

      heroTitle: 'منصة OTIC الذكية',

      heroSubtitle:
        'منصة ذكية لحماية المستهلكين التونسيين بالخارج باستعمال الذكاء الاصطناعي وتحليل البيانات الضخمة.',

      categoriesTitle: 'الخدمات الذكية',

      categoriesSubtitle:
        'قم بتقديم شكواك والاستفادة من خدمات التحليل الذكي.',

      faqTitle: 'مركز المساعدة',

      faqSubtitle:
        'معلومات رسمية ومساعدة ذكية.',

      dashboardTitle: 'الإحصائيات الوطنية',

      dashboardSubtitle:
        'تحليل مباشر لبيانات التونسيين بالخارج.',

      langSwitch: 'Français',

      categories: <ComplaintCategory[]>[
        {
          id: 'transfers',
          title: 'التحويلات البنكية',
          icon: 'bi-bank2',
          desc: 'تحليل ذكي لمشاكل التحويلات والرسوم.'
        },
        {
          id: 'luggage',
          title: 'الأمتعة والمطارات',
          icon: 'bi-luggage-fill',
          desc: 'متابعة ذكية لحالات فقدان الأمتعة.',
          urgent: true
        },
        {
          id: 'tourism',
          title: 'السياحة',
          icon: 'bi-airplane-fill',
          desc: 'الحماية من عمليات الاحتيال السياحي.'
        },
        {
          id: 'fraud',
          title: 'الغش التجاري',
          icon: 'bi-shield-lock-fill',
          desc: 'اكتشاف تلقائي لعمليات الاحتيال.',
          urgent: true
        },
        {
          id: 'admin',
          title: 'الخدمات الإدارية',
          icon: 'bi-file-earmark-lock2-fill',
          desc: 'مساعدة في الخدمات القنصلية والإدارية.'
        },
        {
          id: 'investment',
          title: 'استثمارات التونسيين بالخارج',
          icon: 'bi-graph-up-arrow',
          desc: 'مرافقة ذكية للمشاريع والاستثمارات.'
        }
      ],

      faqs: <FAQ[]>[
        {
          q: 'كيف يعمل ذكاء OTIC ؟',
          a: 'يقوم النظام بتحليل الشكاوى باستخدام البيانات الضخمة لاكتشاف المشاكل المتكررة.'
        },
        {
          q: 'هل يمكن متابعة الشكوى ؟',
          a: 'نعم، لكل مستخدم لوحة تحكم ذكية مع إشعارات مباشرة.'
        },
        {
          q: 'هل البيانات آمنة ؟',
          a: 'نعم، المنصة تستعمل JWT والتشفير والحماية المتقدمة.'
        }
      ],


      ctaLogin: 'تسجيل الدخول',
      ctaRegister: 'إنشاء حساب'
    }
  };

  // =========================
  // GET TRANSLATION
  // =========================
  get t() {
    return this.translations[this.currentLang];
  }

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    document.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
  }

  switchLang(): void {
    this.currentLang = this.currentLang === 'fr' ? 'ar' : 'fr';
    document.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
  }

  // =========================
  // GET URGENCY COLOR
  // =========================
  getUrgencyClass(category: ComplaintCategory): string {

    if (category.urgent) {
      return 'border-danger shadow-lg';
    }

    return 'border-primary';
  }

  // =========================
  // FORMAT DATE
  // =========================
  formatTime(date: Date): string {

    return new Intl.DateTimeFormat(
      this.currentLang === 'fr' ? 'fr-FR' : 'ar-TN',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(date);
  }
}
