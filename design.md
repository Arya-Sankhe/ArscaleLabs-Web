# Arcscale Labs — Design System

> A schematic floating in vacuum. Near-black canvas, a ladder of cool greys for structure, white only where a signal must read — type at full voice, a star-field of dots, one filled pill.

**Brand:** Arcscale Labs
**Tagline:** Building systems of the Future, Today
**Audience:** Enterprise buyers evaluating a custom AI partner
**Theme:** Space — mostly dark and grey, accents of white
**Density:** Comfortable, editorial
**Base unit:** 4px

This file is the single source of truth for visual language. It keeps **Hyperstudio**’s carved-from-void structure (hairline rules, weight-400 authority, no shadows) and **Scale**’s museum pacing (whisper display type, mono labels, generous quiet). The palette does not: no gold, no earth washes, no light “daylight” gallery, no pulse green. The page never leaves space.

---

## Intent

Arcscale Labs builds custom AI systems for enterprises. The site should feel like deep space with instrumentation: dark, measured, high-contrast only when it matters. Quality shows up as restraint — greys doing the work, white used like a star, not a floodlight.

The system does not shout. Headlines occupy space at weight 400. Borders are 1px grey. White is scarce. Photography is almost absent. Elevation never comes from shadow.

---

## Palette philosophy

The field is **dark**. Hierarchy is **grey**. Emphasis is **white**.

| Role | How it is used |
|------|----------------|
| Void / canvas | 90% of the page. Cool near-black, not blue, not purple. |
| Grey | Hairlines, muted copy, icons, secondary controls, section structure. |
| White | Primary headlines, the filled CTA, dot-fields, wireframe strokes, inverted text on the pill. |

If a color is not in the token table below, it is out. No gold compass, no forest/sand/violet washes, no status green.

---

## What we kept from the two guides

| Kept | Dropped |
|------|---------|
| Hyperstudio hairlines, weight 400, white pill CTA, no shadows, type-as-image | Compass Gold, Pulse Green, Card Slate warmth |
| Scale display scale, mono eyebrows, slow section rhythm, wireframe-in-void | Dark-to-light page arc, white product surface, earth-tone category rooms |
| 1280px column, 12px cards, 9999px pill only on primary CTA | Light-mode inverted nav, mist/stone/bone surfaces |

**Still forbidden:** drop shadows on layout, bold display type, gradients, saturated “AI purple,” generic stock photography, colored fills behind headlines.

---

## Voice of the system

One sentence: **instrument panel in orbit.**

Vacuum is the canvas. Grey lines are the chassis. White is telemetry — the only thing that lights up.

Typography does the heavy lifting. Oversized 400-weight headlines in chalk-white, muted grey body, thin grey dividers. Components stay skeletal: outlined buttons, ghost labels, hairline frames. The only “lift” is a filled white pill, and that lift is contrast, not shadow.

---

## Tokens — Colors

All values are cool-neutral. A faint blue in the greys is allowed only as a temperature (space), never as a visible hue. Do not add saturation.

### Core

| Name | Value | Token | Role |
|------|-------|-------|------|
| Void | `#070708` | `--color-void` | Deepest canvas — hero, statement bands, footer |
| Space | `#0c0c0e` | `--color-space` | Default page background |
| Hull | `#121214` | `--color-hull` | Recessed panels, nav underlayer, card wells |
| Rule | `#1c1c20` | `--color-rule` | Primary 1px hairline — the structural line work |
| Rivet | `#2a2a30` | `--color-rivet` | Secondary border, hover rules, icon wells |
| Iron | `#4a4a52` | `--color-iron` | Secondary strokes, quiet icons |
| Dust | `#6e6e76` | `--color-dust` | Tertiary labels, disabled, metadata |
| Smoke | `#9a9aa3` | `--color-smoke` | Body and helper copy |
| Ash | `#c8c8ce` | `--color-ash` | Secondary headings, stronger grey type |
| Chalk | `#f2f2f4` | `--color-chalk` | Primary text and display type |
| Signal | `#ffffff` | `--color-signal` | Accent only — filled pill, key glyphs, star dots, wireframe |

