---
name: project_training_time_bar_chart
description: Training time bar chart feature — fully implemented with 9 tests green as of 2026-03-26
type: project
---

Training time bar chart feature (stats-global page) fully implemented and all 9 tests green as of 2026-03-26.

**Why:** Visualizes session durations per month as a bar chart, complementing the existing month summary stats.

**How to apply:** No outstanding work. Feature is complete. The `sessionDurationsInMonth` computed was also used to fix pre-existing TranslateService failures in stats-global.component.spec.ts (went from 15 to 17 tests passing there, and reduced overall suite failures from 105 to 91).

Key files:
- `src/app/core_logic/stats-global/stats.service.ts` — added `SessionDuration` interface and `sessionDurationsInMonth` computed
- `src/app/primary_ports/stats-global/get-global-stats.usecase.ts` — relays `sessionDurationsInMonth`
- `src/app/primary_adapters/stats-global/training-time-bar-chart.component.ts` — new standalone OnPush component
- `src/app/primary_adapters/stats-global/stats-global.component.html` — added `@if` block with `data-testid="training-time-bar-chart"`
- `src/app/primary_adapters/stats-global/stats-global.component.spec.ts` — fixed with `TranslateModule.forRoot` + `FakeTranslateLoader`
