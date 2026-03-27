import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface SessionDurationEntry {
  date: Date;
  durationSeconds: number;
}

export type BarChartMode = 'day' | 'week' | 'month';

function getGroupKey(date: Date, mode: BarChartMode): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  if (mode === 'day') return `${y}-${m}-${d}`;
  if (mode === 'month') return `${y}-${m}`;
  // 'week': ISO week — Monday-anchored
  const tmp = new Date(date);
  tmp.setHours(0, 0, 0, 0);
  const day = tmp.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  tmp.setDate(tmp.getDate() + diff);
  return `${tmp.getFullYear()}-W${tmp.getMonth()}-${tmp.getDate()}`;
}

@Component({
  selector: 'app-training-time-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart">
      @for (bar of bars(); track bar.date.toISOString()) {
        <div class="bar-col">
          <span class="bar-label-top">{{ bar.label }}</span>
          <div class="bar-track">
            <div
              data-testid="bar"
              class="bar"
              [style.height]="bar.heightPercent + '%'"
            ></div>
          </div>
          <span class="bar-label-bottom">{{ bar.dateLabel }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .chart {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 80px;
    }
    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }
    .bar-track {
      width: 100%;
      height: 56px;
      display: flex;
      align-items: flex-end;
    }
    .bar {
      width: 100%;
      background: var(--orange, #f97316);
      border-radius: 4px 4px 0 0;
      min-height: 2px;
    }
    .bar-label-top {
      font-size: 9px;
      font-weight: 600;
      color: var(--sub, #888);
      margin-bottom: 2px;
    }
    .bar-label-bottom {
      font-size: 9px;
      font-weight: 600;
      color: var(--muted, #666);
      margin-top: 3px;
    }
  `],
})
export class TrainingTimeBarChartComponent {
  sessions = input<SessionDurationEntry[]>([]);
  mode = input<BarChartMode>('day');

  readonly bars = computed(() => {
    const mode = this.mode();
    const grouped = new Map<string, { date: Date; durationSeconds: number }>();

    for (const s of this.sessions()) {
      const key = getGroupKey(s.date, mode);
      const existing = grouped.get(key);
      if (existing) {
        existing.durationSeconds += s.durationSeconds;
      } else {
        grouped.set(key, { date: s.date, durationSeconds: s.durationSeconds });
      }
    }

    const entries = Array.from(grouped.values())
      .filter(e => e.durationSeconds > 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (entries.length === 0) return [];
    const max = Math.max(...entries.map(e => e.durationSeconds));
    return entries.map(e => ({
      date: e.date,
      heightPercent: Math.round((e.durationSeconds / max) * 100),
      label: this.formatDuration(e.durationSeconds),
      dateLabel: this.formatDateLabel(e.date),
    }));
  });

  formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0 && minutes > 0) return `${hours}h${minutes}`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}min`;
  }

  formatDateLabel(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }
}
