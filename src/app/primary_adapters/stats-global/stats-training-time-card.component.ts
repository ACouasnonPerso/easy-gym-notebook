import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { TrainingTimeBarChartComponent, SessionDurationEntry, BarChartMode } from "./training-time-bar-chart.component";

@Component({
	selector: "app-stats-training-time-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TrainingTimeBarChartComponent, TranslateModule],
	templateUrl: "./stats-training-time-card.component.html",
	styleUrl: "./stats-global.component.scss",
})
export class StatsTrainingTimeCardComponent {
	sessions = input<SessionDurationEntry[]>([]);
	mode = input<BarChartMode>("day");
}
