import { TestBed } from '@angular/core/testing';
import { MuscleGroupDetectorService } from './muscle-group-detector.service';
import { MuscleGroup } from './models';
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

describe('MuscleGroupDetectorService', () => {
  let service: MuscleGroupDetectorService;

  beforeEach(() => {
    const langChange = new Subject<void>();
    const translateStub = {
      instant: (key: string) => MUSCLE_DETECTOR_FR[key] ?? key,
      onLangChange: langChange,
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: translateStub }],
    });
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
