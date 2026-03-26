# Cardio Exercise

## What this feature does

A user can add a cardio exercise (course, vélo, natation, etc.) to any open session, alongside or
instead of weightlifting exercises. A cardio exercise captures duration (hours + minutes) and
optionally a distance in km. Its stats page shows a time curve and a km curve instead of the
volume/weight curves used for weightlifting.

---

## Functional implications

**New behavior**
- The add-exercise form detects the "Cardio" tag when the user types a name containing a cardio
  keyword (course, vélo, run, cycling, swim, cardio…). This detection replaces the muscle group
  detection for that exercise.
- When "Cardio" is detected, the pickers row switches from (weight / sets / reps / rest) to
  (hours / minutes / km-optional). A visual indicator confirms the cardio mode, mirroring the
  existing `detectedGroup` badge.
- The "Cardio" tag is exclusive: if an exercise already has one or more muscle group tags, and
  the user renames it to trigger cardio detection, the muscle groups are cleared. Conversely, a
  cardio exercise cannot acquire a muscle group tag.
- Distance is optional. When absent, the occurrence is stored without km and excluded from the
  km chart (it still appears in the time chart).
- No repeat blocks — a cardio exercise is a single bloc with one duration and one distance.
- A session can hold any mix of cardio and weightlifting exercises simultaneously.
- The exercise-card for a cardio exercise displays time + km instead of weight / sets / reps.
- The exercise-expanded panel for a cardio exercise shows two drum pickers (hours, minutes) and one
  optional km picker instead of the four weightlifting pickers. The km picker value array is built
  in three segments: 100 m steps from 0 to 2 km, 500 m steps from 2 to 50 km, 1 km steps beyond
  50 km. An "Unknown" option is available at the head of the picker.

**Changed behavior**
- `MuscleGroupDetectorService` gains a new `isCardio(name)` helper (or the `detect()` return type is
  extended with an `isCardio` boolean). If `isCardio` is true, `muscleGroups` is always empty.
- `AddExerciseUseCase` and `UpdateExerciseUseCase` branch on `isCardio` to populate the new cardio
  fields and leave weightlifting fields at their zero/null defaults.
- `ExerciseStatsService.loadForExercise()` inspects whether the exercise is cardio and builds
  `CardioOccurrence` objects instead of `ExerciseOccurrence`.
- `GetExerciseStatsUseCase` exposes a discriminated result so `StatsExerciseComponent` can render
  either the cardio view or the existing weightlifting view.
- Session duplication: `durationSeconds` and `distanceKm` are copied verbatim alongside all other
  exercise fields — no reset or special-case logic required in the duplication use case.

**Edge cases**
- Duration is required (minimum 1 minute enforced in the form — cannot submit with 0h 0min).
- Distance picker starts at 0 km; 0 is treated as "not recorded" and excluded from the km chart.
- Renaming a cardio exercise to a non-cardio name clears `isCardio` and switches the pickers back
  to the weightlifting layout (with default values restored).

---

## Affected areas

- `core_logic/shared/models.ts` — extend `Exercise` and `RawExercise` with `durationSeconds: number`
  and `distanceKm: number | null`; add `ExerciseType = 'strength' | 'cardio'` discriminator or an
  `isCardio: boolean` flag; add `CardioOccurrence` interface.
- `core_logic/shared/muscle-group-detector.service.ts` — add a case-insensitive, bilingual (FR+EN)
  cardio keyword list (cardio, course, run, running, vélo, cycling, swim, natation, walk, marche,
  elliptical, rowing, …); extend return type of `detect()` with `isCardio: boolean`; enforce mutual
  exclusivity. The stored tag is always the canonical string `"Cardio"`.
- `core_logic/session-detail/exercise.service.ts` — no structural change; the new fields are
  transparent to the service.
- `core_logic/stats-exercise/exercise-stats.service.ts` — add `loadForCardioExercise()` (or
  unify under a discriminated return) that computes `durationSeconds` and `distanceKm` aggregates
  per occurrence.
- `primary_ports/session-detail/add-exercise.usecase.ts` — pass `isCardio`, `durationSeconds`,
  `distanceKm` from params to the created `Exercise`; skip muscle-group session update when cardio.
- `primary_ports/session-detail/update-exercise.usecase.ts` — branch on `isCardio` to avoid
  clearing cardio fields when only the name changes.
- `primary_ports/stats-exercise/get-exercise-stats.usecase.ts` — expose a discriminated signal or
  two separate read signals (`occurrences` for strength, `cardioOccurrences` for cardio).
- `secondary_adapters/exercise/exercise.mapper.ts` — map `durationSeconds` and `distanceKm` in
  both `toDomain` and `toStorage`.
- `primary_adapters/session-detail/add-exercise-form.component.ts` — detect cardio mode; swap
  pickers row conditionally.
- `primary_adapters/session-detail/exercise-expanded.component.ts` — same conditional pickers swap
  for the inline edit panel.
