import { Exercise, MuscleGroup, Session } from "../shared/models";
import { SessionTemplateService } from "./session-template.service";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: crypto.randomUUID(),
		sessionId: "s",
		name: "Curl",
		muscleGroup: MuscleGroup.Biceps,
		muscleGroups: [MuscleGroup.Biceps],
		weightKg: 20,
		sets: 4,
		reps: 10,
		breakDurationSeconds: 90,
		status: "validated",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		rating: null,
		comment: null,
		...overrides,
	};
}

function makeSession(id: string, date: string, exercises: Exercise[]): Session {
	return { id, date: new Date(date), status: "completed", durationSeconds: 3600, muscleGroup: null, exercises };
}

const curl = (o: Partial<Exercise> = {}) => makeExercise({ name: "Biceps curl barre en V", sets: 5, ...o });
const pushdown = (o: Partial<Exercise> = {}) =>
	makeExercise({ name: "Triceps poulie vers le bas", muscleGroup: MuscleGroup.Triceps, sets: 5, ...o });
const legExtension = (o: Partial<Exercise> = {}) =>
	makeExercise({ name: "Leg extension", muscleGroup: MuscleGroup.Quads, ...o });
const legCurl = (o: Partial<Exercise> = {}) =>
	makeExercise({ name: "Leg curl", muscleGroup: MuscleGroup.Hamstrings, ...o });

describe("SessionTemplateService", () => {
	const service = new SessionTemplateService();

	it("returns no type when there is no past session", () => {
		expect(service.buildSessionTypes([])).toEqual([]);
	});

	it("groups sessions by the set of worked muscle groups, whatever the exercise order", () => {
		const types = service.buildSessionTypes([
			makeSession("a", "2026-11-01", [curl(), pushdown()]),
			makeSession("b", "2026-11-03", [pushdown({ name: "Dips" }), curl({ name: "Curl marteau" })]),
		]);

		expect(types.length).toBe(1);
		expect(types[0].muscleGroups).toEqual([MuscleGroup.Biceps, MuscleGroup.Triceps]);
		expect(types[0].occurrences).toBe(2);
		expect(types[0].templates.length).toBe(2);
	});

	it("deduplicates sessions having the same exercises (case, accents and order insensitive)", () => {
		const types = service.buildSessionTypes([
			makeSession("old", "2026-10-01", [curl(), pushdown()]),
			makeSession("recent", "2026-11-01", [pushdown({ name: "triceps POULIE vers le bas" }), curl({ sets: 4 })]),
		]);

		expect(types[0].templates.length).toBe(1);
		expect(types[0].templates[0].sourceSessionId).toBe("recent");
		expect(types[0].templates[0].occurrences).toBe(2);
		expect(types[0].templates[0].exercises).toEqual([
			{ name: "triceps POULIE vers le bas", sets: 5, isCardio: false },
			{ name: "Biceps curl barre en V", sets: 4, isCardio: false },
		]);
	});

	it("orders types and templates by frequency, then by most recent", () => {
		const types = service.buildSessionTypes([
			makeSession("legs-1", "2026-10-01", [legExtension(), legCurl()]),
			makeSession("legs-2", "2026-10-08", [legExtension(), legCurl()]),
			makeSession("arms-1", "2026-11-10", [curl(), pushdown()]),
			makeSession("arms-2", "2026-11-12", [curl()]),
		]);

		expect(types.map((t) => t.key)).toEqual(["Quads+Hamstrings", "Biceps", "Biceps+Triceps"]);
	});

	it("excludes the current session, empty sessions and cancelled exercises", () => {
		const types = service.buildSessionTypes(
			[
				makeSession("current", "2026-11-18", [curl()]),
				makeSession("empty", "2026-11-10", []),
				makeSession("only-cancelled", "2026-11-09", [legCurl({ status: "cancelled" })]),
				makeSession("past", "2026-11-01", [curl(), legCurl({ status: "cancelled" })]),
			],
			"current"
		);

		expect(types.length).toBe(1);
		expect(types[0].muscleGroups).toEqual([MuscleGroup.Biceps]);
		expect(types[0].templates[0].sourceSessionId).toBe("past");
		expect(types[0].templates[0].exercises.length).toBe(1);
	});

	it("uses the number of pyramid sets and puts cardio-only sessions in a cardio type", () => {
		const types = service.buildSessionTypes([
			makeSession("pyramid", "2026-11-01", [
				curl({
					isPyramid: true,
					sets: 1,
					pyramidSets: [
						{ weightKg: 10, reps: 12 },
						{ weightKg: 12, reps: 10 },
						{ weightKg: 14, reps: 8 },
					],
				}),
			]),
			makeSession("run", "2026-11-02", [makeExercise({ name: "Course", isCardio: true, muscleGroup: null, sets: 0 })]),
		]);

		const pyramidType = types.find((t) => t.key === "Biceps")!;
		const cardioType = types.find((t) => t.key === "cardio")!;
		expect(pyramidType.templates[0].exercises[0].sets).toBe(3);
		expect(cardioType.isCardio).toBeTrue();
		expect(cardioType.muscleGroups).toEqual([]);
	});
});
