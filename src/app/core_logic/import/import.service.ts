import { Injectable, inject } from "@angular/core";
import { Session, Exercise, RawSession, RawExercise } from "../shared/models";
import { ImportMapper } from "../../secondary_adapters/import/import.mapper";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";

export interface ImportValidationResult {
	valid: boolean;
	sessionCount?: number;
	exerciseCount?: number;
	error?: string;
}

@Injectable()
export class ImportService {
	private readonly importMapper = inject(ImportMapper);
	private readonly sessionRepo = inject(SESSION_REPOSITORY);
	private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);

	private _pendingSessions: RawSession[] = [];
	private _pendingExercises: RawExercise[] = [];

	async validate(json: string): Promise<ImportValidationResult> {
		let parsed: unknown;
		try {
			parsed = JSON.parse(json);
		} catch {
			return { valid: false, error: "invalid_json" };
		}

		if (
			typeof parsed !== "object" ||
			parsed === null ||
			!Array.isArray((parsed as Record<string, unknown>)["sessions"])
		) {
			return { valid: false, error: "missing_sessions_array" };
		}

		if (!Array.isArray((parsed as Record<string, unknown>)["exercises"])) {
			return { valid: false, error: "missing_exercises_array" };
		}

		const rawObj = parsed as Record<string, unknown>;
		const sessionNodes = rawObj["sessions"] as Record<string, unknown>[];
		const exerciseNodes = rawObj["exercises"] as Record<string, unknown>[];

		const mappedSessions: RawSession[] = [];
		for (const node of sessionNodes) {
			const mapped = this.importMapper.mapSession(node);
			if (mapped === null) {
				return { valid: false, error: "invalid_session_entry" };
			}
			mappedSessions.push(mapped);
		}

		const mappedExercises: RawExercise[] = [];
		for (const node of exerciseNodes) {
			const mapped = this.importMapper.mapExercise(node);
			if (mapped === null) {
				return { valid: false, error: "invalid_exercise_entry" };
			}
			mappedExercises.push(mapped);
		}

		this._pendingSessions = mappedSessions;
		this._pendingExercises = mappedExercises;

		return {
			valid: true,
			sessionCount: mappedSessions.length,
			exerciseCount: mappedExercises.length,
		};
	}

	async persist(): Promise<void> {
		const existingSessions = await this.sessionRepo.getAll();
		const existingExercises = await this.exerciseRepo.getAll();

		const existingSessionIds = new Set(existingSessions.map((s) => s.id));
		const existingExerciseIds = new Set(existingExercises.map((e) => e.id));

		for (const rawSession of this._pendingSessions) {
			if (!existingSessionIds.has(rawSession.id)) {
				const session = this._rawSessionToSession(rawSession);
				await this.sessionRepo.save(session);
			}
		}

		for (const rawExercise of this._pendingExercises) {
			if (!existingExerciseIds.has(rawExercise.id)) {
				const exercise = this._rawExerciseToExercise(rawExercise);
				await this.exerciseRepo.save(exercise);
			}
		}
	}

	private _rawSessionToSession(raw: RawSession): Session {
		return {
			id: raw.id,
			date: new Date(raw.date),
			status: raw.status,
			durationSeconds: raw.durationSeconds,
			muscleGroup: raw.muscleGroup,
			exercises: [],
		};
	}

	private _rawExerciseToExercise(raw: RawExercise): Exercise {
		return {
			id: raw.id,
			sessionId: raw.sessionId,
			name: raw.name,
			muscleGroup: raw.muscleGroup,
			muscleGroups: raw.muscleGroup ? [raw.muscleGroup] : [],
			weightKg: raw.weightKg,
			sets: raw.sets,
			reps: raw.reps,
			breakDurationSeconds: raw.breakDurationSeconds,
			status: raw.status,
			isCardio: raw.isCardio ?? false,
			durationSeconds: raw.durationSeconds ?? 0,
			distanceKm: raw.distanceKm ?? null,
			isPyramid: raw.isPyramid ?? false,
			pyramidSets: raw.pyramidSets ?? [],
		};
	}
}
