import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-chrono-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, NgClass],
  styles: [`
    .header-pad {
      padding: 32px 20px 0;
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
      font-family: 'Space Grotesk', sans-serif;
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
      font-family: 'Space Grotesk', sans-serif;
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
    .right-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sound-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 18px;
      transition: background 0.15s, opacity 0.15s;
      background: rgba(76, 175, 80, 0.15);
      color: #4caf50;
    }
    .sound-btn:hover { background: rgba(76, 175, 80, 0.28); }
    .sound-btn.muted {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.35);
    }
    .sound-btn.muted:hover { background: rgba(255, 255, 255, 0.14); }
  `],
  template: `
    <div class="header-pad">
      <button class="back-btn" (click)="back.emit()" aria-label="Go back">
        <span class="back-arrow">←</span> {{ 'common.back' | translate }}
      </button>
      <div class="right-actions">
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
        <button
          class="sound-btn"
          [ngClass]="{ muted: !soundEnabled() }"
          (click)="toggleSound.emit()"
          [attr.aria-label]="soundEnabled() ? 'Désactiver le son' : 'Activer le son'"
          [title]="soundEnabled() ? 'Désactiver le son' : 'Activer le son'"
        >
          {{ soundEnabled() ? '🔊' : '🔇' }}
        </button>
      </div>
    </div>
  `,
})
export class ChronoHeaderComponent {
  readonly hasExercise = input.required<boolean>();
  readonly seriesCount = input.required<number>();
  readonly formattedBreakDuration = input.required<string>();

  readonly soundEnabled = input.required<boolean>();

  readonly back = output<void>();
  readonly openBreakDurationPopup = output<void>();
  readonly toggleSound = output<void>();
}
