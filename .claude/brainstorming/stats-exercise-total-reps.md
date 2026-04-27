# Stats Exercise — Total Reps Tab

## What this feature does
Adds a third tab "Total Reps" to the strength chart card in `app-stats-exercise`, alongside Volume and Weight. The chart plots, for each occurrence of the exercise, the total number of repetitions performed across all sets (normal: `sets * reps`; pyramid: sum of `pyramidSets[i].reps`). The curve is rendered in light blue.

## Design pattern
No new pattern is introduced. The existing layout already follows a lightweight **Strategy** pattern at the chart-card level (each `ChartType` selects a dedicated chart component); this feature adds a new strategy variant that fits the same shape.

## Affected areas
- `core_logic/shared/models.ts` — extend `ExerciseOccurrence` with a `totalReps: number` field.
- `core_logic/stats-exercise/exercise-stats.service.ts` — compute `totalReps` when mapping exercises to occurrences (handle both normal and pyramid cases).
- `primary_adapters/stats-exercise/chart-selection.service.ts` — extend `ChartType` union with `"reps"` and persist/restore it from localStorage.
- `primary_adapters/stats-exercise/stats-exercise-chart-card.component.{ts,html}` — register the new tab button (strength branch only, not cardio) and route to the new chart component.
- `src/app/assets/i18n/en.json` — add `common.totalReps` (or `statsExercise.totalReps`) translation key. Per project convention, only `en.json` is updated.

## New elements to create
- `primary_adapters/stats-exercise/total-reps-line-chart.component.{ts,html,scss}` — standalone, OnPush, mirrors `volume-line-chart.component` shape, reads `occurrences` input and renders the SVG line/area chart for `totalReps`. Uses a light-blue palette (e.g. `#38bdf8` with a matching `lightBlueGrad` linear gradient and `lightBlue` legend class).
- Companion `.spec.ts` for the new chart component.

## State and data flow
1. `ExerciseStatsService.loadForExercise` reads sessions + exercises, computes `totalReps` per occurrence:
   - Pyramid: `pyramidSets.reduce((sum, s) => sum + s.reps, 0)`
   - Normal: `sets * reps`
2. The signal `occurrences` (already exposed via `GetExerciseStatsUseCase`) carries the new field through.
3. `StatsExerciseComponent` template passes the same `occurrences()` to `app-stats-exercise-chart-card`.
4. `ChartSelectionService.selectedChart()` drives which chart is shown; `"reps"` triggers `<app-total-reps-line-chart>`.
5. The chart component derives its SVG points via a `computed()` over the input occurrences (same min/max/scale logic as volume).

## Edge cases to handle
- Empty occurrence list → render the `empty-chart` "no data" placeholder, identical to volume/weight behavior.
- All occurrences have identical totalReps → vertical centering (mirror `maxV === minV` branch in volume chart).
- Pyramid exercise with `pyramidSets = []` (defensive) → fall back to `sets * reps`, matching the existing volume/weight fallback in the service.
- Occurrence with `sets = 0` or `reps = 0` → totalReps = 0, plotted as a normal point.
- Cardio exercises → tab is hidden (only the strength branch shows the new tab); selectedChart "reps" while cardio is active behaves like the existing fallback (cardio shows its own four tabs unchanged).
- Persisted `selectedChart === "reps"` from a previous session must be accepted by `loadFromStorage` (extend whitelist).

## Testing strategy
- **Unit (core_logic):** `exercise-stats.service.spec.ts` — assert `totalReps` is computed correctly for normal exercises, pyramid exercises, empty pyramidSets fallback, and zero-rep edge cases.
- **Unit (primary_adapters):** `chart-selection.service.spec.ts` — assert `"reps"` is accepted as a valid `ChartType`, persisted and restored from localStorage.
- **Component:** `total-reps-line-chart.component.spec.ts` — chartData is null when occurrences are empty; produces correct number of points and polyline string for representative data; centers when min===max.
- **Component:** `stats-exercise-chart-card.component` — the Total Reps tab is rendered in strength mode only, clicking it emits `chartSelect("reps")`, and selecting it renders `<app-total-reps-line-chart>`.

---

## Stories

### Story 1 — Compute totalReps in occurrences
**Goal:** Each `ExerciseOccurrence` carries the total number of reps performed across all sets, for both normal and pyramid exercises.
**Scope:** core_logic/shared: `models.ts` / core_logic/stats-exercise: `exercise-stats.service.ts`, `exercise-stats.service.spec.ts`
**Acceptance criteria:**
- [ ] `ExerciseOccurrence` exposes a numeric `totalReps` field.
- [ ] Normal exercise: `totalReps === sets * reps`.
- [ ] Pyramid exercise with non-empty `pyramidSets`: `totalReps` equals the sum of every `pyramidSets[i].reps`.
- [ ] Pyramid exercise with empty `pyramidSets`: falls back to `sets * reps` (consistent with existing volume fallback).
**Depends on:** none

### Story 2 — Extend ChartType to support "reps"
**Goal:** The chart selection service recognizes, persists, and restores the new `"reps"` chart type.
**Scope:** primary_adapters/stats-exercise: `chart-selection.service.ts`, `chart-selection.service.spec.ts`
**Acceptance criteria:**
- [ ] `ChartType` union includes `"reps"`.
- [ ] `select("reps")` updates the signal and writes to localStorage.
- [ ] On reload, a stored value of `"reps"` is restored (instead of defaulting to `"volume"`).
**Depends on:** none

### Story 3 — Add total-reps line chart component
**Goal:** A new SVG line chart component renders the totalReps curve in light blue, matching the visual structure of the volume chart.
**Scope:** primary_adapters/stats-exercise: `total-reps-line-chart.component.ts`, `.html`, `.scss`, `.spec.ts`
**Acceptance criteria:**
- [ ] Component is standalone, OnPush, takes `occurrences: ExerciseOccurrence[]` as input.
- [ ] Renders the empty-state placeholder when occurrences are empty.
- [ ] Polyline, area gradient, dots, and legend dot are all light blue (e.g. `#38bdf8`).
- [ ] Value labels on data points display the integer reps count, x-axis labels follow the same `getLabelStep` cadence as volume.
**Depends on:** Story 1

### Story 4 — Wire the Total Reps tab into the chart card
**Goal:** Strength exercises show a third tab "Total Reps" that switches the chart card to the new component.
**Scope:** primary_adapters/stats-exercise: `stats-exercise-chart-card.component.ts`, `.html` / src/app/assets/i18n: `en.json`
**Acceptance criteria:**
- [ ] In strength mode, three tabs are rendered: Volume, Weight, Total Reps.
- [ ] In cardio mode, the existing four tabs are unchanged (no Total Reps).
- [ ] Clicking the Total Reps tab emits `chartSelect("reps")` and sets the active state on that button.
- [ ] When `selectedChart() === "reps"` in strength mode, `<app-total-reps-line-chart>` is rendered with the current occurrences.
- [ ] A new `en.json` translation key (e.g. `common.totalReps`) is used as the tab label.
**Depends on:** Story 2, Story 3
