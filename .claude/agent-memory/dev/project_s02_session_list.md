---
name: S02 Session List — complete
description: S02 implemented all session list layers (service, use cases, shared directives, components). Builds clean.
type: project
---

S02 Session List is fully implemented and builds without errors.

**Why:** Sprint 2 delivery for EasyGymNotebook app.

**How to apply:** When starting S03+, `SessionService` (`core_logic/session/session.service.ts`) is the authoritative owner of session state via `_sessions` signal and `currentSession` signal. All use cases go through it. The chrono integration (`SessionChronoService`) is deferred to S05 with TODO comments in `create-session.usecase.ts` and `duplicate-session.usecase.ts`.

Files created:
- `src/app/core_logic/shared/utils.ts` — `formatDuration(seconds)`
- `src/app/core_logic/session/session.service.ts` — session state, loadAll/create/delete/loadById/updateCurrentSession
- `src/app/primary_ports/session-list/get-sessions.usecase.ts`
- `src/app/primary_ports/session-list/create-session.usecase.ts`
- `src/app/primary_ports/session-list/duplicate-session.usecase.ts`
- `src/app/primary_ports/session-list/delete-session.usecase.ts`
- `src/app/primary_adapters/shared/long-press.directive.ts` — RxJS pointerdown + timer(700) + takeUntil cancel
- `src/app/primary_adapters/shared/confirm-dialog.component.ts`
- `src/app/primary_adapters/shared/context-menu.component.ts`
- `src/app/primary_adapters/shared/scroll-sentinel.directive.ts` — IntersectionObserver
- `src/app/primary_adapters/session-list/session-card.component.ts`
- `src/app/primary_adapters/session-list/session-list.component.ts` — replaced stub
