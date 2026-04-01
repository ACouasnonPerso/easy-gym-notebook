import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { DonutChartComponent } from "./donut-chart.component";
import { MuscleGroup } from "../../core_logic/shared/models";
import { MuscleGroupDetail } from "../../core_logic/stats-global/stats.service";

@Component({
	selector: "app-stats-muscle-donut-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [DonutChartComponent, TranslateModule],
	templateUrl: "./stats-muscle-donut-card.component.html",
	styleUrl: "./stats-global.component.scss",
})
export class StatsMuscleDonutCardComponent {
	distribution = input<Map<MuscleGroup, number>>(new Map());
	details = input<Map<MuscleGroup, MuscleGroupDetail>>(new Map());
}
