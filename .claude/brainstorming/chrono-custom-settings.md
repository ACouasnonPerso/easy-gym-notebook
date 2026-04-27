# Chrono Custom Settings

## What this feature does
Adds a three-field custom-settings panel (exercise duration, break duration, repetitions) to the exercise chrono screen. Each field accepts a positive integer or an "infinite" mode. Based on the configuration, the chrono auto-loops WORK -> BREAK -> WORK -> ..., finishes on an OVER screen when the last rep's WORK ends, and offers a RESTART action that reuses the same custom configuration.

## Design pattern
**State machine** (explicit). The existing `ChronoState` union is extended with an `over` state and the transition rules are reinterpreted under a declarative table that depends on the custom-settings values (finite vs infinite for exercise duration, break duration, and repetitions). Each transition is driven by either a timer completion, a user action, or the rep-count predicate — keeping all branching in one place.

## Affected areas
- **core_logic/exercise-chrono/exercise-chrono.service.ts** — extend `ChronoState` with `over`, add custom-settings signal, convert WORK phase to a countdown when `exerciseDuration` is finite, drive auto-loop in countdown callbacks, count completed reps, emit OVER on last WORK completion, add `applyCustomSettings`, `restart`, update `persist`/`restoreFromPersist`.
- **primary_ports/exercise-chrono/exercise-chrono.usecase.ts** — expose `settings`, `applyCustomSettings`, `restart`.
- **primary_adapters/exercise-chrono/exercise-chrono.component.ts/.html** — load persisted settings, seed `breakDuration` from route param on first load, open/close panel, render OVER overlay, wire `restart`.
- **primary_adapters/exercise-chrono/chrono-actions.component.ts/.html** — add RESTART button rendered only when state is `over`; add `nextRep` action only when exerciseDuration is infinite but reps are finite.
- **primary_adapters/exercise-chrono/chrono-header.component.ts/.html** — add settings (gear) button that opens the panel.
- **primary_adapters/exercise-chrono/chrono-ring.component.ts/.html** — render OVER label when state is `over`.
- **src/app/assets/i18n/en.json** — new translation keys only (per project convention).

## New elements to create
- **core_logic/exercise-chrono/chrono-custom-settings.ts** — `ChronoCustomSettings` interface, `loadCustomSettings`, `saveCustomSettings`, `defaultCustomSettings(initialBreakDuration)`. Key: `egn_chrono_custom_settings`.
- **primary_adapters/exercise-chrono/chrono-custom-settings-panel.component.ts/.html/.css** — standalone, OnPush modal with three rows (exercise duration, break duration, repetitions), each with numeric stepper + "infinity" toggle button. Inputs: `initialSettings`. Outputs: `confirmed: ChronoCustomSettings`, `cancelled`.

## State and data flow

### Model
```
ChronoCustomSettings {
  exerciseDuration: number | null  // seconds, null = infinite (count-up WORK)
  breakDuration:    number | null  // seconds, null = infinite (manual goTraining)
  repetitions:      number | null  // null = infinite (never stops)
}
```

### Service signals (added)
- `_settings: Signal<ChronoCustomSettings>` (read-only projection exposed as `settings`)
- `_completedReps: Signal<number>` — incremented at the end of each full WORK+BREAK cycle (or at end of last WORK when reps are finite and we skip the final BREAK)

### Transition rules (single source of truth in the service)
1. WORK ends (countdown hits 0 when `exerciseDuration` finite, or user presses "next rep" when `exerciseDuration` is infinite):
   - if reps are finite AND this was the last rep -> state = `over`, no final BREAK, no rep increment beyond the last.
   - else -> start BREAK. If `breakDuration` is finite -> countdown; if infinite -> user presses "go training" manually.
2. BREAK ends (countdown hits 0 when `breakDuration` finite, or user presses goTraining):
   - increment `_completedReps` and `_seriesCount`, auto-start next WORK.
3. RESTART (from OVER only): reset to `initial`, `_seriesCount = 0`, `_completedReps = 0`, keep `_settings`, persist.

### Init flow (component)
1. Load persisted settings from localStorage.
2. If route param `breakDuration` is present AND no persisted settings exist, seed `breakDuration` from the route param (fallback 60 otherwise).
3. Call `useCase.applyCustomSettings(resolved)` which also calls `init()` internally when state is `initial`.

### Persistence
- `egn_chrono_custom_settings` is written on every `applyCustomSettings` and on `restart`.
- Existing `egn_exercise_chrono` restoration must tolerate missing settings (backward compatible).

## Edge cases to handle
- Exercise finite + break finite + reps infinite -> loops forever until user leaves/interrupts.
- Exercise finite + break finite + reps finite -> ends on OVER after last WORK countdown; no final BREAK.
- Exercise infinite + break finite + reps finite -> user drives rep increments with existing "goBreak" action; rep counted at BREAK end; still ends on OVER after last WORK.
- Exercise infinite + break infinite -> fully manual, same as today's behaviour, OVER only triggers if reps are finite.
- Exercise finite + break infinite -> at WORK end, state is `break` but no countdown runs; user presses goTraining to proceed.
- Settings changed while in OVER -> update settings + persist, do NOT auto-restart (user must press RESTART).
- Settings changed mid-session -> apply new values to upcoming phases only; current running timer is not reset (mirrors the existing `updateBreakDuration` behaviour).
- Page reload mid-session -> restore both chrono state and settings; OVER state is a valid restorable state.
- Infinity toggle in panel -> remembers the last numeric value so the user can flip back without retyping.
- Minimum numeric value is 1 for all three fields.

