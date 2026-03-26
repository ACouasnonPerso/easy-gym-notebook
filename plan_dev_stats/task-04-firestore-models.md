# Task 04 — FirestoreAnalyticsRepository (adaptateur secondaire)

> ⚠️ Ce fichier remplace l'ancienne tâche "Firestore DTO Models" — les DTOs sont désormais inline dans les payloads définis au Task 03.

**Agent :** `/dev`
**Dépendances :** Task 01 (Firebase SDK installé), Task 03 (IAnalyticsRepository)

---

## Objectif

Implémenter le repository Firestore concret qui traduit les appels de `IAnalyticsRepository` en opérations Firestore via le SDK Firebase vanilla.

---

## Fichier à créer

### `src/app/secondary_adapters/analytics/firestore-analytics.repository.ts`

**Classe :** `FirestoreAnalyticsRepository`
**Décorateur :** `@Injectable({ providedIn: 'root' })`
**Couche :** `secondary_adapters` — seul endroit du projet où Firebase est importé

---

## Dépendances injectées

- `Firestore` via `inject(FIRESTORE)` (token défini en Task 01)

---

## Collections Firestore

```typescript
const SESSIONS_COLLECTION = 'sessions';
const USER_STATS_COLLECTION = 'user_stats';
```

---

## Implémentation `trackSessionStarted(payload)`

```typescript
setDoc(doc(firestore, SESSIONS_COLLECTION, payload.sessionId), {
  uid: payload.uid,
  country: payload.country,
  startedAt: serverTimestamp(),
  muscleGroup: payload.muscleGroup,
  status: 'active',
  exerciseNames: [],
  durationSeconds: 0
}).catch(() => {});
```

---

## Implémentation `trackSessionUpdated(sessionId, exerciseNames)`

```typescript
setDoc(doc(firestore, SESSIONS_COLLECTION, sessionId),
  { exerciseNames },
  { merge: true }
).catch(() => {});
```

---

## Implémentation `trackSessionCompleted(payload)`

Deux opérations en parallèle :

```typescript
Promise.all([
  setDoc(doc(firestore, SESSIONS_COLLECTION, payload.sessionId),
    { durationSeconds: payload.durationSeconds, status: 'completed' },
    { merge: true }
  ),
  setDoc(doc(firestore, USER_STATS_COLLECTION, payload.uid),
    {
      totalSessions: increment(1),
      totalDurationSeconds: increment(payload.durationSeconds),
      lastSessionAt: serverTimestamp()
    },
    { merge: true }
  )
]).catch(() => {});
```

---

## Imports Firebase nécessaires

```typescript
import { doc, setDoc, serverTimestamp, increment, Firestore } from 'firebase/firestore';
```

---

## Tests

Pas de test unitaire automatisé recommandé (dépend de l'émulateur Firestore). Vérification manuelle via l'émulateur Firebase.

---

## Notes

- Ce fichier est le **seul** du projet à importer depuis `firebase/firestore`.
- Toutes les erreurs sont absorbées avec `.catch(() => {})` — fire-and-forget.
- `setDoc` avec `{ merge: true }` crée le document s'il n'existe pas — pas besoin de vérifier l'existence préalable.
- L'UID n'est pas stocké dans `user_stats` explicitement car le document ID est l'UID lui-même.
