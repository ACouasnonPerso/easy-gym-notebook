---
name: project_yearly_heatmap
description: Yearly heatmap feature — 12-row heatmap shown when current-year view is selected, 20 tests green as of 2026-04-01
type: project
---

Yearly heatmap feature fully extended and all 52 related tests green as of 2026-04-01.

**Why:** Initially showed heatmap only for "année en cours". Extended to show for any selected year (e.g. "2024") via new `"year"` view type.

**How to apply:** The feature is fully wired for any year. Follow the same `StatsViewType` pattern if adding more view types.

## Key design
- Past/future year entries in `generateDurations()` use `type: "year"` (not `"month"`)
- `showYearlyHeatmap` returns `true` for both `"current-year"` and `"year"`
- `showHeatmap` excludes `"year"` type (no monthly grid for year views)
- `StatsService.yearlyHeatmapData` uses `selectedMonth().getFullYear()` when `viewType === "year"`
- `StatsService.setYear(year)` sets both `selectedMonth` and `viewType = "year"`
- `onMonthChange` detects `type === "year"` and calls both `selectMonthUseCase` then `selectViewTypeUseCase("year")`
- The linter renamed `months` computed → `durations` and `generateMonths` → `generateDurations` in the component

## Files created
- `src/app/core_logic/stats-global/yearly-heatmap.service.spec.ts` — 13 service unit tests (8 original + 2 new for year-mode)
- `src/app/primary_adapters/stats-global/yearly-heatmap.component.ts/.html/.scss` — display primitive
- `src/app/primary_adapters/stats-global/yearly-heatmap.component.spec.ts` — 6 component tests
- `src/app/primary_adapters/stats-global/stats-yearly-heatmap-card.component.ts/.html` — card wrapper

## Files modified
- `stats.service.ts` — added `"year"` to `StatsViewType`, `setYear()` method, `yearlyHeatmapData` reactive to selected year
- `stats-global.component.ts` — `generateDurations` assigns `type: "year"` for past years; `showYearlyHeatmap`/`showHeatmap`/`barChartMode`/`summaryTitle` handle `"year"` type; `onMonthChange` sets year view correctly
- `stats-global.component.spec.ts` — 5 new tests for multi-year heatmap, all `generateMonths`/`months()` refs updated to `generateDurations`/`durations()`
