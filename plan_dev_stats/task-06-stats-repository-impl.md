# Task 06 — Intégration cycle de vie de session

> ⚠️ Ce fichier remplace l'ancienne tâche "Stats Repository Implementation".

**Agent :** `/tdd-auto`
**Dépendances :** Task 05 (AnalyticsService)

---

## Objectif

Brancher `AnalyticsService` dans les trois use cases qui gèrent le cycle de vie principal d'une session : création, duplication, et clôture.

---

## Fichiers à modifier

### `src/app/primary_ports/session-list/create-session.usecase.ts`

**Injection :** `AnalyticsService` via `inject(AnalyticsService)`

**Modification dans `execute()` :** appeler `trackSessionStarted()` après la sauvegarde en localStorage, sans `await`.

```
1. Créer session
2. await sessionService.create(session)
3. this.analyticsService.trackSessionStarted(session)   ← ajout, SANS await
4. sessionChronoService.start()
5. router.navigate(...)
```

---

### `src/app/primary_ports/session-list/duplicate-session.usecase.ts`

**Injection :** `AnalyticsService` via `inject(AnalyticsService)`

**Modification dans `execute()` :** appeler `trackSessionStarted()` après le chargement des sessions, sans `await`.

```
...
5. await sessionService.loadAll()
6. this.analyticsService.trackSessionStarted(newSession)   ← ajout, SANS await
7. sessionChronoService.start()
8. router.navigate(...)
```

---

### `src/app/primary_ports/session-detail/end-session.usecase.ts`

**Injection :** `AnalyticsService` via `inject(AnalyticsService)`

**Modification dans `execute()` :** appeler `trackSessionCompleted()` après `updateCurrentSession()`, sans `await`.

```
1. const elapsed = sessionChronoService.stop()
2. if (elapsed > 0): await sessionService.updateCurrentSession({ durationSeconds: elapsed, status: 'completed' })
3. const session = sessionService.currentSession()
4. if (session) this.analyticsService.trackSessionCompleted(session)   ← ajout, SANS await
5. router.navigate(...)
```

Idem pour `executeWithManualDuration(seconds)`.

---

## Tests unitaires

### `create-session.usecase.spec.ts`

Scénario à ajouter :
- `trackSessionStarted()` est appelé une fois avec la session créée

### `duplicate-session.usecase.spec.ts`

Scénario à ajouter :
- `trackSessionStarted()` est appelé avec `newSession` (id différent de la source)

### `end-session.usecase.spec.ts`

Scénarios à ajouter :
1. Si `elapsed > 0` → `trackSessionCompleted()` appelé avec la session complétée
2. Si `elapsed === 0` → `trackSessionCompleted()` **non** appelé
3. `executeWithManualDuration()` → `trackSessionCompleted()` appelé

**Mock :** `jasmine.createSpyObj('AnalyticsService', ['trackSessionStarted', 'trackSessionCompleted', 'trackSessionUpdated'])`

---

## Notes

- Ne jamais `await` les appels analytics dans les use cases.
- Ne pas casser les tests existants — uniquement ajouter des scénarios.
- L'injection de `AnalyticsService` dans `primary_ports` est conforme à l'architecture hexagonale.
