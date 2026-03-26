# Task 07 — Intégration tracking exercices

> ⚠️ Ce fichier remplace l'ancienne tâche "Firebase Stats Mapper" — la transformation des exercices est désormais simplifiée (liste de noms uniquement).

**Agent :** `/tdd-auto`
**Dépendances :** Task 05 (AnalyticsService)

---

## Objectif

Brancher `AnalyticsService.trackSessionUpdated()` dans les trois use cases qui modifient les exercices d'une session active, pour maintenir à jour la liste des noms d'exercices validés dans Firestore.

---

## Contexte

À chaque ajout, validation ou annulation d'exercice, le document Firestore de la session est mis à jour avec la liste courante des `exerciseNames` validés. Seuls les exercices avec `status === 'validated'` sont trackés.

---

## Fichiers à modifier

### `src/app/primary_ports/session-detail/add-exercise.usecase.ts`

**Injection :** `AnalyticsService` via `inject(AnalyticsService)`

**Modification dans `execute()` :** après la sauvegarde de l'exercice, calculer les noms validés et appeler `trackSessionUpdated()`.

```typescript
// Après la sauvegarde en localStorage :
const validatedNames = this.exerciseService.exercises()
  .filter(e => e.status === 'validated')
  .map(e => e.name);
this.analyticsService.trackSessionUpdated(session, validatedNames);  // SANS await
```

> Adapter selon l'API réelle de `ExerciseService` pour récupérer les exercices en mémoire.

---

### `src/app/primary_ports/session-detail/validate-exercise.usecase.ts`

**Injection :** `AnalyticsService` via `inject(AnalyticsService)`

**Modification dans `execute()` :** après validation de l'exercice, appeler `trackSessionUpdated()` avec les noms validés.

Même pattern que `add-exercise.usecase.ts`.

---

### `src/app/primary_ports/session-detail/cancel-exercise.usecase.ts`

**Injection :** `AnalyticsService` via `inject(AnalyticsService)`

**Modification dans `execute()` :** après annulation de l'exercice, appeler `trackSessionUpdated()` avec les noms validés restants.

Même pattern — un exercice annulé ne figure plus dans la liste filtrée.

---

## Tests unitaires

Pour chacun des trois use cases, ajouter :

1. Après l'opération principale → `trackSessionUpdated()` appelé avec les noms des exercices validés
2. Si aucun exercice validé → `trackSessionUpdated()` appelé avec une liste vide `[]`
3. Les exercices avec `status !== 'validated'` ne figurent pas dans la liste

**Mock :** `AnalyticsService` via `jasmine.createSpyObj`. Mocker aussi `ExerciseService` pour contrôler les exercices retournés.

---

## Notes

- Ne jamais `await` les appels analytics.
- La source de vérité pour la liste des exercices reste le localStorage / signal en mémoire — pas Firestore.
- Adapter l'accès aux exercices selon l'API réelle du service `ExerciseService` dans le projet.
