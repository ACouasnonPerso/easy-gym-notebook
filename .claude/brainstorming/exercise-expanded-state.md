# Persist Exercise Expanded State Across Navigation

## What this feature does
When the user expands an exercise card on the session detail page, the expanded/collapsed state is preserved when they navigate to the chrono or stats pages and come back. The exercise that was open before leaving stays open on return, instead of resetting to a fully-collapsed list.

## Design pattern
**Memento / UI State Service.** The expanded exercise id is a small piece of UI state that must outlive a component instance. We promote it from the component's local `signal` to the existing root-scoped `SessionDetailUiService`, which is the established pattern in this codebase for cross-instance UI state (it already holds `showAddExerciseForm` and `currentSessionId`). No new service or store is needed — we extend the existing one.

## Affected areas
- `primary_adapters/session-detail/session-detail-ui.service.ts` — extend with expanded-exercise state.
- `primary_adapters/session-detail/session-exercises-list.component.ts` — replace local `expandedExerciseId` signal with the one exposed by the UI service.
- `primary_adapters/session-detail/session-exercises-list.component.html` — bind to the service-backed signal (no structural change expected).
- `primary_adapters/session-detail/session-exercises-list.component.spec.ts` — update tests that exercise the toggle behavior.
- `primary_adapters/session-detail/session-detail-ui.service.spec.ts` — add tests for the new state.

## New elements to create
None. The feature is implemented entirely by extending the existing `SessionDetailUiService`. No new files, layers, or models are required.

## State and data flow
- `SessionDetailUiService` exposes a writable signal `expandedExerciseId: WritableSignal<string | null>` (readonly view + dedicated mutator method `toggleExpanded(id: string)` that sets to `id` if different, or to `null` if equal — same logic currently in the component).
- The signal is keyed implicitly to the current session via `currentSessionId`. When `setCurrentSessionId(id)` is called for a *different* session id than the previously-stored one, `expandedExerciseId` is reset to `null` so opening a different session does not inherit a stale expansion.
- `SessionExercisesListComponent.toggleExpand` delegates to the service; its template reads `uiService.expandedExerciseId()` instead of the local signal.
- Because the service is `providedIn: 'root'`, the value survives the destruction of `SessionDetailComponent` during navigation to `/chrono/exercise` or `/stats/:exerciseName`, and is read back when the user returns and the component re-instantiates.

## Edge cases to handle
- **Returning to a different session.** Navigating from session A → stats → session B must not show an expanded card from A. Handled by the reset-on-session-change in `setCurrentSessionId`.
- **Expanded exercise was deleted while away.** If the stored id no longer exists in the loaded exercises, the card list should render fully collapsed. The template already binds expanded state per-card by id comparison, so a stale id naturally resolves to "no card expanded"; no extra cleanup required, but the delete handler should clear the stored id when the deleted exercise was the expanded one to keep state truthful.
- **Expanded exercise id persists after end-of-session.** Acceptable: when the user re-opens the (now ended) session detail page, the same card re-expands. This matches the user's mental model of "where I left off".
- **Page reload / app restart.** State is in-memory only, so a hard reload collapses everything. This is intentional — out of scope.

## Testing strategy
- **Service unit tests** (`session-detail-ui.service.spec.ts`):
  - `toggleExpanded(id)` opens, then closes the same id, then switches to a new id.
  - `setCurrentSessionId(newId)` clears `expandedExerciseId` when the id changes; preserves it when the id is identical.
- **Component unit tests** (`session-exercises-list.component.spec.ts`):
  - Toggling an exercise updates the service-backed signal.
  - Initial render reflects the service state (simulate "returning from chrono" by pre-seeding the service).
  - Deleting the currently-expanded exercise clears the stored expanded id.
- No integration test required — navigation-survival is guaranteed by the root-scoped service and is covered transitively by the service unit tests.

## Stories

### Story 1 — Move expanded-exercise state into the UI service
**Goal:** Promote the `expandedExerciseId` signal from the exercises-list component into `SessionDetailUiService`, with a `toggleExpanded` mutator and automatic reset when the current session id changes.
**Scope:** primary_adapters/session-detail: `session-detail-ui.service.ts`, `session-detail-ui.service.spec.ts`
**Acceptance criteria:**
- [ ] Service exposes a readonly `expandedExerciseId` signal and a `toggleExpanded(id)` method matching the existing toggle logic.
- [ ] Calling `setCurrentSessionId` with a new id resets `expandedExerciseId` to `null`; calling it with the same id leaves it untouched.
- [ ] Unit tests cover toggle (open / close-same / switch) and the reset-on-session-change rule.
**Depends on:** none

### Story 2 — Wire the exercises list to the shared expanded state
**Goal:** Replace the local `expandedExerciseId` signal in `SessionExercisesListComponent` with reads/writes against the UI service, and clear the stored id when the expanded exercise is deleted.
**Scope:** primary_adapters/session-detail: `session-exercises-list.component.ts`, `session-exercises-list.component.html`, `session-exercises-list.component.spec.ts`
**Acceptance criteria:**
- [ ] The component no longer owns a local `expandedExerciseId` signal; it reads and toggles via `SessionDetailUiService`.
- [ ] Navigating away and re-creating the component preserves the previously expanded card (verified by pre-seeding the service in the test).
- [ ] Deleting the expanded exercise clears the stored expanded id so no other card inherits the expanded state.
**Depends on:** Story 1
