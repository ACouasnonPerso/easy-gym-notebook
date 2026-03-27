import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type ActiveLang = 'fr' | 'en' | 'es' | 'pt' | 'de' | 'it' | 'ko' | 'ru' | 'ja' | 'nl' | 'ar' | 'hi' | 'pl' | 'sv' | 'tr' | 'vi' | 'th';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly activeLang = signal<ActiveLang>('fr');

  constructor(private readonly translateService: TranslateService) {}

  setLanguage(lang: ActiveLang): void {
    if (lang === this.activeLang()) return;
    this.activeLang.set(lang);
    this.translateService.use(lang);
    localStorage.setItem('lang', lang);
  }
}
