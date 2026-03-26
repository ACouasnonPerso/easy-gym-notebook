import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CardioOccurrence } from '../../core_logic/shared/models';
import { getLabelStep } from './label-step';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cardio-distance-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    @if (chartData(); as cd) {
      <div>
        <svg viewBox="0 0 320 150" width="100%" class="chart-svg">
          @for (p of cd.distancePoints; track $index) {
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="#06b6d4"/>
          }
        </svg>
      </div>
    } @else {
      <div class="empty-chart">{{ 'common.noData' | translate }}</div>
    }
  `,
  styles: [`
    :host { display: block; }
    .empty-chart { text-align: center; color: var(--muted); padding: 32px 0; }
    .chart-svg { overflow: visible; }
  `],
})
export class CardioDistanceChartComponent {
  readonly occurrences = input<CardioOccurrence[]>([]);

  readonly chartData = computed(() => {
    const data = this.occurrences().filter(o => o.distanceKm !== null && o.distanceKm !== 0);
    if (data.length === 0) return null;

    const n = data.length;
    const distances = data.map(o => o.distanceKm as number);
    const minD = Math.min(...distances), maxD = Math.max(...distances);
    const xCoords = data.map((_, i) => 40 + (n === 1 ? 120 : (i / (n - 1)) * 240));
    const yDist = (v: number) => {
      if (maxD === minD) return 20 + 90 / 2;
      return 20 + 90 - ((v - minD) / (maxD - minD)) * 90;
    };
    const labelStep = getLabelStep(n);
    const distancePoints = data.map((o, i) => ({
      x: xCoords[i],
      y: yDist(o.distanceKm as number),
      label: i % labelStep === 0 ? `${o.distanceKm} km` : '',
    }));
    const distancePolyline = n > 1 ? distancePoints.map(p => `${p.x},${p.y}`).join(' ') : '';
    const distanceAreaPoints = n > 1
      ? distancePoints.map(p => `${p.x},${p.y}`).join(' ') + ` ${xCoords[n-1]},110 ${xCoords[0]},110`
      : '';
    const xLabels = data.map((o, i) => ({
      x: xCoords[i],
      label: i % labelStep === 0 ? `${o.date.getDate().toString().padStart(2, '0')}/${(o.date.getMonth() + 1).toString().padStart(2, '0')}` : '',
    }));
    return { distancePoints, distancePolyline, distanceAreaPoints, xLabels, minD, maxD };
  });
}
