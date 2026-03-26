# S02 — Session List: display, create, duplicate, delete

## Goal
Implement the home screen that lists all sessions and allows creating, duplicating, and deleting them, including long-press context menu and confirmation dialog.

## Scope
- `src/app/primary_adapters/session-list/session-list.component.ts` + template + SCSS
- `src/app/primary_adapters/session-list/session-card.component.ts`
- `src/app/primary_adapters/shared/context-menu.component.ts`
- `src/app/primary_adapters/shared/confirm-dialog.component.ts`
- `src/app/primary_adapters/shared/long-press.directive.ts`
- `src/app/primary_adapters/shared/scroll-sentinel.directive.ts`
- `src/app/primary_ports/session-list/get-sessions.usecase.ts`
- `src/app/primary_ports/session-list/create-session.usecase.ts`
- `src/app/primary_ports/session-list/duplicate-session.usecase.ts`
- `src/app/primary_ports/session-list/delete-session.usecase.ts`
- `src/app/core_logic/session/session.service.ts`

HTML reference: `design/fitness-app-page-1-2.html` (page 1 — left phone frame) — **référence visuelle uniquement** : structure de la carte session, couleurs, disposition du FAB, barre de navigation. Ne pas recopier le HTML statique ; implémenter la logique Angular complète (signals, use cases, `@for`, event handling).

Out of scope: session detail, exercise management, chrono logic (session chrono is started here but implemented in S05).

## Technical context
- Angular 21 — standalone, `OnPush`, `input()` / `output()`, `inject()`
- Requires S01 (repositories, models, routing)
- `SessionChronoService.start()` called on create/duplicate — stub call is acceptable if S05 not yet complete (inject but call is no-op until S05 ships)
- Long press via RxJS `fromEvent` + `timer` + `switchMap` (RxJS allowed for DOM event complexity)
- `LongPressDirective` is shared — will also be reused in S03+
- **Infinite list** : toutes les sessions sont chargées en mémoire depuis localStorage (rapide), mais seul un sous-ensemble est rendu dans le DOM. Approche : `visibleCount = signal(PAGE_SIZE)` + `visibleSessions = computed(() => _sessions().slice(0, visibleCount()))` + sentinel div en bas de liste observé via `IntersectionObserver`. Pas de CDK — browser API native uniquement.

## Tasks

### Core logic
- [ ] Create `src/app/core_logic/session/session.service.ts` — `SessionService` with `_sessions` signal, `loadAll()` (joins exercises via `ExerciseRepository.getBySessionId`), `create()`, `delete()` (also deletes all associated exercises), `loadById()` (for S03)
- [ ] `SessionService.loadAll()` must sort sessions by date descending

