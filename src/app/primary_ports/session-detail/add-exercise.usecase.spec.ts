import { TestBed } from '@angular/core/testing';
import { AddExerciseUseCase } from './add-exercise.usecase';
import { ExerciseService } from '../../core_logic/session-detail/exercise.service';
import { MuscleGroupDetectorService } from '../../core_logic/shared/muscle-group-detector.service';
import { SessionService } from '../../core_logic/session/session.service';
import { Exercise, MuscleGroup, Session } from '../../core_logic/shared/models';
import { EXERCISE_REPOSITORY } from '../../secondary_ports/exercise/exercise.repository.interface';
import { SESSION_REPOSITORY } from '../../secondary_ports/session/session.repository.interface';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

const MUSCLE_DETECTOR_FR: Record<string, string> = {
  'muscleDetector.chest':          'développé couché,développé,developpe,pectoraux,poitrine,bench,pecs,dc',
  'muscleDetector.back':           'dorsaux,tirage,rowing,tractions,pull,dos',
  'muscleDetector.backHamstrings': 'soulevé de terre,deadlift',
  'muscleDetector.shoulders':      'deltoides,deltoide,militaire,epaules,epaule,ohp',
  'muscleDetector.biceps':         'biceps,bibi',
  'muscleDetector.triceps':        'triceps,pushdown,tritri',
  'muscleDetector.tricepsChest':   'dips',
  'muscleDetector.glutesQuads':    'squats,squat,fentes',
  'muscleDetector.forearms':       'avant-bras,avant bras,grip',
  'muscleDetector.abs':            'abdominaux,planche,crunch,abdos,gainage',
  'muscleDetector.quads':          'leg extension,legs extension,leg press,legs press,quadriceps,quads,quadri',
  'muscleDetector.hamstrings':     'leg curl,ischios,ischio',
  'muscleDetector.glutes':         'hip thrust,fessiers,fessier,glutes,booty,fesses,hip trust',
  'muscleDetector.calves':         'mollets,mollet,calves,calf',
  'muscleDetector.traps':          'trapezes,trapèzes,shrug,trap',
  'muscleDetector.adductors':      'adducteurs,adducteur,inner thigh,adduction',
  'muscleDetector.abductors':      'abducteurs,abducteur,outer thigh,abduction',
};
const translateServiceStub = {
  instant: (key: string) => MUSCLE_DETECTOR_FR[key] ?? key,
  onLangChange: new Subject(),
};

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    sessionId: 'session-1',
    name: 'Pompes',
    muscleGroup: null,
    muscleGroups: [],
    weightKg: 0,
    sets: 3,
    reps: 10,
    breakDurationSeconds: 60,
    status: 'pending',
    isCardio: false,
    durationSeconds: 0,
    distanceKm: null,
    isPyramid: false,
    pyramidSets: [],
    ...overrides,
  } as Exercise;
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    date: new Date('2026-03-26'),
    status: 'active',
    durationSeconds: 0,
    muscleGroup: null,
    exercises: [],
    ...overrides,
  };
}

