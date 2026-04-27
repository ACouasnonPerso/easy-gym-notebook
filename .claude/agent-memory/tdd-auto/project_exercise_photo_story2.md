---
name: project_exercise_photo_story2
description: Exercise photo Story 2 — ExercisePhotoStore (signal-based), ExercisePhotoService with ImageDownscalerService collaborator — 17 tests green as of 2026-04-27
type: project
---

Exercise photo Story 2 completed 2026-04-27. 17 tests green.

**Key decisions:**
- `ExercisePhotoStore` lives in `src/app/stores/exercise-photo.store.ts` — plain class (not @Injectable providedIn root), injected via TestBed providers
- Store uses `signal<ExercisePhoto[]>([])` with `update()` for `setForName`/`clearForName`, and `set()` for `setAll`
- `getByName()` is a plain method reading `_photos()` with `.find()`, not a computed signal
- `IExercisePhotoRepository` extended with `getAllPhotos(): Promise<ExercisePhoto[]>` for bulk load
- `ImageDownscalerService` is an injectable collaborator (`src/app/core_logic/exercise-photo/image-downscaler.service.ts`) extracted to enable spying in unit tests (canvas/createImageBitmap unavailable in jsdom/karma)
- Suite B spec uses `jasmine.createSpyObj<ImageDownscalerService>` for downscaler — `downscale.and.resolveTo(...)` pattern
- `ExercisePhotoService.setForName()` always calls `downscaler.downscale(file, 1024)` — the downscaler itself decides whether to actually resize

**Why:** canvas/createImageBitmap unavailable in Karma; injectable collaborator keeps service testable without DOM APIs.
**How to apply:** For any future service using canvas or browser imaging APIs, extract into an injectable collaborator for testability.
