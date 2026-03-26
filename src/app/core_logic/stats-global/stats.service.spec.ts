import { TestBed } from '@angular/core/testing';
import { StatsService, MonthSummary } from './stats.service';
import { SESSION_REPOSITORY } from '../../secondary_ports/session/session.repository.interface';
import { EXERCISE_REPOSITORY } from '../../secondary_ports/exercise/exercise.repository.interface';
import { Session, Exercise } from '../shared/models';
import { SessionDuration } from './stats.service';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    date: new Date(),
    status: 'completed',
    durationSeconds: 0,
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
    weightKg: 0,
    sets: 1,
    reps: 1,
    breakDurationSeconds: 60,
    status: 'validated',
    isCardio: false,
    durationSeconds: 0,
    distanceKm: null,
    ...overrides,
  };
}

/** Returns a Date for Monday of the current week at midnight */
function getMondayOfCurrentWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

describe('StatsService', () => {
  let service: StatsService;
  let sessionRepoSpy: jasmine.SpyObj<{ getAll: () => Promise<Session[]>; getById: (id: string) => Promise<Session | null>; save: (s: Session) => Promise<void>; delete: (id: string) => Promise<void> }>;
  let exerciseRepoSpy: jasmine.SpyObj<{ getAll: () => Promise<Exercise[]>; getBySessionId: () => Promise<Exercise[]>; save: (e: Exercise) => Promise<void>; delete: (id: string) => Promise<void> }>;

  beforeEach(() => {
    sessionRepoSpy = jasmine.createSpyObj('SessionRepository', ['getAll', 'getById', 'save', 'delete']);
    exerciseRepoSpy = jasmine.createSpyObj('ExerciseRepository', ['getAll', 'getBySessionId', 'save', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        StatsService,
        { provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
        { provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
      ],
    });

    service = TestBed.inject(StatsService);
  });

  describe('sessionDurationsInMonth', () => {
    it('should return [] when all durationSeconds are 0', () => {
      const march10 = new Date(2026, 2, 10);
      const march15 = new Date(2026, 2, 15);
      service._allSessions.set([
        makeSession({ id: 's1', date: march10, durationSeconds: 0 }),
        makeSession({ id: 's2', date: march15, durationSeconds: 0 }),
      ]);
      service.selectedMonth.set(new Date(2026, 2, 1));

      const result: SessionDuration[] = service.sessionDurationsInMonth();

      expect(result).toEqual([]);
    });

    it('should exclude sessions outside the selected month', () => {
      const march10 = new Date(2026, 2, 10);
      const feb15 = new Date(2026, 1, 15);
      const april5 = new Date(2026, 3, 5);
      service._allSessions.set([
        makeSession({ id: 's1', date: march10, durationSeconds: 3600 }),
        makeSession({ id: 's2', date: feb15, durationSeconds: 1800 }),
        makeSession({ id: 's3', date: april5, durationSeconds: 2700 }),
      ]);
      service.selectedMonth.set(new Date(2026, 2, 1));

      const result: SessionDuration[] = service.sessionDurationsInMonth();

      expect(result.length).toBe(1);
      expect(result[0].durationSeconds).toBe(3600);
    });

    it('should return sessions of the selected month sorted by date with correct durationSeconds', () => {
      const march10 = new Date(2026, 2, 10);
      const march5 = new Date(2026, 2, 5);
      const march20 = new Date(2026, 2, 20);
      service._allSessions.set([
        makeSession({ id: 's1', date: march10, durationSeconds: 3600 }),
        makeSession({ id: 's2', date: march5, durationSeconds: 1800 }),
        makeSession({ id: 's3', date: march20, durationSeconds: 2700 }),
      ]);
      service.selectedMonth.set(new Date(2026, 2, 1));

      const result: SessionDuration[] = service.sessionDurationsInMonth();

      expect(result.length).toBe(3);
      expect(result[0]).toEqual({ date: march5, durationSeconds: 1800 });
      expect(result[1]).toEqual({ date: march10, durationSeconds: 3600 });
      expect(result[2]).toEqual({ date: march20, durationSeconds: 2700 });
    });
  });

  describe('weekSummary', () => {
    it('should return zeros when there are no sessions', () => {
      service._allSessions.set([]);
      service._allExercises.set([]);

      const result = service.weekSummary();

      expect(result).toEqual({ totalWeightKg: 0, sessionCount: 0, totalDurationSeconds: 0 });
    });

    it('should count a session that falls in the current week', () => {
      const monday = getMondayOfCurrentWeek();
      service._allSessions.set([
        makeSession({ id: 'session-1', date: monday, durationSeconds: 0 }),
      ]);
      service._allExercises.set([]);

      const result = service.weekSummary();

      expect(result.sessionCount).toBe(1);
    });

    it('should sum totalWeightKg from validated exercises in the current week', () => {
      const monday = getMondayOfCurrentWeek();
      service._allSessions.set([
        makeSession({ id: 'session-1', date: monday }),
      ]);
      service._allExercises.set([
        makeExercise({ sessionId: 'session-1', weightKg: 80, sets: 4, reps: 8, status: 'validated' }),
      ]);

      const result = service.weekSummary();

      expect(result.totalWeightKg).toBe(80 * 4 * 8);
    });

    it('should sum totalDurationSeconds from sessions in the current week', () => {
      const monday = getMondayOfCurrentWeek();
      service._allSessions.set([
        makeSession({ id: 'session-1', date: monday, durationSeconds: 3600 }),
        makeSession({ id: 'session-2', date: monday, durationSeconds: 1800 }),
      ]);
      service._allExercises.set([]);

      const result = service.weekSummary();

      expect(result.totalDurationSeconds).toBe(5400);
    });

    it('should exclude sessions outside the current week', () => {
      const monday = getMondayOfCurrentWeek();
      const lastWeekDate = new Date(monday);
      lastWeekDate.setDate(lastWeekDate.getDate() - 1); // Sunday of last week

      service._allSessions.set([
        makeSession({ id: 'session-last-week', date: lastWeekDate, durationSeconds: 3600 }),
      ]);
      service._allExercises.set([]);

      const result = service.weekSummary();

      expect(result.sessionCount).toBe(0);
      expect(result.totalDurationSeconds).toBe(0);
    });
  });
});
