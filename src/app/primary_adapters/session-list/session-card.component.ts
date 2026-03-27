import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { DatePipe, NgStyle } from '@angular/common';
import { Session, MuscleGroup } from '../../core_logic/shared/models';
import { formatDuration, computeVolume } from '../../core_logic/shared/utils';
import { LongPressDirective } from '../shared/long-press.directive';
import { TranslateModule } from '@ngx-translate/core';
import { muscleGroupChipStyle } from '../../core_logic/shared/muscle-group-colors';
import { LanguageService } from '../../core_logic/language/language.service';

@Component({
  selector: 'app-session-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LongPressDirective, NgStyle, TranslateModule],
  templateUrl: './session-card.component.html',
  styleUrl: './session-card.component.scss',
})
export class SessionCardComponent {
  private readonly languageService = inject(LanguageService);
  readonly session = input.required<Session>();
  readonly longPress = output<void>();
  readonly locale = computed(() => this.languageService.activeLang());

  readonly dateLabel = computed(() => {
    const pipe = new DatePipe(this.locale());
    const raw = pipe.transform(this.session().date, 'EEE d MMM yyyy') ?? '';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  });

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

  readonly isOnlyCardio = computed((): boolean => {
    const exercises = this.session().exercises;
    return exercises.length > 0 && exercises.every(e => e.isCardio);
  });

  readonly totalDistanceKm = computed((): number =>
    this.session()
      .exercises.filter(e => e.isCardio && e.status === 'validated' && e.distanceKm !== null)
      .reduce((sum, e) => sum + (e.distanceKm as number), 0)
  );

  readonly totalDistanceKmFormatted = computed(() => {
    const km = this.totalDistanceKm();
    if (km === 0) return '_';
    return km.toFixed(1).replace('.', ',') + ' km';
  });

  tagStyle(muscle: string): Record<string, string> {
    return muscleGroupChipStyle(muscle as MuscleGroup);
  }
}
