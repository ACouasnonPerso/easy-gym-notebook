import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CardioOccurrence } from '../../core_logic/shared/models';
import { getLabelStep } from './label-step';
import { TranslateModule } from '@ngx-translate/core';
import { DistanceDisplayPipe } from '../../core_logic/mass-unit/distance-display.pipe';

@Component({
  selector: 'app-cardio-distance-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  providers: [DistanceDisplayPipe],
  templateUrl: './cardio-distance-chart.component.html',
  styleUrl: './cardio-distance-chart.component.scss',
})
export class CardioDistanceChartComponent {
  private readonly distanceDisplay = inject(DistanceDisplayPipe);
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
      label: i % labelStep === 0 ? this.distanceDisplay.transform(o.distanceKm as number, 'km') : '',
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
