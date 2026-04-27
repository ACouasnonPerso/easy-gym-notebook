export enum MuscleGroup {
	Chest = "Chest",
	Back = "Back",
	Shoulders = "Shoulders",
	Biceps = "Biceps",
	Triceps = "Triceps",
	Forearms = "Forearms",
	Abs = "Abs",
	Quads = "Quads",
	Hamstrings = "Hamstrings",
	Glutes = "Glutes",
	Calves = "Calves",
	Traps = "Traps",
	Adductors = "Adductors",
	Abductors = "Abductors",
	LowerBack = "LowerBack",
}

export type SessionStatus = "active" | "completed";
export type ExerciseStatus = "pending" | "validated" | "cancelled";

export interface Session {
	id: string;
	date: Date;
	status: SessionStatus;
	durationSeconds: number;
	muscleGroup: MuscleGroup | null;
	exercises: Exercise[];
}

export interface PyramidSet {
	weightKg: number;
	reps: number;
}

export interface Exercise {
	id: string;
	sessionId: string;
	name: string;
	muscleGroup: MuscleGroup | null;
	muscleGroups: MuscleGroup[];
	weightKg: number;
	sets: number;
	reps: number;
	breakDurationSeconds: number;
	status: ExerciseStatus;
	isCardio: boolean;
	durationSeconds: number;
	distanceKm: number | null;
	isPyramid: boolean;
	pyramidSets: PyramidSet[];
	rating: number | null;
	comment: string | null;
}

export interface ExerciseOccurrence {
	exerciseId: string;
	sessionId: string;
	date: Date;
	name: string;
	weightKg: number;
	sets: number;
	reps: number;
	breakDurationSeconds: number;
	volumeKg: number;
	status: ExerciseStatus;
	rating: number | null;
	comment: string | null;
	totalReps?: number;
	setBreakdown: PyramidSet[];
}

export interface RawSession {
	id: string;
	date: string;
	status: SessionStatus;
	durationSeconds: number;
	muscleGroup: MuscleGroup | null;
}

export interface RawExercise {
	id: string;
	sessionId: string;
	name: string;
	muscleGroup: MuscleGroup | null;
	weightKg: number;
	sets: number;
	reps: number;
	breakDurationSeconds: number;
	status: ExerciseStatus;
	isCardio: boolean;
	durationSeconds: number;
	distanceKm: number | null;
	isPyramid?: boolean;
	pyramidSets?: PyramidSet[];
	rating?: number | null;
	comment?: string | null;
}

export interface CardioOccurrence {
	date: Date;
	durationSeconds: number;
	distanceKm: number | null;
}

export interface ImportPayload {
	sessions: RawSession[];
	exercises: RawExercise[];
}

export interface ImportResult {
	valid: boolean;
	sessionCount?: number;
	exerciseCount?: number;
	error?: string;
}

export interface ExercisePhoto {
	exerciseName: string;
	dataUrl: string;
	capturedAt: Date;
}
