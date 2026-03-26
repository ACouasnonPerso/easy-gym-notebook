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
  template: `
    <div class="overlay" (click)="cancelled.emit()">
      <div class="form-card" (click)="$event.stopPropagation()">
        <h2 class="form-title">{{ 'common.duration' | translate }}</h2>
        <div class="pickers-row">
          <div class="picker-col">
            <span class="picker-label">{{ 'common.hours' | translate }}</span>
            <app-drum-picker [values]="hoursValues" [selectedValue]="selectedHours()" (valueChange)="onHoursChange($event)" />
          </div>
          <div class="picker-col">
            <span class="picker-label">{{ 'common.minutes' | translate }}</span>
            <app-drum-picker [values]="minutesValues" [selectedValue]="selectedMinutes()" (valueChange)="onMinutesChange($event)" />
          </div>
          <div class="picker-col">
            <span class="picker-label">{{ 'common.seconds' | translate }}</span>
            <app-drum-picker [values]="secondsValues" [selectedValue]="selectedSecs()" (valueChange)="onSecondsChange($event)" />
          </div>
        </div>
        <div class="actions">
          <button class="btn-cancel" (click)="cancelled.emit()">{{ 'common.cancel' | translate }}</button>
          <button class="btn-primary" (click)="onConfirm()">{{ 'common.confirm' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: flex-end;
      z-index: 400;
    }
    .form-card {
      background: var(--card);
      border-radius: 20px 20px 0 0;
      padding: 24px 20px calc(36px + env(safe-area-inset-bottom));
      width: 100%;
    }
    .form-title {
      font-family: 'Syne', sans-serif;
      color: var(--text);
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 20px;
      letter-spacing: -0.3px;
    }
    .pickers-row {
      display: flex;
      gap: 4px;
      background: var(--card2);
      border-radius: 14px;
      padding: 12px 8px 8px;
      border: 1px solid var(--border);
      margin-bottom: 20px;
    }
    .picker-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }
    .picker-label {
      font-size: 8px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 4px;
      text-align: center;
    }
    .actions { display: flex; gap: 12px; }
    .btn-cancel {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--sub);
      font-size: 13px;
      font-weight: 700;
      font-family: 'Syne', sans-serif;
      cursor: pointer;
    }
    .btn-primary {
      flex: 2;
      padding: 14px;
      border-radius: 12px;
      border: none;
      background: var(--orange);
      color: #000;
      font-size: 13px;
      font-weight: 700;
      font-family: 'Syne', sans-serif;
      cursor: pointer;
    }
  `],
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
