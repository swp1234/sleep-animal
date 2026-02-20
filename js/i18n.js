/* =================================================================
   I18n - Internationalization Module
   Supports 12 languages: ko, en, ja, zh, hi, ru, es, pt, id, tr, de, fr
   ================================================================= */

class I18n {
    constructor() {
        this.translations = {};
        this.supportedLanguages = ['ko', 'en', 'ja', 'zh', 'hi', 'ru', 'es', 'pt', 'id', 'tr', 'de', 'fr'];
        this.currentLang = this.detectLanguage();
        this.fallbackTranslations = {};
        this.initialized = false;
    }

    detectLanguage() {
        const saved = localStorage.getItem('appLanguage');
        if (saved && this.supportedLanguages.includes(saved)) return saved;
        const browserLang = navigator.language.split('-')[0];
        if (this.supportedLanguages.includes(browserLang)) return browserLang;
        return 'en';
    }

    async initialize() {
        try {
            await this.loadTranslations(this.currentLang);
            if (this.currentLang !== 'en') {
                this.fallbackTranslations = await this.loadTranslations('en');
            }
            this.initialized = true;
            this.updateUI();
            return true;
        } catch (error) {
            console.error('i18n initialization failed:', error);
            return false;
        }
    }

    async loadTranslations(lang) {
        if (this.translations[lang]) return this.translations[lang];
        try {
            const response = await fetch(`js/locales/${lang}.json`);
            if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
            const data = await response.json();
            this.translations[lang] = data;
            return data;
        } catch (error) {
            console.error(`Failed to load language ${lang}:`, error);
            return {};
        }
    }

    t(key, defaultValue = key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                value = this.fallbackTranslations;
                for (const fk of keys) {
                    if (value && typeof value === 'object' && fk in value) {
                        value = value[fk];
                    } else {
                        return defaultValue;
                    }
                }
                return value;
            }
        }
        return value || defaultValue;
    }

    async setLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) return false;
        await this.loadTranslations(lang);
        this.currentLang = lang;
        localStorage.setItem('appLanguage', lang);
        this.updateUI();
        document.documentElement.lang = lang;
        return true;
    }

    updateUI() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.placeholder !== '') el.placeholder = text;
            } else {
                el.textContent = text;
            }
        });

        const titleEl = document.querySelector('title[data-i18n]');
        if (titleEl) document.title = this.t(titleEl.getAttribute('data-i18n'));

        document.querySelectorAll('meta[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const name = el.getAttribute('name') || el.getAttribute('property');
            const text = this.t(key);
            if (name === 'description' || (name && name.startsWith('og:'))) {
                el.setAttribute('content', text);
            }
        });

        document.querySelectorAll('.lang-option').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === this.currentLang);
        });

        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.currentLang } }));
    }

    getCurrentLanguage() { return this.currentLang; }

    getLanguageName(lang) {
        const names = {
            ko: '한국어', en: 'English', ja: '日本語', zh: '中文',
            hi: 'हिन्दी', ru: 'Русский', es: 'Español', pt: 'Português',
            id: 'Bahasa Indonesia', tr: 'Türkçe', de: 'Deutsch', fr: 'Français'
        };
        return names[lang] || lang;
    }
}

const i18n = new I18n();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await i18n.initialize();
    } catch (e) {
        console.warn('i18n init failed:', e);
    }
});
