# Highlight Rotation

## What this feature does
Highlights cycle on every cold start / page refresh so the user sees a different "top 3" each visit, while avoiding repetition of the last 6 highlights shown. When a session is in progress, exercises from that session are favored via an additional +50% bonus stacked on the existing favorite multiplier.

## Design pattern
**Strategy + Memento**. The existing scoring stays a Strategy (detectors + scoring), and a small Memento — the persisted ring buffer of the last 6 shown highlight identities — is read before selection and written after selection. This cleanly separates the deterministic scoring from the cross-run rotation memory without polluting detectors.

## Affected areas
- `core_logic/stats-global/highlight-stats.service.ts` — extend `highlights` computed to consult and update rotation memory; pass an in-progress-session bonus into the scoring step.
- `core_logic/stats-global/highlight-metric.model.ts` — extend `DetectorContext` with an optional `sessionBoostExercises: Set<string>` (or accessor) so the in-progress bias is expressed at the scoring level, not inside detectors.
- `core_logic/stats-global/favorite-exercises.service.ts` — no change; its 0–0.30 multiplier remains the base. The +50% session-bias bonus is additive at selection time.
- `core_logic/session/session.service.ts` — no change; expose-as-is `currentSession()` is the source for the in-progress exercise set.
- `secondary_ports/highlight-stats/` — add a new port for the rotation memory.
- `secondary_adapters/highlight-stats/` — add a localStorage adapter (mirrors `LocalStorageMilestoneRepository`).
- `core_logic/stats-global/highlight-stats.service.spec.ts`, scoring spec, and new repository spec.

## New elements to create
- `secondary_ports/highlight-stats/recent-highlights-repository.interface.ts` — `RecentHighlightsRepository` port with `getRecent(): RecentHighlightEntry[]` and `pushRecent(entries: RecentHighlightEntry[]): void`, plus an `InjectionToken<RecentHighlightsRepository>`. Entry shape: `{ id: string; exerciseName?: string }` (the pair that identifies a highlight for dedup).
- `secondary_adapters/highlight-stats/local-storage-recent-highlights.repository.ts` — persists a bounded ring buffer of length 6 in localStorage under a dedicated key. Resilient to malformed JSON (returns `[]` and overwrites).
- (Inside `highlight-stats.service.ts`) a private helper that, given the candidate list, the recent memory, and the session-boost set, produces the final ordered selection. May be extracted as a pure module-level function for testability — same style as `selectHighlights`.

## State and data flow
1. On `highlights` computed re-run (cold start, refresh, or any upstream signal change):
   - Read `sessions`, `exercises`, `today` from `StatsService`.
   - Read `currentSession()` from `SessionService`; derive `sessionBoostExercises` = set of exercise names present in that session (empty set if none).
   - Read `recentRepo.getRecent()` → last-6 buffer.
2. Run all detectors as today, producing `candidates: HighlightMetric[]`.
3. Scoring: `finalScore = impactScore × (1 + favoriteBonus) × (1 + sessionBoost)`, where `sessionBoost = 0.50` if `exerciseName ∈ sessionBoostExercises`, else `0`. Regularity metrics keep their current scoring (no exerciseName → no session boost).
4. Selection (replaces current category split):
   - Sort all candidates by `finalScore` desc.
   - Partition into **fresh** (identity not in recent-6 buffer) and **stale** (identity in buffer).
   - Pick from **fresh** first, preserving the current "≤2 perf + ≤1 regularity, then fill to 3" shape and the per-exercise-name dedup rule.
   - If fewer than 3 are selectable from **fresh**, fall back to **stale** to fill the remaining slots (in score order, same shape rules).
5. Persist: append the selected highlight identities to the ring buffer (keep newest 6). Skip the write when the selection is empty.
6. Identity for memory = `(id, exerciseName ?? "")`. Two perf highlights for different exercises are independent entries; a regularity highlight has no exercise.

