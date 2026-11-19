import { Exercise } from "../shared/models";

/** Copies exercises into another session as fresh, not yet done exercises. */
export function copyExercisesToSession(exercises: Exercise[], sessionId: string): Exercise[] {
	return exercises.map((e) => ({
		...e,
		id: crypto.randomUUID(),
		sessionId,
		status: "pending",
		rating: null,
		comment: null,
	}));
}
