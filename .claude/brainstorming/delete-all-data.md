# Delete All Data

## What this feature does

Adds a destructive "Delete all data" action inside the Stats > Import/Export card.
The button is only visible when at least one session exists. Tapping it opens a typed-confirmation modal where the user must type the word "Supprimer" (resolved via `TranslateService` at runtime, trimmed and case-insensitive) before the deletion is enabled. On confirmation the app deletes every session and every exercise from their respective repositories, then navigates to `/sessions` and shows a success toast. If any step throws, an error toast is shown instead. Photos are not touched.

## Design pattern

No new service layer is needed — the deletion logic is a straight sequential call to the existing repositories (one `getAll` + `delete` per id, for both sessions and exercises). This fits the existing lean usecase pattern (`DeleteSessionUseCase` delegates straight to `SessionService`). The new usecase delegates to `SessionService.delete()` in a loop (which already deletes exercises for a session internally), then calls `SessionService.loadAll()` to reset the reactive signal.

The typed-confirmation modal is a **new standalone component** (`DeleteAllModalComponent`) placed in `primary_adapters/shared/` so it follows the pattern of `ConfirmDialogComponent` and `ImportConfirmModalComponent`. It is self-contained: it holds the text-input state and emits `confirmed` / `cancelled`.

The button's visibility and the navigation/toast flow are wired inside `StatsImportExportCardComponent`, which already owns the Toast and follows the same import-confirm pattern.

## Affected areas

- `src/app/primary_adapters/shared/` — new `DeleteAllModalComponent` (ts + html + scss).
- `src/app/primary_ports/stats-global/delete-all-data.usecase.ts` — new use case.
- `src/app/primary_adapters/stats-global/stats-import-export-card.component.{ts,html}` — add button, wire modal, wire navigation + toast.
- `src/app/assets/i18n/en.json` — new translation keys (English only per project memory convention; all language files must also receive the new keys so the confirmation word can be looked up at runtime in every language).
- All other `src/app/assets/i18n/*.json` — each language file needs its own `deleteAllData.confirmWord` (the word the user must type in that language) plus the remaining UI strings.

> **Note on i18n scope:** The project memory says "Only add new keys to `en.json` by default." However, `confirmWord` is the word the user must **type** to confirm deletion — it must exist in every language file so `TranslateService.instant('deleteAllData.confirmWord')` resolves to the correct word regardless of the active language. The UI labels (`deleteAllData.title`, `deleteAllData.body`, etc.) follow the normal rule and are added only in `en.json`.

## New files to create

| File | Purpose |
|---|---|
| `src/app/primary_adapters/shared/delete-all-modal.component.ts` | Typed-confirmation modal component |
| `src/app/primary_adapters/shared/delete-all-modal.component.html` | Template: instruction text, text input, Cancel / Delete buttons |
| `src/app/primary_adapters/shared/delete-all-modal.component.scss` | Modal styles (reuse popup-backdrop / popup pattern) |
| `src/app/primary_ports/stats-global/delete-all-data.usecase.ts` | Use case: delete all sessions + exercises via SessionService |

## Translation keys to add

### `en.json` (UI strings + confirmWord for English)

```json
"deleteAllData": {
  "buttonLabel": "Delete all data",
  "title": "Delete all data",
  "body": "This will permanently delete all your sessions and exercises. This action cannot be undone.",
  "inputLabel": "Type «Supprimer» to confirm",
  "inputPlaceholder": "Supprimer",
  "confirmWord": "Supprimer",
  "successMessage": "All data deleted",
  "errorMessage": "An error occurred. Please try again."
}
```

### All other language files (confirmWord only — same word "Supprimer" everywhere for MVP simplicity, or the localized equivalent)

