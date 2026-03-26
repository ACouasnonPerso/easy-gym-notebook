import { TestBed } from '@angular/core/testing';
import { ExerciseMapper } from './exercise.mapper';
import { Exercise, RawExercise } from '../../core_logic/shared/models';

function makeRawExercise(overrides: Partial<RawExercise> = {}): RawExercise {
  return {
    id: 'ex-1',
    sessionId: 'session-1',
    name: 'Course à pied',
    muscleGroup: null,
    weightKg: 0,
    sets: 0,
    reps: 0,
    breakDurationSeconds: 0,
    status: 'pending',
    isCardio: true,
    durationSeconds: 1800,
    distanceKm: 5,
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
    status: 'pending',
    isCardio: true,
    durationSeconds: 1800,
    distanceKm: 5,
    ...overrides,
  };
}

describe('ExerciseMapper', () => {
  let mapper: ExerciseMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ExerciseMapper] });
    mapper = TestBed.inject(ExerciseMapper);
  });

  describe('toDomain', () => {
    it('should map durationSeconds and distanceKm from raw to domain', () => {
      const raw = makeRawExercise({ durationSeconds: 1800, distanceKm: 5 });

      const result = mapper.toDomain(raw);

      expect(result.durationSeconds).toBe(1800);
      expect(result.distanceKm).toBe(5);
    });

    it('should map isCardio from raw to domain', () => {
      const raw = makeRawExercise({ isCardio: true });

      const result = mapper.toDomain(raw);

      expect(result.isCardio).toBeTrue();
    });

    it('should map distanceKm as null when raw distanceKm is null', () => {
      const raw = makeRawExercise({ distanceKm: null });

      const result = mapper.toDomain(raw);

      expect(result.distanceKm).toBeNull();
    });

    it('should default isCardio to false when raw does not have the field', () => {
      const raw = makeRawExercise({ isCardio: false });

      const result = mapper.toDomain(raw);

      expect(result.isCardio).toBeFalse();
    });
  });

  describe('toStorage', () => {
    it('should map durationSeconds and distanceKm from domain to storage', () => {
      const exercise = makeExercise({ durationSeconds: 3600, distanceKm: 10 });

      const result = mapper.toStorage(exercise);

      expect(result.durationSeconds).toBe(3600);
      expect(result.distanceKm).toBe(10);
    });

    it('should map isCardio from domain to storage', () => {
      const exercise = makeExercise({ isCardio: true });

      const result = mapper.toStorage(exercise);

      expect(result.isCardio).toBeTrue();
    });

    it('should map distanceKm as null when domain distanceKm is null', () => {
      const exercise = makeExercise({ distanceKm: null });

      const result = mapper.toStorage(exercise);

      expect(result.distanceKm).toBeNull();
    });
  });
});
