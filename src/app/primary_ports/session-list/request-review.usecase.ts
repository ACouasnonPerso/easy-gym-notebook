import { Injectable, inject, Signal } from '@angular/core';
import { ReviewService } from '../../core_logic/review/review.service';

@Injectable({ providedIn: 'root' })
export class RequestReviewUseCase {
  private readonly reviewService = inject(ReviewService);

  readonly hasRequested: Signal<boolean> = this.reviewService.hasRequested;

  async execute(): Promise<boolean> {
    return this.reviewService.requestReview();
  }
}
