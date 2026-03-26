import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { CreateSessionUseCase } from './primary_ports/session-list/create-session.usecase';
import { SessionDetailUiService } from './primary_adapters/session-detail/session-detail-ui.service';

function createCreateSessionSpy() {
  return { execute: jasmine.createSpy('execute') };
}

function createUiServiceStub() {
  return {
    showAddExerciseForm: () => false,
    openAddExerciseForm: jasmine.createSpy('openAddExerciseForm'),
    closeAddExerciseForm: jasmine.createSpy('closeAddExerciseForm'),
  };
}

async function setup(initialUrl: string) {
  await TestBed.configureTestingModule({
    imports: [AppComponent],
    providers: [
      provideRouter([
        { path: 'sessions', component: AppComponent },
        { path: 'sessions/:id', component: AppComponent },
        { path: 'stats', component: AppComponent },
        { path: 'chrono/session', component: AppComponent },
      ]),
      { provide: CreateSessionUseCase, useValue: createCreateSessionSpy() },
      { provide: SessionDetailUiService, useValue: createUiServiceStub() },
    ],
  }).compileComponents();

  const router = TestBed.inject(Router);
  await router.navigateByUrl(initialUrl);

  const fixture = TestBed.createComponent(AppComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture };
}

describe('AppComponent — sélection de navbar selon la route', () => {
  it('affiche app-bottom-nav sur /sessions', async () => {
    const { fixture } = await setup('/sessions');

    const bottomNav = fixture.debugElement.query(By.css('app-bottom-nav'));
    const sessionNav = fixture.debugElement.query(By.css('app-session-bottom-nav'));

    expect(bottomNav).not.toBeNull();
    expect(sessionNav).toBeNull();
  });

  it('affiche app-session-bottom-nav sur /sessions/:id', async () => {
    const { fixture } = await setup('/sessions/abc-123');

    const bottomNav = fixture.debugElement.query(By.css('app-bottom-nav'));
    const sessionNav = fixture.debugElement.query(By.css('app-session-bottom-nav'));

    expect(sessionNav).not.toBeNull();
    expect(bottomNav).toBeNull();
  });

  it('affiche app-session-bottom-nav sur /chrono/session', async () => {
    const { fixture } = await setup('/chrono/session');

    const bottomNav = fixture.debugElement.query(By.css('app-bottom-nav'));
    const sessionNav = fixture.debugElement.query(By.css('app-session-bottom-nav'));

    expect(sessionNav).not.toBeNull();
    expect(bottomNav).toBeNull();
  });
});
