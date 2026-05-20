# Highlight Stats

## What this feature does
Displays 1–3 dynamically selected positive metrics on the global stats dashboard, picked from a pool of 6 candidates and scored to favor the user's most frequent exercises over the last 90 days. The section celebrates a recent achievement and surfaces a regularity signal when one is available.

## Design pattern
**Strategy + Composite scoring.** Each metric is a strategy (independent detector returning a candidate with an impact score and optional exerciseId). A selector composes their outputs, applies the favorite-frequency multiplier, sorts, and picks the top 3. This fits because:
- Each metric has its own trigger logic and data window (7 d, 4 w, monthly, etc.).
- New metrics can be added without modifying selection logic (OCP).
- The "perf vs regularity" categorization is a property of the strategy, not the selector.

## Affected areas
- `primary_adapters/stats-global/stats-global.component.ts` and its template — mount the new highlight section above the existing summary card.
- `primary_ports/stats-global/get-global-stats.usecase.ts` — expose the highlights signal from the new service.
- `core_logic/stats-global/stats.service.ts` — only if helper accessors over `_allSessions` / `_allExercises` are needed; otherwise untouched.
- `assets/i18n/en.json` — new translation keys under `statsGlobal.highlights.*` (English only per project convention).

## New elements to create
**core_logic/stats-global/**
- `highlight-stats.service.ts` — orchestrator: pulls raw data from `StatsService`, runs each detector, applies favorite bonus, ranks, exposes a `highlights` computed signal returning at most 3 view models.
- `highlight-metric.model.ts` (or extend existing `models.ts`) — `HighlightMetric` interface (id, category: 'perf' | 'regularity', impactScore, exerciseId?, payload for translation) and `HighlightViewModel` (label key, value, icon, accent).
- `highlight-detectors/` subfolder with one file per strategy: `weight-pr.detector.ts`, `volume-progression.detector.ts`, `most-improved.detector.ts`, `seven-day-streak.detector.ts`, `consecutive-weeks.detector.ts`, `volume-milestone.detector.ts`. Each exports a pure function `(ctx) => HighlightMetric | null`.
- `favorite-exercises.service.ts` — computes top-10 exercise frequency over the last 90 days and exposes a `favoriteBonus(exerciseId): number` helper.

**primary_adapters/stats-global/**
- `stats-highlights-card.component.ts` (+ `.html`, `.scss`) — dumb component, receives `highlights: HighlightViewModel[]` via `input()`, renders 1 or 2 tiles, hides itself when empty.

**Tests (co-located `.spec.ts`):**
- One spec per detector (pure functions, easy to unit-test).
- `highlight-stats.service.spec.ts` covering scoring, favorite bonus application, category balancing (1 perf + 1 regularity when possible), milestone "shown once" persistence boundary.
- `favorite-exercises.service.spec.ts`.
- `stats-highlights-card.component.spec.ts` for rendering and empty-state.

## State and data flow
1. `StatsService.load()` already loads all sessions/exercises into signals — no extra fetch.
2. `FavoriteExercisesService` exposes a `computed` over the last-90-days slice of `_allSessions` / `_allExercises`, returning a `Map<exerciseId, bonus>`.
3. `HighlightStatsService.highlights` is a `computed` signal that:
   - Builds a detector context (all sessions, all exercises, today's date, favorite bonus lookup).
   - Runs every detector; collects non-null candidates.
   - Computes `finalScore = impactScore × (1 + bonus)` (regularity detectors always pass `bonus = 0`).
   - Sorts descending; picks up to 2 perf candidates and up to 1 regularity candidate (falls back to top 3 perfs if no regularity triggers, and up to 3 regularity if no perf triggers).
   - Deduplicates by exerciseId: once an exercise is represented in the selected highlights, no further metric for that same exercise is added (regularity metrics, which have no exerciseId, are exempt from this constraint).
   - Returns at most 3 view models, possibly 0.
4. Volume milestone "shown once per threshold" persists the last acknowledged threshold via the existing localStorage repository pattern — new `secondary_ports/highlight-stats/` with a tiny interface `getLastMilestoneKg() / setLastMilestoneKg()` and a localStorage implementation.
5. `GetGlobalStatsUseCase` re-exports `highlightStats.highlights`. The component reads it via `getGlobalStatsUseCase.highlights()` and conditionally renders the card.

## Edge cases to handle
- Empty data (new user, < 7 days of history): no detector triggers, card is hidden.
- Single session only: all "progression" / "improvement" / "consecutive" detectors return null.
- Volume PR tied with previous max: not a PR (strict `>` with 2.5 kg gain).
- Multiple exercises eligible for the same metric: detector returns the highest-scoring single instance.
- Milestone already shown for current threshold: detector returns null until next threshold is crossed.
- Favorite calculation when fewer than 10 distinct exercises exist in 90 days: assign bonuses to whatever exists, never throw.
- Cardio exercises: excluded from weight-PR and weight-based improvement detectors; included in volume detectors only if `totalVolumeKg > 0`.

## Testing strategy
- **Unit (detectors)** — each detector tested in isolation with fabricated session/exercise arrays covering trigger, near-miss, and empty data.
- **Unit (services)** — `FavoriteExercisesService` (top-N ordering, ties, < 10 exercises); `HighlightStatsService` (bonus math, perf+regularity pairing, fallback, empty result).
- **Unit (repository)** — localStorage milestone persistence (get/set/clear).
- **Component** — `StatsHighlightsCardComponent` renders correct icon/label/value per category and hides when input is empty.
- **Integration** — `stats-global.component.spec.ts` updated to assert the highlights section mounts and stays hidden when no metric triggers.

---

## UI Design

### Intégration dans le dashboard
Le composant `stats-highlights-card` s'insère **au-dessus de la summary card existante**, dans le flux vertical du conteneur `.stats-page`. Il est invisible si aucun highlight ne se déclenche (pas de placeholder vide).

### Structure d'un tile
Chaque highlight est un **tile autonome** avec la structure suivante :

```
┌──────────────────────────────────────────┐
│▌ [LABEL MÉTRIQUE 9PX UPPERCASE]          │  ← barre gauche colorée (3px)
│  [Nom de l'exercice – sub 11px]          │
│  [Valeur principale – IBM Plex Mono 20px]│
│  [Sous-valeur ou gain – sub 11px]        │
└──────────────────────────────────────────┘
```

- **Barre gauche 3px (`::before`)** : `--orange` pour les métriques perf, `--green` pour les métriques régularité.
- **Background** : `var(--card2)` (`#1e1e2a`) pour se distinguer légèrement de la card parente `var(--card)`.
- **Border-radius** : 12px (secondary card).
- **Border** : `1px solid var(--border)`.
- **Padding** : 12px 14px.

### Couleurs par catégorie
| Catégorie | Barre | Valeur principale | Background dim |
|-----------|-------|-------------------|----------------|
| perf | `--orange` | `--orange` | `--orange-dim` sur hover |
| regularity | `--green` | `--green` | `--green-dim` sur hover |

### Typographie
| Élément | Police | Taille | Poids | Couleur |
|---------|--------|--------|-------|---------|
| Label métrique | Space Grotesk | 9px | 700 | `--muted`, uppercase, letter-spacing 1.2px |
| Nom exercice | DM Sans | 11px | 400 | `--sub` |
| Valeur principale | IBM Plex Mono | 20px | 600 | accent (orange ou green) |
| Sous-valeur / gain | DM Sans | 11px | 400 | `--sub` |

### Disposition des tiles
Les tiles sont empilés **en colonne** (`flex-direction: column`, `gap: 8px`) à l'intérieur de la card parente. Pas de grille horizontale : les highlights méritent chacun leur propre ligne pour être lus facilement.

La card parente (`stats-highlights-card`) hérite du style standard :
- `background: var(--card)`, `border-radius: 18px`, `border: 1px solid var(--border)`, `padding: 14px`.
- Pas de titre de section : les labels métrique dans chaque tile suffisent.

### États
- **Vide** : le composant n'est pas rendu (`@if highlights().length`).
- **Hover tile** : `border-color` → couleur accent, transition 0.15s (cohérent avec les session-cards).
- Pas d'animation d'entrée pour rester sobre.

---

## Test scenarios

Six representative scenarios covering the selection logic and all three highlight slots (≤2 perf + ≤1 regularity).

**Legend — expected output listed as:** `[perf-1, perf-2, regularity]` or fewer slots.

---

### Scénario 1 — Les trois slots sont remplis (2 perf + 1 régularité)
**Données**
- Exercice A (Développé couché) — favori n°1 (bonus +30%) : max précédent 95 kg, séance d'aujourd'hui 100 kg (+5 kg ✓ seuil 2,5 kg).
- Exercice B (Squat) — favori n°2 (bonus +15%) : volume moyen semaines 1–4 = 2 000 kg, volume semaine en cours = 2 600 kg (+30 %).
- Historique : 4 semaines consécutives avec ≥2 séances chacune.

**Résultat attendu**
1. `weight-pr` — Record battu sur le Développé couché, 100 kg (+5 kg) 🥳
2. `volume-progression` — Volume en hausse sur le Squat, +30 % cette semaine 📈
3. `consecutive-weeks` — 4 semaines d'entraînement consécutives ! 🔥

---

### Scénario 2 — Seulement deux exercices, déduplication exercice identique
**Données**
- Exercice A (Tractions) — favori n°1 : nouveau max 90 kg **et** volume semaine +40 %. Les deux détecteurs perf se déclenchent sur le même exerciceId.
- Exercice B (Rowing haltère) — favori n°3 : volume +20 %, score brut plus bas que Tractions.
- Aucune régularité déclenchée (< 3 semaines consécutives, < 4 séances en 7 j).

**Résultat attendu**
1. `weight-pr` — Record battu sur les Tractions, 90 kg 🥳
2. `volume-progression` — Volume en hausse sur le Rowing haltère, +20 % cette semaine 📈
3. _(vide — pas de régularité)_

> Tractions ne peut apparaître qu'une seule fois même si deux détecteurs se déclenchent dessus.

---

### Scénario 3 — Bonus favori inverse le classement
**Données**
- Exercice A (Développé incliné) — NON favori : volumes des 3 semaines précédentes 1 800 / 1 900 / 2 000 kg, semaine actuelle 2 700 kg (+42 % vs moyenne 1 900 kg).
- Exercice B (Squat) — favori n°1 (+30 %) : max précédent 100 kg, séance d'aujourd'hui 103 kg (+3 kg ✓ seuil 2,5 kg).
- Aucune régularité déclenchée.

**Résultat attendu**
1. `weight-pr` — Record battu sur le Squat, 103 kg (+3 kg) 🥳
2. `volume-progression` — Volume en hausse sur le Développé incliné, +42 % cette semaine 📈
3. _(vide)_

> Sans le bonus favori, la progression +42 % de A classerait devant le PR de B. Le bonus × 1,30 du Squat inverse le classement.

---

### Scénario 4 — Jalons de volume (milestone) + régularité, aucune perf
**Données**
- Volume cumulatif total : 100 002 kg (franchit 100 t pour la première fois, seuil 50 t déjà acquitté).
- 5 séances dans les 7 derniers jours.
- Aucun nouveau max de poids, aucune progression de volume hebdomadaire significative.

**Résultat attendu**
1. `volume-milestone` — 100t de charge d'entraînement au total ! 💪
2. `seven-day-streak` — Record de séances, 5 en 7 jours ! 👏
3. _(vide — pas de second perf)_

---

### Scénario 5 — Quasi-déclenchement (near-miss), résultat vide
**Données**
- Exercice A (Développé couché) : max précédent 100 kg, séance aujourd'hui 102 kg (+2 kg, en-dessous du seuil 2,5 kg).
- Exercice B (Squat) : volume semaine en cours 2 050 kg vs semaine précédente 2 000 kg (+2,5 %, progression négligeable).
- Seulement 2 semaines consécutives actives (seuil : 3).
- 3 séances dans les 7 derniers jours (seuil : 4).
- Dernier jalon 50 t déjà acquitté, total actuel 49 800 kg (prochain seuil non atteint).

**Résultat attendu**
_(tableau vide — card cachée)_

---

### Scénario 6 — Utilisateur sans historique (onboarding)
**Données**
- 0 session en base.

**Résultat attendu**
_(tableau vide — card cachée)_

---

## Stories

### Story 1 — Favorite exercises service
**Goal:** Provide a reusable computation of the top-10 exercises by frequency over the last 90 days, returning a per-exerciseId bonus multiplier.
**Scope:** core_logic/stats-global: `favorite-exercises.service.ts`, `favorite-exercises.service.spec.ts`
**Acceptance criteria:**
- [ ] Returns +30% for rank 1, +15% for ranks 2–3, +5% for ranks 4–10, 0% otherwise.
- [ ] Counts only sessions whose date is within the last 90 days from "today".
- [ ] Handles ties deterministically (by exerciseId) and never throws on empty data.
**Depends on:** none

### Story 2 — Highlight metric model and detector context
**Goal:** Define the shared `HighlightMetric`, `HighlightCategory`, and `DetectorContext` types so all detectors share a stable contract.
**Scope:** core_logic/stats-global: `highlight-metric.model.ts` (or additions to shared `models.ts`)
**Acceptance criteria:**
- [ ] Types compile and are consumed by at least one placeholder detector.
- [ ] `HighlightCategory` is `'perf' | 'regularity'`.
- [ ] Context exposes sessions, exercises, today's date, and a `favoriteBonus(exerciseId)` function.
**Depends on:** Story 1

### Story 3 — Performance detectors
**Goal:** Implement the three perf detectors (weight PR, 4-week volume progression, most improved of month) as pure functions.
**Scope:** core_logic/stats-global/highlight-detectors: `weight-pr.detector.ts`, `volume-progression.detector.ts`, `most-improved.detector.ts` (+ specs)
**Acceptance criteria:**
- [ ] Each detector returns `null` when its trigger conditions are not met.
- [ ] Each detector's `impactScore` scales with the magnitude of the achievement.
- [ ] Cardio exercises are excluded from weight-based detectors.
**Depends on:** Story 2

### Story 4 — Regularity detectors
**Goal:** Implement the two regularity detectors (7-day streak, consecutive active weeks).
**Scope:** core_logic/stats-global/highlight-detectors: `seven-day-streak.detector.ts`, `consecutive-weeks.detector.ts` (+ specs)
**Acceptance criteria:**
- [ ] Streak detector triggers at ≥4 sessions in any rolling 7-day window ending today or earlier this week.
- [ ] Consecutive-weeks detector triggers at ≥3 consecutive ISO weeks with ≥2 sessions each.
- [ ] Returned candidates have category `'regularity'`.
**Depends on:** Story 2

### Story 5 — Milestone detector with persistence
**Goal:** Implement the 50-tonne milestone detector backed by a small localStorage repository so each threshold fires only once.
**Scope:** secondary_ports/highlight-stats: interface + token + localStorage impl; core_logic/stats-global/highlight-detectors: `volume-milestone.detector.ts` (+ specs)
**Acceptance criteria:**
- [ ] Triggers when cumulative total volume crosses a multiple of 50 t not yet acknowledged.
- [ ] Returns null on subsequent loads until the next 50 t threshold is crossed.
- [ ] Repository contract is mockable for unit tests.
**Depends on:** Story 2

### Story 6 — Highlight selection service
**Goal:** Compose all detectors, apply favorite bonus, and expose a `highlights` computed signal returning at most 3 view models (up to 2 perf + 1 regularity when both available).
**Scope:** core_logic/stats-global: `highlight-stats.service.ts`, `highlight-stats.service.spec.ts`
**Acceptance criteria:**
- [ ] Applies `impactScore × (1 + bonus)` only to perf detectors; regularity uses raw score.
- [ ] Prefers up to 2 perf + 1 regularity; falls back to top 3 of the available category if only one category triggers.
- [ ] No two selected highlights share the same exerciseId (regularity metrics, which carry no exerciseId, are exempt).
- [ ] Returns an empty array when no detector triggers.
**Depends on:** Stories 3, 4, 5

### Story 7 — Expose highlights through the use case
**Goal:** Wire `HighlightStatsService.highlights` into `GetGlobalStatsUseCase` so the UI layer reads it through the existing port.
**Scope:** primary_ports/stats-global: `get-global-stats.usecase.ts` (+ spec adjustments)
**Acceptance criteria:**
- [ ] `getGlobalStatsUseCase.highlights` is a signal returning `HighlightViewModel[]`.
- [ ] No direct dependency on `HighlightStatsService` from the component.
**Depends on:** Story 6

### Story 8 — Highlights card component
**Goal:** Render up to 3 highlight tiles as a dumb standalone component with OnPush, hidden when empty.
**Scope:** primary_adapters/stats-global: `stats-highlights-card.component.{ts,html,scss}` (+ spec); assets/i18n/en.json keys under `statsGlobal.highlights.*`
**Acceptance criteria:**
- [ ] Accepts `highlights` via `input()` and renders one tile per item.
- [ ] Hides the entire card when input is empty.
- [ ] All UI text routed through the translate pipe.
**Depends on:** Story 7

### Story 9 — Mount highlights into the dashboard
**Goal:** Display the highlights card at the top of the stats-global dashboard.
**Scope:** primary_adapters/stats-global: `stats-global.component.ts` + `.html` (+ spec update)
**Acceptance criteria:**
- [ ] Card renders above the existing summary card.
- [ ] Existing dashboard tests still pass.
- [ ] Card stays hidden when no highlight triggers.
**Depends on:** Story 8
