import { Injectable, inject } from "@angular/core";
import { Exercise } from "../shared/models";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";

@Injectable({ providedIn: "root" })
export class AutocompleteService {
	private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);

	async getSuggestions(prefix: string): Promise<string[]> {
		if (!prefix.trim()) return [];
		const all = await this.exerciseRepo.getAll();
		const normalizedPrefix = this._normalize(prefix);
		const seen = new Set<string>();
		const suggestions: string[] = [];
		for (const exercise of all) {
			const normalizedName = this._normalize(exercise.name);
			if (!normalizedName.includes(normalizedPrefix) || seen.has(normalizedName)) continue;
			seen.add(normalizedName);
			suggestions.push(exercise.name);
			if (suggestions.length === 8) break;
		}
		return suggestions;
	}

	private _normalize(text: string): string {
		return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
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
