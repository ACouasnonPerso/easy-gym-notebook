# Exercise Rating

## What this feature does
Allows the user to rate individual exercises during a session using a star icon in the expanded exercise view, which opens a popup with a labeled scale. The rating is persisted per exercise and a session-level average rating is displayed on each session card in the session list.

## Relation to cahier des charges
This feature is not currently specified in the development plan (S01-S08). It is a **new addition** that extends the session-detail (S04) exercise expanded view and the session-list (S02) session card. It does not contradict any existing specification. It has **no impact on the stats pages** (S07/S08) per the developer's decision.

## Affected areas

### Domain model (`core_logic/shared/models.ts`)
- `Exercise` interface: add an optional `rating` field (number or null)
- `RawExercise` interface: add an optional `rating` field for persistence
- No change to `Session` -- the average is computed, not stored

### Secondary adapters (`secondary_adapters/exercise/exercise.mapper.ts`)
- Map `rating` between domain and storage, defaulting to `null` when absent (backward-compatible with existing localStorage data -- no migration needed)

### Primary adapters -- exercise expanded (`primary_adapters/session-detail/exercise-expanded.component`)
- Add a star icon button in the `.actions-row` (alongside chrono, stats, delete) that opens the rating popup
- New standalone bottom-sheet popup component for selecting a rating value (reuse the existing bottom-sheet pattern from `edit-duration-popup`)

### Primary adapters -- exercise card (`primary_adapters/session-detail/exercise-card.component`)
- Display the rating discreetly in the `.exercise-header`, to the right of the exercise name (before tags)
- Small text or badge style (e.g., "14/20" in muted color), only shown when rating is non-null

### Primary adapters -- exercise history list (`primary_adapters/stats-exercise/exercise-history-list.component`)
- Display the rating discreetly in the `.history-header`, to the right of the date
- Same muted style as exercise-card (e.g., "14/20"), only shown when rating is non-null

### Primary adapters -- session card (`primary_adapters/session-list/session-card.component`)
- Add a computed signal that calculates the average rating across all exercises in the session that have a non-null rating
- Display the average discreetly in `.session-header`, to the right of the date (before tags), e.g., "moy. 16/20" in muted color
- Hidden entirely when no exercises in the session have a rating

### Use case (`primary_ports/session-detail/update-exercise.usecase.ts`)
- No structural change needed -- the existing `Partial<Exercise>` flow already supports adding `rating` as a change

### i18n (`assets/i18n/en.json`)
- Add keys for rating labels (scale descriptors shown during selection) and the rating popup title

## New elements to create

### `primary_adapters/session-detail/exercise-rating-popup.component.ts` (+ html + scss)
- Standalone component, OnPush
- Receives the current rating as input, emits the selected rating
- Displays the rating scale with labeled options
- Scale sur 20 -- précision fine en haut, regroupement en bas :
  - **20** : Pas pu finir, c'était trop dur
  - **19** : Vraiment dur, pas une rep de plus
  - **18** : Vraiment dur, la prochaine rep aurait été dure
  - **17** : Vraiment dur, peut-être une rep de plus
  - **16** : Dur, encore 2-3 reps possibles
  - **15** : Dur mais gérable
  - **14** : Effort soutenu, marge confortable
  - **13** : Modérément difficile
  - **12** : Effort modéré
  - **10-11** : Facile, bien en dessous de mes capacités
  - **7-9** : Très facile, échauffement
  - **1-6** : Aucun effort
- UI de la popup : bottom-sheet (même pattern que `edit-duration-popup`) avec une liste scrollable des 12 choix. Chaque ligne affiche le nombre à gauche et la description à droite. La valeur actuellement sélectionnée est mise en surbrillance. Un tap sélectionne et ferme la popup.
- After selection, the popup closes and the rating is emitted

## State and data flow

1. **User taps star icon** in exercise-expanded panel -> opens exercise-rating-popup
2. **Popup displays** the 20-level scale (12 choix avec regroupements) as a scrollable list with labels visible during selection. Current rating (if any) is pre-selected.
3. **User selects a value** -> popup emits the rating number -> exercise-expanded emits `update({ rating: value })` via its existing `update` output
4. **UpdateExerciseUseCase** receives the partial with `rating` -> delegates to `ExerciseService.update()` -> `ExerciseRepository.save()` persists to localStorage
5. **Session card** reads `session().exercises`, filters those with non-null `rating`, computes the average via a `computed()` signal. If no exercises have a rating, nothing is displayed.

No new service or state slice needed. The existing signal-based flow handles everything.

## Edge cases to handle

- **No exercises rated in a session**: session card shows no rating indicator at all (not "0" or empty stars)
- **Only some exercises rated**: average is computed only over rated exercises (e.g., 1 out of 5 rated -> show that single rating as the average)
- **Rating cleared**: allow the user to deselect (tap the same value again) to set rating back to null
- **Old data without rating field**: mapper defaults to `null` -- fully backward-compatible, no migration
- **Duplicate session**: the existing duplicate flow copies exercises, so ratings are naturally carried over
- **Import/export**: `RawExercise` gains optional `rating` field -- old exports without it import cleanly (defaults to null)

## Testing strategy

- **Unit (mapper)**: verify `toDomain` defaults `rating` to `null` when absent, and `toStorage` includes `rating` when present
- **Unit (session-card computed)**: test average computation -- no ratings, partial ratings, all rated, single exercise
- **Component (exercise-rating-popup)**: test that selecting a value emits correctly, that current rating is pre-selected, that re-selecting clears
- **Component (exercise-expanded)**: test that star icon triggers popup, that rating update is emitted through the `update` output
- **Use case**: existing `UpdateExerciseUseCase` tests can be extended to include a `rating` partial -- lightweight since the logic is pass-through