There is no light canvas token. White is not a background except inside the primary pill (and there it is the fill, with Void text).

### Quick color reference

- Canvas: `#0c0c0e` (page), `#070708` (hero / void / footer)
- Panel: `#121214`
- Hairline: `#1c1c20`
- Muted text: `#9a9aa3`
- Primary text: `#f2f2f4`
- Accent / CTA fill / stars: `#ffffff`
- CTA text: `#070708`
- Icons: `#9a9aa3` or `#c8c8ce` stroke; `#ffffff` only for a featured mark

---

## Tokens — Typography

Aeonik is the primary face. Weight **400** is the signature. A mono companion handles labels, tags, and fine print.

**Primary — Aeonik** · `--font-display`
- Role: Headlines, body, buttons, links
- Weights: 400 default; 500 only for lightly emphasized labels; 600 only for 11–14px uppercase micro-links
- Substitute if Aeonik is unavailable: **Satoshi** or **General Sans** (not Inter)
- Features: `'ss01'`, `'ss02'`, `'cv11'` on when the file supports them
- Tracking: `-0.025em` at display, `-0.01em` from 16–64px, default at small UI
- Color: Chalk for headings, Smoke for body. Signal white only if a line must outrank the rest of the hero (prefer Chalk; they are close on purpose)

**Secondary — IBM Plex Mono** · `--font-mono`
- Role: Eyebrows, status pills, section metadata, captions, button microcopy
- Weights: 400
- Substitute: JetBrains Mono or Space Mono
- Uppercase 11px at `+0.05em`; sentence-case 13px at `-0.01em`
- Color: Dust or Smoke — never Signal, except a live status word next to a white dot

### Type scale

Do not set running body above 20px.

| Role | Size | Line height | Letter spacing | Weight | Token |
|------|------|-------------|----------------|--------|-------|
| micro-label | 11px | 1.00 | +0.55px | 400 mono, uppercase | `--text-micro` |
| caption | 13px | 1.40 | +0.02em | 400 mono | `--text-caption` |
| ui | 14px | 1.20 | +0.04em uppercase on buttons | 400 | `--text-ui` |
| body | 16px | 1.50 | 0 | 400 | `--text-body` |
| body-lg | 20px | 1.50 | -0.2px | 400 | `--text-body-lg` |
| heading-xs | 18px | 1.31 | 0 | 400 | `--text-heading-xs` |
| subheading | 24px | 1.20 | -0.24px | 400 | `--text-subheading` |
| heading-sm | 32px | 1.12 | -0.32px | 400 | `--text-heading-sm` |
| heading | 40px | 1.12 | -0.40px | 400 | `--text-heading` |
| heading-lg | 64px | 1.05 | -0.64px | 400 | `--text-heading-lg` |
| display | 72px | 1.04 | -0.72px | 400 | `--text-display` |
| display-xl | 88px | 1.00 | -0.88px | 400 | `--text-display-xl` |

`display-xl` is reserved for a single hero line (the tagline or a two-word fragment of it). Everywhere else, `display` or `heading-lg` is enough.

On viewports below 768px: display-xl → 40px, display → 36px, heading-lg → 32px, heading → 28px. Tracking relaxes slightly so letters do not collide.

---

## Tokens — Spacing and shape

### Spacing scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--space-4` |
| 8 | 8px | `--space-8` |
| 12 | 12px | `--space-12` |
| 16 | 16px | `--space-16` |
| 20 | 20px | `--space-20` |
| 24 | 24px | `--space-24` |
| 32 | 32px | `--space-32` |
| 40 | 40px | `--space-40` |
| 48 | 48px | `--space-48` |
| 64 | 64px | `--space-64` |
| 96 | 96px | `--space-96` |
| 128 | 128px | `--space-128` |
| 160 | 160px | `--space-160` |
| 180 | 180px | `--space-180` |

