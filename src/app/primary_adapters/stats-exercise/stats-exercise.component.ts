import { Component, ChangeDetectionStrategy, OnInit, inject } from "@angular/core";
import { Location } from "@angular/common";
import { HapticService } from "../../core_logic/shared/haptic.service";
import { ActivatedRoute } from "@angular/router";
import { GetExerciseStatsUseCase } from "../../primary_ports/stats-exercise/get-exercise-stats.usecase";
import { UpdateExerciseUseCase } from "../../primary_ports/session-detail/update-exercise.usecase";
import { ChartSelectionService } from "./chart-selection.service";
import { TranslateModule } from "@ngx-translate/core";
import { StatsExerciseChartCardComponent } from "./stats-exercise-chart-card.component";
import { ExerciseHistoryListComponent } from "./exercise-history-list.component";

@Component({
	selector: "app-stats-exercise",
	standalone: true,
	imports: [TranslateModule, StatsExerciseChartCardComponent, ExerciseHistoryListComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./stats-exercise.component.html",
	styleUrl: "./stats-exercise.component.scss",
})
export class StatsExerciseComponent implements OnInit {
	private readonly location = inject(Location);
	private readonly haptic = inject(HapticService);
	private readonly route = inject(ActivatedRoute);
	protected readonly useCase = inject(GetExerciseStatsUseCase);
	protected readonly chartSelection = inject(ChartSelectionService);
	private readonly updateExercise = inject(UpdateExerciseUseCase);

	exerciseName = "";

	ngOnInit(): void {
		this.exerciseName = decodeURIComponent(this.route.snapshot.params["exerciseName"]);
		this.useCase.execute(this.exerciseName);
	}

	async onCommentEdited(event: { exerciseId: string; comment: string | null }): Promise<void> {
		await this.updateExercise.execute(event.exerciseId, { comment: event.comment });
		await this.useCase.execute(this.exerciseName);
	}

	goBack(): void {
		this.haptic.vibrate();
		this.location.back();
	}
}
