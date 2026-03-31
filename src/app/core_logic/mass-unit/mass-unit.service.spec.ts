import { TestBed } from '@angular/core/testing';
import { MassUnitService, MassUnit } from './mass-unit.service';

describe('MassUnitService', () => {
  let service: MassUnitService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [MassUnitService],
    });

    service = TestBed.inject(MassUnitService);
  });

  describe('état initial', () => {
    it('devrait exposer metric comme unité de masse active par défaut quand la locale est fr-FR', () => {
      Object.defineProperty(navigator, 'language', { get: () => 'fr-FR', configurable: true });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [MassUnitService] });
      const svc = TestBed.inject(MassUnitService);

      expect(svc.activeMassUnit()).toBe('metric');
    });

    it('devrait auto-détecter us quand la locale est en-US et localStorage est vide', () => {
      Object.defineProperty(navigator, 'language', { get: () => 'en-US', configurable: true });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [MassUnitService] });
      const svc = TestBed.inject(MassUnitService);

      expect(svc.activeMassUnit()).toBe('us');
    });

    it('devrait restaurer imperial depuis localStorage si la clé massUnit existe', () => {
      localStorage.setItem('massUnit', 'imperial');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [MassUnitService] });
      const svc = TestBed.inject(MassUnitService);

      expect(svc.activeMassUnit()).toBe('imperial');
    });
  });

  describe('detect()', () => {
    it('devrait retourner metric pour une locale non-US non-GB quand localStorage est vide', () => {
      Object.defineProperty(navigator, 'language', { get: () => 'fr-FR', configurable: true });

      expect(service.detect()).toBe('metric');
    });

    it('devrait retourner us pour la locale en-US quand localStorage est vide', () => {
      Object.defineProperty(navigator, 'language', { get: () => 'en-US', configurable: true });

      expect(service.detect()).toBe('us');
    });

    it('devrait retourner imperial pour la locale en-GB quand localStorage est vide', () => {
      Object.defineProperty(navigator, 'language', { get: () => 'en-GB', configurable: true });

      expect(service.detect()).toBe('imperial');
    });

    it('devrait retourner la valeur stockée dans localStorage si la clé massUnit existe', () => {
      localStorage.setItem('massUnit', 'imperial');
      Object.defineProperty(navigator, 'language', { get: () => 'en-US', configurable: true });

      expect(service.detect()).toBe('imperial');
    });
  });

  describe('setMassUnit()', () => {
    it('devrait mettre à jour le signal activeMassUnit', () => {
      service.setMassUnit('imperial');

      expect(service.activeMassUnit()).toBe('imperial');
    });

    it('devrait persister la valeur dans localStorage sous la clé massUnit', () => {
      service.setMassUnit('us');

      expect(localStorage.getItem('massUnit')).toBe('us');
    });

    it('ne devrait pas écrire dans localStorage si l\'unité est déjà active', () => {
      service.setMassUnit('imperial');
      localStorage.clear();

      service.setMassUnit('imperial');

      expect(localStorage.getItem('massUnit')).toBeNull();
    });
  });
});
