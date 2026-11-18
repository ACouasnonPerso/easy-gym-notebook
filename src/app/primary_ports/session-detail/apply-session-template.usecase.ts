import { Injectable, inject } from "@angular/core";
import { Exercise } from "../../core_logic/shared/models";
import { ExerciseService } from "../../core_logic/session-detail/exercise.service";
import { SessionService } from "../../core_logic/session/session.service";
import { AnalyticsService } from "../../core_logic/analytics/analytics.service";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";

@Injectable({ providedIn: "root" })
export class ApplySessionTemplateUseCase {
	private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);
	private readonly exerciseService = inject(ExerciseService);
	private readonly sessionService = inject(SessionService);
	private readonly analyticsService = inject(AnalyticsService);

	async execute(targetSessionId: string, sourceSessionId: string): Promise<void> {
		const sourceExercises = await this.exerciseRepo.getBySessionId(sourceSessionId);
		const copies: Exercise[] = sourceExercises
			.filter((e) => e.status !== "cancelled")
			.map((e) => ({
				...e,
				id: crypto.randomUUID(),
				sessionId: targetSessionId,
				status: "pending",
				rating: null,
				comment: null,
			}));

		for (const exercise of copies) await this.exerciseService.add(exercise);

		const session = this.sessionService.currentSession();
		const muscleGroup = copies.find((e) => !e.isCardio && e.muscleGroup !== null)?.muscleGroup ?? null;
		if (session && session.id === targetSessionId && !session.muscleGroup && muscleGroup) {
			await this.sessionService.updateCurrentSession({ muscleGroup });
			const updated = this.sessionService.currentSession();
			if (updated) this.analyticsService.trackSessionStarted(updated);
		}
	}
}