## Testing strategy
- **Unit (service)**: exhaustive matrix on the 8 combinations (each of the three fields finite/infinite), covering auto-loop progression, OVER transition on last WORK end, rep counting, `restart`, persist/restore round-trips including OVER.
- **Unit (helpers)**: `loadCustomSettings` / `saveCustomSettings` / `defaultCustomSettings` with a localStorage mock.
- **Unit (use case)**: delegation for `applyCustomSettings` and `restart`.
- **Component (panel)**: confirm emits the correct `ChronoCustomSettings`; infinity toggle round-trips the last numeric value; minimum value = 1.
- **Component (chrono-actions)**: RESTART button renders only when state is `over`; emits `restart`.
- **Component (exercise-chrono)**: ngOnInit seeding priority (persisted > route param > default); panel open/close; OVER overlay rendering.

---

## Stories

### Story 1 — Custom-settings model and persistence helpers
**Goal:** Provide a typed model and localStorage helpers for the three custom-settings values.
**Scope:** core_logic/exercise-chrono: chrono-custom-settings.ts (+ spec)
**Acceptance criteria:**
- [ ] `ChronoCustomSettings` interface defined with `exerciseDuration | breakDuration | repetitions: number | null`.
- [ ] `saveCustomSettings` writes to `egn_chrono_custom_settings`; `loadCustomSettings` reads and returns `null` when absent or malformed.
- [ ] `defaultCustomSettings(seed)` returns `{ exerciseDuration: null, breakDuration: seed ?? 60, repetitions: null }`.
**Depends on:** none

### Story 2 — Extend service with custom settings, OVER state and auto-loop
**Goal:** Teach `ExerciseChronoService` to drive the full WORK/BREAK/OVER state machine based on custom settings.
**Scope:** core_logic/exercise-chrono: exercise-chrono.service.ts (+ spec)
**Acceptance criteria:**
- [ ] `ChronoState` includes `over`; service exposes `settings` and `completedReps` signals.
- [ ] WORK is a countdown when `exerciseDuration` is finite; auto-starts BREAK on zero; BREAK auto-starts next WORK on zero when `breakDuration` is finite.
- [ ] When reps are finite and the last WORK ends, state becomes `over` with no final BREAK and no extra rep increment.
- [ ] `applyCustomSettings` and `restart` exist; `persist`/`restoreFromPersist` round-trip settings, completedReps, and the `over` state.
**Depends on:** Story 1

### Story 3 — Expose new capabilities in the use case
**Goal:** Surface `settings`, `applyCustomSettings`, and `restart` through the primary port.
**Scope:** primary_ports/exercise-chrono: exercise-chrono.usecase.ts (+ spec)
**Acceptance criteria:**
- [ ] Use case exposes read-only `settings` signal.
- [ ] `applyCustomSettings(s)` and `restart()` delegate to the service.
**Depends on:** Story 2

### Story 4 — Custom-settings panel component
**Goal:** A modal letting the user set exercise duration, break duration, and repetitions (each finite or infinite).
**Scope:** primary_adapters/exercise-chrono: chrono-custom-settings-panel.component.ts/.html/.css (+ spec)
**Acceptance criteria:**
- [ ] Three rows with numeric stepper + infinity toggle; minimum numeric value = 1.
- [ ] Infinity toggle remembers the last numeric value and restores it when turned off.
- [ ] `confirmed` emits a fully-typed `ChronoCustomSettings`; `cancelled` emits on dismiss.
**Depends on:** Story 1

### Story 5 — OVER screen rendering and RESTART action
**Goal:** Show an OVER state in the ring and expose a RESTART button in the actions bar.
**Scope:** primary_adapters/exercise-chrono: chrono-ring.component.*, chrono-actions.component.* (+ spec)
**Acceptance criteria:**
- [ ] When `chronoState === 'over'`, ring renders an OVER label instead of the timer.
- [ ] When `chronoState === 'over'`, actions bar shows only a RESTART button that emits a new `restart` output.
**Depends on:** Story 2

### Story 6 — Wire everything in `ExerciseChronoComponent`
**Goal:** Integrate panel, OVER flow, route-param seeding, and persistence priority in the container component.
**Scope:** primary_adapters/exercise-chrono: exercise-chrono.component.ts/.html, chrono-header.component.* (settings button)
**Acceptance criteria:**
- [ ] ngOnInit resolves settings as: persisted > route `breakDuration` seed > default, then calls `applyCustomSettings`.
- [ ] Gear button in header opens the panel; panel `confirmed` calls `applyCustomSettings` and closes; `cancelled` just closes.
- [ ] `(restart)` from actions bar calls `useCase.restart()`.
**Depends on:** Stories 3, 4, 5

### Story 7 — English i18n keys
**Goal:** Add all new translation keys to English only.
**Scope:** src/app/assets/i18n/en.json
**Acceptance criteria:**
- [ ] Adds `chrono.customSettings`, `chrono.exerciseDuration`, `chrono.breakDuration`, `chrono.repetitions`, `chrono.infinite`, `chrono.over`, `chrono.restart`.
- [ ] No other language files are modified.
**Depends on:** Story 6
