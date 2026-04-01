# Yearly Heatmap

## What this feature does

When the user selects "année en cours" in the period selector, a yearly heatmap replaces the
monthly heatmap: 12 rows (one per month), each row containing one cell per day in that month,
aligned left. Days with a session are highlighted; today gets a distinct colour.

## Relation to cahier des charges

This fills an existing gap. The "current-year" view type already exists in `StatsGlobalComponent`
and already hides the monthly heatmap (`showHeatmap` computed returns `false` for `current-year`).
This feature activates that empty slot with a purpose-built yearly visualisation. No existing
specified behaviour is modified.

## Affected areas

**primary_adapters — stats-global**
- `stats-global.component.html` — add the yearly heatmap card conditionally when
  `selectedViewType() === 'current-year'`, in place of the gap currently left by
  `showHeatmap()` being false
- `stats-global.component.ts` — expose `yearlyHeatmapData` from the use case; add a
  `showYearlyHeatmap` computed that is `true` only for `current-year`

**primary_ports — stats-global**
- `get-global-stats.usecase.ts` — expose the new `yearlyHeatmapData` signal from `StatsService`

**core_logic — stats-global**
- `stats.service.ts` — add a new `yearlyHeatmapData` computed signal

## New elements to create

**primary_adapters/stats-global**
- `yearly-heatmap.component.ts` / `.html` / `.scss` — standalone, OnPush component; accepts
  a `data` input of type `YearlyHeatmapRow[]`; renders 12 rows with a month label and day cells
- `stats-yearly-heatmap-card.component.ts` / `.html` — thin card wrapper (mirrors the pattern
  of `stats-heatmap-card.component`), delegates rendering to `YearlyHeatmapComponent`

**core_logic/stats-global**
- New interface `YearlyHeatmapRow` (defined in `stats.service.ts`, or a shared models file if
  preferred by existing convention): `{ month: number; year: number; cells: YearlyHeatmapCell[] }`
- New interface `YearlyHeatmapCell`: `{ date: Date; hasSession: boolean }`
  (no `isCurrentMonth` needed — all cells belong to their row's month by construction;
  `today` detection handled in the component via `getCellClass`, same pattern as
  `HeatmapComponent.getCellClass`)

## State and data flow

1. `StatsService.yearlyHeatmapData` — new `computed` signal derived from `_allSessions()` and the
   current calendar year. Iterates months 0–11, builds one `YearlyHeatmapRow` per month with one
   `YearlyHeatmapCell` per calendar day (28–31 depending on month, 29 for February in a leap year).
   Leap year detection: `new Date(year, 1, 29).getMonth() === 1`.
   A cell's `hasSession` is `true` if any session date matches that calendar day.

2. `GetGlobalStatsUseCase.yearlyHeatmapData` — passes through the signal directly (same pattern as
   `heatmapData`).

3. `StatsGlobalComponent.showYearlyHeatmap` — `computed(() => this.selectedViewType() === 'current-year')`.

4. `StatsGlobalComponent` template — replaces the empty gap with:
   `@if (showYearlyHeatmap()) { <app-stats-yearly-heatmap-card [data]="getGlobalStatsUseCase.yearlyHeatmapData()" /> }`

5. `YearlyHeatmapComponent` — receives `YearlyHeatmapRow[]` as input signal; iterates rows with
   `@for`; for each row renders a month label (abbreviated, e.g. Jan, Fév) and a flex row of day
   cells left-aligned; `getCellClass` mirrors the existing logic: `today`, `done`, `empty`.
   No `dim` class needed (all cells belong to a real month by construction).

## Edge cases to handle

- **February in a leap year** — row must contain 29 cells, not 28. The data builder must use
  `new Date(year, month + 1, 0).getDate()` to get the exact day count per month.
- **Today's cell** — when today falls in the current year, its cell must receive the `today` CSS
  class regardless of `hasSession`. Uses the same `date.getTime() === today.getTime()` comparison
  as the existing `HeatmapComponent`.
- **No sessions in a month** — all cells render as `empty`; the row and its label still appear
  (the full 12-row structure is always shown).
- **Viewed in a future month (Jan 1 context)** — cells for months that have not yet started show
  all `empty`; no future-suppression logic needed beyond the existing `empty` class.
- **Year boundary** — the component is always computed for `new Date().getFullYear()`, so switching
  away from and back to "année en cours" always reflects the current year; no stale-year risk.

## Testing strategy

**Unit tests — `StatsService.yearlyHeatmapData`**
- 12 rows are always returned for the current year
- Each row's cell count matches the correct number of days for that month
- February row has 29 cells in a leap year and 28 in a non-leap year
- A cell is marked `hasSession: true` when a session exists on that date
- A cell is marked `hasSession: false` when no session exists on that date
- Sessions from a different year do not appear in any row

**Component integration tests — `YearlyHeatmapComponent`**
- 12 month rows are rendered
- Month labels use the abbreviated format (Jan, Fév, …)
- Today's cell receives the `today` CSS class when no session exists
- Today's cell receives both `done` and `today` CSS classes when a session exists
- A cell with a session and not today receives the `done` CSS class
- A cell without a session and not today receives the `empty` CSS class
