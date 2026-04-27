import { Injectable, inject, signal, computed } from "@angular/core";
import { Session, Exercise, MuscleGroup } from "../shared/models";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { computeVolume } from "../shared/utils";

export interface MuscleGroupDetail {
	percentage: number;
	sessionCount: number;
	totalLoadKg: number;
}

export interface YearlyHeatmapCell {
	date: Date;
	hasSession: boolean;
}

export interface YearlyHeatmapRow {
	month: number;
	year: number;
	cells: YearlyHeatmapCell[];
}

export interface HeatmapCell {
	date: Date;
	hasSession: boolean;
	isCurrentMonth: boolean;
	tags: string[];
	hasCardio: boolean;
}

export interface MonthSummary {
	totalWeightKg: number;
	sessionCount: number;
	totalDurationSeconds: number;
}

export interface WeeklyAverage {
	avgWeightKg: number;
	sessionsPerWeek: number;
	avgDurationSeconds: number;
}

export interface SessionDuration {
	date: Date;
	durationSeconds: number;
}

export interface ExerciseSummary {
	name: string;
	maxWeightKg: number;
	totalVolumeKg: number;
	occurrenceCount: number;
	isCardio: boolean;
	totalDurationSeconds: number;
	totalDistanceKm: number | null;
	muscleGroups: MuscleGroup[];
}

function getMondayOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function getSundayOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? 0 : 7 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

export type StatsViewType = "month" | "current-year" | "year" | "total" | "current-week";

