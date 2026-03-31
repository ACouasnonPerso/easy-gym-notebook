import { Component, ChangeDetectionStrategy, input, output } from "@angular/core";
import { ExerciseOccurrence, CardioOccurrence } from "../../core_logic/shared/models";
import { ChartType } from "./chart-selection.service";
import { VolumeLineChartComponent } from "./volume-line-chart.component";
import { WeightLineChartComponent } from "./weight-line-chart.component";
import { CardioTimeChartComponent } from "./cardio-time-chart.component";
import { CardioDistanceChartComponent } from "./cardio-distance-chart.component";
import { CardioPaceChartComponent } from "./cardio-pace-chart.component";
import { CardioSpeedChartComponent } from "./cardio-speed-chart.component";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-stats-exercise-chart-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		VolumeLineChartComponent,
		WeightLineChartComponent,
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
	readonly isCardio = input.required<boolean>();
	readonly occurrences = input.required<ExerciseOccurrence[]>();
	readonly cardioOccurrences = input.required<CardioOccurrence[]>();
	readonly selectedChart = input.required<ChartType>();
	readonly chartSelect = output<ChartType>();
}
