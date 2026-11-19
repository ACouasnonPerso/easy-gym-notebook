import { Injectable, inject } from "@angular/core";
import { ExerciseService } from "../../core_logic/session-detail/exercise.service";
import { SessionExerciseEffectsService } from "../../core_logic/session-detail/session-exercise-effects.service";
import { copyExercisesToSession } from "../../core_logic/session/copy-exercises";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";

@Injectable({ providedIn: "root" })
export class ApplySessionTemplateUseCase {
	private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);
	private readonly exerciseService = inject(ExerciseService);
	private readonly sessionExerciseEffects = inject(SessionExerciseEffectsService);

	async execute(targetSessionId: string, sourceSessionId: string): Promise<void> {
		const sourceExercises = await this.exerciseRepo.getBySessionId(sourceSessionId);
		const doneExercises = sourceExercises.filter((e) => e.status === "validated");
		const copies = copyExercisesToSession(doneExercises, targetSessionId);
		if (copies.length === 0) return;

		const sessionWasEmpty = this.exerciseService.exercises().length === 0;
		await this.exerciseService.addMany(copies);
		await this.sessionExerciseEffects.afterExercisesAdded(copies, sessionWasEmpty);
	}
}
