import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SessionHeaderChronoComponent } from './session-header-chrono.component';
import { ChronoStatus } from '../../core_logic/chrono/session-chrono.service';
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

const FR_TRANSLATIONS = {
  common: { break: 'Break', end: 'End', resume: 'Reprendre', edit: 'Modifier' },
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

function createComponent(chronoStatus: ChronoStatus, durationLabel = '00:01:30') {
  TestBed.configureTestingModule({
    imports: [SessionHeaderChronoComponent, translateModuleConfig],
  });
  setupI18n();
  const fixture = TestBed.createComponent(SessionHeaderChronoComponent);
  fixture.componentRef.setInput('chronoStatus', chronoStatus);
  fixture.componentRef.setInput('durationLabel', durationLabel);
  fixture.detectChanges();
  return fixture;
}

function getButtonLabels(fixture: ReturnType<typeof createComponent>): string[] {
  return fixture.debugElement
    .queryAll(By.css('.timer-btn'))
    .map(b => (b.nativeElement as HTMLButtonElement).textContent?.trim() ?? '');
}

// ---------------------------------------------------------------------------
// Timer display
// ---------------------------------------------------------------------------

describe('SessionHeaderChronoComponent — timer display', () => {
  it('should display the elapsed time label when the chrono is running', () => {
    const fixture = createComponent('running', '00:05:42');

    const timerEl = fixture.debugElement.query(By.css('.timer-big'));

    expect(timerEl.nativeElement.textContent.trim()).toBe('00:05:42');
  });

  it('should display the elapsed time label when the chrono is paused', () => {
    const fixture = createComponent('paused', '01:12:00');

    const timerEl = fixture.debugElement.query(By.css('.timer-big'));

    expect(timerEl.nativeElement.textContent.trim()).toBe('01:12:00');
  });
});

// ---------------------------------------------------------------------------
// Button visibility — EN COURS (running)
// ---------------------------------------------------------------------------

describe('SessionHeaderChronoComponent — button visibility when running', () => {
  it('should show the Break button and the End button when the session is running', () => {
    const fixture = createComponent('running');

    const labels = getButtonLabels(fixture);

    expect(labels).toContain('Break');
    expect(labels).toContain('End');
  });

  it('should not show the Reprendre button when the session is running', () => {
    const fixture = createComponent('running');

    const labels = getButtonLabels(fixture);

    expect(labels).not.toContain('Reprendre');
  });

  it('should not show the Modifier button when the session is running', () => {
    const fixture = createComponent('running');

    const labels = getButtonLabels(fixture);

    expect(labels).not.toContain('Modifier');
  });
});

// ---------------------------------------------------------------------------
// Button visibility — EN PAUSE (paused)
// ---------------------------------------------------------------------------

describe('SessionHeaderChronoComponent — button visibility when paused', () => {
  it('should show the Reprendre button when the session is paused', () => {
    const fixture = createComponent('paused');

    const labels = getButtonLabels(fixture);

    expect(labels).toContain('Reprendre');
  });

  it('should not show the Break button when the session is paused', () => {
    const fixture = createComponent('paused');

    const labels = getButtonLabels(fixture);

    expect(labels).not.toContain('Break');
  });

  it('should not show the End button when the session is paused', () => {
    const fixture = createComponent('paused');

    const labels = getButtonLabels(fixture);

    expect(labels).not.toContain('End');
  });
});

// ---------------------------------------------------------------------------
// Button visibility — TERMINÉ (ended)
// ---------------------------------------------------------------------------

describe('SessionHeaderChronoComponent — button visibility when ended', () => {
  it('should show the Reprendre button when the session has ended', () => {
    const fixture = createComponent('ended');

    const labels = getButtonLabels(fixture);

    expect(labels).toContain('Reprendre');
  });

  it('should show the Modifier button when the session has ended', () => {
    const fixture = createComponent('ended');

    const labels = getButtonLabels(fixture);

    expect(labels).toContain('Modifier');
  });

  it('should not show the Break button when the session has ended', () => {
    const fixture = createComponent('ended');

    const labels = getButtonLabels(fixture);

    expect(labels).not.toContain('Break');
  });

  it('should not show the End button when the session has ended', () => {
    const fixture = createComponent('ended');

    const labels = getButtonLabels(fixture);

    expect(labels).not.toContain('End');
  });
});

// ---------------------------------------------------------------------------
// Button click outputs — EN COURS (running)
// ---------------------------------------------------------------------------

describe('SessionHeaderChronoComponent — button click outputs when running', () => {
  it('should emit the pause event when the user clicks the Break button during a running session', () => {
    const fixture = createComponent('running');
    const component = fixture.componentInstance;
    spyOn(component.pause, 'emit');

    const breakBtn = fixture.debugElement
      .queryAll(By.css('.timer-btn'))
      .find(b => b.nativeElement.textContent.trim() === 'Break')!;
    breakBtn.triggerEventHandler('click', null);

    expect(component.pause.emit).toHaveBeenCalledTimes(1);
  });

  it('should emit the endSession event when the user clicks the End button during a running session', () => {
    const fixture = createComponent('running');
    const component = fixture.componentInstance;
    spyOn(component.endSession, 'emit');

    const endBtn = fixture.debugElement
      .queryAll(By.css('.timer-btn'))
      .find(b => b.nativeElement.textContent.trim() === 'End')!;
    endBtn.triggerEventHandler('click', null);

    expect(component.endSession.emit).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Button click outputs — EN PAUSE (paused)
// ---------------------------------------------------------------------------

describe('SessionHeaderChronoComponent — button click outputs when paused', () => {
  it('should emit the resume event when the user clicks the Reprendre button during a paused session', () => {
    const fixture = createComponent('paused');
    const component = fixture.componentInstance;
    spyOn(component.resume, 'emit');

    const reprendreBtn = fixture.debugElement
      .queryAll(By.css('.timer-btn'))
      .find(b => b.nativeElement.textContent.trim() === 'Reprendre')!;
    reprendreBtn.triggerEventHandler('click', null);

    expect(component.resume.emit).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Button click outputs — TERMINÉ (ended)
// ---------------------------------------------------------------------------

describe('SessionHeaderChronoComponent — button click outputs when ended', () => {
  it('should emit the resume event when the user clicks the Reprendre button after the session has ended', () => {
    const fixture = createComponent('ended');
    const component = fixture.componentInstance;
    spyOn(component.resume, 'emit');

    const reprendreBtn = fixture.debugElement
      .queryAll(By.css('.timer-btn'))
      .find(b => b.nativeElement.textContent.trim() === 'Reprendre')!;
    reprendreBtn.triggerEventHandler('click', null);

    expect(component.resume.emit).toHaveBeenCalledTimes(1);
  });

  it('should emit the durationClick event when the user clicks the Modifier button after the session has ended', () => {
    const fixture = createComponent('ended');
    const component = fixture.componentInstance;
    spyOn(component.durationClick, 'emit');

    const modifierBtn = fixture.debugElement
      .queryAll(By.css('.timer-btn'))
      .find(b => b.nativeElement.textContent.trim() === 'Modifier')!;
    modifierBtn.triggerEventHandler('click', null);

    expect(component.durationClick.emit).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Timer click output (all states)
// ---------------------------------------------------------------------------

describe('SessionHeaderChronoComponent — timer display click', () => {
  it('should emit the durationClick event when the user clicks on the timer display', () => {
    const fixture = createComponent('running');
    const component = fixture.componentInstance;
    spyOn(component.durationClick, 'emit');

    const timerEl = fixture.debugElement.query(By.css('.timer-big'));
    timerEl.triggerEventHandler('click', null);

    expect(component.durationClick.emit).toHaveBeenCalledTimes(1);
  });
});
