import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { SessionBottomNavComponent } from './session-bottom-nav.component';
import { SessionDetailUiService } from '../session-detail/session-detail-ui.service';

function createUiServiceSpy() {
  return {
    showAddExerciseForm: jasmine.createSpy('showAddExerciseForm'),
    openAddExerciseForm: jasmine.createSpy('openAddExerciseForm'),
    closeAddExerciseForm: jasmine.createSpy('closeAddExerciseForm'),
    currentSessionId: signal(null),
  };
}

async function setup() {
  const uiServiceSpy = createUiServiceSpy();

  await TestBed.configureTestingModule({
    imports: [SessionBottomNavComponent],
    providers: [
      provideRouter([]),
      { provide: SessionDetailUiService, useValue: uiServiceSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(SessionBottomNavComponent);
  fixture.detectChanges();

  return { fixture, uiServiceSpy };
}

describe('SessionBottomNavComponent', () => {
  it('affiche un lien "Sessions" vers /sessions', async () => {
    const { fixture } = await setup();

    const links = fixture.debugElement.queryAll(By.css('a[routerLink]'));
    const sessionsLink = links.find(l => l.nativeElement.getAttribute('ng-reflect-router-link') === '/sessions');
    expect(sessionsLink).toBeTruthy();
  });

  it('affiche un lien "Chrono" vers /chrono/exercise', async () => {
    const { fixture } = await setup();

    const links = fixture.debugElement.queryAll(By.css('a[routerLink]'));
    const chronoLink = links.find(l => l.nativeElement.getAttribute('ng-reflect-router-link') === '/chrono/exercise');
    expect(chronoLink).toBeTruthy();
  });

  it('le bouton central "+" appelle openAddExerciseForm au clic', async () => {
    const { fixture, uiServiceSpy } = await setup();

    const addBtn = fixture.debugElement.query(By.css('[aria-label="Ajouter un exercice"]'));
    addBtn.nativeElement.click();

    expect(uiServiceSpy.openAddExerciseForm).toHaveBeenCalledTimes(1);
  });
});
