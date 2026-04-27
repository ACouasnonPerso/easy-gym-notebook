# Stats Muscle Donut Card — Percentage / Weight Inconsistency Fix

## What this feature does
Aligns the percentage shown for each muscle group in the donut chart with the
weight (volume) actually displayed for that group, so users no longer see cases
like "Biceps 15% — 11.15t" alongside "Triceps 14% — 14.22t".

## Root cause
In `core_logic/stats-global/stats.service.ts`, `muscleGroupDistribution` and
`muscleGroupDetails` compute percentages by **counting exercises per primary
`muscleGroup`** (occurrence count), while the donut card displays a **volume**
(`totalLoadKg = Σ computeVolume(e)`) next to that same percentage. The two
metrics are uncorrelated, so a group with many light exercises can rank above a
group with few heavy ones. A secondary issue: in
`primary_adapters/stats-global/donut-chart.component.ts`, `totalLoad` rounds
to whole tonnes (`Math.round(totalKg / 1000)`) before formatting, losing the
decimal that per-group rows still display — so individual loads can sum to
more than the displayed total.

## Decision
Make the percentage represent **share of total volume (kg)**, not share of
exercise count. This is the metric users intuitively expect when "%" sits next
to a tonnage. The Largest Remainder Method (already in place) is kept to
guarantee that displayed integer percentages sum to exactly 100.

## Design pattern
No new pattern — the existing **computed signal pipeline** (Reactive/Observer
via Angular signals) already fits. We only correct the input series to the
allocator.

## Affected areas
- `core_logic/stats-global/stats.service.ts` — `muscleGroupDistribution`,
  `muscleGroupDetails` (percentage source = `totalLoadByGroup`, not `counts`)
- `primary_adapters/stats-global/donut-chart.component.ts` — `totalLoad`
  computed (use the same formatting as `formatLoad`, no premature rounding to
  whole tonnes)
- `primary_adapters/stats-global/donut-chart.component.spec.ts` and
  `core_logic/stats-global/stats.service.spec.ts` — extend coverage

## New elements to create
None. Bug fix only; no new files, no new layers.

## State and data flow
1. `_exercisesInMonth` (computed) — unchanged.
2. New intermediate per-group `totalLoadKg` map built from `computeVolume(e)`,
   keyed by `e.muscleGroup` (we keep using the primary muscle to stay
   consistent with the legend rows; broadening to `e.muscleGroups` is out of
   scope and would change semantics).
3. Percentages = `Largest Remainder Method` applied to that load map (not the
   count map). Groups with zero load are excluded.
4. `muscleGroupDistribution` and `muscleGroupDetails` both read from the
   same per-group load map — guaranteeing the legend `%`, the popover `%`,
   and the displayed `totalLoadKg` all agree.
5. `totalLoad` in the donut center sums per-group `totalLoadKg` and formats
   with the same rule as legend rows (no rounding to integer tonnes).

## Edge cases to handle
- Exercises with `muscleGroup === null` → ignored (already handled).
- Exercises with `computeVolume === 0` (e.g. cardio, bodyweight w/o reps) →
  excluded from the distribution so they do not consume a 0% slot. If every
  exercise has volume 0, return an empty Map (donut shows the empty state).
- Single muscle group → 100% (Largest Remainder yields 100 trivially).
- Two groups whose exact share is 50.5 / 49.5 → must sum to 100 after rounding.
- Volumes that are floats (e.g. distance-based volumes) → percentage math
  must use the raw float; only the final integer rounding is applied.
- `totalLoad` center label must equal the sum of per-group displayed loads
  within the same formatting precision.

## Testing strategy
Unit tests on `StatsService` (use case layer) and component tests on
`DonutChartComponent` (presentation layer).

**`stats.service.spec.ts` — new cases for `muscleGroupDistribution` and
`muscleGroupDetails`:**
- Returns percentages proportional to **volume**, not exercise count
  (regression test: 1 heavy chest exercise vs 3 light back exercises →
  chest % > back %).
- Percentages always sum to exactly 100 across 2, 3 and 5 groups, including
  cases where exact shares end in `.5`.
- A group with 0 volume is excluded from the result.
- Ordering of `Map` entries is preserved across both computeds so the legend
  and the popover stay in sync.

**`donut-chart.component.spec.ts` — new cases:**
- `totalLoad` equals the sum of per-segment displayed loads (no integer-tonne
  rounding drift) for a fixture summing to e.g. 99.37t.
- Legend `%` for a group equals `details().get(group)?.percentage` for the
  same group (cross-consistency test).

## Stories

### Story 1 — Switch percentage source from exercise count to volume
**Goal:** Make `muscleGroupDistribution` and `muscleGroupDetails` compute
percentages from per-group total volume, so the % shown next to each muscle
group is directly proportional to its displayed weight.
**Scope:** core_logic: `stats-global/stats.service.ts` /
core_logic: `stats-global/stats.service.spec.ts`
**Acceptance criteria:**
- [ ] Given 1 chest exercise of 5000 kg volume and 3 back exercises summing
      to 1500 kg volume, chest percentage is greater than back percentage.
- [ ] For any fixture with at least one non-zero-volume group, the sum of
      returned percentages is exactly 100.
- [ ] Groups whose total volume is 0 are absent from the returned Map.
- [ ] `muscleGroupDistribution` and `muscleGroupDetails` return the same
      percentage for any given group on the same input.
**Depends on:** none

### Story 2 — Fix donut center total to match the sum of per-group loads
**Goal:** Stop rounding the donut-center total to whole tonnes so it matches
the sum of the per-group loads shown on click.
**Scope:** primary_adapters: `stats-global/donut-chart.component.ts` /
primary_adapters: `stats-global/donut-chart.component.spec.ts`
**Acceptance criteria:**
- [ ] For a fixture whose per-group loads sum to 99.37t, `totalLoad()`
      formats to the same value the legend popovers would sum to (no integer
      tonnage drift).
- [ ] `totalLoad()` uses the same kg/t threshold and formatting helper as
      `formatLoad`.
- [ ] An empty `details()` map still yields a sensible "0 kg"-style display.
**Depends on:** none

### Story 3 — Cross-consistency test: legend % equals popover %
**Goal:** Lock in that the legend percentage and the per-group popover
percentage cannot drift apart in future refactors.
**Scope:** primary_adapters: `stats-global/donut-chart.component.spec.ts`
**Acceptance criteria:**
- [ ] For each segment rendered, the `.legend-pct` text equals
      `details().get(group)?.percentage + "%"`.
- [ ] Test runs against a fixture with at least 3 muscle groups including
      one whose volume share has a `.5` fractional part.
**Depends on:** Story 1
