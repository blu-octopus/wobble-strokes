# Examples

## Simple Rounded Rectangle

```javascript
import { roundedRectBoundary, generateWobblePath } from 'wobble-svg';

const boundary = roundedRectBoundary(200, 100, 10);
const path = generateWobblePath(boundary, {
  seed: 1,
  halfWidth: 1,
  frequency: 0.05,
  wiggle: 1,
  smoothen: 0.5,
  widthVariance: 0.5
});

const svg = `<svg viewBox="0 0 200 100" width="400" height="200">
  <path d="${path}" fill="#333" fill-rule="evenodd" />
</svg>`;
```

**Result:** A hand-drawn rectangular border with variable-width strokes.

---

## Variable-Width Pill Shape

Pass a corner radius `>= height / 2` and `roundedRectBoundary` collapses into a full stadium/pill shape automatically:

```javascript
import { roundedRectBoundary, generateWobblePath } from 'wobble-svg';

const boundary = roundedRectBoundary(300, 60, 30); // radius = height/2 -> pill
const path = generateWobblePath(boundary, {
  seed: 42,
  halfWidth: 1.5,
  frequency: 0.08,
  wiggle: 1.2,
  smoothen: 0.6,
  widthVariance: 0.8 // more variation
});

const svg = `<svg viewBox="0 0 300 60" width="600" height="120">
  <path d="${path}" fill="#c2a783" fill-rule="evenodd" />
</svg>`;
```

**Result:** A pill-shaped border with organic, flowing width variation.

---

## Scalene Triangle (Dialogue Tail)

For a shape that shouldn't close into a loop — like one edge of a speech-bubble tail — sample it as an open polyline instead of a rounded rect:

```javascript
import { openPolylineBoundary, generateWobblePath } from 'wobble-svg';

// Deliberately asymmetric: one short/steep edge, one long/shallow edge —
// a real hand-drawn nub is never a mirrored isoceles triangle.
const boundary = openPolylineBoundary([
  { x: 2, y: 0 },
  { x: 7, y: 20 },
  { x: 17.5, y: 0 }
]);

const path = generateWobblePath(boundary, {
  seed: 9,
  halfWidth: 0.75,
  frequency: 0.05,
  wiggle: 0.8,
  smoothen: 0.4,
  widthVariance: 0.6,
  closed: false // required — this is an open run, not a loop
});

const svg = `<svg viewBox="0 0 20 20" width="100" height="100">
  <path d="${path}" fill="#823D00" fill-rule="evenodd" />
</svg>`;
```

**Result:** An asymmetric triangle with hand-drawn wobble, perfect for dialogue bubbles.

---

## Splicing a Notch into a Boundary

The technique above works for a *standalone* tail, but if you overlay it on top of an already-wobbled bubble, the two shapes were perturbed with independent noise and never quite line up at the seam. The fix: don't generate the tail separately — **splice its vertices directly into the bubble's own boundary samples** before running `generateWobbleRibbon` once, so the tail becomes structurally part of the same continuous line.

```javascript
import { roundedRectBoundary, generateWobbleRibbon } from 'wobble-svg';

function spliceNotch(boundary, insertAfterIndex, notchPoints) {
  // notchPoints: e.g. [baseLeft, apex, baseRight], each a {x, y}.
  // Give every inserted point nx/ny = 0 for now — recompute below.
  const inserted = notchPoints.map((p) => ({ ...p, nx: 0, ny: 0, t: 0 }));
  const result = [
    ...boundary.slice(0, insertAfterIndex),
    ...inserted,
    ...boundary.slice(insertAfterIndex),
  ];

  // Recompute normals for the new points by mitering against their new neighbors.
  const segmentNormal = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { nx: dy / len, ny: -dx / len };
  };
  const n = result.length;
  for (let i = insertAfterIndex; i < insertAfterIndex + inserted.length; i++) {
    const prev = result[(i - 1 + n) % n];
    const next = result[(i + 1) % n];
    const n1 = segmentNormal(prev, result[i]);
    const n2 = segmentNormal(result[i], next);
    const nx = n1.nx + n2.nx, ny = n1.ny + n2.ny;
    const len = Math.hypot(nx, ny) || 1;
    result[i] = { ...result[i], nx: nx / len, ny: ny / len };
  }

  // Re-thread arc-length across the whole spliced sequence so the noise
  // function samples continuously through the splice instead of jumping.
  let t = 0;
  result[0] = { ...result[0], t: 0 };
  for (let i = 1; i < n; i++) {
    t += Math.hypot(result[i].x - result[i - 1].x, result[i].y - result[i - 1].y);
    result[i] = { ...result[i], t };
  }
  return result;
}

const bubble = roundedRectBoundary(140, 60, 16);
const notch = [
  { x: 60, y: 60 },
  { x: 67, y: 79 },
  { x: 77.5, y: 60 },
];
const spliced = spliceNotch(bubble, 30, notch); // index chosen to land on the bottom edge

const ribbon = generateWobbleRibbon(spliced, { seed: 4, halfWidth: 0.75, widthVariance: 0.5 });
```

