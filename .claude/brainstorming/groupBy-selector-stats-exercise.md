# Group-By Selector & Trend Regression on Exercise Stats Charts

> Status: Discovery answers confirmed (2026-05-21). Ready for `/orchestrator`.

## What this feature does

On the exercise stats page (`/stats/exercise/:name`), let the user choose how
chart data points are grouped over time — *each session*, *per week*, *per
month*, or *per year* — so dense histories become readable trends.
In addition, once a chart shows enough points (>= 6), an automatic linear
regression line is overlaid with a small percentage label at its far right end
to surface the overall trend at a glance.

## Confirmed discovery answers

1. **Available granularities** — `session` (current behaviour, one point per
   occurrence), `week`, `month`, `year`. *Day* dropped: same-day duplicate
   sessions are rare and `session` already covers it.
2. **Aggregation rule per granularity** —
   - `weight` -> **average** of session weights within the bucket
   - `volume` -> **sum** within the bucket
   - `reps` -> **sum** within the bucket
   - cardio `duration` -> sum
   - cardio `distance` -> sum
   - cardio `pace` / `speed` -> weighted average by duration
3. **Persistence scope** — **None.** Selection is purely ephemeral state in
   `StatsExerciseComponent` (a local signal). It resets to `session` on every
   visit. No `localStorage`, no dedicated persistence service.
4. **Bucket boundaries** — ISO weeks (Mon-Sun), calendar months (1st-last
   day), calendar years (Jan 1-Dec 31), in the device's local timezone.
5. **Empty buckets** — **Skipped**, not drawn as zero. The X axis shows only
   buckets that contain at least one occurrence (e.g. March -> May if April is
   empty).
6. **Regression scope** — Regression applies to every chart (lifting + cardio).
   Computed on the **displayed grouped points**, not on raw occurrences, so it
   tracks what the user currently sees.
7. **X-axis label format per granularity** —
   - `session` -> existing date label (unchanged)
   - `week` -> `S12` (ISO week number, prefixed `S`)
   - `month` -> `Mar` (3-letter abbreviated month name, localized)
   - `year` -> `2026` (full 4-digit year)
8. **Visual style of the selector** — **Orange dropdown** matching
   `stats-month-selector.component` from the global stats page. Not a tab strip.

## Existing utilities to respect

- `primary_adapters/stats-exercise/label-step.ts` exposes `getLabelStep(n)`,
  a label-display-frequency reducer (e.g. 25 raw labels -> show every 5th).
  It does **not** aggregate data; all points are still rendered. Every chart
  component already calls it. **Keep using it after grouping** — with fewer
  points post-grouping, it will simply return `1` most of the time, which is
  the desired behaviour. No change required to `label-step.ts`.
- There is **no pre-existing data aggregation / bucketing system** in the
  codebase. This feature introduces the first one.

## Design pattern

**Strategy** — each granularity (`session` / `week` / `month` / `year`) is an
interchangeable aggregation strategy applied to the raw occurrence stream
before charting. Adding a new granularity later means adding one strategy, not
editing every chart.

## Affected areas

- `primary_adapters/stats-exercise/stats-exercise.component.{ts,html}` — host
  the new group-by dropdown above the chart card; hold the ephemeral `groupBy`
  signal.
- `primary_adapters/stats-exercise/stats-exercise-chart-card.component.{ts,html}`
  — accept the resolved granularity (or already-grouped occurrences).
- `primary_adapters/stats-exercise/{weight,volume,total-reps,cardio-time,cardio-distance,cardio-pace,cardio-speed}-line-chart.component.{ts,html}`
  — render regression overlay + percentage label; format X-axis labels
  according to the active granularity.

## New elements to create

- `core_logic/stats-exercise/group-by.model.ts` —
  `GroupBy = 'session' | 'week' | 'month' | 'year'`.
- `core_logic/stats-exercise/exercise-occurrence-grouping.service.ts` — pure
  service that groups `ExerciseOccurrence[]` / `CardioOccurrence[]` by a
  `GroupBy`, applying the aggregation rules above. Returns the same occurrence
  shape so chart components stay unchanged.
- `core_logic/stats-exercise/linear-regression.service.ts` — pure service:
  given `{x, y}[]` returns `{ slope, intercept, startY, endY, percent }` using
  least-squares.
- `primary_adapters/stats-exercise/group-by-selector.component.{ts,html,scss}`
  — orange dropdown styled identically to
  `primary_adapters/stats-global/stats-month-selector.component.*`. Four
  options: Session / Week / Month / Year.
