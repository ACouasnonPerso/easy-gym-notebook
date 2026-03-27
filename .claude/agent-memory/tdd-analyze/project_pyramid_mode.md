---
name: project_pyramid_mode
description: Pyramid mode feature: test list produced 2026-03-27, affected areas, key design decisions, file paths
type: project
---

Pyramid mode allows heterogeneous sets (different weight+reps per set) for strength exercises. Compact card shows averaged values with ≈ symbol; expanded view lists each row. Volume = ∑ weightᵢ × repsᵢ.

**Why:** Extends cahier des charges section 4.2 without contradicting it; standard mode remains default.

**How to apply:** When touching volume calculations, mapper, autocomplete, or exercise forms, always branch on `isPyramid` and handle `pyramidSets: PyramidSet[]`.

## Affected files (all extensions, no new files needed)
- Models: `src/app/core_logic/shared/models.ts` — add `PyramidSet`, extend `Exercise` and `RawExercise`
- Utils: `src/app/core_logic/shared/utils.ts` — add `computeVolume(exercise)` pure function
- Mapper: `src/app/secondary_adapters/exercise/exercise.mapper.ts` — map new fields, default missing fields on legacy records
- Autocomplete: `src/app/core_logic/session-detail/autocomplete.service.ts` — `getLastParams` must return `isPyramid` + `pyramidSets`
- StatsService: `src/app/core_logic/stats-global/stats.service.ts` — `monthSummary`, `weekSummary`, `exerciseSummaries` use `computeVolume`
- ExerciseStatsService: `src/app/core_logic/stats-exercise/exercise-stats.service.ts` — `volumeKg` uses `computeVolume`
- AddExerciseUseCase: `src/app/primary_ports/session-detail/add-exercise.usecase.ts` — accept `isPyramid` + `pyramidSets` in params
- AddExerciseFormComponent: `src/app/primary_adapters/session-detail/add-exercise-form.component.ts`
- ExerciseCardComponent: `src/app/primary_adapters/session-detail/exercise-card.component.ts`

## Test suites in this plan (6 suites, all separate implementations)
1. Unit — `computeVolume` utility (new, in utils.ts)
2. Unit — `ExerciseMapper` toDomain/toStorage extensions
3. Unit — `AutocompleteService` getLastParams pyramid fields
4. Unit — `StatsService` monthSummary pyramid volume
5. Component — `AddExerciseFormComponent` pyramid toggle + submit + autocomplete restore
6. Component — `ExerciseCardComponent` compact pyramid display
