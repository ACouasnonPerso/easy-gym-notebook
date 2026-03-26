# S05 — Session Chrono: background timer, fullscreen page, Stop/GoBreak

## Goal
Implement the session-level stopwatch that runs persistently across all pages, including the fullscreen chrono page with SVG progress ring, manual override, and navigation to exercise chrono.

## Scope
- `src/app/core_logic/chrono/session-chrono.service.ts`
- `src/app/primary_ports/session-chrono/get-session-chrono.usecase.ts`
- `src/app/primary_ports/session-chrono/stop-session-chrono.usecase.ts`
- `src/app/primary_adapters/session-chrono/session-chrono.component.ts` + template + SCSS

HTML reference: `design/fitness-app-page-3-5.html` (page 2 — Chrono séance) — **référence visuelle uniquement** : layout plein écran, taille du timer, anneau SVG, boutons Go Break / STOP. Ne pas recopier le HTML statique ; implémenter la logique Angular complète (SessionChronoService, signals, SVG dynamique via computed).

Out of scope: exercise chrono (S06).

## Technical context
- Angular 21 — standalone, `OnPush`, `input()` / `output()`, `inject()`
- Requires S01, S02 (SessionService used to persist `durationSeconds`)
- `SessionChronoService` is `providedIn: 'root'` — singleton, persists across route changes (seul service autorisé à utiliser `providedIn: 'root'` directement car pas fourni via InjectionToken)
- Timer persisted in localStorage under `egn_chrono_start` (epoch timestamp) — allows recovery if the app is killed and relaunched
- SVG progress ring: `r=90`, `circumference = 2π×90 ≈ 565.5`; ring cycles every 60 seconds
- `ringOffset = circumference × (1 - (elapsedSeconds % 60) / 60)` — decreases to 0 at end of each minute

## Tasks

### SessionChronoService
- [ ] Create `src/app/core_logic/chrono/session-chrono.service.ts` — singleton, `_elapsedSeconds` signal, `start()` saves `Date.now()` to `egn_chrono_start` and starts `setInterval` (1s, computes elapsed as `Date.now() - startTime`), `resume()` called in constructor if key exists, `stop()` clears interval + removes key + returns elapsed, `getElapsed()` returns current signal value

### Use cases
- [ ] Create `get-session-chrono.usecase.ts` — exposes `elapsedSeconds` signal from `SessionChronoService` (no `execute()` needed; component reads signal directly)
- [ ] Create `stop-session-chrono.usecase.ts` — calls `SessionChronoService.stop()`, if result > 0 saves `durationSeconds` to current session via `SessionService.updateCurrentSession({ durationSeconds, status: 'completed' })`, navigates to `/sessions/:id`; if result === 0 returns a flag for manual override

### SessionChronoComponent
- [ ] Create `session-chrono.component.ts` — `OnPush`, reads `elapsedSeconds` via `GetSessionChronoUseCase`
- [ ] Display elapsed time in `HH:MM:SS` format (computed from signal), centered in large monospace font matching `fitness-app-page-3-5.html`
- [ ] SVG progress ring: `<svg viewBox="0 0 200 200">` with background circle and progress circle; `stroke-dasharray = circumference`; `[style.stroke-dashoffset]` bound to `ringOffset()` computed signal; ring fills clockwise each minute
- [ ] Status label: `'Training'` in uppercase, styled as per design
- [ ] `showManualOverride = signal<boolean>(false)`; `manualSeconds = signal<number>(0)`; when `showManualOverride()` is true, show a numeric input + "Valider" button that calls `StopSessionChronoUseCase` with the manual value
- [ ] **"Go Break"** button: navigates to `/chrono/exercise` with `breakDuration` query param from last exercise of current session (from `SessionService.currentSession`)  — fallback to 60 if no session or no exercises
- [ ] **"STOP"** button: calls `StopSessionChronoUseCase.execute()`; on result = 0, sets `showManualOverride(true)`
- [ ] Style: dark fullscreen layout, large timer, ring animation, orange accents matching design

### SessionService update (if not done in S02)
- [ ] Add `updateCurrentSession(changes: Partial<Session>): Promise<void>` to `SessionService` — updates `currentSession` signal and persists via `SessionRepository.save()`

## Acceptance criteria
- Creating a session (S02) starts the chrono immediately; navigating away and back keeps the timer running
- Killing and relaunching the app resumes the timer from the correct elapsed time using `egn_chrono_start`
- SVG ring resets visually every 60 seconds (one full cycle per minute)
- "STOP" with elapsed > 0 saves `durationSeconds` to the session and navigates to session list
- "STOP" with elapsed = 0 shows the manual input field
- Manual input allows entering seconds; submitting saves and navigates
- "Go Break" navigates to `/chrono/exercise?breakDuration=N`
- Timer does not accumulate drift over time (uses `Date.now() - startTime`, not `+= 1`)

## Notes
- `stroke-dashoffset` CSS property requires the SVG circle to start at 12 o'clock — apply `transform: rotate(-90deg)` on the progress circle, or use `stroke-dashoffset` offset from the right starting point
- `SessionService.currentSession` (added in S03) is needed to get last exercise's break duration for "Go Break"
- If `SessionChronoService.resume()` finds a start time from a previous session that was never stopped (e.g., the user force-closed the app), the timer will just keep counting from that stale timestamp — this is acceptable behavior per spec
