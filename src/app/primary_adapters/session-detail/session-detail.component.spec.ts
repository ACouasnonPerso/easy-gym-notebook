import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionDetailComponent } from './session-detail.component';
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { GetSessionDetailUseCase } from '../../primary_ports/session-detail/get-session-detail.usecase';
import { ValidateExerciseUseCase } from '../../primary_ports/session-detail/validate-exercise.usecase';
import { CancelExerciseUseCase } from '../../primary_ports/session-detail/cancel-exercise.usecase';
import { DeleteExerciseUseCase } from '../../primary_ports/session-detail/delete-exercise.usecase';
import { UpdateExerciseUseCase } from '../../primary_ports/session-detail/update-exercise.usecase';
import { UpdateSessionDateUseCase } from '../../primary_ports/session-detail/update-session-date.usecase';
import { UpdateSessionDurationUseCase } from '../../primary_ports/session-detail/update-session-duration.usecase';
import { EndSessionUseCase } from '../../primary_ports/session-detail/end-session.usecase';
import { GetSessionChronoUseCase } from '../../primary_ports/session-chrono/get-session-chrono.usecase';
import { PauseSessionChronoUseCase } from '../../primary_ports/session-chrono/pause-session-chrono.usecase';
import { SetSessionChronoUseCase } from '../../primary_ports/session-chrono/set-session-chrono.usecase';
import { Session } from '../../core_logic/shared/models';
import { ChronoStatus } from '../../core_logic/chrono/session-chrono.service';

const FR_TRANSLATIONS = {
  common: { break: 'Break', end: 'End', resume: 'Reprendre', edit: 'Modifier', cancel: 'Annuler', confirm: 'Confirmer', validate: 'Valider', delete: 'Supprimer' },
  session: { endConfirm: 'Terminer la seance ?' },
  exercise: { deleteConfirm: 'Supprimer cet exercice ?' },
};

class FakeTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<TranslationObject> {
    return of(FR_TRANSLATIONS as unknown as TranslationObject);
  }
}
const translateModuleConfig = TranslateModule.forRoot({
  loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
});

function setupI18n(): void {
  const translate = TestBed.inject(TranslateService);
  translate.setDefaultLang('fr');
  translate.use('fr');
}

function buildSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    date: new Date('2026-01-01'),
    status: 'completed',
    durationSeconds: 3600,
    muscleGroup: null,
    exercises: [],
    ...overrides,
  };
}

function createComponent() {
  const sessionSignal = signal<Session | null>(buildSession());
  const exercisesSignal = signal<any[]>([]);
  const elapsedSignal = signal(0);
  const sessionScopedElapsedSignal = signal(0);
  const chronoStatusSignal = signal<ChronoStatus>('running');
  const sessionScopedStatusSignal = signal<ChronoStatus>('running');
  const showManualOverrideSignal = signal(false);

  const getSessionDetailSpy = {
    session: sessionSignal,
    exercises: exercisesSignal,
    execute: jasmine.createSpy('execute'),
  };
  const validateSpy = { execute: jasmine.createSpy('execute') };
  const cancelSpy = { execute: jasmine.createSpy('execute') };
  const deleteSpy = { execute: jasmine.createSpy('execute') };
  const updateExerciseSpy = { execute: jasmine.createSpy('execute') };
  const updateDateSpy = { execute: jasmine.createSpy('execute') };
  const updateDurationSpy = { execute: jasmine.createSpy('execute') };
  const endSessionSpy = {
    execute: jasmine.createSpy('execute'),
    executeWithManualDuration: jasmine.createSpy('executeWithManualDuration'),
    showManualOverride: showManualOverrideSignal,
  };
  const getChronoSpy = {
    elapsedSeconds: elapsedSignal,
    status: chronoStatusSignal,
    getStatusForSession: jasmine.createSpy('getStatusForSession').and.callFake((_id: string) => sessionScopedStatusSignal),
    getElapsedForSession: jasmine.createSpy('getElapsedForSession').and.callFake((_id: string) => sessionScopedElapsedSignal),
  };
  const pauseChronoSpy = {
    pause: jasmine.createSpy('pause'),
    resumeSession: jasmine.createSpy('resumeSession'),
    pauseForSession: jasmine.createSpy('pauseForSession'),
    resumeForSession: jasmine.createSpy('resumeForSession'),
    startForSession: jasmine.createSpy('startForSession'),
  };
  const setChronoSpy = {
    execute: jasmine.createSpy('execute'),
    executeForSession: jasmine.createSpy('executeForSession'),
  };

  TestBed.configureTestingModule({
    imports: [SessionDetailComponent, translateModuleConfig],
    providers: [
      { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'session-1' } } } },
      { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      { provide: GetSessionDetailUseCase, useValue: getSessionDetailSpy },
      { provide: ValidateExerciseUseCase, useValue: validateSpy },
      { provide: CancelExerciseUseCase, useValue: cancelSpy },
      { provide: DeleteExerciseUseCase, useValue: deleteSpy },
      { provide: UpdateExerciseUseCase, useValue: updateExerciseSpy },
      { provide: UpdateSessionDateUseCase, useValue: updateDateSpy },
      { provide: UpdateSessionDurationUseCase, useValue: updateDurationSpy },
      { provide: EndSessionUseCase, useValue: endSessionSpy },
      { provide: GetSessionChronoUseCase, useValue: getChronoSpy },
      { provide: PauseSessionChronoUseCase, useValue: pauseChronoSpy },
      { provide: SetSessionChronoUseCase, useValue: setChronoSpy },
    ],
  });
  setupI18n();

  const fixture = TestBed.createComponent(SessionDetailComponent);
  fixture.detectChanges();
  return {
    fixture,
    updateDurationSpy,
    sessionSignal,
    elapsedSignal,
    sessionScopedElapsedSignal,
    sessionScopedStatusSignal,
    setChronoSpy,
    getChronoSpy,
    pauseChronoSpy,
  };
}

