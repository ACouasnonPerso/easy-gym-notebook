import { ExerciseOccurrenceGroupingService } from './exercise-occurrence-grouping.service';
import { CardioOccurrence, ExerciseOccurrence } from '../shared/models';

function makeOcc(overrides: Partial<ExerciseOccurrence> = {}): ExerciseOccurrence {
	return {
		exerciseId: 'ex-1',
		sessionId: 'session-1',
		date: new Date('2026-01-05'),
		name: 'Squat',
		weightKg: 80,
		sets: 4,
		reps: 5,
		breakDurationSeconds: 90,
		volumeKg: 1600,
		status: 'validated',
		rating: null,
		comment: null,
		totalReps: 20,
		setBreakdown: [],
		...overrides,
	};
}

function makeCardio(overrides: Partial<CardioOccurrence> = {}): CardioOccurrence {
	return {
		date: new Date('2026-01-05'),
		durationSeconds: 1800,
		distanceKm: 5,
		...overrides,
	};
}

describe('ExerciseOccurrenceGroupingService', () => {
	let service: ExerciseOccurrenceGroupingService;

	beforeEach(() => {
		service = new ExerciseOccurrenceGroupingService();
	});

	describe('groupExercise', () => {
		describe("'session'", () => {
			it('1. returns [] when given an empty array', () => {
				expect(service.groupExercise([], 'session')).toEqual([]);
			});

			it('2. returns a single occurrence unchanged', () => {
				const occ = makeOcc();
				const result = service.groupExercise([occ], 'session');
				expect(result.length).toBe(1);
				expect(result[0]).toEqual(occ);
			});

			it('3. returns multiple occurrences sorted by date ascending when input is unsorted', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-10') });
				const occ2 = makeOcc({ date: new Date('2026-01-05') });
				const occ3 = makeOcc({ date: new Date('2026-01-08') });
				const result = service.groupExercise([occ1, occ2, occ3], 'session');
				expect(result[0].date).toEqual(new Date('2026-01-05'));
				expect(result[1].date).toEqual(new Date('2026-01-08'));
				expect(result[2].date).toEqual(new Date('2026-01-10'));
			});

			it('4. preserves all fields of every occurrence', () => {
				const occ = makeOcc({
					exerciseId: 'ex-42',
					sessionId: 'session-99',
					date: new Date('2026-02-15'),
					name: 'Deadlift',
					weightKg: 120,
					sets: 3,
					reps: 5,
					breakDurationSeconds: 120,
					volumeKg: 1800,
					status: 'validated',
					rating: 4,
					comment: 'felt good',
					totalReps: 15,
					setBreakdown: [{ weightKg: 120, reps: 5 }],
				});
				const result = service.groupExercise([occ], 'session');
				expect(result[0]).toEqual(occ);
			});
		});

		describe("'week'", () => {
			it('5. returns [] when given an empty array', () => {
				expect(service.groupExercise([], 'week')).toEqual([]);
			});

			it('6. returns a single occurrence as a one-element array with date unchanged', () => {
				const occ = makeOcc({ date: new Date('2026-01-05') });
				const result = service.groupExercise([occ], 'week');
				expect(result.length).toBe(1);
				expect(result[0].date).toEqual(new Date('2026-01-05'));
			});

			it('7. averages weightKg for two occurrences in the same ISO week', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-05'), weightKg: 80 });
				const occ2 = makeOcc({ date: new Date('2026-01-07'), weightKg: 100 });
				const result = service.groupExercise([occ1, occ2], 'week');
				expect(result.length).toBe(1);
				expect(result[0].weightKg).toBe(90);
			});

			it('8. sums volumeKg for two occurrences in the same ISO week', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-05'), volumeKg: 1600 });
				const occ2 = makeOcc({ date: new Date('2026-01-07'), volumeKg: 2000 });
				const result = service.groupExercise([occ1, occ2], 'week');
				expect(result.length).toBe(1);
				expect(result[0].volumeKg).toBe(3600);
			});

			it('9. sums totalReps for two occurrences in the same ISO week', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-05'), totalReps: 20 });
				const occ2 = makeOcc({ date: new Date('2026-01-07'), totalReps: 15 });
				const result = service.groupExercise([occ1, occ2], 'week');
				expect(result.length).toBe(1);
				expect(result[0].totalReps).toBe(35);
			});

			it('10. sets the bucket date to the date of the earliest occurrence in the week', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-07') });
				const occ2 = makeOcc({ date: new Date('2026-01-05') });
				const result = service.groupExercise([occ1, occ2], 'week');
				expect(result[0].date).toEqual(new Date('2026-01-05'));
			});

			it('11. produces two buckets for occurrences on opposite sides of an ISO week boundary (Sun Jan 4 / Mon Jan 5 2026)', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-04') }); // Sunday, ISO week 1
				const occ2 = makeOcc({ date: new Date('2026-01-05') }); // Monday, ISO week 2
				const result = service.groupExercise([occ1, occ2], 'week');
				expect(result.length).toBe(2);
				expect(result[0].date).toEqual(new Date('2026-01-04'));
				expect(result[1].date).toEqual(new Date('2026-01-05'));
			});

			it('12. skips empty intermediate ISO weeks (Jan 5 week 2, Jan 19 week 4 -> 2 buckets)', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-05') }); // ISO week 2
				const occ2 = makeOcc({ date: new Date('2026-01-19') }); // ISO week 4
				const result = service.groupExercise([occ1, occ2], 'week');
				expect(result.length).toBe(2);
			});

			it('13. non-aggregated fields (exerciseId, name) in the bucket come from the first occurrence', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-05'), exerciseId: 'ex-1', name: 'Squat' });
				const occ2 = makeOcc({ date: new Date('2026-01-07'), exerciseId: 'ex-2', name: 'Squat v2' });
				const result = service.groupExercise([occ1, occ2], 'week');
				expect(result[0].exerciseId).toBe('ex-1');
				expect(result[0].name).toBe('Squat');
			});
		});

		describe("'month'", () => {
			it('14. returns [] when given an empty array', () => {
				expect(service.groupExercise([], 'month')).toEqual([]);
			});

			it('15. returns a single occurrence as a one-element array with date unchanged', () => {
				const occ = makeOcc({ date: new Date('2026-01-05') });
				const result = service.groupExercise([occ], 'month');
				expect(result.length).toBe(1);
				expect(result[0].date).toEqual(new Date('2026-01-05'));
			});

			it('16. averages weightKg for two occurrences in the same calendar month', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-05'), weightKg: 80 });
				const occ2 = makeOcc({ date: new Date('2026-01-20'), weightKg: 100 });
				const result = service.groupExercise([occ1, occ2], 'month');
				expect(result.length).toBe(1);
				expect(result[0].weightKg).toBe(90);
			});

			it('17. sums volumeKg for two occurrences in the same calendar month', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-05'), volumeKg: 1600 });
				const occ2 = makeOcc({ date: new Date('2026-01-20'), volumeKg: 2000 });
				const result = service.groupExercise([occ1, occ2], 'month');
				expect(result.length).toBe(1);
				expect(result[0].volumeKg).toBe(3600);
			});

			it('18. sums totalReps for two occurrences in the same calendar month', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-05'), totalReps: 20 });
				const occ2 = makeOcc({ date: new Date('2026-01-20'), totalReps: 15 });
				const result = service.groupExercise([occ1, occ2], 'month');
				expect(result.length).toBe(1);
				expect(result[0].totalReps).toBe(35);
			});

			it('19. sets the bucket date to the date of the earliest occurrence in the month', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-20') });
				const occ2 = makeOcc({ date: new Date('2026-01-05') });
				const result = service.groupExercise([occ1, occ2], 'month');
				expect(result[0].date).toEqual(new Date('2026-01-05'));
			});

			it('20. produces two buckets for occurrences on opposite sides of a month boundary (Jan 31 / Feb 1 2026)', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-31') });
				const occ2 = makeOcc({ date: new Date('2026-02-01') });
				const result = service.groupExercise([occ1, occ2], 'month');
				expect(result.length).toBe(2);
				expect(result[0].date).toEqual(new Date('2026-01-31'));
				expect(result[1].date).toEqual(new Date('2026-02-01'));
			});

			it('21. skips empty intermediate months (Jan 5 and Mar 5 -> 2 buckets)', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-05') });
				const occ2 = makeOcc({ date: new Date('2026-03-05') });
				const result = service.groupExercise([occ1, occ2], 'month');
				expect(result.length).toBe(2);
			});
		});

		describe("'year'", () => {
			it('22. returns [] when given an empty array', () => {
				expect(service.groupExercise([], 'year')).toEqual([]);
			});

			it('23. aggregates weightKg (avg), volumeKg (sum), totalReps (sum) for two occurrences in the same year', () => {
				const occ1 = makeOcc({ date: new Date('2026-01-05'), weightKg: 80, volumeKg: 1600, totalReps: 20 });
				const occ2 = makeOcc({ date: new Date('2026-06-15'), weightKg: 100, volumeKg: 2000, totalReps: 15 });
				const result = service.groupExercise([occ1, occ2], 'year');
				expect(result.length).toBe(1);
				expect(result[0].weightKg).toBe(90);
				expect(result[0].volumeKg).toBe(3600);
				expect(result[0].totalReps).toBe(35);
			});

			it('24. produces two buckets for occurrences on opposite sides of a year boundary (Dec 31 2025 / Jan 1 2026)', () => {
				const occ1 = makeOcc({ date: new Date('2025-12-31') });
				const occ2 = makeOcc({ date: new Date('2026-01-01') });
				const result = service.groupExercise([occ1, occ2], 'year');
				expect(result.length).toBe(2);
				expect(result[0].date).toEqual(new Date('2025-12-31'));
				expect(result[1].date).toEqual(new Date('2026-01-01'));
			});

			it('25. skips empty intermediate years (2024 and 2026 -> 2 buckets)', () => {
				const occ1 = makeOcc({ date: new Date('2024-06-15') });
				const occ2 = makeOcc({ date: new Date('2026-06-15') });
				const result = service.groupExercise([occ1, occ2], 'year');
				expect(result.length).toBe(2);
			});
		});
	});

	describe('groupCardio', () => {
		describe("'session'", () => {
			it('26. returns [] when given an empty array', () => {
				expect(service.groupCardio([], 'session')).toEqual([]);
			});

			it('27. returns multiple occurrences sorted by date ascending when input is unsorted', () => {
				const c1 = makeCardio({ date: new Date('2026-01-10') });
				const c2 = makeCardio({ date: new Date('2026-01-05') });
				const c3 = makeCardio({ date: new Date('2026-01-08') });
				const result = service.groupCardio([c1, c2, c3], 'session');
				expect(result[0].date).toEqual(new Date('2026-01-05'));
				expect(result[1].date).toEqual(new Date('2026-01-08'));
				expect(result[2].date).toEqual(new Date('2026-01-10'));
			});
		});

		describe("'week'", () => {
			it('28. returns [] when given an empty array', () => {
				expect(service.groupCardio([], 'week')).toEqual([]);
			});

			it('29. returns a single occurrence as a one-element array with date unchanged', () => {
				const c = makeCardio({ date: new Date('2026-01-05') });
				const result = service.groupCardio([c], 'week');
				expect(result.length).toBe(1);
				expect(result[0].date).toEqual(new Date('2026-01-05'));
			});

			it('30. sums durationSeconds for two occurrences in the same ISO week', () => {
				const c1 = makeCardio({ date: new Date('2026-01-05'), durationSeconds: 1800 });
				const c2 = makeCardio({ date: new Date('2026-01-07'), durationSeconds: 2400 });
				const result = service.groupCardio([c1, c2], 'week');
				expect(result.length).toBe(1);
				expect(result[0].durationSeconds).toBe(4200);
			});

			it('31. sums distanceKm (both non-null) for two occurrences in the same ISO week', () => {
				const c1 = makeCardio({ date: new Date('2026-01-05'), distanceKm: 5 });
				const c2 = makeCardio({ date: new Date('2026-01-07'), distanceKm: 3 });
				const result = service.groupCardio([c1, c2], 'week');
				expect(result.length).toBe(1);
				expect(result[0].distanceKm).toBe(8);
			});

			it('32. sets distanceKm to null when all occurrences in the bucket have null distanceKm', () => {
				const c1 = makeCardio({ date: new Date('2026-01-05'), distanceKm: null });
				const c2 = makeCardio({ date: new Date('2026-01-07'), distanceKm: null });
				const result = service.groupCardio([c1, c2], 'week');
				expect(result[0].distanceKm).toBeNull();
			});

			it('33. sums only non-null distanceKm when bucket has mixed null/non-null values', () => {
				const c1 = makeCardio({ date: new Date('2026-01-05'), distanceKm: 5 });
				const c2 = makeCardio({ date: new Date('2026-01-07'), distanceKm: null });
				const result = service.groupCardio([c1, c2], 'week');
				expect(result[0].distanceKm).toBe(5);
			});

			it('34. sets the bucket date to the date of the earliest occurrence in the week', () => {
				const c1 = makeCardio({ date: new Date('2026-01-07') });
				const c2 = makeCardio({ date: new Date('2026-01-05') });
				const result = service.groupCardio([c1, c2], 'week');
				expect(result[0].date).toEqual(new Date('2026-01-05'));
			});

			it('35. produces two buckets for occurrences on opposite sides of an ISO week boundary', () => {
				const c1 = makeCardio({ date: new Date('2026-01-04') }); // Sunday, ISO week 1
				const c2 = makeCardio({ date: new Date('2026-01-05') }); // Monday, ISO week 2
				const result = service.groupCardio([c1, c2], 'week');
				expect(result.length).toBe(2);
			});

			it('36. skips empty intermediate ISO weeks for non-consecutive cardio sessions', () => {
				const c1 = makeCardio({ date: new Date('2026-01-05') }); // ISO week 2
				const c2 = makeCardio({ date: new Date('2026-01-19') }); // ISO week 4
				const result = service.groupCardio([c1, c2], 'week');
				expect(result.length).toBe(2);
			});
		});

		describe("'month'", () => {
			it('37. sums durationSeconds for two occurrences in the same calendar month', () => {
				const c1 = makeCardio({ date: new Date('2026-01-05'), durationSeconds: 1800 });
				const c2 = makeCardio({ date: new Date('2026-01-20'), durationSeconds: 2400 });
				const result = service.groupCardio([c1, c2], 'month');
				expect(result.length).toBe(1);
				expect(result[0].durationSeconds).toBe(4200);
			});

			it('38. sums non-null distanceKm for two occurrences in the same calendar month', () => {
				const c1 = makeCardio({ date: new Date('2026-01-05'), distanceKm: 5 });
				const c2 = makeCardio({ date: new Date('2026-01-20'), distanceKm: 3 });
				const result = service.groupCardio([c1, c2], 'month');
				expect(result[0].distanceKm).toBe(8);
			});

			it('39. sets distanceKm to null when all occurrences in the month bucket have null distance', () => {
				const c1 = makeCardio({ date: new Date('2026-01-05'), distanceKm: null });
				const c2 = makeCardio({ date: new Date('2026-01-20'), distanceKm: null });
				const result = service.groupCardio([c1, c2], 'month');
				expect(result[0].distanceKm).toBeNull();
			});

			it('40. produces two buckets for occurrences on opposite sides of a month boundary (Jan 31 / Feb 1)', () => {
				const c1 = makeCardio({ date: new Date('2026-01-31') });
				const c2 = makeCardio({ date: new Date('2026-02-01') });
				const result = service.groupCardio([c1, c2], 'month');
				expect(result.length).toBe(2);
			});
		});

		describe("'year'", () => {
			it('41. sums durationSeconds for two occurrences in the same calendar year', () => {
				const c1 = makeCardio({ date: new Date('2026-01-05'), durationSeconds: 1800 });
				const c2 = makeCardio({ date: new Date('2026-06-15'), durationSeconds: 2400 });
				const result = service.groupCardio([c1, c2], 'year');
				expect(result.length).toBe(1);
				expect(result[0].durationSeconds).toBe(4200);
			});

			it('42. produces two buckets for occurrences on opposite sides of a year boundary (Dec 31 2025 / Jan 1 2026)', () => {
				const c1 = makeCardio({ date: new Date('2025-12-31') });
				const c2 = makeCardio({ date: new Date('2026-01-01') });
				const result = service.groupCardio([c1, c2], 'year');
				expect(result.length).toBe(2);
			});
		});
	});
});
