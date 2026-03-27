import { TestBed } from '@angular/core/testing';
import { ImportDataUseCase } from './import-data.usecase';
import { ImportService, ImportValidationResult } from '../../core_logic/import/import.service';
import { SessionService } from '../../core_logic/session/session.service';
import { SESSION_REPOSITORY } from '../../secondary_ports/session/session.repository.interface';
import { EXERCISE_REPOSITORY } from '../../secondary_ports/exercise/exercise.repository.interface';

function makeImportServiceSpy(validationResult: ImportValidationResult = { valid: true, sessionCount: 2, exerciseCount: 3 }) {
  return jasmine.createSpyObj<ImportService>('ImportService', {
    validate: Promise.resolve(validationResult),
    persist: Promise.resolve(),
  });
}

function makeSessionServiceSpy() {
  return jasmine.createSpyObj<SessionService>('SessionService', {
    loadAll: Promise.resolve(),
  });
}

describe('ImportDataUseCase', () => {
  let useCase: ImportDataUseCase;
  let importServiceSpy: jasmine.SpyObj<ImportService>;
  let sessionServiceSpy: jasmine.SpyObj<SessionService>;
  let sessionRepoSpy: jasmine.SpyObj<{ getAll: any; getById: any; save: any; delete: any }>;
  let exerciseRepoSpy: jasmine.SpyObj<{ getAll: any; getBySessionId: any; save: any; delete: any }>;

  beforeEach(() => {
    importServiceSpy = makeImportServiceSpy();
    sessionServiceSpy = makeSessionServiceSpy();
    sessionRepoSpy = jasmine.createSpyObj('SessionRepository', ['getAll', 'getById', 'save', 'delete']);
    exerciseRepoSpy = jasmine.createSpyObj('ExerciseRepository', ['getAll', 'getBySessionId', 'save', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ImportDataUseCase,
        { provide: ImportService, useValue: importServiceSpy },
        { provide: SessionService, useValue: sessionServiceSpy },
        { provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
        { provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
      ],
    });

    useCase = TestBed.inject(ImportDataUseCase);
  });

  describe('validate()', () => {
    it('should set importError signal and not set importCount when validation fails', async () => {
      importServiceSpy.validate.and.returnValue(Promise.resolve({ valid: false, error: 'invalid_json' }));

      await useCase.validate('bad-json');

      expect(useCase.importError()).toBe('invalid_json');
      expect(useCase.importCount()).toBe(0);
    });

    it('should set importCount signal and clear importError on successful validation', async () => {
      importServiceSpy.validate.and.returnValue(
        Promise.resolve({ valid: true, sessionCount: 2, exerciseCount: 5 })
      );

      await useCase.validate('{"sessions":[],"exercises":[]}');

      expect(useCase.importCount()).toBe(7); // 2 sessions + 5 exercises
      expect(useCase.importError()).toBeNull();
    });
  });

  describe('persist()', () => {
    it('should call ImportService.persist() and SessionService.loadAll() when confirmed', async () => {
      await useCase.persist();

      expect(importServiceSpy.persist).toHaveBeenCalledTimes(1);
      expect(sessionServiceSpy.loadAll).toHaveBeenCalledTimes(1);
    });
  });
});
