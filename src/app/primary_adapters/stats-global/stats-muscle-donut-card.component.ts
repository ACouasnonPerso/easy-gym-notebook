import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { DonutChartComponent } from "./donut-chart.component";
import { MuscleGroup } from "../../core_logic/shared/models";

@Component({
	selector: "app-stats-muscle-donut-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [DonutChartComponent, TranslateModule],
	template: `
		@if (distribution().size > 0) {
			<div class="stats-card">
				<div class="stats-card-title">{{ "statsGlobal.workedMuscles" | translate }}</div>
				<div class="divider"></div>
				<div style="height:12px"></div>
				<app-donut-chart [distribution]="distribution()" />
			</div>
		}
	`,
	styleUrl: "./stats-global.component.scss",
})
export class StatsMuscleDonutCardComponent {
	distribution = input<Map<MuscleGroup, number>>(new Map());
}
