import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { AddExerciseFormComponent } from './add-exercise-form.component';
import { AddExerciseUseCase } from '../../primary_ports/session-detail/add-exercise.usecase';
import { AutocompleteService } from '../../core_logic/session-detail/autocomplete.service';
import { MuscleGroupDetectorService } from '../../core_logic/shared/muscle-group-detector.service';
import { EXERCISE_REPOSITORY } from '../../secondary_ports/exercise/exercise.repository.interface';
import { SESSION_REPOSITORY } from '../../secondary_ports/session/session.repository.interface';

describe('AddExerciseFormComponent — onSuggestionSelect', () => {
  let component: AddExerciseFormComponent;
  let autocompleteSpy: jasmine.SpyObj<AutocompleteService>;

  beforeEach(() => {
    autocompleteSpy = jasmine.createSpyObj('AutocompleteService', [
      'getSuggestions',
      'getDefaultsByExactName',
      'getLastParams',
    ]);
    autocompleteSpy.getLastParams.and.returnValue(Promise.resolve(null));

    const exerciseRepoSpy = jasmine.createSpyObj('ExerciseRepository', ['getAll', 'getBySessionId', 'save', 'delete']);
    exerciseRepoSpy.save.and.returnValue(Promise.resolve());
    exerciseRepoSpy.getBySessionId.and.returnValue(Promise.resolve([]));
    exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([]));

    const sessionRepoSpy = jasmine.createSpyObj('SessionRepository', ['getAll', 'getById', 'save', 'delete']);
    sessionRepoSpy.save.and.returnValue(Promise.resolve());
    sessionRepoSpy.getAll.and.returnValue(Promise.resolve([]));

    TestBed.configureTestingModule({
      imports: [AddExerciseFormComponent],
      providers: [
        { provide: AutocompleteService, useValue: autocompleteSpy },
        { provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
        { provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
      ],
    }).overrideComponent(AddExerciseFormComponent, {
      set: { providers: [] },
    });

    const fixture = TestBed.createComponent(AddExerciseFormComponent);
    fixture.componentRef.setInput('sessionId', 'session-1');
    component = fixture.componentInstance;
  });

  it('should set the name signal to the selected suggestion', async () => {
    await component.onSuggestionSelect('Développé couché');

    expect(component.name()).toBe('Développé couché');
  });

  it('should clear the suggestions list after selecting a suggestion', async () => {
    component.suggestions.set(['Développé couché', 'Développé incliné']);

    await component.onSuggestionSelect('Développé couché');

    expect(component.suggestions()).toEqual([]);
  });

  it('should keep the current params when no history exists for the selected suggestion', async () => {
    autocompleteSpy.getLastParams.and.returnValue(Promise.resolve(null));
    component.weightKg.set(60);
    component.sets.set(3);
    component.reps.set(10);
    component.breakDurationSeconds.set(90);

    await component.onSuggestionSelect('Exercice inconnu');

    expect(component.weightKg()).toBe(60);
    expect(component.sets()).toBe(3);
    expect(component.reps()).toBe(10);
    expect(component.breakDurationSeconds()).toBe(90);
  });

  it('should set all four params from history when history exists for the selected suggestion', async () => {
    autocompleteSpy.getLastParams.and.returnValue(Promise.resolve({
      weightKg: 80,
      sets: 5,
      reps: 8,
      breakDurationSeconds: 180,
    }));

    await component.onSuggestionSelect('Squat');

    expect(component.weightKg()).toBe(80);
    expect(component.sets()).toBe(5);
    expect(component.reps()).toBe(8);
    expect(component.breakDurationSeconds()).toBe(180);
  });

  it('should call getLastParams with the exact selected suggestion name', async () => {
    await component.onSuggestionSelect('Curl biceps');

    expect(autocompleteSpy.getLastParams).toHaveBeenCalledOnceWith('Curl biceps');
  });
});
