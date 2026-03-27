import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  signal,
  computed,
} from '@angular/core';
import { AppVersionService } from '../../core_logic/shared/app-version.service';

@Component({
  selector: 'app-stats-month-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats-month-selector.component.html',
  styleUrl: './stats-month-selector.component.scss',
})
export class StatsMonthSelectorComponent {
  readonly months = input.required<{ label: string; value: Date | null; type: 'month' | 'current-year' | 'total' | 'current-week' }[]>();
  readonly selectedMonthIndex = input.required<number>();
  readonly monthChange = output<number>();

  readonly appVersion = inject(AppVersionService);
  readonly showDropdown = signal(false);

  readonly currentMonthLabel = computed(() => this.months()[this.selectedMonthIndex()]?.label ?? '');

  selectMonth(index: number): void {
    this.monthChange.emit(index);
    this.showDropdown.set(false);
  }
}
