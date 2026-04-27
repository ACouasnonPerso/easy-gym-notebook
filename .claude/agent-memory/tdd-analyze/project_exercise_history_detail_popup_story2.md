---
name: exercise_history_detail_popup_story2
description: Story 2 of exercise-history-sets-detail feature — ExerciseHistoryDetailPopupComponent test plan, conventions, design notes.
type: project
---

## Story 2 scope (2026-04-27)
Goal: Read-only overlay that displays a session's series (one row per set, weight × reps) and, when present, the comment block with edit affordance.

**Why:** Part of the exercise-history-sets-detail feature (see brainstorming/exercise-history-sets-detail.md). Depends on Story 1 which added `setBreakdown: PyramidSet[]` to `ExerciseOccurrence`.

**How to apply:** All tests are COMPONENT INTEGRATION (component drives its own overlay template; tested via DOM). Mirrors the pattern of ExerciseCommentPopupComponent and ExerciseRatingPopupComponent specs.

## Key file paths
- Target component: `src/app/primary_adapters/stats-exercise/exercise-history-detail-popup.component.ts` (+ .html, .scss)
- Spec: `src/app/primary_adapters/stats-exercise/exercise-history-detail-popup.component.spec.ts`
- i18n: `src/app/assets/i18n/en.json` — new keys under `statsExercise` for popup title (English only)
- Reuses: `ExerciseCommentPopupComponent` from `primary_adapters/session-detail/exercise-comment-popup.component.ts`

## Component API
- Input: `occurrence: ExerciseOccurrence` (required)
- Output: `close: void` (backdrop click OR close button click)
- Output: `commentEdited: { exerciseId: string; comment: string | null }` (from embedded comment popup)

## Test pattern observed
- `provideTranslateService({ defaultLanguage: 'en' })` for simple popup tests
- `TestBed.configureTestingModule({ imports: [Component], providers: [...] })`
- `fixture.componentRef.setInput(...)` + `fixture.detectChanges()`
- DOM queries: `fixture.nativeElement.querySelector('.selector')`
- Click simulation: `.click()` on nativeElement
- Output capture: `component.outputName.subscribe(v => emitted = v)`
- CSS class convention for overlay: `.overlay` (click emits close) + `.modal-body` / `.form-card` (stopPropagation)
- Close button pattern: `.btn-close` or `.close-btn`
- Set rows: `.pyramid-row` per setBreakdown entry (mirrors exercise-expanded.component.html)

## TPP order summary
1. Renders set rows for setBreakdown entries (constant → list, baseline)
2. Renders weight × reps values per row (variable)
3. Renders no rows when setBreakdown is empty (edge case / contradiction)
4. Hides comment block when comment is null (conditional introduced)
5. Shows comment block when comment is present (conditional true branch)
6. Opens edit popup when edit button is clicked (conditional → nested component)
7. Emits commentEdited when edit popup saves (output forwarding)
8. Emits close when overlay backdrop is clicked (overlay interaction)
9. Emits close when close button is clicked (second trigger for same output)
10. Does NOT emit close when modal body is clicked (stopPropagation)
