import { Component, ChangeDetectionStrategy, input, output, inject, computed } from "@angular/core";
import { ExerciseOccurrence, CardioOccurrence } from "../../core_logic/shared/models";
import { ChartType } from "./chart-selection.service";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";
import { ExerciseOccurrenceGroupingService } from "../../core_logic/stats-exercise/exercise-occurrence-grouping.service";
import { VolumeLineChartComponent } from "./volume-line-chart.component";
import { WeightLineChartComponent } from "./weight-line-chart.component";
import { CardioTimeChartComponent } from "./cardio-time-chart.component";
import { CardioDistanceChartComponent } from "./cardio-distance-chart.component";
import { CardioPaceChartComponent } from "./cardio-pace-chart.component";
import { CardioSpeedChartComponent } from "./cardio-speed-chart.component";
import { TotalRepsLineChartComponent } from "./total-reps-line-chart.component";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-stats-exercise-chart-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		VolumeLineChartComponent,
		WeightLineChartComponent,
		TotalRepsLineChartComponent,
		CardioTimeChartComponent,
		CardioDistanceChartComponent,
		CardioPaceChartComponent,
		CardioSpeedChartComponent,
		TranslateModule,
	],
	templateUrl: "./stats-exercise-chart-card.component.html",
	styleUrl: "./stats-exercise-chart-card.component.scss",
})
export class StatsExerciseChartCardComponent {
	private readonly groupingService = inject(ExerciseOccurrenceGroupingService);

	readonly isCardio = input.required<boolean>();
	readonly occurrences = input.required<ExerciseOccurrence[]>();
	readonly cardioOccurrences = input.required<CardioOccurrence[]>();
	readonly selectedChart = input.required<ChartType>();
	readonly groupBy = input.required<GroupBy>();
	readonly chartSelect = output<ChartType>();

	readonly groupedOccurrences = computed<ExerciseOccurrence[]>(() =>
		this.groupingService.groupExercise(this.occurrences(), this.groupBy()),
	);

	readonly groupedCardioOccurrences = computed<CardioOccurrence[]>(() =>
		this.groupingService.groupCardio(this.cardioOccurrences(), this.groupBy()),
	);
}
