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
  templateUrl: './exercise-card.component.html',
  styleUrl: './exercise-card.component.scss',
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
    [MuscleGroup.Adductors]:  { color: '#ec407a', bg: 'rgba(236,64,122,0.15)',  border: 'rgba(236,64,122,0.3)' },
    [MuscleGroup.Abductors]:  { color: '#ab47bc', bg: 'rgba(171,71,188,0.15)',  border: 'rgba(171,71,188,0.3)' },
    Cardio:                   { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',    border: 'rgba(6,182,212,0.3)' },
  };

  tagStyle(muscle: MuscleGroup | 'Cardio' | null): Record<string, string> {
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
