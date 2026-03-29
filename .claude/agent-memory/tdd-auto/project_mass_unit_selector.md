---
name: Mass unit selector feature
description: MassUnitService + MassUnitSelectorComponent integrated into SessionListComponent — 15 tests green as of 2026-03-29
type: project
---

Mass unit selector feature fully implemented and all 15 tests green as of 2026-03-29.

**Why:** User wanted a metric/imperial/US mass unit picker in the session list header, to the left of the language selector.

**How to apply:** When working in session-list, the header now has two selectors side by side. MassUnitService is in `src/app/core_logic/mass-unit/`. MassUnitSelectorComponent is in `src/app/primary_adapters/shared/`.

## Files created
- `src/app/core_logic/mass-unit/mass-unit.service.ts` — `MassUnit` type + `MassUnitService` with `activeMassUnit` signal, `setMassUnit()`, `detect()`
- `src/app/core_logic/mass-unit/mass-unit.service.spec.ts` — 10 tests covering initial state, setMassUnit, detect
- `src/app/primary_adapters/shared/mass-unit-selector.component.ts` — standalone dropdown component (same pattern as LanguageSelectorComponent)

## Files modified
- `src/app/primary_adapters/session-list/session-list.component.ts` — imports MassUnitSelectorComponent, injects MassUnitService, adds `changeMassUnit()` method
- `src/app/primary_adapters/session-list/session-list.component.html` — `<app-mass-unit-selector>` added left of `<app-language-selector>`
- `src/app/primary_adapters/session-list/session-list.component.spec.ts` — 5 tests (3 language + 2 mass unit)

## Business rules implemented
- Auto-detect on first launch: `en-US` → `'us'`, `en-GB` → `'imperial'`, anything else → `'metric'`
- Persist to localStorage key `massUnit` on manual change
- Guard: no write if value unchanged
- Restore from localStorage on service construction
