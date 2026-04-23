---
name: ui-angular
description: Angular 21 UI implementation patterns — design system discovery, Tailwind conventions, component structure, accessibility basics. Use whenever building or modifying Angular HTML templates.
---

# Skill: Angular UI Implementation

## Design System Discovery

Before writing any template, extract the project's design system:

1. **Look for mockup/design files** in `design/`, `mockups/`, or similar folders. If found, read them — they are the visual ground truth.
2. **Read `tailwind.config.*`** — extract configured theme colors, fonts, spacing, and tokens.
3. **Read 2–3 existing components** in the feature area — infer established patterns: color usage, spacing, card structure, typography, interactive states.
4. **Check global stylesheets** (`styles.css`, `styles.scss`) — extract CSS custom properties and base token definitions.

Never invent tokens or styles not present in the project.

---

## Tailwind + Custom Properties

- Use Tailwind utility classes for all styling.
- For design token values not expressible in Tailwind (specific hex/rgba), use CSS custom properties via `style` binding or a global stylesheet — **never approximate** with the nearest Tailwind color.
- When Tailwind cannot express a precise dimension, use arbitrary value syntax (`w-[360px]`) or an explicit `style` binding.

---

## Angular Template Conventions

- Use `@if`, `@for`, `@switch` — **never** `*ngIf`, `*ngFor`, `*ngSwitch`
- Use `input()` and `output()` — **never** `@Input()` / `@Output()` decorators
- Components are standalone by default
- Use `inject()` for any service dependency — no constructor injection
- Use `NgOptimizedImage` for all `<img>` tags

---

## Component Scope

**Does:**
- HTML structure and Tailwind layout matching the design
- Animations and transitions
- Typed component inputs and outputs
- Empty TypeScript method stubs when the template requires an event handler (body left empty)
- SVG elements (progress rings, icons) reproduced faithfully from the design

**Does NOT:**
- Business logic of any kind
- HTTP calls or data fetching
- State management (`signal()`, `computed()`) except for purely visual derived values (e.g. a CSS class name)
- Routing logic

---

## Accessibility (awareness, not priority)

Apply without extra effort:
- Semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`)
- `alt` attributes on all images
- `aria-label` on icon-only buttons
- Focusable interactive elements (`button`, `a` — never `div` with a click handler)

---

## Verification Checklist

Before considering a component done:
- Colors are only from the project's design system — no arbitrary values not found in the codebase
- Typography uses the correct font family per element type
- Border-radius, spacing, and layout match the reference proportions
- No `*ngIf` / `*ngFor` / `@Input()` / `@Output()` / constructor injection in the template
- All images use `NgOptimizedImage`

---

## Anti-Rules

- Do **NOT** introduce colors not present in the project's design system
- Do **NOT** approximate design values — match precisely or use an explicit value
- Do **NOT** use `*ngIf`, `*ngFor`, `@Input()`, `@Output()`, or constructor injection
- Do **NOT** add CSS files unless necessary for design token setup
- Do **NOT** skip design system discovery before implementing
