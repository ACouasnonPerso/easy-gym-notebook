---
name: S08 Stats Exercise — complete
description: ExerciseStatsService, GetExerciseStatsUseCase, DualLineChartComponent, StatsExerciseComponent fully implemented
type: project
---

ExerciseStatsService loads all sessions and exercises in parallel, builds a sessionDateMap, filters validated exercises by name, maps to ExerciseOccurrence[], sorts ascending by date, and sets a signal.

GetExerciseStatsUseCase delegates to ExerciseStatsService, exposes the occurrences signal.

DualLineChartComponent renders a dual SVG polyline chart (weight=blue #3498db, volume=orange #f5a623) with computed() from input signal. Single-point case handled (centered x). viewBox="0 0 320 200" with padding L=40 R=40 T=24 B=32.

StatsExerciseComponent reads exerciseName from route param (decodeURIComponent), calls useCase.execute() in ngOnInit, renders chart + history list with fr-FR date formatting.

**Why:** Final story (S08) — all S01-S08 stories complete. Build passes clean.

**How to apply:** The app is feature-complete. No further stories planned.
