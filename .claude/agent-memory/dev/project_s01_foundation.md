---
name: S01 Foundation — standalone migration complete
description: S01 is done: bare NgModule app migrated to standalone Angular 19, all infrastructure layers scaffolded, app compiles cleanly.
type: project
---

S01 foundation implemented and building successfully. The app was migrated from NgModule to standalone Angular 19.

Key decisions made:
- `withHashLocation()` used in router for Capacitor compatibility
- `SessionMapper` and `ExerciseMapper` provided explicitly in `app.config.ts` (not `providedIn: 'root'`) so the repositories can inject them via the DI tree
- All 6 lazy-loaded feature components are stubs; they live in `primary_adapters/<feature>/`
- Domain models are in `core_logic/shared/models.ts` (not a top-level `models.ts`)
- localStorage keys: `egn_sessions`, `egn_exercises`

**Why:** Sprint S01 requirement — establish clean architecture foundation before feature work begins.
**How to apply:** Do not add `providedIn: 'root'` to repositories or mappers. Always provide them through `app.config.ts` or a feature-level provider.
