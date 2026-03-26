---
name: Cardio UI Components
description: Steps 8 and 9 of the cardio exercise feature — UI components for cardio display, pickers and charts
type: project
---

Steps 8 and 9 of the cardio feature implemented and all targeted tests green as of 2026-03-26.

**Why:** Full cardio exercise feature adds duration/distance tracking to complement strength weight/sets/reps.

**How to apply:** When touching session-detail or stats-exercise components, be aware of the cardio/strength branching pattern used consistently across these files.

## What was implemented

### ExerciseCardComponent
- `isCardio = computed(() => exercise().isCardio)` signal
- `durationMinutes = computed(...)` signal (floor(durationSeconds / 60))
- Conditional stats: cardio shows duration (min) + distance (km); strength shows weight/sets/reps/break
- "Cardio" entry added to `muscleColorMap` (cyan: #06b6d4); map type widened from `Record<MuscleGroup, ...>` to `Record<string, ...>`

### AddExerciseFormComponent
- `isCardio = signal(false)` — set by `onNameInput` via `MuscleGroupDetectorService.detect().isCardio`
- `durationHours`, `durationMinutes` writable signals; `durationSeconds = computed(hours * 3600 + minutes * 60)`
- `distanceKm = signal<number | null>(null)`
- `isSubmitDisabled = computed(() => isCardio() && durationSeconds() === 0)` — disables submit button
- Cardio pickers row: hours / minutes / km; strength row unchanged
- "Cardio" badge in name field when cardio detected (cyan, mirrors detectedGroup badge)
- `HOURS_VALUES`, `MINUTES_VALUES`, `KM_VALUES` constants (KM: null head + 0.1-2km/0.1 + 2.5-50km/0.5 + 51-200km/1)

### ExerciseExpandedComponent
- Same cardio/strength conditional pickers row pattern as AddExerciseFormComponent
- `durationHours`, `durationMinutes` computed from `exercise().durationSeconds`
- `emitDurationUpdate(part, value)` helper recalculates total seconds and emits update

### StatsExerciseComponent
- Imports `CardioTimeChartComponent`, `CardioDistanceChartComponent`
- Uses `useCase.isCardio()` to branch between cardio charts (time/distance) and strength charts (volume/weight)
- Cardio chart tabs: "Duree" / "km" instead of "Volume" / "Poids"

### CardioTimeChartComponent (new)
- Line chart of duration in minutes per cardio occurrence
- Purple (#8b5cf6) color scheme
- Mirrors VolumeLineChartComponent structure

### CardioDistanceChartComponent (new)
- Line chart of km per cardio occurrence
- Filters out occurrences where `distanceKm === null || distanceKm === 0`
- Cyan (#06b6d4) color scheme
