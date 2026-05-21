import { volumeMilestoneDetector, MILESTONE_STEP_KG } from "./volume-milestone.detector";
import { DetectorContext } from "../highlight-metric.model";
import { Exercise } from "../../shared/models";

const TODAY = new Date(2024, 0, 31);

function makeExercise(id: string, weightKg: number, sets: number, reps: number): Exercise {
	return {
		id,
		sessionId: "s1",
		name: "Squat",
		muscleGroup: null,
		muscleGroups: [],
		weightKg,
		sets,
		reps,
		breakDurationSeconds: 60,
		status: "validated",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		rating: null,
		comment: null,
	};
}

function makeCtx(exercises: Exercise[]): DetectorContext {
	return { sessions: [], exercises, today: TODAY, favoriteBonus: () => 0 };
}

describe("volumeMilestoneDetector", () => {
	it("should return null when there are no exercises", () => {
		expect(volumeMilestoneDetector(makeCtx([]), () => 0, () => {})).toBeNull();
	});

	it("should return null when total volume has not yet reached the first 50-tonne threshold", () => {
		// 49 000 kg < 50 000 kg
		const ex = makeExercise("e1", 100, 10, 49); // 49 000 kg
		expect(volumeMilestoneDetector(makeCtx([ex]), () => 0, () => {})).toBeNull();
	});

	it("should detect the first 50-tonne milestone when total volume crosses 50 000 kg", () => {
		// 50 001 kg
		const ex = makeExercise("e1", 100, 10, 51); // 51 000 kg — crosses 50t
		const result = volumeMilestoneDetector(makeCtx([ex]), () => 0, () => {});
		expect(result).not.toBeNull();
		expect(result!.id).toBe("volume-milestone");
		expect(result!.payload["milestoneTonnes"]).toBe(50);
	});

	it("should return null on subsequent calls when the milestone has already been acknowledged", () => {
		const ex = makeExercise("e1", 100, 10, 51); // 51 000 kg
		// lastMilestone already at 50 000
		const result = volumeMilestoneDetector(makeCtx([ex]), () => 50_000, () => {});
		expect(result).toBeNull();
	});

	it("should detect the 100-tonne milestone when the 50-tonne one was already acknowledged", () => {
		// total 102 000 kg → crosses 100 000 threshold; last acknowledged = 50 000
		const ex = makeExercise("e1", 100, 20, 51); // 102 000 kg
		const result = volumeMilestoneDetector(makeCtx([ex]), () => 50_000, () => {});
		expect(result).not.toBeNull();
		expect(result!.payload["milestoneTonnes"]).toBe(100);
	});

	it("should call setLastMilestoneKg with the newly crossed threshold when a milestone fires", () => {
		const ex = makeExercise("e1", 100, 10, 51); // 51 000 kg
		let saved = 0;
		volumeMilestoneDetector(makeCtx([ex]), () => 0, (kg) => { saved = kg; });
		expect(saved).toBe(50_000);
	});

	it("should not count non-validated exercises toward the total volume", () => {
		const validated = makeExercise("e1", 100, 10, 51); // 51 000 kg
		const pending: Exercise = { ...makeExercise("e2", 100, 10, 51), status: "pending" };
		// Only validated counts → 51 000 kg → crosses 50t
		const result = volumeMilestoneDetector(makeCtx([validated, pending]), () => 0, () => {});
		expect(result).not.toBeNull();
		expect(result!.payload["milestoneTonnes"]).toBe(50);
	});
});
