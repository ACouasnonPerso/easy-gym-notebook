# Pyramid Mode

## What this feature does

Allows the user to define heterogeneous sets for a strength exercise, where each set has its own weight and rep count (pyramid, reverse pyramid, or any free combination). In compact view the card shows averaged weight and reps with a mean symbol; in expanded view each set row is displayed individually. Volume calculation uses ∑ weightᵢ × repsᵢ instead of the flat formula.

## Relation to cahier des charges

Gap — the cahier des charges (section 4.2) specifies a single weight/sets/reps picker per exercise. Pyramid mode extends this spec without contradicting it: standard mode remains the default and the toggle only appears on non-cardio exercises. The auto-completion rule (section 5.2) is extended: the last-used mode and all its set rows are restored on suggestion select.

## Affected areas

- `core_logic/shared/models.ts` — `Exercise` and `RawExercise` interfaces must gain two new fields: `isPyramid: boolean` and `pyramidSets: PyramidSet[]`. New interface `PyramidSet { weightKg: number; reps: number }` added in the same file. `ExerciseOccurrence` needs no change (volumeKg is already a scalar).
- `secondary_adapters/exercise/exercise.mapper.ts` — `toDomain` and `toStorage` must map the two new fields; handle absence of fields on legacy records (default to `isPyramid: false`, `pyramidSets: []`).
- `core_logic/session-detail/autocomplete.service.ts` — `getDefaultsByExactName` and `getLastParams` must return `isPyramid` and `pyramidSets` from the last occurrence.
- `core_logic/stats-global/stats.service.ts` — `monthSummary`, `weekSummary`, and `exerciseSummaries` all compute volume as `weightKg * sets * reps`; this formula must branch on `isPyramid` to use `pyramidSets.reduce(...)` instead.
- `core_logic/stats-exercise/exercise-stats.service.ts` — `volumeKg` in `ExerciseOccurrence` mapping must apply the same branching.
- `primary_ports/session-detail/add-exercise.usecase.ts` — `AddExerciseParams` interface and `execute()` must accept `isPyramid` and `pyramidSets`.
- `primary_ports/session-detail/update-exercise.usecase.ts` — must pass `isPyramid` and `pyramidSets` through `changes` without stripping them.
- `primary_adapters/session-detail/add-exercise-form.component.ts` — must manage the pyramid toggle state and the dynamic set-row list, then pass the new params on submit.
- `primary_adapters/session-detail/add-exercise-form.component.html` — toggle placed top-right of the name bar (reducing its width slightly), plus a `@for` loop rendering one weight + reps row per pyramid set.
- `primary_adapters/session-detail/exercise-expanded.component.ts` — same toggle and set-row list for editing an existing exercise.
- `primary_adapters/session-detail/exercise-expanded.component.html` — same layout as the form.
- `primary_adapters/session-detail/exercise-card.component.ts` — compact view rendering must branch on `isPyramid` to display averaged weight and reps with a mean symbol (≈).
- `primary_adapters/session-detail/exercise-card.component.html` — replace flat weight/sets/reps stats block with a conditional that renders the pyramid compact summary.

## New elements to create

No new files are strictly required. All changes are extensions of existing files. The `PyramidSet` interface is added to `core_logic/shared/models.ts` alongside the existing model definitions.

## State and data flow

In the form and expanded component, the pyramid mode is driven by a local `isPyramid` signal (boolean). The set-row list is a local `pyramidSets` signal (array of `{ weightKg, reps }`). When `isPyramid` is false, the existing standard pickers are shown and `pyramidSets` is ignored on submit (sent as `[]`). When `isPyramid` is true, the standard weight/sets/reps pickers are hidden and replaced by the dynamic row list.

On autocomplete suggestion select (`onSuggestionSelect`), `AutocompleteService.getLastParams` returns the full last occurrence including `isPyramid` and `pyramidSets`; the form restores both signals from these values.

Volume computation is a pure function `computeVolume(exercise: Exercise): number` that can be extracted to `core_logic/shared/utils.ts` and consumed by `StatsService`, `ExerciseStatsService`, and any other volume calculation site to avoid duplication.

The `Exercise` domain model carries `isPyramid` and `pyramidSets` at runtime. `RawExercise` carries the same fields for storage (localStorage JSON). The mapper handles backward compatibility by defaulting missing fields to `false` and `[]`.

## Edge cases to handle

- **Legacy exercises in storage** — records without `isPyramid`/`pyramidSets` fields: mapper defaults to `isPyramid: false`, `pyramidSets: []`. No migration needed.
- **Pyramid with zero rows** — if the user removes all rows, submit must be blocked (same guard as `isSubmitDisabled` in the form).
- **Switching from pyramid back to standard** — the standard pickers must re-initialise to the last-used values held in their signals (not reset to defaults). The `pyramidSets` list is preserved in state in case the user toggles back.
- **Compact view average** — weight and reps averages are computed as `computed()` signals on the component from `pyramidSets`. If `pyramidSets` is empty (should not happen after validation), display `—`.
- **Volume in stats** — pyramid exercises with `pyramidSets: []` (legacy or toggled-back) fall back to the flat formula `weightKg * sets * reps` so no data is lost.
- **Cardio exercises** — the pyramid toggle is never shown on cardio exercises (`isCardio` guards it in both form and expanded component).

## Testing strategy

- **Unit — `computeVolume` utility** : test both branches (standard and pyramid), including empty pyramidSets fallback.
- **Unit — `ExerciseMapper`** : test `toDomain` with a legacy record (no pyramid fields) and a full pyramid record. Test `toStorage` round-trip.
- **Unit — `AutocompleteService`** : test that `getLastParams` returns `isPyramid` and `pyramidSets` from the latest matching exercise.
- **Unit — `StatsService`** : test `monthSummary.totalWeightKg` with a mix of standard and pyramid exercises to confirm both volume formulas are applied correctly.
- **Component — `AddExerciseFormComponent`** : test toggle rendering (pyramid pickers appear, standard pickers disappear), test submit payload contains `isPyramid: true` and correct `pyramidSets`, test autocomplete restore sets the pyramid state.
- **Component — `ExerciseCardComponent`** : test compact view shows averaged values with ≈ symbol when `isPyramid` is true, shows flat values otherwise.
