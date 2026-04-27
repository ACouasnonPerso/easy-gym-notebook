---
name: ui-angular
description: Angular 19 UI implementation patterns for EasyGymNotebook — custom CSS/SCSS design system (no Tailwind), component structure, accessibility basics. Use whenever building or modifying Angular HTML templates.
---

# Skill: Angular UI — EasyGymNotebook Design System

## Design System Discovery

Before writing any template:

1. **Read `src/styles.scss`** — all CSS custom properties (colors, root vars) are defined there.
2. **Read 2–3 existing components** in the same feature area — infer established patterns: card structure, spacing, button shapes, interactive states.
3. **No Tailwind** — all styling is pure CSS/SCSS with scoped `.component.scss` (or `.component.css`) files and global CSS custom properties.
4. **No Angular Material** — all components are 100% custom.

Never invent class names, colors, or tokens not present in the project.

---

## Color Palette (CSS Custom Properties)

All colors come from `--` variables defined in `styles.scss`. Never use hardcoded hex values except for the approved exceptions below.

| Variable         | Value                        | Usage                              |
|------------------|------------------------------|------------------------------------|
| `--bg`           | `#0c0c14`                    | Page background                    |
| `--card`         | `#16161f`                    | Primary card/panel background      |
| `--card2`        | `#1e1e2a`                    | Secondary card, input backgrounds  |
| `--border`       | `#2a2a38`                    | Borders, dividers                  |
| `--orange`       | `#f5a623`                    | Primary accent, CTAs, active state |
| `--orange-dim`   | `rgba(245, 166, 35, 0.15)`   | Orange tinted backgrounds          |
| `--green`        | `#22c55e`                    | Success, validated state           |
| `--green-dim`    | `rgba(34, 197, 94, 0.15)`    | Green tinted backgrounds           |
| `--blue`         | `#3b82f6`                    | Info, secondary accents            |
| `--blue-dim`     | `rgba(59, 130, 246, 0.15)`   | Blue tinted backgrounds            |
| `--red`          | `#ef4444`                    | Destructive actions, errors        |
| `--text`         | `#f0f0f8`                    | Primary text                       |
| `--muted`        | `#6b6b80`                    | Secondary/disabled text            |
| `--sub`          | `#9999aa`                    | Tertiary text, placeholders        |

---

## Typography

Three fonts — each has a specific role. Never mix them up.

| Font              | Role                                          | Typical weight |
|-------------------|-----------------------------------------------|----------------|
| **Space Grotesk** | Headings, titles, labels, tags, buttons       | 600–800        |
| **DM Sans**       | Body text, descriptions, nav labels           | 300–500        |
| **IBM Plex Mono** | Numbers, stats, weights, timer/chrono values  | 400–600        |

**Font size scale (observed):**
- 56px — chrono timer (IBM Plex Mono, letter-spacing: -3px)
- 22px — page titles (Space Grotesk, 800)
- 18px — section titles (Space Grotesk, 800)
- 17px — stats values (IBM Plex Mono, 600)
- 14px — card titles (Space Grotesk, 700)
- 13–15px — body text (DM Sans, 400–500)
- 11px — nav labels (DM Sans)
- 8–10px — micro-labels, tags (Space Grotesk, 600–700, uppercase, letter-spacing: 0.5px)

---

## Component Patterns

### Card

```scss
background: var(--card);
border-radius: 16px; /* or 20px for larger cards */
padding: 14px 16px; /* or 20–24px */
border: 1px solid var(--border);
transition: border-color 0.15s ease, transform 0.15s ease;

&:hover {
  border-color: var(--orange);
  transform: translateY(-2px);
}
```

Left accent bar variant (active/highlighted card):
```scss
&::before {
  content: '';
  position: absolute;
  left: 0; top: 12px; bottom: 12px;
  width: 3px;
  background: var(--orange);
  border-radius: 3px 0 0 3px;
}
```

### Button — Primary (Orange)

```scss
background: var(--orange);
color: #000;
font-family: 'Space Grotesk', sans-serif;
font-weight: 700;
font-size: 14px;
border: none;
border-radius: 10px; /* or 12px */
padding: 12px 20px;
cursor: pointer;
transition: opacity 0.15s ease, transform 0.15s ease;

&:hover { opacity: 0.9; transform: translateY(-1px); }
```

### Button — Secondary/Cancel

```scss
background: transparent;
color: var(--sub);
font-family: 'Space Grotesk', sans-serif;
font-weight: 600;
border: 1px solid var(--border);
border-radius: 10px;
padding: 12px 16px;
cursor: pointer;

&:hover { border-color: var(--orange); color: var(--text); }
```

### Input Field

```scss
background: var(--card2);
border: 1px solid var(--border);
border-radius: 8px; /* or 10px */
padding: 10px 14px;
color: var(--text);
font-family: 'DM Sans', sans-serif; /* or IBM Plex Mono for numeric inputs */
font-size: 14px;

&:focus {
  outline: none;
  border-color: var(--orange);
}
```

