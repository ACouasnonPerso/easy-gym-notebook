import { TestBed } from '@angular/core/testing';
import { ExerciseChronoService } from './exercise-chrono.service';

describe('ExerciseChronoService', () => {
  let service: ExerciseChronoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExerciseChronoService);
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('initial state', () => {
    it('should start in initial state', () => {
      expect(service.chronoState()).toBe('initial');
    });
  });

  describe('start()', () => {
    it('should transition from initial to training', () => {
      service.init(60);
      service.start();
      expect(service.chronoState()).toBe('training');
    });
  });

  describe('pause()', () => {
    it('should transition from training to training_paused', () => {
      service.init(60);
      service.start();
      service.pause();
      expect(service.chronoState()).toBe('training_paused');
    });

    it('should transition from break to break_paused', () => {
      service.init(60);
      service.start();
      service.goBreak();
      service.pause();
      expect(service.chronoState()).toBe('break_paused');
    });
  });

  describe('resume()', () => {
    it('should transition from training_paused to training', () => {
      service.init(60);
      service.start();
      service.pause();
      service.resume();
      expect(service.chronoState()).toBe('training');
    });

    it('should transition from break_paused to break', () => {
      service.init(60);
      service.start();
      service.goBreak();
      service.pause();
      service.resume();
      expect(service.chronoState()).toBe('break');
    });
  });

  describe('reset()', () => {
    it('should stay in training and reset time to 0 when called from training_paused', () => {
      service.init(60);
      service.start();
      jasmine.clock().tick(5000);
      service.pause();
      service.reset();
      expect(service.chronoState()).toBe('training');
      expect(service.timeSeconds()).toBe(0);
    });

    it('should stay in break and reset time to breakDuration when called from break_paused', () => {
      service.init(60);
      service.start();
      service.goBreak();
      jasmine.clock().tick(10000);
      service.pause();
      service.reset();
      expect(service.chronoState()).toBe('break');
      expect(service.timeSeconds()).toBe(60);
    });
  });

  describe('goBreak()', () => {
    it('should transition from training_paused to break', () => {
      service.init(60);
      service.start();
      service.pause();
      service.goBreak();
      expect(service.chronoState()).toBe('break');
    });
  });

  describe('goTraining()', () => {
    it('should transition from break to training', () => {
      service.init(60);
      service.start();
      service.goBreak();
      service.goTraining();
      expect(service.chronoState()).toBe('training');
    });

    it('should transition from break_paused to training', () => {
      service.init(60);
      service.start();
      service.goBreak();
      service.pause();
      service.goTraining();
      expect(service.chronoState()).toBe('training');
    });
  });

  describe('seriesCount', () => {
    it('should start at 0 after init()', () => {
      service.init(60);

      expect(service.seriesCount()).toBe(0);
    });

    it('should be 1 after start()', () => {
      service.init(60);

      service.start();

      expect(service.seriesCount()).toBe(1);
    });

    it('should increment when goTraining() is called from break', () => {
      service.init(60);
      service.start();
      service.goBreak();

      service.goTraining();

      expect(service.seriesCount()).toBe(2);
    });

    it('should reset to 0 when init() is called again (exercise change)', () => {
      service.init(60);
      service.start();
      service.goBreak();
      service.goTraining();

      service.init(90);

      expect(service.seriesCount()).toBe(0);
    });

    it('should increment when the break timer completes automatically', () => {
      service.init(5);
      service.start();
      service.goBreak();

      jasmine.clock().tick(6000);

      expect(service.seriesCount()).toBe(2);
    });
  });

  describe('updateBreakDuration()', () => {
    it('ne modifie pas l\'état du chrono quand appelé pendant training', () => {
      service.init(60);
      service.start();

      service.updateBreakDuration(90);

      expect(service.chronoState()).toBe('training');
    });

    it('goBreak() utilise la nouvelle durée après updateBreakDuration', () => {
      service.init(60);
      service.start();

      service.updateBreakDuration(90);
      service.goBreak();

      expect(service.timeSeconds()).toBe(90);
    });

    it('met à jour timeSeconds à la nouvelle durée quand on est en break', () => {
      service.init(60);
      service.start();
      service.goBreak();

      service.updateBreakDuration(90);

      expect(service.timeSeconds()).toBe(90);
      expect(service.chronoState()).toBe('break');
    });
  });
});
