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
  'englishMuscleDetector.chest':          'bench press,chest press,chest fly,pec deck,chest,pecs,bench,dc',
  'englishMuscleDetector.back':           'lat pulldown,pull-up,chin-up,pull up,chin up,row,rows,rowing,back,pull',
  'englishMuscleDetector.backHamstrings': 'deadlift,dead lift',
  'englishMuscleDetector.shoulders':      'shoulder press,overhead press,lateral raise,front raise,shoulder,deltoid,ohp',
  'englishMuscleDetector.biceps':         'bicep curl,hammer curl,bicep,biceps',
  'englishMuscleDetector.triceps':        'tricep extension,skull crusher,pushdown,tricep,triceps',
  'englishMuscleDetector.tricepsChest':   'dips',
  'englishMuscleDetector.glutesQuads':    'squat,squats,lunge,lunges',
  'englishMuscleDetector.forearms':       'wrist curl,forearm,forearms,grip',
  'englishMuscleDetector.abs':            'crunch,plank,sit-up,sit up,abs,core,abdominal',
  'englishMuscleDetector.quads':          'leg extension,legs extension,leg press,legs press,quadricep,quadriceps,quads',
  'englishMuscleDetector.hamstrings':     'leg curl,hamstring,hamstrings',
  'englishMuscleDetector.glutes':         'hip thrust,glute bridge,glute,glutes,booty',
  'englishMuscleDetector.calves':         'calf raise,calf,calves',
  'englishMuscleDetector.traps':          'shrug,trap,traps,trapezius',
  'englishMuscleDetector.adductors':      'adductor,adductors,inner thigh,adduction',
  'englishMuscleDetector.abductors':      'abductor,abductors,outer thigh,abduction',
};

/**
 * Stripped French-only stub — French keywords only, no English overlap,
 * to isolate the English fallback detection path.
 */
const MUSCLE_DETECTOR_FR_ONLY: Record<string, string> = {
  'muscleDetector.chest':          'développé couché,développé,developpe,pectoraux,poitrine,pecs,dc',
  'muscleDetector.back':           'dorsaux,tirage,tractions,dos',
  'muscleDetector.backHamstrings': 'soulevé de terre',
  'muscleDetector.shoulders':      'deltoides,deltoide,militaire,epaules,epaule',
  'muscleDetector.biceps':         'bibi',
  'muscleDetector.triceps':        'tritri',
  'muscleDetector.tricepsChest':   'dips',
  'muscleDetector.glutesQuads':    'fentes',
  'muscleDetector.forearms':       'avant-bras,avant bras',
  'muscleDetector.abs':            'abdominaux,abdos,gainage',
  'muscleDetector.quads':          'quadriceps,quadri',
  'muscleDetector.hamstrings':     'ischios,ischio',
  'muscleDetector.glutes':         'fessiers,fessier,fesses',
  'muscleDetector.calves':         'mollets,mollet',
  'muscleDetector.traps':          'trapezes,trapèzes',
  'muscleDetector.adductors':      'adducteurs,adducteur',
  'muscleDetector.abductors':      'abducteurs,abducteur',
  'englishMuscleDetector.chest':          'bench press,chest press,chest fly,pec deck,chest,pecs,bench,dc',
  'englishMuscleDetector.back':           'lat pulldown,pull-up,chin-up,pull up,chin up,row,rows,rowing,back,pull',
  'englishMuscleDetector.backHamstrings': 'deadlift,dead lift',
  'englishMuscleDetector.shoulders':      'shoulder press,overhead press,lateral raise,front raise,shoulder,deltoid,ohp',
  'englishMuscleDetector.biceps':         'bicep curl,hammer curl,bicep,biceps',
  'englishMuscleDetector.triceps':        'tricep extension,skull crusher,pushdown,tricep,triceps',
  'englishMuscleDetector.tricepsChest':   'dips',
  'englishMuscleDetector.glutesQuads':    'squat,squats,lunge,lunges',
  'englishMuscleDetector.forearms':       'wrist curl,forearm,forearms,grip',
  'englishMuscleDetector.abs':            'crunch,plank,sit-up,sit up,abs,core,abdominal',
  'englishMuscleDetector.quads':          'leg extension,legs extension,leg press,legs press,quadricep,quadriceps,quads',
  'englishMuscleDetector.hamstrings':     'leg curl,hamstring,hamstrings',
  'englishMuscleDetector.glutes':         'hip thrust,glute bridge,glute,glutes,booty',
  'englishMuscleDetector.calves':         'calf raise,calf,calves',
  'englishMuscleDetector.traps':          'shrug,trap,traps,trapezius',
  'englishMuscleDetector.adductors':      'adductor,adductors,inner thigh,adduction',
  'englishMuscleDetector.abductors':      'abductor,abductors,outer thigh,abduction',
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

describe('MuscleGroupDetectorService — English fallback', () => {
  let service: MuscleGroupDetectorService;

  beforeEach(() => {
    const langChange = new Subject<void>();
    const frOnlyStub = {
      instant: (key: string) => MUSCLE_DETECTOR_FR_ONLY[key] ?? key,
      onLangChange: langChange,
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: frOnlyStub }],
    });
    service = TestBed.inject(MuscleGroupDetectorService);
  });

  it('should detect Chest from "bench press" when app is in French (English fallback)', () => {
    const result = service.detect('bench press');

    expect(result.muscleGroups).toContain(MuscleGroup.Chest);
  });

  it('should detect Chest from "développé couché" when app is in French (current-lang keywords still work)', () => {
    const result = service.detect('développé couché');

    expect(result.muscleGroups).toContain(MuscleGroup.Chest);
  });

  it('should not duplicate muscle groups when an English term also exists in current-lang keywords', () => {
    // "dips" appears in both muscleDetector.tricepsChest and englishMuscleDetector.tricepsChest
    const result = service.detect('dips');

    expect(result.muscleGroups.filter(g => g === MuscleGroup.Triceps).length).toBe(1);
    expect(result.muscleGroups.filter(g => g === MuscleGroup.Chest).length).toBe(1);
  });
});
