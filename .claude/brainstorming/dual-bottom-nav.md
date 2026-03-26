# Dual Bottom Nav

## What this feature does
La navbar principale est simplifiée : elle affiche toujours le bouton "+" central (création de session) et les liens Sessions / Stats, sans logique conditionnelle. Une deuxième navbar, thématisée en bleu, apparaît exclusivement sur les pages de session (`/sessions/:id` et `/chrono/session`) et propose les actions contextuelles à cette session : retour à la liste, ajout d'exercice, navigation vers le chrono.

## Functional implications

**Navbar principale (`BottomNavComponent`) :**
- Supprimer le signal `showAddButton`, le `toSignal` sur le router, et toute la logique de routing conditionnel.
- Le bouton "+" central appelle toujours `CreateSessionUseCase.execute()`.
- Cette navbar ne s'affiche plus sur les routes `/sessions/:id` et `/chrono/session`.

**Nouvelle navbar de session (`SessionBottomNavComponent`) :**
- Affichée sur `/sessions/:id` et `/chrono/session`.
- Lien gauche : "Sessions" → `/sessions`.
- Bouton central "+" : ouvre le formulaire d'ajout d'exercice de la session courante. Nécessite de connaître l'`id` de session courante.
- Lien droit : "Chrono" → `/chrono/session`.
- Couleur d'accent : bleu (nouvelle variable CSS ou valeur directe) au lieu d'orange.

**Coordination dans `AppComponent` :**
- La visibilité de chaque navbar est pilotée par un `computed` sur l'URL courante (pattern déjà présent dans le `BottomNavComponent` actuel via `toSignal` + `NavigationEnd`). Cette logique migre dans `AppComponent` ou dans un service partagé léger.

**Edge cases :**
- Sur `/chrono/session`, le bouton "+" de la session-nav doit connaître l'`id` de session active. Cet identifiant est déjà disponible via `SessionService.currentSession()` (signal) — pas besoin d'input `@Input`.
- Si aucune session n'est active (état inattendu), le bouton "+" peut être désactivé ou masqué.
- Le formulaire d'ajout d'exercice déclenché depuis la nav doit fonctionner de la même façon que le FAB existant dans `session-detail.component.html` — il faut coordonner l'ouverture du formulaire entre la nav et le composant page.

## Affected areas

- `src/app/app.component.ts` — ajout de la logique de sélection de navbar et import du nouveau composant.
- `src/app/primary_adapters/shared/bottom-nav.component.ts` — retrait de toute la logique conditionnelle (signal URL, `showAddButton`, import RxJS).
- `src/app/primary_adapters/session-detail/session-detail.component.ts` / `.html` — coordination pour l'ouverture du formulaire d'ajout depuis la nav externe (le signal `showAddForm` devra être accessible ou dupliqué).

## New elements to create

- `src/app/primary_adapters/shared/session-bottom-nav.component.ts` — nouveau composant standalone, même structure visuelle que `BottomNavComponent`, accent bleu, liens et bouton contextuel décrits ci-dessus.

## State and data flow

**Sélection de navbar dans `AppComponent` :**
- Un `toSignal` sur `Router.events` (filtré sur `NavigationEnd`) produit un signal d'URL courante.
- Un `computed` dérive un booléen `isSessionRoute` (`url.startsWith('/sessions/') || url === '/chrono/session'`).
- `@if (isSessionRoute())` dans le template d'`AppComponent` switche entre `<app-session-bottom-nav>` et `<app-bottom-nav>`.

**Ouverture du formulaire d'ajout depuis la session-nav :**
- Option A (recommandée) : `SessionService` ou un signal partagé exposé en `providedIn: 'root'` porte un signal `showAddExerciseForm`. La session-nav le set à `true`, `session-detail` le lit et affiche le formulaire. C'est cohérent avec l'architecture orientée use-cases/services déjà en place.
- Option B : routage vers `/sessions/:id` avec un query param `?addExercise=true` — plus simple mais moins idiomatique dans ce projet.

**Session id dans la session-nav :**
- Lu directement depuis `SessionService.currentSession()` (signal déjà exposé). Pas d'`@Input` nécessaire.

## Performance considerations

- Utiliser `computed()` pour `isSessionRoute` dans `AppComponent`, pas d'appel de fonction dans le template.
- Le `toSignal` sur `NavigationEnd` existant dans `BottomNavComponent` sera supprimé de ce composant mais recréé dans `AppComponent` — une seule instance, pas de doublon.
- Les deux navbars sont des composants légers sans lazy-loading nécessaire.

## Testing strategy

- **Unit — `BottomNavComponent`** : vérifier que le composant ne contient plus de logique conditionnelle, que `createSession()` est toujours appelé au clic.
- **Unit — `SessionBottomNavComponent`** : vérifier les liens de navigation, que le bouton "+" appelle bien le signal `showAddExerciseForm`, que la couleur d'accent est bleue.
- **Component integration — `AppComponent`** : vérifier que la bonne navbar s'affiche selon la route (`/sessions`, `/stats`, `/sessions/abc`, `/chrono/session`).
- **Component integration — `SessionDetailComponent`** : vérifier que le formulaire s'ouvre quand le signal `showAddExerciseForm` passe à `true`.

## Open questions

- **Signal partagé `showAddExerciseForm`** : doit-il vivre dans `SessionDetailService` / `GetSessionDetailUseCase` déjà injectable, ou dans un nouveau service UI dédié ? À confirmer selon les conventions du projet.
- **Affichage de la session-nav sur `/chrono/session`** : la page chrono a déjà un bouton "back" interne. Le lien "Sessions" de la nav est-il redondant ? Faut-il masquer le back-btn interne quand la nav est présente ?
- **Variable CSS bleue** : existe-t-il déjà une variable `--blue` dans le design system, ou faut-il en définir une ?
