import { Exercise, PyramidSet } from "./models";

export function computePyramidWeightedAverage(sets: PyramidSet[]): number {
	const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
	if (totalReps === 0) return 0;
	const weightedSum = sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
	return weightedSum / totalReps;
}

export function computeVolume(exercise: Exercise): number {
	if (exercise.isPyramid && exercise.pyramidSets.length > 0) {
		return exercise.pyramidSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
	}
	return exercise.weightKg * exercise.sets * exercise.reps;
}

export function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatSummaryDuration(totalSeconds: number): string {
	const totalMinutes = Math.floor(totalSeconds / 60);
	const totalHours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (totalHours >= 24) {
		const days = Math.floor(totalHours / 24);
		const hours = totalHours % 24;
		return `${days}d${hours}h${minutes.toString().padStart(2, "0")}`;
	}

	if (totalHours === 0) return `${minutes}min`;
	if (minutes === 0) return `${totalHours}h`;
	return `${totalHours}h${minutes}`;
}

export function generateRange(min: number, max: number, step: number): number[] {
	const result: number[] = [];
	for (let v = min; v <= max; v = Math.round((v + step) * 10) / 10) result.push(v);
	return result;
}
