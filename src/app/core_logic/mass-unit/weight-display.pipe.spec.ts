import { TestBed } from '@angular/core/testing';
import { WeightDisplayPipe } from './weight-display.pipe';
import { MassUnitService, MassUnit } from './mass-unit.service';

function setActiveUnit(service: MassUnitService, unit: MassUnit): void {
  service.setMassUnit(unit);
}

describe('WeightDisplayPipe', () => {
  let pipe: WeightDisplayPipe;
  let massUnitService: MassUnitService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [WeightDisplayPipe, MassUnitService],
    });
    pipe = TestBed.inject(WeightDisplayPipe);
    massUnitService = TestBed.inject(MassUnitService);
    spyOnProperty(navigator, 'language', 'get').and.returnValue('fr-FR');
  });

  describe('système Métrique', () => {
    beforeEach(() => {
      setActiveUnit(massUnitService, 'metric');
    });

    it('devrait retourner "5 kg" quand la valeur est 5 kg en système métrique', () => {
      const result = pipe.transform(5, 'kg');

      expect(result).toBe('5 kg');
    });

    it('devrait retourner "5 t" quand la valeur est 5 t en système métrique', () => {
      const result = pipe.transform(5, 't');

      expect(result).toBe('5 t');
    });
  });

  describe('système US', () => {
    beforeEach(() => {
      setActiveUnit(massUnitService, 'us');
    });

    it('devrait retourner "11 lb" quand la valeur est 5 kg en système US', () => {
      const result = pipe.transform(5, 'kg');

      expect(result).toBe('11 lb');
    });

    it('devrait retourner "5.5 st" quand la valeur est 5 t en système US', () => {
      const result = pipe.transform(5, 't');

      expect(result).toBe('5.5 st');
    });

    it('devrait retourner "220 lb" quand la valeur est 100 kg en système US', () => {
      const result = pipe.transform(100, 'kg');

      expect(result).toBe('220 lb');
    });

    it('devrait retourner "1 lb" quand la valeur est 0.5 kg en système US', () => {
      const result = pipe.transform(0.5, 'kg');

      expect(result).toBe('1 lb');
    });

    it('devrait retourner "191 lb" quand la valeur est 86.6 kg en système US', () => {
      const result = pipe.transform(86.6, 'kg');

      expect(result).toBe('191 lb');
    });
  });

  describe('système Britanique (imperial)', () => {
    beforeEach(() => {
      setActiveUnit(massUnitService, 'imperial');
    });

    it('devrait retourner "11 lb" quand la valeur est 5 kg en système impérial', () => {
      const result = pipe.transform(5, 'kg');

      expect(result).toBe('11 lb');
    });

    it('devrait retourner "4.9 lt" quand la valeur est 5 t en système impérial', () => {
      const result = pipe.transform(5, 't');

      expect(result).toBe('4.9 lt');
    });
  });
});
