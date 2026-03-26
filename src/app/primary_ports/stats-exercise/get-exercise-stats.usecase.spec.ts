import { TestBed } from '@angular/core/testing';
import { GetExerciseStatsUseCase } from './get-exercise-stats.usecase';
import { ExerciseStatsService } from '../../core_logic/stats-exercise/exercise-stats.service';
import { SESSION_REPOSITORY } from '../../secondary_ports/session/session.repository.interface';
import { EXERCISE_REPOSITORY } from '../../secondary_ports/exercise/exercise.repository.interface';
import { Exercise, Session } from '../../core_logic/shared/models';

function makeSession(overrides: Partial<Session> = {}): Session {
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

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    sessionId: 'session-1',
    name: 'Course à pied',
    muscleGroup: null,
    muscleGroups: [],
    weightKg: 0,
    sets: 0,
    reps: 0,
    breakDurationSeconds: 0,
    status: 'validated',
    isCardio: false,
    durationSeconds: 0,
    distanceKm: null,
    ...overrides,
  };
}

describe('GetExerciseStatsUseCase', () => {
  let useCase: GetExerciseStatsUseCase;
  let sessionRepoSpy: jasmine.SpyObj<{ getAll: () => Promise<Session[]> }>;
  let exerciseRepoSpy: jasmine.SpyObj<{ getAll: () => Promise<Exercise[]> }>;

  beforeEach(() => {
    sessionRepoSpy = jasmine.createSpyObj('SessionRepository', ['getAll']);
    exerciseRepoSpy = jasmine.createSpyObj('ExerciseRepository', ['getAll', 'getBySessionId', 'save', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        GetExerciseStatsUseCase,
        ExerciseStatsService,
        { provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
        { provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
      ],
    });

    useCase = TestBed.inject(GetExerciseStatsUseCase);
  });

  describe('cardioOccurrences exposure', () => {
    it('should expose cardioOccurrences from the stats service', async () => {
      const session = makeSession();
      const exercise = makeExercise({ isCardio: true, durationSeconds: 1800, distanceKm: 5 });

      sessionRepoSpy.getAll.and.returnValue(Promise.resolve([session]));
      exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([exercise]));

      await useCase.execute('Course à pied');

      expect(useCase.cardioOccurrences().length).toBe(1);
      expect(useCase.cardioOccurrences()[0].durationSeconds).toBe(1800);
    });

    it('should derive isCardio as true when cardioOccurrences is non-empty', async () => {
      const session = makeSession();
      const exercise = makeExercise({ isCardio: true, durationSeconds: 1800, distanceKm: null });

      sessionRepoSpy.getAll.and.returnValue(Promise.resolve([session]));
      exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([exercise]));

      await useCase.execute('Course à pied');

      expect(useCase.isCardio()).toBeTrue();
    });

    it('should derive isCardio as false when cardioOccurrences is empty', async () => {
      const session = makeSession();
      const exercise = makeExercise({ isCardio: false, durationSeconds: 0 });

      sessionRepoSpy.getAll.and.returnValue(Promise.resolve([session]));
      exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([exercise]));

      await useCase.execute('Course à pied');

      expect(useCase.isCardio()).toBeFalse();
    });
  });
});
