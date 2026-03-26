import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-exercise-summary-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <div class="history-card" (click)="selected.emit(exerciseName())">
      <div class="history-header">
        <span class="exercise-name">{{ exerciseName() }}</span>
      </div>
      <div class="history-stats">
        <div class="h-stat">
          <span class="h-stat-value orange">{{ maxWeightKg() }} kg</span>
          <span class="h-stat-label">{{ 'common.max' | translate }}</span>
        </div>
        <div class="h-stat">
          <span class="h-stat-value">{{ formatVolume(totalVolumeKg()) }}</span>
          <span class="h-stat-label">{{ 'common.volume' | translate }}</span>
        </div>
        <div class="h-stat right">
          <span class="h-stat-value">{{ occurrenceCount() }}x</span>
          <span class="h-stat-label">{{ 'common.sessions' | translate }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-card {
      background: var(--card2);
      border-radius: 12px;
      padding: 12px 14px;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: border-color 0.15s;
      position: relative;
      overflow: hidden;
    }
    .history-card::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px;
      background: var(--blue);
      border-radius: 3px 0 0 3px;
    }
    .history-card:hover { border-color: var(--blue); }
    .history-header {
      margin-bottom: 8px;
    }
    .exercise-name {
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
    }
    .history-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }
    .h-stat { display: flex; flex-direction: column; gap: 2px; }
    .h-stat.right { text-align: right; }
    .h-stat-value {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
    }
    .h-stat-value.orange { color: var(--orange); }
    .h-stat-label {
      font-size: 8px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: 1px;
      text-transform: uppercase;
    }
  `],
})
export class ExerciseSummaryRowComponent {
  exerciseName = input<string>('');
  maxWeightKg = input<number>(0);
  totalVolumeKg = input<number>(0);
  occurrenceCount = input<number>(0);

  selected = output<string>();

  formatVolume(kg: number): string {
    if (kg >= 1000) return (kg / 1000).toFixed(1).replace('.', ',') + ' t';
    return Math.round(kg) + ' kg';
  }
}