describe('AddExerciseUseCase', () => {
  let useCase: AddExerciseUseCase;
  let exerciseRepoSpy: jasmine.SpyObj<{ getAll: () => Promise<Exercise[]>; getBySessionId: () => Promise<Exercise[]>; save: (e: Exercise) => Promise<void>; delete: (id: string) => Promise<void> }>;
  let sessionRepoSpy: jasmine.SpyObj<{ getAll: () => Promise<Session[]>; getById: (id: string) => Promise<Session | null>; save: (s: Session) => Promise<void>; delete: (id: string) => Promise<void> }>;
  let exerciseService: ExerciseService;
  let sessionService: SessionService;

  beforeEach(() => {
    exerciseRepoSpy = jasmine.createSpyObj('ExerciseRepository', ['getAll', 'getBySessionId', 'save', 'delete']);
    exerciseRepoSpy.save.and.returnValue(Promise.resolve());
    exerciseRepoSpy.getBySessionId.and.returnValue(Promise.resolve([]));

    sessionRepoSpy = jasmine.createSpyObj('SessionRepository', ['getAll', 'getById', 'save', 'delete']);
    sessionRepoSpy.save.and.returnValue(Promise.resolve());
    sessionRepoSpy.getAll.and.returnValue(Promise.resolve([]));

    TestBed.configureTestingModule({
      providers: [
        AddExerciseUseCase,
        ExerciseService,
        SessionService,
        MuscleGroupDetectorService,
        { provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
        { provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
        { provide: TranslateService, useValue: translateServiceStub },
      ],
    });

    useCase = TestBed.inject(AddExerciseUseCase);
    exerciseService = TestBed.inject(ExerciseService);
    sessionService = TestBed.inject(SessionService);
  });

  describe('muscleGroup on the saved exercise', () => {
    it('should save the exercise with muscleGroup null when the name contains no muscle keyword', async () => {
      sessionService.currentSession.set(makeSession());

      await useCase.execute({
        name: 'Pompes',
        weightKg: 0,
        sets: 3,
        reps: 10,
        breakDurationSeconds: 60,
        sessionId: 'session-1',
      });

      const savedExercise: Exercise = exerciseRepoSpy.save.calls.mostRecent().args[0];
      expect(savedExercise.muscleGroup).toBeNull();
    });

    it('should save the exercise with the detected muscleGroup when the name contains a muscle keyword', async () => {
      sessionService.currentSession.set(makeSession());

      await useCase.execute({
        name: 'Curl biceps haltères',
        weightKg: 15,
        sets: 3,
        reps: 12,
        breakDurationSeconds: 60,
        sessionId: 'session-1',
      });

      const savedExercise: Exercise = exerciseRepoSpy.save.calls.mostRecent().args[0];
      expect(savedExercise.muscleGroup).toBe(MuscleGroup.Biceps);
    });

    it('should save both Triceps and Chest as muscleGroups when the exercise name is "dips"', async () => {
      sessionService.currentSession.set(makeSession());

      await useCase.execute({
        name: 'dips',
        weightKg: 0,
        sets: 3,
        reps: 10,
        breakDurationSeconds: 60,
        sessionId: 'session-1',
      });

      const savedExercise: Exercise = exerciseRepoSpy.save.calls.mostRecent().args[0];
      expect(savedExercise.muscleGroups).toContain(MuscleGroup.Triceps);
      expect(savedExercise.muscleGroups).toContain(MuscleGroup.Chest);
    });
  });

  describe('exercise name capitalization', () => {
    it('should save the exercise name as-is when it already starts with an uppercase letter', async () => {
      sessionService.currentSession.set(makeSession());

      await useCase.execute({
        name: 'Pompes',
        weightKg: 0,
        sets: 3,
        reps: 10,
        breakDurationSeconds: 60,
        sessionId: 'session-1',
      });

      const savedExercise: Exercise = exerciseRepoSpy.save.calls.mostRecent().args[0];
      expect(savedExercise.name).toBe('Pompes');
    });

    it('should capitalize the first letter of the exercise name when it starts with a lowercase letter', async () => {
      sessionService.currentSession.set(makeSession());

      await useCase.execute({
        name: 'pompes',
        weightKg: 0,
        sets: 3,
        reps: 10,
        breakDurationSeconds: 60,
        sessionId: 'session-1',
      });

      const savedExercise: Exercise = exerciseRepoSpy.save.calls.mostRecent().args[0];
      expect(savedExercise.name).toBe('Pompes');
    });

    it('should keep the full original name including muscle keywords', async () => {
      sessionService.currentSession.set(makeSession());

      await useCase.execute({
        name: 'curl biceps',
        weightKg: 15,
        sets: 3,
        reps: 12,
        breakDurationSeconds: 60,
        sessionId: 'session-1',
      });

      const savedExercise: Exercise = exerciseRepoSpy.save.calls.mostRecent().args[0];
      expect(savedExercise.name).toBe('Curl biceps');
    });
  });

  describe('session muscleGroup propagation', () => {
    it('should update the session muscleGroup when the exercise detects a group and the session has none', async () => {
      sessionService.currentSession.set(makeSession({ muscleGroup: null }));

      await useCase.execute({
        name: 'Développé couché pectoraux',
        weightKg: 80,
        sets: 4,
        reps: 8,
        breakDurationSeconds: 120,
        sessionId: 'session-1',
      });

      expect(sessionService.currentSession()?.muscleGroup).toBe(MuscleGroup.Chest);
    });

    it('should NOT update the session muscleGroup when the session already has one', async () => {
      sessionService.currentSession.set(makeSession({ muscleGroup: MuscleGroup.Back }));

      await useCase.execute({
        name: 'Squat quadriceps',
        weightKg: 100,
        sets: 5,
        reps: 5,
        breakDurationSeconds: 180,
        sessionId: 'session-1',
      });

      expect(sessionService.currentSession()?.muscleGroup).toBe(MuscleGroup.Back);
    });
  });

  describe('cardio exercise', () => {
    it('should save cardio exercise with durationSeconds > 0 and weightKg === 0', async () => {
      sessionService.currentSession.set(makeSession());

      await useCase.execute({
        name: 'Course à pied',
        weightKg: 0,
        sets: 0,
        reps: 0,
        breakDurationSeconds: 0,
        sessionId: 'session-1',
        isCardio: true,
        durationSeconds: 1800,
        distanceKm: 5,
      });

      const savedExercise: Exercise = exerciseRepoSpy.save.calls.mostRecent().args[0];
      expect(savedExercise.isCardio).toBeTrue();
      expect(savedExercise.durationSeconds).toBe(1800);
      expect(savedExercise.weightKg).toBe(0);
    });

    it('should NOT update session muscleGroup when adding a cardio exercise', async () => {
      sessionService.currentSession.set(makeSession({ muscleGroup: null }));

      await useCase.execute({
        name: 'Course à pied',
        weightKg: 0,
        sets: 0,
        reps: 0,
        breakDurationSeconds: 0,
        sessionId: 'session-1',
        isCardio: true,
        durationSeconds: 1800,
        distanceKm: null,
      });

      expect(sessionService.currentSession()?.muscleGroup).toBeNull();
      expect(sessionRepoSpy.save).not.toHaveBeenCalled();
    });
  });
});