function createComponentWithChronoStatus(
  chronoStatus: ChronoStatus,
  sessionStatus: 'active' | 'completed' = 'active',
) {
  const { fixture, updateDurationSpy, sessionSignal, sessionScopedStatusSignal, pauseChronoSpy } = createComponent();
  sessionScopedStatusSignal.set(chronoStatus);
  sessionSignal.set(buildSession({ status: sessionStatus }));
  fixture.detectChanges();
  return { fixture, pauseChronoSpy };
}

describe('SessionDetailComponent — boutons chrono selon le statut', () => {
  it('affiche Break et End quand le chrono est running, pas de bouton Reprendre', () => {
    const { fixture } = createComponentWithChronoStatus('running');

    const buttons = fixture.debugElement.queryAll(By.css('.timer-btn'));
    const labels = buttons.map(b => (b.nativeElement as HTMLButtonElement).textContent?.trim());

    expect(labels).toContain('Break');
    expect(labels).toContain('End');
    expect(labels).not.toContain('Reprendre');
  });

  it('affiche uniquement Reprendre quand le chrono est paused', () => {
    const { fixture } = createComponentWithChronoStatus('paused');

    const buttons = fixture.debugElement.queryAll(By.css('.timer-btn'));
    const labels = buttons.map(b => (b.nativeElement as HTMLButtonElement).textContent?.trim());

    expect(labels).toContain('Reprendre');
    expect(labels).not.toContain('Break');
    expect(labels).not.toContain('End');
  });

  it('le bouton Break appelle pause() quand le chrono est running', () => {
    const { fixture, pauseChronoSpy } = createComponentWithChronoStatus('running');

    const breakBtn = fixture.debugElement.queryAll(By.css('.timer-btn'))
      .find(b => b.nativeElement.textContent.trim() === 'Break')!;
    breakBtn.triggerEventHandler('click', null);

    expect(pauseChronoSpy.pauseForSession).toHaveBeenCalledTimes(1);
  });

  it('le bouton Reprendre appelle resumeSession() quand le chrono est paused', () => {
    const { fixture, pauseChronoSpy } = createComponentWithChronoStatus('paused');

    const reprendreBtn = fixture.debugElement.queryAll(By.css('.timer-btn'))
      .find(b => b.nativeElement.textContent.trim() === 'Reprendre')!;
    reprendreBtn.triggerEventHandler('click', null);

    expect(pauseChronoSpy.resumeForSession).toHaveBeenCalledTimes(1);
  });
});

describe('SessionDetailComponent — visibilité du timer-block selon le statut de la session', () => {
  it('le timer-block est présent pour une session non-active (status=completed)', () => {
    const { fixture, sessionSignal } = createComponent();
    sessionSignal.set(buildSession({ status: 'completed' }));
    fixture.detectChanges();

    const timerBlock = fixture.debugElement.query(By.css('.timer-block'));
    expect(timerBlock).not.toBeNull();
  });

  it('s\'affiche pour une session active (status=active)', () => {
    const { fixture, sessionSignal } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    fixture.detectChanges();

    const timerBlock = fixture.debugElement.query(By.css('.timer-block'));
    expect(timerBlock).not.toBeNull();
  });
});

