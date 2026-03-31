import { Injectable, inject } from "@angular/core";
import { ExerciseService } from "../../core_logic/session-detail/exercise.service";
import { SessionService } from "../../core_logic/session/session.service";

@Injectable({ providedIn: "root" })
export class DeleteExerciseUseCase {
	private readonly exerciseService = inject(ExerciseService);
	private readonly sessionService = inject(SessionService);

	execute(exerciseId: string): void {
		this.exerciseService.delete(exerciseId);
		this.sessionService.removeExerciseFromSessions(exerciseId);
	}
}
