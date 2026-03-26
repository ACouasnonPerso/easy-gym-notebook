import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { DrumPickerComponent } from '../shared/drum-picker.component';
import { generateRange } from '../../core_logic/shared/utils';
import { TranslateModule } from '@ngx-translate/core';

const HOURS_VALUES = generateRange(0, 23, 1);
const MINUTES_VALUES = generateRange(0, 59, 1);
const SECONDS_VALUES = generateRange(0, 59, 1);

@Component({
  selector: 'app-edit-duration-popup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DrumPickerComponent, TranslateModule],
  templateUrl: './edit-duration-popup.component.html',
  styleUrl: './edit-duration-popup.component.scss',
})
export class EditDurationPopupComponent {
  readonly initialSeconds = input.required<number>();
  readonly confirmed = output<number>();
  readonly cancelled = output<void>();

  readonly hoursValues = HOURS_VALUES;
  readonly minutesValues = MINUTES_VALUES;
  readonly secondsValues = SECONDS_VALUES;

  readonly hours = computed(() => Math.floor(this.initialSeconds() / 3600));
  readonly minutes = computed(() => Math.floor((this.initialSeconds() % 3600) / 60));
  readonly secs = computed(() => this.initialSeconds() % 60);

  private readonly _hours = signal<number | null>(null);
  private readonly _minutes = signal<number | null>(null);
  private readonly _secs = signal<number | null>(null);

  readonly selectedHours = computed(() => this._hours() ?? this.hours());
  readonly selectedMinutes = computed(() => this._minutes() ?? this.minutes());
  readonly selectedSecs = computed(() => this._secs() ?? this.secs());

  onHoursChange(v: number | string): void { this._hours.set(+v); }
  onMinutesChange(v: number | string): void { this._minutes.set(+v); }
  onSecondsChange(v: number | string): void { this._secs.set(+v); }

  onConfirm(): void {
    const total = this.selectedHours() * 3600 + this.selectedMinutes() * 60 + this.selectedSecs();
    this.confirmed.emit(total);
  }
}
