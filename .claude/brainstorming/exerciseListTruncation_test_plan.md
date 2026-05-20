# Test Plan — Story 1: Truncate exercise list to 10 with show-more toggle

**Story goal:** When no tag is selected and merge mode is off, the stats exercise list shows at
most 10 rows with a Show more / Show less button to expand and collapse, leaving every other
state (tag filter, merge mode, search-only matches under or over 10) unaffected.

**Test type:** Component Integration (Angular TestBed, DOM assertions, `data-testid` selectors)

**Spec file:** `src/app/primary_adapters/stats-global/stats-exercise-list-card.component.spec.ts`

**Files to also touch:**
- `src/app/primary_adapters/stats-global/stats-exercise-list-card.component.ts`
- `src/app/primary_adapters/stats-global/stats-exercise-list-card.component.html`
- `src/app/assets/i18n/en.json`

---

## Prerequisites — changes in supporting files before the spec

### 1. `en.json` — add two keys under `statsGlobal`

```json
"statsGlobal": {
  ...
  "showMore": "Show more",
  "showLess": "Show less"
}
```

### 2. `TRANSLATIONS` constant in the spec — add the same two keys

```typescript
const TRANSLATIONS = {
  ...
  statsGlobal: {
    newNamePlaceholder: "Nouveau nom",
    mergeCount: "Fusionner ({{ count }})",
    confirmMergeTitle: "Confirmer la fusion",
    confirmMergeBody: "",
    showMore: "Voir plus",   // NEW
    showLess: "Voir moins",  // NEW
  },
  ...
};
```

---

## Shared helpers (add to spec alongside existing `makeExercise`)

```typescript
/** Builds a list of N distinct exercises with no muscle groups and no cardio flag. */
function makeExercises(count: number): ExerciseSummary[] {
  return Array.from({ length: count }, (_, i) =>
    makeExercise({ name: `Exercise ${i + 1}` })
  );
}
```

(Note: an identical `makeExercises` helper already exists in the `search bar visibility` describe
block. Move it to module scope so the new describe block can reuse it, or duplicate it locally —
either is acceptable given the existing spec style.)

---

## New describe block

```
describe("StatsExerciseListCardComponent — liste tronquée et bouton afficher plus", ...)
```

Place it after the existing `merge button visibility` describe block.

---

## TPP-ordered test list

### Test 1 (TPP 2 — nil → constant baseline: toggle absent)

**Scenario:** 8 exercises, no tag selected, no merge mode

**it:** `"ne doit pas afficher le bouton afficher-plus quand il y a 8 exercices sans filtre actif"`

**Setup:**
```typescript
setup(makeExercises(8));
```

**Assertions:**
```typescript
const el: HTMLElement = fixture.nativeElement;
const toggleBtn = el.querySelector('[data-testid="show-more-toggle"]');
expect(toggleBtn).toBeNull();

const rows = el.querySelectorAll("app-exercise-summary-row");
expect(rows.length).toBe(8);
```

**TPP note:** Establishes the baseline — the toggle does not exist when the list is short. Can be
satisfied by never rendering the button at all (constant: button is always absent).

---

### Test 2 (TPP 3 — constant → conditional: toggle absent when tag is active)

**Scenario:** 15 exercises, one tag selected (Chest), no merge mode

**it:** `"ne doit pas afficher le bouton afficher-plus quand un tag est sélectionné, même avec 15 exercices"`

**Setup:**
```typescript
const exercises = [
  ...Array.from({ length: 14 }, (_, i) => makeExercise({ name: `Exercise ${i + 1}` })),
  makeExercise({ name: "Développé couché", muscleGroups: [MuscleGroup.Chest] }),
];
setup(exercises);

const el: HTMLElement = fixture.nativeElement;
const chestChip = Array.from(
  el.querySelectorAll<HTMLElement>('[data-testid="tag-filter-chip"]')
).find((c) => c.textContent?.trim() === MuscleGroup.Chest)!;
chestChip.click();
fixture.detectChanges();
```

**Assertions:**
```typescript
const toggleBtn = el.querySelector('[data-testid="show-more-toggle"]');
expect(toggleBtn).toBeNull();
```

**TPP note:** Forces a conditional — the "always absent" constant from Test 1 must now check
whether a tag is selected.

---

### Test 3 (TPP 4 — unconditional → multi-condition: toggle absent when merge mode is on)