- `primary_adapters/stats-exercise/regression-overlay.ts` — pure helper that
  turns `LinearRegressionService` output into SVG-ready coords
  (`x1,y1,x2,y2,labelX,labelY,labelText,visible`) using the same `viewBox`
  (40..280 horizontally, 20..110 vertically) the charts already use.

## State and data flow

1. `StatsExerciseComponent` owns a local `groupBy` signal (default `'session'`,
   no persistence). Reset on every page visit.
2. `GetExerciseStatsUseCase` keeps returning raw occurrences. The chart card
   receives both raw arrays and the current `groupBy`.
3. Inside the chart card (or via `computed` in each chart), the
   `ExerciseOccurrenceGroupingService` collapses raw occurrences into the
   grouped occurrence list passed to the chart components.
4. Each chart component computes its existing `chartData` from the grouped
   list (continuing to use `getLabelStep` from `label-step.ts`), then derives a
   regression overlay via `LinearRegressionService` + `regression-overlay`
   helper. All as `computed()` signals.
5. X-axis label format depends on `groupBy`: `session` keeps existing date
   formatting; `week` -> `S{isoWeek}`; `month` -> 3-letter month name; `year`
   -> 4-digit year.
6. The history list below the charts is **not** affected — it keeps showing
   raw occurrences.

## Edge cases to handle

- Fewer than 2 grouped points -> no polyline, no regression (already current
  behaviour for n<=1).
- 2-5 grouped points -> polyline drawn, regression hidden (threshold 6).
- All Y values equal -> slope is 0, percent is 0%, label hidden (below 5%).
- First predicted value <= 0 (e.g. reps starting at 0) -> hide the label.
- Missing optional fields (cardio `distanceKm = null`) -> excluded from the
  bucket aggregate, not treated as 0 (matches existing chart filters).
- Empty buckets (no occurrences) -> skipped entirely; consecutive non-empty
  buckets sit side-by-side on the X axis.
- Bucket spanning DST change -> use local calendar boundaries; do not adjust
  for DST.
- Single bucket after grouping (e.g. one year with many sessions) -> chart
  degenerates to one point, regression hidden.
- Group-by change while a chart is mounted -> all derived `computed`s
  recompute automatically.

## Testing strategy

- **Unit (`core_logic`):** `ExerciseOccurrenceGroupingService` — one test per
  granularity x aggregation rule (weight average, volume sum, reps sum, cardio
  rules), edge cases (empty input, single occurrence, buckets spanning year
  boundary, empty intermediate buckets skipped).
- **Unit (`core_logic`):** `LinearRegressionService` — known fixtures (perfect
  ascending, perfect descending, flat, < 6 points returning null), percent
  rounding, division-by-zero guard.
- **Unit (`primary_adapters`):** `regression-overlay` helper — clamps to the
  chart viewBox, hides label below 5% threshold, sign formatting (`+23%` /
  `-15%`).
- **Component (`primary_adapters`):** `GroupBySelectorComponent` emits the
  right `GroupBy` value on selection; selected state reflects the input;
  dropdown style mirrors `stats-month-selector`.
- **Component:** each chart renders the regression `<line>` only when
  `points.length >= 6`, the label only when `|percent| >= 5`, and the
  per-granularity X-axis label format.
- **Integration:** `StatsExerciseComponent` — changing the dropdown
  re-renders the chart card with grouped data; selection resets to `session`
  on re-entry (no persistence).

## Stories

### Story 1 — Domain model & grouping service
**Goal:** Provide a pure, testable way to collapse raw exercise occurrences
into session / week / month / year buckets so charts can consume a uniform
stream.
**Scope:** core_logic: `stats-exercise/group-by.model.ts`,
`stats-exercise/exercise-occurrence-grouping.service.ts` (+ spec)
**Acceptance criteria:**
- [ ] `group(occurrences, 'session')` returns the input unchanged (sorted).
- [ ] `group(..., 'week')` aggregates per ISO week (weight=avg, volume=sum,
      reps=sum, cardio per rules).
- [ ] `group(..., 'month')` aggregates per calendar month using the same rules.
- [ ] `group(..., 'year')` aggregates per calendar year using the same rules.
- [ ] Empty intermediate buckets are skipped (no zero-filling); cardio variant
      excludes null `distanceKm` from the aggregate.
**Depends on:** none