### Tag / Badge (pill)

```scss
font-family: 'Space Grotesk', sans-serif;
font-weight: 700;
font-size: 9px;
text-transform: uppercase;
letter-spacing: 0.5px;
padding: 3px 8px;
border-radius: 20px;
/* Background + color defined per semantic variant */
```

Semantic variants:
- Active/accent: `background: var(--orange-dim); color: var(--orange); border: 1px solid rgba(245, 166, 35, 0.3)`
- Success: `background: var(--green-dim); color: var(--green); border: 1px solid rgba(34, 197, 94, 0.3)`
- Info: `background: var(--blue-dim); color: var(--blue); border: 1px solid rgba(59, 130, 246, 0.3)`

### Bottom Sheet / Modal Overlay

```scss
/* Backdrop */
position: fixed; inset: 0;
background: rgba(0, 0, 0, 0.7);
z-index: 1000;

/* Sheet */
position: fixed; bottom: 0; left: 0; right: 0;
background: var(--card);
border-radius: 20px 20px 0 0;
padding: 24px 20px 36px;
```

### Toast Notification

```scss
position: fixed;
bottom: 88px;
left: 50%; transform: translateX(-50%);
background: var(--card);
border-radius: 14px;
padding: 12px 20px;
animation: toastIn 0.18s ease;
/* Success: border-left: 3px solid var(--green) */
/* Error: border-left: 3px solid var(--red) */
```

### Bottom Navigation

- Fixed bar at the bottom, z-index: 100
- Center floating button: 58px circle, `background: var(--orange)`, shadow: `0 0 0 4px var(--card), 0 0 0 5.5px var(--border), 0 8px 24px rgba(245, 166, 35, 0.35)`
- Nav links: column flex, icon (22px) + label (11px DM Sans), active color: `var(--orange)`

---

## Layout & Spacing

**Page container:**
```scss
.page {
  padding: 20px 16px 100px; /* bottom: 100px for fixed nav */
  max-width: 720px;
  margin: 0 auto;

  @media (min-width: 640px) { padding: 28px 24px 100px; }
  @media (min-width: 1024px) { padding: 40px 32px 100px; }
}
```

**Gap scale:** 4px (tight), 8px (default), 12px (sections), 16px (major sections), 24px (page-level)

**Scrollbar (global):** thin, `rgba(153, 153, 170, 0.25)`, border-radius: 999px

---

## Interactions & Transitions

Standard transition for all interactive elements:
```scss
transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
```

- Hover lift: `transform: translateY(-2px)`
- Hover active scale: `transform: scale(1.05)`
- Focus inputs: `border-color: var(--orange)` (no outline)

---

## Angular Template Conventions

- Use `@if`, `@for`, `@switch` — **never** `*ngIf`, `*ngFor`, `*ngSwitch`
- Use `input()` and `output()` signals — **never** `@Input()` / `@Output()` decorators
- Components are standalone by default
- Use `inject()` for any service dependency — no constructor injection
- Use `NgOptimizedImage` for all `<img>` tags
- i18n strings via `translate` pipe: `{{ 'KEY' | translate }}`

---

## Component Scope

**Does:**
- HTML structure with scoped SCSS matching the patterns above
- Animations and transitions (CSS only)
- Typed component inputs and outputs (signal-based)
- Empty TypeScript method stubs when the template needs an event handler
- SVG elements (rings, charts) reproduced from existing patterns

**Does NOT:**
- Business logic
- HTTP calls or data fetching
- State management beyond purely visual derived values
- Routing logic

---

## Accessibility

Apply without extra effort:
- Semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`)
- `alt` on all images
- `aria-label` on icon-only buttons
- Focusable elements (`button`, `a`) — never `div` with click handler

---

## Verification Checklist

Before considering a component done:
- All colors use `var(--*)` CSS custom properties — no hardcoded hex except `#000` on orange buttons
- Typography: Space Grotesk for labels/titles, DM Sans for body, IBM Plex Mono for numbers
- Border-radius, spacing, transitions match the patterns above
- No `*ngIf` / `*ngFor` / `@Input()` / `@Output()` / constructor injection
- All images use `NgOptimizedImage`
- No Tailwind classes anywhere

---

## Anti-Rules

- Do **NOT** use Tailwind — this app uses pure CSS/SCSS only
- Do **NOT** use Angular Material or any external UI library
- Do **NOT** hardcode colors — always use `var(--*)` custom properties
- Do **NOT** invent new CSS variables not present in `styles.scss`
- Do **NOT** use `*ngIf`, `*ngFor`, `@Input()`, `@Output()`, or constructor injection
- Do **NOT** skip reading existing similar components before implementing
