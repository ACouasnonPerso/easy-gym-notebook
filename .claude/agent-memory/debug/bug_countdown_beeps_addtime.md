---
name: Bug — countdown beeps silent after addTime()
description: Countdown sounds (10/3/2/1s beeps) are never triggered when addTime() is called while a break is running, because the interval's elapsed calculation skips over the trigger thresholds.
type: project
---

Sound triggers (10, 3, 2, 1 seconds remaining) live in the `setInterval` callback of `startCountdown()` in `ExerciseChronoService` (`src/app/core_logic/exercise-chrono/exercise-chrono.service.ts`).

The `remaining` value is computed as `_timeAtStart - elapsed`, where `elapsed = Math.floor((Date.now() - _timerStartedAtMs) / 1000)`.

When `addTime(n)` is called during a running break (state === 'break'), it resets `_timerStartedAtMs` to `Date.now()` and sets `_timeAtStart` to the new, higher remaining value. This means the interval restarts counting elapsed from 0 against the new, larger `_timeAtStart`. The integer `remaining` values that cross through 10, 3, 2, 1 are hit exactly once per second — but because `elapsed` now advances from 0 against a larger base, the tick that would land on exactly 10/3/2/1 is skipped if `addTime` adds a non-round number of seconds or is called at a moment that causes the elapsed offset to skip those exact integer values.

**Why:** The countdown sound is only triggered via exact integer equality (`remaining === 10`, `=== 3`, etc.), not via a range check. After `addTime`, the new `_timeAtStart` and the reset `_timerStartedAtMs` together cause `remaining` to skip the exact threshold values.

**Files involved:**
- `src/app/core_logic/exercise-chrono/exercise-chrono.service.ts` — `startCountdown()` (line 149), `addTime()` (line 256), `playCountdownSound()` (line 172)

**No existing tests cover sound triggers** — the `exercise-chrono.service.spec.ts` has zero tests for `playCountdownSound` or `playBeep`.

**How to apply:** The fix must ensure that after `addTime()` the sound thresholds are not bypassed. The reproduction test should verify that a countdown sound fires at the expected remaining value after time is added mid-break.
