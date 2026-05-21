# Highlight Rotation Fix

## What this feature does
Restore the rotation behaviour planned in `highlight-rotation.md`. Today, the rotation memory works correctly but the pool of candidates is too small: with only 6 detectors returning at most 1 metric each, the recent-6 buffer saturates after the very first run and every subsequent cold start falls back to the same stale top 3. This fix widens the candidate pool so that the existing fresh-vs-stale selection has real material to rotate through.

## Design pattern
**Strategy (multi-result variant).** Each perf detector keeps its Strategy role but is widened from a single best candidate to a ranked top-N. The selection helper, the rotation Memento and the favorite/session scoring are unchanged. Only the cardinality of the Strategy output is upgraded.

## Root cause (confirmed by exploration)
- `mostImprovedDetector`, `weightPrDetector`, `volumeProgressionDetector` iterate over all eligible exercises but write only `bestCandidate` into the result. They return `HighlightMetric | null`.
- `sevenDayStreakDetector`, `consecutiveWeeksDetector`, `volumeMilestoneDetector` are structurally single-result (no per-exercise dimension) and must stay that way.
- `HighlightStatsService.highlights` aggregates the detector outputs into a `candidates: HighlightMetric[]` list of length ≤ 6 (typically 3–4). With 3 slots filled per cold start, the 6-entry ring buffer becomes saturated within 2 runs and `isFresh()` returns `false` for every remaining candidate.
- `selectHighlights` already deduplicates by `exerciseName`, so feeding it multiple perf candidates for distinct exercises is safe and behaves as intended.

## Affected areas
- `core_logic/stats-global/highlight-metric.model.ts` — change the `Detector` signature from `HighlightMetric | null` to `HighlightMetric[]`.
- `core_logic/stats-global/highlight-detectors/most-improved.detector.ts` — return the top N improved exercises instead of only the best.
- `core_logic/stats-global/highlight-detectors/weight-pr.detector.ts` — return the top N PRs of the day instead of only the best.
- `core_logic/stats-global/highlight-detectors/volume-progression.detector.ts` — return the top N progressions instead of only the best.
- `core_logic/stats-global/highlight-stats.service.ts` — adapt the aggregation loop to concat arrays instead of pushing a single result; no change to selection logic.
- Specs of the 3 perf detectors and of the service: update fixtures and expectations to the new array shape.

## Elements that must NOT change
- `sevenDayStreakDetector`, `consecutiveWeeksDetector`, `volumeMilestoneDetector` keep returning a single metric (wrapped in a length-≤1 array at the call site, or kept as-is and pushed individually — see scope of Story 4).
- `selectHighlights` logic, the favorite multiplier, the `+50%` session boost, the 2-perf + 1-regularity shape, the per-exercise dedup, the rotation Memento read/write — all untouched.
- `RecentHighlightsRepository` and the localStorage adapter — untouched.

## Design choices
- **N = 3 per perf detector.** With 3 detectors × up to 3 candidates each = up to 9 perf candidates, plus up to 3 regularity/milestone. Pool size of ~10 is comfortably above the 6-entry recent buffer, so fresh candidates remain available across at least 3 consecutive cold starts even in worst-case overlap. Smaller N (e.g. 2) reintroduces saturation risk; larger N (e.g. 5+) adds no value because the dedup-by-exerciseName cap and the 3-slot display ceiling already constrain the output.
- **Filter thresholds stay the same.** The ≥ 2.5 kg gain rule (most-improved, weight-pr) and > 10 % progression rule (volume-progression) are preserved per candidate. Detectors return only candidates that *also* pass the threshold — the top N is taken among those, not among all exercises.
- **Sort order.** Candidates inside each detector are sorted by their existing `impactScore` proxy (gain in kg or pct) descending, then sliced to N. This guarantees the previous behaviour as a strict subset (the former single result is always the first of the new array).
- **Signature unification.** All 6 detectors expose a `HighlightMetric[]` return type for consistency. Regularity and milestone detectors simply return `[]` or `[metric]`. This removes the `| null` branch from the call site.

## State and data flow
1. `HighlightStatsService.highlights` runs detectors as today.
2. Each detector returns `HighlightMetric[]` (0, 1 or up to N entries). The service concatenates all arrays into `candidates`.
3. `selectHighlights` receives a pool of up to ~10 metrics. Its existing logic applies:
   - Score = `impactScore × (1 + favoriteBonus) × (1 + sessionBoost)`.
   - Fresh-first within perf and regularity pools, using the rotation memory.
   - Cap of 2 perf + 1 regularity, deduplicated by `exerciseName`, then fill to 3.
4. The effect persists the selected identities to the recent-6 buffer (unchanged).

## Edge cases to handle
- **Fewer than N candidates pass the threshold** — detector returns whatever it has (length 0 to N-1). No padding.
- **Ties on `impactScore`** — keep insertion order (deterministic from iteration over the source `Map`). Acceptable, since both candidates have equal merit.
- **Same exercise appearing in multiple detectors** (e.g. "Dips machine" wins both `weight-pr` and `most-improved`) — already handled by the existing dedup-by-`exerciseName` in `selectHighlights`. Both candidates enter the pool; only the higher-scored one is shown.
- **Pool still smaller than 3** (very early users with few sessions) — fallback to stale already covers this; behaviour is unchanged from today.
- **Spec migration** — the 3 perf detector specs currently assert on a single returned object. They must be updated to assert on `result[0]` (top candidate) and, where meaningful, on the presence/order of secondary candidates.

