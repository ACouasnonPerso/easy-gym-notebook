---
name: exercise_photo_story1
description: Exercise photo Story 1 — domain type, IndexedDB repository, mapper, provider registration. Key decisions and file paths.
type: project
---

## Story 1 scope (2026-04-27)
Goal: Persist exercise photos locally, keyed by exercise name, behind a repository interface.

**Why:** First story of the exercise-photo feature (see brainstorming/exercise-photo.md). No prior IndexedDB usage in the codebase.

**How to apply:** All subsequent stories depend on the repository interface and `ExercisePhoto` domain type established here.

## Key file paths (new files to create)
- `src/app/core_logic/shared/models.ts` — add `ExercisePhoto` type (name: string, blob: Blob, updatedAt: Date)
- `src/app/secondary_ports/exercise-photo/exercise-photo.repository.interface.ts` — `IExercisePhotoRepository` + `EXERCISE_PHOTO_REPOSITORY` token
- `src/app/secondary_ports/exercise-photo/exercise-photo.repository.ts` — IndexedDB implementation
- `src/app/secondary_ports/exercise-photo/exercise-photo.repository.spec.ts` — integration tests (fake-indexeddb)
- `src/app/secondary_adapters/exercise-photo/exercise-photo.mapper.ts` — Blob ↔ dataURL mapper
- `src/app/secondary_adapters/exercise-photo/exercise-photo.mapper.spec.ts` — mapper unit tests
- `src/app/app.config.ts` — register ExercisePhotoMapper + EXERCISE_PHOTO_REPOSITORY

## Dependencies not yet installed
- `fake-indexeddb` (devDependency) — must be added before implementing repository tests

## Design decisions
- Repository interface follows `IExerciseRepository` pattern: `getAll()`, `save(name, blob)`, `delete(name)` — all return `Promise<T>`
- InjectionToken follows `EXERCISE_REPOSITORY` naming pattern: `EXERCISE_PHOTO_REPOSITORY`
- Mapper is `@Injectable()`, tested via `TestBed.configureTestingModule({ providers: [Mapper] })` pattern
- Repository tests use fresh IndexedDB state per test via `beforeEach` teardown
- `ExercisePhoto` domain type: `{ name: string; blob: Blob; updatedAt: Date }` (IndexedDB stores Blob natively, mapper handles Blob↔dataURL for UI)

## Test suites produced
1. `ExercisePhotoMapper` — Blob→dataURL and dataURL→Blob round-trip (INTEGRATION, TestBed)
2. `ExercisePhotoRepository` — CRUD against fake IndexedDB (INTEGRATION, TestBed + fake-indexeddb)
3. Provider registration smoke test — token resolves to repository instance (INTEGRATION, TestBed + appConfig)
