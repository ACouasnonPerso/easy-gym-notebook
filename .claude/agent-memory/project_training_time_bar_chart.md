---
name: project_training_time_bar_chart
description: Training time bar chart — mode-aware date labels implemented and all 23 tests green
type: project
---

Feature `TrainingTimeBarChartComponent` fully implemented with mode-aware labels.

**Why:** The chart groups sessions by day/week/month/year (resolved via `resolveAutoMode`). The bottom label under each bar must reflect the effective grouping mode, not always show `dd/mm`.

**How to apply:** `formatDateLabel(date, mode)` dispatches on the resolved mode:
- `day` → `"29/03"` (dd/mm)
- `week` → `"S13"` (ISO week number)
- `month` → `"Jan"`, `"Fév"`, … (French abbreviated month names array)
- `year` → `"2026"`

`BarChartMode` now includes `'year'`. `MODE_ORDER`, `getGroupKey`, and `resolveAutoMode` all handle `year`. `bars()` computed passes the resolved mode to `formatDateLabel`.

ISO week logic is in the standalone `getISOWeekNumber()` function (Thursday-anchored, used by both `getGroupKey` and `formatDateLabel`).

All 23 tests green as of 2026-03-29.
