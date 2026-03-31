import { Injectable, inject } from "@angular/core";
import { Exercise } from "../../core_logic/shared/models";
import { ExerciseService } from "../../core_logic/session-detail/exercise.service";
import { MuscleGroupDetectorService } from "../../core_logic/shared/muscle-group-detector.service";

@Injectable({ providedIn: "root" })
export class UpdateExerciseUseCase {
	private readonly exerciseService = inject(ExerciseService);
	private readonly muscleDetector = inject(MuscleGroupDetectorService);

	execute(exerciseId: string, changes: Partial<Exercise>): void {
		const currentExercise = this.exerciseService.exercises().find((e) => e.id === exerciseId);
		const isCardio = changes.isCardio ?? currentExercise?.isCardio ?? false;

		if (changes.name !== undefined && !isCardio) {
			const name = changes.name.slice(0, 60);
			const { muscleGroups } = this.muscleDetector.detect(name);
			changes = { ...changes, name, muscleGroup: muscleGroups[0] ?? null, muscleGroups };
		} else if (changes.name !== undefined && isCardio) {
			const name = changes.name.slice(0, 60);
			changes = { ...changes, name, muscleGroup: null, muscleGroups: [] };
		}

		this.exerciseService.update(exerciseId, changes);
	}
}
