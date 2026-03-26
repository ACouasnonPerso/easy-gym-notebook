# Analytics Service (télémétrie anonyme Firestore)

## What this feature does

À chaque session de gym, une entrée analytique est créée dans Firestore sous un identifiant
anonyme persisté en localStorage. En parallèle, un document agrégé par utilisateur est mis à
jour de façon incrémentale. Ces données permettent de mesurer l'usage réel de l'application
(fréquence, durée, exercices populaires, répartition géographique) sans aucune donnée
personnelle et sans impact visible pour l'utilisateur.

## Functional implications

**Nouveau comportement introduit**
- Au démarrage de l'app, un UID anonyme est généré une seule fois et stocké en localStorage
  (`egn_anon_uid`). Cet UID persiste indéfiniment ; toute perte entraîne une rupture de
  continuité acceptée.
- Lors de la création d'une session (`CreateSessionUseCase` et `DuplicateSessionUseCase`),
  un document `sessions/{sessionId}` est écrit dans Firestore avec : `uid`, `country`
  (extrait de `navigator.language`), `startedAt` (timestamp serveur), `muscleGroup`.
- À chaque modification de la session (ajout/validation/annulation d'exercice, fin de
  session), ce document est mis à jour avec les champs évoluant : liste des noms d'exercices
  validés, `durationSeconds`, `status`.
- À la complétion d'une session (`EndSessionUseCase`), le document agrégé
  `user_stats/{uid}` est mis à jour de manière incrémentale dans Firestore : `totalSessions
  += 1`, `totalDurationSeconds += N`, `lastSessionAt = now`.
- Tout échec réseau est ignoré silencieusement — aucun retry, aucun feedback UI.

**Comportement existant non modifié**
- Le localStorage applicatif (`egn_sessions`, `egn_exercises`) reste la source de vérité.
- Aucune interface utilisateur n'est ajoutée ou modifiée.
- La duplication de session est traitée comme une nouvelle session (nouvelle entrée Firestore).

**Edge cases**
- Si `navigator.language` est absent ou mal formé, `country` vaut `"unknown"`.
- Si `egn_anon_uid` est absent au démarrage, un nouveau UUID est généré avant toute écriture.
- Si Firestore n'est pas initialisé (offline au premier lancement), les appels échouent
  silencieusement — aucune mise en file d'attente.
- Une session active non terminée (app fermée brutalement) laisse un document partiel ;
  c'est acceptable.

## Affected areas

- `src/app/app.config.ts` — ajout du provider Firebase/Firestore
- `src/app/primary_ports/session-list/create-session.usecase.ts` — appel analytics à la création
- `src/app/primary_ports/session-list/duplicate-session.usecase.ts` — appel analytics à la duplication
- `src/app/primary_ports/session-detail/end-session.usecase.ts` — appel analytics à la complétion
- `src/app/primary_ports/session-detail/validate-exercise.usecase.ts` — mise à jour du document session
- `src/app/primary_ports/session-detail/cancel-exercise.usecase.ts` — mise à jour du document session
- `src/app/primary_ports/session-detail/add-exercise.usecase.ts` — mise à jour du document session

## New elements to create

**`src/app/core_logic/analytics/`** — nouveau dossier dans `core_logic`

- `anonymous-id.service.ts` — service `providedIn: 'root'` qui lit/écrit `egn_anon_uid` en
  localStorage. Expose une méthode `get(): string` qui génère et persiste l'UID si absent.

- `analytics.service.ts` — service `providedIn: 'root'`, point d'entrée unique pour toute
  écriture Firestore. Expose trois méthodes publiques :
  - `trackSessionStarted(session: Session): void`
  - `trackSessionUpdated(session: Session, exerciseNames: string[]): void`
  - `trackSessionCompleted(session: Session): void`
  Chaque méthode appelle Firestore de façon fire-and-forget (Promise non await, erreurs
  capturées et ignorées).

**`src/app/secondary_ports/analytics/`** — port secondaire (optionnel selon les besoins de test)

- `analytics.repository.interface.ts` — `IAnalyticsRepository` avec les trois méthodes
  ci-dessus, et son `InjectionToken`. Respecte le pattern ports/adapters existant.

**`src/app/secondary_adapters/analytics/`**

