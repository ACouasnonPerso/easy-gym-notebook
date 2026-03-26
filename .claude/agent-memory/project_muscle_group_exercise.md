---
name: muscleGroup retained on Exercise
description: Decision confirmed 2026-03-26 to keep muscleGroup field on Exercise domain model (not remove it)
type: project
---

The `muscleGroup: MuscleGroup | null` field is intentionally retained on the `Exercise` interface in `models.ts`.

**Why:** User confirmed "on ne retire pas le groupe musculaire d'un exercice de muscu" — muscle group detection from exercise name is a key feature: `MuscleGroupDetectorService.detect(name)` parses the name, extracts the group, and stores it on the exercise. It is also used to propagate the session's muscle group when no group is set yet.

**How to apply:** Never remove `muscleGroup` from `Exercise`, `RawExercise`, `ExerciseMapper`, or `AddExerciseUseCase`. The field is load-bearing for the stats donut chart and session header display.

Tests live in `src/app/primary_ports/session-detail/add-exercise.usecase.spec.ts` — 4 tests covering null group, detected group, session propagation, and no-overwrite-when-session-already-has-group.