### Layout

- **Page max-width:** 1280px
- **Viewport gutter:** 24px (16px on small screens)
- **Section vertical padding:** 120–180px
- **Card padding:** 32–48px
- **Element gap:** 16–24px
- Full-bleed is reserved for canvas and atmospheric graphics (star-field, wireframe). Content and type stay inside the column.

Depth between sections comes from Void vs Space vs Hull — all dark — plus 1px Rule lines. Never a white band.

### Radius

| Element | Value | Token |
|---------|-------|-------|
| tags, status | 4px | `--radius-tag` |
| buttons (ghost, secondary) | 8px | `--radius-control` |
| cards, images | 12px | `--radius-card` |
| nested wells | 12px | `--radius-well` |
| feature panels | 20px | `--radius-panel` |
| primary filled CTA | 9999px | `--radius-pill` |
| icon containers | 99px | `--radius-icon` |

9999px is used **only** on the filled primary pill. Cards never go fully round.

### Elevation

No drop shadows on layout, cards, sections, or type. Structure is hairline Rule borders and the Void → Space → Hull ladder. The filled Signal pill is the only element that “lifts,” and it lifts by contrast.

A utility shadow (`0 1px 3px rgba(0,0,0,0.35)`) may appear only on a floating dark control (e.g. a mobile menu). Never on cards. Never a light shadow.

---

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Void | `#070708` | Hero, statement, footer — deepest space |
| 1 | Space | `#0c0c0e` | Default page |
| 2 | Hull | `#121214` | Cards, recessed modules |
| 3 | Rule | `#1c1c20` | 1px grid that defines structure |
| 4 | Signal | `#ffffff` | Accent objects only, never a section background |

---

## Page rhythm

The whole visit stays in space. Contrast is grey-on-dark and white-on-dark, not dark-to-light.

1. **Approach (void).** Full-bleed `#070708`. Wordmark, nav, display tagline in Chalk. Atmosphere is a faint white star-field (low-opacity dots) or a thin white/grey wireframe. Scroll prompt bottom-right.
2. **Instrument (space).** `#0c0c0e` with 1px Rule dividers. Capabilities, method, proof. Hairline grids, grey icons, Smoke body.
3. **Signal (still dark).** A quieter Void band for one sentence and one wireframe — a pause, not a theme change.
4. **Close (void).** Footer on `#070708`. Wordmark, tagline, email, sparse links. 1px Rule on top.

Do not insert a white or mist section to “give the eye a rest.” Rest is empty dark and wider gaps.

---

## Imagery

Near-zero photography. Type, rules, and schematic drawing are the content.

**Allowed**
- Star-fields: small Signal dots on Void, density falling off toward the edges — atmosphere, not a NASA photo, not a cartoon galaxy
- Thin 1–1.5px wireframes in Ash or Signal at 20–40% opacity: lattices, arcs, orbital geometry
- Outlined geometric icons: 1.5px stroke, 24–32px, Iron or Ash; Signal stroke only for the one featured icon in a cluster

**Forbidden**
- Gold, green, blue, or violet strokes
- Team photos, office lifestyle, nebula stock, Earth-from-space clichés, neon grids, purple “AI brain” art
- Multicolor icon sets
- Gradients, nebula glows, glassmorphism, drop-shadowed mockups
- Section backgrounds that leave the dark/grey system

---

## Components

### Top navigation

Transparent over Void, 1px Rule bottom.

- Left: **Arcscale Labs** — Aeonik 18px / 400 / Chalk
- Center: `WORK`, `CAPABILITIES`, `PROCESS`, `CONTACT` — Aeonik 14px / 400 / uppercase / Smoke, 24px gaps
- Right: Signal pill `LET’S TALK` (or `START A BRIEF`)

