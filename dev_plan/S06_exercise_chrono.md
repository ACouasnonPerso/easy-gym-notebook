# S06 — Exercise Chrono: break countdown / exercise countup, audio beep, blink

## Goal
Implement the dual-mode exercise chrono page: a countdown for the break period followed by an automatic switchover to a countup for the exercise phase, with audio cue and visual blink effect.

## Scope
- `src/app/core_logic/exercise-chrono/exercise-chrono.service.ts`
- `src/app/primary_ports/exercise-chrono/exercise-chrono.usecase.ts`
- `src/app/primary_adapters/exercise-chrono/exercise-chrono.component.ts` + template + SCSS

HTML reference: `design/fitness-app-page-3-5.html` (page 3 — Chrono exercice, both Break and Training modes) — **référence visuelle uniquement** : deux états visuels distincts (Break / Training), anneau SVG, couleurs, clignotement. Ne pas recopier le HTML statique ; implémenter la logique Angular complète (ExerciseChronoService, modes signal, blink via computed, Web Audio API).

Out of scope: session chrono (S05).

## Technical context
- Angular 21 — standalone, `OnPush`, `input()` / `output()`, `inject()`
- Requires S01 (no direct dependency on session data beyond the `breakDuration` query param)
- `breakDuration` received via query param `?breakDuration=N` (integer seconds)
- Two modes: `'pause'` (countdown) and `'exercise'` (countup) — stored in `_mode` signal
- Audio: Web Audio API (no external library) — 880 Hz sine wave, 0.5s duration
- Blink: CSS `@keyframes blink` applied via `[class.blinking]="isBlinking()"` where `isBlinking = computed(() => timeSeconds() <= 3 && mode() === 'pause')`
- `ExerciseChronoService` persists state in `egn_exercise_chrono` localStorage key (for resume on reload, though not strictly required by spec — implement persist for robustness)

## Tasks

### ExerciseChronoService
- [ ] Create `src/app/core_logic/exercise-chrono/exercise-chrono.service.ts` — signals: `_mode: 'pause' | 'exercise'`, `_timeSeconds`, `_breakDuration`
- [ ] `init(breakDuration: number)`: sets `_breakDuration`, sets mode to `'pause'`, sets time to `breakDuration`, calls `startCountdown()`, calls `persist()`
- [ ] `goBreak()`: clears interval, resets to `'pause'` mode with `_breakDuration`, calls `startCountdown()`, persists
- [ ] `reset()`: clears interval; if mode is `'pause'` reset to `_breakDuration` and restart countdown; if mode is `'exercise'` reset to 0 and restart countup; persists
- [ ] `startCountdown()`: `setInterval(1s)` — decrements `_timeSeconds`; at 0 calls `playBeep()`, switches mode to `'exercise'`, calls `startCountup()`
- [ ] `startCountup()`: `setInterval(1s)` — increments `_timeSeconds`
- [ ] `playBeep()`: Web Audio API — `AudioContext`, oscillator at 880 Hz, sine wave, gain envelope from 0.5 → 0.001 over 0.5s, auto-stop
- [ ] `persist()`: saves `{ breakDuration, startedAt: Date.now(), mode }` to `egn_exercise_chrono`

### Use case
- [ ] Create `exercise-chrono.usecase.ts` — exposes `mode` and `timeSeconds` signals from `ExerciseChronoService`; methods: `initWithBreakDuration(n)`, `goBreak()`, `reset()`

### ExerciseChronoComponent
- [ ] Create `exercise-chrono.component.ts` — `OnPush`; reads `breakDuration` from `ActivatedRoute.snapshot.queryParams['breakDuration']` (parse to int, default 60 if missing/invalid); calls `ExerciseChronoUseCase.initWithBreakDuration(n)` in `ngOnInit`
- [ ] Display `timeSeconds()` formatted as `MM:SS` in large monospace font; in pause mode show remaining time (countdown), in exercise mode show elapsed (countup)
- [ ] SVG progress ring — pause mode: ring empties as time decreases (offset goes from 0 to circumference); exercise mode: ring fills (or show plain circle); use `computed()` for `strokeDashoffset`
- [ ] Status label: `'Break'` in pause mode, `'Training'` in exercise mode — switch via `computed()`
- [ ] Apply CSS `blinking` class when `isBlinking()` is true — `@keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }`, `animation: blink 0.5s step-start infinite`
- [ ] **"Go Break"** button: calls `ExerciseChronoUseCase.goBreak()`
- [ ] **"Reset"** button: calls `ExerciseChronoUseCase.reset()`
- [ ] Style: fullscreen dark layout; two distinct visual states (e.g., ring color differs in pause vs exercise mode); large centered timer; match `fitness-app-page-3-5.html`

## Acceptance criteria
- Navigating to `/chrono/exercise?breakDuration=90` starts a 90-second countdown
- Countdown decrements every second and displays remaining time
- At 0: audio beep plays, mode switches to exercise, countup starts from 0 automatically
- Last 3 seconds of break: time display blinks
- "Go Break" in any mode resets to break mode and restarts the countdown from the configured break duration
- "Reset" in break mode resets countdown to full break duration; in exercise mode resets countup to 0
- SVG ring visually reflects progression in break mode
- Navigating to the page without `breakDuration` query param defaults to 60 seconds

## Notes
- `AudioContext` must be created inside the `playBeep()` call, not in the constructor — browsers block audio contexts created before user interaction
- The blink animation must use `step-start` (not `ease`) to produce a sharp on/off flash effect as specified
- `breakDuration` query param arrives as a string — always `parseInt()` and validate (NaN → use 60)
- The component does not need a "back" button — users navigate away via the bottom nav
