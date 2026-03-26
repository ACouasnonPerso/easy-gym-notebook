# S07 — Stats Global: heatmap, donut chart, month selector, exercise list

## Goal
Implement the global statistics dashboard with monthly filtering, regularity heatmap, muscle group donut chart, summary cards, weekly averages, and a clickable exercise list.

## Scope
- `src/app/core_logic/stats-global/stats.service.ts`
- `src/app/primary_ports/stats-global/get-global-stats.usecase.ts`
- `src/app/primary_ports/stats-global/select-month.usecase.ts`
- `src/app/primary_adapters/stats-global/stats-global.component.ts` + template + SCSS
- `src/app/primary_adapters/stats-global/heatmap.component.ts`
- `src/app/primary_adapters/stats-global/donut-chart.component.ts`
- `src/app/primary_adapters/stats-global/exercise-summary-row.component.ts`

HTML reference: `design/fitness-app-page-3-5.html` (page 5 — Stats) — **référence visuelle uniquement** : disposition des cartes résumé, heatmap, donut, liste exercices, couleurs et typographie. Ne pas recopier le HTML statique ; implémenter la logique Angular complète (StatsService, computed signals, filtrage par mois réactif).

Out of scope: per-exercise stats page (S08).

## Technical context
- Angular 21 — standalone, `OnPush`, `input()` / `output()`, `inject()`
- Requires S01 (repositories), S02 (sessions must exist in localStorage to show real data)
- All stats derived via Angular `computed()` signals — no manual refresh needed when `selectedMonth` changes
- `StatsService` loads all sessions and exercises once into raw signals; all filtering/aggregation via `computed()`
- Heatmap uses CSS Grid, no external charting library
- DonutChart uses inline SVG with `stroke-dasharray` technique

## Tasks

### StatsService
- [ ] Create `src/app/core_logic/stats-global/stats.service.ts` — inject `SESSION_REPOSITORY` and `EXERCISE_REPOSITORY`; signals: `_allSessions`, `_allExercises`, `selectedMonth` (default: `new Date()` — mois courant)
- [ ] `load()`: `Promise.all([sessionRepo.getAll(), exerciseRepo.getAll()])`, sets both signals
- [ ] `setMonth(month: Date)`: sets `selectedMonth` signal
- [ ] `sessionsInMonth` (private computed): filter `_allSessions` by `year === selectedMonth.year && month === selectedMonth.month`
- [ ] `exercisesInMonth` (private computed): filter exercises by sessionIds in `sessionsInMonth` where `status === 'validated'`
- [ ] `heatmapData` (readonly computed): array de `HeatmapCell` couvrant les **semaines complètes** encadrant le mois sélectionné (lundi→dimanche). Inclut les jours des mois adjacents pour remplir la première et dernière ligne.
  - Type : `{ date: Date, hasSession: boolean, isCurrentMonth: boolean }[]`
  - `gridStart` = lundi de la semaine contenant le 1er du mois ; `gridEnd` = dimanche de la semaine contenant le dernier jour du mois
  - Itérer de `gridStart` à `gridEnd` (inclus) par pas de 1 jour
  - `hasSession` vérifié sur **`_allSessions()`** (pas seulement le mois en cours) pour que les jours adjacents soient aussi colorés correctement si une séance existe
  - `isCurrentMonth = cell.date.getMonth() === selectedMonth.getMonth() && cell.date.getFullYear() === selectedMonth.getFullYear()`
  - Helper interne `toDateKey(d: Date): string` → `"YYYY-M-D"` pour comparaison rapide via `Set<string>`
- [ ] `monthSummary` (readonly computed): `{ totalWeightKg, sessionCount, totalDurationSeconds }` — basé sur `sessionsInMonth`
- [ ] `weeklyAverage` (readonly computed): `{ avgWeightKg, sessionsPerWeek, avgDurationSeconds }` — divide by `Math.ceil(daysInMonth / 7)`
- [ ] `muscleGroupDistribution` (readonly computed): `Map<MuscleGroup, number>` (percentage per group, rounded); return empty Map if no exercises
- [ ] `exerciseSummaries` (readonly computed): array of `{ name, maxWeightKg, totalVolumeKg, occurrenceCount }` sorted by `totalVolumeKg` descending

### Use cases
- [ ] Create `get-global-stats.usecase.ts` — exposes all computed signals from `StatsService`; `execute()` calls `statsService.load()`
- [ ] Create `select-month.usecase.ts` — exposes `selectedMonth` signal; `execute(month: Date)` calls `statsService.setMonth(month)`

### HeatmapComponent
- [ ] Create `heatmap.component.ts` — `OnPush`, input: `data: { date: Date, hasSession: boolean, isCurrentMonth: boolean }[]`
- [ ] CSS Grid `grid-template-columns: repeat(7, 1fr)` — **pas de `grid-column-start`** : le tableau commence toujours un lundi (calculé dans `StatsService`), donc la grille est naturellement alignée
- [ ] En-tête fixe de 7 cellules : labels `L M M J V S D` (une ligne statique au-dessus du `@for`)
- [ ] `@for (cell of data(); track cell.date.toISOString())` — rendre chaque cellule avec :
  - `hasSession && isCurrentMonth` → fond orange/accent, numéro du jour visible
  - `!hasSession && isCurrentMonth` → fond gris sombre, numéro du jour visible
  - `isCurrentMonth === false` → même logique couleur (`hasSession` ou non) mais `opacity: 0.3`
