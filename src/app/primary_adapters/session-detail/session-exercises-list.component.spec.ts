import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, input, output, signal } from '@angular/core';
import { SessionExercisesListComponent } from './session-exercises-list.component';
import { SessionDetailUiService } from './session-detail-ui.service';

@Component({ selector: 'app-exercise-card', standalone: true, template: '' })
class FakeExerciseCardComponent {}

@Component({ selector: 'app-add-exercise-form', standalone: true, template: '<div class="stub-add-form"></div>' })
class FakeAddExerciseFormComponent {
  readonly sessionId = input.required<string>();
  readonly exerciseAdded = output();
  readonly cancelled = output();
}

@Component({ selector: 'app-confirm-dialog', standalone: true, template: '' })
class FakeConfirmDialogComponent {
  readonly message = input<string>();
  readonly confirmed = output();
  readonly cancelled = output();
}

async function setup() {
  const showAddExerciseFormSignal = signal(false);
  const uiServiceStub = {
    showAddExerciseForm: showAddExerciseFormSignal,
    openAddExerciseForm: jasmine.createSpy('openAddExerciseForm'),
    closeAddExerciseForm: jasmine.createSpy('closeAddExerciseForm'),
  };

  await TestBed.configureTestingModule({
    imports: [SessionExercisesListComponent],
    providers: [
      { provide: SessionDetailUiService, useValue: uiServiceStub },
    ],
  })
    .overrideComponent(SessionExercisesListComponent, {
      set: {
        imports: [FakeExerciseCardComponent, FakeAddExerciseFormComponent, FakeConfirmDialogComponent],
      },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(SessionExercisesListComponent);
  fixture.componentRef.setInput('exercises', []);
  fixture.componentRef.setInput('sessionId', 'session-1');
  fixture.detectChanges();

  return { fixture, showAddExerciseFormSignal, uiServiceSpy: uiServiceStub };
}

describe('SessionExercisesListComponent', () => {
  it('ne contient pas de bouton FAB interne', async () => {
    const { fixture } = await setup();

    const fab = fixture.debugElement.query(By.css('.fab'));
    expect(fab).toBeNull();
  });

  it('affiche le formulaire quand showAddExerciseForm du service est true', async () => {
    const { fixture, showAddExerciseFormSignal } = await setup();

    showAddExerciseFormSignal.set(true);
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('app-add-exercise-form'));
    expect(form).not.toBeNull();
  });
});
