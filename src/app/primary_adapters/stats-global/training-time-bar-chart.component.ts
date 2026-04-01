import { Component, ChangeDetectionStrategy, input, computed } from "@angular/core";
import { formatSummaryDuration } from "../../core_logic/shared/utils";

export interface SessionDurationEntry {
	date: Date;
	durationSeconds: number;
}

export type BarChartMode = "day" | "week" | "month" | "year";

const BAR_LIMIT = 10;

function countGroups(sessions: SessionDurationEntry[], mode: BarChartMode): number {
	const keys = new Set(sessions.map((s) => getGroupKey(s.date, mode)));
	return keys.size;
}

const MODE_ORDER: BarChartMode[] = ["day", "week", "month", "year"];

export function resolveAutoMode(sessions: SessionDurationEntry[], mode: BarChartMode): BarChartMode {
	for (const candidate of MODE_ORDER) {
		if (MODE_ORDER.indexOf(candidate) < MODE_ORDER.indexOf(mode)) continue;
		if (countGroups(sessions, candidate) <= BAR_LIMIT) {
			return candidate;
		}
	}
	return "year";
}

function getISOWeekNumber(date: Date): { year: number; week: number } {
	const tmp = new Date(date);
	tmp.setHours(0, 0, 0, 0);
	// Set to nearest Thursday (ISO week definition: week belongs to the year that contains its Thursday)
	const day = tmp.getDay();
	const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
	tmp.setDate(tmp.getDate() + diff);
	const thursday = new Date(tmp);
	thursday.setDate(thursday.getDate() + 3);
	const year = thursday.getFullYear();
	const jan4 = new Date(year, 0, 4); // Jan 4 is always in week 1
	const startOfWeek1 = new Date(jan4);
	const jan4Day = jan4.getDay();
	startOfWeek1.setDate(jan4.getDate() - (jan4Day === 0 ? 6 : jan4Day - 1));
	const week = Math.round((tmp.getTime() - startOfWeek1.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
	return { year, week };
}

function getGroupKey(date: Date, mode: BarChartMode): string {
	const y = date.getFullYear();
	const m = date.getMonth();
	const d = date.getDate();
	if (mode === "day") return `${y}-${m}-${d}`;
	if (mode === "month") return `${y}-${m}`;
	if (mode === "year") return `${y}`;
	// 'week': ISO week
	const { year, week } = getISOWeekNumber(date);
	return `${year}-W${week}`;
}

@Component({
	selector: "app-training-time-bar-chart",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./training-time-bar-chart.component.html",
	styleUrl: "./training-time-bar-chart.component.css",
})
export class TrainingTimeBarChartComponent {
	sessions = input<SessionDurationEntry[]>([]);
	mode = input<BarChartMode>("day");

	readonly bars = computed(() => {
		const mode = resolveAutoMode(this.sessions(), this.mode());
		const grouped = new Map<string, { date: Date; durationSeconds: number }>();

		for (const s of this.sessions()) {
			const key = getGroupKey(s.date, mode);
			const existing = grouped.get(key);
			if (existing) {
				existing.durationSeconds += s.durationSeconds;
			} else {
				grouped.set(key, { date: s.date, durationSeconds: s.durationSeconds });
			}
		}

		const entries = Array.from(grouped.values())
			.filter((e) => e.durationSeconds > 0)
			.sort((a, b) => a.date.getTime() - b.date.getTime());

		if (entries.length === 0) return [];
		const max = Math.max(...entries.map((e) => e.durationSeconds));
		return entries.map((e) => ({
			date: e.date,
			heightPercent: Math.round((e.durationSeconds / max) * 100),
			label: this.formatDuration(e.durationSeconds),
			dateLabel: this.formatDateLabel(e.date, mode),
		}));
	});

	formatDuration(totalSeconds: number): string {
		return formatSummaryDuration(totalSeconds);
	}

	formatDateLabel(date: Date, mode: BarChartMode): string {
		if (mode === "day") {
			const day = String(date.getDate()).padStart(2, "0");
			const month = String(date.getMonth() + 1).padStart(2, "0");
			return `${day}/${month}`;
		}
		if (mode === "week") {
			const { week } = getISOWeekNumber(date);
			return `S${week}`;
		}
		if (mode === "month") {
			const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
			return MONTH_LABELS[date.getMonth()];
		}
		// 'year'
		return String(date.getFullYear());
	}
}
