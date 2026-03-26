import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MuscleGroup } from '../../core_logic/shared/models';

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
  template: `
    @if (segments().length === 0) {
      <p class="empty">Aucune donnée ce mois-ci</p>
    } @else {
      <div class="pie-container">
        <svg [attr.width]="svgSize" [attr.height]="svgSize" [attr.viewBox]="'0 0 ' + svgSize + ' ' + svgSize" class="pie-svg">
          <g [attr.transform]="'rotate(-90, ' + center + ', ' + center + ')'">
            @for (segment of segments(); track segment.group) {
              <circle
                [attr.cx]="center"
                [attr.cy]="center"
                [attr.r]="radius"
                fill="none"
                [attr.stroke]="segment.color"
                stroke-width="28"
                [attr.stroke-dasharray]="segment.dashLen + ' ' + circumference"
                [attr.stroke-dashoffset]="segment.dashOffset"
              />
            }
          </g>
        </svg>
        <div class="pie-legend">
          @for (segment of segments(); track segment.group) {
            <div class="legend-item">
              <div class="legend-dot" [style.background]="segment.color"></div>
              <span class="legend-text">{{ segment.group }}</span>
              <span class="legend-pct">{{ segment.percentage }}%</span>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .empty {
      color: var(--muted);
      text-align: center;
      font-size: 14px;
      padding: 16px 0;
    }
    .pie-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 12px 0;
      gap: 20px;
    }
    .pie-svg { display: block; }
    .pie-legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-text {
      font-size: 12px;
      color: var(--sub);
      font-weight: 500;
      flex: 1;
    }
    .legend-pct {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      margin-left: auto;
    }
  `],
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
