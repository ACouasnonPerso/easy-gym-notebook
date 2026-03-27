---
name: user_profile
description: User role, tech stack, and project context for easy-gym-notebook
type: user
---

easy-gym-notebook: Angular standalone component app using:
- Angular standalone components with signals API (Angular 19)
- Karma + Jasmine for component tests — run with: `npx ng test --include="path/to/spec.ts" --watch=false --browsers=ChromeHeadless`
- `npx jest` does NOT work — there is no jest in node_modules, and the npx-cached jest uses Babel which cannot parse TypeScript `implements` keyword
- TDD with RED-GREEN cycles strictly enforced
- French language used in component-level test descriptions (describe/it labels)
- No Firebase, no jest, no WAEC project — this is a gym tracking app

Note: earlier memory entries about "jest + jest-preset-angular" and "WAEC project" were stale — they referred to a different project.
