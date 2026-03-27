# Data Import

## What this feature does
Allows the user to import a JSON backup file to restore or enrich their training data. Sessions and exercises from the file are merged additively into the existing local data — nothing is deleted. The operation is atomic: either everything is imported, or nothing is, with a clear error message on failure.

## Relation to cahier des charges
Gap. The cahier des charges (v1.1) does not mention import or export at all. This feature extends the app with a new transversal data management capability, independent of any specific page. It does not contradict any existing spec. The natural placement is the global stats page (`app-stats-global`), at the very end of the page, as a dedicated card.

## Affected areas

**primary_adapters/stats-global**
- `app-stats-global.component.ts` / `.html` — add the import/export card at the bottom of the page; wire the new import use case; show the confirmation popup before proceeding and a toast on success or error. Export is also triggered from here.

**primary_ports/stats-global** (new use case)
- New file: `import-data.usecase.ts` — orchestrates validation, confirmation count, and the call to the import service

**core_logic/import** (new folder)
- New file: `import.service.ts` — parses the JSON, validates its structure, deduplicates against existing data, and persists via repositories

**secondary_adapters/import** (new folder)
- New file: `import.mapper.ts` — maps raw JSON nodes to `RawSession` and `RawExercise`, tolerating optional fields with safe defaults (mirrors ExerciseMapper defaults: `isCardio`, `isPyramid`, `pyramidSets`, `distanceKm`)

**models.ts**
- New interfaces: `ImportPayload` (the expected JSON root shape) and `ImportResult` (count of sessions/exercises added, or error reason)

## New elements to create

| Layer | File |
|---|---|
| primary_adapters/stats-global | `import-confirm-modal.component.ts/.html/.scss` |
| primary_ports/stats-global | `import-data.usecase.ts` |
| core_logic/import | `import.service.ts` |
| secondary_adapters/import | `import.mapper.ts` |

The toast is a reusable UI primitive; if no toast component exists yet, create `primary_adapters/shared/toast.component.ts/.html/.scss`.

## State and data flow

1. User taps the import button on the global stats page (`app-stats-global`) → browser file picker opens (native `<input type="file" accept=".json">`)
2. File is read via `FileReader` in the component → raw string passed to `ImportDataUseCase`
3. Use case calls `ImportService.validate(rawString)` → returns `ImportResult` (valid + count, or error)
4. If valid → use case exposes the count via a signal → component opens `ImportConfirmModalComponent`
5. User confirms → use case calls `ImportService.persist()` → service calls `SessionRepository.save()` and `ExerciseRepository.save()` for each new entity
6. After persist → use case calls `SessionService.loadAll()` to refresh the in-memory signal
7. Component receives success/error signal → displays toast
8. On any parse or schema error → use case sets an error signal → component displays error toast, nothing is written

Signals used: `importCount = signal<number>(0)`, `importError = signal<string | null>(null)`, `importPending = signal<boolean>(false)`.

## Edge cases to handle

- **Invalid JSON** — `JSON.parse` throws → caught, error toast, no write
- **Wrong schema** — parsed object missing `sessions` or `exercises` array → validation guard rejects, error toast
- **Duplicate IDs** — session or exercise whose `id` already exists in localStorage is skipped silently (additive merge, no overwrite)
- **Empty file** — `sessions: []` and `exercises: []` — valid but zero items; confirmation popup shows "0 sessions, 0 exercises" — user can still confirm (no-op)
- **Partially malformed entries** — if one entry fails the mapper guard, the entire import is rejected (all-or-nothing); the mapper validates each entry before any write
- **File too large / slow read** — `importPending` signal drives a loading state on the button to prevent double-trigger

## Testing strategy

- **`ImportService` unit tests** — validate the all-or-nothing logic, deduplication by ID, and behavior with each invalid shape (missing field, wrong type, empty arrays)
- **`ImportMapper` unit tests** — verify safe defaults for optional fields (`isCardio`, `pyramidSets`, etc.) match `ExerciseMapper` conventions
- **`ImportDataUseCase` unit tests** — verify the orchestration: validation error → no persist call; success → persist + loadAll called
- **`ImportConfirmModalComponent` component test** — verify count display and confirm/cancel outputs
- **`AppStatsGlobalComponent` integration** — verify the export/import card is rendered at the bottom of the page, export triggers file download, import triggers file picker
