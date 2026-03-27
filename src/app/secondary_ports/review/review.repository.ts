import { Injectable } from '@angular/core';
import { IReviewRepository } from './review.repository.interface';

const STORAGE_KEY = 'egn_review_requested';

@Injectable()
export class ReviewRepository implements IReviewRepository {
  async hasRequested(): Promise<boolean> {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  async markAsRequested(): Promise<void> {
    localStorage.setItem(STORAGE_KEY, 'true');
  }
}
