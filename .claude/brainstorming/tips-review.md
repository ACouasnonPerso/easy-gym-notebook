# Tips bannière "Review" avec in-app review

## What this feature does

Quand l'utilisateur a plus de 4 séances, afficher dans `TipsBannerComponent` un tips cliquable
qui déclenche le flow in-app review natif via `@capacitor-community/in-app-review`. Après le
clic, remplacer le message par un remerciement. L'état "review demandée" est persisté en
localStorage pour ne jamais réafficher ce tips aux prochains démarrages.

## Relation to cahier des charges

Gap — le cahier des charges ne mentionne pas les tips ni le mécanisme de review. Cette feature
étend la section 4.1 (Liste des Sessions) en ajoutant un comportement d'engagement utilisateur
non-fonctionnel. Aucune contradiction avec les specs existantes.

## Affected areas

- `primary_adapters/session-list/tips-banner.component.ts` — à modifier pour gérer deux états
  de tips et déléguer l'action au use case
- `primary_adapters/session-list/tips-banner.component.html` — à modifier pour brancher le clic
- `primary_ports/session-list/` — ajout d'un use case dédié
- `core_logic/review/` — nouveau service (logique d'état + appel review)
- `secondary_ports/review/` — nouvelle interface repository + implémentation localStorage

## New elements to create

**`secondary_ports/review/review.repository.interface.ts`**
Interface `IReviewRepository` avec deux méthodes : `hasRequested(): Promise<boolean>` et
`markAsRequested(): Promise<void>`. Exposition via `InjectionToken` `REVIEW_REPOSITORY`.

**`secondary_ports/review/review.repository.ts`**
Implémentation concrète sur `localStorage` avec clé dédiée `egn_review_requested`.
Suit le même pattern que `SessionRepository` (lecture/écriture directe localStorage).
Aucun mapper nécessaire (valeur booléenne simple).

**`core_logic/review/review.service.ts`**
Service injectable `providedIn: 'root'`. Expose :
- Un `Signal<boolean>` `hasRequested` (état mémoire, chargé au démarrage)
- `initialize(): Promise<void>` — lit le flag depuis le repository et alimente le signal
- `requestReview(): Promise<void>` — appelle `@capacitor-community/in-app-review`, puis
  appelle `markAsRequested()` sur le repository et met à jour le signal. Wrappé dans un
  try/catch : si le plugin n'est pas disponible (web), l'appel échoue silencieusement mais
  le flag est quand même positionné. La disponibilité du plugin est détectée via
  `Capacitor.isPluginAvailable('InAppReview')` avant l'appel.

**`primary_ports/session-list/request-review.usecase.ts`**
Use case `RequestReviewUseCase`. Expose `hasRequested` (signal délégué depuis `ReviewService`).
Méthode `execute()` qui orchestre `reviewService.requestReview()`.

## State and data flow

```
TipsBannerComponent
  │  inject
  ▼
RequestReviewUseCase
  │  lit hasRequested (Signal<boolean>)
  │  appelle execute() au clic
  ▼
ReviewService
  │  Signal<boolean> hasRequested (état mémoire)
  │  appelle InAppReview + repository
  ▼
ReviewRepository (localStorage)
  clé : egn_review_requested = "true"
```

`TipsBannerComponent` reçoit `sessionCount` (input existant) et injecte `RequestReviewUseCase`.
Il calcule son état d'affichage via deux `computed` :
- `showOnboarding`: `sessionCount > 0 && sessionCount < 4`
- `showReview`: `sessionCount > 4 && !hasRequested()`
- `showThanks`: `sessionCount > 4 && hasRequested()`

`ReviewService.initialize()` est appelé dans `AppComponent` ou `SessionListComponent` (au
`ngOnInit` de la liste, qui est déjà le point d'entrée de l'app).

## Edge cases to handle

- **Plugin absent (web / navigateur)** : `Capacitor.isPluginAvailable` retourne `false` →
  skip l'appel natif, positionner quand même le flag et afficher le remerciement
- **sessionCount === 4 exactement** : ni onboarding ni review (`showOnboarding` exige `< 4`,
  `showReview` exige `> 4`) — c'est un gap volontaire, la bannière est masquée
- **Flag déjà positionné au démarrage** : `showThanks` est `true` immédiatement → à décider
  si l'on affiche "Merci" indéfiniment ou si on masque complètement. Comportement recommandé :
  masquer complètement (`showReview` et `showThanks` mutuellement exclusifs, mais `showThanks`
  visible uniquement dans la session courante où le clic a eu lieu, pas aux démarrages suivants).
  Implémenter via un `signal<boolean>` local `justReviewed` dans le composant, activé après
  le clic, combiné avec `!hasRequested()` au chargement pour ne rien afficher.
- **Double clic** : le bouton doit être désactivé pendant l'appel async (`pending` signal local)

## Testing strategy

- **Unit — `ReviewService`** : tester `initialize()` (lit depuis le repo et alimente le signal),
  tester `requestReview()` avec plugin disponible et indisponible (mock du plugin Capacitor)
- **Unit — `RequestReviewUseCase`** : vérifier que `execute()` délègue à `ReviewService`
  et que `hasRequested` expose bien le signal du service
- **Unit — `ReviewRepository`** : tester `hasRequested()` et `markAsRequested()` avec
  mock de `localStorage`
- **Component — `TipsBannerComponent`** : tester les trois états d'affichage (onboarding,
  review, thanks / masqué) selon les valeurs de `sessionCount` et `hasRequested`, tester
  que le clic déclenche `execute()` sur le use case
