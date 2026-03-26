import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CardioOccurrence } from '../../core_logic/shared/models';
import { getLabelStep } from './label-step';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cardio-time-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    @if (chartData(); as cd) {
      <div>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-dot" style="background:#8b5cf6"></div>
            <span class="purple">{{ 'common.duration' | translate }}</span>
          </div>
        </div>
        <svg viewBox="0 0 320 150" width="100%" class="chart-svg">
          <defs>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
            </linearGradient>
          </defs>

          <!-- Grid lines -->
          <line x1="0" y1="110" x2="320" y2="110" stroke="#2a2a38" stroke-width="1"/>
          <line x1="0" y1="80" x2="320" y2="80" stroke="#2a2a38" stroke-width="0.5" stroke-dasharray="4 4"/>
          <line x1="0" y1="50" x2="320" y2="50" stroke="#2a2a38" stroke-width="0.5" stroke-dasharray="4 4"/>
          <line x1="0" y1="20" x2="320" y2="20" stroke="#2a2a38" stroke-width="0.5" stroke-dasharray="4 4"/>

          <!-- Area fill -->
          @if (cd.timePolyline) {
            <polygon [attr.points]="cd.timeAreaPoints" fill="url(#purpleGrad)"/>
          }

          <!-- Line -->
          @if (cd.timePolyline) {
            <polyline [attr.points]="cd.timePolyline" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
          }

          <!-- Dots + value labels -->
          @for (p of cd.timePoints; track $index) {
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="#8b5cf6"/>
            @if (p.label) {
              <text [attr.x]="p.x" [attr.y]="p.y - 7" text-anchor="middle" font-family="IBM Plex Mono" font-size="7.5" font-weight="600" fill="#8b5cf6">{{ p.label }}</text>
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
      <div class="empty-chart">{{ 'common.noData' | translate }}</div>
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
    .purple { color: #8b5cf6; }
    .chart-svg { overflow: visible; }
    .empty-chart {
      text-align: center;
      color: var(--muted);
      padding: 32px 0;
    }
  `],
})
export class CardioTimeChartComponent {
  readonly occurrences = input<CardioOccurrence[]>([]);

  readonly chartData = computed(() => {
    const data = this.occurrences();
    if (data.length === 0) return null;

    const n = data.length;
    const durations = data.map(o => Math.floor(o.durationSeconds / 60));

    const minT = Math.min(...durations), maxT = Math.max(...durations);
    const xCoords = data.map((_, i) => 40 + (n === 1 ? 120 : (i / (n - 1)) * 240));

    const yTime = (v: number) => {
      if (maxT === minT) return 20 + 90 / 2;
      return 20 + 90 - ((v - minT) / (maxT - minT)) * 90;
    };

    const labelStep = getLabelStep(n);

    const timePoints = data.map((o, i) => {
      const minutes = Math.floor(o.durationSeconds / 60);
      return {
        x: xCoords[i],
        y: yTime(minutes),
        label: i % labelStep === 0 ? `${minutes}min` : '',
      };
    });

    const timePolyline = n > 1 ? timePoints.map(p => `${p.x},${p.y}`).join(' ') : '';
    const timeAreaPoints = n > 1
      ? timePoints.map(p => `${p.x},${p.y}`).join(' ') + ` ${xCoords[n-1]},110 ${xCoords[0]},110`
      : '';

    const xLabels = data.map((o, i) => ({
      x: xCoords[i],
      label: i % labelStep === 0 ? `${o.date.getDate().toString().padStart(2, '0')}/${(o.date.getMonth() + 1).toString().padStart(2, '0')}` : '',
    }));

    return { timePoints, timePolyline, timeAreaPoints, xLabels, minT, maxT };
  });
}
