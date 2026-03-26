import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TrainingTimeBarChartComponent, SessionDurationEntry } from './training-time-bar-chart.component';

@Component({
  selector: 'app-stats-training-time-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TrainingTimeBarChartComponent, TranslateModule],
  template: `
    <div data-testid="training-time-bar-chart" class="stats-card">
      <div class="stats-card-title">{{ 'statsGlobal.trainingTime' | translate }}</div>
      <div class="divider"></div>
      <div style="height:12px"></div>
      <app-training-time-bar-chart [sessions]="sessions()" />
    </div>
  `,
  styleUrl: './stats-global.component.scss',
})
export class StatsTrainingTimeCardComponent {
  sessions = input<SessionDurationEntry[]>([]);
}
