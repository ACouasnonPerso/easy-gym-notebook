import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Exercise, MuscleGroup } from '../../core_logic/shared/models';
import { ExerciseExpandedComponent } from './exercise-expanded.component';
import { TranslateModule } from '@ngx-translate/core';
import { HapticService } from '../../core_logic/shared/haptic.service';

function formatDurationMinutes(seconds: number): string {
  return Math.floor(seconds / 60).toString();
}

function formatBreakDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

@Component({
  selector: 'app-exercise-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExerciseExpandedComponent, NgStyle, TranslateModule],
  template: `
    <div class="exercise-card" [class.validated]="isValidated()" (click)="toggleExpand.emit()">
      <div class="exercise-header">
        <button
          class="status-checkbox"
          [class.status-checkbox--validated]="isValidated()"
          [attr.aria-label]="isValidated() ? 'Annuler exercice' : 'Valider exercice'"
          (click)="$event.stopPropagation(); onCheckboxClick()"
        >
          @if (isValidated()) {
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          }
        </button>
        <span class="exercise-name">{{ exercise().name }}</span>
        @for (group of exercise().muscleGroups; track group) {
          <span class="tag" [ngStyle]="tagStyle(group)">{{ group }}</span>
        }
      </div>
      <div class="exercise-stats">
        @if (isCardio()) {
          <div class="ex-stat">
            <span class="ex-stat-value orange">{{ durationMinutes() }} min</span>
            <span class="ex-stat-label">{{ 'common.duration' | translate }}</span>
          </div>
          <div class="ex-stat right">
            @if (exercise().distanceKm !== null) {
              <span class="ex-stat-value blue">{{ exercise().distanceKm }} km</span>
            } @else {
              <span class="ex-stat-value blue">—</span>
            }
            <span class="ex-stat-label">km</span>
          </div>
        } @else {
          <div class="ex-stat">
            <span class="ex-stat-value orange">{{ exercise().weightKg }} kg</span>
            <span class="ex-stat-label">{{ 'common.weight' | translate }}</span>
          </div>
          <div class="ex-stat">
            <span class="ex-stat-value">{{ exercise().sets }}</span>
            <span class="ex-stat-label">{{ 'common.sets' | translate }}</span>
          </div>
          <div class="ex-stat">
            <span class="ex-stat-value blue">{{ breakLabel() }}</span>
            <span class="ex-stat-label">{{ 'common.break' | translate }}</span>
          </div>
          <div class="ex-stat right">
            <span class="ex-stat-value">{{ exercise().reps }}</span>
            <span class="ex-stat-label">{{ 'common.reps' | translate }}</span>
          </div>
        }
      </div>
    </div>
    @if (isExpanded()) {
      <app-exercise-expanded
        [exercise]="exercise()"
        (update)="exerciseUpdate.emit($event)"
        (validate)="exerciseValidate.emit()"
        (cancel)="exerciseCancel.emit()"
        (delete)="exerciseDelete.emit()"
        (openChrono)="openChrono.emit()"
        (openStats)="openStats.emit()"
      />
    }
  `,
  styles: [`
    .exercise-card {
      background: var(--card);
      border-radius: 16px;
      padding: 14px 16px;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: border-color 0.15s, transform 0.15s;
      position: relative;
      overflow: hidden;
      user-select: none;
    }
    .exercise-card::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px;
      background: var(--orange);
      border-radius: 3px 0 0 3px;
    }
    .exercise-card.validated::before { background: var(--green); }
    .exercise-card:hover { border-color: var(--orange); transform: translateY(-1px); }
    .exercise-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .status-checkbox {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1.5px solid var(--orange);
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--card);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
      padding: 0;
    }
    .status-checkbox:hover {
      background: var(--orange-dim);
      box-shadow: 0 0 0 3px rgba(245,166,35,0.12);
    }
    .status-checkbox--validated {
      background: var(--green);
      border-color: var(--green);
      color: #0c0c14;
    }
    .status-checkbox--validated:hover {
      background: rgba(34,197,94,0.8);
      border-color: rgba(34,197,94,0.8);
      box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
    }
    .exercise-name {
      flex: 1;
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
    }
    .tag {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      font-family: 'Syne', sans-serif;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 3px 9px;
      border-radius: 20px;
    }
    .exercise-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
    }
    .ex-stat { display: flex; flex-direction: column; gap: 2px; }
    .ex-stat.right { text-align: right; }
    .ex-stat-value {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }
    .ex-stat-value.orange { color: var(--orange); }
    .ex-stat-value.blue { color: var(--blue); }
    .ex-stat-label {
      font-size: 8px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: 1px;
      text-transform: uppercase;
    }
  `],
})
export class ExerciseCardComponent {
  private readonly haptic = inject(HapticService);
  readonly exercise = input.required<Exercise>();
  readonly isExpanded = input<boolean>(false);
  readonly toggleExpand = output<void>();

