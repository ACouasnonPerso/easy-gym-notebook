import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { ExerciseOccurrence } from '../../core_logic/shared/models';
import { getLabelStep } from './label-step';

@Component({
  selector: 'app-volume-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (chartData(); as cd) {
      <div>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-dot" style="background:#22c55e"></div>
            <span class="green">Volume</span>
            <span class="small">= Poids × Rép × Séries</span>
          </div>
        </div>
        <svg viewBox="0 0 320 150" width="100%" class="chart-svg">
          <defs>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#22c55e" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
            </linearGradient>
          </defs>

          <!-- Grid lines -->
          <line x1="0" y1="110" x2="320" y2="110" stroke="#2a2a38" stroke-width="1"/>
          <line x1="0" y1="80" x2="320" y2="80" stroke="#2a2a38" stroke-width="0.5" stroke-dasharray="4 4"/>
          <line x1="0" y1="50" x2="320" y2="50" stroke="#2a2a38" stroke-width="0.5" stroke-dasharray="4 4"/>
          <line x1="0" y1="20" x2="320" y2="20" stroke="#2a2a38" stroke-width="0.5" stroke-dasharray="4 4"/>

          <!-- Area fill -->
          @if (cd.volumePolyline) {
            <polygon [attr.points]="cd.volumeAreaPoints" fill="url(#greenGrad)"/>
          }

          <!-- Line -->
          @if (cd.volumePolyline) {
            <polyline [attr.points]="cd.volumePolyline" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
          }

          <!-- Dots + value labels green -->
          @for (p of cd.volumePoints; track $index) {
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="#22c55e"/>
            @if (p.label) {
              <text [attr.x]="p.x" [attr.y]="p.y - 7" text-anchor="middle" font-family="IBM Plex Mono" font-size="7.5" font-weight="600" fill="#22c55e">{{ p.label }}</text>
            }
          }

          <!-- X axis labels -->
          @for (l of cd.xLabels; track $index) {
            @if (l.label) {
              <text [attr.x]="l.x" y="126" text-anchor="middle" font-family="IBM Plex Mono" font-size="8" fill="#6b6b80">{{ l.label }}</text>
            }
          }
        </svg>
      </div>
    } @else {
      <div class="empty-chart">Aucune donnée</div>
    }
  `,
  styles: [`
    :host { display: block; }
    .chart-legend {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--sub);
      font-weight: 500;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .green { color: var(--green); }
    .small { font-size: 9px; color: var(--muted); }
    .chart-svg { overflow: visible; }
    .empty-chart {
      text-align: center;
      color: var(--muted);
      padding: 32px 0;
    }
  `],
})
export class VolumeLineChartComponent {
  readonly occurrences = input<ExerciseOccurrence[]>([]);

  readonly chartData = computed(() => {
    const data = this.occurrences();
    if (data.length === 0) return null;

    const n = data.length;
    const volumes = data.map(o => o.volumeKg);

    const minV = Math.min(...volumes), maxV = Math.max(...volumes);

    const xCoords = data.map((_, i) => 40 + (n === 1 ? 120 : (i / (n - 1)) * 240));

    const yVolume = (v: number) => {
      if (maxV === minV) return 20 + 90 / 2;
      return 20 + 90 - ((v - minV) / (maxV - minV)) * 90;
    };

    const labelStep = getLabelStep(n);

    const volumePoints = data.map((o, i) => ({
      x: xCoords[i],
      y: yVolume(o.volumeKg),
      label: i % labelStep === 0 ? `${o.volumeKg} kg` : '',
    }));

    const volumePolyline = n > 1 ? volumePoints.map(p => `${p.x},${p.y}`).join(' ') : '';

    const volumeAreaPoints = n > 1
      ? volumePoints.map(p => `${p.x},${p.y}`).join(' ') + ` ${xCoords[n-1]},110 ${xCoords[0]},110`
      : '';

    const xLabels = data.map((o, i) => ({
      x: xCoords[i],
      label: i % labelStep === 0 ? `${o.date.getDate().toString().padStart(2, '0')}/${(o.date.getMonth() + 1).toString().padStart(2, '0')}` : '',
    }));

    return {
      volumePoints,
      volumePolyline,
      volumeAreaPoints,
      xLabels,
      minV, maxV,
    };
  });
}