**Scenario:** 15 exercises, no tag selected, merge mode ON

**it:** `"ne doit pas afficher le bouton afficher-plus quand le mode fusion est actif, même avec 15 exercices"`

**Setup:**
```typescript
setup(makeExercises(15));

const el: HTMLElement = fixture.nativeElement;
const mergeBtn = el.querySelector<HTMLElement>('[data-testid="merge-btn"]')!;
mergeBtn.click();
fixture.detectChanges();
```

**Assertions:**
```typescript
const toggleBtn = el.querySelector('[data-testid="show-more-toggle"]');
expect(toggleBtn).toBeNull();

// All 15 rows still rendered in merge mode (merge rows, not app-exercise-summary-row)
const mergeRows = el.querySelectorAll('[data-testid="exercise-merge-checkbox"]');
expect(mergeRows.length).toBe(15);
```

**TPP note:** Adds a second disabling condition — merge mode also suppresses the toggle. Forces
the implementation to check `!isMergeMode()`.

---

### Test 4 (TPP 4 — unconditional → multi-condition: toggle absent when search query is active with ≤ 10 matches)

**Scenario:** 21 exercises (so the search bar appears), 7 match the query, no tag, no merge

**it:** `"ne doit pas afficher le bouton afficher-plus quand une recherche est active avec 7 résultats"`

**Setup:**
```typescript
const exercises = [
  ...makeExercises(21).map((e, i) => ({ ...e, name: `Exercice générique ${i + 1}` })),
];
// Replace the last 7 with names that will match "curl"
const named = exercises.map((e, i) =>
  i >= 14 ? makeExercise({ name: `Curl ${i + 1}` }) : e
);
setup(named);

const el: HTMLElement = fixture.nativeElement;
const searchBar = el.querySelector<HTMLInputElement>('[data-testid="exercise-search-input"]')!;
searchBar.value = "curl";
searchBar.dispatchEvent(new Event("input"));
fixture.detectChanges();
```

**Practical shorthand (avoids awkward splice):**
```typescript
const exercises = [
  ...Array.from({ length: 14 }, (_, i) => makeExercise({ name: `Exercice ${i + 1}` })),
  ...Array.from({ length: 7 }, (_, i) => makeExercise({ name: `Curl ${i + 1}` })),
];
// Total = 21, so the search bar is visible (exercises().length > 20)
setup(exercises);

const el: HTMLElement = fixture.nativeElement;
const searchBar = el.querySelector<HTMLInputElement>('[data-testid="exercise-search-input"]')!;
searchBar.value = "Curl";
searchBar.dispatchEvent(new Event("input"));
fixture.detectChanges();
```

**Assertions:**
```typescript
const toggleBtn = el.querySelector('[data-testid="show-more-toggle"]');
expect(toggleBtn).toBeNull();

const rows = el.querySelectorAll("app-exercise-summary-row");
expect(rows.length).toBe(7);
```

**TPP note:** Adds a third disabling condition — an active search query suppresses the toggle even
when fewer than 10 results are shown. Forces `searchQuery().trim() === ''` check.

---

### Test 5 (TPP 4 — scalar → extended condition: toggle absent when search returns > 10 matches)

**Scenario:** 21 exercises (search bar visible), 15 match the query, no tag, no merge

**it:** `"ne doit pas afficher le bouton afficher-plus quand une recherche active retourne 15 résultats"`

**Setup:**
```typescript
const exercises = [
  ...Array.from({ length: 6 }, (_, i) => makeExercise({ name: `Exercice ${i + 1}` })),
  ...Array.from({ length: 15 }, (_, i) => makeExercise({ name: `Curl ${i + 1}` })),
];
// Total = 21
setup(exercises);

const el: HTMLElement = fixture.nativeElement;
const searchBar = el.querySelector<HTMLInputElement>('[data-testid="exercise-search-input"]')!;
searchBar.value = "Curl";
searchBar.dispatchEvent(new Event("input"));
fixture.detectChanges();
```

**Assertions:**
```typescript
const toggleBtn = el.querySelector('[data-testid="show-more-toggle"]');
expect(toggleBtn).toBeNull();

const rows = el.querySelectorAll("app-exercise-summary-row");
expect(rows.length).toBe(15);
```

**TPP note:** Distinguishes "search bypasses the cap" from the simple "≤ 10" edge case. The list
has more than 10 results but the toggle must still be absent because a search query is active.
This prevents a naive implementation that only checks `filteredExercises().length > 10`.

