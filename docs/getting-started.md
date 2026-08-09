# Getting Started

## Installation

Install Wobble from npm:

```bash
npm install wobble-svg
```

## Quick Example

Generate a wobbly rounded rectangle:

```javascript
import { roundedRectBoundary, generateWobblePath } from 'wobble-svg';

// 1. Sample the boundary of a rounded rectangle into a dense point list —
//    each sample carries its position, outward normal, and running arc-length.
const boundary = roundedRectBoundary(
  200, // width
  100, // height
  10   // corner radius
);

// 2. Perturb that boundary into a hand-drawn, variable-width ribbon path
const pathData = generateWobblePath(boundary, {
  seed: 42,             // reproducible wobble
  halfWidth: 1,          // required — roughly desired stroke width / 2
  frequency: 0.05,       // how often the wobble oscillates along the boundary
  wiggle: 1,             // how far the centerline itself jitters, in px
  smoothen: 0.5,         // 0-1 smoothing pass — higher softens jitter into gentler curves
  widthVariance: 0.5     // 0-1 how much the width itself varies
});

// 3. Render — a wobble path is a FILLED band (outer + inner boundary), not
//    a stroked line, so it renders with `fill`, not `stroke`.
const svg = `
  <svg viewBox="0 0 200 100" width="200" height="100">
    <path d="${pathData}" fill="#333" fill-rule="evenodd" />
  </svg>
`;

console.log(svg);
```

Result: a hand-drawn, variable-width rectangular border with organic wobble.

## Why fill, not stroke?

Native SVG `stroke-width` is a single constant along the whole path — there's no way to make it thicker in the middle and thinner at the ends. Wobble sidesteps this by generating the **outer and inner edges of the band as two separate boundaries**, then filling the ring between them (`fill-rule="evenodd"` punches the inner boundary out of the outer one). That's what makes true variable-width strokes possible — and why the output is a fill shape, not something you stroke.

If you only need the outer silhouette (e.g. as a mask or a solid fill shape, not a ring), `generateWobbleRibbon()` also returns `fillPath` — see [API Reference](/api).

## Core Concepts

### Deterministic output

The `seed` parameter ensures the same input always produces the same wobble. Perfect for:
- Design systems (every instance of a component renders identically)
- Testing (predictable SVG output)
- Reproducible generative art (same seed = same result)

```javascript
// These always produce identical paths
const path1 = generateWobblePath(boundary, { seed: 42, halfWidth: 1 });
const path2 = generateWobblePath(boundary, { seed: 42, halfWidth: 1 });
// path1 === path2
```

### Variable-width strokes

Unlike Rough.js (constant width) or native SVG (filters), Wobble generates a ribbon whose width varies along its length. This creates a refined, hand-drawn feel rather than a uniform sketchy line.

The `widthVariance` parameter (0-1) controls how much width varies:
- `0` — uniform width, close to a constant stroke
- `0.5` — moderate variation (a balanced, natural look)
- `1.0` — maximum variation (organic, flowing)

### Boundaries, not raw points

Wobble doesn't take a plain `{x, y}[]` array — it takes a `BoundarySample[]`, where each sample also carries an outward **normal** (which way is "outside" at that point) and a running **arc-length** (`t`, distance traveled so far along the boundary). The normal is what lets Wobble offset a point outward/inward to build the ribbon's two edges; the arc-length is what the noise function samples from, so the wobble reads as one continuous line instead of static per-point jitter.

You don't usually construct `BoundarySample[]` by hand — use the helpers:
- **`roundedRectBoundary(width, height, radius)`** — closed loop (a rect or, if `radius >= min(width, height) / 2`, a full pill/stadium shape)
- **`openPolylineBoundary(points)`** — an open run through a plain `Point[]`, for shapes that shouldn't close into a loop (like one edge of a tail). Sparse vertices are densified along each edge automatically.

### Options reference

```typescript
interface WobbleOptions {
  seed?: number;           // default: 1 — fixed per instance, not randomized per render
  frequency?: number;      // default: 0.05 — how tightly the wobble oscillates
  wiggle?: number;         // default: 1.5 — how far the centerline itself jitters, in px
  smoothen?: number;       // default: 0.5 — 0-1 smoothing pass strength
  halfWidth: number;       // REQUIRED — base half-width of the ribbon, in px
  widthVariance?: number;  // default: 0.5 — 0-1, how much the width itself varies
  closed?: boolean;        // default: true — is the input boundary a loop or an open run?
}
```

`closed` must match whichever boundary helper you used: `true` for `roundedRectBoundary`, `false` for `openPolylineBoundary`.

## Next Steps

- **[Examples](/examples)** — More use cases and patterns, including a real design-system integration
- **[API Reference](/api)** — Full function documentation
- **[FAQ](/faq)** — Common questions answered
