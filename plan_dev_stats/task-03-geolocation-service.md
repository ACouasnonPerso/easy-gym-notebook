# Task 03 — IAnalyticsRepository (port secondaire)

> ⚠️ Ce fichier remplace l'ancienne tâche "Geolocation Service" — la géolocalisation est désormais gérée inline via `navigator.language` dans `AnonymousIdService` (Task 02).

**Agent :** `/dev`
**Dépendances :** Task 01 (Firebase Setup) pour le token

---

## Objectif

Définir le contrat d'interface pour les opérations Firestore et l'`InjectionToken` associé, en suivant le pattern ports/adapters du projet.

---

## Fichier à créer

### `src/app/secondary_ports/analytics/analytics.repository.interface.ts`

**Pattern :** identique aux repositories existants (`session.repository.interface.ts`, `exercise.repository.interface.ts`)

---

## Interface `IAnalyticsRepository`

### `trackSessionStarted(payload: SessionStartPayload): Promise<void>`

Crée un nouveau document dans `sessions/{sessionId}` avec :
- `uid`, `country`, `startedAt` (serverTimestamp), `muscleGroup`
- `status: 'active'`, `exerciseNames: []`, `durationSeconds: 0`

### `trackSessionUpdated(sessionId: string, exerciseNames: string[]): Promise<void>`

Met à jour `sessions/{sessionId}` avec `{ exerciseNames }` (merge).

### `trackSessionCompleted(payload: SessionCompletePayload): Promise<void>`

Deux opérations en parallèle :
- Met à jour `sessions/{sessionId}` avec `{ durationSeconds, status: 'completed' }` (merge)
- Met à jour `user_stats/{uid}` avec `{ totalSessions: increment(1), totalDurationSeconds: increment(N), lastSessionAt: serverTimestamp() }` (merge, setDoc si absent)

---

## Types payload (dans ce même fichier)

```typescript
export interface SessionStartPayload {
  sessionId: string;
  uid: string;
  country: string;
  muscleGroup: string;
}

export interface SessionCompletePayload {
  sessionId: string;
  uid: string;
  durationSeconds: number;
}
```

---

## InjectionToken

```typescript
export const ANALYTICS_REPOSITORY =
  new InjectionToken<IAnalyticsRepository>('ANALYTICS_REPOSITORY');
```

---

## Tests

Pas de test unitaire (interface + token, aucun comportement).

---

## Notes

- Suivre exactement le pattern de `session.repository.interface.ts`.
- Ce fichier ne doit importer aucune dépendance Firebase — interface pure.
