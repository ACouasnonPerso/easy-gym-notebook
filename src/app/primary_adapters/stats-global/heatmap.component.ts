import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface HeatmapCell {
  date: Date;
  hasSession: boolean;
  isCurrentMonth: boolean;
  tags: string[];
}

@Component({
  selector: 'app-heatmap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  templateUrl: './heatmap.component.html',
  styleUrl: './heatmap.component.scss',
})
export class HeatmapComponent {
  data = input<HeatmapCell[]>([]);

  readonly selectedCell = signal<HeatmapCell | null>(null);

  onCellClick(cell: HeatmapCell): void {
    this.selectedCell.update(current => current === cell ? null : cell);
  }

  formatPopoverLabel(cell: HeatmapCell): string {
    const dayAbbr = cell.date.toLocaleDateString('fr-FR', { weekday: 'short' });
    const day = cell.date.getDate();
    const month = cell.date.toLocaleDateString('fr-FR', { month: 'long' });
    const capitalizedDay = dayAbbr.charAt(0).toUpperCase() + dayAbbr.slice(1, 3);
    const dateLabel = `${capitalizedDay} ${day} ${month}`;
    if (cell.tags.length === 0) return dateLabel;
    return `${dateLabel} : ${cell.tags.join(', ')}`;
  }

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
