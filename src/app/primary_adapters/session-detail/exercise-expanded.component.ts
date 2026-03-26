import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Exercise } from '../../core_logic/shared/models';
import { DrumPickerComponent } from '../shared/drum-picker.component';
import { generateRange } from '../../core_logic/shared/utils';

function secondsToMmss(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function mmssToSeconds(mmss: string): number {
  const [m, s] = mmss.split(':').map(Number);
  return m * 60 + s;
}

const WEIGHT_VALUES = generateRange(0, 300, 0.5);
const SETS_VALUES = generateRange(1, 20, 1);
const REPS_VALUES = generateRange(1, 50, 1);
const BREAK_VALUES = generateRange(0, 600, 5).map(secondsToMmss);

@Component({
  selector: 'app-exercise-expanded',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DrumPickerComponent, FormsModule],
  template: `
    <div class="expanded-panel" (click)="$event.stopPropagation()">
      <div class="name-row">
        <input
          class="name-input"
          type="text"
          [ngModel]="exercise().name"
          (ngModelChange)="update.emit({ name: $event })"
          placeholder="Nom de l'exercice"
        />
      </div>
      <div class="pickers-row">
        <div class="picker-col">
          <span class="picker-label">Poids</span>
          <app-drum-picker
            [values]="weightValues"
            [selectedValue]="exercise().weightKg"
            unit="kg"
            (valueChange)="update.emit({ weightKg: +$event })"
          />
        </div>
        <div class="picker-col">
          <span class="picker-label">Séries</span>
          <app-drum-picker
            [values]="setsValues"
            [selectedValue]="exercise().sets"
            (valueChange)="update.emit({ sets: +$event })"
          />
        </div>
        <div class="picker-col">
          <span class="picker-label">Répétitions</span>
          <app-drum-picker
            [values]="repsValues"
            [selectedValue]="exercise().reps"
            (valueChange)="update.emit({ reps: +$event })"
          />
        </div>
        <div class="picker-col">
          <span class="picker-label">Repos</span>
          <app-drum-picker
            [values]="breakValues"
            [selectedValue]="breakSelectedValue()"
            (valueChange)="emitBreakUpdate($event)"
          />
        </div>
      </div>

      <div class="actions-row">
        <button class="btn btn-secondary" (click)="openChrono.emit()">Chronomètre</button>
        @if (exercise().status !== 'validated') {
          <button class="btn btn-validate" (click)="validate.emit()">Valider</button>
        }
        @if (exercise().status === 'validated') {
          <button class="btn btn-cancel" (click)="cancel.emit()">Annuler</button>
        }
        <button class="btn btn-secondary" (click)="openStats.emit()">Page exercice</button>
        <button class="btn btn-delete" (click)="delete.emit()">Supprimer</button>
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
      min-width: 80px;
      flex: 1;
    }
    .picker-col:last-child {
      min-width: 96px;
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
  readonly breakSelectedValue = computed(() => secondsToMmss(this.exercise().breakDurationSeconds));

  emitBreakUpdate(v: string | number): void {
    this.update.emit({ breakDurationSeconds: mmssToSeconds(String(v)) });
  }
}
