import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe, NgStyle } from '@angular/common';
import { Session, MuscleGroup } from '../../core_logic/shared/models';
import { formatDuration } from '../../core_logic/shared/utils';
import { LongPressDirective } from '../shared/long-press.directive';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-session-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LongPressDirective, NgStyle, TranslateModule],
  templateUrl: './session-card.component.html',
  styleUrl: './session-card.component.scss',
})
export class SessionCardComponent {
  readonly session = input.required<Session>();
  readonly longPress = output<void>();

  readonly exerciseCount = computed(() => this.session().exercises.length);

  readonly totalWeight = computed(() =>
    this.session()
      .exercises.filter(e => e.status === 'validated')
      .reduce((sum, e) => sum + e.weightKg * e.sets * e.reps, 0)
  );

  readonly duration = computed(() => formatDuration(this.session().durationSeconds));

  readonly totalWeightFormatted = computed(() => {
    const kg = this.totalWeight();
    if (kg >= 1000) return (kg / 1000).toFixed(1).replace('.', ',') + ' t';
    return kg + ' kg';
  });

  readonly muscleTags = computed((): MuscleGroup[] => {
    const seen = new Set<MuscleGroup>();
    const result: MuscleGroup[] = [];
    for (const exercise of this.session().exercises) {
      if (exercise.muscleGroup !== null && !seen.has(exercise.muscleGroup)) {
        seen.add(exercise.muscleGroup);
        result.push(exercise.muscleGroup);
        if (result.length === 5) break;
      }
    }
    if (result.length === 0 && this.session().muscleGroup !== null)
      result.push(this.session().muscleGroup as MuscleGroup);
    return result;
  });

  readonly hasCardio = computed(() => this.session().exercises.some(e => e.isCardio));

  readonly visibleTags = computed(() => this.muscleTags().slice(0, 2));

  readonly extraTagCount = computed(() => Math.max(0, this.muscleTags().length - 2));

  private readonly muscleColorMap: Record<MuscleGroup, { color: string; bg: string; border: string }> = {
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
  };

  tagStyle(muscle: string): Record<string, string> {
    const entry = this.muscleColorMap[muscle as MuscleGroup];
    if (!entry) return {};
    return { color: entry.color, background: entry.bg, border: `1px solid ${entry.border}` };
  }
}