---

### Test 6 (TPP 3 → 4 — first happy-path: toggle appears and 10 rows shown)

**Scenario:** 15 exercises, no tag, no merge, no search

**it:** `"doit afficher 10 lignes et le bouton afficher-plus quand il y a 15 exercices sans filtre actif"`

**Setup:**
```typescript
setup(makeExercises(15));
```

**Assertions:**
```typescript
const el: HTMLElement = fixture.nativeElement;

const rows = el.querySelectorAll("app-exercise-summary-row");
expect(rows.length).toBe(10);

const toggleBtn = el.querySelector('[data-testid="show-more-toggle"]');
expect(toggleBtn).not.toBeNull();
expect(toggleBtn!.textContent?.trim()).toBe("Voir plus");
```

**TPP note:** This is the first test that forces the implementation to actually truncate the list
and render the toggle button. Satisfying it requires `visibleExercises = slice(0, 10)` and the
conditional rendering of the button.

---

### Test 7 (TPP 8 — value → mutated value: click expands list and changes label)

**Scenario:** 15 exercises, no filter → click "Show more" → all 15 rows visible, label becomes "Show less"

**it:** `"doit afficher les 15 exercices et le libellé 'voir moins' après un clic sur afficher-plus"`

**Setup:**
```typescript
setup(makeExercises(15));
```

**Interaction:**
```typescript
const el: HTMLElement = fixture.nativeElement;
const toggleBtn = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
toggleBtn.click();
fixture.detectChanges();
```

**Assertions:**
```typescript
const rows = el.querySelectorAll("app-exercise-summary-row");
expect(rows.length).toBe(15);

const updatedToggle = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
expect(updatedToggle).not.toBeNull();
expect(updatedToggle.textContent?.trim()).toBe("Voir moins");
```

**TPP note:** Forces the `isExpanded` signal to actually flip and `visibleExercises` to return the
full list. The label change forces translation key branching in the template.

---

### Test 8 (TPP 8 — mutated value cycles: click again collapses back)

**Scenario:** 15 exercises, no filter → expand → click "Show less" → back to 10 rows

**it:** `"doit revenir à 10 lignes et au libellé 'voir plus' après un second clic sur le bouton"`

**Setup:**
```typescript
setup(makeExercises(15));
```

**Interaction:**
```typescript
const el: HTMLElement = fixture.nativeElement;
const toggleBtn = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
toggleBtn.click();          // expand
fixture.detectChanges();
const showLessBtn = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
showLessBtn.click();        // collapse
fixture.detectChanges();
```

**Assertions:**
```typescript
const rows = el.querySelectorAll("app-exercise-summary-row");
expect(rows.length).toBe(10);

const collapsedToggle = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
expect(collapsedToggle).not.toBeNull();
expect(collapsedToggle.textContent?.trim()).toBe("Voir plus");
```

**TPP note:** Completes the toggle cycle. Forces `isExpanded` to toggle back to `false` on second
click, not be a one-way latch.

---

### Test 9 (immutability guard — input array is never mutated)

**Scenario:** 15 exercises, expand then collapse — input length must remain 15 throughout

**it:** `"ne doit jamais modifier le tableau d'entrée 'exercises', quelle que soit l'action sur le bouton"`

**Setup:**
```typescript
const source = makeExercises(15);
setup(source);
```

**Interaction:**
```typescript
const el: HTMLElement = fixture.nativeElement;
const toggleBtn = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
toggleBtn.click();
fixture.detectChanges();
const showLessBtn = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
showLessBtn.click();
fixture.detectChanges();
```

**Assertions:**
```typescript
expect(source.length).toBe(15);
```

**TPP note:** Pure immutability guard. The `source` array reference is snapshotted before setup;
if `.splice()`, `.pop()`, or any in-place mutation were used it would be caught here.

---

## Complete describe block skeleton

