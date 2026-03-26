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
});
