# Wobble

Variable-width hand-drawn SVG path generator for web and React Native.

<div style="display: flex; gap: 16px; margin: 32px 0; align-items: center; flex-wrap: wrap;">
  <a href="https://www.npmjs.com/package/wobble-svg" style="display: inline-block;">
    <img src="https://img.shields.io/npm/v/wobble-svg" alt="npm" />
  </a>
  <a href="https://github.com/blu-octopus/wobble-strokes" style="display: inline-block;">
    <img src="https://img.shields.io/github/license/blu-octopus/wobble-strokes" alt="license" />
  </a>
</div>

## What is Wobble?

Wobble generates pure SVG path data that renders hand-drawn, organically-wobbly outlines with **true variable-width strokes**. Unlike Rough.js, Wobble supports varying stroke widths along a path. Unlike native SVG filters, Wobble generates portable paths that work everywhere: web, React Native, Canvas, or print.

**Key features:**
- **Variable-width strokes** — procedurally generated, no filters
- **Deterministic** — seeded PRNG for reproducible output
- **Zero dependencies** — ~4KB gzipped
- **Framework-agnostic** — web, React Native, anywhere SVG paths render
- **Fast** — generates paths at render time

## Quick Example

```javascript
import { roundedRectBoundary, generateWobblePath } from 'wobble-svg';

// 1. Sample a rounded rectangle's boundary
const boundary = roundedRectBoundary(200, 100, 10);

// 2. Perturb it into a hand-drawn ribbon path
const pathData = generateWobblePath(boundary, {
  seed: 42,
  halfWidth: 1,        // required — roughly strokeWidth / 2
  frequency: 0.05,
  wiggle: 1,
  smoothen: 0.5,
  widthVariance: 0.5
});

// 3. Render — ribbon paths are filled shapes, not stroked lines
const svg = `<svg viewBox="0 0 200 100">
  <path d="${pathData}" fill="#333" fill-rule="evenodd" />
</svg>`;
```

Note the `fill-rule="evenodd"`: a wobble ribbon is a *filled band* (outer boundary + inner boundary as two subpaths), not a stroked centerline — that's what makes the width variation possible in the first place. See [Getting Started](/getting-started) for why.

## Wobble vs. Alternatives

<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; margin: 32px 0;">
  <rect width="800" height="400" fill="#fafafa" rx="8" />
  <circle cx="280" cy="200" r="120" fill="#c2a783" opacity="0.2" stroke="#c2a783" stroke-width="2" />
  <circle cx="520" cy="200" r="120" fill="#8B4513" opacity="0.2" stroke="#8B4513" stroke-width="2" />
  <circle cx="400" cy="200" r="120" fill="#4169E1" opacity="0.2" stroke="#4169E1" stroke-width="2" />

  <text x="180" y="120" font-size="14" font-weight="600" fill="#333">Wobble</text>
  <text x="340" y="390" font-size="12" font-weight="600" fill="#c2a783">Variable-width</text>
  <text x="335" y="406" font-size="12" font-weight="600" fill="#c2a783">Deterministic</text>
  <text x="355" y="422" font-size="12" font-weight="600" fill="#c2a783">Zero deps</text>

  <text x="460" y="120" font-size="14" font-weight="600" fill="#333">Rough.js</text>
  <text x="440" y="390" font-size="12" font-weight="600" fill="#8B4513">Sketchy styles</text>
  <text x="420" y="406" font-size="12" font-weight="600" fill="#8B4513">Large community</text>

  <text x="330" y="120" font-size="14" font-weight="600" fill="#333">Native SVG</text>
  <text x="300" y="340" font-size="12" font-weight="600" fill="#4169E1">Filters</text>
  <text x="310" y="356" font-size="12" font-weight="600" fill="#4169E1">Animations</text>
  <text x="295" y="372" font-size="12" font-weight="600" fill="#4169E1">Browser-native</text>

  <text x="390" y="185" font-size="11" text-anchor="middle" fill="#333">Deterministic</text>
  <text x="390" y="200" font-size="11" text-anchor="middle" fill="#333">Zero deps</text>
  <text x="390" y="215" font-size="11" text-anchor="middle" fill="#333">SVG paths</text>

  <text x="400" y="280" font-size="10" text-anchor="middle" fill="#666">Seeded</text>
  <text x="330" y="280" font-size="10" text-anchor="middle" fill="#666">Portable</text>

  <text x="400" y="30" font-size="16" font-weight="700" text-anchor="middle" fill="#333">Wobble vs Alternatives</text>
</svg>

**Wobble can:** Variable-width strokes, deterministic (seeded), zero deps, web + React Native support, splice custom shapes (notches, tails) directly into a boundary before wobbling it.

**Wobble can't:** Complex sketchy aesthetics (Rough.js' specialty), non-path output (Canvas pixel art, WebGL). Seed morphs via `animateWobbleRibbon` are supported; rough-style hatch fills are not.

## Real-world usage

Wobble started as the rendering engine behind a component library's hand-drawn design system — every button border, card outline, and speech-bubble tail is one continuous `generateWobbleRibbon` call over a `roundedRectBoundary`, sharing one set of stroke constants:

```javascript
export const STROKE_COLOR = '#5b3a29';
export const STROKE_WIDTH = 1.5;
export const STROKE_FREQUENCY = 0.05;
export const STROKE_WIGGLE = 1;
export const STROKE_WIDTH_VARIANCE = 0.5;
```

Reusing one constants module across every consumer is what makes a whole UI read as "one hand", instead of each component wobbling to its own rhythm. See [Examples](/examples) for the full pattern, including how to splice a custom notch (like a dialogue-bubble tail) into a rounded rect's boundary before it gets wobbled.

## Get Started

[Installation & Quick Start](/getting-started)

---

**Built for design systems, creative coders, and procedural art enthusiasts.**