Each existing language JSON (`fr.json`, `de.json`, `es.json`, etc.) receives the full `deleteAllData` block. The `confirmWord` in every language is the **localized imperative** for "Delete":
- `fr`: "Supprimer"
- `de`: "Löschen"
- `es`: "Eliminar"
- `it`: "Elimina"
- `pt`: "Eliminar"
- `nl`: "Verwijderen"
- `pl`: "Usuń"
- `ru`: "Удалить"
- `ar`: "احذف"
- `hi`: "हटाएं"
- `ja`: "削除"
- `ko`: "삭제"
- `sv`: "Ta bort"
- `th`: "ลบ"
- `tr`: "Sil"
- `vi`: "Xóa"

## State and data flow

1. `StatsImportExportCardComponent` reads `sessions()` from `GetSessionsUseCase` (already injected via `SessionService._sessions` signal). A `computed()` or `sessions().length > 0` guard controls the button visibility.
2. User taps "Delete all data" → `showDeleteAllModal` signal set to `true`.
3. `DeleteAllModalComponent` emits `confirmed` when the typed word matches (trimmed, case-insensitive, compared to `TranslateService.instant('deleteAllData.confirmWord')`).
4. Parent calls `deleteAllDataUseCase.execute()`.
5. Use case: calls `sessionService.delete(id)` for each session (which internally deletes exercises for that session), then calls `sessionService.loadAll()` to refresh the signal.
6. On success: navigate to `/sessions`, show success toast.
7. On error: show error toast, modal stays closed.

## Edge cases

- **Zero sessions:** button is hidden — the guard in the template prevents reaching the modal.
- **Delete fails mid-loop:** the use case throws; the component catches and shows the error toast. Partial deletion is left as-is (consistent with `ImportDataUseCase` pattern).
- **User types wrong word:** the Confirm button stays disabled; Cancel is always available.
- **Concurrent navigation:** navigating away while the modal is open closes it naturally (Angular destroys the component).
- **Photos:** not touched; `ExercisePhotoRepository` (IndexedDB) is left entirely untouched.

---

## Ordered task list

### Story 1 — Translation keys

**Goal:** Add all i18n keys required by the feature so templates and tests can reference them from the start.

**Scope:**
- `src/app/assets/i18n/en.json` — add full `deleteAllData` block.
- All other `src/app/assets/i18n/*.json` — add the full `deleteAllData` block with each language's `confirmWord` and translated UI strings.

**Acceptance criteria:**
- [ ] `en.json` contains a `deleteAllData` object with: `buttonLabel`, `title`, `body`, `inputLabel`, `inputPlaceholder`, `confirmWord`, `successMessage`, `errorMessage`.
- [ ] All 16 language files contain a `deleteAllData` object with at least `confirmWord` set to a non-empty string appropriate for that language; the other keys are translated.
- [ ] `ng build` produces no missing-key warnings related to the new keys.

**Depends on:** none.

---

### Story 2 — `DeleteAllDataUseCase`

**Goal:** Create a thin use case that deletes every session (and their exercises) and refreshes the session signal.

**Scope:**
- `src/app/primary_ports/stats-global/delete-all-data.usecase.ts` (new file).

**Implementation notes:**
- Inject `SessionService`.
- `execute()` is `async`: get all sessions from `sessionService._sessions()`, call `sessionService.delete(id)` sequentially (or with `Promise.all` — sequential is safer to avoid partial-failure ambiguity), then call `sessionService.loadAll()`.
- Provided `{ providedIn: 'root' }`.

**Acceptance criteria:**
- [ ] Calling `execute()` on a service with N sessions results in zero sessions in the repository and `sessionService._sessions()` returning `[]`.
- [ ] All exercises belonging to those sessions are also deleted (relies on `SessionService.delete` existing behavior).
- [ ] If the repository throws, the error propagates to the caller.
- [ ] Unit test with a mock `SessionService`: verifies `delete` is called once per session and `loadAll` is called once at the end.

**Depends on:** Story 1 (no code dependency, but translation keys should exist before wiring UI).

---

### Story 3 — `DeleteAllModalComponent`

