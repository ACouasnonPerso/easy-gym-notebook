import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface HeatmapCell {
  date: Date;
  hasSession: boolean;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-heatmap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <div class="heatmap">
      <!-- Header row -->
      <div></div>
      <div class="hm-day-label">{{ 'days.mon' | translate }}</div>
      <div class="hm-day-label">{{ 'days.tue' | translate }}</div>
      <div class="hm-day-label">{{ 'days.wed' | translate }}</div>
      <div class="hm-day-label">{{ 'days.thu' | translate }}</div>
      <div class="hm-day-label">{{ 'days.fri' | translate }}</div>
      <div class="hm-day-label">{{ 'days.sat' | translate }}</div>
      <div class="hm-day-label">{{ 'days.sun' | translate }}</div>

      @for (week of weeks(); track $index) {
        <div class="hm-week-label">S{{ $index + 1 }}</div>
        @for (cell of week; track cell.date.toISOString()) {
          <div [class]="getCellClass(cell)"></div>
        }
      }
    </div>
  `,
  styles: [`
    .heatmap {
      display: grid;
      grid-template-columns: 28px repeat(7, 1fr);
      gap: 6px;
    }
    .hm-day-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--muted);
      text-align: center;
      letter-spacing: 0.5px;
      padding-bottom: 2px;
    }
    .hm-week-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--muted);
      display: flex;
      align-items: center;
      justify-content: flex-start;
      letter-spacing: 0.3px;
    }
    .hm-cell {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 8px;
      background: var(--card2);
      transition: transform 0.12s;
      cursor: pointer;
    }
    .hm-cell:hover { transform: scale(1.15); }
    .hm-cell.done { background: var(--green); box-shadow: 0 2px 8px rgba(34,197,94,0.3); }
    .hm-cell.partial { background: rgba(34,197,94,0.35); }
    .hm-cell.dim { background: rgba(34,197,94,0.08); }
    .hm-cell.empty { background: var(--card2); }
    .hm-cell.today { background: #3b82f6; box-shadow: 0 2px 8px rgba(59,130,246,0.4); }
    .hm-cell.done.today { background: #16a34a; box-shadow: 0 2px 8px rgba(22,163,74,0.4); }
  `],
})
export class HeatmapComponent {
  data = input<HeatmapCell[]>([]);

  readonly weeks = computed(() => {
    const cells = this.data();
    const result: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  });

  getCellClass(cell: HeatmapCell): string {
    if (!cell.isCurrentMonth) return 'hm-cell dim';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = cell.date.getTime() === today.getTime();
    if (isToday) {
      if (cell.hasSession) return 'hm-cell done today';
      return 'hm-cell today';
    }
    if (cell.hasSession) return 'hm-cell done';
    if (cell.date > today) return 'hm-cell dim';
    return 'hm-cell empty';
  }
}