### Story 2 — Group-by selector dropdown component
**Goal:** Render an orange dropdown letting the user pick Session / Week /
Month / Year, visually identical to `stats-month-selector`.
**Scope:** primary_adapters:
`stats-exercise/group-by-selector.component.{ts,html,scss}` (+ spec),
translations: add `statsExercise.groupBy.session|week|month|year` keys to
`en.json`.
**Acceptance criteria:**
- [ ] Dropdown exposes four options (Session, Week, Month, Year); selected
      option matches the `selected` input.
- [ ] Picking an option emits a `change` output with the matching `GroupBy`.
- [ ] SCSS mirrors `stats-month-selector.component.scss` (orange theme,
      identical typography and shape).
**Depends on:** Story 1
**Skills:** ui-angular

### Story 3 — Wire selector into stats-exercise page (ephemeral signal)
**Goal:** Show the dropdown on the exercise stats page, hold the choice as a
local signal (no persistence), and feed grouped data into the chart card.
**Scope:** primary_adapters:
`stats-exercise/stats-exercise.component.{ts,html}`,
`stats-exercise/stats-exercise-chart-card.component.{ts,html}` (pass-through
of grouped occurrences or `groupBy` signal).
**Acceptance criteria:**
- [ ] Dropdown appears above the chart card; default value is `'session'`.
- [ ] Each chart receives occurrences pre-grouped by the chosen granularity.
- [ ] Selection is **not** persisted: navigating away and back resets it to
      `'session'`.
- [ ] History list below charts is unchanged (still raw occurrences).
**Depends on:** Story 2
**Skills:** ui-angular

### Story 4 — Per-granularity X-axis labels in chart components
**Goal:** Format X-axis labels according to the active granularity so users
read `S12`, `Mar`, `2026` instead of a raw date when applicable.
**Scope:** primary_adapters: all chart components
(`weight-line-chart`, `volume-line-chart`, `total-reps-line-chart`,
`cardio-time-chart`, `cardio-distance-chart`, `cardio-pace-chart`,
`cardio-speed-chart`) `.{ts,html}`. Keep using `label-step.ts` `getLabelStep`
unchanged.
**Acceptance criteria:**
- [ ] `session` granularity keeps existing date label.
- [ ] `week` -> label format `S{isoWeek}` (e.g. `S12`).
- [ ] `month` -> 3-letter localized month name (e.g. `Mar`).
- [ ] `year` -> 4-digit year (e.g. `2026`).
- [ ] `getLabelStep(n)` continues to govern label display frequency.
**Depends on:** Story 3
**Skills:** ui-angular

### Story 5 — Linear regression service
**Goal:** Provide a pure least-squares regression utility usable by every
chart.
**Scope:** core_logic: `stats-exercise/linear-regression.service.ts` (+ spec)
**Acceptance criteria:**
- [ ] Returns `null` for input length < 6.
- [ ] Returns `{ slope, intercept, startY, endY, percent }` for valid input.
- [ ] `percent` is `(endY - startY) / startY * 100`, rounded to integer;
      when `startY <= 0` the result has `percent = null`.
- [ ] Flat input (all y equal) yields slope 0 and percent 0.
**Depends on:** none

### Story 6 — Regression overlay helper & chart rendering
**Goal:** Draw the regression line and trend label on every chart when
applicable.
**Scope:** primary_adapters:
`stats-exercise/regression-overlay.ts` (+ spec),
`stats-exercise/weight-line-chart.component.{ts,html}`,
`stats-exercise/volume-line-chart.component.{ts,html}`,
`stats-exercise/total-reps-line-chart.component.{ts,html}`,
`stats-exercise/cardio-time-chart.component.{ts,html}`,
`stats-exercise/cardio-distance-chart.component.{ts,html}`,
`stats-exercise/cardio-pace-chart.component.{ts,html}`,
`stats-exercise/cardio-speed-chart.component.{ts,html}`,
translations: add `statsExercise.trend` key if needed in `en.json`.
**Acceptance criteria:**
- [ ] Regression `<line>` appears only when grouped points length >= 6.
- [ ] Trend label appears only when `|percent| >= 5`; format `+23%` / `-15%`.
- [ ] Line is clipped to the chart's plotting area (x in 40..280, y in 20..110).
- [ ] Label sits at the right end of the line and stays inside the viewBox.
- [ ] No regression rendered when `LinearRegressionService` returns `null`.
**Depends on:** Story 4, Story 5
**Skills:** ui-angular
