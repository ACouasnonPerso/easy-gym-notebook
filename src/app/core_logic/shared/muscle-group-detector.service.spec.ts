import { TestBed } from '@angular/core/testing';
import { MuscleGroupDetectorService } from './muscle-group-detector.service';
import { MuscleGroup } from './models';

describe('MuscleGroupDetectorService', () => {
  let service: MuscleGroupDetectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MuscleGroupDetectorService);
  });

  describe('detect', () => {
    it('should detect both Triceps and Chest from "dips"', () => {
      const result = service.detect('dips');

      expect(result.muscleGroups).toContain(MuscleGroup.Triceps);
      expect(result.muscleGroups).toContain(MuscleGroup.Chest);
    });

    it('should detect both Biceps and Triceps from "Bibi et tritri"', () => {
      const result = service.detect('Bibi et tritri');

      expect(result.muscleGroups).toContain(MuscleGroup.Biceps);
      expect(result.muscleGroups).toContain(MuscleGroup.Triceps);
    });

    it('should detect both Biceps and Triceps from "bi et tri"', () => {
      const result = service.detect('bi et tri');

      expect(result.muscleGroups).toContain(MuscleGroup.Biceps);
      expect(result.muscleGroups).toContain(MuscleGroup.Triceps);
    });
  });

  describe('cardio detection', () => {
    it('should detect "course" as cardio with empty muscleGroups', () => {
      const result = service.detect('course');

      expect(result.isCardio).toBeTrue();
      expect(result.muscleGroups).toEqual([]);
    });

    it('should detect "VÉLO" (uppercase with accent) as cardio', () => {
      const result = service.detect('VÉLO');

      expect(result.isCardio).toBeTrue();
      expect(result.muscleGroups).toEqual([]);
    });

    it('should detect "swimming" as cardio', () => {
      const result = service.detect('swimming');

      expect(result.isCardio).toBeTrue();
      expect(result.muscleGroups).toEqual([]);
    });

    it('should return isCardio false and detect Chest for "bench press"', () => {
      const result = service.detect('bench press');

      expect(result.isCardio).toBeFalse();
      expect(result.muscleGroups).toContain(MuscleGroup.Chest);
    });

    it('should never return isCardio true with non-empty muscleGroups', () => {
      const cardioNames = ['course', 'vélo', 'run', 'swimming', 'marche'];
      for (const name of cardioNames) {
        const result = service.detect(name);
        if (result.isCardio) {
          expect(result.muscleGroups).toEqual([]);
        }
      }
    });
  });
});
