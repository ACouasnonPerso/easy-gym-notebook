---
name: visitor_registration_feature
description: Context for the SubmitFormAccountVisitor Firebase Cloud Function feature — architecture, test file locations, and key design decisions
type: project
---

The SubmitFormAccountVisitor feature is a new Firebase Cloud Function distinct from the existing SubmitFormAccount (organizer) function. A test list was produced at `.claude/brainstorming/user-registration-visitor-tests.md`.

**Key facts:**
- The existing `SubmitFormAccount` function lives in `functions/src/Functions/User/user.index.ts` — it uses `UserService` + `UserGenerator`
- `VisitorUserGenerator` must override `generateUserShort` (add `types` from input, `idWA`, `idNational`, `country`) and `generateUserPrivate` (add `discoverSoftwareWay`, `dateDiscoverSoftwareWay`, `competitionPreferences.federation` from input)
- `UserGenerator.generateUserShort` hardcodes `types: [TypeUser.ORGANIZER]` and `Federation.WA` — both must be overridden for visitor
- `RegisterVisitorInput` model goes in `projects/shared-lib/src/lib/models/auth/`
- `DBFunctionEnum` must be updated in both `functions/src/Models/shared/database/DBFunction.enum.ts` and `projects/shared-lib/src/lib/models/database/DBFunction.enum.ts`
- `UserFormComponent.submitForm` currently calls `updateUserShort` + `updateUserPrivate` in parallel — must be replaced with a single `registerVisitor(input)` call
- The component test mock at `user-form.component.spec.ts` uses `jest.fn().mockResolvedValue(undefined)` for service methods

**Why:** The visitor form requires server-side atomic creation of all 8 user collections with visitor-specific types (ATHLETE, COACH, PARENT, FAN — never ORGANIZER) and visitor-specific fields not handled by the organizer generator.

**How to apply:** When implementing layers, respect the composition-over-inheritance decision for `VisitorUserGenerator` (delegate 6 shared sub-generators to a `UserGenerator` instance; do not extend the class).
