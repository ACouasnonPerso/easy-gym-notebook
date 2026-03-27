import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MuscleGroup } from '../../core_logic/shared/models';
import { muscleGroupChipStyle } from '../../core_logic/shared/muscle-group-colors';
import { formatSummaryDuration } from '../../core_logic/shared/utils';

@Component({
  selector: 'app-exercise-summary-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule, NgStyle],
  templateUrl: './exercise-summary-row.component.html',
  styleUrl: './exercise-summary-row.component.scss',
})
export class ExerciseSummaryRowComponent {
  exerciseName = input<string>('');
  maxWeightKg = input<number>(0);
  totalVolumeKg = input<number>(0);
  occurrenceCount = input<number>(0);
  isCardio = input<boolean>(false);
  totalDurationSeconds = input<number>(0);
  totalDistanceKm = input<number | null>(null);
  muscleGroups = input<MuscleGroup[]>([]);

  selected = output<string>();

  formatVolume(kg: number): string {
    if (kg >= 1000) return (kg / 1000).toFixed(1).replace('.', ',') + ' t';
    return Math.round(kg) + ' kg';
  }

  formatDuration(seconds: number): string {
    return formatSummaryDuration(seconds);
  }

  formatDistance(km: number | null): string {
    if (km === null) return '–';
    return km.toFixed(1).replace('.', ',') + ' km';
  }

  tagStyle(muscle: MuscleGroup): Record<string, string> {
    return muscleGroupChipStyle(muscle);
  }
}
