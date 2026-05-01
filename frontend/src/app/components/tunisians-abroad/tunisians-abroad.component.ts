import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tunisians-abroad',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tunisians-abroad.component.html',
  styleUrls: ['./tunisians-abroad.component.css']
})
export class TunisiansAbroadComponent implements OnInit {
  currentLang: 'fr' | 'ar' = 'fr';
  
  translations = {
    fr: {
      title: 'Tunisiens à l\'Étranger',
      subtitle: 'Un espace dédié à la diaspora tunisienne pour protéger vos droits et faciliter vos démarches.',
      categoriesTitle: 'Déposer une Réclamation',
      categoriesSubtitle: 'Choisissez la catégorie concernée par votre réclamation',
      faqTitle: 'Foire Aux Questions (FAQ)',
      faqSubtitle: 'Trouvez des réponses aux questions les plus fréquentes concernant vos droits et les procédures.',
      langSwitch: 'العربية',
      categories: [
        { id: 'transfers', title: 'Transferts d’argent', icon: 'bi-currency-exchange', desc: 'Problèmes liés aux virements, frais bancaires ou délais.' },
        { id: 'luggage', title: 'Bagages', icon: 'bi-luggage-fill', desc: 'Pertes, dommages ou retards de bagages lors de vos voyages.' },
        { id: 'tourism', title: 'Services touristiques', icon: 'bi-sun-fill', desc: 'Réclamations concernant les hôtels, agences de voyages, etc.' },
        { id: 'fraud', title: 'Fraude commerciale', icon: 'bi-shield-exclamation', desc: 'Pratiques malhonnêtes, prix abusifs ou produits non conformes.' },
        { id: 'admin', title: 'Questions administratives', icon: 'bi-file-earmark-text-fill', desc: 'Difficultés avec les procédures consulaires ou administratives.' }
      ],
      faqs: [
        { q: 'Quels sont les tarifs douaniers pour le FCR ?', a: 'Le régime FCR permet l\'importation d\'un véhicule en franchise totale ou partielle d\'impôts sous certaines conditions...' },
        { q: 'Comment suivre ma réclamation de bagage ?', a: 'Vous devez d\'abord obtenir un numéro de dossier (PIR) à l\'aéroport, puis l\'enregistrer sur notre plateforme...' },
        { q: 'Quels sont mes droits en cas de retard de vol ?', a: 'Selon la réglementation tunisienne et internationale, vous avez droit à une assistance et éventuellement une indemnisation...' }
      ],
      ctaLogin: 'Se connecter pour déposer',
      ctaRegister: 'Créer un compte'
    },
    ar: {
      title: 'التونسيون بالخارج',
      subtitle: 'فضاء مخصص للجالية التونسية لحماية حقوقكم وتسهيل إجراءاتكم.',
      categoriesTitle: 'تقديم شكوى',
      categoriesSubtitle: 'اختر الفئة المتعلقة بشكواك',
      faqTitle: 'الأسئلة الشائعة',
      faqSubtitle: 'اعثر على إجابات للأسئلة الأكثر تكرارًا المتعلقة بحقوقكم وإجراءاتكم.',
      langSwitch: 'Français',
      categories: [
        { id: 'transfers', title: 'تحويلات الأموال', icon: 'bi-currency-exchange', desc: 'مشاكل تتعلق بالتحويلات أو الرسوم البنكية أو التأخير.' },
        { id: 'luggage', title: 'الأمتعة', icon: 'bi-luggage-fill', desc: 'فقدان أو تلف أو تأخر الأمتعة أثناء رحلاتكم.' },
        { id: 'tourism', title: 'الخدمات السياحية', icon: 'bi-sun-fill', desc: 'شكاوى تتعلق بالفنادق أو وكالات الأسفار، إلخ.' },
        { id: 'fraud', title: 'الغش التجاري', icon: 'bi-shield-exclamation', desc: 'ممارسات غير نزيهة، أسعار مشطة أو سلع غير مطابقة للمواصفات.' },
        { id: 'admin', title: 'المسائل الإدارية', icon: 'bi-file-earmark-text-fill', desc: 'صعوبات مع الإجراءات القنصلية أو الإدارية.' }
      ],
      faqs: [
        { q: 'ما هي المعاليم الديوانية لـ FCR؟', a: 'يسمح نظام FCR بتوريد سيارة مع إعفاء كلي أو جزئي من الضرائب بشروط معينة...' },
        { q: 'كيف أتابع شكوى تتعلق بالأمتعة؟', a: 'يجب أولاً الحصول على رقم ملف (PIR) في المطار، ثم تسجيله على منصتنا...' },
        { q: 'ما هي حقوقي في حال تأخر الرحلة؟', a: 'وفقاً للقوانين التونسية والدولية، يحق لكم الحصول على المساعدة وربما التعويض...' }
      ],
      ctaLogin: 'تسجيل الدخول للتقديم',
      ctaRegister: 'إنشاء حساب'
    }
  };

  get t() {
    return this.translations[this.currentLang];
  }

  constructor() { }

  ngOnInit(): void {
    // Scroll to top on load
    window.scrollTo(0, 0);
  }

  switchLang() {
    this.currentLang = this.currentLang === 'fr' ? 'ar' : 'fr';
    document.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
  }
}
