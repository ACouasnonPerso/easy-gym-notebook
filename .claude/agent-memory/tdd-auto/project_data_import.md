---
name: Data Import Feature
description: ImportMapper, ImportService, ImportDataUseCase, ImportConfirmModalComponent — 21 tests green as of 2026-03-27
type: project
---

Data import feature implemented and all 21 tests green as of 2026-03-27.

**Why:** Allow users to restore/enrich training data from a JSON backup file, additively (nothing deleted), atomically (all-or-nothing).

**Files created:**
- `src/app/secondary_adapters/import/import.mapper.ts` — maps raw JSON nodes to RawSession/RawExercise with safe defaults
- `src/app/secondary_adapters/import/import.mapper.spec.ts` — 6 tests
- `src/app/core_logic/import/import.service.ts` — validates JSON, deduplicates by ID, persists; exposes `ImportValidationResult`
- `src/app/core_logic/import/import.service.spec.ts` — 8 tests
- `src/app/primary_ports/stats-global/import-data.usecase.ts` — orchestrates validate/persist, exposes importCount/importError/importPending signals
- `src/app/primary_ports/stats-global/import-data.usecase.spec.ts` — 3 tests
- `src/app/primary_adapters/stats-global/import-confirm-modal.component.ts` — shows session/exercise counts, emits confirmed/cancelled; data-testid="confirm-btn" and "cancel-btn"
- `src/app/primary_adapters/stats-global/import-confirm-modal.component.spec.ts` — 4 tests

**Models added to models.ts:** `ImportPayload` and `ImportResult` interfaces.

**How to apply:** The UI wiring (AppStatsGlobalComponent integration) is left to the UI agent. The importCount signal = sessionCount + exerciseCount from validation. TipsBannerComponent has 2 pre-existing failing tests (not related to this feature).

**Pre-existing TS issue fixed:** `makeExercise` helpers in 8 spec files had `...overrides` (Partial<Exercise>) causing strict TS error after Exercise gained required `isPyramid`/`pyramidSets` fields. Fixed by adding `as Exercise` cast to each return statement.
