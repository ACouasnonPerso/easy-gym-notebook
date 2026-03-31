import { TestBed } from '@angular/core/testing';
import { DistanceDisplayPipe } from './distance-display.pipe';
import { MassUnitService, MassUnit } from './mass-unit.service';

function setActiveUnit(service: MassUnitService, unit: MassUnit): void {
  service.setMassUnit(unit);
}

describe('DistanceDisplayPipe', () => {
  let pipe: DistanceDisplayPipe;
  let massUnitService: MassUnitService;

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { get: () => 'fr-FR', configurable: true });
    TestBed.configureTestingModule({
      providers: [DistanceDisplayPipe, MassUnitService],
    });
    pipe = TestBed.inject(DistanceDisplayPipe);
    massUnitService = TestBed.inject(MassUnitService);
  });

  describe('système Métrique', () => {
    beforeEach(() => {
      setActiveUnit(massUnitService, 'metric');
    });

    it('devrait retourner "100 m" quand la valeur est 100 m en système métrique', () => {
      const result = pipe.transform(100, 'm');

      expect(result).toBe('100 m');
    });

    it('devrait retourner "5 km" quand la valeur est 5 km en système métrique', () => {
      const result = pipe.transform(5, 'km');

      expect(result).toBe('5 km');
    });
  });

  describe('système US', () => {
    beforeEach(() => {
      setActiveUnit(massUnitService, 'us');
    });

    it('devrait retourner "328.1 ft" quand la valeur est 100 m en système US', () => {
      const result = pipe.transform(100, 'm');

      expect(result).toBe('328.1 ft');
    });

    it('devrait retourner "3.1 mi" quand la valeur est 5 km en système US', () => {
      const result = pipe.transform(5, 'km');

      expect(result).toBe('3.1 mi');
    });

    it('devrait retourner "3.3 ft" quand la valeur est 1 m en système US', () => {
      const result = pipe.transform(1, 'm');

      expect(result).toBe('3.3 ft');
    });

    it('devrait retourner "0.6 mi" quand la valeur est 1 km en système US', () => {
      const result = pipe.transform(1, 'km');

      expect(result).toBe('0.6 mi');
    });
  });

  describe('système Britanique (imperial)', () => {
    beforeEach(() => {
      setActiveUnit(massUnitService, 'imperial');
    });

    it('devrait retourner "328.1 ft" quand la valeur est 100 m en système impérial', () => {
      const result = pipe.transform(100, 'm');

      expect(result).toBe('328.1 ft');
    });

    it('devrait retourner "3.1 mi" quand la valeur est 5 km en système impérial', () => {
      const result = pipe.transform(5, 'km');

      expect(result).toBe('3.1 mi');
    });
  });
});
