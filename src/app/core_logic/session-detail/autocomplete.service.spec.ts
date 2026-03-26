import { TestBed } from '@angular/core/testing';
import { AutocompleteService } from './autocomplete.service';
import { EXERCISE_REPOSITORY } from '../../secondary_ports/exercise/exercise.repository.interface';
import { Exercise } from '../shared/models';

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'id-1',
    sessionId: 'session-1',
    name: 'Développé couché',
    muscleGroup: null,
    muscleGroups: [],
    weightKg: 60,
    sets: 3,
    reps: 10,
    breakDurationSeconds: 90,
    status: 'pending',
    isCardio: false,
    durationSeconds: 0,
    distanceKm: null,
    ...overrides,
  };
}

describe('AutocompleteService', () => {
  let service: AutocompleteService;
  let repoSpy: jasmine.SpyObj<{ getAll: () => Promise<Exercise[]> }>;

  beforeEach(() => {
    repoSpy = jasmine.createSpyObj('ExerciseRepository', ['getAll', 'getBySessionId', 'save', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        AutocompleteService,
        { provide: EXERCISE_REPOSITORY, useValue: repoSpy },
      ],
    });

    service = TestBed.inject(AutocompleteService);
  });

  describe('getDefaultsByExactName', () => {
    it('should return null when there are no exercises', async () => {
      repoSpy.getAll.and.returnValue(Promise.resolve([]));

      const result = await service.getDefaultsByExactName('Développé couché');

      expect(result).toBeNull();
    });

    it('should return null when no exercise has that exact name', async () => {
      repoSpy.getAll.and.returnValue(Promise.resolve([
        makeExercise({ name: 'Squat', weightKg: 80, sets: 4, reps: 8, breakDurationSeconds: 120 }),
      ]));

      const result = await service.getDefaultsByExactName('Développé couché');

      expect(result).toBeNull();
    });

    it('should return the default params of the matching exercise when an exact name match exists', async () => {
      repoSpy.getAll.and.returnValue(Promise.resolve([
        makeExercise({ name: 'Développé couché', weightKg: 75, sets: 4, reps: 8, breakDurationSeconds: 120 }),
      ]));

      const result = await service.getDefaultsByExactName('Développé couché');

      expect(result).toEqual({ weightKg: 75, sets: 4, reps: 8, breakDurationSeconds: 120 });
    });

    it('should match exercise name case-insensitively', async () => {
      repoSpy.getAll.and.returnValue(Promise.resolve([
        makeExercise({ name: 'développé couché', weightKg: 75, sets: 4, reps: 8, breakDurationSeconds: 120 }),
      ]));

      const result = await service.getDefaultsByExactName('DÉVELOPPÉ COUCHÉ');

      expect(result).toEqual({ weightKg: 75, sets: 4, reps: 8, breakDurationSeconds: 120 });
    });

    it('should return the most recent (last) match when multiple exercises share the same name', async () => {
      repoSpy.getAll.and.returnValue(Promise.resolve([
        makeExercise({ id: 'id-1', name: 'Squat', weightKg: 60, sets: 3, reps: 10, breakDurationSeconds: 90 }),
        makeExercise({ id: 'id-2', name: 'Squat', weightKg: 80, sets: 5, reps: 5, breakDurationSeconds: 180 }),
      ]));

      const result = await service.getDefaultsByExactName('Squat');

      expect(result).toEqual({ weightKg: 80, sets: 5, reps: 5, breakDurationSeconds: 180 });
    });
  });
});
