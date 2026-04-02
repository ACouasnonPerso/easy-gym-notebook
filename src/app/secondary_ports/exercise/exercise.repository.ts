import { Injectable, inject } from "@angular/core";
import { IExerciseRepository } from "./exercise.repository.interface";
import { Exercise, RawExercise } from "../../core_logic/shared/models";
import { ExerciseMapper } from "../../secondary_adapters/exercise/exercise.mapper";

const STORAGE_KEY = "egn_exercises";

@Injectable()
export class ExerciseRepository implements IExerciseRepository {
	private readonly mapper = inject(ExerciseMapper);

	async getAll(): Promise<Exercise[]> {
		const raw = this.readFromStorage();
		return raw.map((r) => this.mapper.toDomain(r));
	}

	async getBySessionId(sessionId: string): Promise<Exercise[]> {
		const all = await this.getAll();
		return all.filter((e) => e.sessionId === sessionId);
	}

	async getById(id: string): Promise<Exercise | null> {
		const all = await this.getAll();
		return all.find((e) => e.id === id) ?? null;
	}

	async save(exercise: Exercise): Promise<void> {
		const all = this.readFromStorage();
		const index = all.findIndex((e) => e.id === exercise.id);
		const raw = this.mapper.toStorage(exercise);
		if (index === -1) all.push(raw);
		else all[index] = raw;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
	}

	async delete(id: string): Promise<void> {
		const all = this.readFromStorage().filter((e) => e.id !== id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
	}

	private readFromStorage(): RawExercise[] {
		try {
			return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as RawExercise[];
		} catch {
			return [];
		}
	}
}