@Injectable({ providedIn: "root" })
export class StatsService {
	private readonly sessionRepo = inject(SESSION_REPOSITORY);
	private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);

	readonly _allSessions = signal<Session[]>([]);
	readonly _allExercises = signal<Exercise[]>([]);
	readonly selectedMonth = signal<Date>(new Date());
	readonly viewType = signal<StatsViewType>("month");

	async load(): Promise<void> {
		const [sessions, exercises] = await Promise.all([this.sessionRepo.getAll(), this.exerciseRepo.getAll()]);
		this._allSessions.set(sessions);
		this._allExercises.set(exercises);
	}

	setMonth(month: Date): void {
		this.selectedMonth.set(month);
		this.viewType.set("month");
	}

	setYear(year: number): void {
		this.selectedMonth.set(new Date(year, 0, 1));
		this.viewType.set("year");
	}

	setViewType(type: StatsViewType): void {
		this.viewType.set(type);
	}

	private readonly _sessionsInMonth = computed(() => {
		const type = this.viewType();
		if (type === "total") {
			return this._allSessions();
		}
		if (type === "current-year") {
			const year = new Date().getFullYear();
			return this._allSessions().filter((s) => s.date.getFullYear() === year);
		}
		if (type === "year") {
			const year = this.selectedMonth().getFullYear();
			return this._allSessions().filter((s) => s.date.getFullYear() === year);
		}
		if (type === "current-week") {
			const today = new Date();
			const weekStart = getMondayOfWeek(today);
			const weekEnd = getSundayOfWeek(today);
			return this._allSessions().filter((s) => {
				const d = new Date(s.date);
				d.setHours(0, 0, 0, 0);
				return d >= weekStart && d <= weekEnd;
			});
		}
		const m = this.selectedMonth();
		return this._allSessions().filter(
			(s) => s.date.getFullYear() === m.getFullYear() && s.date.getMonth() === m.getMonth()
		);
	});

	private readonly _exercisesInMonth = computed(() => {
		const sessionIds = new Set(this._sessionsInMonth().map((s) => s.id));
		return this._allExercises().filter((e) => sessionIds.has(e.sessionId) && e.status === "validated");
	});

	readonly heatmapData = computed((): HeatmapCell[] => {
		const selected = this.selectedMonth();
		const year = selected.getFullYear();
		const month = selected.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const gridStart = getMondayOfWeek(firstDay);
		const gridEnd = getSundayOfWeek(lastDay);

		const sessionDateBySessionId = new Map<string, string>();
		for (const s of this._allSessions()) {
			const key = `${s.date.getFullYear()}-${s.date.getMonth()}-${s.date.getDate()}`;
			sessionDateBySessionId.set(s.id, key);
		}

		const sessionTagsByDate = new Map<string, string[]>();
		const sessionCardioByDate = new Map<string, boolean>();
		for (const e of this._allExercises()) {
			const key = sessionDateBySessionId.get(e.sessionId);
			if (key === undefined) continue;
			if (!sessionTagsByDate.has(key)) sessionTagsByDate.set(key, []);
			const tags = sessionTagsByDate.get(key)!;
			for (const mg of e.muscleGroups) {
				if (!tags.includes(mg)) tags.push(mg);
			}
			if (e.isCardio) sessionCardioByDate.set(key, true);
		}

		const cells: HeatmapCell[] = [];
		const cursor = new Date(gridStart);
		while (cursor <= gridEnd) {
			const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
			cells.push({
				date: new Date(cursor),
				hasSession: sessionTagsByDate.has(key),
				isCurrentMonth: cursor.getMonth() === month && cursor.getFullYear() === year,
				tags: sessionTagsByDate.get(key) ?? [],
				hasCardio: sessionCardioByDate.get(key) ?? false,
			});
			cursor.setDate(cursor.getDate() + 1);
		}
		return cells;
	});

	readonly monthSummary = computed((): MonthSummary => {
		const exercises = this._exercisesInMonth();
		const sessions = this._sessionsInMonth();
		const totalWeightKg = exercises.reduce((sum, e) => sum + computeVolume(e), 0);
		const sessionCount = sessions.length;
		const totalDurationSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
		return { totalWeightKg, sessionCount, totalDurationSeconds };
	});

	readonly weeklyAverage = computed((): WeeklyAverage => {
		const selected = this.selectedMonth();
		const year = selected.getFullYear();
		const month = selected.getMonth();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const weeks = Math.ceil(daysInMonth / 7);
		const { totalWeightKg, sessionCount, totalDurationSeconds } = this.monthSummary();
		return {
			avgWeightKg: totalWeightKg / weeks,
			sessionsPerWeek: sessionCount / weeks,
			avgDurationSeconds: totalDurationSeconds / weeks,
		};
	});

	readonly muscleGroupDistribution = computed((): Map<MuscleGroup, number> => {
		const exercises = this._exercisesInMonth();
		if (exercises.length === 0) return new Map();

		const volumes = new Map<MuscleGroup, number>();
		for (const e of exercises) {
			if (e.muscleGroup === null) continue;
			volumes.set(e.muscleGroup, (volumes.get(e.muscleGroup) ?? 0) + computeVolume(e));
		}
		// Exclude groups with zero total volume
		for (const [group, vol] of volumes) {
			if (vol === 0) volumes.delete(group);
		}
		if (volumes.size === 0) return new Map();

		const totalVolume = Array.from(volumes.values()).reduce((sum, v) => sum + v, 0);

		// Largest Remainder Method: floor each percentage then distribute
		// the remaining 1% slots to groups with the largest fractional parts,
		// guaranteeing the sum is exactly 100.
		const entries = Array.from(volumes.entries()).map(([group, vol]) => {
			const exact = (vol / totalVolume) * 100;
			return { group, floor: Math.floor(exact), remainder: exact - Math.floor(exact) };
		});

		const allocated = entries.reduce((sum, e) => sum + e.floor, 0);
		const deficit = 100 - allocated;

		entries
			.sort((a, b) => b.remainder - a.remainder)
			.slice(0, deficit)
			.forEach((e) => e.floor++);

		const sorted = entries.slice().sort((a, b) => b.floor - a.floor);
		const percentages = new Map<MuscleGroup, number>();
		for (const { group, floor } of sorted) percentages.set(group, floor);

		return percentages;
	});

	readonly muscleGroupDetails = computed((): Map<MuscleGroup, MuscleGroupDetail> => {
		const exercises = this._exercisesInMonth();
		if (exercises.length === 0) return new Map();

		const sessionCountByGroup = new Map<MuscleGroup, Set<string>>();
		const totalLoadByGroup = new Map<MuscleGroup, number>();

		for (const e of exercises) {
			if (e.muscleGroup === null) continue;
			if (!sessionCountByGroup.has(e.muscleGroup)) sessionCountByGroup.set(e.muscleGroup, new Set());
			sessionCountByGroup.get(e.muscleGroup)!.add(e.sessionId);
			totalLoadByGroup.set(e.muscleGroup, (totalLoadByGroup.get(e.muscleGroup) ?? 0) + computeVolume(e));
		}

		// Use volume as the basis for percentage — same as muscleGroupDistribution
		const volumes = new Map<MuscleGroup, number>(totalLoadByGroup);
		// Exclude groups with zero total volume
		for (const [group, vol] of volumes) {
			if (vol === 0) volumes.delete(group);
		}
		if (volumes.size === 0) return new Map();

		const totalVolume = Array.from(volumes.values()).reduce((sum, v) => sum + v, 0);

		const entries = Array.from(volumes.entries()).map(([group, vol]) => {
			const exact = (vol / totalVolume) * 100;
			return { group, floor: Math.floor(exact), remainder: exact - Math.floor(exact) };
		});

		const allocated = entries.reduce((sum, e) => sum + e.floor, 0);
		const deficit = 100 - allocated;
		entries
			.sort((a, b) => b.remainder - a.remainder)
			.slice(0, deficit)
			.forEach((e) => e.floor++);

		const result = new Map<MuscleGroup, MuscleGroupDetail>();
		for (const { group, floor } of entries) {
			result.set(group, {
				percentage: floor,
				sessionCount: sessionCountByGroup.get(group)?.size ?? 0,
				totalLoadKg: totalLoadByGroup.get(group) ?? 0,
			});
		}

		return result;
	});

	readonly weekSummary = computed((): MonthSummary => {
		const today = new Date();
		const weekStart = getMondayOfWeek(today);
		const weekEnd = getSundayOfWeek(today);

		const sessionsInWeek = this._allSessions().filter((s) => {
			const d = new Date(s.date);
			d.setHours(0, 0, 0, 0);
			return d >= weekStart && d <= weekEnd;
		});

		const sessionIds = new Set(sessionsInWeek.map((s) => s.id));
		const exercisesInWeek = this._allExercises().filter((e) => sessionIds.has(e.sessionId) && e.status === "validated");

		const totalWeightKg = exercisesInWeek.reduce((sum, e) => sum + computeVolume(e), 0);
		const sessionCount = sessionsInWeek.length;
		const totalDurationSeconds = sessionsInWeek.reduce((sum, s) => sum + s.durationSeconds, 0);

		return { totalWeightKg, sessionCount, totalDurationSeconds };
	});

	readonly sessionDurationsInMonth = computed((): SessionDuration[] => {
		const sessions = this._sessionsInMonth();
		const allZero = sessions.every((s) => s.durationSeconds === 0);
		if (allZero) return [];
		return sessions
			.map((s) => ({ date: s.date, durationSeconds: s.durationSeconds }))
			.sort((a, b) => a.date.getTime() - b.date.getTime());
	});

	readonly yearsWithSessions = computed((): number[] => {
		const years = new Set<number>();
		for (const s of this._allSessions()) {
			years.add(s.date.getFullYear());
		}
		return Array.from(years).sort((a, b) => b - a);
	});

	readonly yearlyHeatmapData = computed((): YearlyHeatmapRow[] => {
		const type = this.viewType();
		const year = type === "year" ? this.selectedMonth().getFullYear() : new Date().getFullYear();
		const sessions = this._allSessions();

		const sessionDayKeys = new Set<string>();
		for (const s of sessions) {
			if (s.date.getFullYear() === year) {
				const key = `${s.date.getFullYear()}-${s.date.getMonth()}-${s.date.getDate()}`;
				sessionDayKeys.add(key);
			}
		}

		const rows: YearlyHeatmapRow[] = [];
		for (let month = 0; month < 12; month++) {
			const daysInMonth = new Date(year, month + 1, 0).getDate();
			const cells: YearlyHeatmapCell[] = [];
			for (let day = 1; day <= daysInMonth; day++) {
				const date = new Date(year, month, day);
				const key = `${year}-${month}-${day}`;
				cells.push({ date, hasSession: sessionDayKeys.has(key) });
			}
			rows.push({ month, year, cells });
		}
		return rows;
	});

	readonly exerciseSummaries = computed((): ExerciseSummary[] => {
		const exercises = this._exercisesInMonth();
		const byName = new Map<string, Exercise[]>();
		for (const e of exercises) {
			const group = byName.get(e.name) ?? [];
			group.push(e);
			byName.set(e.name, group);
		}

		const summaries: ExerciseSummary[] = [];
		for (const [name, group] of byName) {
			const isCardio = group[0].isCardio;
			const maxWeightKg = Math.max(
				...group.map((e) =>
					e.isPyramid && e.pyramidSets.length > 0 ? Math.max(...e.pyramidSets.map((s) => s.weightKg)) : e.weightKg
				)
			);
			const totalVolumeKg = group.reduce((sum, e) => sum + computeVolume(e), 0);
			const totalDurationSeconds = group.reduce((sum, e) => sum + e.durationSeconds, 0);
			const rawDistanceKm = group.reduce((sum, e) => sum + (e.distanceKm ?? 0), 0);
			const totalDistanceKm = isCardio && rawDistanceKm > 0 ? rawDistanceKm : null;
			const muscleGroups = [...new Set(group.flatMap((e) => e.muscleGroups))];
			summaries.push({
				name,
				maxWeightKg,
				totalVolumeKg,
				occurrenceCount: group.length,
				isCardio,
				totalDurationSeconds,
				totalDistanceKm,
				muscleGroups,
			});
		}

		return summaries.sort((a, b) => b.totalVolumeKg - a.totalVolumeKg);
	});
}
