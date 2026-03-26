---
name: project_cardio_exercise
description: Cardio exercise feature — steps 1-7 implemented with full TDD as of 2026-03-26
type: project
---

Cardio exercise feature (steps 1-7) fully implemented and all 97 logic tests green as of 2026-03-26.

**Why:** Users can now add cardio exercises (running, cycling, swimming, etc.) to sessions. Cardio exercises capture durationSeconds and distanceKm instead of weight/sets/reps.

**How to apply:** Steps 8-9 (visual components) remain to be implemented. The backend data layer, business logic, and stats service are complete.

## Key design decisions

- `Exercise` and `RawExercise` both have `isCardio: boolean`, `durationSeconds: number`, `distanceKm: number | null`
- `CardioOccurrence` interface: `{ date: Date; durationSeconds: number; distanceKm: number | null }`
- `MuscleGroupDetectorService.detect()` now returns `isCardio: boolean` in addition to `muscleGroups` and `cleanedName`
- Cardio keyword detection uses **whole-word matching** (not substring) — critical: `'développé'` normalized to `'developpe'` contains `'velo'` as substring, which would falsely trigger cardio detection
- `AddExerciseUseCase` respects `params.isCardio` flag — does NOT auto-detect cardio from name
- `UpdateExerciseUseCase` skips muscle detection when `isCardio` is true on existing or updated exercise
- `ExerciseStatsService` discriminates on `isCardio` flag: populates `cardioOccurrences` (not `occurrences`) for cardio exercises
- `GetExerciseStatsUseCase` exposes `cardioOccurrences` and `isCardio = computed(() => cardioOccurrences().length > 0)`

## Files modified
- `core_logic/shared/models.ts` — Exercise, RawExercise, CardioOccurrence
- `core_logic/shared/muscle-group-detector.service.ts` — cardio detection with word boundaries
- `core_logic/stats-exercise/exercise-stats.service.ts` — cardioOccurrences signal
- `secondary_adapters/exercise/exercise.mapper.ts` — maps isCardio/durationSeconds/distanceKm
- `primary_ports/session-detail/add-exercise.usecase.ts` — cardio params support
- `primary_ports/session-detail/update-exercise.usecase.ts` — cardio-aware name update
- `primary_ports/stats-exercise/get-exercise-stats.usecase.ts` — cardioOccurrences + isCardio signal

## New spec files
- `secondary_adapters/exercise/exercise.mapper.spec.ts`
- `core_logic/stats-exercise/exercise-stats.service.spec.ts`
- `primary_ports/stats-exercise/get-exercise-stats.usecase.spec.ts`