May become sticky; never a blur, never a light bar, never a drop shadow. Hover links → Ash.

### Headline display block

Aeonik 72–88px / 400 / Chalk. Line-height ~1.04, tracking about `-0.01em`. No color, no underline, no gradient. Sub-headline at 20–24px Smoke. Optional mono eyebrow at 11px uppercase Dust.

Hero carries: **Building systems of the Future, Today.**

### Signal pill (primary action)

The only large white object on the page. Highest-priority CTA (`LET’S TALK`, `START A BRIEF`).

- Fill `#ffffff`, text `#070708`, 9999px radius, 12px 24px padding
- Aeonik 14px / 400 / uppercase, optional ↗
- No shadow. Hover: fill → Chalk, or text/fill invert to ghost — not scale, not glow

One per viewport.

### Ghost outline button (secondary)

Transparent, 1px Ash or Rivet border, 8px radius, 10px 20px padding, Aeonik 14px / 400 / uppercase / Chalk. Used for `VIEW WORK`, `READ THE METHOD`. Hover: border → Signal, still no fill.

### Status badge

Hull background, 1px Rule border, 4px radius, 8px 14px padding. Optional 6px **Signal** dot (white, not green). Mono 11–12px uppercase Smoke.

### Service / capability cell

Transparent or Hull, 1px Rule on sides and bottom (no top, hangs from the section rule). Ash 32px outlined icon. Heading Aeonik 14px uppercase Chalk. Body 14–16px Smoke. 40–48px padding.

Default layout: 2×2 framed grid. A 3-up is allowed if every cell stays in this treatment.

### Proof / work card

Hairline Rule frame, 12px radius, Hull optional. Client name 16px Chalk, category mono 13px Smoke. Small outlined mark in Ash. No photographic mockups required.

### Section divider

1px solid `#1c1c20` across the content column. The line is the layout. No fades, no diamonds, no thick bars, no colored rules.

### Manifesto / method block

Centered, max-width 640px. Title 32–40px / 400 Chalk. Body 16px / 1.5 Smoke. Ghost outline below (`READ THE METHOD`).

### Scroll prompt

Bottom-right of the hero. Mono 13px Smoke: `Scroll to explore`. Adjacent 40×40 outlined square, 8px radius, 1px Rivet border, Ash chevron. Quiet. Optional 1.5s opacity pulse.

### Footer

Void `#070708`, 80–120px vertical padding, 1px Rule on top. Left: wordmark + tagline (Chalk / Smoke). Email and links in Smoke; hover Chalk. Column headers mono 11px uppercase Dust. No social icon row unless they exist.

---

## Motion

Slow and orbital — not a product demo, not a light show.

- Page load: type and rules fade/rise 12–20px over 600–900ms, staggered 60–90ms. Ease: `cubic-bezier(0.16, 1, 0.3, 1)`
- Hairlines may draw 200–400ms
- Star-field is static or drifts at most 8–12px over 20s — barely perceptible
- Hover on text links: Smoke → Chalk, 150ms
- Hover on pills: invert or brightness, 150ms — no grow, no glow
- Scroll-triggered reveals once per section
- Respect `prefers-reduced-motion`: instant states, frozen stars, no drawing lines

No looped nebula, no cursor blobs, no colored particle trails.

---

## Do

- Stay dark. Grey structures the page; white is the accent.
- Use weight 400 for headlines. Scale and tracking carry hierarchy.
- Separate sections with 1px `#1c1c20` rules, not background-color jumps to light.
- Use 9999px radius only on the filled Signal pill.
- Set hero type at 72–88px Aeonik 400 with negative tracking.
- Keep body in Smoke `#9a9aa3`. Keep headings in Chalk `#f2f2f4`.
- Icons in grey stroke. White stroke only for a single featured mark.
- Status dots in white, never green.
- Constrain content to 1280px. Let void and star-field go full-bleed.

## Don’t