- `firestore-analytics.repository.ts` — implémentation concrète qui écrit dans Firestore.
  Injecte `Firestore` (AngularFire). Gère les erreurs silencieusement avec `.catch(() => {})`.

## State and data flow

Aucun signal ni état réactif n'est introduit — le service est purement effectif (fire-and-forget).

Le flux pour une session complète :

1. `CreateSessionUseCase.execute()` → appelle `AnalyticsService.trackSessionStarted(session)`
   → `FirestoreAnalyticsRepository` écrit `sessions/{sessionId}` avec `{ uid, country,
   startedAt, muscleGroup, status: 'active', exerciseNames: [] }`.

2. À chaque `AddExerciseUseCase` / `ValidateExerciseUseCase` / `CancelExerciseUseCase` →
   appelle `AnalyticsService.trackSessionUpdated(session, validatedExerciseNames)` →
   `setDoc(..., { merge: true })` met à jour uniquement `exerciseNames` et `status`.

3. `EndSessionUseCase.execute()` → appelle `AnalyticsService.trackSessionCompleted(session)`
   → deux opérations Firestore en parallèle :
   - `setDoc('sessions/{id}', { durationSeconds, status: 'completed' }, { merge: true })`
   - `updateDoc('user_stats/{uid}', { totalSessions: increment(1), totalDurationSeconds:
     increment(N), lastSessionAt: serverTimestamp() })`
   Si `user_stats/{uid}` n'existe pas encore, un `setDoc` avec `{ merge: true }` est utilisé
   pour l'initialiser proprement.

`country` est calculé une seule fois dans `AnonymousIdService` ou dans `AnalyticsService`
au moment du premier appel, depuis `navigator.language.split('-')[1]?.toUpperCase() ??
'unknown'`.

## Performance considerations

- Toutes les écritures Firestore sont fire-and-forget — elles ne bloquent pas le thread
  principal et ne ralentissent aucune interaction utilisateur.
- Aucun `computed()` ni signal nécessaire — pas de state réactif.
- Aucune lecture Firestore dans ce flux : pas de risque de latence visible.
- L'initialisation de Firebase se fait au démarrage via `app.config.ts` (provider synchrone) ;
  le coût est amorti lors du bootstrap.

## Testing strategy

**`anonymous-id.service.ts`** — test unitaire
- Vérifie qu'un UID est généré et persisté si absent du localStorage.
- Vérifie que le même UID est retourné si déjà présent.
- Vérifie qu'un UID perdu (clé supprimée) génère un nouvel UID.

**`analytics.service.ts`** — test unitaire avec `IAnalyticsRepository` mocké
- Vérifie que `trackSessionStarted` appelle le repository avec les bons champs
  (`uid`, `country`, `muscleGroup`, `status: 'active'`).
- Vérifie que `trackSessionCompleted` appelle le repository et déclenche l'incrément agrégé.
- Vérifie qu'une erreur du repository n'est pas propagée (pas de throw).

**Use cases affectés** — tests d'intégration existants à étendre
- Vérifier que `CreateSessionUseCase` appelle `AnalyticsService.trackSessionStarted`.
- Vérifier que `EndSessionUseCase` appelle `AnalyticsService.trackSessionCompleted`.
- Dans les deux cas, mocker `AnalyticsService` via un spy Jasmine sur la méthode concernée.

**`FirestoreAnalyticsRepository`** — pas de test unitaire automatisé recommandé
(dépend de l'émulateur Firestore ; relève d'un test d'intégration E2E hors scope).

## Open questions

- Firebase SDK : AngularFire (`@angular/fire`) ou SDK Firestore vanilla (`firebase/firestore`)
  direct ? AngularFire est cohérent avec les patterns Angular DI mais alourdit le bundle.
  Le SDK vanilla avec injection manuelle est plus léger.
- Faut-il sécuriser les règles Firestore en écriture seule pour `uid` anonyme
  (ex: règle Firestore autorisant `create` mais pas `read` sans auth) ? À définir côté
  infrastructure avant l'implémentation.
- Le champ `country` dérivé de `navigator.language` couvre les navigateurs desktop et mobile
  mais peut être `'unknown'` sur certains environnements (PWA installée, WebView).
  Est-ce acceptable ou faut-il un fallback supplémentaire (GeoIP via Cloud Function) ?
