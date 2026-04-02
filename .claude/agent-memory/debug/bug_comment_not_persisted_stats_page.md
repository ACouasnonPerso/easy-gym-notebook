---
name: Bug: comment not persisted from exercise-history-list
description: Saving a comment via the popup in the stats exercise page silently does nothing — ExerciseService._exercises is empty in that context
type: project
---

Root cause confirmed: `ExerciseService._exercises` signal is only populated by `loadBySession()`. The stats exercise page (`StatsExerciseComponent`) never calls `loadBySession()` — it loads data through `ExerciseStatsService` which queries the repository directly and feeds its own `_occurrences` signal. When `UpdateExerciseUseCase.execute()` is called from the stats context, `exerciseService.exercises().find(...)` returns `undefined`, the early-return guard on line 24 of `exercise.service.ts` fires, and nothing is saved.

**Why:** Two separate in-memory caches exist for exercises — `ExerciseService._exercises` (session-scoped) and `ExerciseStatsService._occurrences` (stats-scoped). `UpdateExerciseUseCase` only looks into the session-scoped one.

**Theories ruled out:**
- `exerciseId` undefined on ExerciseOccurrence: confirmed present, field is set in ExerciseStatsService.loadForExercise()
- mapper not including comment: confirmed `comment` is mapped in both toDomain/toStorage
- secondary adapter dropping the field: never reached because update() exits early

**Reproduction test:** `update-exercise.usecase.spec.ts` — add a test that calls execute() without first seeding via `loadBySession()`. The repo.save spy will not be called. See below for the proposed test.

**Fix area:** `ExerciseService.update()` or `UpdateExerciseUseCase` must not rely solely on the in-memory `_exercises` cache. It should fall back to `exerciseRepo.getById()` (or equivalent) when the exercise is not found in memory.
