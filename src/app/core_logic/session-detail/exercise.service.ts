import { Injectable, inject, signal } from "@angular/core";
import { Exercise } from "../shared/models";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";

@Injectable({ providedIn: "root" })
export class ExerciseService {
	private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);

	private readonly _exercises = signal<Exercise[]>([]);
	readonly exercises = this._exercises.asReadonly();

	async loadBySession(sessionId: string): Promise<void> {
		const exercises = await this.exerciseRepo.getBySessionId(sessionId);
		this._exercises.set(exercises);
	}

	async add(exercise: Exercise): Promise<void> {
		await this.exerciseRepo.save(exercise);
		this._exercises.update((list) => [...list, exercise]);
	}

	async update(exerciseId: string, changes: Partial<Exercise>): Promise<void> {
		const cached = this._exercises().find((e) => e.id === exerciseId);
		const exercise = cached ?? (await this.exerciseRepo.getById(exerciseId));
		if (!exercise) return;
		const updated = { ...exercise, ...changes };
		await this.exerciseRepo.save(updated);
		if (cached) {
			this._exercises.update((list) => list.map((e) => (e.id === exerciseId ? updated : e)));
		}
	}

	async delete(exerciseId: string): Promise<void> {
		await this.exerciseRepo.delete(exerciseId);
		this._exercises.update((list) => list.filter((e) => e.id !== exerciseId));
	}
}
