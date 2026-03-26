import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GetExerciseStatsUseCase } from '../../primary_ports/stats-exercise/get-exercise-stats.usecase';
import { VolumeLineChartComponent } from './volume-line-chart.component';
import { WeightLineChartComponent } from './weight-line-chart.component';
import { CardioTimeChartComponent } from './cardio-time-chart.component';
import { CardioDistanceChartComponent } from './cardio-distance-chart.component';
import { ChartSelectionService } from './chart-selection.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-stats-exercise',
  standalone: true,
  imports: [VolumeLineChartComponent, WeightLineChartComponent, CardioTimeChartComponent, CardioDistanceChartComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="back-btn" (click)="location.back()"><span class="back-arrow">←</span> {{ 'common.back' | translate }}</div>
      <div class="page-title">{{ exerciseName }}</div>

      <div class="chart-card">
        @if (useCase.isCardio()) {
          <div class="chart-tabs">
            <button
              class="tab-btn"
              [class.active]="chartSelection.selectedChart() === 'volume'"
              (click)="chartSelection.select('volume')"
            >{{ 'common.duration' | translate }}</button>
            <button
              class="tab-btn"
              [class.active]="chartSelection.selectedChart() === 'weight'"
              (click)="chartSelection.select('weight')"
            >{{ 'statsExercise.distanceKm' | translate }}</button>
          </div>
          @if (chartSelection.selectedChart() === 'volume') {
            <app-cardio-time-chart [occurrences]="useCase.cardioOccurrences()" />
          } @else {
            <app-cardio-distance-chart [occurrences]="useCase.cardioOccurrences()" />
          }
        } @else {
          <div class="chart-tabs">
            <button
              class="tab-btn"
              [class.active]="chartSelection.selectedChart() === 'volume'"
              (click)="chartSelection.select('volume')"
            >{{ 'common.volume' | translate }}</button>
            <button
              class="tab-btn"
              [class.active]="chartSelection.selectedChart() === 'weight'"
              (click)="chartSelection.select('weight')"
            >{{ 'common.weight' | translate }}</button>
          </div>
          @if (chartSelection.selectedChart() === 'volume') {
            <app-volume-line-chart [occurrences]="useCase.occurrences()" />
          } @else {
            <app-weight-line-chart [occurrences]="useCase.occurrences()" />
          }
        }
      </div>

      @if (useCase.occurrences().length === 0) {
        <p class="empty">{{ 'statsExercise.empty' | translate }}</p>
      } @else {
        @for (o of useCase.occurrences(); track o.exerciseId) {
          <div class="history-card">
            <div class="history-header">
              <span class="history-date">{{ formatDate(o.date) }}</span>
            </div>
            <div class="history-stats">
              <div class="h-stat">
                <span class="h-stat-value orange">{{ o.weightKg }} kg</span>
                <span class="h-stat-label">{{ 'common.weight' | translate }}</span>
              </div>
              <div class="h-stat">
                <span class="h-stat-value">{{ o.sets }}</span>
                <span class="h-stat-label">{{ 'common.sets' | translate }}</span>
              </div>
              <div class="h-stat">
                <span class="h-stat-value">{{ o.reps }}</span>
                <span class="h-stat-label">{{ 'common.reps' | translate }}</span>
              </div>
              <div class="h-stat right">
                <span class="h-stat-value">{{ o.breakDurationSeconds }}s</span>
                <span class="h-stat-label">{{ 'common.break' | translate }}</span>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page {
      background: var(--bg);
      min-height: 100vh;
      padding: 24px 20px 100px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--sub);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      width: fit-content;
      transition: color 0.15s;
    }
    .back-btn:hover { color: var(--text); }
    .back-arrow { font-size: 18px; line-height: 1; }
    .page-title {
      font-family: 'Syne', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.3px;
    }
    .chart-card {
      background: var(--card);
      border-radius: 16px;
      border: 1px solid var(--border);
      padding: 16px;
    }
    .chart-tabs {
      display: flex;
      gap: 6px;
      margin-bottom: 16px;
    }
    .tab-btn {
      flex: 1;
      padding: 7px 0;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--sub);
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn.active {
      background: var(--card2, #1e1e2a);
      border-color: var(--border-active, #3a3a50);
      color: var(--text);
    }
    .tab-btn:not(.active):hover {
      color: var(--text);
    }
    .empty {
      text-align: center;
      color: var(--muted);
      margin-top: 32px;
      font-size: 14px;
    }
    .history-card {
      background: var(--card);
      border-radius: 16px;
      padding: 14px 16px;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: border-color 0.15s;
      position: relative;
      overflow: hidden;
    }
    .history-card::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px;
      background: var(--blue);
      border-radius: 3px 0 0 3px;
    }
    .history-card:hover { border-color: var(--blue); }
    .history-header {
      margin-bottom: 10px;
    }
    .history-date {
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--blue);
    }
    .history-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
    }
    .h-stat { display: flex; flex-direction: column; gap: 2px; }
    .h-stat.right { text-align: right; }
    .h-stat-value {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }
    .h-stat-value.orange { color: var(--orange); }
    .h-stat-label {
      font-size: 8px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: 1px;
      text-transform: uppercase;
    }
  `],
})
export class StatsExerciseComponent implements OnInit {
  protected readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  protected readonly useCase = inject(GetExerciseStatsUseCase);
  protected readonly chartSelection = inject(ChartSelectionService);
  private readonly translate = inject(TranslateService);

  exerciseName = '';

  ngOnInit(): void {
    this.exerciseName = decodeURIComponent(this.route.snapshot.params['exerciseName']);
    this.useCase.execute(this.exerciseName);
  }

  formatDate(d: Date): string {
    const locale = this.translate.currentLang === 'en' ? 'en-US' : 'fr-FR';
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
