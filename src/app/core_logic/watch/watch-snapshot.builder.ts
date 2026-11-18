import { Exercise, MuscleGroup, Session } from "../shared/models";
import { MUSCLE_GROUP_COLORS } from "../shared/muscle-group-colors";
import { RATING_OPTIONS, ratingDisplayValue } from "../shared/rating-options";
import { MassUnit } from "../mass-unit/mass-unit.service";
import { formatWeightDisplay } from "../mass-unit/weight-display.pipe";
import { WATCH_PROTOCOL_VERSION, WatchExercise, WatchSessionPayload, WatchSnapshot } from "./watch.models";

/** A session older than this is considered abandoned and is not pushed to the watch. */
export const WATCH_ACTIVE_SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const DEFAULT_BREAK_SECONDS = 90;
const CARDIO_COLOR = "#3b82f6";
const ORANGE = "#f5a623";

export interface WatchSnapshotContext {
	translate: (key: string) => string;
	labels: Record<string, string>;
	massUnit: MassUnit;
	appliedActionIds: string[];
}

export function findWatchActiveSession(sessions: Session[], now: Date): Session | null {
	const candidates = sessions
		.filter((s) => s.status === "active")
		.filter((s) => now.getTime() - new Date(s.date).getTime() <= WATCH_ACTIVE_SESSION_MAX_AGE_MS)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	return candidates[0] ?? null;
}

export function buildWatchSnapshot(
	session: Session | null,
	exercises: Exercise[],
	ctx: WatchSnapshotContext
): WatchSnapshot {
	return {
		version: WATCH_PROTOCOL_VERSION,
		session: session ? buildSessionPayload(session, exercises, ctx) : null,
		ratingOptions: RATING_OPTIONS.map((option) => ({
			value: option.value,
			display: ratingDisplayValue(option),
			label: ctx.translate(option.label),
		})),
		labels: ctx.labels,
		appliedActionIds: ctx.appliedActionIds,
	};
}

function buildSessionPayload(session: Session, exercises: Exercise[], ctx: WatchSnapshotContext): WatchSessionPayload {
	const visible = exercises.filter((e) => e.sessionId === session.id && e.status !== "cancelled");
	return {
		id: session.id,
		title: sessionTitle(session, visible, ctx),
		startedAt: new Date(session.date).toISOString(),
		exercises: visible.map((e) => toWatchExercise(e, ctx)),
	};
}

function sessionTitle(session: Session, exercises: Exercise[], ctx: WatchSnapshotContext): string {
	const group = session.muscleGroup ?? firstMuscleGroup(exercises);
	if (group) return ctx.translate(`muscleGroups.${group}`);
	return ctx.labels["sessionTitle"] ?? "";
}

function firstMuscleGroup(exercises: Exercise[]): MuscleGroup | null {
	for (const e of exercises) {
		const group = e.muscleGroups[0] ?? e.muscleGroup;
		if (group && !e.isCardio) return group;
	}
	return null;
}

function toWatchExercise(exercise: Exercise, ctx: WatchSnapshotContext): WatchExercise {
	const group = exercise.muscleGroups[0] ?? exercise.muscleGroup;
	const isPyramid = exercise.isPyramid && exercise.pyramidSets.length > 0;
	return {
		id: exercise.id,
		name: exercise.name,
		muscleLabel: exercise.isCardio
			? ctx.translate("common.cardio")
			: group
				? ctx.translate(`muscleGroups.${group}`)
				: null,
		muscleColor: exercise.isCardio ? CARDIO_COLOR : group ? muscleColor(group) : null,
		sets: isPyramid ? exercise.pyramidSets.length : Math.max(1, exercise.sets),
		reps: isPyramid ? exercise.pyramidSets[0].reps : exercise.reps,
		loadLabel: loadLabel(exercise, isPyramid, ctx),
		isCardio: exercise.isCardio,
		breakDurationSeconds: exercise.breakDurationSeconds > 0 ? exercise.breakDurationSeconds : DEFAULT_BREAK_SECONDS,
		status: exercise.status === "validated" ? "validated" : "pending",
		rating: exercise.rating,
	};
}

function muscleColor(group: MuscleGroup): string {
	const color = MUSCLE_GROUP_COLORS[group]?.color ?? ORANGE;
	return color.startsWith("#") ? color : ORANGE;
}

function loadLabel(exercise: Exercise, isPyramid: boolean, ctx: WatchSnapshotContext): string {
	if (exercise.isCardio) {
		const minutes = `${Math.round(exercise.durationSeconds / 60)} ${ctx.translate("common.unitMin")}`;
		return exercise.distanceKm ? `${minutes} · ${exercise.distanceKm} km` : minutes;
	}
	const weight = isPyramid ? Math.max(...exercise.pyramidSets.map((s) => s.weightKg)) : exercise.weightKg;
	const formatted = formatWeightDisplay(weight, "kg", ctx.massUnit);
	return formatted || (ctx.labels["bodyweight"] ?? "");
}
