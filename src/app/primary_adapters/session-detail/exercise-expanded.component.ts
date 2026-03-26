import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Exercise } from '../../core_logic/shared/models';
import { DrumPickerComponent } from '../shared/drum-picker.component';
import { generateRange } from '../../core_logic/shared/utils';
import { TranslateModule } from '@ngx-translate/core';

function secondsToMmss(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function mmssToSeconds(mmss: string): number {
  const [m, s] = mmss.split(':').map(Number);
  return m * 60 + s;
}

const WEIGHT_VALUES = [...generateRange(0, 30, 0.5), ...generateRange(31, 300, 1)];
const SETS_VALUES = generateRange(1, 20, 1);
const REPS_VALUES = generateRange(1, 50, 1);
const BREAK_VALUES = generateRange(0, 600, 5).map(secondsToMmss);
const HOURS_VALUES = generateRange(0, 12, 1);
const MINUTES_VALUES = generateRange(0, 59, 1);
const KM_VALUES: (number | null)[] = [
  null,
  ...generateRange(0.1, 2, 0.1).map(v => Math.round(v * 10) / 10),
  ...generateRange(2.5, 50, 0.5).map(v => Math.round(v * 10) / 10),
  ...generateRange(51, 200, 1),
];

@Component({
  selector: 'app-exercise-expanded',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DrumPickerComponent, FormsModule, TranslateModule],
  template: `
    <div class="expanded-panel" (click)="$event.stopPropagation()">
      <div class="name-row">
        <input
          class="name-input"
          type="text"
          [ngModel]="exercise().name"
          (ngModelChange)="update.emit({ name: $event })"
          [placeholder]="'exercise.name' | translate"
        />
      </div>
      @if (exercise().isCardio) {
        <div class="pickers-row">
          <div class="picker-col">
            <span class="picker-label">{{ 'common.hours' | translate }}</span>
            <app-drum-picker
              [values]="hoursValues"
              [selectedValue]="durationHours()"
              (valueChange)="emitDurationUpdate('hours', +$event)"
            />
          </div>
          <div class="picker-col">
            <span class="picker-label">{{ 'common.minutes' | translate }}</span>
            <app-drum-picker
              [values]="minutesValues"
              [selectedValue]="durationMinutes()"
              (valueChange)="emitDurationUpdate('minutes', +$event)"
            />
          </div>
          <div class="picker-col">
            <span class="picker-label">km</span>
            <app-drum-picker
              [values]="kmValues"
              [selectedValue]="exercise().distanceKm ?? null"
              (valueChange)="update.emit({ distanceKm: $event === null ? null : +$event })"
            />
          </div>
        </div>
      } @else {
        <div class="pickers-row">
          <div class="picker-col">
            <span class="picker-label">{{ 'common.weight' | translate }}</span>
            <app-drum-picker
              [values]="weightValues"
              [selectedValue]="exercise().weightKg"
              unit="kg"
              (valueChange)="update.emit({ weightKg: +$event })"
            />
          </div>
          <div class="picker-col">
            <span class="picker-label">{{ 'common.sets' | translate }}</span>
            <app-drum-picker
              [values]="setsValues"
              [selectedValue]="exercise().sets"
              (valueChange)="update.emit({ sets: +$event })"
            />
          </div>
          <div class="picker-col">
            <span class="picker-label">{{ 'common.reps' | translate }}</span>
            <app-drum-picker
              [values]="repsValues"
              [selectedValue]="exercise().reps"
              (valueChange)="update.emit({ reps: +$event })"
            />
          </div>
          <div class="picker-col" style="min-width: 100px">
            <span class="picker-label">{{ 'common.rest' | translate }}</span>
            <app-drum-picker style="min-width: 100px"
              [values]="breakValues"
              [selectedValue]="breakSelectedValue()"
              (valueChange)="emitBreakUpdate($event)"
            />
          </div>
        </div>
      }

      <div class="actions-row">
        <button class="btn btn-secondary" (click)="openChrono.emit()">{{ 'nav.chrono' | translate }}</button>
<button class="btn btn-secondary" (click)="openStats.emit()">{{ 'exercise.page' | translate }}</button>
        <button class="btn btn-delete" (click)="delete.emit()">{{ 'common.delete' | translate }}</button>
      </div>
    </div>
  `,
  styles: [`
    .name-row {
      margin-bottom: 12px;
    }
    .name-input {
      width: 100%;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 700;
      font-family: 'Syne', sans-serif;
      color: var(--text);
      box-sizing: border-box;
      outline: none;
    }
    .name-input:focus {
      border-color: var(--orange);
    }
    .expanded-panel {
      background: var(--card2);
      border-radius: 0 0 16px 16px;
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-top: none;
    }
    .pickers-row {
      display: flex;
      overflow-x: auto;
      gap: 4px;
      padding-bottom: 8px;
      scrollbar-width: none;
    }
    .pickers-row::-webkit-scrollbar { display: none; }
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
    .actions-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
    }
    .btn {
      padding: 8px 12px;
      border-radius: 10px;
      border: none;
      font-size: 11px;
      font-weight: 700;
      font-family: 'Syne', sans-serif;
      letter-spacing: 0.5px;
      cursor: pointer;
    }
    .btn-validate { background: var(--green); color: #000; }
    .btn-cancel { background: var(--card); color: var(--sub); border: 1px solid var(--border); }
    .btn-secondary {
      background: var(--card);
      color: var(--orange);
      border: 1px solid rgba(245,166,35,0.3);
    }
    .btn-delete { background: rgba(239,68,68,0.15); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }
  `],
})
export class ExerciseExpandedComponent {
  readonly exercise = input.required<Exercise>();
  readonly update = output<Partial<Exercise>>();
  readonly validate = output<void>();
  readonly cancel = output<void>();
  readonly delete = output<void>();
  readonly openChrono = output<void>();
  readonly openStats = output<void>();

  readonly weightValues = WEIGHT_VALUES;
  readonly setsValues = SETS_VALUES;
  readonly repsValues = REPS_VALUES;
  readonly breakValues = BREAK_VALUES;
  readonly hoursValues = HOURS_VALUES;
  readonly minutesValues = MINUTES_VALUES;
  readonly kmValues = KM_VALUES;
  readonly breakSelectedValue = computed(() => secondsToMmss(this.exercise().breakDurationSeconds));
  readonly durationHours = computed(() => Math.floor(this.exercise().durationSeconds / 3600));
  readonly durationMinutes = computed(() => Math.floor((this.exercise().durationSeconds % 3600) / 60));

  emitBreakUpdate(v: string | number): void {
    this.update.emit({ breakDurationSeconds: mmssToSeconds(String(v)) });
  }

  emitDurationUpdate(part: 'hours' | 'minutes', value: number): void {
    const current = this.exercise().durationSeconds;
    const h = Math.floor(current / 3600);
    const m = Math.floor((current % 3600) / 60);
    const newSeconds = part === 'hours'
      ? value * 3600 + m * 60
      : h * 3600 + value * 60;
    this.update.emit({ durationSeconds: newSeconds });
  }
}
