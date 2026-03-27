---
name: Muscle color centralization
description: La map muscleColorMap était dupliquée dans 4 composants — refactorisée vers muscleGroupChipStyle() dans muscle-group-colors.ts
type: project
---

Refactor terminé le 2026-03-27. Le `muscleColorMap` de 14 entrées était copié-collé dans `exercise-card`, `session-card`, `add-exercise-form` et `donut-chart` utilisait sa propre `MUSCLE_COLORS`.

**Résultat :** les 4 composants délèguent maintenant à `muscleGroupChipStyle(muscle)` importé depuis `core_logic/shared/muscle-group-colors.ts`. Le cas `Cardio` (hors-modèle) conserve un `if` inline dans `exercise-card.tagStyle()` qui retourne les valeurs cyan hardcodées. `donut-chart` lit `MUSCLE_GROUP_COLORS[group].color` directement.

**Why:** Source unique de vérité pour les couleurs — un changement de couleur se fait en un seul endroit.

**How to apply:** Ne jamais recréer un `muscleColorMap` local. Toujours importer depuis `core_logic/shared/muscle-group-colors.ts`.