## Edge cases to handle
- **No candidates at all** — return `[]`, do not touch the memory.
- **All candidates are in the last-6 memory** — fall back to highest-scored anyway; do not return fewer than the user would otherwise have seen.
- **Memory storage broken / unavailable** — repository returns `[]` and `pushRecent` is a no-op (try/catch); user always gets highlights.
- **Same cold start reads + writes** — read once at the top, compute selection, then write; never read the memory mid-selection.
- **No in-progress session** — `sessionBoostExercises` is empty; behavior reduces to "rotation only", which still produces different highlights than the previous set when possible.
- **In-progress session with exercises not yet in `_allExercises()`** — derive the boost set from `currentSession().exercises` directly (the session signal is the authoritative source for in-progress data), not from the persisted stats stream.
- **Ring buffer overflow** — bounded to 6 entries; oldest dropped on push.
- **Buffer key collision across users on shared device** — out of scope; localStorage is single-tenant by design here.

## Testing strategy
- **Unit (pure function)** — exhaustive tests on the selection helper: rotation memory empty / partially full / full; only-stale fallback; session-boost reorders without breaking dedup; empty candidates returns `[]`; respects the 2-perf + 1-regularity shape.
- **Unit (repository adapter)** — round-trip serialize, malformed JSON tolerance, ring buffer trimming to 6, push on empty buffer.
- **Service-level** — `HighlightStatsService.highlights` integration: reads `currentSession`, applies the +50% boost only to matching exercise names, calls `pushRecent` with the selected identities exactly once per recompute, never writes on empty selection.
- **No new component tests needed** — the dumb card and template are unchanged.

---

## Stories

### Story 1 — Rotation memory port and localStorage adapter
**Goal:** Persist the last 6 highlight identities across cold starts so the rotation logic has a memory to consult.
**Scope:** secondary_ports/highlight-stats: `recent-highlights-repository.interface.ts` / secondary_adapters/highlight-stats: `local-storage-recent-highlights.repository.ts` (+ spec)
**Acceptance criteria:**
- [ ] Port defines `getRecent()` and `pushRecent(entries)` with an entry shape `{ id, exerciseName? }`.
- [ ] Adapter persists a bounded ring buffer of length 6 in localStorage; oldest entries are dropped on push.
- [ ] Adapter returns `[]` on missing or malformed storage, and write failures do not throw.
**Depends on:** none

### Story 2 — Session-boost wiring in detector context and scoring
**Goal:** Expose the in-progress session's exercise names to the scoring step and apply a +50% multiplier stacked on the favorite bonus.
**Scope:** core_logic/stats-global: `highlight-metric.model.ts`, `highlight-stats.service.ts` (selection helper + computed) (+ specs)
**Acceptance criteria:**
- [ ] `HighlightStatsService` derives a `sessionBoostExercises` set from `SessionService.currentSession()` (empty when no active session).
- [ ] Perf candidates whose `exerciseName` is in that set have their final score multiplied by 1.50, stacked over `(1 + favoriteBonus)`; regularity candidates are unaffected.
- [ ] Existing dedup-by-exerciseName and category shape (≤2 perf + ≤1 regularity, fill to 3) still hold.
**Depends on:** none

### Story 3 — Anti-repeat rotation in the selection helper
**Goal:** Prefer highlights not shown in the last 6 sessions while never reducing the displayed count.
**Scope:** core_logic/stats-global: `highlight-stats.service.ts` (selection helper, computed reads `RecentHighlightsRepository`, writes after selection) (+ specs)
**Acceptance criteria:**
- [ ] Selection picks from fresh candidates (identity not in recent-6) first, then falls back to stale to fill remaining slots.
- [ ] After a non-empty selection, the chosen identities are appended to the rotation memory exactly once per recompute; empty selection performs no write.
- [ ] When all candidates are stale, the highest-scored ones are still returned rather than producing fewer highlights.
**Depends on:** Story 1, Story 2
