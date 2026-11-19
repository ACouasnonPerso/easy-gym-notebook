import { Injectable, inject } from "@angular/core";
import { Exercise } from "../shared/models";
import { SessionService } from "../session/session.service";
import { ExerciseService } from "./exercise.service";
import { SessionChronoService } from "../chrono/session-chrono.service";
import { AnalyticsService } from "../analytics/analytics.service";

/**
 * Session-level side effects of adding exercises to the current session.
 * Shared by every way of adding exercises (manual add, past session template) so they stay in sync.
 */
@Injectable({ providedIn: "root" })
export class SessionExerciseEffectsService {
	private readonly sessionService = inject(SessionService);
	private readonly exerciseService = inject(ExerciseService);
	private readonly sessionChronoService = inject(SessionChronoService);
	private readonly analyticsService = inject(AnalyticsService);

	async afterExercisesAdded(added: Exercise[], sessionWasEmpty: boolean): Promise<void> {
		if (added.length === 0) return;
		const session = this.sessionService.currentSession();

		const muscleGroup = added.find((e) => !e.isCardio && e.muscleGroup !== null)?.muscleGroup ?? null;
		if (muscleGroup !== null && session && !session.muscleGroup) {
			await this.sessionService.updateCurrentSession({ muscleGroup });
			const updatedSession = this.sessionService.currentSession();
			if (updatedSession) this.analyticsService.trackSessionStarted(updatedSession);
		}

		const cardioDuration = added.filter((e) => e.isCardio).reduce((sum, e) => sum + e.durationSeconds, 0);
		if (sessionWasEmpty && added[0].isCardio && cardioDuration > 0 && session) {
			await this.sessionService.updateCurrentSession({ durationSeconds: cardioDuration });
			if (session.status === "active") this.sessionChronoService.overrideElapsedForSession(session.id, cardioDuration);
		}

		const currentSession = this.sessionService.currentSession();
		if (currentSession) {
			const validatedNames = this.exerciseService
				.exercises()
				.filter((e) => e.status === "validated")
				.map((e) => e.name);
			this.analyticsService.trackSessionUpdated(currentSession, validatedNames);
		}
	}
}
