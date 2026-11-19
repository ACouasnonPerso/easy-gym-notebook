import { Injectable, inject } from "@angular/core";
import { Session } from "../../core_logic/shared/models";
import { SessionTemplateService, SessionType } from "../../core_logic/session-template/session-template.service";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";

@Injectable({ providedIn: "root" })
export class GetSessionTypesUseCase {
	private readonly sessionRepo = inject(SESSION_REPOSITORY);
	private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);
	private readonly templateService = inject(SessionTemplateService);

	async execute(currentSessionId: string): Promise<SessionType[]> {
		const [sessions, exercises] = await Promise.all([this.sessionRepo.getAll(), this.exerciseRepo.getAll()]);
		const exercisesBySession = new Map<string, Session["exercises"]>();
		for (const exercise of exercises) {
			const list = exercisesBySession.get(exercise.sessionId) ?? [];
			list.push(exercise);
			exercisesBySession.set(exercise.sessionId, list);
		}
		const sessionsWithExercises = sessions.map((s) => ({ ...s, exercises: exercisesBySession.get(s.id) ?? [] }));
		return this.templateService.buildSessionTypes(sessionsWithExercises, currentSessionId);
	}
}
