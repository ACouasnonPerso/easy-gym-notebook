# Easy Gym Notebook — Development Plan

Easy Gym Notebook is a mobile-first Angular 21 **Capacitor app** for tracking gym sessions and recording personal bests. All data is stored in `localStorage` via the native WebView (no backend). The app follows Clean Architecture with strict layer separation: standalone `OnPush` components call use cases, use cases orchestrate core logic services backed by repository interfaces, and concrete localStorage implementations are injected via `InjectionToken`.

**Pages de référence UI** : `design/fitness-app-page-1-2.html` et `design/fitness-app-page-3-5.html` servent de référence pour la **structure HTML**, le **contenu affiché** et le **style graphique** (couleurs, typographie, disposition). Ces pages sont statiques et sans logique — elles ne doivent pas être recopiées. Chaque story reconstruit sa page en Angular avec la logique métier complète (signals, use cases, services), en s'inspirant uniquement du rendu visuel de la référence.

**Firebase readiness** : le pattern InjectionToken + interface de repository permet de basculer vers Firebase sans toucher au `core_logic`. Voir les notes de S01 pour la stratégie de migration.

---

## Stories

| ID | Title | Depends on | Estimated effort |
|----|-------|------------|-----------------|
| S01 | Foundation: app setup, routing, domain models, persistence layer | — | 1 day |
| S02 | Session List: display, create, duplicate, delete | S01 | 1.5 days |
| S03 | Session Detail: load session, exercise list, add exercise form | S01, S02 | 1.5 days |
| S04 | Session Detail: exercise expand, DrumPicker, validate/cancel/delete, End session | S01, S02, S03 | 2 days |
| S05 | Session Chrono: background timer, fullscreen page, Stop/GoBreak | S01, S02 | 1 day |
| S06 | Exercise Chrono: break countdown / exercise countup, audio beep, blink | S01 | 1 day |
| S07 | Stats Global: heatmap, donut chart, month selector, exercise list | S01, S02 | 2 days |
| S08 | Stats Exercise: per-exercise progression chart and history | S01 | 1 day |

**Total estimated effort: ~11 developer-days**

---

## Recommended execution order

```
S01  ──┬──► S02 ──► S03 ──► S04
       │
       ├──► S05   (can start in parallel with S02 after S01)
       │
       ├──► S06   (independent after S01)
       │
       ├──► S07   (independent after S01; richer with real S02 data)
       │
       └──► S08   (independent after S01)
```

**Critical path**: S01 → S02 → S03 → S04 (session CRUD and exercise management)

**Parallel tracks** (once S01 is done):
- Track A: S02 → S03 → S04 (session management — longest chain)
- Track B: S05 (session chrono — small, can be integrated into S02/S04 at any point)
- Track C: S06 (exercise chrono — fully independent)
- Track D: S07 → S08 (stats — S08 can run in parallel with S07 since they share no state)

**Integration notes**:
- S05's `SessionChronoService.start()` is called from S02's `CreateSessionUseCase` and `DuplicateSessionUseCase` — if S05 ships after S02, add a guard in those use cases until the service exists
- S04's `EndSessionUseCase` and S05's `StopSessionChronoUseCase` both interact with `SessionChronoService` — coordinate to avoid duplicating the stop/save logic
- S07 and S08 are read-only (no mutations) and can be developed and tested with seed data in localStorage independently of S02–S06