- [ ] Afficher le numéro du jour (`date.getDate()`) dans chaque cellule

### DonutChartComponent
- [ ] Create `donut-chart.component.ts` — `OnPush`, input: `distribution: Map<MuscleGroup, number>`
- [ ] SVG implementation: single `<circle>` per segment using `stroke-dasharray: dashLen circumference` and `stroke-dashoffset: -offset` (where offset is sum of previous segment lengths); `r=70`, `circumference ≈ 439.8`
- [ ] 13 distinct colors (one per `MuscleGroup` enum value) — define as a constant color map in the component
- [ ] Legend below chart: colored dot + label + percentage for segments > 0

### ExerciseSummaryRowComponent
- [ ] Create `exercise-summary-row.component.ts` — `OnPush`, inputs: `exerciseName`, `maxWeightKg`, `totalVolumeKg`, `occurrenceCount`; output: `selected: string`
- [ ] On click: emit `exerciseName`

### Stats global page
- [ ] Create `stats-global.component.ts` — `OnPush`, calls `GetGlobalStatsUseCase.execute()` in `ngOnInit`
- [ ] Month selector: `<select>` populated with last 12 months + current month (formatted as `MMMM yyyy`); default value = current month; on `change` call `SelectMonthUseCase.execute(new Date(selectedYear, selectedMonth))`
- [ ] Render `HeatmapComponent` with `heatmapData()` signal
- [ ] Render 3 summary cards: total weight (`totalWeightKg | number:'1.0-0'` + `kg`), sessions, total duration
- [ ] Render 3 average cards: avg weight/week, sessions/week, avg duration
- [ ] Render `DonutChartComponent` with `muscleGroupDistribution()`
- [ ] Render `@for (ex of exerciseSummaries(); track ex.name)` using `ExerciseSummaryRowComponent`; on `(selected)` navigate to `/stats/${encodeURIComponent($event)}`
- [ ] Style matching `fitness-app-page-3-5.html`: dark cards, orange accents, section labels

## Acceptance criteria
- Changing the month selector recomputes all stats instantly (no reload) via signal reactivity
- La heatmap affiche des semaines complètes (lundi→dimanche) : les premiers et derniers jours provenant des mois adjacents sont visibles à `opacity: 0.3`
- La colonne de chaque jour correspond à son jour de la semaine (lundi en col 1, dimanche en col 7)
- Les cellules orange correspondent exactement aux jours où une séance existe (tous mois confondus pour les jours adjacents)
- Un mois qui commence un mercredi a 2 cellules vides (lun, mar) en opacité 0.3 issues du mois précédent
- Heatmap shows colored cells only on days with at least one session
- Par défaut, la heatmap affiche le mois de la date courante
- DonutChart renders correct proportions; total of all percentages ≈ 100
- Summary cards show 0/empty state when no data for the selected month
- Exercise list sorted by total volume descending
- Clicking an exercise row navigates to `/stats/:encodedName`

## Notes
- Month `<select>` must be populated by generating 12 months backwards from today — do this in `ngOnInit`, not in the template
- `weeklyAverage` calculation uses a fixed number of weeks (ceiling of days/7), not the actual ISO week count — keep consistent with spec
- **Performance** : la liste `exerciseSummaries()` est filtrée par mois — un utilisateur ne fait jamais plus de ~30–50 exercices distincts sur un même mois. Pas de pagination nécessaire ici ; rendre tous les résultats est acceptable. Si cette hypothèse évolue, la `ScrollSentinelDirective` de S02 est réutilisable.

### Logique de calcul de `heatmapData` (référence d'implémentation)

```ts
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dim, 1=Lun, ..., 6=Sam
  const diff = day === 0 ? -6 : 1 - day; // offset vers lundi
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getSundayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day; // offset vers dimanche
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Dans StatsService.heatmapData (computed) :
const year = selectedMonth.getFullYear();
const month = selectedMonth.getMonth();
const firstDay = new Date(year, month, 1);
const lastDay  = new Date(year, month + 1, 0);
const gridStart = getMondayOfWeek(firstDay);
const gridEnd   = getSundayOfWeek(lastDay);

const sessionDates = new Set(
  _allSessions().map(s => `${s.date.getFullYear()}-${s.date.getMonth()}-${s.date.getDate()}`)
);

const cells: HeatmapCell[] = [];
const cursor = new Date(gridStart);
while (cursor <= gridEnd) {
  cells.push({
    date: new Date(cursor),
    hasSession: sessionDates.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`),
    isCurrentMonth: cursor.getMonth() === month && cursor.getFullYear() === year,
  });
  cursor.setDate(cursor.getDate() + 1);
}
```

- Un mois de 28 jours commençant un lundi → 4 lignes exactes (28 cellules, 0 jour adjacent)
- Un mois de 31 jours commençant un samedi → `gridStart` = lundi précédent (5 jours adjacents début) + `gridEnd` = dimanche suivant (5 jours adjacents fin) → 6 lignes × 7 = 42 cellules
- `toDateKey` utilise `getMonth()` / `getDate()` (pas `getUTCMonth()`) — cohérence avec le reste de l'app
