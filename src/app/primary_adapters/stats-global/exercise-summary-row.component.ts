import { Component, ChangeDetectionStrategy, input, output, inject } from "@angular/core";
import { NgStyle } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { MuscleGroup } from "../../core_logic/shared/models";
import { muscleGroupChipStyle } from "../../core_logic/shared/muscle-group-colors";
import { formatSummaryDuration } from "../../core_logic/shared/utils";
import { WeightDisplayPipe } from "../../core_logic/mass-unit/weight-display.pipe";
import { DistanceDisplayPipe } from "../../core_logic/mass-unit/distance-display.pipe";

@Component({
	selector: "app-exercise-summary-row",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule, NgStyle, WeightDisplayPipe],
	providers: [WeightDisplayPipe, DistanceDisplayPipe],
	templateUrl: "./exercise-summary-row.component.html",
	styleUrl: "./exercise-summary-row.component.scss",
})
export class ExerciseSummaryRowComponent {
	private readonly weightDisplay = inject(WeightDisplayPipe);
	private readonly distanceDisplay = inject(DistanceDisplayPipe);
	exerciseName = input<string>("");
	maxWeightKg = input<number>(0);
	totalVolumeKg = input<number>(0);
	occurrenceCount = input<number>(0);
	isCardio = input<boolean>(false);
	totalDurationSeconds = input<number>(0);
	totalDistanceKm = input<number | null>(null);
	muscleGroups = input<MuscleGroup[]>([]);

	selected = output<string>();

	formatVolume(kg: number): string {
		if (kg >= 1000) return this.weightDisplay.transform(kg / 1000, "t");
		return this.weightDisplay.transform(Math.round(kg), "kg");
	}

	formatDuration(seconds: number): string {
		return formatSummaryDuration(seconds);
	}

	formatDistance(km: number | null): string {
		if (km === null) return "–";
		return this.distanceDisplay.transform(km, "km");
	}

	tagStyle(muscle: MuscleGroup): Record<string, string> {
		return muscleGroupChipStyle(muscle);
	}
}
