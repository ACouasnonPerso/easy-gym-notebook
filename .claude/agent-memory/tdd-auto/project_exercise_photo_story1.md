---
name: project_exercise_photo_story1
description: Exercise photo Story 1 — ExercisePhoto domain type, IndexedDB repository, Blob↔dataURL mapper, DI token — 12 tests green as of 2026-04-27
type: project
---

## Story 1 — Exercise Photo Domain Types & IndexedDB Repository (2026-04-27)

All 12 tests green, build passes.

**Why:** Foundation for exercise photo capture/display feature.

**How to apply:** All subsequent photo stories depend on `ExercisePhoto` type, `IExercisePhotoRepository` interface, and `EXERCISE_PHOTO_REPOSITORY` token established here.

## Key file paths (created)
- `src/app/core_logic/shared/models.ts` — `ExercisePhoto` added (exerciseName, dataUrl, capturedAt)
- `src/app/secondary_ports/exercise-photo/exercise-photo.repository.interface.ts` — `IExercisePhotoRepository` + `EXERCISE_PHOTO_REPOSITORY` token
- `src/app/secondary_ports/exercise-photo/exercise-photo.repository.ts` — IndexedDB impl, DB name: `easy-gym-photos`, store: `exercise-photos`, index: `exerciseName`
- `src/app/secondary_ports/exercise-photo/exercise-photo.repository.spec.ts` — 6 CRUD tests (fake-indexeddb)
- `src/app/secondary_ports/exercise-photo/exercise-photo-provider.spec.ts` — 2 DI token tests
- `src/app/secondary_adapters/exercise-photo/exercise-photo.mapper.ts` — FileReader toDataUrl + atob toBlob
- `src/app/secondary_adapters/exercise-photo/exercise-photo.mapper.spec.ts` — 4 round-trip tests
- `src/app/app.config.ts` — ExercisePhotoMapper + EXERCISE_PHOTO_REPOSITORY registered

## IndexedDB isolation pattern
Repository exposes `close(): Promise<void>` — call in `afterEach` before `deleteDatabase`.
Without closing the connection first, deleteDatabase blocks and tests time out.

## fake-indexeddb
Added as devDependency. Import `fake-indexeddb/auto` at the TOP of the spec file.
DB teardown: `afterEach(() => { await repository.close(); await deleteDatabase(...) })`
