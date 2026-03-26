---
name: Project design system
description: No Tailwind config exists — all color/spacing tokens are CSS custom properties defined in styles.scss; icon library not loaded, use inline SVG
type: project
---

The project does NOT have a tailwind.config file. All design tokens are CSS custom properties defined in `src/styles.scss`:

- `--bg: #0c0c14` — page background
- `--card: #16161f` — card / component surface
- `--card2: #1e1e2a` — elevated card
- `--border: #2a2a38` — borders and dividers
- `--orange: #f5a623` — primary accent
- `--orange-dim: rgba(245,166,35,0.15)` — accent tint
- `--green: #22c55e` / `--green-dim`
- `--blue: #3b82f6` / `--blue-dim`
- `--red: #ef4444`
- `--text: #f0f0f8` — primary text
- `--muted: #6b6b80` — secondary/inactive text
- `--sub: #9999aa` — tertiary text

Fonts (loaded via Google Fonts in index.html):
- `'Syne'` — headings/nav labels (weights 400, 600, 700, 800)
- `'DM Sans'` — body text (weights 300, 400, 500, 600)
- `'IBM Plex Mono'` — monospace (weights 400, 500, 600)

No icon library is loaded. Use inline SVG for all icons.

**Why:** The project predates a Tailwind setup; CSS custom properties are used throughout all existing components for theming.

**How to apply:** When writing styles for this project, use CSS custom properties directly (`var(--orange)`, `var(--card)`, etc.) rather than Tailwind color utilities. Tailwind utilities are still usable for layout/spacing utilities if Tailwind is configured, but verify first.
