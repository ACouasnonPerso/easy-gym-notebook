---
name: muscle donut card percentage/volume inconsistency
description: Donut chart % was computed from exercise count while displayed weight was per-group volume — fix switches % source to volume
type: project
---

`StatsService.muscleGroupDistribution` and `muscleGroupDetails` historically
computed muscle-group percentages from **exercise occurrence count**, while
the donut card (`primary_adapters/stats-global/donut-chart.component.ts`)
displays per-group `totalLoadKg` (sum of `computeVolume`). This produced
visible inconsistencies (e.g. Biceps 15% / 11.15t shown above Triceps 14% /
14.22t).

Secondary bug: `totalLoad` in the donut center used
`Math.round(totalKg / 1000)`, dropping the decimal so the centre tonnage
could differ from the sum of the per-group rows.

**Why:** users read the %% as "share of weight lifted", not "share of
exercises performed". Brainstorm finalised 2026-04-27 in
`.claude/brainstorming/stats-muscle-donut-card-fix.md`.

**How to apply:** when touching `stats.service.ts` muscle aggregations, keep
the percentage source aligned with whatever value is displayed alongside
(currently volume). Keep the Largest Remainder Method to guarantee sum=100.
Exclude zero-volume groups (cardio / bodyweight without reps) from the
distribution. Ensure `donut-chart.component.ts` `totalLoad` uses the same
formatting as per-group `formatLoad`.
