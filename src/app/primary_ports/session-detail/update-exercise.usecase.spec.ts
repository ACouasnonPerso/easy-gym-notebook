import { TestBed } from '@angular/core/testing';
import { UpdateExerciseUseCase } from './update-exercise.usecase';
import { ExerciseService } from '../../core_logic/session-detail/exercise.service';
import { MuscleGroupDetectorService } from '../../core_logic/shared/muscle-group-detector.service';
import { Exercise, MuscleGroup } from '../../core_logic/shared/models';
import { EXERCISE_REPOSITORY } from '../../secondary_ports/exercise/exercise.repository.interface';
import { SESSION_REPOSITORY } from '../../secondary_ports/session/session.repository.interface';

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
    ...overrides,
  };
}

describe('UpdateExerciseUseCase', () => {
  let useCase: UpdateExerciseUseCase;
  let exerciseService: ExerciseService;
  let exerciseRepoSpy: jasmine.SpyObj<{
    getAll: () => Promise<Exercise[]>;
    getBySessionId: (id: string) => Promise<Exercise[]>;
    save: (e: Exercise) => Promise<void>;
    delete: (id: string) => Promise<void>;
  }>;

  beforeEach(() => {
    exerciseRepoSpy = jasmine.createSpyObj('ExerciseRepository', [
      'getAll',
      'getBySessionId',
      'save',
      'delete',
    ]);
    exerciseRepoSpy.save.and.returnValue(Promise.resolve());
    exerciseRepoSpy.getBySessionId.and.returnValue(Promise.resolve([]));
    exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([]));

    const sessionRepoSpy = jasmine.createSpyObj('SessionRepository', [
      'getAll',
      'getById',
      'save',
      'delete',
    ]);
    sessionRepoSpy.save.and.returnValue(Promise.resolve());
    sessionRepoSpy.getAll.and.returnValue(Promise.resolve([]));

    TestBed.configureTestingModule({
      providers: [
        UpdateExerciseUseCase,
        ExerciseService,
        MuscleGroupDetectorService,
        { provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
        { provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
      ],
    });

    useCase = TestBed.inject(UpdateExerciseUseCase);
    exerciseService = TestBed.inject(ExerciseService);
  });

  async function seedExercise(exercise: Exercise): Promise<void> {
    exerciseRepoSpy.getBySessionId.and.returnValue(Promise.resolve([exercise]));
    await exerciseService.loadBySession(exercise.sessionId);
  }

  describe('tag detection on name update', () => {
    it('should not change muscleGroup when updating a non-name field', async () => {
      const exercise = makeExercise({ muscleGroup: MuscleGroup.Biceps, muscleGroups: [MuscleGroup.Biceps] });
      await seedExercise(exercise);

      await useCase.execute('ex-1', { weightKg: 80 });

      const saved: Exercise = exerciseRepoSpy.save.calls.mostRecent().args[0];
      expect(saved.muscleGroup).toBe(MuscleGroup.Biceps);
    });

    it('should set muscleGroup from the new name when the name is updated with a muscle keyword', async () => {
      const exercise = makeExercise({ muscleGroup: null, muscleGroups: [] });
      await seedExercise(exercise);

      await useCase.execute('ex-1', { name: 'Curl biceps' });

      const saved: Exercise = exerciseRepoSpy.save.calls.mostRecent().args[0];
      expect(saved.muscleGroup).toBe(MuscleGroup.Biceps);
    });

    it('should set muscleGroup to null when the name is updated to a value without any muscle keyword', async () => {
      const exercise = makeExercise({ muscleGroup: MuscleGroup.Biceps, muscleGroups: [MuscleGroup.Biceps] });
      await seedExercise(exercise);

      await useCase.execute('ex-1', { name: 'Pompes' });

      const saved: Exercise = exerciseRepoSpy.save.calls.mostRecent().args[0];
      expect(saved.muscleGroup).toBeNull();
    });

    it('should set muscleGroups array from detection when the name is updated with a compound keyword', async () => {
      const exercise = makeExercise({ muscleGroup: null, muscleGroups: [] });
      await seedExercise(exercise);

      await useCase.execute('ex-1', { name: 'Dips' });

      const saved: Exercise = exerciseRepoSpy.save.calls.mostRecent().args[0];
      expect(saved.muscleGroups).toContain(MuscleGroup.Triceps);
      expect(saved.muscleGroups).toContain(MuscleGroup.Chest);
    });
  });
});