  readonly exerciseUpdate = output<Partial<Exercise>>();
  readonly exerciseValidate = output<void>();
  readonly exerciseCancel = output<void>();
  readonly exerciseDelete = output<void>();
  readonly openChrono = output<void>();
  readonly openStats = output<void>();

  readonly isValidated = computed(() => this.exercise().status === 'validated');
  readonly isActiveStatus = computed(() => this.exercise().status === 'pending' || this.exercise().status === 'cancelled');
  readonly breakLabel = computed(() => formatBreakDuration(this.exercise().breakDurationSeconds));
  readonly isCardio = computed(() => this.exercise().isCardio);
  readonly durationMinutes = computed(() => formatDurationMinutes(this.exercise().durationSeconds));

  private readonly muscleColorMap: Record<string, { color: string; bg: string; border: string }> = {
    [MuscleGroup.Chest]:      { color: '#e74c3c', bg: 'rgba(231,76,60,0.15)',    border: 'rgba(231,76,60,0.3)' },
    [MuscleGroup.Back]:       { color: '#3498db', bg: 'rgba(52,152,219,0.15)',   border: 'rgba(52,152,219,0.3)' },
    [MuscleGroup.Shoulders]:  { color: '#9b59b6', bg: 'rgba(155,89,182,0.15)',   border: 'rgba(155,89,182,0.3)' },
    [MuscleGroup.Biceps]:     { color: '#2ecc71', bg: 'rgba(46,204,113,0.15)',   border: 'rgba(46,204,113,0.3)' },
    [MuscleGroup.Triceps]:    { color: '#1abc9c', bg: 'rgba(26,188,156,0.15)',   border: 'rgba(26,188,156,0.3)' },
    [MuscleGroup.Forearms]:   { color: '#a3cb38', bg: 'rgba(163,203,56,0.15)',   border: 'rgba(163,203,56,0.3)' },
    [MuscleGroup.Abs]:        { color: 'var(--orange)', bg: 'var(--orange-dim)', border: 'rgba(245,166,35,0.3)' },
    [MuscleGroup.Quads]:      { color: '#00bcd4', bg: 'rgba(0,188,212,0.15)',    border: 'rgba(0,188,212,0.3)' },
    [MuscleGroup.Hamstrings]: { color: '#5c6bc0', bg: 'rgba(92,107,192,0.15)',   border: 'rgba(92,107,192,0.3)' },
    [MuscleGroup.Glutes]:     { color: '#e91e8c', bg: 'rgba(233,30,140,0.15)',   border: 'rgba(233,30,140,0.3)' },
    [MuscleGroup.Calves]:     { color: '#f1c40f', bg: 'rgba(241,196,15,0.15)',   border: 'rgba(241,196,15,0.3)' },
    [MuscleGroup.Traps]:      { color: '#ff9800', bg: 'rgba(255,152,0,0.15)',    border: 'rgba(255,152,0,0.3)' },
    [MuscleGroup.FullBody]:   { color: '#ecf0f1', bg: 'rgba(236,240,241,0.1)',   border: 'rgba(236,240,241,0.2)' },
    Cardio:                   { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',    border: 'rgba(6,182,212,0.3)' },
  };

  tagStyle(muscle: MuscleGroup | null): Record<string, string> {
    if (!muscle) return {};
    const entry = this.muscleColorMap[muscle];
    if (!entry) return {};
    return { color: entry.color, background: entry.bg, border: `1px solid ${entry.border}` };
  }

  onCheckboxClick(): void {
    this.haptic.vibrate();
    if (this.isValidated()) this.exerciseCancel.emit();
    else this.exerciseValidate.emit();
  }
}
