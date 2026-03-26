# S04 — Session Detail: exercise expand, DrumPicker, validate/cancel/delete, End session

## Goal
Complete the session detail page with the expanded exercise panel (DrumPicker parameter selectors + action buttons), exercise state management, and the End Session flow with manual time override.

## Scope
- `src/app/primary_adapters/session-detail/exercise-expanded.component.ts`
- `src/app/primary_adapters/shared/drum-picker.component.ts`
- `src/app/primary_ports/session-detail/update-exercise.usecase.ts`
- `src/app/primary_ports/session-detail/validate-exercise.usecase.ts`
- `src/app/primary_ports/session-detail/cancel-exercise.usecase.ts`
- `src/app/primary_ports/session-detail/delete-exercise.usecase.ts`
- `src/app/primary_ports/session-detail/end-session.usecase.ts`
- Updates to `session-detail.component.ts` (wire Break button, End button, manual override UI)
- Updates to `exercise-card.component.ts` (embed `ExerciseExpandedComponent` when `isExpanded`)
- Updates to `add-exercise-form.component.ts` (replace plain inputs with DrumPicker)

HTML reference: `design/fitness-app-page-3-5.html` (session detail with expanded exercise panel) — **référence visuelle uniquement** : disposition du panneau étendu, DrumPicker (colonnes scrollables), boutons d'action. Ne pas recopier le HTML statique ; implémenter la logique Angular complète (DrumPicker scroll-snap, use cases, gestion d'état signal).

Out of scope: chrono pages (S05, S06).

## Technical context
- Angular 21 — standalone, `OnPush`, `input()` / `output()`, `inject()`
- Requires S01, S02, S03
- `EndSessionUseCase` depends on `SessionChronoService` (S05); inject it but handle the case where elapsed = 0 by showing manual override — this must work even before S05 is complete
- `DrumPickerComponent` uses `AfterViewInit` pour le scroll initial — `viewChild()` (signal API) + `ElementRef`; exception justifiée pour le contrôle du scroll DOM
- **Coordination S04/S05** : `EndSessionUseCase` (S04) et `StopSessionChronoUseCase` (S05) partagent la logique "stop + save durationSeconds". `EndSessionUseCase` est propriétaire de cette logique (appelé depuis la Page Session) ; `StopSessionChronoUseCase` délègue via `SessionService.updateCurrentSession()` pour éviter la duplication.

## Tasks

### DrumPicker component
- [ ] Create `src/app/primary_adapters/shared/drum-picker.component.ts` — `OnPush`, inputs: `values: (number | string)[]`, `selectedValue: number | string`, `unit: string` (default `''`); output: `valueChange: number | string`
- [ ] Implement scroll-snap container: `overflow-y: scroll`, `scroll-snap-type: y mandatory`, height 200px (shows 5 items at 40px each), phantom items top/bottom for padding
- [ ] On `(scroll)` event: compute `activeIndex = Math.round(scrollTop / 40)`, emit `valueChange` if changed
- [ ] `ngAfterViewInit`: scroll programmatically to `indexOf(selectedValue) * 40`
- [ ] Active item style: `scale(1.2)`, bold, full opacity; inactive: `opacity: 0.4`

### Exercise expanded panel
- [ ] Create `exercise-expanded.component.ts` — `OnPush`, input: `exercise: Exercise`; outputs: `update: Partial<Exercise>`, `validate: void`, `cancel: void`, `delete: void`, `openChrono: void`, `openStats: void`
- [ ] Four `DrumPickerComponent` instances: weight (0–300, step 0.5 kg), sets (1–20), reps (1–50), break (0–600s, step 5s); each emits `update` with the changed field on `valueChange`
- [ ] Buttons: "Chronomètre" (emit `openChrono`), "Valider" (emit `validate`), "Annuler" (emit `cancel`), "Page exercice" (emit `openStats`), "Supprimer" (emit `delete`)
- [ ] Update `exercise-card.component.ts` — when `isExpanded` is true, render `<app-exercise-expanded>` below the compact display; pass exercise; wire all outputs to parent via re-emitted outputs or direct handler calls

### Exercise action use cases
- [ ] Create `update-exercise.usecase.ts` — receives `{ exerciseId, changes: Partial<Exercise> }`, delegates to `ExerciseService.update()`
- [ ] Create `validate-exercise.usecase.ts` — calls `ExerciseService.update(id, { status: 'validated' })`
- [ ] Create `cancel-exercise.usecase.ts` — calls `ExerciseService.update(id, { status: 'cancelled' })`
- [ ] Create `delete-exercise.usecase.ts` — calls `ExerciseService.delete(id)` (confirmation handled in component)

### End session use case
- [ ] Create `end-session.usecase.ts` — gets elapsed from `SessionChronoService.getElapsed()`, calls `SessionChronoService.stop()`; if elapsed > 0 saves `{ durationSeconds: elapsed, status: 'completed' }` via `SessionService`; if elapsed === 0 sets `showManualOverride = true` in component (return a flag or use a callback); navigates to `/sessions` after save

### Wire up in SessionDetailComponent
- [ ] Handle `validate` output from expanded panel → call `ValidateExerciseUseCase`; exercise card re-renders green automatically via signal
- [ ] Handle `cancel` output → call `CancelExerciseUseCase`; card re-renders orange
- [ ] Handle `delete` output → show `ConfirmDialogComponent`, on confirm call `DeleteExerciseUseCase`
- [ ] Handle `update` output → call `UpdateExerciseUseCase`
- [ ] Handle `openChrono` output → `Router.navigate(['/chrono/exercise'], { queryParams: { breakDuration: exercise.breakDurationSeconds } })`
- [ ] Handle `openStats` output → `Router.navigate(['/stats/', encodeURIComponent(exercise.name)])`
- [ ] "Break" button in header → navigate to `/chrono/exercise` with `breakDuration` from the last exercise in the list (or 60s fallback)
- [ ] "End" button → call `EndSessionUseCase`; if `showManualOverride` signal is true, display a numeric input pre-filled with 0 for manual duration entry, then a "Valider" button that saves and navigates
- [ ] Replace plain `<input>` fields in `AddExerciseFormComponent` with `DrumPickerComponent` — generate value arrays for each parameter range

## Acceptance criteria
- Tapping "Valider" turns the exercise card green immediately (signal update → `OnPush` re-render)
- Tapping "Annuler" turns the card orange
- Tapping "Supprimer" shows confirmation popup; confirming removes the card
- DrumPicker scrolls to the exercise's current value on open
- Changing a DrumPicker value calls `UpdateExerciseUseCase` and persists to localStorage
- "End" with a running chrono saves duration and navigates to session list
- "End" with zero chrono shows manual input field
- "Break" button navigates to `/chrono/exercise?breakDuration=N`
- "Chronomètre" on an exercise navigates to `/chrono/exercise?breakDuration=N` with that exercise's break time
- "Page exercice" navigates to `/stats/:encodedName`

## Notes
- Value arrays for DrumPicker must be pre-generated in the parent, not inside the component — the component receives `values[]` as input
- Weight step of 0.5 means the array contains `[0, 0.5, 1, ..., 300]` — generate once via a utility function
- The `update` output on each DrumPicker `valueChange` fires during scroll — debounce is not needed since localStorage writes are fast, but be careful not to trigger excessive signal updates; emit only when `value !== currentValue`
