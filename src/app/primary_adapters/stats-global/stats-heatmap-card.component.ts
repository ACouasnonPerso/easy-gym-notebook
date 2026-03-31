import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { HeatmapComponent, HeatmapCell } from "./heatmap.component";

@Component({
	selector: "app-stats-heatmap-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [HeatmapComponent, TranslateModule],
	template: `
		<div class="stats-card">
			<div class="stats-card-title">{{ "statsGlobal.trainingRecurrences" | translate }}</div>
			<div class="divider"></div>
			<div style="height:12px"></div>
			<app-heatmap [data]="data()" />
		</div>
	`,
	styleUrl: "./stats-global.component.scss",
})
export class StatsHeatmapCardComponent {
	data = input<HeatmapCell[]>([]);
}
