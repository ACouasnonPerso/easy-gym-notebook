import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ExerciseExpandedComponent } from './exercise-expanded.component';
import { MassUnitService, MassUnit } from '../../core_logic/mass-unit/mass-unit.service';
import { Exercise } from '../../core_logic/shared/models';

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    sessionId: 'session-1',
    name: 'Bench Press',
    muscleGroup: null,
    muscleGroups: [],
    weightKg: 85,
    sets: 3,
    reps: 10,
    breakDurationSeconds: 60,
    durationSeconds: 0,
    status: 'pending',
    isCardio: false,
    isPyramid: false,
    pyramidSets: [],
    distanceKm: null,
    ...overrides,
  };
}

describe('ExerciseExpandedComponent — weight unit conversion', () => {
  let fixture: ComponentFixture<ExerciseExpandedComponent>;
  let component: ExerciseExpandedComponent;
  let massUnitService: MassUnitService;

  function setUnit(unit: MassUnit): void {
    massUnitService.setMassUnit(unit);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    spyOnProperty(navigator, 'language', 'get').and.returnValue('fr-FR');

    await TestBed.configureTestingModule({
      imports: [ExerciseExpandedComponent],
      providers: [
        MassUnitService,
        provideTranslateService({ defaultLanguage: 'fr' }),
      ],
    }).compileComponents();

    massUnitService = TestBed.inject(MassUnitService);
    massUnitService.setMassUnit('metric');

    fixture = TestBed.createComponent(ExerciseExpandedComponent);
    fixture.componentRef.setInput('exercise', makeExercise());
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  describe('weightValuesForDisplay', () => {
    it('should return raw kg values when system is metric', () => {
      setUnit('metric');

      const values = component.weightValuesForDisplay();

      expect(values[0]).toBe(0);
      expect(values).toContain(85);
      expect(values).toContain(30);
    });

    it('should return a dedicated integer lb list when system is US', () => {
      setUnit('us');

      const values = component.weightValuesForDisplay();

      // Must contain integer lb values
      expect(values).toContain(134);
      expect(values).toContain(135);
      expect(values).toContain(136);
      // Must NOT contain decimal kg-converted values like 187.4
      expect(values).not.toContain(187.4);
      // Must not contain non-integer decimals from kg conversion
      const hasDecimals = (values as number[]).some(v => v !== Math.floor(v as number) && v !== Math.ceil(v as number));
      expect(hasDecimals).toBeFalse();
    });

    it('should return a dedicated integer lb list when system is imperial', () => {
      setUnit('imperial');

      const values = component.weightValuesForDisplay();

      expect(values).toContain(134);
      expect(values).toContain(135);
      expect(values).not.toContain(187.4);
    });
  });

  describe('weightSelectedValue', () => {
    it('should return exercise weightKg as-is when system is metric', () => {
      setUnit('metric');

      expect(component.weightSelectedValue()).toBe(85);
    });

    it('should return the nearest integer lb value when system is US', () => {
      setUnit('us');

      // 85 kg * 2.20462 = 187.39... lb -> nearest integer = 187
      const selected = component.weightSelectedValue();
      expect(selected).toBe(187);
      expect(Number.isInteger(selected as number)).toBeTrue();
    });

    it('should return the nearest integer lb value when system is imperial', () => {
      setUnit('imperial');

      const selected = component.weightSelectedValue();
      expect(selected).toBe(187);
      expect(Number.isInteger(selected as number)).toBeTrue();
    });
  });

  describe('emitWeightUpdate', () => {
    it('should emit weightKg unchanged when system is metric', () => {
      setUnit('metric');
      const emitted: Partial<Exercise>[] = [];
      fixture.componentRef.instance.update.subscribe((v: Partial<Exercise>) => emitted.push(v));

      component.emitWeightUpdate(85);

      expect(emitted[0]).toEqual({ weightKg: 85 });
    });

    it('should convert lb back to kg before emitting when system is US', () => {
      setUnit('us');
      const emitted: Partial<Exercise>[] = [];
      fixture.componentRef.instance.update.subscribe((v: Partial<Exercise>) => emitted.push(v));

      // User picks 187.4 lb — should be stored as 85 kg
      component.emitWeightUpdate(187.4);

      const emittedKg = emitted[0].weightKg!;
      expect(emittedKg).toBeCloseTo(85, 1);
    });

    it('should convert lb back to kg before emitting when system is imperial', () => {
      setUnit('imperial');
      const emitted: Partial<Exercise>[] = [];
      fixture.componentRef.instance.update.subscribe((v: Partial<Exercise>) => emitted.push(v));

      component.emitWeightUpdate(187.4);

      const emittedKg = emitted[0].weightKg!;
      expect(emittedKg).toBeCloseTo(85, 1);
    });
  });
});