describe('SessionDetailComponent — boutons chrono selon le statut du chrono (session active)', () => {
  it('quand chrono=running : Break et End visibles, Reprendre absent', () => {
    const { fixture } = createComponentWithChronoStatus('running', 'active');

    const buttons = fixture.debugElement.queryAll(By.css('.timer-btn'));
    const labels = buttons.map(b => (b.nativeElement as HTMLButtonElement).textContent?.trim());

    expect(labels).toContain('Break');
    expect(labels).toContain('End');
    expect(labels).not.toContain('Reprendre');
  });

  it('quand chrono=paused : Reprendre visible, Break et End absents', () => {
    const { fixture } = createComponentWithChronoStatus('paused', 'active');

    const buttons = fixture.debugElement.queryAll(By.css('.timer-btn'));
    const labels = buttons.map(b => (b.nativeElement as HTMLButtonElement).textContent?.trim());

    expect(labels).toContain('Reprendre');
    expect(labels).not.toContain('Break');
    expect(labels).not.toContain('End');
  });

  it('quand chrono=ended : Reprendre et Modifier visibles, Break et End absents', () => {
    const { fixture } = createComponentWithChronoStatus('ended', 'active');

    const buttons = fixture.debugElement.queryAll(By.css('.timer-btn'));
    const labels = buttons.map(b => (b.nativeElement as HTMLButtonElement).textContent?.trim());

    expect(labels).toContain('Reprendre');
    expect(labels).toContain('Modifier');
    expect(labels).not.toContain('Break');
    expect(labels).not.toContain('End');
  });
});

describe('SessionDetailComponent — edition de la duree', () => {
  it('affiche la popup d\'edition de duree au clic sur le timer', () => {
    const { fixture, sessionSignal } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    fixture.detectChanges();

    const timerEl = fixture.debugElement.query(By.css('.timer-big'));
    timerEl.triggerEventHandler('click', null);
    fixture.detectChanges();

    const popup = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    expect(popup).not.toBeNull();
  });

  it('appelle UpdateSessionDurationUseCase avec la valeur confirmee et ferme la popup', () => {
    const { fixture, updateDurationSpy, sessionSignal } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    fixture.detectChanges();

    const timerEl = fixture.debugElement.query(By.css('.timer-big'));
    timerEl.triggerEventHandler('click', null);
    fixture.detectChanges();

    const popup = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    popup.triggerEventHandler('confirmed', 5415);
    fixture.detectChanges();

    expect(updateDurationSpy.execute).toHaveBeenCalledOnceWith(5415);
    const popupAfter = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    expect(popupAfter).toBeNull();
  });

  it('initialise la popup avec elapsedSeconds du chrono de la session quand la session est active', () => {
    const { fixture, sessionSignal, sessionScopedElapsedSignal } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    sessionScopedElapsedSignal.set(7200);
    fixture.detectChanges();

    const timerEl = fixture.debugElement.query(By.css('.timer-big'));
    timerEl.triggerEventHandler('click', null);
    fixture.detectChanges();

    const popup = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    expect(popup.componentInstance.initialSeconds()).toBe(7200);
  });

  it('appelle SetSessionChronoUseCase.executeForSession avec la valeur confirmee quand la session est active', () => {
    const { fixture, sessionSignal, setChronoSpy } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    fixture.detectChanges();

    const timerEl = fixture.debugElement.query(By.css('.timer-big'));
    timerEl.triggerEventHandler('click', null);
    fixture.detectChanges();

    const popup = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    popup.triggerEventHandler('confirmed', 5415);
    fixture.detectChanges();

    expect(setChronoSpy.executeForSession).toHaveBeenCalledOnceWith('session-1', 5415);
  });
});

describe('SessionDetailComponent — ngOnDestroy ne pause plus le chrono', () => {
  it('ne doit pas appeler pause() lors de la destruction du composant (la session continue en arrière-plan)', () => {
    const { fixture, sessionSignal, pauseChronoSpy } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    fixture.detectChanges();

    fixture.destroy();

    expect(pauseChronoSpy.pauseForSession).not.toHaveBeenCalled();
  });
});

describe('SessionDetailComponent — goBack met à jour la durée avant de naviguer', () => {
  it('navigue vers /sessions quand la session est completed', () => {
    const { fixture, sessionSignal } = createComponent();
    sessionSignal.set(buildSession({ status: 'completed', durationSeconds: 3600 }));
    fixture.detectChanges();
    const router = TestBed.inject(Router);

    fixture.componentInstance.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/sessions']);
  });

  it('met à jour la durée avec elapsedSeconds du chrono avant de naviguer quand la session est active', () => {
    const { fixture, sessionSignal, sessionScopedElapsedSignal, updateDurationSpy } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    sessionScopedElapsedSignal.set(4200);
    fixture.detectChanges();

    fixture.componentInstance.goBack();

    expect(updateDurationSpy.execute).toHaveBeenCalledOnceWith(4200);
  });

  it('ne met pas à jour la durée quand la session est completed', () => {
    const { fixture, sessionSignal, updateDurationSpy } = createComponent();
    sessionSignal.set(buildSession({ status: 'completed', durationSeconds: 3600 }));
    fixture.detectChanges();

    fixture.componentInstance.goBack();

    expect(updateDurationSpy.execute).not.toHaveBeenCalled();
  });
});

