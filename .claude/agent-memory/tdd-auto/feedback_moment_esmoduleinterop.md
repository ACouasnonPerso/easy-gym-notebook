---
name: moment_esmoduleinterop_fix
description: Fix for moment.js default import crash in visitor Angular jest tests
type: feedback
---

Add `"esModuleInterop": true` and `"allowSyntheticDefaultImports": true` to `projects/visitor/tsconfig.spec.json` to fix the `moment.locale is not a function` crash that occurs when any service importing moment (e.g. `language.service.ts`) is pulled into the test module.

Also add `jest.mock('moment', () => { const m = jest.fn(() => m); m.locale = jest.fn(); m.isMoment = jest.fn(); return m; })` at the top of any visitor spec file that transitively imports a service using moment.

**Why:** TypeScript without `esModuleInterop` compiles `import moment from 'moment'` to `moment_1.default.locale(...)` which crashes because CJS modules don't have a `.default` property at runtime.

**How to apply:** Any time a new spec file is added under `projects/visitor/` that fails with a `locale is not a function` or similar moment crash, check `tsconfig.spec.json` has these flags and add the moment mock at the top of the spec.
