# Exercise History — Sets Detail On Click

## What this feature does
On the exercise stats page, clicking any history card in `app-exercise-history-list` opens a modal that shows every series of that past session — weight × reps per set — laid out like the `pyramid-sets-list` already used in `app-exercise-expanded`. If the exercise has a comment, it appears in the same modal alongside the set list (instead of the existing comment-only popup).

## Design pattern
**Detail-on-demand / Memento-free modal.** A single overlay component renders the read-only details of a selected `ExerciseOccurrence`. The list rendering is identical for pyramid and non-pyramid exercises: a non-pyramid exercise is treated as N identical sets of `{ weightKg, reps }` derived from `sets`/`reps`/`weightKg`. This collapses two display branches into one and reuses the established "click history card → overlay modal" interaction already wired for the comment indicator.

## Affected areas
- `core_logic/shared/models.ts` — extend `ExerciseOccurrence` with the per-set breakdown so stats stays the single source of truth.
- `core_logic/stats-exercise/exercise-stats.service.ts` — populate the new field when mapping exercises to occurrences (pyramid: copy `pyramidSets`; non-pyramid: synthesize N identical sets).
- `core_logic/stats-exercise/exercise-stats.service.spec.ts` — extend existing scenarios.
- `primary_adapters/stats-exercise/exercise-history-list.component.ts` / `.html` / `.scss` — make every card clickable (not only when commented), open the new modal, drop the comment-only branch.
- `primary_adapters/stats-exercise/exercise-history-list.component.spec.ts` — adjust click behavior tests.
- `src/app/assets/i18n/en.json` — new keys for the modal title and labels (English only per project rule).

## New elements to create
- `primary_adapters/stats-exercise/exercise-history-detail-popup.component.ts` (+ `.html`, `.scss`, `.spec.ts`) — read-only overlay that takes an `ExerciseOccurrence` input and emits `close` and `commentEdited`. It reuses the visual pattern of `pyramid-sets-list` from `exercise-expanded.component.html` (numbered rows, weight × reps), and embeds the existing comment block + edit button when a comment is present.

No new use case, repository, or store is required: the data already flows through `GetExerciseStatsUseCase`.

## State and data flow
- `ExerciseOccurrence` gains `sets: PyramidSet[]` (renaming the current numeric `sets` field is out of scope — see below). To avoid the name clash, the new field is named `setBreakdown: PyramidSet[]`.
- `ExerciseStatsService.loadForExercise` fills `setBreakdown`:
  - pyramid: a copy of `e.pyramidSets`.
  - non-pyramid: `Array.from({ length: e.sets }, () => ({ weightKg: e.weightKg, reps: e.reps }))`.
- `ExerciseHistoryListComponent` keeps a single `activeOccurrence` signal; clicking any card sets it. Template no longer guards click on `o.comment`.
- The new `ExerciseHistoryDetailPopupComponent` reads `setBreakdown` and renders one row per set with `weightKg | weightDisplay` and `reps`. The comment subsection appears only when `comment` is non-null and reuses `ExerciseCommentPopupComponent` for editing — so the existing `commentEdited` output of the list is preserved unchanged.

## Edge cases to handle
- **Cardio occurrences** keep their current rendering — no per-set view, no click-to-open. The `isCardio` branch in the template is untouched.
- **Empty `setBreakdown`** (legacy/imported data with `sets === 0`) renders the modal with the header and comment only, no rows; no crash.
- **Pyramid with rounded average weight.** The card still shows the averaged weight (existing behavior); the modal shows the raw per-set weights.
- **Comment-only sessions** (no real set data) still open the modal; the set list section is empty and the comment section is shown.
- **Click bubbling** on the rating badge / comment indicator must not be blocked — the whole card is now the click target, so no `stopPropagation` is needed inside the card.

## Testing strategy
- **Unit (`exercise-stats.service.spec.ts`):** assert `setBreakdown` shape for (a) pyramid occurrence — equals input pyramid sets, (b) non-pyramid — N copies of `{ weightKg, reps }` matching `sets`/`reps`, (c) cardio — unchanged (no occurrences).
- **Component (`exercise-history-list.component.spec.ts`):** clicking any non-cardio card sets `activeOccurrence`, even when `comment` is null; cardio cards remain non-clickable.
- **Component (`exercise-history-detail-popup.component.spec.ts`):** renders one row per `setBreakdown` entry with weight + reps; renders comment block + edit affordance only when `comment` present; emits `close` on overlay click and `commentEdited` when the embedded comment popup saves.
- No integration test needed; data flow is fully covered by stats-service unit tests + popup component tests.

## Stories

### Story 1 — Expose per-set breakdown on `ExerciseOccurrence`
**Goal:** Stats service produces the per-set list needed to render a session's series detail, uniformly for pyramid and non-pyramid exercises.
**Scope:** core_logic/shared: `models.ts` / core_logic/stats-exercise: `exercise-stats.service.ts`, `exercise-stats.service.spec.ts`
**Acceptance criteria:**
- [ ] `ExerciseOccurrence` declares `setBreakdown: PyramidSet[]`.
- [ ] Pyramid occurrences carry a copy of `pyramidSets`; non-pyramid carry `sets` identical entries of `{ weightKg, reps }`.
- [ ] Existing aggregate fields (`weightKg`, `volumeKg`, `totalReps`) are unchanged.
**Depends on:** none

### Story 2 — Detail popup component
**Goal:** Provide a read-only overlay that displays a session's series (one row per set, weight × reps) and, when present, the comment block with its edit affordance.
**Scope:** primary_adapters/stats-exercise: `exercise-history-detail-popup.component.ts` / `.html` / `.scss` / `.spec.ts`, `assets/i18n/en.json`
**Acceptance criteria:**
- [ ] Component takes an `ExerciseOccurrence` input and renders one row per `setBreakdown` entry using the visual style of `pyramid-sets-list`.
- [ ] Renders the comment block with edit button only when `comment` is non-null; emits `commentEdited` via the existing `ExerciseCommentPopupComponent`.
- [ ] Emits `close` when the overlay backdrop or close button is clicked; ignores clicks inside the modal body.
**Depends on:** Story 1

### Story 3 — Wire history list to the new popup
**Goal:** Replace the comment-only popup branch in `ExerciseHistoryListComponent` with the new detail popup, making every non-cardio card clickable.
**Scope:** primary_adapters/stats-exercise: `exercise-history-list.component.ts` / `.html` / `.scss` / `.spec.ts`
**Acceptance criteria:**
- [ ] Clicking any non-cardio history card opens the detail popup with the corresponding occurrence; cardio cards remain unclickable.
- [ ] The existing `commentEdited` output of the list still fires when the user edits the comment from inside the popup.
- [ ] Removed: the inline comment-overlay markup and the `o.comment ?` click guard; the `[class.history-card--clickable]` rule now applies unconditionally to non-cardio cards.
**Depends on:** Story 2
