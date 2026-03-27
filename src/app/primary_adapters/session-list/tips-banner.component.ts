import { Component, ChangeDetectionStrategy, input, inject, signal, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { RequestReviewUseCase } from '../../primary_ports/session-list/request-review.usecase';

@Component({
  selector: 'app-tips-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  templateUrl: './tips-banner.component.html',
  styleUrl: './tips-banner.component.scss',
})
export class TipsBannerComponent {
  readonly sessionCount = input.required<number>();

  private readonly requestReviewUseCase = inject(RequestReviewUseCase);

  private readonly justReviewed = signal(false);
  private readonly pending = signal(false);

  readonly showOnboarding = computed(() => {
    const count = this.sessionCount();
    return count > 0 && count < 4;
  });

  readonly showReview = computed(() => {
    const count = this.sessionCount();
    return count >= 4  && !this.justReviewed();
  });

  readonly showThanks = computed(() => {
    return this.justReviewed();
  });

  async onReviewClick(): Promise<void> {
    if (this.pending()) return;
    this.pending.set(true);
    const success = await this.requestReviewUseCase.execute();
    this.pending.set(false);
    if (success) this.justReviewed.set(true);
  }
}
