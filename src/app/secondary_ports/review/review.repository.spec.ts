import { TestBed } from '@angular/core/testing';
import { ReviewRepository } from './review.repository';

describe('ReviewRepository', () => {
  let repository: ReviewRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ReviewRepository] });
    repository = TestBed.inject(ReviewRepository);
    localStorage.removeItem('egn_review_requested');
  });

  afterEach(() => {
    localStorage.removeItem('egn_review_requested');
  });

  describe('hasRequested()', () => {
    it('retourne false quand la clé est absente du localStorage', async () => {
      const result = await repository.hasRequested();
      expect(result).toBe(false);
    });
  });

  describe('markAsRequested()', () => {
    it('persiste le flag de sorte que hasRequested() retourne true ensuite', async () => {
      await repository.markAsRequested();
      const result = await repository.hasRequested();
      expect(result).toBe(true);
    });
  });
});
