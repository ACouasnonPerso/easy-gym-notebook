import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MuscleGroup } from '../../core_logic/shared/models';

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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h${m > 0 ? m + 'min' : ''}`;
    return `${m}min`;
  }

  formatDistance(km: number | null): string {
    if (km === null) return '–';
    return km.toFixed(1).replace('.', ',') + ' km';
  }

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

  tagStyle(muscle: MuscleGroup): Record<string, string> {
    const entry = this.muscleColorMap[muscle];
    if (!entry) return {};
    return { color: entry.color, background: entry.bg, border: `1px solid ${entry.border}` };
  }
}