## Testing strategy
- **Unit (perf detectors)** — for each of `most-improved`, `weight-pr`, `volume-progression`:
  - Returns `[]` when no candidate passes the threshold (replaces former `null`).
  - Returns a length-1 array when only one exercise qualifies (regression of previous behaviour).
  - Returns a length-N array sorted by gain descending when more than N exercises qualify.
  - Returns all qualifying candidates (length < N) when more than 1 but fewer than N qualify.
  - Preserves the per-candidate `payload` shape unchanged.
- **Unit (regularity / milestone detectors)** — if their signature is unified to `HighlightMetric[]`, add a trivial test confirming the wrapping; otherwise no change.
- **Service** — `HighlightStatsService.highlights` integration: with a fixture producing 5 perf candidates across 3 detectors and an empty rotation memory, the first call shows top 3; after seeding the memory with those 3 identities, the second call shows a different set drawn from the remaining fresh candidates.
- **Selection helper** — existing tests stay green; add one case proving that with a pool of 6+ perf candidates and a 3-entry recent buffer, 3 fresh candidates are picked.

---

## Stories

### Story 1 — Widen detector signature to `HighlightMetric[]`
**Goal:** Make every detector return an array so the call site stops branching on `null` and the perf detectors can return multiple results.
**Scope:** core_logic/stats-global: `highlight-metric.model.ts` / core_logic/stats-global/highlight-detectors: `seven-day-streak.detector.ts`, `consecutive-weeks.detector.ts`, `volume-milestone.detector.ts` (wrap their single result in `[]` or `[metric]`) / their specs / core_logic/stats-global: `highlight-stats.service.ts` (aggregation loop concats arrays instead of pushing single results)
**Acceptance criteria:**
- [ ] `Detector` type in `highlight-metric.model.ts` is `(ctx) => HighlightMetric[]`.
- [ ] `sevenDayStreak`, `consecutiveWeeks`, `volumeMilestone` return `[]` instead of `null` and `[metric]` instead of `metric`.
- [ ] `HighlightStatsService.highlights` concatenates detector outputs and no longer checks for null; existing rotation, session-boost and selection logic is byte-identical in observable behaviour.
- [ ] All existing service-level and selection tests still pass without semantic change.
**Depends on:** none

### Story 2 — `mostImprovedDetector` returns top-N candidates
**Goal:** Surface up to 3 most-improved exercises per cold start so the rotation pool grows.
**Scope:** core_logic/stats-global/highlight-detectors: `most-improved.detector.ts` and its spec
**Acceptance criteria:**
- [ ] Returns up to 3 metrics sorted by `gainKg` descending, all passing the existing ≥ 2.5 kg threshold.
- [ ] Returns `[]` when no exercise meets the threshold.
- [ ] When only 1 or 2 exercises qualify, returns exactly those (no padding).
- [ ] Each returned metric keeps the existing `payload` shape (`exerciseName`, `currentMaxKg`, `gainKg`, `prevYear`, `prevMonth`).
**Depends on:** Story 1

### Story 3 — `weightPrDetector` returns top-N candidates
**Goal:** Surface up to 3 PRs of the day instead of only the best.
**Scope:** core_logic/stats-global/highlight-detectors: `weight-pr.detector.ts` and its spec
**Acceptance criteria:**
- [ ] Returns up to 3 metrics sorted by `gainKg` descending, all passing the existing ≥ 2.5 kg threshold.
- [ ] Returns `[]` when no PR meets the threshold or no session occurred today.
- [ ] Each returned metric preserves its own `previousPrDate` lookup against its own historical max.
- [ ] Existing `payload` keys (`exerciseName`, `weightKg`, `gainKg`, `previousPrDate`) are unchanged per metric.
**Depends on:** Story 1

### Story 4 — `volumeProgressionDetector` returns top-N candidates
**Goal:** Surface up to 3 weekly volume progressions instead of only the best.
**Scope:** core_logic/stats-global/highlight-detectors: `volume-progression.detector.ts` and its spec
**Acceptance criteria:**
- [ ] Returns up to 3 metrics sorted by percentage gain descending, all passing the existing > 10 % threshold.
- [ ] Returns `[]` when no exercise meets the threshold.
- [ ] Each returned metric keeps `payload` keys (`exerciseName`, `currentVolumeKg`, `avgPrevVolumeKg`, `pctGain`) unchanged.
**Depends on:** Story 1

### Story 5 — End-to-end rotation regression test
**Goal:** Prove that two consecutive cold starts produce different highlight sets when the candidate pool is rich enough.
**Scope:** core_logic/stats-global: `highlight-stats.service.spec.ts`
**Acceptance criteria:**
- [ ] With a fixture producing ≥ 5 perf candidates across the 3 widened detectors and an empty recent-highlights buffer, the first call returns the top 3 by score.
- [ ] After seeding the recent buffer with those 3 identities, the second call returns at least 1 identity not in the recent buffer (true rotation, no full-stale fallback).
- [ ] The test reads/writes the recent buffer through a stub `RecentHighlightsRepository`, no localStorage involved.
**Depends on:** Story 2, Story 3, Story 4
