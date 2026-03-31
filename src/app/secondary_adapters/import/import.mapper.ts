import { Injectable } from "@angular/core";
import {
	RawSession,
	RawExercise,
	MuscleGroup,
	ExerciseStatus,
	SessionStatus,
	PyramidSet,
} from "../../core_logic/shared/models";

@Injectable()
export class ImportMapper {
	mapSession(raw: Record<string, unknown>): RawSession | null {
		if (
			typeof raw["id"] !== "string" ||
			typeof raw["date"] !== "string" ||
			typeof raw["status"] !== "string" ||
			typeof raw["durationSeconds"] !== "number"
		) {
			return null;
		}

		return {
			id: raw["id"],
			date: raw["date"],
			status: raw["status"] as SessionStatus,
			durationSeconds: raw["durationSeconds"],
			muscleGroup: (raw["muscleGroup"] as MuscleGroup) ?? null,
		};
	}

	mapExercise(raw: Record<string, unknown>): RawExercise | null {
		if (
			typeof raw["id"] !== "string" ||
			typeof raw["sessionId"] !== "string" ||
			typeof raw["name"] !== "string" ||
			typeof raw["weightKg"] !== "number" ||
			typeof raw["sets"] !== "number" ||
			typeof raw["reps"] !== "number" ||
			typeof raw["breakDurationSeconds"] !== "number" ||
			typeof raw["status"] !== "string"
		) {
			return null;
		}

		return {
			id: raw["id"],
			sessionId: raw["sessionId"],
			name: raw["name"],
			muscleGroup: (raw["muscleGroup"] as MuscleGroup) ?? null,
			weightKg: raw["weightKg"],
			sets: raw["sets"],
			reps: raw["reps"],
			breakDurationSeconds: raw["breakDurationSeconds"],
			status: raw["status"] as ExerciseStatus,
			isCardio: typeof raw["isCardio"] === "boolean" ? raw["isCardio"] : false,
			durationSeconds: typeof raw["durationSeconds"] === "number" ? raw["durationSeconds"] : 0,
			distanceKm: typeof raw["distanceKm"] === "number" ? raw["distanceKm"] : null,
			isPyramid: typeof raw["isPyramid"] === "boolean" ? raw["isPyramid"] : false,
			pyramidSets: Array.isArray(raw["pyramidSets"]) ? (raw["pyramidSets"] as PyramidSet[]) : [],
		};
	}
}
