import { Injectable, inject, signal } from "@angular/core";
import { CardioOccurrence, ExerciseOccurrence } from "../shared/models";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { computePyramidWeightedAverage } from "../shared/utils";

@Injectable({ providedIn: "root" })
export class ExerciseStatsService {
	private readonly sessionRepository = inject(SESSION_REPOSITORY);
	private readonly exerciseRepository = inject(EXERCISE_REPOSITORY);

	private readonly _occurrences = signal<ExerciseOccurrence[]>([]);
	readonly occurrences = this._occurrences.asReadonly();

	private readonly _cardioOccurrences = signal<CardioOccurrence[]>([]);
	readonly cardioOccurrences = this._cardioOccurrences.asReadonly();

	async loadForExercise(exerciseName: string): Promise<void> {
		const [sessions, exercises] = await Promise.all([
			this.sessionRepository.getAll(),
			this.exerciseRepository.getAll(),
		]);

		const sessionDateMap = new Map<string, Date>(sessions.map((s) => [s.id, s.date]));

		const matchingExercises = exercises.filter((e) => e.name === exerciseName && e.status === "validated");

		const isCardioExercise = matchingExercises.some((e) => e.isCardio);

		if (isCardioExercise) {
			const cardioOccurrences: CardioOccurrence[] = matchingExercises
				.map((e) => ({
					date: sessionDateMap.get(e.sessionId) ?? new Date(0),
					durationSeconds: e.durationSeconds,
					distanceKm: e.distanceKm ?? null,
				}))
				.sort((a, b) => a.date.getTime() - b.date.getTime());

			this._cardioOccurrences.set(cardioOccurrences);
			this._occurrences.set([]);
			return;
		}

		const occurrences: ExerciseOccurrence[] = matchingExercises
			.map((e) => {
				const isPyramid = e.isPyramid && e.pyramidSets.length > 0;
				const totalReps = isPyramid
					? e.pyramidSets.reduce((sum, s) => sum + s.reps, 0)
					: e.sets * e.reps;
				const weightKg = isPyramid
					? computePyramidWeightedAverage(e.pyramidSets)
					: e.weightKg;
				const volumeKg = isPyramid
					? e.pyramidSets.reduce((sum, s) => sum + s.reps * s.weightKg, 0)
					: e.weightKg * e.sets * e.reps;
				const setBreakdown = isPyramid
					? [...e.pyramidSets]
					: Array.from({ length: e.sets }, () => ({ weightKg: e.weightKg, reps: e.reps }));
				return {
					exerciseId: e.id,
					sessionId: e.sessionId,
					date: sessionDateMap.get(e.sessionId) ?? new Date(0),
					name: e.name,
					weightKg,
					sets: e.sets,
					reps: e.reps,
					breakDurationSeconds: e.breakDurationSeconds,
					volumeKg,
					status: e.status,
					rating: e.rating ?? null,
					comment: e.comment ?? null,
					totalReps,
					setBreakdown,
				};
			})
			.sort((a, b) => b.date.getTime() - a.date.getTime());

		this._occurrences.set(occurrences);
		this._cardioOccurrences.set([]);
	}
}
