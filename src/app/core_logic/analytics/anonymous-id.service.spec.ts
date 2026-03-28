import { TestBed } from '@angular/core/testing';
import { AnonymousIdService } from './anonymous-id.service';

describe('AnonymousIdService', () => {
  let service: AnonymousIdService;

  beforeEach(() => {
    localStorage.removeItem('egn_anon_uid');
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnonymousIdService);
  });

  afterEach(() => {
    localStorage.removeItem('egn_anon_uid');
  });

  describe('getId()', () => {
    it('should generate a UUID and store it when egn_anon_uid is absent', () => {
      spyOn(localStorage, 'setItem').and.callThrough();

      const id = service.getId();

      expect(id).toBeTruthy();
      expect(localStorage.setItem).toHaveBeenCalledWith('egn_anon_uid', id);
    });

    it('should return the existing value without modifying it when egn_anon_uid is present', () => {
      const existing = 'existing-uid-12345678901234567890123456789012';
      localStorage.setItem('egn_anon_uid', existing);
      spyOn(localStorage, 'setItem').and.callThrough();

      const id = service.getId();

      expect(id).toBe(existing);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should return the same UID on two successive calls', () => {
      const id1 = service.getId();
      const id2 = service.getId();

      expect(id1).toBe(id2);
    });

    it('should generate a non-empty string of 36 characters (UUID v4 format)', () => {
      const id = service.getId();

      expect(id.length).toBe(36);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('getCountry()', () => {
    it('should return "FR" for "fr-FR"', () => {
      Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true });

      expect(service.getCountry()).toBe('FR');
    });

    it('should return "US" for "en-US"', () => {
      Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });

      expect(service.getCountry()).toBe('US');
    });

    it('should return "unknown" for "fr" (no region part)', () => {
      Object.defineProperty(navigator, 'language', { value: 'fr', configurable: true });

      expect(service.getCountry()).toBe('unknown');
    });

    it('should return "unknown" when language has no region part', () => {
      Object.defineProperty(navigator, 'language', { value: 'en', configurable: true });

      expect(service.getCountry()).toBe('unknown');
    });
  });
});
