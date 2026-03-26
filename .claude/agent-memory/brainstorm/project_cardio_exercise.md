---
name: cardio-exercise brainstorm
description: Décisions de conception finalisées pour la feature exercice cardio — tag exclusif, champs duration/distance, DrumPicker km à 3 paliers, détection bilingue insensible à la casse, duplication transparente
type: project
---

Tag "Cardio" exclusif (pas de combinaison avec un tag musculaire). Un exercice cardio stocke
`durationSeconds` et `distanceKm | null`. Distance optionnelle : 0 = non enregistrée, exclue de la
courbe km. Même page stats que la muscu, contenu conditionnel selon `isCardio`. Même DrumPicker
pour heures + minutes. Bloc unique (pas de séries cardio). Une séance peut mélanger muscu et cardio.
Schéma modifiable sans risque (pas de données en production). Plan finalisé 2026-03-26.

**DrumPicker km — 3 paliers :**
- 0 à 2 km : pas de 100 m (0,1 km)
- 2 km à 50 km : pas de 500 m (0,5 km)
- Au-delà de 50 km : pas de 1 km
- Option "Inconnu" disponible en tête de picker.

**Détection du tag Cardio :**
Insensible à la casse, bilingue FR+EN. Liste de mots-clés : cardio, course, run, running, vélo,
velo, cycling, bike, natation, swim, swimming, marche, walk, walking, elliptique, elliptical,
rameur, rowing. La valeur stockée est toujours la chaîne canonique `"Cardio"` (majuscule).

**Duplication de séance :**
`durationSeconds` et `distanceKm` copiés tels quels — aucune logique de reset.

**Why:** Le développeur veut étendre le suivi à des sports d'endurance sans créer un flux
d'entrée séparé — tout passe par la séance ouverte existante.

**How to apply:** Quand on travaille sur add-exercise-form, exercise-card, exercise-expanded,
exercise-stats : vérifier la branche isCardio avant toute modification du layout des pickers ou
des stats. Ne jamais combiner muscleGroups non vides avec isCardio = true. Construire le tableau
du DrumPicker km en 3 segments, pas en plage uniforme.
