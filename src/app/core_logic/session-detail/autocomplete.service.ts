import { Injectable, inject } from "@angular/core";
import { Exercise } from "../shared/models";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { normalizeExerciseName } from "../shared/utils";

@Injectable({ providedIn: "root" })
export class AutocompleteService {
	private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);

	async getSuggestions(prefix: string): Promise<string[]> {
		if (!prefix.trim()) return [];
		const all = await this.exerciseRepo.getAll();
		const tokens = normalizeExerciseName(prefix).split(/\s+/).filter(Boolean);
		const seen = new Set<string>();
		const scored: { name: string; score: number }[] = [];
		for (const exercise of all) {
			const normalizedName = normalizeExerciseName(exercise.name);
			if (seen.has(normalizedName)) continue;
			const score = tokens.filter((token) => normalizedName.includes(token)).length;
			if (score === 0) continue;
			seen.add(normalizedName);
			scored.push({ name: exercise.name, score });
		}
		scored.sort((a, b) => b.score - a.score);
		return scored.slice(0, 8).map((e) => e.name);
	}

	async getDefaultsByExactName(name: string): Promise<Partial<Exercise> | null> {
		const all = await this.exerciseRepo.getAll();
		const lowerName = name.toLowerCase();
		const matches = all.filter((e) => e.name.toLowerCase() === lowerName);
		if (matches.length === 0) return null;
		const last = matches[matches.length - 1];
		return {
			weightKg: last.weightKg,
			sets: last.sets,
			reps: last.reps,
			breakDurationSeconds: last.breakDurationSeconds,
			isPyramid: last.isPyramid,
			pyramidSets: last.pyramidSets,
		};
	}

	async getLastParams(exerciseName: string): Promise<Partial<Exercise> | null> {
		return this.getDefaultsByExactName(exerciseName);
	}
}
