import { InjectionToken } from '@angular/core';

export interface IReviewRepository {
  hasRequested(): Promise<boolean>;
  markAsRequested(): Promise<void>;
}

export const REVIEW_REPOSITORY = new InjectionToken<IReviewRepository>('REVIEW_REPOSITORY');
