# Analytics Service — Overview

## Ce que fait cette feature

Enregistre anonymement dans Firestore les données d'usage (sessions, exercices, durée, pays) sans authentification Firebase. Chaque utilisateur reçoit un UID anonyme persistant généré localement (`egn_anon_uid`), invisible dans l'UI. Toutes les écritures sont fire-and-forget — aucun impact sur les flux utilisateur.

---

## Architecture hexagonale

```
core_logic/analytics/
  anonymous-id.service.ts        ← génère/lit l'UID depuis localStorage + détecte le pays
  analytics.service.ts           ← orchestre uid + écriture Firestore (fire-and-forget)

secondary_ports/analytics/
  analytics.repository.interface.ts   ← contrat IAnalyticsRepository + InjectionToken

secondary_adapters/analytics/
  firestore-analytics.repository.ts   ← implémentation Firestore (Firebase SDK)
```

### Fichiers existants modifiés

| Fichier | Modification |
|---------|-------------|
| `app.config.ts` | Ajout providers Firebase/Firestore + `ANALYTICS_REPOSITORY` |
| `primary_ports/session-list/create-session.usecase.ts` | Appel `trackSessionStarted()` |
| `primary_ports/session-list/duplicate-session.usecase.ts` | Appel `trackSessionStarted()` |
| `primary_ports/session-detail/add-exercise.usecase.ts` | Appel `trackSessionUpdated()` |
| `primary_ports/session-detail/validate-exercise.usecase.ts` | Appel `trackSessionUpdated()` |
| `primary_ports/session-detail/cancel-exercise.usecase.ts` | Appel `trackSessionUpdated()` |
| `primary_ports/session-detail/end-session.usecase.ts` | Appel `trackSessionCompleted()` |

---

## Schéma Firestore

### Collection `sessions`
**Document ID :** `{sessionId}`

```typescript
{
  uid: string,                    // UID anonyme de l'utilisateur
  country: string,                // Code pays ISO (ex: "FR") ou "unknown"
  startedAt: Timestamp,           // serverTimestamp() à la création
  muscleGroup: string,            // groupe musculaire de la session
  status: 'active' | 'completed',
  exerciseNames: string[],        // noms des exercices validés, mis à jour en cours
  durationSeconds: number         // 0 à la création, mis à jour à la clôture
}
```

### Collection `user_stats`
**Document ID :** `{uid}`

```typescript
{
  country: string,
  totalSessions: number,          // incrémenté à chaque trackSessionCompleted
  totalDurationSeconds: number,   // incrémenté à chaque trackSessionCompleted
  lastSessionAt: Timestamp,       // serverTimestamp() à chaque fin de session
  uniqueDays: string[]            // dates YYYY-MM-DD, union set côté client
}
```

---

## Clés localStorage utilisées

| Clé | Contenu |
|-----|---------|
| `egn_anon_uid` | UUID anonyme de l'utilisateur (string) |

---

## Détection du pays

Extraite de `navigator.language` : `navigator.language.split('-')[1]?.toUpperCase() ?? 'unknown'`.
Pas d'appel réseau externe. Si la locale ne contient pas de région (ex: `"fr"`), `country = "unknown"`.

---

## Stratégie d'erreur

Tous les appels Firestore sont **fire-and-forget** :
- Promises non-awaited, `.catch(() => {})` pour absorber les erreurs
- En cas d'erreur réseau ou Firestore : ignorer silencieusement
- Jamais de retry, jamais de feedback UI

---

## Flux complet d'une session

1. **`CreateSessionUseCase`** → `trackSessionStarted(session)` → écrit `sessions/{sessionId}` avec `{ uid, country, startedAt, muscleGroup, status: 'active', exerciseNames: [], durationSeconds: 0 }`

2. **`AddExercise` / `ValidateExercise` / `CancelExercise`** → `trackSessionUpdated(session, exerciseNames)` → `setDoc(..., { exerciseNames }, { merge: true })`

3. **`EndSessionUseCase`** → `trackSessionCompleted(session)` → deux opérations en parallèle :
   - `setDoc('sessions/{id}', { durationSeconds, status: 'completed' }, { merge: true })`
   - `setDoc('user_stats/{uid}', { totalSessions: increment(1), totalDurationSeconds: increment(N), lastSessionAt: serverTimestamp() }, { merge: true })`

---

## Index des tâches

| # | Fichier | Agent | Description |
|---|---------|-------|-------------|
| 1 | `task-01-firebase-setup.md` | `/dev` | Installation Firebase SDK + configuration + `app.config.ts` |
| 2 | `task-02-anonymous-id-service.md` | `/tdd-auto` | `AnonymousIdService` (UID localStorage + détection pays) |
| 3 | `task-03-analytics-repository-interface.md` | `/dev` | `IAnalyticsRepository` + `InjectionToken` |
| 4 | `task-04-firestore-analytics-repository.md` | `/dev` | `FirestoreAnalyticsRepository` (implémentation Firestore) |
| 5 | `task-05-analytics-service.md` | `/tdd-auto` | `AnalyticsService` orchestrateur fire-and-forget |
| 6 | `task-06-integration-session-lifecycle.md` | `/tdd-auto` | Intégration dans `CreateSession`, `DuplicateSession`, `EndSession` |
| 7 | `task-07-integration-exercise-tracking.md` | `/tdd-auto` | Intégration dans `AddExercise`, `ValidateExercise`, `CancelExercise` |
| 8 | `task-08-firestore-security-rules.md` | `/dev` | Règles de sécurité Firestore (write-only pour uid anonyme) |

---

## Dépendances entre tâches

```
T1 (Firebase setup)
  └── T3 (Repository interface)
  └── T2 (AnonymousIdService) — indépendant de T3
       └── T5 (AnalyticsService) ← dépend de T2, T3, T4
            └── T6 (Intégration lifecycle)
            └── T7 (Intégration exercise)
  └── T4 (FirestoreAnalyticsRepository) ← dépend de T1, T3
T8 (Firestore rules) — indépendant, peut être fait à tout moment
```
