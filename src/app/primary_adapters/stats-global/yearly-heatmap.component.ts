import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { YearlyHeatmapRow, YearlyHeatmapCell } from "../../core_logic/stats-global/stats.service";

@Component({
	selector: "app-yearly-heatmap",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./yearly-heatmap.component.html",
	styleUrl: "./yearly-heatmap.component.scss",
})
export class YearlyHeatmapComponent {
	data = input<YearlyHeatmapRow[]>([]);

	getCellClass(cell: YearlyHeatmapCell): string {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const isToday = cell.date.getTime() === today.getTime();
		if (isToday) {
			if (cell.hasSession) return "yhm-cell done today";
			return "yhm-cell today";
		}
		if (cell.hasSession) return "yhm-cell done";
		return "yhm-cell empty";
	}
}
