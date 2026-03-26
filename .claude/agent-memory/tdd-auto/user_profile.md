---
name: user_profile
description: User role, tech stack preferences, and project context
type: user
---

Angular monorepo project using:
- Angular standalone components with signals API
- Firebase Cloud Functions (v2, onCall pattern)
- jest + jest-preset-angular for Angular component tests
- ts-jest for functions/shared-lib unit tests
- TDD with RED-GREEN cycles strictly enforced
- French language used in component-level test descriptions (describe/it labels)
- English used for service/function/model test descriptions

User works on a WAEC (World Athletics Events & Competitions) project. The codebase has two apps: `visitor` and `organizer`, plus a `shared-lib` library and a `functions` (Firebase) project.
