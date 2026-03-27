import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-chrono-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  styles: [`
    .header-pad {
      padding: 24px 20px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--sub);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      width: fit-content;
      transition: color 0.15s;
      background: none;
      border: none;
      padding: 0;
      font-family: inherit;
    }
    .back-btn:hover { color: var(--text); }
    .back-arrow { font-size: 18px; line-height: 1; }
    .series-badge {
      font-family: 'Syne', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: #4caf50;
      background: rgba(76,175,80,0.15);
      border: 1px solid rgba(76,175,80,0.3);
      border-radius: 8px;
      padding: 4px 10px;
      letter-spacing: 0.5px;
    }
    .break-duration-label {
      font-family: 'Syne', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 4px 10px;
      cursor: pointer;
      letter-spacing: 0.5px;
      transition: background 0.15s;
    }
    .break-duration-label:hover { background: rgba(255, 255, 255, 0.2); }
  `],
  template: `
    <div class="header-pad">
      <button class="back-btn" (click)="back.emit()" aria-label="Go back">
        <span class="back-arrow">←</span> {{ 'common.back' | translate }}
      </button>
      @if (!hasExercise()) {
        <span class="break-duration-label" (click)="openBreakDurationPopup.emit()">
          {{ formattedBreakDuration() }} {{ 'common.rest' | translate }}
        </span>
      }
      @if (hasExercise() && seriesCount() > 0) {
        <span class="series-badge">
          {{ 'chrono.series' | translate }} {{ seriesCount() }}
        </span>
      }
    </div>
  `,
})
export class ChronoHeaderComponent {
  readonly hasExercise = input.required<boolean>();
  readonly seriesCount = input.required<number>();
  readonly formattedBreakDuration = input.required<string>();

  readonly back = output<void>();
  readonly openBreakDurationPopup = output<void>();
}
