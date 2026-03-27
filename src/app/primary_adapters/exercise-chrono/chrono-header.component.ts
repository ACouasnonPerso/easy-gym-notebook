import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-chrono-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <div class="header-pad">
      <button class="back-btn" (click)="back.emit()" aria-label="Go back">
        <span class="back-arrow">←</span> {{ 'common.back' | translate }}
      </button>
      <div class="header-right">
        @if (!hasExercise()) {
          <span class="break-duration-label" (click)="openBreakDurationPopup.emit()">
            {{ formattedBreakDuration() }} {{ 'common.rest' | translate }}
          </span>
        }
        <button class="sound-btn" (click)="toggleSound.emit()" [class.muted]="!soundEnabled()" aria-label="Toggle sound">
          @if (soundEnabled()) {
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          }
        </button>
        @if (hasExercise() && seriesCount() > 0) {
          <div class="series-counter">
            <div class="series-counter-label">{{ 'chrono.series' | translate }}</div>
            <div class="series-counter-number">{{ seriesCount() }}</div>
            <div class="series-counter-btns">
              <button class="series-counter-btn" (click)="decrementSeries.emit()" aria-label="Retirer une série">−</button>
              <button class="series-counter-btn" (click)="incrementSeries.emit()" aria-label="Ajouter une série">+</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ChronoHeaderComponent {
  readonly hasExercise = input.required<boolean>();
  readonly soundEnabled = input.required<boolean>();
  readonly seriesCount = input.required<number>();
  readonly formattedBreakDuration = input.required<string>();

  readonly back = output<void>();
  readonly toggleSound = output<void>();
  readonly openBreakDurationPopup = output<void>();
  readonly incrementSeries = output<void>();
  readonly decrementSeries = output<void>();
}
