import { TestBed } from '@angular/core/testing';
import { ImportService } from './import.service';
import { ImportMapper } from '../../secondary_adapters/import/import.mapper';
import { SESSION_REPOSITORY } from '../../secondary_ports/session/session.repository.interface';
import { EXERCISE_REPOSITORY } from '../../secondary_ports/exercise/exercise.repository.interface';
import { Session, Exercise } from '../shared/models';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    date: new Date('2026-03-01'),
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
    name: 'Développé couché',
    muscleGroup: null,
    muscleGroups: [],
    weightKg: 80,
    sets: 4,
    reps: 8,
    breakDurationSeconds: 90,
    status: 'validated',
    isCardio: false,
    durationSeconds: 0,
    distanceKm: null,
    isPyramid: false,
    pyramidSets: [],
    ...overrides,
  };
}

function makeValidPayloadJson(options: { sessions?: object[]; exercises?: object[] } = {}): string {
  return JSON.stringify({
    sessions: options.sessions ?? [
      {
        id: 'session-new',
        date: '2026-03-01T00:00:00.000Z',
        status: 'completed',
        durationSeconds: 3600,
        muscleGroup: null,
      },
    ],
    exercises: options.exercises ?? [
      {
        id: 'ex-new',
        sessionId: 'session-new',
        name: 'Squat',
        muscleGroup: null,
        weightKg: 100,
        sets: 5,
        reps: 5,
        breakDurationSeconds: 180,
        status: 'validated',
        isCardio: false,
        durationSeconds: 0,
        distanceKm: null,
        isPyramid: false,
        pyramidSets: [],
      },
    ],
  });
}

describe('ImportService', () => {
  let service: ImportService;
  let sessionRepoSpy: jasmine.SpyObj<{
    getAll: () => Promise<Session[]>;
    getById: (id: string) => Promise<Session | null>;
    save: (s: Session) => Promise<void>;
    delete: (id: string) => Promise<void>;
  }>;
  let exerciseRepoSpy: jasmine.SpyObj<{
    getAll: () => Promise<Exercise[]>;
    getBySessionId: (id: string) => Promise<Exercise[]>;
    save: (e: Exercise) => Promise<void>;
    delete: (id: string) => Promise<void>;
  }>;

  beforeEach(() => {
    sessionRepoSpy = jasmine.createSpyObj('SessionRepository', ['getAll', 'getById', 'save', 'delete']);
    exerciseRepoSpy = jasmine.createSpyObj('ExerciseRepository', ['getAll', 'getBySessionId', 'save', 'delete']);

    sessionRepoSpy.getAll.and.returnValue(Promise.resolve([]));
    exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([]));
    sessionRepoSpy.save.and.returnValue(Promise.resolve());
    exerciseRepoSpy.save.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        ImportService,
        ImportMapper,
        { provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
        { provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
      ],
    });

    service = TestBed.inject(ImportService);
  });

  describe('validate()', () => {
    it('should return an error result when the JSON string is invalid', async () => {
      const result = await service.validate('not-valid-json{{{');

      expect(result.valid).toBeFalse();
      expect(result.error).toBeDefined();
    });

    it('should return an error result when the parsed object is missing the "sessions" array', async () => {
      const json = JSON.stringify({ exercises: [] });

      const result = await service.validate(json);

      expect(result.valid).toBeFalse();
      expect(result.error).toBeDefined();
    });

    it('should return an error result when the parsed object is missing the "exercises" array', async () => {
      const json = JSON.stringify({ sessions: [] });

      const result = await service.validate(json);

      expect(result.valid).toBeFalse();
      expect(result.error).toBeDefined();
    });

    it('should return a valid result with session and exercise counts for a well-formed JSON payload', async () => {
      const json = makeValidPayloadJson();

      const result = await service.validate(json);

      expect(result.valid).toBeTrue();
      expect(result.sessionCount).toBe(1);
      expect(result.exerciseCount).toBe(1);
    });

    it('should return a valid result with zero counts when sessions and exercises arrays are empty', async () => {
      const json = makeValidPayloadJson({ sessions: [], exercises: [] });

      const result = await service.validate(json);

      expect(result.valid).toBeTrue();
      expect(result.sessionCount).toBe(0);
      expect(result.exerciseCount).toBe(0);
    });

    it('should return an error result when one exercise entry fails the mapper guard', async () => {
      const json = JSON.stringify({
        sessions: [],
        exercises: [
          { id: 'ex-new', sessionId: 'session-new' /* missing required fields */ },
        ],
      });

      const result = await service.validate(json);

      expect(result.valid).toBeFalse();
      expect(result.error).toBeDefined();
    });
  });

  describe('persist()', () => {
    it('should save only sessions whose IDs do not already exist in the repository', async () => {
      sessionRepoSpy.getAll.and.returnValue(Promise.resolve([makeSession({ id: 'session-existing' })]));
      exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([]));

      const json = JSON.stringify({
        sessions: [
          {
            id: 'session-existing',
            date: '2026-03-01T00:00:00.000Z',
            status: 'completed',
            durationSeconds: 0,
            muscleGroup: null,
          },
          {
            id: 'session-new',
            date: '2026-03-02T00:00:00.000Z',
            status: 'completed',
            durationSeconds: 0,
            muscleGroup: null,
          },
        ],
        exercises: [],
      });

      await service.validate(json);
      await service.persist();

      const savedIds = sessionRepoSpy.save.calls.allArgs().map(args => (args[0] as Session).id);
      expect(savedIds).not.toContain('session-existing');
      expect(savedIds).toContain('session-new');
    });

    it('should save only exercises whose IDs do not already exist in the repository', async () => {
      sessionRepoSpy.getAll.and.returnValue(Promise.resolve([]));
      exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([makeExercise({ id: 'ex-existing' })]));

      const json = JSON.stringify({
        sessions: [],
        exercises: [
          {
            id: 'ex-existing',
            sessionId: 'session-1',
            name: 'Squat',
            muscleGroup: null,
            weightKg: 100,
            sets: 5,
            reps: 5,
            breakDurationSeconds: 180,
            status: 'validated',
            isCardio: false,
            durationSeconds: 0,
            distanceKm: null,
            isPyramid: false,
            pyramidSets: [],
          },
          {
            id: 'ex-new',
            sessionId: 'session-1',
            name: 'Squat',
            muscleGroup: null,
            weightKg: 100,
            sets: 5,
            reps: 5,
            breakDurationSeconds: 180,
            status: 'validated',
            isCardio: false,
            durationSeconds: 0,
            distanceKm: null,
            isPyramid: false,
            pyramidSets: [],
          },
        ],
      });

      await service.validate(json);
      await service.persist();

      const savedIds = exerciseRepoSpy.save.calls.allArgs().map(args => (args[0] as Exercise).id);
      expect(savedIds).not.toContain('ex-existing');
      expect(savedIds).toContain('ex-new');
    });
  });
});
