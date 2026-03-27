import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GetExerciseStatsUseCase } from '../../primary_ports/stats-exercise/get-exercise-stats.usecase';
import { ChartSelectionService } from './chart-selection.service';
import { TranslateModule } from '@ngx-translate/core';
import { StatsExerciseChartCardComponent } from './stats-exercise-chart-card.component';
import { ExerciseHistoryListComponent } from './exercise-history-list.component';

@Component({
  selector: 'app-stats-exercise',
  standalone: true,
  imports: [TranslateModule, StatsExerciseChartCardComponent, ExerciseHistoryListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats-exercise.component.html',
  styleUrl: './stats-exercise.component.scss',
})
export class StatsExerciseComponent implements OnInit {
  protected readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  protected readonly useCase = inject(GetExerciseStatsUseCase);
  protected readonly chartSelection = inject(ChartSelectionService);

  exerciseName = '';

  ngOnInit(): void {
    this.exerciseName = decodeURIComponent(this.route.snapshot.params['exerciseName']);
    this.useCase.execute(this.exerciseName);
  }
}
