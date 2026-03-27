import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ExerciseChronoComponent } from './exercise-chrono.component';
import { ExerciseChronoUseCase } from '../../primary_ports/exercise-chrono/exercise-chrono.usecase';
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<TranslationObject> {
    return of({
      common: { back: 'Retour', pause: 'Pause', resume: 'Reprendre', reset: 'Reset', rest: 'repos', break: 'Pause' },
      chrono: { ready: 'Prêt', training: 'Training', startTraining: 'Démarrer', goBreak: 'Pause', goTraining: 'Training', series: 'Série' },
    } as unknown as TranslationObject);
  }
}

function buildUseCase() {
  return {
    chronoState: signal<string>('initial'),
    timeSeconds: signal(0),
    seriesCount: signal(0),
    soundEnabled: signal(true),
    initWithBreakDuration: jasmine.createSpy('initWithBreakDuration'),
    updateBreakDuration: jasmine.createSpy('updateBreakDuration'),
    start: jasmine.createSpy('start'),
    pause: jasmine.createSpy('pause'),
    resume: jasmine.createSpy('resume'),
    goBreak: jasmine.createSpy('goBreak'),
    goTraining: jasmine.createSpy('goTraining'),
    reset: jasmine.createSpy('reset'),
    toggleSound: jasmine.createSpy('toggleSound'),
    addTime: jasmine.createSpy('addTime'),
  };
}

function createComponent(queryParams: Record<string, string> = {}) {
  const useCaseSpy = buildUseCase();
  const locationSpy = { back: jasmine.createSpy('back') };

  TestBed.configureTestingModule({
    imports: [
      ExerciseChronoComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeTranslateLoader } }),
    ],
    providers: [
      { provide: ActivatedRoute, useValue: { snapshot: { queryParams } } },
      { provide: Location, useValue: locationSpy },
      { provide: ExerciseChronoUseCase, useValue: useCaseSpy },
    ],
  });

  const translate = TestBed.inject(TranslateService);
  translate.setDefaultLang('fr');
  translate.use('fr');

  const fixture = TestBed.createComponent(ExerciseChronoComponent);
  fixture.detectChanges();
  return { fixture, useCaseSpy, locationSpy };
}

describe('ExerciseChronoComponent — hasExercise', () => {
  it('hasExercise vaut false quand aucun paramètre breakDuration n\'est présent', () => {
    const { fixture } = createComponent({});

    expect(fixture.componentInstance.hasExercise()).toBeFalse();
  });

  it('hasExercise vaut true quand le paramètre breakDuration est présent', () => {
    const { fixture } = createComponent({ breakDuration: '90' });

    expect(fixture.componentInstance.hasExercise()).toBeTrue();
  });
});

describe('ExerciseChronoComponent — label durée de repos', () => {
  it('affiche le label .break-duration-label quand hasExercise vaut false', () => {
    const { fixture } = createComponent({});

    const label = fixture.debugElement.query(By.css('.break-duration-label'));

    expect(label).not.toBeNull();
  });

  it('masque le label .break-duration-label quand hasExercise vaut true', () => {
    const { fixture } = createComponent({ breakDuration: '90' });

    const label = fixture.debugElement.query(By.css('.break-duration-label'));

    expect(label).toBeNull();
  });

  it('affiche la durée de repos formatée dans le label (120s → "2:00 repos")', () => {
    const { fixture } = createComponent({});

    const label = fixture.debugElement.query(By.css('.break-duration-label'));

    expect(label.nativeElement.textContent.trim()).toBe('2:00 repos');
  });
});

