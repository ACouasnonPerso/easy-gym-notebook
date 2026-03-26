# S03 — Session Detail: load session, exercise list, add exercise form

## Goal
Implement the session detail page — loading session data, rendering the exercise list in compact cards, and the "add exercise" form with autocomplete and real-time muscle group detection.

## Scope
- `src/app/primary_adapters/session-detail/session-detail.component.ts` + template + SCSS
- `src/app/primary_adapters/session-detail/exercise-card.component.ts`
- `src/app/primary_adapters/session-detail/add-exercise-form.component.ts`
- `src/app/primary_ports/session-detail/get-session-detail.usecase.ts`
- `src/app/primary_ports/session-detail/add-exercise.usecase.ts`
- `src/app/core_logic/session-detail/exercise.service.ts`
- `src/app/core_logic/shared/muscle-group-detector.service.ts`
- `src/app/core_logic/session-detail/autocomplete.service.ts`

HTML reference: `design/fitness-app-page-1-2.html` (page 2 — right phone frame) et `design/fitness-app-page-3-5.html` (page 1 — session detail with exercise form) — **référence visuelle uniquement** : disposition en-tête, cartes exercice compactes, formulaire d'ajout, couleurs de statut (orange/vert). Ne pas recopier le HTML statique ; implémenter la logique Angular complète (signals, use cases, autocomplete, détection groupe musculaire).

Out of scope: exercise expand panel (S04), DrumPicker (S04), validate/cancel/delete exercise (S04), End/Break session buttons (S04).

## Technical context
- Angular 21 — standalone, `OnPush`, `input()` / `output()`, `inject()`
- Requires S01 (repositories, models) and S02 (SessionService already created there)
- `SessionService.loadById(id)` must expose `currentSession: Signal<Session | null>` — doit être fait en S02 (voir note S02)
- `ExerciseService` maintains its own `exercises` signal, separate from the session's embedded array
- `MuscleGroupDetectorService` is pure (no dependencies) — implement it as a simple `@Injectable` with no async

## Tasks

### Shared logic — MuscleGroupDetector
- [ ] Create `src/app/core_logic/shared/muscle-group-detector.service.ts` — implement `detect(name: string): { muscleGroup: MuscleGroup | null, cleanedName: string }` using the full `SYNONYM_MAP` from the spec; sort synonyms by length descending before matching; normalize input with `NFD` + strip diacritics; strip matched synonym from original name and trim

### Core logic — ExerciseService
- [ ] Create `src/app/core_logic/session-detail/exercise.service.ts` — `_exercises` signal, `loadBySession(sessionId)`, `add(exercise)`, `update(exerciseId, changes: Partial<Exercise>)`, `delete(exerciseId)`

### Core logic — AutocompleteService
- [ ] Create `src/app/core_logic/session-detail/autocomplete.service.ts` — `getSuggestions(prefix: string): Promise<string[]>` (case-insensitive `startsWith` over distinct exercise names from `ExerciseRepository.getAll()`); `getLastParams(exerciseName): Promise<Partial<Exercise> | null>` (last occurrence in storage array)

### Use cases
- [ ] Create `get-session-detail.usecase.ts` — exposes `session = sessionService.currentSession`; `execute(id)` calls `sessionService.loadById(id)` and `exerciseService.loadBySession(id)`
- [ ] Create `add-exercise.usecase.ts` — receives `{ name, weightKg, sets, reps, breakDurationSeconds, sessionId }`, calls `MuscleGroupDetectorService.detect(name)`, builds full `Exercise` object (new UUID, `status: 'pending'`), delegates to `ExerciseService.add()`, updates `session.muscleGroup` via `SessionService` if the new exercise's group is non-null and session has no group yet

### Add exercise form
- [ ] Create `add-exercise-form.component.ts` — `OnPush`, inputs: `sessionId: string`; outputs: `exerciseAdded: void`, `cancelled: void`
- [ ] Name field: plain `<input>` with a dropdown suggestion list rendered below; on each `input` event call `AutocompleteService.getSuggestions()` and show matching results; selecting a suggestion calls `AutocompleteService.getLastParams()` and pre-fills weight/sets/reps/break fields
- [ ] Real-time muscle group detection: on each `input` event call `MuscleGroupDetectorService.detect(name)` and display the detected tag next to the field (or "Aucun" if null)
- [ ] Default parameter fields: four number inputs (weight kg, sets, reps, break seconds) — plain `<input type="number">` here (DrumPicker added in S04)
- [ ] On submit: call `AddExerciseUseCase.execute(...)` then emit `exerciseAdded`

### Exercise card (compact)
- [ ] Create `exercise-card.component.ts` — `OnPush`, inputs: `exercise: Exercise`, `isExpanded: boolean`; output: `toggleExpand: void`; displays name, muscle group tag (colored by status), weight, `sets × reps`, break duration; border color: orange for `pending`/`cancelled`, green for `validated`; styled matching `fitness-app-page-3-5.html`

### Session detail page
- [ ] Create `session-detail.component.ts` — `OnPush`, reads `id` from `ActivatedRoute.snapshot.params['id']`, calls `GetSessionDetailUseCase.execute(id)` in `ngOnInit`
- [ ] Render session header: date, muscle group tag, total weight, exercise count, chrono display (read `SessionChronoService.elapsedSeconds` signal — stub display if S05 not done)
- [ ] Render `@for (exercise of exercises(); track exercise.id)` loop using `ExerciseCardComponent`; manage `expandedExerciseId = signal<string | null>(null)` — toggling a card collapses the previous one
- [ ] Render `AddExerciseFormComponent` when `showAddForm()` is true; FAB `+` button sets `showAddForm.set(true)`
- [ ] "Break" and "End" buttons in header — placeholder (wired in S04)
- [ ] Style matching `fitness-app-page-3-5.html` header layout (date + tag + stats row + chrono + Break/End buttons)

## Acceptance criteria
- Navigating to `/sessions/:id` loads and displays the correct session
- Exercises listed in insertion order with correct visual status (border color)
- Tapping a card sets it as expanded; tapping again or tapping another card collapses it
- `+` button opens the add form
- Typing a known exercise name shows autocomplete suggestions; selecting one pre-fills parameters
- Detected muscle group tag updates in real time as the user types
- Submitting the form adds the exercise to the list and closes the form
- `MuscleGroupDetectorService.detect('Curl biceps haltères')` returns `{ muscleGroup: Biceps, cleanedName: 'Curl haltères' }`

## Notes
- `SessionService.currentSession` et `loadById()` doivent être créés en S02 — ne pas dupliquer ici
- `AutocompleteService.getLastParams()` : filtrer les occurrences de l'exercice et trier par date descendante pour trouver la plus récente — ne pas se fier à l'ordre d'insertion du tableau localStorage (fragile si le tableau est réécrit partiellement)
- The add-form's plain `<input>` fields for parameters will be replaced by `DrumPickerComponent` in S04; design to make this swap easy (single binding point per parameter)
- Tous les composants utilisent `input()` / `output()` (pas `@Input` / `@Output`)
