import { Injectable } from '@angular/core';
import { CardioOccurrence, ExerciseOccurrence } from '../shared/models';
import { GroupBy } from './group-by.model';

function getISOWeekKey(date: Date): string {
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	// Shift to the Thursday of the same ISO week (ISO weeks start Monday)
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
	return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

function getMonthKey(date: Date): string {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getYearKey(date: Date): string {
	return `${date.getUTCFullYear()}`;
}

function bucketKey(date: Date, groupBy: GroupBy): string {
	switch (groupBy) {
		case 'week': return getISOWeekKey(date);
		case 'month': return getMonthKey(date);
		case 'year': return getYearKey(date);
		default: return '';
	}
}

@Injectable({ providedIn: 'root' })
export class ExerciseOccurrenceGroupingService {
	groupExercise(occurrences: ExerciseOccurrence[], groupBy: GroupBy): ExerciseOccurrence[] {
		const sorted = [...occurrences].sort((a, b) => a.date.getTime() - b.date.getTime());

		if (groupBy === 'session') {
			return sorted;
		}

		const buckets = new Map<string, ExerciseOccurrence[]>();
		const keyOrder: string[] = [];

		for (const occ of sorted) {
			const key = bucketKey(occ.date, groupBy);
			if (!buckets.has(key)) {
				buckets.set(key, []);
				keyOrder.push(key);
			}
			buckets.get(key)!.push(occ);
		}

		return keyOrder.map(key => {
			const group = buckets.get(key)!;
			const first = group[0];
			const weightKg = group.reduce((sum, o) => sum + o.weightKg, 0) / group.length;
			const volumeKg = group.reduce((sum, o) => sum + o.volumeKg, 0);
			const totalReps = group.reduce((sum, o) => sum + (o.totalReps ?? 0), 0);
			return { ...first, weightKg, volumeKg, totalReps };
		});
	}

	groupCardio(occurrences: CardioOccurrence[], groupBy: GroupBy): CardioOccurrence[] {
		const sorted = [...occurrences].sort((a, b) => a.date.getTime() - b.date.getTime());

		if (groupBy === 'session') {
			return sorted;
		}

		const buckets = new Map<string, CardioOccurrence[]>();
		const keyOrder: string[] = [];

		for (const occ of sorted) {
			const key = bucketKey(occ.date, groupBy);
			if (!buckets.has(key)) {
				buckets.set(key, []);
				keyOrder.push(key);
			}
			buckets.get(key)!.push(occ);
		}

		return keyOrder.map(key => {
			const group = buckets.get(key)!;
			const first = group[0];
			const durationSeconds = group.reduce((sum, o) => sum + o.durationSeconds, 0);
			const nonNullDistances = group.map(o => o.distanceKm).filter((d): d is number => d !== null);
			const distanceKm = nonNullDistances.length > 0
				? nonNullDistances.reduce((sum, d) => sum + d, 0)
				: null;
			return { date: first.date, durationSeconds, distanceKm };
		});
	}
}