```typescript
describe("StatsExerciseListCardComponent — liste tronquée et bouton afficher plus", () => {
  let fixture: ReturnType<typeof TestBed.createComponent<StatsExerciseListCardComponent>>;

  function setup(exercises: ExerciseSummary[]) {
    TestBed.configureTestingModule({
      imports: [StatsExerciseListCardComponent, translateModuleConfig],
    });
    setupI18n();
    fixture = TestBed.createComponent(StatsExerciseListCardComponent);
    fixture.componentRef.setInput("exercises", exercises);
    fixture.detectChanges();
  }

  // Test 1 — TPP 2
  it("ne doit pas afficher le bouton afficher-plus quand il y a 8 exercices sans filtre actif", () => { ... });

  // Test 2 — TPP 3
  it("ne doit pas afficher le bouton afficher-plus quand un tag est sélectionné, même avec 15 exercices", () => { ... });

  // Test 3 — TPP 4
  it("ne doit pas afficher le bouton afficher-plus quand le mode fusion est actif, même avec 15 exercices", () => { ... });

  // Test 4 — TPP 4
  it("ne doit pas afficher le bouton afficher-plus quand une recherche est active avec 7 résultats", () => { ... });

  // Test 5 — TPP 4
  it("ne doit pas afficher le bouton afficher-plus quand une recherche active retourne 15 résultats", () => { ... });

  // Test 6 — TPP 3→4
  it("doit afficher 10 lignes et le bouton afficher-plus quand il y a 15 exercices sans filtre actif", () => { ... });

  // Test 7 — TPP 8
  it("doit afficher les 15 exercices et le libellé 'voir moins' après un clic sur afficher-plus", () => { ... });

  // Test 8 — TPP 8
  it("doit revenir à 10 lignes et au libellé 'voir plus' après un second clic sur le bouton", () => { ... });

  // Test 9 — immutability
  it("ne doit jamais modifier le tableau d'entrée 'exercises', quelle que soit l'action sur le bouton", () => { ... });
});
```

---

## Design notes

### Existing code to reuse
- `translateModuleConfig` and `FakeTranslateLoader` — already defined at module scope, reuse as-is
- `setupI18n()` — already defined, reuse as-is
- `makeExercise()` — already defined at module scope, reuse
- `makeExercises(count)` — already defined inside the search bar describe block; lift to module scope so both describe blocks can share it
- `data-testid="merge-btn"` — already in the template, used to trigger merge mode in Test 3
- `data-testid="tag-filter-chip"` — already in the template, used to trigger tag filter in Test 2
- `data-testid="exercise-search-input"` — already in the template, used to trigger search in Tests 4 and 5
- `app-exercise-summary-row` selector — already used in other tests to count visible rows
- `[data-testid="exercise-merge-checkbox"]` — already in the template, used in Test 3 to count merge rows

### New code needed in the component (`stats-exercise-list-card.component.ts`)
- `isExpanded = signal(false)`
- `shouldTruncate = computed(...)` — all four conditions: `selectedTags().size === 0`, `!isMergeMode()`, `searchQuery().trim() === ''`, `filteredExercises().length > 10`, `!isExpanded()`
- `visibleExercises = computed(...)` — slices or returns full list depending on `shouldTruncate()`
- `showToggleButton = computed(...)` — same conditions except `isExpanded` (button persists while expanded)
- A `toggleExpanded()` method or an inline `isExpanded.set(!isExpanded())` in the template

### New code needed in the template (`stats-exercise-list-card.component.html`)
- Replace `filteredExercises()` with `visibleExercises()` in the `@for` loop
- Add a conditional button block below `</div>` that closes `.exercise-list`:
  ```html
  @if (showToggleButton()) {
    <button data-testid="show-more-toggle" (click)="isExpanded.set(!isExpanded())">
      {{ (isExpanded() ? "statsGlobal.showLess" : "statsGlobal.showMore") | translate }}
    </button>
  }
  ```

### New i18n keys (`src/app/assets/i18n/en.json`)
- `statsGlobal.showMore`: `"Show more"`
- `statsGlobal.showLess`: `"Show less"`
- These are the only file that needs updating (per project convention, only `en.json` gets new keys)

### Patterns observed
- Every existing describe block has its own local `setup()` function that re-configures `TestBed` — follow the same pattern, do not share state across describe blocks
- Row count is always checked via `el.querySelectorAll("app-exercise-summary-row")` (for normal mode) or `[data-testid="exercise-merge-checkbox"]` (for merge mode)
- Button text is read via `element.textContent?.trim()`
- Toggle interactions: `.click()` then `fixture.detectChanges()` — no `await fixture.whenStable()` needed because no async operations are involved
- Tests 4 and 5 require 21 exercises total so the search bar is rendered (`showSearchBar` computed: `exercises().length > 20`)