describe('SessionDetailComponent — câblage ForSession (API session-scoped)', () => {
  it('chronoStatus utilise getStatusForSession(sessionId) et non le signal global .status', () => {
    const { fixture, sessionSignal, sessionScopedStatusSignal, getChronoSpy } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    sessionScopedStatusSignal.set('paused');
    fixture.detectChanges();

    expect(getChronoSpy.getStatusForSession).toHaveBeenCalledWith('session-1');

    const buttons = fixture.debugElement.queryAll(By.css('.timer-btn'));
    const labels = buttons.map(b => (b.nativeElement as HTMLButtonElement).textContent?.trim());
    expect(labels).toContain('Reprendre');
    expect(labels).not.toContain('Break');
  });

  it('durationLabel utilise getElapsedForSession(sessionId) et non le signal global elapsedSeconds', () => {
    const { fixture, sessionSignal, sessionScopedElapsedSignal, getChronoSpy } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    sessionScopedElapsedSignal.set(3723);
    fixture.detectChanges();

    expect(getChronoSpy.getElapsedForSession).toHaveBeenCalledWith('session-1');

    const timerBig = fixture.debugElement.query(By.css('.timer-big'));
    expect(timerBig.nativeElement.textContent).toContain('01:02:03');
  });

  it('onPause appelle pauseForSession(sessionId)', () => {
    const { fixture, sessionSignal, sessionScopedStatusSignal, pauseChronoSpy } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    sessionScopedStatusSignal.set('running');
    fixture.detectChanges();

    const breakBtn = fixture.debugElement.queryAll(By.css('.timer-btn'))
      .find(b => b.nativeElement.textContent.trim() === 'Break')!;
    breakBtn.triggerEventHandler('click', null);

    expect(pauseChronoSpy.pauseForSession).toHaveBeenCalledOnceWith('session-1');
    expect(pauseChronoSpy.pause).not.toHaveBeenCalled();
  });

  it('onResume appelle resumeForSession(sessionId)', () => {
    const { fixture, sessionSignal, sessionScopedStatusSignal, pauseChronoSpy } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    sessionScopedStatusSignal.set('paused');
    fixture.detectChanges();

    const reprendreBtn = fixture.debugElement.queryAll(By.css('.timer-btn'))
      .find(b => b.nativeElement.textContent.trim() === 'Reprendre')!;
    reprendreBtn.triggerEventHandler('click', null);

    expect(pauseChronoSpy.resumeForSession).toHaveBeenCalledOnceWith('session-1');
    expect(pauseChronoSpy.resumeSession).not.toHaveBeenCalled();
  });

  it('onDurationConfirmed appelle executeForSession(sessionId, seconds) quand la session est active', () => {
    const { fixture, sessionSignal, setChronoSpy } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    fixture.detectChanges();

    const timerEl = fixture.debugElement.query(By.css('.timer-big'));
    timerEl.triggerEventHandler('click', null);
    fixture.detectChanges();

    const popup = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    popup.triggerEventHandler('confirmed', 4800);
    fixture.detectChanges();

    expect(setChronoSpy.executeForSession).toHaveBeenCalledOnceWith('session-1', 4800);
    expect(setChronoSpy.execute).not.toHaveBeenCalled();
  });
});

describe('SessionDetailComponent — démarrage automatique du chrono', () => {
  it('démarre le chrono quand la session active est chargée', () => {
    const { fixture, sessionSignal, pauseChronoSpy } = createComponent();
    sessionSignal.set(buildSession({ status: 'active' }));
    fixture.detectChanges();

    expect(pauseChronoSpy.startForSession).toHaveBeenCalledOnceWith('session-1');
  });

  it('ne démarre pas le chrono si la session est completed', () => {
    const { fixture, sessionSignal, pauseChronoSpy } = createComponent();
    sessionSignal.set(buildSession({ status: 'completed' }));
    fixture.detectChanges();

    expect(pauseChronoSpy.startForSession).not.toHaveBeenCalled();
  });

  it('ne démarre pas le chrono si la session est ended', () => {
    const { fixture, sessionSignal, pauseChronoSpy } = createComponent();
    sessionSignal.set(buildSession({ status: 'ended' } as any));
    fixture.detectChanges();

    expect(pauseChronoSpy.startForSession).not.toHaveBeenCalled();
  });
});
