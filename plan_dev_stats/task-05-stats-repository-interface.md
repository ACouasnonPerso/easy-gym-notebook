# Task 05 — AnalyticsService (orchestrateur)

> ⚠️ Ce fichier remplace l'ancienne tâche "Stats Repository Interface" — le port est maintenant défini au Task 03.

**Agent :** `/tdd-auto`
**Dépendances :** Task 02 (AnonymousIdService), Task 03 (IAnalyticsRepository), Task 04 (FirestoreAnalyticsRepository)

---

## Objectif

Créer le service orchestrateur `AnalyticsService` dans `core_logic/analytics/`. C'est le point d'entrée unique pour toute écriture Firestore, appelé par les use cases. Toutes ses méthodes sont fire-and-forget.

---

## Fichier à créer

### `src/app/core_logic/analytics/analytics.service.ts`

**Classe :** `AnalyticsService`
**Décorateur :** `@Injectable({ providedIn: 'root' })`
**Couche :** `core_logic` — orchestration, aucune logique UI

---

## Dépendances injectées

- `AnonymousIdService` via `inject(AnonymousIdService)`
- `IAnalyticsRepository` via `inject(ANALYTICS_REPOSITORY)`

---

## Méthode publique `trackSessionStarted(session: Session): void`

```typescript
trackSessionStarted(session: Session): void {
  this.repo.trackSessionStarted({
    sessionId: session.id,
    uid: this.idService.getId(),
    country: this.idService.getCountry(),
    muscleGroup: session.muscleGroup  // ou le champ équivalent dans le modèle Session
  }).catch(() => {});
}
```

---

## Méthode publique `trackSessionUpdated(session: Session, exerciseNames: string[]): void`

```typescript
trackSessionUpdated(session: Session, exerciseNames: string[]): void {
  this.repo.trackSessionUpdated(session.id, exerciseNames).catch(() => {});
}
```

---

## Méthode publique `trackSessionCompleted(session: Session): void`

```typescript
trackSessionCompleted(session: Session): void {
  this.repo.trackSessionCompleted({
    sessionId: session.id,
    uid: this.idService.getId(),
    durationSeconds: session.durationSeconds
  }).catch(() => {});
}
```

---

## Comportement fire-and-forget

- Les méthodes sont **synchrones** (retournent `void`)
- Les Promises du repository ne sont jamais `await`ées par les appelants
- Toute erreur est absorbée avec `.catch(() => {})` — aucune propagation

---

## Tests unitaires

Fichier : `src/app/core_logic/analytics/analytics.service.spec.ts`

**Stratégie :** mocker `AnonymousIdService` et `IAnalyticsRepository` (via spy).

### `trackSessionStarted()`
1. Appelle `repo.trackSessionStarted()` avec les bons champs (`uid`, `country`, `sessionId`, `muscleGroup`)
2. `getCountry()` est appelé depuis `AnonymousIdService`
3. Une erreur du repository n'est pas propagée (ne lève pas d'exception)

### `trackSessionUpdated()`
4. Appelle `repo.trackSessionUpdated()` avec le bon `sessionId` et `exerciseNames`

### `trackSessionCompleted()`
5. Appelle `repo.trackSessionCompleted()` avec `uid`, `sessionId`, `durationSeconds`
6. Une erreur du repository n'est pas propagée

---

## Notes

- Ce service ne lit jamais Firestore — écriture seule.
- Il ne dépend pas de `SessionService` (contrairement à l'ancienne approche par recalcul).
- Il reçoit les données nécessaires directement en paramètre depuis les use cases.
- `session.muscleGroup` : adapter selon le nom exact du champ dans le modèle `Session` existant.
