import { Injectable, inject, signal } from "@angular/core";
import { Session } from "../shared/models";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";

@Injectable({ providedIn: "root" })
export class SessionService {
	private readonly sessionRepo = inject(SESSION_REPOSITORY);
	private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);

	readonly _sessions = signal<Session[]>([]);
	readonly currentSession = signal<Session | null>(null);

	async loadAll(): Promise<void> {
		const sessions = await this.sessionRepo.getAll();
		const sessionsWithExercises = await Promise.all(
			sessions.map(async (session) => {
				const exercises = await this.exerciseRepo.getBySessionId(session.id);
				return { ...session, exercises };
			})
		);
		const sorted = sessionsWithExercises.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		this._sessions.set(sorted);
	}

	async create(session: Session): Promise<void> {
		await this.sessionRepo.save(session);
		await this.loadAll();
	}

	async delete(sessionId: string): Promise<void> {
		const exercises = await this.exerciseRepo.getBySessionId(sessionId);
		await Promise.all(exercises.map((e) => this.exerciseRepo.delete(e.id)));
		await this.sessionRepo.delete(sessionId);
		await this.loadAll();
	}

	async loadById(id: string): Promise<void> {
		const session = await this.sessionRepo.getById(id);
		if (!session) {
			this.currentSession.set(null);
			return;
		}
		const exercises = await this.exerciseRepo.getBySessionId(id);
		this.currentSession.set({ ...session, exercises });
	}

	async updateCurrentSession(changes: Partial<Session>): Promise<void> {
		const current = this.currentSession();
		if (!current) return;
		const updated = { ...current, ...changes };
		this.currentSession.set(updated);
		await this.sessionRepo.save(updated);
	}

	removeExerciseFromSessions(exerciseId: string): void {
		this._sessions.update((sessions) =>
			sessions.map((session) => ({
				...session,
				exercises: session.exercises.filter((e) => e.id !== exerciseId),
			}))
		);
	}
}
