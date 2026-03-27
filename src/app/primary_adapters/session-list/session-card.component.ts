import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe, NgStyle } from '@angular/common';
import { Session, MuscleGroup } from '../../core_logic/shared/models';
import { formatDuration, computeVolume } from '../../core_logic/shared/utils';
import { LongPressDirective } from '../shared/long-press.directive';
import { TranslateModule } from '@ngx-translate/core';
import { muscleGroupChipStyle } from '../../core_logic/shared/muscle-group-colors';

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
      .reduce((sum, e) => sum + computeVolume(e), 0)
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
        }
    }
    if (result.length === 0 && this.session().muscleGroup !== null)
      result.push(this.session().muscleGroup as MuscleGroup);
    return result;
  });

  readonly hasCardio = computed(() => this.session().exercises.some(e => e.isCardio));

  tagStyle(muscle: string): Record<string, string> {
    return muscleGroupChipStyle(muscle as MuscleGroup);
  }
}
