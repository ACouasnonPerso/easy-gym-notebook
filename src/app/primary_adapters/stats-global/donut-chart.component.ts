import { Component, ChangeDetectionStrategy, input, computed, signal, inject } from "@angular/core";
import { MuscleGroup } from "../../core_logic/shared/models";
import { TranslateModule } from "@ngx-translate/core";
import { MUSCLE_GROUP_COLORS } from "../../core_logic/shared/muscle-group-colors";
import { MuscleGroupDetail } from "../../core_logic/stats-global/stats.service";
import { WeightDisplayPipe } from "../../core_logic/mass-unit/weight-display.pipe";

const RADIUS = 55;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface DonutSegment {
	group: MuscleGroup;
	percentage: number;
	color: string;
	dashLen: number;
	dashOffset: number;
}

@Component({
	selector: "app-donut-chart",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	providers: [WeightDisplayPipe],
	templateUrl: "./donut-chart.component.html",
	styleUrl: "./donut-chart.component.scss",
})
export class DonutChartComponent {
	distribution = input<Map<MuscleGroup, number>>(new Map());
	details = input<Map<MuscleGroup, MuscleGroupDetail>>(new Map());

	private readonly weightDisplay = inject(WeightDisplayPipe);

	readonly selectedGroup = signal<MuscleGroup | null>(null);

	formatLoad(kg: number): string {
		if (kg >= 1000) return this.weightDisplay.transform(kg / 1000, "t");
		return this.weightDisplay.transform(Math.round(kg), "kg");
	}

	onSegmentClick(group: MuscleGroup): void {
		this.selectedGroup.update((current) => (current === group ? null : group));
	}

	isLegendItemDimmed(group: MuscleGroup): boolean {
		const selected = this.selectedGroup();
		return selected !== null && selected !== group;
	}

	readonly radius = RADIUS;
	readonly circumference = CIRCUMFERENCE;
	readonly svgSize = 150;
	readonly center = 75;

	readonly totalLoad = computed((): string => {
		const totalKg = Math.round(Array.from(this.details().values()).reduce((sum, d) => sum + d.totalLoadKg, 0));
		if (totalKg >= 1000) return this.weightDisplay.transform(Math.round(totalKg / 1000), "t");
		return this.weightDisplay.transform(totalKg, "kg");
	});

	readonly segments = computed((): DonutSegment[] => {
		const dist = this.distribution();
		const result: DonutSegment[] = [];
		let previousLength = 0;

		for (const [group, percentage] of dist) {
			if (percentage <= 0) continue;
			const dashLen = (percentage / 100) * CIRCUMFERENCE;
			const dashOffset = -previousLength;
			result.push({ group, percentage, color: MUSCLE_GROUP_COLORS[group].color, dashLen, dashOffset });
			previousLength += dashLen;
		}

		return result;
	});
}
