import { sevenDayStreakDetector } from "./seven-day-streak.detector";
import { DetectorContext } from "../highlight-metric.model";
import { Session } from "../../shared/models";

// TODAY = Wednesday Jan 31, 2024; Monday of week = Jan 29
const TODAY = new Date(2024, 0, 31);

function makeSession(id: string, daysAgo: number): Session {
	const date = new Date(TODAY);
	date.setDate(date.getDate() - daysAgo);
	return { id, date, status: "completed", durationSeconds: 0, muscleGroup: null, exercises: [] };
}

function makeCtx(sessions: Session[]): DetectorContext {
	return { sessions, exercises: [], today: TODAY, favoriteBonus: () => 0 };
}

describe("sevenDayStreakDetector", () => {
	it("should return [] when there are no sessions", () => {
		expect(sevenDayStreakDetector(makeCtx([]))).toEqual([]);
	});

	it("should return [] when there are only 3 sessions in the last 7 days", () => {
		const sessions = [
			makeSession("s1", 0),
			makeSession("s2", 2),
			makeSession("s3", 5),
		];
		expect(sevenDayStreakDetector(makeCtx(sessions))).toEqual([]);
	});

	it("should detect a streak when there are exactly 4 sessions in a 7-day window ending today", () => {
		const sessions = [
			makeSession("s1", 0),
			makeSession("s2", 1),
			makeSession("s3", 3),
			makeSession("s4", 6),
		];
		const result = sevenDayStreakDetector(makeCtx(sessions));
		expect(result).not.toEqual([]);
		expect(result[0].id).toBe("seven-day-streak");
		expect(result[0].category).toBe("regularity");
		expect(result[0].payload["sessionCount"]).toBe(4);
	});

	it("should return the maximum session count when multiple rolling windows qualify", () => {
		// 5 sessions in a 7-day window
		const sessions = [
			makeSession("s1", 0),
			makeSession("s2", 1),
			makeSession("s3", 2),
			makeSession("s4", 4),
			makeSession("s5", 6),
		];
		const result = sevenDayStreakDetector(makeCtx(sessions));
		expect(result[0].payload["sessionCount"]).toBe(5);
		expect(result[0].impactScore).toBe(5);
	});

	it("should return [] when sessions are outside the rolling window from this week", () => {
		// Sessions from 8, 9, 10, 11 days ago — outside any window from Mon Jan 29 to today Jan 31
		const sessions = [
			makeSession("s1", 8),
			makeSession("s2", 9),
			makeSession("s3", 10),
			makeSession("s4", 11),
		];
		expect(sevenDayStreakDetector(makeCtx(sessions))).toEqual([]);
	});

	it("should have category regularity", () => {
		const sessions = [
			makeSession("s1", 0),
			makeSession("s2", 1),
			makeSession("s3", 2),
			makeSession("s4", 3),
		];
		const result = sevenDayStreakDetector(makeCtx(sessions));
		expect(result[0].category).toBe("regularity");
	});
});
