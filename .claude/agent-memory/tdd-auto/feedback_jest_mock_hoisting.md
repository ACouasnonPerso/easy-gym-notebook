---
name: jest_mock_hoisting_firebase_functions
description: firebase-functions/https onCall mock does not intercept module-level calls in ts-jest
type: feedback
---

When `visitor-user.index.ts` (or any Cloud Function index) calls `functions.onCall()` at module evaluation time, `jest.mock('firebase-functions/https', ...)` in the spec does NOT intercept it — even though jest.mock is hoisted.

**Why:** ts-jest with `isolatedModules: true` has known issues where mocks for certain modules (especially those with side effects at import time) do not apply to the module under test.

**How to apply:** For Cloud Function integration tests, do NOT import the cloud function's index file. Instead, reproduce the handler logic inline in the spec (using the underlying service + `withErrorHandler` directly). This is the pattern used in `visitor-user.index.spec.ts`.
