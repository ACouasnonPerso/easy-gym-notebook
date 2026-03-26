---
name: project_learn_from_history
description: "Learn from history" feature: auto-load default exercise params when typed name exactly matches a past exercise
type: project
---

The "learn from history" feature was implemented on 2026-03-26.

When the user types a name in the add-exercise form and it exactly matches a previously recorded exercise (case-insensitive), the form fields (weightKg, sets, reps, breakDurationSeconds) are auto-populated with that exercise's last recorded values.

**Why:** The user wanted the app to remember their typical parameters per exercise so they don't have to re-enter them every session.

**How to apply:** The entry point is `AutocompleteService.getDefaultsByExactName(name)` in `src/app/core_logic/session-detail/autocomplete.service.ts`. It is called from `AddExerciseFormComponent.onNameInput()` on every keystroke. The existing `getLastParams()` now delegates to `getDefaultsByExactName()` since they share the same lookup logic. Tests are in `src/app/core_logic/session-detail/autocomplete.service.spec.ts`.