**Result:** A bubble and its tail rendered as one seamless hand-drawn line, with no visible seam at the join — this is the exact pattern behind production dialogue-bubble components.

---

## Multiple Wobbles with Different Seeds

```javascript
import { roundedRectBoundary, generateWobblePath } from 'wobble-svg';

const seeds = [1, 42, 99];
const paths = seeds.map((seed) => {
  const boundary = roundedRectBoundary(150, 100, 12);
  return generateWobblePath(boundary, {
    seed,
    halfWidth: 1,
    frequency: 0.05,
    wiggle: 1,
    smoothen: 0.5,
    widthVariance: 0.6
  });
});

const svg = `<svg viewBox="0 0 500 120" width="500" height="120">
  ${paths.map((path, i) => `
    <g transform="translate(${i * 170}, 0)">
      <path d="${path}" fill="#c2a783" fill-rule="evenodd" />
    </g>
  `).join('')}
</svg>`;
```

**Result:** Three identical rectangles with three different wobble patterns (different seeds).

---

## Design System Integration (React)

A real pattern for consistent hand-drawn borders across a whole component library: one shared constants module, one small wrapper component, every consumer just passes size/radius/seed.

```javascript
// strokeDefaults.js — one source of truth for the whole design system
export const STROKE_COLOR = '#5b3a29';
export const STROKE_WIDTH = 1.5;
export const STROKE_FREQUENCY = 0.05;
export const STROKE_WIGGLE = 1;
export const STROKE_WIDTH_VARIANCE = 0.5;
```

```jsx
// WobbleBorder.jsx — a generated border overlay for any fixed-radius box
import { useMemo } from 'react';
import { roundedRectBoundary, generateWobbleRibbon } from 'wobble-svg';
import { STROKE_COLOR, STROKE_WIDTH, STROKE_FREQUENCY, STROKE_WIGGLE, STROKE_WIDTH_VARIANCE } from './strokeDefaults';

export function WobbleBorder({ width, height, radius, seed, strokeWidth = STROKE_WIDTH, color = STROKE_COLOR }) {
  const ribbonPath = useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    const inset = strokeWidth / 2;
    const boundary = roundedRectBoundary(width - strokeWidth, height - strokeWidth, radius)
      .map((p) => ({ ...p, x: p.x + inset, y: p.y + inset }));
    return generateWobbleRibbon(boundary, {
      seed,
      halfWidth: strokeWidth / 2,
      frequency: STROKE_FREQUENCY,
      wiggle: STROKE_WIGGLE,
      widthVariance: STROKE_WIDTH_VARIANCE,
    }).ribbonPath;
  }, [width, height, radius, strokeWidth, seed]);

  if (!ribbonPath) return null;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      <path d={ribbonPath} fill={color} fillRule="evenodd" />
    </svg>
  );
}
```

```jsx
// Every card/button/modal in the library just does this:
<div style={{ position: 'relative' }}>
  <WobbleBorder width={size.width} height={size.height} radius={10} seed={6} />
  {children}
</div>
```

Every consumer passes a different `seed` (so no two components wobble in lockstep) but shares the same `strokeDefaults` — that's what makes a whole UI read as "one hand" instead of each piece wobbling to its own rhythm.

---

## Tips & Tricks

- **Determinism**: same seed + same options = same output. Great for testing and design systems.
- **`fill`, not `stroke`**: a wobble ribbon is a filled band; always pair `ribbonPath` with `fill-rule="evenodd"`.
- **React Native**: the exact same `pathData` string works with `<Path d={pathData}>` from `react-native-svg` — nothing else changes.
- **Seed variation**: increment seed by 1 for each element in a grid to create subtle variation without true randomness.
- **Width variation**: higher `widthVariance` (0.7+) creates more organic, flowing strokes; lower (0.2-0.3) looks more refined and closer to a constant stroke.
- **halfWidth has no default** — it's the one required option; a good starting point is `desiredStrokeWidth / 2`.

---

See [API Reference](/api) for all available functions and options.
