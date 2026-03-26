import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MuscleGroup } from '../../core_logic/shared/models';
import { TranslateModule } from '@ngx-translate/core';

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  [MuscleGroup.Chest]: '#e74c3c',
  [MuscleGroup.Back]: '#3498db',
  [MuscleGroup.Shoulders]: '#9b59b6',
  [MuscleGroup.Biceps]: '#1abc9c',
  [MuscleGroup.Triceps]: '#27ae60',
  [MuscleGroup.Forearms]: '#f39c12',
  [MuscleGroup.Abs]: '#d35400',
  [MuscleGroup.Quads]: '#2980b9',
  [MuscleGroup.Hamstrings]: '#8e44ad',
  [MuscleGroup.Glutes]: '#c0392b',
  [MuscleGroup.Calves]: '#16a085',
  [MuscleGroup.Traps]: '#f5a623',
  [MuscleGroup.FullBody]: '#7f8c8d',
};

const RADIUS = 55;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface DonutSegment {
  group: MuscleGroup;
  percentage: number;
  color: string;
  dashLen: number;
  dashOffset: number;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss',
})
export class DonutChartComponent {
  distribution = input<Map<MuscleGroup, number>>(new Map());

  readonly radius = RADIUS;
  readonly circumference = CIRCUMFERENCE;
  readonly svgSize = 150;
  readonly center = 75;

  readonly segments = computed((): DonutSegment[] => {
    const dist = this.distribution();
    const result: DonutSegment[] = [];
    let previousLength = 0;

    for (const [group, percentage] of dist) {
      if (percentage <= 0) continue;
      const dashLen = (percentage / 100) * CIRCUMFERENCE;
      const dashOffset = -previousLength;
      result.push({ group, percentage, color: MUSCLE_COLORS[group], dashLen, dashOffset });
      previousLength += dashLen;
    }

    return result;
  });
}
