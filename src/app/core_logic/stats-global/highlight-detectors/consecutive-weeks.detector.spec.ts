import { consecutiveWeeksDetector } from "./consecutive-weeks.detector";
import { DetectorContext } from "../highlight-metric.model";
import { Session } from "../../shared/models";

// TODAY = Wednesday Jan 31, 2024
// Week of Jan 29 (Mon) — Jan 31 (Wed) is current week
const TODAY = new Date(2024, 0, 31);

function makeSessionOnDate(id: string, date: Date): Session {
	return { id, date, status: "completed", durationSeconds: 0, muscleGroup: null, exercises: [] };
}

// Create sessions for a given ISO week (by offsetting from Jan 29 2024)
function makeSessionsForWeek(weekOffset: number, count: number): Session[] {
	const monday = new Date(2024, 0, 29);
	monday.setDate(monday.getDate() - weekOffset * 7);
	return Array.from({ length: count }, (_, i) => {
		const d = new Date(monday);
		d.setDate(d.getDate() + i);
		return makeSessionOnDate(`w${weekOffset}-s${i}`, d);
	});
}

function makeCtx(sessions: Session[]): DetectorContext {
	return { sessions, exercises: [], today: TODAY, favoriteBonus: () => 0 };
}

describe("consecutiveWeeksDetector", () => {
	it("should return null when there are no sessions", () => {
		expect(consecutiveWeeksDetector(makeCtx([]))).toBeNull();
	});

	it("should return null when only 2 consecutive weeks have at least 2 sessions", () => {
		const sessions = [
			...makeSessionsForWeek(0, 2), // current week: 2 sessions
			...makeSessionsForWeek(1, 2), // prev week: 2 sessions
		];
		expect(consecutiveWeeksDetector(makeCtx(sessions))).toBeNull();
	});

	it("should return null when a week has only 1 session breaking the streak", () => {
		const sessions = [
			...makeSessionsForWeek(0, 2), // current: 2 ✓
			...makeSessionsForWeek(1, 1), // prev: 1 ✗ — breaks streak
			...makeSessionsForWeek(2, 3), // 2 weeks ago: 3 (irrelevant due to break)
			...makeSessionsForWeek(3, 2),
		];
		expect(consecutiveWeeksDetector(makeCtx(sessions))).toBeNull();
	});

	it("should detect 3 consecutive active weeks when each has at least 2 sessions", () => {
		const sessions = [
			...makeSessionsForWeek(0, 2),
			...makeSessionsForWeek(1, 3),
			...makeSessionsForWeek(2, 2),
		];
		const result = consecutiveWeeksDetector(makeCtx(sessions));
		expect(result).not.toBeNull();
		expect(result!.id).toBe("consecutive-weeks");
		expect(result!.category).toBe("regularity");
		expect(result!.payload["weeks"]).toBe(3);
	});

	it("should count all consecutive active weeks when the streak extends beyond 3 weeks", () => {
		const sessions = [
			...makeSessionsForWeek(0, 2),
			...makeSessionsForWeek(1, 2),
			...makeSessionsForWeek(2, 2),
			...makeSessionsForWeek(3, 2),
		];
		const result = consecutiveWeeksDetector(makeCtx(sessions));
		expect(result!.payload["weeks"]).toBe(4);
		expect(result!.impactScore).toBe(4);
	});

	it("should return null when the current week has fewer than 2 sessions", () => {
		const sessions = [
			...makeSessionsForWeek(0, 1), // current: 1 ✗
			...makeSessionsForWeek(1, 3),
			...makeSessionsForWeek(2, 3),
		];
		expect(consecutiveWeeksDetector(makeCtx(sessions))).toBeNull();
	});

	it("should have category regularity", () => {
		const sessions = [
			...makeSessionsForWeek(0, 2),
			...makeSessionsForWeek(1, 2),
			...makeSessionsForWeek(2, 2),
		];
		const result = consecutiveWeeksDetector(makeCtx(sessions));
		expect(result!.category).toBe("regularity");
	});
});
