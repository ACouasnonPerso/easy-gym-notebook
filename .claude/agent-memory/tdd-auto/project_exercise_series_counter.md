---
name: project_exercise_series_counter
description: Series counter feature added to ExerciseChronoService and ExerciseChronoComponent as of 2026-03-26
type: project
---

Series (round) counter added to `ExerciseChronoService` with 5 TDD-verified rules.

**Why:** Business requirement to display the current series number for the selected exercise on the chrono screen, so users can track how many rounds they've completed.

**How to apply:** When touching the exercise chrono flow, be aware that `seriesCount` is a readonly signal on `ExerciseChronoService` (and exposed via `ExerciseChronoUseCase`). It increments on `start()`, `goTraining()`, and auto-break-completion (`startCountdown` reaching 0). It resets to 0 on `init()`.

**Key implementation notes:**
- `ExerciseChronoComponent` has both `templateUrl` and inline `template` — the inline was removed as of this feature, now uses `templateUrl` only
- Series badge is shown only when `hasExercise()` is true (exercise passed via queryParam `breakDuration`)
- Translation key: `chrono.series` ("Serie" in FR, "Set" in EN)
- Pre-existing build error in `stats-global/heatmap.component.ts` is unrelated
- Pre-existing 12 component spec failures in `exercise-chrono.component.spec.ts` are `TranslateService` injection issues (not my changes)
