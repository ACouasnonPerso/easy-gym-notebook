import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MonthSummary } from '../../core_logic/stats-global/stats.service';

@Component({
  selector: 'app-stats-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
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
  title = input<string>('');
  summary = input<MonthSummary>({ totalWeightKg: 0, sessionCount: 0, totalDurationSeconds: 0 });

  formatWeight(kg: number): string {
    if (kg >= 1000) return (kg / 1000).toFixed(1).replace('.', ',') + ' t';
    return Math.round(kg) + ' kg';
  }

  formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h${minutes}`;
    return `${minutes}min`;
  }
}
