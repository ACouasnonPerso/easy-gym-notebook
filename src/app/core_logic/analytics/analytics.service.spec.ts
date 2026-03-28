import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';
import { AnonymousIdService } from './anonymous-id.service';
import { ANALYTICS_REPOSITORY } from '../../secondary_ports/analytics/analytics.repository.interface';
import { Session, MuscleGroup } from '../shared/models';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-abc',
    date: new Date('2026-03-28'),
    status: 'active',
    durationSeconds: 3600,
    muscleGroup: MuscleGroup.Chest,
    exercises: [],
    ...overrides,
  };
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let anonymousIdSpy: jasmine.SpyObj<AnonymousIdService>;
  let repoSpy: jasmine.SpyObj<any>;

  beforeEach(() => {
    anonymousIdSpy = jasmine.createSpyObj('AnonymousIdService', ['getId', 'getCountry']);
    anonymousIdSpy.getId.and.returnValue('test-uid-1234-5678-9012-345678901234');
    anonymousIdSpy.getCountry.and.returnValue('FR');

    repoSpy = jasmine.createSpyObj('IAnalyticsRepository', [
      'trackSessionStarted',
      'trackSessionUpdated',
      'trackSessionCompleted',
    ]);
    repoSpy.trackSessionStarted.and.returnValue(Promise.resolve());
    repoSpy.trackSessionUpdated.and.returnValue(Promise.resolve());
    repoSpy.trackSessionCompleted.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        AnalyticsService,
        { provide: AnonymousIdService, useValue: anonymousIdSpy },
        { provide: ANALYTICS_REPOSITORY, useValue: repoSpy },
      ],
    });

    service = TestBed.inject(AnalyticsService);
  });

  describe('trackSessionStarted()', () => {
    it('should call repo.trackSessionStarted with uid, country, sessionId, muscleGroup', () => {
      const session = makeSession({ id: 'session-1', muscleGroup: MuscleGroup.Back });

      service.trackSessionStarted(session);

      expect(repoSpy.trackSessionStarted).toHaveBeenCalledOnceWith({
        sessionId: 'session-1',
        uid: 'test-uid-1234-5678-9012-345678901234',
        country: 'FR',
        muscleGroup: MuscleGroup.Back,
      });
    });

    it('should call getCountry() from AnonymousIdService', () => {
      service.trackSessionStarted(makeSession());

      expect(anonymousIdSpy.getCountry).toHaveBeenCalled();
    });

    it('should not propagate a repository error', async () => {
      repoSpy.trackSessionStarted.and.returnValue(Promise.reject(new Error('Firestore error')));

      expect(() => service.trackSessionStarted(makeSession())).not.toThrow();
      await expectAsync(Promise.resolve()).toBeResolved();
    });
  });

  describe('trackSessionUpdated()', () => {
    it('should call repo.trackSessionUpdated with the correct sessionId and exerciseNames', () => {
      const session = makeSession({ id: 'session-2' });
      const names = ['Développé couché', 'Curl biceps'];

      service.trackSessionUpdated(session, names);

      expect(repoSpy.trackSessionUpdated).toHaveBeenCalledOnceWith('session-2', names);
    });
  });

  describe('trackSessionCompleted()', () => {
    it('should call repo.trackSessionCompleted with uid, sessionId, durationSeconds', () => {
      const session = makeSession({ id: 'session-3', durationSeconds: 5400 });

      service.trackSessionCompleted(session);

      expect(repoSpy.trackSessionCompleted).toHaveBeenCalledOnceWith({
        sessionId: 'session-3',
        uid: 'test-uid-1234-5678-9012-345678901234',
        durationSeconds: 5400,
      });
    });

    it('should not propagate a repository error', async () => {
      repoSpy.trackSessionCompleted.and.returnValue(Promise.reject(new Error('Network error')));

      expect(() => service.trackSessionCompleted(makeSession())).not.toThrow();
      await expectAsync(Promise.resolve()).toBeResolved();
    });
  });
});
