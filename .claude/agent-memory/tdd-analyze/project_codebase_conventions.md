---
name: codebase_conventions
description: Naming conventions, test patterns, architecture patterns and file locations observed in this codebase — used to produce accurate design notes during analysis
type: project
---

## Functions-side patterns
- Cloud Function structure: `onCall → withErrorHandler → RequestValidator → XxxService.createUser(data, uid)`
- Generator classes are pure (no DI, no Firebase): instantiated directly in tests
- `CreateAccountInput.dataAccount` is a `FormExtractedData` (string-keyed record); keys follow `domain.fieldName` convention (e.g. `account.email`, `visitor.types`)
- `UserGenerator` produces 8 sub-records; `generateUserShort` and `generateUserPrivate` are the visitor-specific override targets

## Shared-lib service layer
- `UserProvider` — Angular injectable; owns all Firestore read/write calls; injected into `UserService`
- `UserService` — facade; delegates to `UserProvider`, `UserStoreService`, `UserLocalService`
- `FunctionProviderService.callFunctionPromise<T, R>(name, data)` — standard one-shot Firebase function call
- Function name enum: `DBFunctionEnum` at `projects/shared-lib/src/lib/models/database/DBFunction.enum.ts`

## Angular component test conventions
- Framework: Jest (not Jasmine — `jest.fn()`, `jest.clearAllMocks()`)
- Pattern: `TestBed` + `NO_ERRORS_SCHEMA` + `SharedTestingModule` + `TranslateModule.forRoot()`
- Service mocks: plain objects with `jest.fn().mockResolvedValue(undefined)` for async methods
- Signal state read directly from `component.signalName()`
- Async tests: `await component.advance()` pattern (component method returns `Promise<void> | void`)

## Key file locations
- Functions generator: `functions/src/Services/users/UserGenerator.ts`
- Functions service: `functions/src/Services/users/UserService.ts`
- Functions validator: `functions/src/Services/users/UserValidator.ts`
- Functions DBFunctionEnum: `functions/src/Models/shared/database/DBFunction.enum.ts`
- Shared-lib DBFunctionEnum: `projects/shared-lib/src/lib/models/database/DBFunction.enum.ts`
- Shared-lib UserProvider: `projects/shared-lib/src/lib/services/users/user-provider.service.ts`
- Shared-lib UserService: `projects/shared-lib/src/lib/services/users/user.service.ts`
- Shared-lib auth models: `projects/shared-lib/src/lib/models/auth/`
- UserFormComponent: `projects/visitor/src/app/ui/user-form/user-form.component.ts`
- UserFormComponent spec: `projects/visitor/src/app/ui/user-form/user-form.component.spec.ts`
