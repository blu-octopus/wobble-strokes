# API Reference

## `generateWobblePath()`

Generate a wobbly SVG path from a boundary point array.

```typescript
function generateWobblePath(
  points: Point[],
  options: WobbleOptions
): string;
```

### Parameters

- **`points`** `Point[]` ¡X Array of `{x, y}` coordinates defining the boundary to wobble. Should be ordered (clockwise or counter-clockwise), and typically represent a closed shape.
- **`options`** `WobbleOptions` ¡X Configuration object (see Options section)

### Returns

`string` ¡X SVG path `d` attribute value, ready to render in `<path d="...">`.

### Options

```typescript
interface WobbleOptions {
  seed: number;
  frequency?: number;     // default: 0.05
  wiggle?: number;        // default: 1
  smoothen?: number;      // default: 0.5
  widthVariance?: number; // default: 0.5
}
```

- **`seed`** (required) ¡X Integer seed for seeded PRNG. Same seed = same output.
- **`frequency`** ¡X Controls wobble frequency (0-1). Lower = slower oscillation, higher = more rapid wiggles.
- **`wiggle`** ¡X Amplitude multiplier. Higher = more intense wobble.
- **`smoothen`** ¡X Curve smoothing (0-1). Higher = smoother curves.
- **`widthVariance`** ¡X Stroke width variation (0-1). How much the path width varies; 0 = uniform, 1 = maximum variation.

### Example

```javascript
import { generateWobblePath, roundedRectPoints } from 'wobble-svg';

const points = roundedRectPoints(200, 100, 10);
const path = generateWobblePath(points, {
  seed: 123,
  frequency: 0.05,
  wiggle: 1,
  smoothen: 0.5,
  widthVariance: 0.5
});
```

---

## `generateWobbleRibbon()`

Generate a two-path ribbon (outer and inner boundary) for strokes with visible width.

```typescript
function generateWobbleRibbon(
  boundary: Point[],
  options: RibbonOptions
): { outer: Point[]; inner: Point[] };
```

### Parameters

- **`boundary`** ¡X Polyline to create a ribbon around
- **`options`** ¡X Wobble options plus additional ribbon-specific config

### Returns

Object with `outer` and `inner` point arrays forming the ribbon's boundaries.

### Use Case

For creating stroked lines where the width is visible (e.g., dialogue bubble tails, borders).

---

## `roundedRectPoints()`

Convert a rounded rectangle definition into a point array for `generateWobblePath()`.

```typescript
function roundedRectPoints(
  width: number,
  height: number,
  radius: number
): Point[];
```

### Parameters

- **`width`** ¡X Rectangle width
- **`height`** ¡X Rectangle height
- **`radius`** ¡X Corner radius (applies to all four corners)

### Returns

`Point[]` ¡X Ordered boundary points tracing the rounded rectangle.

### Example

```javascript
const points = roundedRectPoints(200, 100, 15);
// points = [{x: 15, y: 0}, {x: 185, y: 0}, ..., {x: 15, y: 0}]
```

---

## `mulberry32()`

Seeded PRNG (pseudo-random number generator).

```typescript
function mulberry32(seed: number): () => number;
```

### Parameters

- **`seed`** ¡X Integer seed

### Returns

Function that returns random numbers (0-1) deterministically based on the seed.

### Example

```javascript
import { mulberry32 } from 'wobble-svg';

const rng = mulberry32(42);
const rand1 = rng(); // always same value for seed 42
const rand2 = rng(); // next random value for seed 42
```

---

## `toClosedPath()`

Convert an array of points to an SVG path string (closed path).

```typescript
function toClosedPath(points: Point[]): string;
```

### Returns

SVG path `d` attribute value with the path closed (Z command at end).

---

## Types

```typescript
interface Point {
  x: number;
  y: number;
}

interface WobbleOptions {
  seed: number;
  frequency?: number;
  wiggle?: number;
  smoothen?: number;
  widthVariance?: number;
}
```

---

## See Also

- [Examples ¡÷](/examples) ¡X Real-world usage patterns
- [FAQ ¡÷](/faq) ¡X Common questions