**Goal:** Implement the typed-confirmation modal as a standalone shared component.

**Scope:**
- `src/app/primary_adapters/shared/delete-all-modal.component.ts` (new).
- `src/app/primary_adapters/shared/delete-all-modal.component.html` (new).
- `src/app/primary_adapters/shared/delete-all-modal.component.scss` (new).

**Implementation notes:**
- Inputs: none (self-contained).
- Outputs: `confirmed = output<void>()`, `cancelled = output<void>()`.
- Injects `TranslateService` to call `instant('deleteAllData.confirmWord')` at check time.
- Internal signal `typedValue = signal('')` bound to the text input via `(input)="typedValue.set($event.target.value)"`.
- `isMatch = computed(() => typedValue().trim().toLowerCase() === translate.instant('deleteAllData.confirmWord').trim().toLowerCase())`.
- Confirm button is `[disabled]="!isMatch()"`.
- Template structure: backdrop div (click → cancelled) > popup div (click stopPropagation) > title, body paragraph, text input, Cancel button, Delete button.
- Reuse existing `.popup-backdrop` / `.popup` / `.popup-title` / `.popup-actions` / `.popup-cancel-btn` / `.popup-ok-btn` CSS classes from `stats-global.component.scss` or `confirm-dialog.component.scss` (whichever is appropriate).
- Import `TranslateModule` and `FormsModule` (or `ReactiveFormsModule`) as needed.

**Acceptance criteria:**
- [ ] When `typedValue` does not match `confirmWord` (case/trim variations tested), the Confirm button is disabled.
- [ ] When it matches (exact, extra spaces, mixed case), the Confirm button is enabled.
- [ ] Clicking Confirm emits `confirmed`; clicking Cancel or backdrop emits `cancelled`.
- [ ] Component unit test covers: disabled state, enabled state, confirm click, cancel click, backdrop click.

**Depends on:** Story 1.

---

### Story 4 — Wire into `StatsImportExportCardComponent`

**Goal:** Add the "Delete all data" button, mount the modal, handle navigation and toasts.

**Scope:**
- `src/app/primary_adapters/stats-global/stats-import-export-card.component.ts`.
- `src/app/primary_adapters/stats-global/stats-import-export-card.component.html`.

**Implementation notes:**
- Inject `DeleteAllDataUseCase`, `GetSessionsUseCase`, `Router`.
- Add `readonly sessions = inject(GetSessionsUseCase).sessions` (the signal is already loaded by `SessionListComponent` on init; stats page also runs after the app is booted, so the signal is populated).
- Add `readonly hasSessions = computed(() => this.sessions().length > 0)`.
- Add `readonly showDeleteAllModal = signal(false)`.
- Add `onDeleteAllClicked()`: sets `showDeleteAllModal(true)`.
- Add `async onDeleteAllConfirmed()`: closes modal, calls `deleteAllDataUseCase.execute()`, on success → `router.navigate(['/sessions'])` + success toast, on error → error toast.
- Add `onDeleteAllCancelled()`: sets `showDeleteAllModal(false)`.
- Template: add a new `<button>` below the Import button, guarded by `@if (hasSessions())`, with red/danger styling. Mount `<app-delete-all-modal>` via `@if (showDeleteAllModal())`. The existing `<app-toast>` is already present and reused.
- Import `DeleteAllModalComponent` in the `imports` array.

**Acceptance criteria:**
- [ ] Button is not rendered when `sessions()` is empty.
- [ ] Button is rendered when there is at least one session.
- [ ] Clicking the button opens the modal.
- [ ] Confirming the modal calls the use case, navigates to `/sessions`, and shows the success toast.
- [ ] If the use case throws, the error toast is shown and navigation does not occur.
- [ ] Cancelling the modal hides it without any side effect.
- [ ] Component test: stubs the use case; verifies button visibility, modal mounting, success path, error path, cancel path.

**Depends on:** Stories 2 and 3.
