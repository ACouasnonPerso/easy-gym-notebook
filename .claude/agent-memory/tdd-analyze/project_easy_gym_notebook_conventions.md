---
name: easy_gym_notebook_conventions
description: Test framework, component test patterns, architecture conventions, and key file locations for the easy-gym-notebook Angular app
type: project
---

## Test framework
- Jasmine + Karma (NOT Jest) — `jasmine.createSpy()`, `jasmine.clock()`, `expect(...).toBe(...)`, `toHaveBeenCalledTimes(1)`, `toHaveBeenCalledOnceWith(...)`

## Component integration test pattern
- `TestBed.configureTestingModule({ imports: [StandaloneComponent] })` — no schema override needed for pure presentational components
- Required inputs set via `fixture.componentRef.setInput('inputName', value)`
- `fixture.detectChanges()` always called after `setInput` and after signal mutations
- DOM queries: `fixture.debugElement.query(By.css('.selector'))` and `queryAll`
- Button label extraction: `nativeElement.textContent.trim()`
- Click simulation: `debugElement.triggerEventHandler('click', null)`
- Output spying: `spyOn(component.outputName, 'emit')` — Angular `output()` exposes `.emit()`

## Architecture conventions (easy-gym-notebook)
- Standalone components, `ChangeDetectionStrategy.OnPush`, `input()` / `output()` / `inject()`
- Layers: `core_logic/` (services, models) → `primary_ports/` (use cases) → `primary_adapters/` (components)
- `SessionChronoService` is `providedIn: 'root'` singleton; persists state in localStorage under `egn_chrono_start` / `egn_chrono_paused`
- `ChronoStatus` = `'running' | 'paused' | 'ended'` — defined in `session-chrono.service.ts`

## StatsService — muscleGroup distribution pattern (2026-04-27)
- Both `muscleGroupDistribution` and `muscleGroupDetails` use Largest Remainder Method (LRM) for percentage rounding
- Currently (before story 1) both computed signals derive percentages from **exercise count** per `e.muscleGroup` (singular field)
- `computeVolume(e)` from `src/app/core_logic/shared/utils.ts` is the authoritative volume formula (pyramid-aware)
- `makeSession` / `makeExercise` factory helpers in spec file use spread+override; `service._allSessions.set([...])` + `service._allExercises.set([...])` + `service.selectedMonth.set(...)` drive state
- Spec file: `src/app/core_logic/stats-global/stats.service.spec.ts`
- Service file: `src/app/core_logic/stats-global/stats.service.ts`

## DonutChartComponent — totalLoad bug (story 2, 2026-04-27)
- Component: `src/app/primary_adapters/stats-global/donut-chart.component.ts`
- Spec: `src/app/primary_adapters/stats-global/donut-chart.component.spec.ts`
- `formatLoad(kg)`: if `kg >= 1000` passes `kg / 1000` (raw fraction) to `weightDisplay.transform(..., 't')`; else passes `Math.round(kg)` to `weightDisplay.transform(..., 'kg')`
- `totalLoad()` bug: calls `Math.round(sum)` before threshold check, then calls `Math.round(totalKg / 1000)` for the tonne branch — double-rounds, causing integer drift vs `formatLoad`
- Fix: sum raw kg (no pre-rounding), apply same `>= 1000` threshold, pass raw fraction to pipe for tonne branch
- `WeightDisplayPipe.transform(value, unit)` in metric: `Math.round(value * 100) / 100` → max 2 decimal places
- Test setup pattern for this component: `TestBed.configureTestingModule({ imports: [DonutChartComponent], providers: [provideTranslateService()] })` + `fixture.componentRef.setInput('details', ...)`
- `MassUnitService` defaults to metric in tests (localStorage.clear() not needed if never set)

## Key file locations (easy-gym-notebook)
- Chrono service: `src/app/core_logic/chrono/session-chrono.service.ts`
- Chrono service spec: `src/app/core_logic/chrono/session-chrono.service.spec.ts`
- SessionHeaderChronoComponent: `src/app/primary_adapters/session-detail/session-header-chrono.component.ts`
- SessionHeaderChronoComponent spec: `src/app/primary_adapters/session-detail/session-header-chrono.component.spec.ts`
- SessionDetailComponent spec: `src/app/primary_adapters/session-detail/session-detail.component.spec.ts`
- GetSessionChronoUseCase: `src/app/primary_ports/session-chrono/get-session-chrono.usecase.ts`
- PauseSessionChronoUseCase: `src/app/primary_ports/session-chrono/pause-session-chrono.usecase.ts`
- StopSessionChronoUseCase: `src/app/primary_ports/session-chrono/stop-session-chrono.usecase.ts`
- SetSessionChronoUseCase: `src/app/primary_ports/session-chrono/set-session-chrono.usecase.ts`

## SessionDetailComponent spy setup pattern
- Use plain objects with signal values for use case spies (e.g., `{ elapsedSeconds: signal(0), status: signal<ChronoStatus>('running') }`)
- Mutate signals directly after `TestBed.inject(UseCaseToken)` to drive state changes in component tests
- `buildSession(overrides)` factory function pattern for `Session` test data (spread + override)

## State machine gap found (2026-03-26)
- `SessionHeaderChronoComponent` template had no `ended` branch — the `ended` state's "Reprendre" and "Modifier" buttons were not rendered
- The `Modifier` button in `ended` state should emit `durationClick` (same output as the timer label click)
- Tests and implementation need to be aligned to add the `ended` branch
