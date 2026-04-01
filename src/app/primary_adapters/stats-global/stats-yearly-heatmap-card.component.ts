import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { YearlyHeatmapComponent } from "./yearly-heatmap.component";
import { YearlyHeatmapRow } from "../../core_logic/stats-global/stats.service";

@Component({
	selector: "app-stats-yearly-heatmap-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [YearlyHeatmapComponent, TranslateModule],
	templateUrl: "./stats-yearly-heatmap-card.component.html",
	styleUrl: "./stats-global.component.scss",
})
export class StatsYearlyHeatmapCardComponent {
	data = input<YearlyHeatmapRow[]>([]);
}
