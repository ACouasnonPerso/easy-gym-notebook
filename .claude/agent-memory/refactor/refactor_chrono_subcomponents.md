---
name: Chrono sub-component extraction
description: Refactoring du dossier exercise-chrono — extraction des composants inline en 3 fichiers chacun, nouveaux sub-composants back-button et sound-button
type: project
---

Les composants `chrono-header`, `chrono-ring` et `chrono-actions` avaient leur template et styles inline (`styles: [...]`, `template: \`...\``).

Refactoring Plan B appliqué :
- `chrono-back-button.component.{ts,html,css}` — reçoit `output() back`, styles propres
- `chrono-sound-button.component.{ts,html,css}` — reçoit `soundEnabled: input<boolean>()`, émet `toggleSound`, styles propres
- `chrono-header.component.{ts,html,css}` — orchestre les deux sub-composants, conserve badge break-duration et series-badge
- `chrono-ring.component.{ts,html,css}` — migré de inline à fichiers séparés
- `chrono-actions.component.{ts,html,css}` — migré de inline à fichiers séparés

**Why:** Plan B choisi par l'utilisateur pour externaliser chaque composant en 3 fichiers distincts, sans `styles: [...]` ni `template: \`...\`` inline.

**How to apply:** Tout nouveau composant dans ce dossier doit utiliser `templateUrl` et `styleUrl`, jamais les variantes inline.

626/626 tests passent après le refactoring.
