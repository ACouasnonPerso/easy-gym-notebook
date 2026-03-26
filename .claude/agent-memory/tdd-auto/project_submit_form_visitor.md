---
name: submit_form_account_visitor_complete
description: SubmitFormAccountVisitor feature TDD implementation status
type: project
---

All 35 tests for the `SubmitFormAccountVisitor` feature were implemented and are green as of 2026-03-24.

**Why:** User requested full 6-layer TDD implementation of visitor registration flow.

**How to apply:** Feature is complete. The test list is tracked in `.claude/brainstorming/user-registration-visitor-tests.md` with all items marked `[x]`.

Layers implemented:
- Layer 1: `functions/src/Services/users/VisitorUserGenerator.ts` + `.spec.ts` (8 tests)
- Layer 2: `projects/shared-lib/src/lib/models/auth/RegisterVisitorInput.model.ts` + `.spec.ts` (3 tests)
- Layer 3: `callRegisterVisitor` on `UserProviderService` in shared-lib + `.spec.ts` (6 tests)
- Layer 4: `registerVisitor` on `UserService` in shared-lib + `.spec.ts` (2 tests)
- Layer 5: `UserFormComponent` updated + `user-form.component.spec.ts` (27 tests including 10 new)
- Layer 6: `functions/src/Functions/User/visitor-user.index.ts` + `.spec.ts` (5 tests)

Also fixed pre-existing regression: `StepPersonalComponent.isValid()` was checking `federation && acceptTerms` but tests and parent component only require `firstname + lastname + country`.
