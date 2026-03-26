# Training Time Bar Chart

## What this feature does
Affiche un graphique à barres sur la page Stats Globales montrant la durée de chaque séance du mois sélectionné, une barre par séance, avec le temps formaté en `Xh Ymin` ou `Ymin`. Le graphique réagit au filtre de mois et disparaît si aucune séance n'a de durée non nulle.

## Relation to cahier des charges
Extension de la section 4.5 (Page Statistiques globales). Le cahier des charges liste le résumé du mois (temps total) et la moyenne par semaine (temps moyen) mais ne spécifie pas de visualisation temporelle séance par séance. Cette feature comble ce manque sans contredire aucune spec existante.

## Affected areas

### core_logic — `stats-global/stats.service.ts`
- Ajouter un `computed` `sessionDurationsInMonth` qui produit, pour chaque séance du mois, un objet `{ date: Date, durationSeconds: number }` trié par date croissante.
- Les séances avec `durationSeconds === 0` sont incluses dans le calcul mais leur barre est omise à l'affichage (la logique d'omission appartient au composant).
- Si toutes les valeurs sont à 0, le signal retourne un tableau vide pour signaler l'absence de données.

### primary_ports — `stats-global/get-global-stats.usecase.ts`
- Exposer `sessionDurationsInMonth` en relayant le computed du service, comme tous les autres signaux existants.

### primary_adapters — `stats-global/stats-global.component.ts`
- Importer et afficher `TrainingTimeBarChartComponent` dans la carte Stats Globales, entre le résumé du mois et la liste des exercices.
- Condition d'affichage : `sessionDurationsInMonth().length > 0` (barre nulle omise en amont par le service).

## New elements to create

### `primary_adapters/stats-global/training-time-bar-chart.component.ts`
Composant standalone `OnPush` recevant via `input()` un tableau `{ date: Date, durationSeconds: number }[]`.

Responsabilités :
- Calculer la hauteur relative de chaque barre (`durationSeconds / max * 100%`).
- Afficher sous chaque barre le label jour/mois (ex : `12/03`).
- Afficher au survol ou en label la durée formatée (`1h30` ou `45min`).
- Ne rend rien (ou n'est pas monté) si le tableau d'entrée est vide — la condition est gérée par le parent.
- Barres avec `durationSeconds === 0` : non rendues (skip dans le `@for`).

## State and data flow

```
StatsService._sessionsInMonth (computed, réagit à selectedMonth)
  → sessionDurationsInMonth (computed, filtré + trié)
  → GetGlobalStatsUseCase.sessionDurationsInMonth (relay signal)
  → StatsGlobalComponent (lit le signal, condition @if)
  → TrainingTimeBarChartComponent (input(), computed pour hauteurs relatives)
```

Tout le flux est réactif via Signals Angular. Aucun appel HTTP supplémentaire : les données sont déjà en mémoire dans `_allSessions`.

## Edge cases to handle

- **Aucune séance dans le mois** : `sessionDurationsInMonth` retourne `[]`, le composant n'est pas monté.
- **Toutes les séances ont `durationSeconds === 0`** : idem, tableau vide, pas de graphique.
- **Une seule séance** : une seule barre à hauteur maximale (100%).
- **Séance unique avec durée nulle parmi d'autres** : la barre correspondante est omise, les autres s'affichent normalement.
- **Filtre "Année en cours" ou "Total"** (`value === null`) : le `StatsService` ne filtre pas par mois dans ces cas — vérifier que `sessionDurationsInMonth` est cohérent avec le comportement des autres computed dans ces modes, ou le limiter aux vues mensuelles seulement (même règle que `showHeatmap`).
- **Durée très longue** (> 3h) : le format `Xh Ymin` doit rester lisible — pas de troncature.

## Testing strategy

### Unit — `StatsService`
- `sessionDurationsInMonth` retourne les séances du mois sélectionné triées par date, avec `durationSeconds` correct.
- Les séances hors mois sont exclues.
- Si tous les `durationSeconds` sont à 0, retourne `[]`.

### Component — `TrainingTimeBarChartComponent`
- Rendu de N barres pour N entrées avec durée > 0.
- Hauteur relative correcte (la barre max atteint 100%).
- Format de durée : `1h30` pour 5400s, `45min` pour 2700s, `1h` pour 3600s.
- Les entrées avec `durationSeconds === 0` ne génèrent pas de barre dans le DOM.

### Component — `StatsGlobalComponent`
- Le bloc chart est absent du DOM quand `sessionDurationsInMonth()` est vide.
- Le bloc chart est présent quand au moins une séance a une durée > 0.
