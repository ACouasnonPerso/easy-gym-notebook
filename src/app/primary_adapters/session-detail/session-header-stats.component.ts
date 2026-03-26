import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Session } from '../../core_logic/shared/models';

@Component({
  selector: 'app-session-header-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './session-header-stats.component.html',
  styleUrl: './session-header-stats.component.scss',
})
export class SessionHeaderStatsComponent {
  readonly session = input.required<Session>();
  readonly totalWeightFormatted = input.required<string>();
  readonly dateChange = output<string>();

  readonly showDateInput = signal(false);

  readonly currentDateStr = computed(() => {
    const d = this.session().date;
    return d instanceof Date ? d.toISOString().split('T')[0] : new Date(d).toISOString().split('T')[0];
  });

  readonly minDateStr = computed(() => {
    const d = this.session().date;
    const next = new Date(d instanceof Date ? d : new Date(d));
    next.setDate(next.getDate() + 1);
    return next.toISOString().split('T')[0];
  });

  onDateChange(value: string): void {
    if (!value) return;
    this.dateChange.emit(value);
    this.showDateInput.set(false);
  }
}
