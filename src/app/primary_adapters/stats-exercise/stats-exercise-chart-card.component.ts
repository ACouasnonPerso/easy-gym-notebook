import { Component, ChangeDetectionStrategy, input, output, inject, computed, signal, effect } from "@angular/core";
import { ExerciseOccurrence, CardioOccurrence } from "../../core_logic/shared/models";
import { ChartType } from "./chart-selection.service";
import { AggregationMode, GroupBy } from "../../core_logic/stats-exercise/group-by.model";
import { ExerciseOccurrenceGroupingService } from "../../core_logic/stats-exercise/exercise-occurrence-grouping.service";
import { VolumeLineChartComponent } from "./volume-line-chart.component";
import { WeightLineChartComponent } from "./weight-line-chart.component";
import { CardioTimeChartComponent } from "./cardio-time-chart.component";
import { CardioDistanceChartComponent } from "./cardio-distance-chart.component";
import { CardioPaceChartComponent } from "./cardio-pace-chart.component";
import { CardioSpeedChartComponent } from "./cardio-speed-chart.component";
import { TotalRepsLineChartComponent } from "./total-reps-line-chart.component";
import { AggregationToggleComponent } from "./aggregation-toggle.component";
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
		AggregationToggleComponent,
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

	readonly volumeMode = signal<AggregationMode>("average");
	readonly repsMode = signal<AggregationMode>("average");

	readonly groupedOccurrencesVolume = computed<ExerciseOccurrence[]>(() =>
		this.groupingService.groupExercise(this.occurrences(), this.groupBy(), this.volumeMode()),
	);

	readonly groupedOccurrencesReps = computed<ExerciseOccurrence[]>(() =>
		this.groupingService.groupExercise(this.occurrences(), this.groupBy(), this.repsMode()),
	);

	readonly volumeAverageEqualsSum = computed<boolean>(() => {
		const avgResult = this.groupingService.groupExercise(this.occurrences(), this.groupBy(), "average");
		const sumResult = this.groupingService.groupExercise(this.occurrences(), this.groupBy(), "sum");
		return avgResult.length > 0 && avgResult.every((occ, i) => occ.volumeKg === sumResult[i].volumeKg);
	});

	readonly repsAverageEqualsSum = computed<boolean>(() => {
		const avgResult = this.groupingService.groupExercise(this.occurrences(), this.groupBy(), "average");
		const sumResult = this.groupingService.groupExercise(this.occurrences(), this.groupBy(), "sum");
		return avgResult.length > 0 && avgResult.every((occ, i) => occ.totalReps === sumResult[i].totalReps);
	});

	readonly groupedOccurrencesWeight = computed<ExerciseOccurrence[]>(() =>
		this.groupingService.groupExercise(this.occurrences(), this.groupBy(), "average"),
	);

	readonly groupedCardioOccurrences = computed<CardioOccurrence[]>(() =>
		this.groupingService.groupCardio(this.cardioOccurrences(), this.groupBy()),
	);

	constructor() {
		effect(() => {
			if (this.groupBy() === "session") {
				this.volumeMode.set("average");
				this.repsMode.set("average");
			}
		});
	}
}
