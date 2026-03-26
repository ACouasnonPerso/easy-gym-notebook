# S01 — Foundation: app setup, routing, domain models, persistence layer

## Goal
Bootstrap the Angular app with Clean Architecture scaffolding, domain models, localStorage repositories, mappers, routing, and the persistent bottom navigation — everything other stories depend on.

## Scope
- `src/app/app.routes.ts` (routing config)
- `src/app/app.component.html` / `app.component.ts` (root + bottom nav host)
- `src/app/primary_adapters/shared/bottom-nav.component.ts`
- `src/app/core_logic/shared/models.ts` (all domain models + raw types)
- `src/app/secondary_ports/session/` (interface + implementation + InjectionToken)
- `src/app/secondary_ports/exercise/` (interface + implementation + InjectionToken)
- `src/app/secondary_adapters/session/session.mapper.ts`
- `src/app/secondary_adapters/exercise/exercise.mapper.ts`
- `src/app/app.config.ts` (providers for InjectionTokens)

Out of scope: any feature-specific component or service (covered in S02–S08).

## Technical context
- Angular 21, standalone components, `ChangeDetectionStrategy.OnPush` everywhere
- Angular Signals: `signal()`, `computed()`, `effect()`
- `input()` / `output()` (signals API) — pas de `@Input` / `@Output` décorateurs
- `inject()` en propriété de classe — pas de constructeur
- No NgModule — all providers registered via `app.config.ts` (`ApplicationConfig`)
- localStorage keys: `egn_sessions`, `egn_exercises`
- UUID via `crypto.randomUUID()`
- Lazy-loaded routes via `loadComponent()`

## Tasks

### Domain models
- [ ] Create `src/app/core_logic/shared/models.ts` — define `MuscleGroup` enum, `Session`, `Exercise`, `SessionStats`, `ExerciseOccurrence`, `RawSession`, `RawExercise` interfaces exactly as specified

### Repositories — Session
- [ ] Create `src/app/secondary_ports/session/session.repository.interface.ts` — define `ISessionRepository` interface (`getAll`, `getById`, `save`, `delete`) and export `SESSION_REPOSITORY` InjectionToken
- [ ] Create `src/app/secondary_adapters/session/session.mapper.ts` — implement `SessionMapper` avec `toDomain()` (ISO string → Date) et `toStorage()` (omits `exercises` array, retourne JSON-serializable). Nommer `toStorage()` (pas `toRaw()`) pour rester neutre vis-à-vis du backend — Firebase nécessitera un `toFirestore()` séparé dans un futur mapper dédié.
- [ ] Create `src/app/secondary_ports/session/session.repository.ts` — implement `SessionRepository` using `egn_sessions` localStorage key, injecting `SessionMapper`. **Ne pas mettre `providedIn: 'root'`** sur cette classe — elle est fournie exclusivement via l'InjectionToken dans `app.config.ts` pour éviter une double instanciation.

### Repositories — Exercise
- [ ] Create `src/app/secondary_ports/exercise/exercise.repository.interface.ts` — define `IExerciseRepository` (`getAll`, `getBySessionId`, `save`, `delete`) and export `EXERCISE_REPOSITORY` InjectionToken
- [ ] Create `src/app/secondary_adapters/exercise/exercise.mapper.ts` — implement `ExerciseMapper` avec `toDomain()` et `toStorage()`. **Ne pas mettre `providedIn: 'root'`** sur cette classe.
- [ ] Create `src/app/secondary_ports/exercise/exercise.repository.ts` — implement `ExerciseRepository` using `egn_exercises` localStorage key. **Ne pas mettre `providedIn: 'root'`** sur cette classe.

### App config & routing
- [ ] Update `src/app/app.config.ts` — provide `SESSION_REPOSITORY` → `SessionRepository` and `EXERCISE_REPOSITORY` → `ExerciseRepository` via `{ provide: TOKEN, useClass: Impl }` in `providers`
- [ ] Create `src/app/app.routes.ts` — define all 7 lazy-loaded routes (`/`, `/sessions`, `/sessions/:id`, `/chrono/session`, `/chrono/exercise`, `/stats`, `/stats/:exerciseName`)

### Bottom navigation
- [ ] Create `src/app/primary_adapters/shared/bottom-nav.component.ts` — standalone, `OnPush`, 3 tabs (Sessions / Chrono / Stats) using `RouterLink` + `RouterLinkActive` for active state detection
- [ ] Update `src/app/app.component.html` — add `<router-outlet />` and `<app-bottom-nav />`
- [ ] Style `BottomNavComponent` in SCSS matching the dark theme from `fitness-app-page-1-2.html` (fixed bottom bar, icon + label per tab, active tab highlighted in orange `#f5a623`)

## Acceptance criteria
- App compiles and navigates between `/sessions`, `/chrono/session`, `/stats` via bottom nav
- Active tab is visually highlighted in orange
- `SessionRepository.getAll()` returns `[]` on empty localStorage, not an error
- `SessionRepository.save()` persists correctly and `getAll()` reflects the change
- `ExerciseRepository.getBySessionId()` returns only exercises matching the given sessionId
- `SessionMapper.toDomain()` converts ISO date strings to `Date` objects; `toStorage()` omits `exercises`
- `ExerciseMapper.toStorage()` round-trips correctly with `toDomain()`
- All components use `ChangeDetectionStrategy.OnPush`

## Notes
- The `InjectionToken` providers must be registered at app level (not feature level) since repositories are shared across features
- `SessionRepository` must handle the case where `egn_sessions` contains malformed JSON (wrap `JSON.parse` in try/catch, return `[]` on error)
- Same defensive parsing for `ExerciseRepository`
- **Firebase readiness** : le pattern InjectionToken permet de switcher vers Firebase sans toucher au `core_logic`. Pour migrer, il suffira de créer `SessionFirebaseRepository` implements `ISessionRepository` + `SessionFirebaseMapper` avec `toDomain()` / `toFirestore()`, puis de remplacer le `useClass` dans `app.config.ts`. Les exercises stockées à plat (avec `sessionId`) devront devenir des sous-collections Firestore — l'interface `IExerciseRepository.getBySessionId()` reste compatible. Prévoir un `toStorage()` (localStorage) distinct d'un futur `toFirestore()` dans les mappers.
- Les classes repository concrètes ne portent **pas** `providedIn: 'root'` — elles sont fournies exclusivement via leur InjectionToken dans `app.config.ts`.