- `primary_adapters/session-detail/exercise-card.component.ts` — display time + km for cardio
  exercises; add Cardio to the tag color map.
- `primary_adapters/stats-exercise/stats-exercise.component.ts` — render cardio charts when
  `isCardio`; render strength charts otherwise.

---

## New elements to create

- `primary_adapters/stats-exercise/cardio-time-chart.component.ts` — line chart of duration per
  occurrence (mirrors `VolumeLineChartComponent` structure).
- `primary_adapters/stats-exercise/cardio-distance-chart.component.ts` — line chart of km per
  occurrence, only plotted for occurrences where `distanceKm` is not null/0.

No new service, repository, use-case file, or route is needed. The cardio stats reuse the existing
`/stats/exercise/:exerciseName` route.

---

## State and data flow

**Session detail**
1. User types a name in `AddExerciseFormComponent`.
2. `MuscleGroupDetectorService.detect()` returns `{ muscleGroups: [], isCardio: true }`.
3. A `computed()` signal `isCardioMode` drives the conditional pickers row (no subscription needed).
4. On submit, `AddExerciseUseCase` receives `{ isCardio, durationSeconds, distanceKm }` and builds
   the `Exercise` with those fields; `weightKg / sets / reps` default to 0.
5. `ExerciseService.add()` persists via the repository — the mapper serialises the two new fields.
6. `ExerciseCardComponent` reads `exercise().isCardio` (or infers it from the tag) via `computed()`
   to choose which stats grid to render.
7. `ExerciseExpandedComponent` does the same for the pickers row.

**Stats page**
1. `StatsExerciseComponent.ngOnInit()` calls `useCase.execute(exerciseName)` as today.
2. `ExerciseStatsService` detects cardio by inspecting any occurrence's `isCardio` field.
3. It populates either `_occurrences` (strength) or `_cardioOccurrences` (cardio) — never both.
4. `GetExerciseStatsUseCase` exposes both as readonly signals; `StatsExerciseComponent` reads a
   `computed()` `isCardio` signal derived from whether `cardioOccurrences().length > 0`.
5. The template conditionally renders `CardioTimeChartComponent` / `CardioDistanceChartComponent`
   or the existing `VolumeLineChartComponent` / `WeightLineChartComponent`.

All state is held in signals; no new RxJS stream is introduced.

---

## Performance considerations

- `isCardioMode` in the form is a `computed()` signal — no template function call.
- `isCardio` on the card and expanded panel are `computed()` — evaluated once per exercise change.
- The two new chart components are only instantiated when the stats page is for a cardio exercise;
  `@if` blocks prevent unnecessary construction.
- No lazy loading change required — stats-exercise is already a navigated route.

---

## Testing strategy

**Unit — `MuscleGroupDetectorService`**
- Returns `isCardio: true` for known cardio keywords.
- Returns `isCardio: false` and non-empty `muscleGroups` for strength keywords.
- Never returns both `isCardio: true` and a non-empty `muscleGroups`.

**Unit — `ExerciseStatsService`**
- `loadForExercise()` with cardio occurrences populates `_cardioOccurrences` and leaves
  `_occurrences` empty.
- Occurrences with `distanceKm = 0` are excluded from the km series but included in the time series.

**Unit — `AddExerciseUseCase`**
- When `isCardio` is true, the created exercise has `durationSeconds > 0` and `weightKg === 0`.
- The session's `muscleGroup` is not updated when a cardio exercise is added.

**Component integration — `AddExerciseFormComponent`**
- Pickers row switches to cardio layout when a cardio name is entered.
- Submit is disabled when `durationSeconds === 0`.

**Component integration — `ExerciseCardComponent`**
- Cardio exercise renders time + km; weightlifting exercise renders weight/sets/reps unchanged.

---

## Open questions

All open questions resolved — decisions recorded below.

---

## Design decisions (finalised 2026-03-26)

**DrumPicker for distance**
Three progressive step ranges:
- 0 to 2 km: steps of 100 m (0.1 km)
- 2 km to 50 km: steps of 500 m (0.5 km)
- Beyond 50 km: steps of 1 km

The "Unknown / not recorded" option remains available at the head of the picker as it is today for
other optional DrumPicker fields. This means the value array is built dynamically in three segments
rather than a flat uniform range.

**Cardio tag detection — language handling**
Detection must be case-insensitive and language-agnostic. The keyword list must include at minimum:
`cardio`, `course`, `run`, `running`, `vélo`, `velo`, `cycling`, `bike`, `natation`, `swim`,
`swimming`, `marche`, `walk`, `walking`, `elliptique`, `elliptical`, `rameur`, `rowing`.
The stored tag value is the single canonical string `"Cardio"` (capitalised), regardless of the
input language. No i18n variant is stored — the tag is identified by this exact string in both FR
and EN UI contexts.

**Session duplication**
Cardio fields (`durationSeconds`, `distanceKm`) are copied as-is during duplication, identical to
all other exercise fields. No reset or nulling logic is applied.
