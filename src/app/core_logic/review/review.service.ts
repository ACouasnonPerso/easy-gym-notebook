import { Injectable, inject, signal, Signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { REVIEW_REPOSITORY } from '../../secondary_ports/review/review.repository.interface';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly reviewRepo = inject(REVIEW_REPOSITORY);
  private readonly _hasRequested = signal<boolean>(false);

  readonly hasRequested: Signal<boolean> = this._hasRequested;

  async initialize(): Promise<void> {
    const requested = await this.reviewRepo.hasRequested();
    this._hasRequested.set(requested);
  }

  async requestReview(): Promise<boolean> {
    if (!Capacitor.isPluginAvailable('InAppReview')) {
      return false;
    }
    try {
      const { InAppReview } = await import('@capacitor-community/in-app-review');
      await InAppReview.requestReview();
      await this.reviewRepo.markAsRequested();
      this._hasRequested.set(true);
      return true;
    } catch {
      return false;
    }
  }
}
