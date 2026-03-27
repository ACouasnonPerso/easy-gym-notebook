import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { SessionListComponent } from './session-list.component';
import { GetSessionsUseCase } from '../../primary_ports/session-list/get-sessions.usecase';
import { CreateSessionUseCase } from '../../primary_ports/session-list/create-session.usecase';
import { DuplicateSessionUseCase } from '../../primary_ports/session-list/duplicate-session.usecase';
import { DeleteSessionUseCase } from '../../primary_ports/session-list/delete-session.usecase';
import { SetLanguageUseCase } from '../../primary_ports/language/set-language.usecase';
import { LanguageService } from '../../core_logic/language/language.service';
import { Router } from '@angular/router';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<TranslationObject> {
    return of({ sessionList: { title: 'Mes séances', empty: 'Aucune séance', duplicate: 'Dupliquer', delete: 'Supprimer', deleteConfirm: 'Supprimer ?', tip: 'Conseil' } } as unknown as TranslationObject);
  }
}

const translateModuleConfig = TranslateModule.forRoot({
  loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
});

function setupI18n() {
  const translate = TestBed.inject(TranslateService);
  translate.setDefaultLang('fr');
  translate.use('fr');
}

function makeProviders(activeLang = signal<'fr' | 'en'>('fr')) {
  const getSessionsSpy = {
    sessions: signal([]),
    execute: jasmine.createSpy('execute'),
  };
  const createSessionSpy = { execute: jasmine.createSpy('execute') };
  const duplicateSessionSpy = { execute: jasmine.createSpy('execute') };
  const deleteSessionSpy = { execute: jasmine.createSpy('execute') };
  const setLanguageSpy = { execute: jasmine.createSpy('execute') };
  const languageServiceSpy = { activeLang, setLanguage: jasmine.createSpy('setLanguage') };
  const routerSpy = { navigate: jasmine.createSpy('navigate') };

  return {
    getSessionsSpy,
    createSessionSpy,
    duplicateSessionSpy,
    deleteSessionSpy,
    setLanguageSpy,
    languageServiceSpy,
    routerSpy,
  };
}

describe('SessionListComponent — sélecteur de langue', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SessionListComponent>>;

  beforeEach(() => {
    const { getSessionsSpy, createSessionSpy, duplicateSessionSpy, deleteSessionSpy, setLanguageSpy, languageServiceSpy, routerSpy } = makeProviders();

    TestBed.configureTestingModule({
      imports: [SessionListComponent, translateModuleConfig],
      providers: [
        { provide: GetSessionsUseCase, useValue: getSessionsSpy },
        { provide: CreateSessionUseCase, useValue: createSessionSpy },
        { provide: DuplicateSessionUseCase, useValue: duplicateSessionSpy },
        { provide: DeleteSessionUseCase, useValue: deleteSessionSpy },
        { provide: SetLanguageUseCase, useValue: setLanguageSpy },
        { provide: LanguageService, useValue: languageServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    setupI18n();
    fixture = TestBed.createComponent(SessionListComponent);
    fixture.detectChanges();
  });

  it('devrait afficher les boutons de sélection de langue FR et EN dans le header', () => {
    const el: HTMLElement = fixture.nativeElement;
    const buttons = Array.from(el.querySelectorAll('.lang-btn')).map(b => b.textContent?.trim());

    expect(buttons).toContain('FR');
    expect(buttons).toContain('EN');
  });

  it('devrait appeler le use case avec en quand on clique sur le bouton EN', () => {
    const el: HTMLElement = fixture.nativeElement;
    const enButton = Array.from(el.querySelectorAll<HTMLButtonElement>('.lang-btn')).find(b => b.textContent?.trim() === 'EN');
    enButton!.click();
    fixture.detectChanges();

    const setLanguageSpy = TestBed.inject(SetLanguageUseCase) as unknown as { execute: jasmine.Spy };
    expect(setLanguageSpy.execute).toHaveBeenCalledOnceWith('en');
  });

  it('devrait ajouter la classe active au bouton correspondant à la langue active', () => {
    const el: HTMLElement = fixture.nativeElement;
    const frButton = Array.from(el.querySelectorAll<HTMLButtonElement>('.lang-btn')).find(b => b.textContent?.trim() === 'FR');
    const enButton = Array.from(el.querySelectorAll<HTMLButtonElement>('.lang-btn')).find(b => b.textContent?.trim() === 'EN');

    // langue active est fr par défaut
    expect(frButton!.classList).toContain('active');
    expect(enButton!.classList).not.toContain('active');
  });
});