- Do not introduce gold, green, blue, violet, or earth tones.
- Do not use white as a section background.
- Do not bold display type.
- Do not add drop shadows to cards or sections.
- Do not use colored buttons. Primary is white fill; secondary is grey outline.
- Do not introduce gradients, glows, or glass.
- Do not use fully rounded cards.
- Do not put photography in the hero.
- Do not use Inter, purple gradients, or “AI neural net” stock art.
- Do not place running body above 20px.

---

## Similar brands (orientation, not imitation)

- **Hyperstudio / Locomotive** — void canvas, weight-400 type, hairline architecture (ignore their gold)
- **Linear (dark)** — cool grey chassis, white as signal
- **Pentagram** — editorial discipline; rules instead of color bands
- Arcscale should feel like a **systems atelier in orbit** — enterprises can trust the silence. Not a creative-studio portfolio, not a SaaS dashboard, not a NASA microsite

---

## Agent implementation notes

When building from this file:

1. Tokens first: CSS custom properties matching the names above. Do not add unused brand colors “for later.”
2. Homepage stays dark end to end. No light hero, no light footer, no beige/green capability rooms.
3. Primary CTA is always the white pill. One per view.
4. Icons are grey stroke. White is the accent, not the default icon color.
5. Copy is spare, specific, and B2B. The tagline is canonical.
6. If a choice is not in this file, prefer more grey and less white.
7. Substitute fonts: Satoshi or General Sans + IBM Plex Mono.

### CSS custom properties (starter)

```css
:root {
  --color-void: #070708;
  --color-space: #0c0c0e;
  --color-hull: #121214;
  --color-rule: #1c1c20;
  --color-rivet: #2a2a30;
  --color-iron: #4a4a52;
  --color-dust: #6e6e76;
  --color-smoke: #9a9aa3;
  --color-ash: #c8c8ce;
  --color-chalk: #f2f2f4;
  --color-signal: #ffffff;

  --font-display: "Aeonik", "Satoshi", "General Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace;

  --text-micro: 11px;
  --text-caption: 13px;
  --text-ui: 14px;
  --text-body: 16px;
  --text-body-lg: 20px;
  --text-heading-xs: 18px;
  --text-subheading: 24px;
  --text-heading-sm: 32px;
  --text-heading: 40px;
  --text-heading-lg: 64px;
  --text-display: 72px;
  --text-display-xl: 88px;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  --space-4: 4px;
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-20: 20px;
  --space-24: 24px;
  --space-32: 32px;
  --space-40: 40px;
  --space-48: 48px;
  --space-64: 64px;
  --space-96: 96px;
  --space-128: 128px;
  --space-160: 160px;
  --space-180: 180px;

  --page-max-width: 1280px;
  --radius-tag: 4px;
  --radius-control: 8px;
  --radius-card: 12px;
  --radius-panel: 20px;
  --radius-pill: 9999px;
}
```

### Example prompts (for later build)

1. **Hero:** Void `#070708`. Mono eyebrow `ARCSCALE LABS` in Dust. Display-xl Chalk tagline *Building systems of the Future, Today.* Subhead 20px Smoke. White pill `LET’S TALK ↗`. Sparse white star dots at low opacity. Scroll prompt bottom-right.
2. **Statement band:** still Void. One thin Ash wireframe. One sentence at 24px / 400 Chalk.
3. **Capability cell:** Space or Hull, 1px Rule frame, 32px Ash stroke icon, 14px uppercase Chalk heading, 14px Smoke body, 48px padding.
4. **Proof card:** Hull, 12px radius, 1px Rule, no shadow, 32px padding, 16px Chalk name, 13px mono Smoke category.
5. **Footer:** Void, Rule top hairline, Chalk wordmark, Smoke tagline and links.

---

## Open for later (not design blockers)

Copy, case studies, real email, and exact capability names can land after this system. Visual rules above do not wait on them. When in doubt: darker field, greyer structure, less white.
