# Exercise Photo Linking

## What this feature does
Lets the user attach a single photo to an exercise *name* (e.g. "DC"). The thumbnail appears on the left of every exercise-card sharing that name; tapping it opens a full-size modal. A button in the expanded exercise panel lets the user pick or replace the photo. All data stays on-device.

## Design pattern
**Repository + reactive Store (Observer).** A dedicated `ExercisePhotoRepository` abstracts the local persistence (IndexedDB) behind an interface, while an `ExercisePhotoStore` exposes the in-memory `Map<name, dataUrl>` as a signal. This fits because (a) every card displaying the same name must update simultaneously when the photo changes — the signal-backed store solves this with zero coupling between card instances, and (b) swapping the storage backend (IndexedDB → filesystem on native, mock for tests) is a known need given the existing `localStorage`-based repos.

## Affected areas
- `primary_adapters/session-detail/exercise-card.component.{ts,html,scss}` — add thumbnail slot on the left of `.exercise-stats`, click handler to open modal.
- `primary_adapters/session-detail/exercise-expanded.component.{ts,html,scss}` — add "Add/Change photo" button in the actions row.
- `primary_adapters/session-detail/session-detail.component.ts` — orchestrate the photo modal lifecycle (same pattern as rating/comment popups).
- `core_logic/shared/models.ts` — no change to `Exercise` (photo is name-keyed, not exercise-id-keyed); add `ExercisePhoto` view type.
- `app.config.ts` — register the new repository provider.
- `src/app/assets/i18n/en.json` — add the new translation keys (English only, per project memory).

## New elements to create
- **`primary_adapters/exercise-photo/photo-modal.component.{ts,html,scss}`** — full-size viewer with close button; closes on backdrop click and on Escape.
- **`primary_adapters/exercise-photo/photo-thumbnail.component.{ts,html,scss}`** — small image displayed inside the card (or empty placeholder when no photo). Reads from the store via a use case.
- **`primary_ports/exercise-photo/get-exercise-photo.usecase.ts`** — reactive read by exercise name.
- **`primary_ports/exercise-photo/set-exercise-photo.usecase.ts`** — pick from device (file input with `accept="image/*"` and `capture` hint), downscale, save.
- **`primary_ports/exercise-photo/remove-exercise-photo.usecase.ts`** — clear the photo for a name.
- **`core_logic/exercise-photo/exercise-photo.service.ts`** — orchestrates load-on-init, downscale (canvas, max ~1024px, JPEG quality ~0.8), and store updates.
- **`stores/exercise-photo.store.ts`** — `Map<exerciseName, dataUrl>` exposed as a readonly signal; lookup helper `getByName(name)`.
- **`secondary_ports/exercise-photo/exercise-photo.repository.interface.ts`** + **`exercise-photo.repository.ts`** — IndexedDB-backed (object store `exercisePhotos`, key = exercise name, value = `{ name, blob, updatedAt }`). Exposes `getAll()`, `save(name, blob)`, `delete(name)`.
- **`secondary_adapters/exercise-photo/exercise-photo.mapper.ts`** — Blob ↔ ObjectURL/dataURL conversion for UI consumption.

## State and data flow
1. App start → `ExercisePhotoService.loadAll()` reads IndexedDB and calls `ExercisePhotoStore.setAll()`.
2. `exercise-card` injects `GetExercisePhotoUseCase`, which exposes a `computed()` over `store.photos()` keyed by `exercise().name`. The thumbnail re-renders automatically when the store updates — no per-card subscriptions needed.
3. User taps "Add/Change photo" in the expanded panel → file input → service downscales to a Blob → repo persists → store updates → all cards with that name update at once.
4. Tapping the thumbnail emits an event up to `session-detail.component`, which opens `PhotoModalComponent` with the resolved data URL.

## Edge cases to handle
- No photo for the name → render **nothing** (no placeholder, no empty slot); card layout stays exactly as it is today.
- User renames the exercise in the expanded panel → the displayed thumbnail follows the new name (it may resolve to a different photo or to none); no migration of photo bytes between names.
- Multiple cards on screen sharing the same name → all update simultaneously when the photo changes (store-driven).
- Very large source images → downscale before persisting; reject files that aren't `image/*`.
- IndexedDB unavailable (private mode, quota) → fall back gracefully (in-memory only for the session); log via existing analytics anonymous error path if appropriate.
- Replacing a photo → overwrite the existing entry; revoke any previous ObjectURL to avoid leaks.
- Deleting the photo → confirm via existing `ConfirmDialogComponent` pattern, then clear store + repo.
- Empty/whitespace exercise name → no photo association (button disabled or no-op).

