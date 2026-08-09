# API Reference

## `generateWobblePath()`

Convenience wrapper around `generateWobbleRibbon()` that returns just the ribbon path string — the common case when you don't need the raw outer/inner point arrays.

```typescript
function generateWobblePath(
  boundary: BoundarySample[],
  options: WobbleOptions
): string;
```

### Parameters

- **`boundary`** `BoundarySample[]` — Boundary samples from `roundedRectBoundary()` or `openPolylineBoundary()` (or hand-built).
- **`options`** `WobbleOptions` — see [Options](#options) below.

### Returns

`string` — the same as `generateWobbleRibbon(boundary, options).ribbonPath`: an SVG path `d` value tracing both the outer and inner edges of the wobbled band, ready for `<path d="..." fill="..." fill-rule="evenodd">`.

### Example

```javascript
import { roundedRectBoundary, generateWobblePath } from 'wobble-svg';

const boundary = roundedRectBoundary(200, 100, 10);
const path = generateWobblePath(boundary, { seed: 123, halfWidth: 1 });
```

---

## `generateWobbleRibbon()`

The core function. Perturbs a boundary into a hand-drawn, variable-width ribbon and returns everything: the raw outer/inner point arrays plus two ready-to-use path strings.

```typescript
function generateWobbleRibbon(
  boundary: BoundarySample[],
  options: WobbleOptions
): WobbleRibbon;
```

### Parameters

- **`boundary`** `BoundarySample[]` — sampled boundary to wobble (see [Getting Started](/getting-started#boundaries-not-raw-points)).
- **`options`** `WobbleOptions` — see [Options](#options) below.

### Returns

```typescript
interface WobbleRibbon {
  outer: Point[];     // Outer boundary points after wobble + width, in order
  inner: Point[];     // Inner boundary points after wobble + width, in order (mirrors outer)
  fillPath: string;   // Path along the OUTER boundary only — a plain fill silhouette, no hole
  ribbonPath: string; // Outer + inner as one path, fill-rule="evenodd" punches the ring
}
```

Use `fillPath` when you want a solid filled shape (e.g. a bubble's white background). Use `ribbonPath` when you want the visible stroke band itself (e.g. the brown outline drawn on top of that background) — this is the value `generateWobblePath()` returns directly.

### Example

```javascript
import { roundedRectBoundary, generateWobbleRibbon } from 'wobble-svg';

const boundary = roundedRectBoundary(160, 48, 24); // radius >= height/2 -> pill shape
const ribbon = generateWobbleRibbon(boundary, {
  seed: 7,
  halfWidth: 0.75,
  frequency: 0.05,
  wiggle: 1,
  smoothen: 0.5,
  widthVariance: 0.5,
});

const svg = `<svg viewBox="0 0 160 48">
  <path d="${ribbon.fillPath}" fill="white" />
  <path d="${ribbon.ribbonPath}" fill="#5b3a29" fill-rule="evenodd" />
</svg>`;
```

---

## Options

```typescript
interface WobbleOptions {
  seed?: number;           // default: 1
  frequency?: number;      // default: 0.05
  wiggle?: number;         // default: 1.5
  smoothen?: number;       // default: 0.5
  halfWidth: number;       // REQUIRED, no default
  widthVariance?: number;  // default: 0.5
  closed?: boolean;        // default: true
}
```

- **`seed`** — Integer seed for the deterministic PRNG. Fixed per instance, not randomized per render — same seed always reproduces the same wobble.
- **`frequency`** — How tightly the wobble oscillates along the boundary's arc-length. Lower = slower, more organic changes; higher = rapid wiggles.
- **`wiggle`** — How far the centerline itself jitters, in px (the *position* wobble, distinct from width).
- **`smoothen`** — 0-1 smoothing pass strength; higher softens jitter into gentler curves. Applied as a moving average over neighboring samples.
- **`halfWidth`** — Base half-width of the ribbon, in px (roughly `strokeWidth / 2`). No default — always required.
- **`widthVariance`** — How much the width itself varies, as a fraction of `halfWidth` (0 = constant width, matching a normal stroke).
- **`closed`** — Whether the input boundary is a closed loop (`roundedRectBoundary`) or an open run (`openPolylineBoundary`). Must match the boundary you pass in.

---

## `roundedRectBoundary()`

Samples a rounded rectangle's boundary into a dense, clockwise `BoundarySample[]`, starting at the top-left corner's end.

```typescript
function roundedRectBoundary(
  width: number,
  height: number,
  radius: number
): BoundarySample[];
```

Passing `radius >= min(width, height) / 2` produces a full stadium/pill shape (the straight runs on the short axis disappear entirely).

### Example

```javascript
import { roundedRectBoundary } from 'wobble-svg';

const boundary = roundedRectBoundary(200, 100, 15);
```

---

## `openPolylineBoundary()`

Samples an **open** polyline — e.g. a tail's two visible edges (base-left to apex to base-right) — with a mitered per-vertex outward normal, for shapes that shouldn't close back into a loop.

```typescript
function openPolylineBoundary(points: Point[]): BoundarySample[];
```

### Example

```javascript
import { openPolylineBoundary, generateWobblePath } from 'wobble-svg';

// A scalene (asymmetric) triangle tail, not a mirrored isoceles one
const boundary = openPolylineBoundary([
  { x: 2, y: 0 },
  { x: 7, y: 19 },
  { x: 17.5, y: 0 },
]);

const path = generateWobblePath(boundary, { seed: 9, halfWidth: 0.75, closed: false });
```

---

## `toClosedPath()` / `toOpenPath()` / `toRibbonPath()`

Lower-level path builders — `generateWobbleRibbon()` already calls these for you, but they're exported for custom pipelines.

```typescript
function toClosedPath(points: Point[]): string;
function toOpenPath(points: Point[]): string;
function toRibbonPath(outer: Point[], inner: Point[], closed?: boolean): string;
```

- **`toClosedPath`** — `M ... L ... Z`, closing the loop.
- **`toOpenPath`** — `M ... L ...`, no closing segment.
- **`toRibbonPath`** — stitches an outer and inner boundary into one ribbon. For `closed: true`, this renders outer and inner as two independent closed subpaths (an annulus — needs `fill-rule="evenodd"`). For `closed: false`, it's one connected loop: outer forward, across the far end, inner backward, across the near end.

---

## `mulberry32()`

The seeded PRNG backing every wobble in this package. No `Math.random()` anywhere — deterministic and dependency-free.

```typescript
function mulberry32(seed: number): () => number;
```

Returns a function yielding floats in `[0, 1)`.

```javascript
import { mulberry32 } from 'wobble-svg';

const rng = mulberry32(42);
const a = rng(); // always the same value for seed 42
const b = rng(); // next value in the same deterministic sequence
```

---

## `smoothNoise1D()`

The continuous 1D noise function used internally for both the position (`wiggle`) and width (`widthVariance`) perturbation — a small sum of sine waves at irrational-ratio frequencies and random phases/amplitudes, seeded via `mulberry32`.

```typescript
function smoothNoise1D(seed: number, frequency: number): (t: number) => number;
```

Returns a function mapping an arc-length position `t` to a value roughly in `[-1, 1]`. Unlike raw per-sample PRNG noise, neighboring positions along a path get similar values — that continuity is what makes the wobble read as one hand-drawn line instead of static.

---

## Types

```typescript
interface Point {
  x: number;
  y: number;
}

interface BoundarySample extends Point {
  nx: number;  // outward unit normal, x component
  ny: number;  // outward unit normal, y component
  t: number;   // running arc-length from the start of the boundary, in px
}

interface WobbleOptions {
  seed?: number;
  frequency?: number;
  wiggle?: number;
  smoothen?: number;
  halfWidth: number;
  widthVariance?: number;
  closed?: boolean;
}

interface WobbleRibbon {
  outer: Point[];
  inner: Point[];
  fillPath: string;
  ribbonPath: string;
}
```

---

## See Also

- [Examples](/examples) — Real-world usage patterns, including splicing a custom notch into a boundary
- [FAQ](/faq) — Common questions
