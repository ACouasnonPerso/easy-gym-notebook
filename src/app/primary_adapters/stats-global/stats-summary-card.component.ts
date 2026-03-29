import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MonthSummary } from '../../core_logic/stats-global/stats.service';
import { formatSummaryDuration } from '../../core_logic/shared/utils';
import { WeightDisplayPipe } from '../../core_logic/mass-unit/weight-display.pipe';

@Component({
  selector: 'app-stats-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  providers: [WeightDisplayPipe],
  template: `
    <div class="stats-card">
      <div class="stats-card-title">{{ title() }}</div>
      <div class="divider"></div>
      <div style="height:12px"></div>
      <div class="summary-grid">
        <div class="summary-stat">
          <span class="summary-value" style="color:var(--orange)">{{ formatWeight(summary().totalWeightKg) }}</span>
          <span class="summary-label">{{ 'common.weight' | translate }}</span>
        </div>
        <div class="summary-stat" style="text-align:center">
          <span class="summary-value" style="color:var(--green)">{{ summary().sessionCount }}</span>
          <span class="summary-label">{{ 'common.sessions' | translate }}</span>
        </div>
        <div class="summary-stat" style="text-align:right">
          <span class="summary-value">{{ formatDuration(summary().totalDurationSeconds) }}</span>
          <span class="summary-label">{{ 'common.time' | translate }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './stats-global.component.scss',
})
export class StatsSummaryCardComponent {
  private readonly weightDisplay = inject(WeightDisplayPipe);
  title = input<string>('');
  summary = input<MonthSummary>({ totalWeightKg: 0, sessionCount: 0, totalDurationSeconds: 0 });

  formatWeight(kg: number): string {
    if (kg >= 1000) return this.weightDisplay.transform(kg / 1000, 't');
    return this.weightDisplay.transform(Math.round(kg), 'kg');
  }

  formatDuration(totalSeconds: number): string {
    return formatSummaryDuration(totalSeconds);
  }
}