### Use cases
- [ ] Create `get-sessions.usecase.ts` — exposes `sessions` signal from `SessionService`, `execute()` calls `sessionService.loadAll()`
- [ ] Create `create-session.usecase.ts` — builds `Session` object (new UUID, today's date, `status: 'active'`, `durationSeconds: 0`, `exercises: []`, `muscleGroup: null`), saves via `SessionService.create()`, calls `SessionChronoService.start()`, navigates to `/sessions/:id`
- [ ] Create `duplicate-session.usecase.ts` — loads source session + its exercises, creates new session (today, `status: 'active'`), copies exercises with new UUIDs + new sessionId + `status: 'pending'`, saves all, starts chrono, navigates to `/sessions/:newId`
- [ ] Create `delete-session.usecase.ts` — calls `SessionService.delete(sessionId)` (confirmation handled in component)

### Shared components
- [ ] Create `long-press.directive.ts` — standalone directive using RxJS `fromEvent(pointerdown)` + `switchMap(timer(700ms))`, cancelled by `pointerup`/`pointercancel`/`pointermove` (>5px threshold), emits `(longPress)` output
- [ ] Create `confirm-dialog.component.ts` — standalone modal overlay, `message` input, `confirmed` and `cancelled` outputs, dark overlay background, no CDK dependency
- [ ] Create `context-menu.component.ts` — standalone overlay, `options: string[]` input, `selected: string` and `closed` outputs, `position: fixed` with semi-transparent backdrop, closes on backdrop click
- [ ] Create `scroll-sentinel.directive.ts` — standalone directive, `IntersectionObserver` sur l'élément hôte, émet l'output `(visible)` quand le ratio d'intersection dépasse 0 ; `ngOnDestroy` déconnecte l'observer. Utilisé dans la session list et réutilisable ailleurs.

### Session card
- [ ] Create `session-card.component.ts` — `OnPush`, inputs: `session: Session`, outputs: `longPress: void`; displays date (formatted `dd MMMM yyyy`), muscle group tag, total weight (sum of `weightKg × sets × reps` for validated exercises), exercise count, duration (`HH:MM:SS`), badge if `status === 'active'`; styled matching `fitness-app-page-1-2.html` (dark card, orange left border strip)

### Session list page
- [ ] Create `session-list.component.ts` — `OnPush`, calls `GetSessionsUseCase.execute()` in `ngOnInit`
- [ ] Infinite list : déclarer `PAGE_SIZE = 20` et `visibleCount = signal(PAGE_SIZE)` ; `visibleSessions = computed(() => sessions().slice(0, visibleCount()))` ; `hasMore = computed(() => visibleCount() < sessions().length)`
- [ ] Rendre `@for (session of visibleSessions(); track session.id)` avec `SessionCardComponent` + `LongPressDirective`
- [ ] Rendre un `<div appScrollSentinel (visible)="loadMore()">` conditionnel (`@if (hasMore())`) sous la liste ; `loadMore()` fait `visibleCount.update(n => n + PAGE_SIZE)`
- [ ] Wire long-press → show `ContextMenuComponent` with options `['Dupliquer', 'Supprimer']`
- [ ] On "Dupliquer" → call `DuplicateSessionUseCase`
- [ ] On "Supprimer" → show `ConfirmDialogComponent`, on confirm call `DeleteSessionUseCase`
- [ ] Style page title "Sessions", FAB button (orange, bottom-right), empty-state message when list is empty — match `fitness-app-page-1-2.html`

## Acceptance criteria
- Sessions displayed in descending date order
- Seules 20 sessions au maximum sont rendues dans le DOM au chargement initial
- Faire défiler jusqu'en bas charge 20 sessions supplémentaires (le sentinel devient visible → `loadMore()`)
- Le sentinel div disparaît quand toutes les sessions sont affichées (`hasMore() === false`)
- La création ou suppression d'une session met à jour `sessions()` via signal — `visibleSessions()` se recalcule automatiquement ; `visibleCount` n'est pas réinitialisé (une session créée apparaît en tête de liste sans scroll forcé)
- Tapping `+` creates a session and navigates to its detail page (chrono stub start is acceptable)
- Long press (700ms) opens context menu without triggering navigation
- Normal tap (<700ms) navigates to session detail
- "Dupliquer" creates new session today with all exercises reset to `pending`
- "Supprimer" shows confirmation popup; dismissing it does not delete; confirming deletes session and all its exercises
- Empty list shows an appropriate empty state
- `SessionCardComponent` displays active badge for `status === 'active'` sessions

## Notes
- `SessionChronoService` (S05) is a singleton injected here; if S02 ships before S05, inject but guard the `.start()` call — do not create a stub service
- Duration display helper `formatDuration(seconds: number): string` can be a pure function in a shared utils file
- `SessionService` doit exposer `currentSession = signal<Session | null>(null)` et `loadById(id)` dès S02 (utilisé en S03, S05) — ne pas remettre à plus tard
- Les classes `SessionCardComponent` et `LongPressDirective` utilisent `input()` / `output()` (pas `@Input` / `@Output`)
- `ScrollSentinelDirective` : l'`IntersectionObserver` doit être créé avec `{ threshold: 0 }` (tout pixel visible suffit) ; utiliser `inject(ElementRef)` pour référencer l'élément hôte. Ne pas utiliser `ViewChild` — la directive s'applique directement à l'élément sentinel.
- `visibleCount` n'est **pas** réinitialisé à `PAGE_SIZE` lors d'une création ou suppression de session — l'utilisateur garde sa position de scroll. Si la liste complète compte 45 sessions et que `visibleCount = 40`, supprimer une session laisse `visibleSessions = sessions().slice(0, 40)` = 40 sessions (ou moins si total < 40) — comportement correct.