## Testing strategy
- **Unit (use cases & service):** load/set/remove flow against a mock repository; store updates correctly; downscale produces a blob smaller than threshold.
- **Unit (repository):** IndexedDB CRUD against a fake-indexeddb in tests; mapper Blob↔dataURL round-trip.
- **Component (thumbnail):** renders nothing when store has no entry, renders `<img>` when store has one, reacts to store change.
- **Component (modal):** closes on backdrop click and Escape; emits `close` once.
- **Component (card):** clicking the thumbnail emits the open-photo event; clicking elsewhere still toggles expansion.
- **Component (expanded):** clicking the new button triggers the file picker output; replacing the photo emits the right payload.

## Stories

### Story 1 — Domain types and IndexedDB repository
**Goal:** Persist exercise photos locally, keyed by exercise name, behind a repository interface.
**Scope:** core_logic/shared: models.ts (add `ExercisePhoto` type) / secondary_ports/exercise-photo: interface + IndexedDB implementation / secondary_adapters/exercise-photo: mapper / app.config.ts: provider registration.
**Acceptance criteria:**
- [ ] Repository CRUD (`getAll`, `save`, `delete`) works against IndexedDB; verified with fake-indexeddb in tests.
- [ ] Mapper converts Blob ↔ dataURL without loss for typical JPEG payloads.
- [ ] Repository is provided via an `InjectionToken` and registered in `app.config.ts`.
**Depends on:** none.

### Story 2 — Photo store and core service
**Goal:** Expose photos reactively in memory and orchestrate load/save/delete with downscaling.
**Scope:** stores/exercise-photo.store.ts / core_logic/exercise-photo/exercise-photo.service.ts.
**Acceptance criteria:**
- [ ] Store exposes a readonly signal and a `getByName(name)` lookup; `setAll` and per-name updates work.
- [ ] Service `loadAll()` populates the store from the repository on startup.
- [ ] Service `setForName(name, file)` downscales to ≤ 1024 px on the longest edge, persists, and updates the store atomically.
- [ ] Service `removeForName(name)` deletes from repo and store.
**Depends on:** Story 1.

### Story 3 — Use cases for the UI
**Goal:** Provide thin primary ports for read, set, and remove operations.
**Scope:** primary_ports/exercise-photo: get-exercise-photo.usecase.ts, set-exercise-photo.usecase.ts, remove-exercise-photo.usecase.ts.
**Acceptance criteria:**
- [ ] `GetExercisePhotoUseCase` exposes a `photoFor(name)` computed/signal-based accessor.
- [ ] `SetExercisePhotoUseCase.execute(name, file)` validates `image/*` mime and delegates to the service.
- [ ] `RemoveExercisePhotoUseCase.execute(name)` delegates to the service.
**Depends on:** Story 2.

### Story 4 — Photo thumbnail in the exercise card
**Goal:** Display the linked photo on the left of `.exercise-stats`, reacting to store updates.
**Scope:** primary_adapters/exercise-photo: photo-thumbnail.component / primary_adapters/session-detail: exercise-card.component.{ts,html,scss}.
**Acceptance criteria:**
- [ ] Thumbnail renders an `<img>` when a photo exists for the current exercise name, **nothing at all** (no empty space, no placeholder) otherwise — card layout must be identical to the current state when no photo is set.
- [ ] Updating the photo for a name updates every card with that name without reloading.
- [ ] Clicking the thumbnail emits an `openPhoto` event up to the parent (does not toggle card expansion).
**Depends on:** Story 3.

### Story 5 — Full-size photo modal
**Goal:** Show the full-size photo in a closeable modal.
**Scope:** primary_adapters/exercise-photo: photo-modal.component / primary_adapters/session-detail: session-detail.component.{ts,html} (wiring) / assets/i18n/en.json.
**Acceptance criteria:**
- [ ] Modal opens when the card emits `openPhoto`, displaying the photo for the active name at full available size.
- [ ] Modal closes on backdrop click, on close button, and on Escape; emits `close` once.
- [ ] No layout shift when the modal opens/closes (uses the existing modal/popup pattern).
**Depends on:** Story 4.

### Story 6 — Add/change/remove photo from the expanded panel
**Goal:** Let the user pick a photo from device storage or camera, replace an existing one, or remove it.
**Scope:** primary_adapters/session-detail: exercise-expanded.component.{ts,html,scss} / assets/i18n/en.json.
**Acceptance criteria:**
- [ ] A new icon button in the actions row: when no photo is set, shows an "add image" icon (image + "+" indicator) at 80% opacity; when a photo exists, shows a plain image icon (no "+") in full color to indicate a photo is linked.
- [ ] Tapping the icon in either state opens the native file picker (`accept="image/*"`, `capture` hint for camera).
- [ ] Selecting an image triggers `SetExercisePhotoUseCase` with the current exercise name; failure shows the existing toast pattern.
- [ ] When a photo already exists, re-picking replaces it; remove stays available via the existing confirm dialog pattern.
- [ ] Button is disabled when the exercise name is empty/whitespace.
**Depends on:** Story 3.
