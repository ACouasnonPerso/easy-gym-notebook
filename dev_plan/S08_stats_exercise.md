# S08 — Stats Exercise: per-exercise progression chart and history

## Goal
Implement the per-exercise statistics page showing the progression of weight and volume over time via a dual-axis line chart and a chronological occurrence history.

## Scope
- `src/app/core_logic/stats-exercise/exercise-stats.service.ts`
- `src/app/primary_ports/stats-exercise/get-exercise-stats.usecase.ts`
- `src/app/primary_adapters/stats-exercise/stats-exercise.component.ts` + template + SCSS
- `src/app/primary_adapters/stats-exercise/dual-line-chart.component.ts`

HTML reference: `design/fitness-app-page-3-5.html` (vue stats exercice non rendue explicitement — inférer le style depuis les autres pages) — **référence visuelle uniquement** pour les couleurs, typographie, disposition dark card. Ne pas recopier le HTML statique ; implémenter la logique Angular complète (ExerciseStatsService, DualLineChart SVG dynamique, historique trié).

Out of scope: global stats (S07).

## Technical context
- Angular 21 — standalone, `OnPush`, `input()` / `output()`, `inject()`
- Requires S01 (repositories)
- `exerciseName` passed as route param — URI-encoded, decode with `decodeURIComponent()`
- Only `validated` exercises are included in occurrences
- Chart is pure SVG, no external charting library; responsive via `viewBox` + `width: 100%`
- Two Y-axes: left for weight (kg, blue), right for volume (kg, orange)

## Tasks

### ExerciseStatsService
- [ ] Create `src/app/core_logic/stats-exercise/exercise-stats.service.ts` — inject `SESSION_REPOSITORY` and `EXERCISE_REPOSITORY`; `_occurrences` signal
- [ ] `loadForExercise(exerciseName: string)`: load all sessions and exercises in parallel; build `sessionDateMap: Map<sessionId, Date>`; filter exercises by `name === exerciseName && status === 'validated'`; map to `ExerciseOccurrence[]` (compute `volumeKg = weightKg × sets × reps`, look up date from map); sort ascending by date; set signal

### Use case
- [ ] Create `get-exercise-stats.usecase.ts` — exposes `occurrences` signal from `ExerciseStatsService`; `execute(exerciseName)` calls `statsService.loadForExercise(exerciseName)`

### DualLineChartComponent
- [ ] Create `dual-line-chart.component.ts` — `OnPush`, input: `occurrences: ExerciseOccurrence[]`
- [ ] SVG `viewBox="0 0 320 200"`, `width="100%"` (responsive); padding: 40px left, 40px right, 24px top, 32px bottom
- [ ] Compute `plotWidth = 320 - 80`, `plotHeight = 200 - 56`
- [ ] Compute X coordinates: `x[i] = 40 + (i / (n-1)) * plotWidth` (uniform spacing by index, not by time — acceptable per spec)
- [ ] Left Y axis (weight): `y = 24 + plotHeight - ((value - minWeight) / (maxWeight - minWeight)) * plotHeight`; use `minWeight = 0` if only one point
- [ ] Right Y axis (volume): same formula with volume values
- [ ] Render two `<polyline>` elements: blue for weight, orange for volume; `fill="none"`, `stroke-width="2"`
- [ ] Render `<circle r="4">` data points for each occurrence on both lines
- [ ] X-axis labels: date formatted as `dd/MM` below each point (skip if too many — show every Nth)
- [ ] Y-axis labels: min and max values for each axis (left = weight, right = volume)
- [ ] Handle edge case: 0 or 1 occurrence — show empty chart message or single point (no line)

### StatsExerciseComponent
- [ ] Create `stats-exercise.component.ts` — `OnPush`; reads `exerciseName = decodeURIComponent(route.snapshot.params['exerciseName'])` in `ngOnInit`; calls `GetExerciseStatsUseCase.execute(exerciseName)`
- [ ] Display exercise name as page title
- [ ] Render `DualLineChartComponent` with `occurrences()` signal
- [ ] Render chronological history list: each row shows date (formatted `dd MMMM yyyy`), weight (`N kg`), sets, reps, volume (`N kg total`)
- [ ] "Back" button (← or `location.back()`) — navigates to previous page (works from both session detail and stats global)
- [ ] Empty state: when `occurrences().length === 0`, show "Aucune donnée pour cet exercice"
- [ ] Style: dark card layout, blue/orange color coding matching the two chart lines, consistent with rest of app

## Acceptance criteria
- Navigating to `/stats/Curl%20halt%C3%A8res` loads data for the exercise named "Curl haltères"
- Chart renders one line per metric; both lines use the full plot height range
- History list shows entries sorted oldest → newest
- Only `validated` occurrences are shown (pending/cancelled excluded)
- "Back" returns to the correct previous page
- Empty state displayed when no validated occurrences exist for the exercise
- Single occurrence: chart shows a single dot, no polyline

## Notes
- `location.back()` is acceptable for back navigation; inject Angular `Location` service from `@angular/common`
- X-axis spacing by index (not real time) is correct per spec — do not attempt calendar-proportional spacing
- If `maxWeight === minWeight` (all same weight), use `yCenter = plotHeight / 2` for all points to avoid division by zero
- The `dual-line-chart` component will only receive data after `loadForExercise` completes — handle the initial empty signal gracefully (render nothing until data arrives)
- **Performance** : l'historique est filtré par exercice (un seul nom). Un utilisateur très assidu sur plusieurs années pourrait atteindre ~300–400 occurrences d'un même exercice. Le rendu de 300 lignes DOM simples est acceptable. Le chart SVG avec 300 points peut devenir dense — limiter les labels X (afficher 1 label sur N, N calculé pour ne pas dépasser ~10 labels visibles). Pas de pagination nécessaire pour MVP.
