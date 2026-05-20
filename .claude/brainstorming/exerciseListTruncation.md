# Exercise List Truncation

## What this feature does
On the statistics page, when no muscle-group/cardio tag is selected (and the user is not in merge mode), the exercise list is capped to the first 10 entries with a "Show more / Show less" toggle. This keeps the rest of the stats screen reachable on long libraries, without ever altering the underlying statistics computations.

## Design pattern
No design pattern is forced here. The behavior is a pure view-layer projection layered on top of the existing `filteredExercises` computed signal — a thin presentational decorator (truncate + toggle) over an already-filtered collection.

## Affected areas
- `primary_adapters/stats-global/stats-exercise-list-card.component.ts` — add display-only state (expanded flag) and a new computed for the truncated/expanded list.
- `primary_adapters/stats-global/stats-exercise-list-card.component.html` — render the new computed instead of `filteredExercises()` and add the toggle button.
- `primary_adapters/stats-global/stats-global.component.scss` (or the card's own stylesheet) — minimal styling for the toggle button.
- `src/app/assets/i18n/en.json` — two new translation keys under `statsGlobal` for "Show more" / "Show less" (English only per project convention).
- `primary_adapters/stats-global/stats-exercise-list-card.component.spec.ts` — coverage for the new truncation behavior.

## New elements to create
No new files. All logic stays inside the existing `StatsExerciseListCardComponent`, which already owns every other display-only filter (tags, search, merge).

## State and data flow
- New signal `isExpanded` (boolean, default `false`) — local UI state, never persisted.
- New computed `shouldTruncate`:
  - `true` only when no tag is selected (`selectedTags().size === 0`),
    AND merge mode is off (`!isMergeMode()`),
    AND no search query is active (`searchQuery().trim() === ''`),
    AND the filtered list length exceeds the cap (10),
    AND `isExpanded()` is `false`.
- New computed `visibleExercises`:
  - When `shouldTruncate()` is `true` → `filteredExercises().slice(0, 10)`.
  - Otherwise → `filteredExercises()` unchanged.
- New computed `showToggleButton`:
  - `true` when no tag is selected, merge mode is off, no search query is active, and `filteredExercises().length > 10`.
- Template iterates over `visibleExercises()` instead of `filteredExercises()`. The toggle button is rendered below the list only when `showToggleButton()` is `true`, and flips `isExpanded`.
- The `ExerciseSummary[]` input and all downstream stats (donut, summary, charts) stay untouched — only the rendered slice changes. When a search query is active, all matching exercises are shown regardless of count — the cap only kicks in when the list is unfiltered (no tag, no search, no merge).

## Edge cases to handle
- Fewer than or exactly 10 exercises after filtering → no toggle button shown, full list rendered.
- Tag filter active (one or more chips selected, including `cardio`) → full filtered list always rendered, no toggle.
- Merge mode active → full list always rendered, no toggle (even if more than 10 and no tag selected); selection logic and incompatibility highlighting must keep working on the full set.
- Switching merge mode off, or selecting/deselecting a tag, must not lose the user's `isExpanded` state silently — but if the resulting list drops to ≤ 10, the toggle simply disappears (expanded state becomes a no-op).
- Search query active (even if it returns > 10 results) → full matching list shown, no toggle button. The cap only applies when the list is completely unfiltered.
- Search query narrowing the list to ≤ 10 → full matching list shown naturally (cap not reached anyway).

## Testing strategy
Component-level tests in `stats-exercise-list-card.component.spec.ts` (Angular TestBed, no UI service mocking needed since the component is self-contained):
- With 15 exercises and no tag/no merge: renders 10 rows and a "Show more" button; clicking it renders 15 rows and shows "Show less"; clicking again collapses back to 10.
- With 15 exercises and one tag selected: renders all matching rows, no toggle button.
- With 15 exercises and merge mode on: renders all 15 merge rows, no toggle button.
- With 8 exercises and no tag: renders 8 rows, no toggle button.
- Search query active with 7 matching exercises and no tag: no toggle button, 7 rows rendered.
- Search query active with 15 matching exercises and no tag: no toggle button, all 15 rendered (search bypasses the cap).
- The component never mutates or re-emits the `exercises` input — confirm by snapshotting input length before/after toggling.

---

## TDD Test Plan

### Test type
Component Integration Test — Angular TestBed, DOM assertions, no store/service mocking needed.
The component is fully self-contained: all filtering signals (`selectedTags`, `isMergeMode`, `searchQuery`) are internal to `StatsExerciseListCardComponent`; the only external input is `exercises`.

### File to edit
`src/app/primary_adapters/stats-global/stats-exercise-list-card.component.spec.ts`

### Translation keys required (to add to `en.json` `statsGlobal` block)
```json
"showMore": "Show more",
"showLess": "Show less"
```
These must also be added to the `TRANSLATIONS` constant in the spec file's `FakeTranslateLoader`.

---

### Test fixture helpers (to add alongside existing `makeExercise`)

```typescript
/**
 * Returns `count` ExerciseSummary objects named "Exercise 1" … "Exercise N".
 * No muscle groups, no cardio — satisfies the "no tag, no merge, no search" condition.
 */
function makeExercises(count: number): ExerciseSummary[] {
  return Array.from({ length: count }, (_, i) =>
    makeExercise({ name: `Exercise ${i + 1}` })
  );
}

/**
 * Returns `count` ExerciseSummary objects all tagged with MuscleGroup.Chest.
 * Used to test that a tag filter bypasses the truncation.
 */
function makeChestExercises(count: number): ExerciseSummary[] {
  return Array.from({ length: count }, (_, i) =>
    makeExercise({ name: `Chest Exercise ${i + 1}`, muscleGroups: [MuscleGroup.Chest] })
  );
}
```

Note: `makeExercises(count)` already exists in the "search bar visibility and filtering" describe block. It should be hoisted to module scope so the new describe block can share it without duplication.

---

### TRANSLATIONS constant amendment

Add two keys to the existing `TRANSLATIONS.statsGlobal` object in the spec file:

```typescript
statsGlobal: {
  // ... existing keys ...
  showMore: "Show more",
  showLess: "Show less",
}
```

---

### TestBed setup helper (to copy from pattern used in all other describe blocks)

```typescript
function setup(exercises: ExerciseSummary[]) {
  TestBed.configureTestingModule({
    imports: [StatsExerciseListCardComponent, translateModuleConfig],
  });
  setupI18n();
  fixture = TestBed.createComponent(StatsExerciseListCardComponent);
  fixture.componentRef.setInput('exercises', exercises);
  fixture.detectChanges();
}
```

---

## `describe` block: `StatsExerciseListCardComponent — show-more toggle`

Top-level variable declarations (same style as all other describe blocks in the file):

```typescript
let fixture: ReturnType<typeof TestBed.createComponent<StatsExerciseListCardComponent>>;
```

---

### Nested `describe`: default collapsed state (no tag, no merge, no search, list > 10)

#### T1 — FIRST / LABEL: `should render only the first 10 exercise rows and display the show-more toggle when there are 15 exercises and no filter is active`

**TPP step:** nil → constant (2) — establishes the baseline; can be satisfied by always slicing to 10 and always showing the button.
**Contradiction:** none — first test in this group.
**FLFI label:** FIRST (simplest happy path — the core truncation behavior).

**Preconditions:**
- `exercises` input = `makeExercises(15)` (15 items, no muscle groups, not cardio)
- No tag selected (default: `selectedTags` signal is an empty Set)
- Not in merge mode (default: `isMergeMode` signal is `false`)
- No search query (default: `searchQuery` signal is `''`)

**Steps:**
- Call `setup(makeExercises(15))` — triggers `fixture.detectChanges()` internally.

**Assertions:**
1. `el.querySelectorAll('app-exercise-summary-row').length` equals `10`
2. `el.querySelector('[data-testid="show-more-toggle"]')` is not null (button is present in the DOM)
3. `el.querySelector('[data-testid="show-more-toggle"]').textContent.trim()` equals `'Show more'`

---

### Nested `describe`: expanding and collapsing

#### T2 — LAST / LABEL: `should render all 15 exercise rows and display the show-less label when the show-more toggle is clicked once`

**TPP step:** constant → variable (3) — a hardcoded slice-to-10 is insufficient; the toggle click must change the rendered count. Forces `isExpanded` signal and `visibleExercises` computed into existence.
**Contradiction:** T1 was satisfied by always slicing to 10; T2 requires that after a click the full 15 rows appear, which is impossible with a constant slice.

**FLFI label:** LAST (completes the expand direction of the toggle behavior).

**Preconditions:**
- `exercises` input = `makeExercises(15)`
- No tag, no merge, no search (all defaults)

**Steps:**
1. Call `setup(makeExercises(15))`.
2. Click `el.querySelector('[data-testid="show-more-toggle"]')`.
3. Call `fixture.detectChanges()`.

**Assertions:**
1. `el.querySelectorAll('app-exercise-summary-row').length` equals `15`
2. `el.querySelector('[data-testid="show-more-toggle"]').textContent.trim()` equals `'Show less'`

---

#### T3 — FREQUENT / LABEL: `should collapse back to 10 exercise rows and restore the show-more label when the show-more toggle is clicked a second time`

**TPP step:** unconditional → conditional (4) — the click handler cannot be a simple toggle without a conditional; it must alternate between expanded and collapsed states based on the current value of `isExpanded`.
**Contradiction:** T2 forced a flip to `true`; T3 forces a flip back to `false`, requiring the handler to read the current signal value rather than always setting it to the same state.

**FLFI label:** FREQUENT (toggle round-trip is the most exercised user path).

**Preconditions:**
- `exercises` input = `makeExercises(15)`
- No tag, no merge, no search

**Steps:**
1. Call `setup(makeExercises(15))`.
2. Click `[data-testid="show-more-toggle"]` — expands.
3. `fixture.detectChanges()`.
4. Click `[data-testid="show-more-toggle"]` again — collapses.
5. `fixture.detectChanges()`.

**Assertions:**
1. `el.querySelectorAll('app-exercise-summary-row').length` equals `10`
2. `el.querySelector('[data-testid="show-more-toggle"]').textContent.trim()` equals `'Show more'`

---

### Nested `describe`: toggle suppressed by tag filter

#### T4 — INTERESTING / LABEL: `should render all matching exercise rows and hide the show-more toggle when a muscle-group tag is selected regardless of list size`

**TPP step:** unconditional → conditional (4) — `showToggleButton` and `visibleExercises` must now check `selectedTags().size === 0`; a simple "always slice" implementation is broken by a selected tag.
**Contradiction:** T1–T3 could be satisfied with a condition only on `isExpanded`; T4 forces a second condition on `selectedTags.size`.

**FLFI label:** INTERESTING (first boundary that defeats the naive implementation via tag state).

**Preconditions:**
- `exercises` input = `makeChestExercises(15)` (15 exercises all tagged Chest)
- No merge, no search

**Steps:**
1. Call `setup(makeChestExercises(15))`.
2. Locate the Chest chip: `el.querySelector('[data-testid="tag-filter-chip"]')`.
3. Click the Chest chip.
4. `fixture.detectChanges()`.

**Assertions:**
1. `el.querySelectorAll('app-exercise-summary-row').length` equals `15`
2. `el.querySelector('[data-testid="show-more-toggle"]')` is null

---

### Nested `describe`: toggle suppressed by merge mode

#### T5 — INTERESTING / LABEL: `should render all exercise rows in merge mode and hide the show-more toggle when merge mode is active`

**TPP step:** unconditional → conditional (4) — `showToggleButton` must additionally gate on `!isMergeMode()`; satisfying T4 by checking tags alone fails for this case.
**Contradiction:** An implementation that only checks `selectedTags` would still show the toggle here, because no tag is selected; T5 forces the `isMergeMode` check.

**FLFI label:** INTERESTING (second mode that disables truncation; exercises render as merge rows, not summary rows).

**Preconditions:**
- `exercises` input = `makeExercises(15)`
- No tag, no search

**Steps:**
1. Call `setup(makeExercises(15))`.
2. Click `[data-testid="merge-btn"]` to activate merge mode.
3. `fixture.detectChanges()`.

**Assertions:**
1. `el.querySelectorAll('[data-testid="exercise-merge-checkbox"]').length` equals `15` (merge rows use `data-testid="exercise-merge-checkbox"`, not `app-exercise-summary-row`)
2. `el.querySelector('[data-testid="show-more-toggle"]')` is null

---

### Nested `describe`: list below threshold

#### T6 — FIRST / LABEL: `should render all exercise rows and hide the show-more toggle when there are 8 exercises and no filter is active`

**TPP step:** unconditional → conditional (4) — `showToggleButton` must also check `filteredExercises().length > 10`; without this guard the button would appear even for small lists.
**Contradiction:** T1 was satisfied with a constant "always show toggle when list.length > something"; T6 proves the toggle must disappear when the list is short, forcing the length check into `showToggleButton`.

**FLFI label:** FIRST (degenerate case — list naturally fits without truncation).

**Preconditions:**
- `exercises` input = `makeExercises(8)`
- No tag, no merge, no search

**Steps:**
1. Call `setup(makeExercises(8))`.

**Assertions:**
1. `el.querySelectorAll('app-exercise-summary-row').length` equals `8`
2. `el.querySelector('[data-testid="show-more-toggle"]')` is null

---

### Nested `describe`: toggle suppressed by active search — list under threshold after filtering

#### T7 — INTERESTING / LABEL: `should render all matching exercise rows and hide the show-more toggle when a search query is active and produces 7 results`

**TPP step:** unconditional → conditional (4) — `showToggleButton` must also gate on `searchQuery().trim() === ''`; without this check, a search returning fewer than 10 matches would still hide the toggle correctly by accident (via the length check), but a search returning more than 10 would wrongly show it (see T8).
**Contradiction:** An implementation that gates only on `filteredExercises().length > 10` would behave correctly here by coincidence (7 < 10), but T8 exposes the flaw. Together T7 and T8 force the explicit `searchQuery` check.

**FLFI label:** INTERESTING (search is an orthogonal suppression axis; T7 and T8 together prove it).

**Preconditions:**
- `exercises` input: 20 exercises named `"Exercise 1"` … `"Exercise 20"` plus 7 exercises named `"Squat 1"` … `"Squat 7"` (27 total).
  Concrete construction: `[...makeExercises(20), ...Array.from({ length: 7 }, (_, i) => makeExercise({ name: \`Squat ${i + 1}\` }))]`
- The search bar must be visible (requires `exercises().length > 20` which is satisfied by 27 exercises).
- No tag, no merge.

**Steps:**
1. Call `setup` with the 27-exercise array.
2. Locate `[data-testid="exercise-search-input"]`.
3. Set `searchInput.value = 'Squat'`; dispatch an `input` event.
4. `fixture.detectChanges()`.

**Assertions:**
1. `el.querySelectorAll('app-exercise-summary-row').length` equals `7`
2. `el.querySelector('[data-testid="show-more-toggle"]')` is null

---

### Nested `describe`: toggle suppressed by active search — list above threshold after filtering

#### T8 — INTERESTING / LABEL: `should render all matching exercise rows and hide the show-more toggle when a search query is active and produces more than 10 results`

**TPP step:** unconditional → conditional (4) — this test makes the `searchQuery` check mandatory in `showToggleButton`. Without an explicit `searchQuery().trim() === ''` guard, an implementation relying solely on the length check would wrongly show the toggle button here (15 matches > 10).
**Contradiction:** T7 alone could be satisfied by a length check (7 < 10 hides the button by coincidence); T8 proves the length check is insufficient and forces the `searchQuery` guard.

**FLFI label:** INTERESTING (the decisive test that closes the search-bypass loophole).

**Preconditions:**
- `exercises` input: 10 exercises named `"Exercise 1"` … `"Exercise 10"` plus 15 exercises named `"Squat 1"` … `"Squat 15"` (25 total, search bar visible because 25 > 20).
  Concrete construction: `[...makeExercises(10), ...Array.from({ length: 15 }, (_, i) => makeExercise({ name: \`Squat ${i + 1}\` }))]`
- No tag, no merge.

**Steps:**
1. Call `setup` with the 25-exercise array.
2. Locate `[data-testid="exercise-search-input"]`.
3. Set `searchInput.value = 'Squat'`; dispatch an `input` event.
4. `fixture.detectChanges()`.

**Assertions:**
1. `el.querySelectorAll('app-exercise-summary-row').length` equals `15`
2. `el.querySelector('[data-testid="show-more-toggle"]')` is null

---

### Nested `describe`: input immutability

#### T9 — LAST / LABEL: `should not mutate the exercises input array when the show-more toggle is clicked`

**TPP step:** value → mutated value (8) — verifies that the component never mutates the reference it received as input, confirming the slice is a view-layer projection only.
**Contradiction:** This is not about changing the implementation but about asserting a safety invariant; it is satisfied automatically if `visibleExercises` uses `slice` (non-mutating). The test makes the invariant explicit and catches a future regression.

**FLFI label:** LAST (safety net — validates no side-effects on the input).

**Preconditions:**
- `exercises` input = `makeExercises(15)`, captured as a `const inputArray` before setup.

**Steps:**
1. Capture `const inputArray = makeExercises(15)`.
2. Call `setup(inputArray)`.
3. Click `[data-testid="show-more-toggle"]` — expand.
4. `fixture.detectChanges()`.
5. Click `[data-testid="show-more-toggle"]` — collapse.
6. `fixture.detectChanges()`.

**Assertions:**
1. `inputArray.length` equals `15` (unchanged throughout)
2. `inputArray[0].name` equals `'Exercise 1'` (no reordering or mutation)

---

## TPP order summary

| # | Test label (short) | TPP transformation | FLFI |
|---|--------------------|--------------------|------|
| T6 | 8 exercises — no toggle | unconditional → conditional (length guard) | FIRST |
| T1 | 15 exercises — 10 rows + toggle visible | nil → constant | FIRST |
| T2 | Click once — 15 rows + "Show less" | constant → variable | LAST |
| T3 | Click twice — back to 10 + "Show more" | unconditional → conditional (isExpanded flip) | FREQUENT |
| T4 | Tag active — full list, no toggle | unconditional → conditional (selectedTags guard) | INTERESTING |
| T5 | Merge mode — full list, no toggle | unconditional → conditional (isMergeMode guard) | INTERESTING |
| T7 | Search → 7 matches — no toggle | unconditional → conditional (searchQuery guard, via coincidence) | INTERESTING |
| T8 | Search → 15 matches — no toggle | unconditional → conditional (searchQuery guard, decisive) | INTERESTING |
| T9 | Input array not mutated | value → mutated value (safety invariant) | LAST |

Recommended execution order: T6, T1, T2, T3, T4, T5, T7, T8, T9.

---

## Stories

### Story 1 — Truncate exercise list to 10 with show-more toggle
**Goal:** When no tag is selected and merge mode is off, the stats exercise list shows at most 10 rows with a Show more / Show less button to expand and collapse, leaving every other state (tag filter, merge mode, search-only matches under 10) unaffected.
**Scope:** primary_adapters/stats-global: stats-exercise-list-card.component.ts, stats-exercise-list-card.component.html, stats-exercise-list-card.component.spec.ts / assets/i18n: en.json
**Acceptance criteria:**
- [ ] With more than 10 exercises and no tag selected, only the first 10 rows render and a translated "Show more" toggle appears below the list.
- [ ] Clicking the toggle expands to the full filtered list and switches its label to "Show less"; clicking again collapses back to 10.
- [ ] When at least one tag is selected, when merge mode is active, or when a search query is typed, the full filtered/matched list renders and the toggle is not displayed.
- [ ] The `exercises` input and all parent statistics remain unchanged regardless of expanded/collapsed state (verified by the component never mutating the input array).
**Depends on:** none
