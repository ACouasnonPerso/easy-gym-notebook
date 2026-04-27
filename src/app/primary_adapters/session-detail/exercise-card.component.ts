import { Component, ChangeDetectionStrategy, input, output, computed, inject } from "@angular/core";
import { NgStyle } from "@angular/common";
import { Exercise, MuscleGroup } from "../../core_logic/shared/models";
import { ExerciseExpandedComponent } from "./exercise-expanded.component";
import { PhotoThumbnailComponent } from "../exercise-photo/photo-thumbnail.component";
import { TranslateModule } from "@ngx-translate/core";
import { HapticService } from "../../core_logic/shared/haptic.service";
import { muscleGroupChipStyle } from "../../core_logic/shared/muscle-group-colors";
import { WeightDisplayPipe } from "../../core_logic/mass-unit/weight-display.pipe";
import { DistanceDisplayPipe } from "../../core_logic/mass-unit/distance-display.pipe";
import { GetExercisePhotoUseCase } from "../../primary_ports/exercise-photo/get-exercise-photo.usecase";

function formatDurationMinutes(seconds: number): string {
	return Math.floor(seconds / 60).toString();
}

function formatBreakDuration(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

@Component({
	selector: "app-exercise-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [ExerciseExpandedComponent, PhotoThumbnailComponent, NgStyle, TranslateModule, WeightDisplayPipe, DistanceDisplayPipe],
	templateUrl: "./exercise-card.component.html",
	styleUrl: "./exercise-card.component.scss",
})
export class ExerciseCardComponent {
	private readonly haptic = inject(HapticService);
	private readonly getPhoto = inject(GetExercisePhotoUseCase);
	readonly exercise = input.required<Exercise>();
	readonly isExpanded = input<boolean>(false);
	readonly toggleExpand = output<void>();

	readonly exerciseUpdate = output<Partial<Exercise>>();
	readonly exerciseValidate = output<void>();
	readonly exerciseCancel = output<void>();
	readonly exerciseDelete = output<void>();
	readonly openPhoto = output<string>();
	readonly openChrono = output<void>();
	readonly openStats = output<void>();
	readonly openRating = output<void>();
	readonly openComment = output<void>();

	readonly hasPhoto = computed(() => !!this.getPhoto.photoFor(this.exercise().name));
	readonly isValidated = computed(() => this.exercise().status === "validated");
	readonly isActiveStatus = computed(
		() => this.exercise().status === "pending" || this.exercise().status === "cancelled"
	);
	readonly breakLabel = computed(() => formatBreakDuration(this.exercise().breakDurationSeconds));
	readonly isCardio = computed(() => this.exercise().isCardio);
	readonly durationMinutes = computed(() => formatDurationMinutes(this.exercise().durationSeconds));
	readonly isPyramid = computed(() => this.exercise().isPyramid);
	readonly hasComment = computed(() => {
		const c = this.exercise().comment;
		return c !== null && c !== undefined && c.length > 0;
	});
	readonly avgPyramidWeight = computed(() => {
		const sets = this.exercise().pyramidSets;
		if (!sets || sets.length === 0) return null;
		return Math.round(sets.reduce((s, r) => s + r.weightKg, 0) / sets.length);
	});
	readonly avgPyramidReps = computed(() => {
		const sets = this.exercise().pyramidSets;
		if (!sets || sets.length === 0) return null;
		return Math.round(sets.reduce((s, r) => s + r.reps, 0) / sets.length);
	});

	tagStyle(muscle: MuscleGroup | "Cardio" | null): Record<string, string> {
		if (!muscle) return {};
		if (muscle === "Cardio")
			return { color: "#06b6d4", background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)" };
		return muscleGroupChipStyle(muscle);
	}

	onCardClick(): void {
		this.haptic.vibrate();
		this.toggleExpand.emit();
	}

	onCheckboxClick(): void {
		this.haptic.vibrate();
		if (this.isValidated()) this.exerciseCancel.emit();
		else this.exerciseValidate.emit();
	}
}
