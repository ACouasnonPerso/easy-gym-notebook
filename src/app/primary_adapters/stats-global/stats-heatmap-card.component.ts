import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { HeatmapComponent, HeatmapCell } from "./heatmap.component";

@Component({
	selector: "app-stats-heatmap-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [HeatmapComponent, TranslateModule],
	templateUrl: "./stats-heatmap-card.component.html",
	styleUrl: "./stats-global.component.scss",
})
export class StatsHeatmapCardComponent {
	data = input<HeatmapCell[]>([]);
}
