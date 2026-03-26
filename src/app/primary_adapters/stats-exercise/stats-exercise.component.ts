import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import {DecimalPipe, Location} from '@angular/common';
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
	imports: [VolumeLineChartComponent, WeightLineChartComponent, CardioTimeChartComponent, CardioDistanceChartComponent, TranslateModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats-exercise.component.html',
  styleUrl: './stats-exercise.component.scss',
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
