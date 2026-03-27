import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  let translateSpy: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {
    localStorage.clear();
    translateSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['use']);

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: translateSpy },
      ],
    });

    service = TestBed.inject(LanguageService);
  });

  describe('état initial', () => {
    it('devrait exposer fr comme langue active par défaut', () => {
      expect(service.activeLang()).toBe('fr');
    });
  });

  describe('setLanguage()', () => {
    it('devrait mettre à jour le signal activeLang à en', () => {
      service.setLanguage('en');

      expect(service.activeLang()).toBe('en');
    });

    it('devrait appeler TranslateService.use avec la nouvelle langue', () => {
      service.setLanguage('en');

      expect(translateSpy.use).toHaveBeenCalledOnceWith('en');
    });

    it('devrait persister la langue choisie dans localStorage', () => {
      service.setLanguage('en');

      expect(localStorage.getItem('lang')).toBe('en');
    });

    it('ne devrait pas appeler TranslateService.use si la langue est déjà active', () => {
      // langue initiale est fr
      service.setLanguage('fr');

      expect(translateSpy.use).not.toHaveBeenCalled();
    });
  });
});