describe('ExerciseChronoComponent — popup durée de repos', () => {
  it('le popup n\'est pas visible par défaut', () => {
    const { fixture } = createComponent({});

    const popup = fixture.debugElement.query(By.css('app-edit-duration-popup'));

    expect(popup).toBeNull();
  });

  it('affiche le popup quand on clique sur le label', () => {
    const { fixture } = createComponent({});
    const label = fixture.debugElement.query(By.css('.break-duration-label'));

    label.triggerEventHandler('click', null);
    fixture.detectChanges();

    const popup = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    expect(popup).not.toBeNull();
  });

  it('le popup reçoit la durée de repos courante comme initialSeconds', () => {
    const { fixture } = createComponent({});
    const label = fixture.debugElement.query(By.css('.break-duration-label'));

    label.triggerEventHandler('click', null);
    fixture.detectChanges();

    const popup = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    expect(popup.componentInstance.initialSeconds()).toBe(120);
  });

  it('confirmer le popup met à jour _breakDuration et appelle updateBreakDuration', () => {
    const { fixture, useCaseSpy } = createComponent({});
    const label = fixture.debugElement.query(By.css('.break-duration-label'));
    label.triggerEventHandler('click', null);
    fixture.detectChanges();

    const popup = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    popup.componentInstance.confirmed.emit(180);
    fixture.detectChanges();

    expect(fixture.componentInstance._breakDuration()).toBe(180);
    expect(useCaseSpy.updateBreakDuration).toHaveBeenCalledWith(180);
  });

  it('confirmer le popup appelle updateBreakDuration et non initWithBreakDuration pour préserver l\'état du chrono', () => {
    const { fixture, useCaseSpy } = createComponent({});
    const label = fixture.debugElement.query(By.css('.break-duration-label'));
    label.triggerEventHandler('click', null);
    fixture.detectChanges();

    const popup = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    popup.componentInstance.confirmed.emit(180);
    fixture.detectChanges();

    expect(useCaseSpy.updateBreakDuration).toHaveBeenCalledWith(180);
    expect(useCaseSpy.initWithBreakDuration).not.toHaveBeenCalledWith(180);
  });

  it('annuler le popup masque le popup sans modifier _breakDuration', () => {
    const { fixture, useCaseSpy } = createComponent({});
    const label = fixture.debugElement.query(By.css('.break-duration-label'));
    label.triggerEventHandler('click', null);
    fixture.detectChanges();

    const popup = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    popup.componentInstance.cancelled.emit();
    fixture.detectChanges();

    const popupAfter = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    expect(popupAfter).toBeNull();
    expect(fixture.componentInstance._breakDuration()).toBe(120);
    expect(useCaseSpy.initWithBreakDuration).toHaveBeenCalledTimes(1); // only ngOnInit call
  });
});

describe('ExerciseChronoComponent — mise à jour du label après confirmation popup', () => {
  it('le label .break-duration-label affiche la nouvelle durée après confirmation du popup', () => {
    const { fixture } = createComponent({});
    const label = fixture.debugElement.query(By.css('.break-duration-label'));
    label.triggerEventHandler('click', null);
    fixture.detectChanges();

    const popup = fixture.debugElement.query(By.css('app-edit-duration-popup'));
    popup.componentInstance.confirmed.emit(180);
    fixture.detectChanges();

    const updatedLabel = fixture.debugElement.query(By.css('.break-duration-label'));
    expect(updatedLabel.nativeElement.textContent.trim()).toBe('3:00 repos');
  });
});

describe('ExerciseChronoComponent — boutons +15s et +30s', () => {
  it('n\'affiche PAS les boutons +15s et +30s quand l\'état est training_paused', () => {
    const { fixture, useCaseSpy } = createComponent({});
    useCaseSpy.chronoState.set('training_paused');
    fixture.detectChanges();

    const btns = fixture.debugElement.queryAll(By.css('.add-time-btn'));

    expect(btns.length).toBe(0);
  });

  it('affiche les boutons +15s et +30s quand l\'état est break_paused', () => {
    const { fixture, useCaseSpy } = createComponent({});
    useCaseSpy.chronoState.set('break_paused');
    fixture.detectChanges();

    const btns = fixture.debugElement.queryAll(By.css('.add-time-btn'));
    const btn15 = btns.find(b => b.nativeElement.textContent.trim() === '+15s');
    const btn30 = btns.find(b => b.nativeElement.textContent.trim() === '+30s');

    expect(btn15).not.toBeUndefined();
    expect(btn30).not.toBeUndefined();
  });

  it('n\'affiche pas les boutons +15s et +30s quand l\'état est training', () => {
    const { fixture, useCaseSpy } = createComponent({});
    useCaseSpy.chronoState.set('training');
    fixture.detectChanges();

    const btns = fixture.debugElement.queryAll(By.css('.add-time-btn'));

    expect(btns.length).toBe(0);
  });

  it('cliquer sur +15s appelle addTime(15)', () => {
    const { fixture, useCaseSpy } = createComponent({});
    useCaseSpy.chronoState.set('break_paused');
    fixture.detectChanges();

    const btns = fixture.debugElement.queryAll(By.css('.add-time-btn'));
    const btn15 = btns.find(b => b.nativeElement.textContent.trim() === '+15s')!;
    btn15.triggerEventHandler('click', null);

    expect(useCaseSpy.addTime).toHaveBeenCalledOnceWith(15);
  });

  it('cliquer sur +30s appelle addTime(30)', () => {
    const { fixture, useCaseSpy } = createComponent({});
    useCaseSpy.chronoState.set('break_paused');
    fixture.detectChanges();

    const btns = fixture.debugElement.queryAll(By.css('.add-time-btn'));
    const btn30 = btns.find(b => b.nativeElement.textContent.trim() === '+30s')!;
    btn30.triggerEventHandler('click', null);

    expect(useCaseSpy.addTime).toHaveBeenCalledOnceWith(30);
  });
});
