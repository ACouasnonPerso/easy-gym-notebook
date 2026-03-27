---
name: project_pyramid_mode
description: Pyramid mode feature — per-set weight/reps for strength exercises, 24 tests green as of 2026-03-27
type: project
---

Pyramid mode feature fully implemented and all 24 tests green as of 2026-03-27.

**Why:** Users want to record exercises where each set has a different weight and rep count (e.g., 60kg×12, 80kg×8, 100kg×4) rather than a single flat weight/sets/reps value.

**How to apply:** When touching exercise volume calculations, ExerciseMapper, AddExerciseForm, or ExerciseCard, be aware of the pyramid fields.

## Architecture

- `PyramidSet { weightKg: number; reps: number }` interface in `models.ts`
- `Exercise` has required fields `isPyramid: boolean` and `pyramidSets: PyramidSet[]`
- `RawExercise` has optional `isPyramid?: boolean` and `pyramidSets?: PyramidSet[]` for backward compatibility (legacy records have neither field)
- `computeVolume(exercise: Exercise): number` in `utils.ts` — pyramid: sum of `weightKg * reps` per set; standard: `weightKg * sets * reps`; fallback to flat when `isPyramid` but `pyramidSets` is empty
- `StatsService` uses `computeVolume` in `monthSummary`, `weekSummary`, and `exerciseSummaries`
- `ExerciseMapper.toDomain` defaults `isPyramid: false, pyramidSets: []` for legacy records
- `AddExerciseFormComponent` has `isPyramid` and `pyramidSets` signals; pyramid toggle shown only for strength exercises; submit blocked when pyramid mode active but no sets added
- `ExerciseCardComponent` compact view shows `≈ avg` when pyramid, `—` when pyramid but empty sets

## Test suites (24 tests)

1. `utils.spec.ts` — `computeVolume` (4 tests): standard, pyramid 3-set, pyramid empty fallback, zero weight
2. `exercise.mapper.spec.ts` — `ExerciseMapper — pyramid fields` (4 tests): legacy toDomain, full pyramid toDomain, pyramid toStorage, standard toStorage
3. `autocomplete.service.spec.ts` — `getLastParams — pyramid fields` (2 tests): standard params, pyramid params
4. `stats.service.spec.ts` — `monthSummary — pyramid volume` (4 tests): all standard, all pyramid, mixed, weekly pyramid
5. `add-exercise-form.component.spec.ts` — `pyramid toggle` (7 tests): hide for cardio, show for strength, activate/deactivate toggle, block empty submit, include in submitted data, restore on autocomplete
6. `exercise-card.component.spec.ts` — `pyramid compact display` (3 tests): standard (no ≈), pyramid (≈ + avg), empty pyramid (—)

## CSS selectors used in tests

- `.pyramid-toggle` — the toggle button in AddExerciseForm
- `.pyramid-sets` — container for per-set rows in AddExerciseForm
- `.standard-pickers` — container for standard weight/sets/reps pickers in AddExerciseForm
