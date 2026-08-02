# Examples

## Simple Rounded Rectangle

```javascript
import { generateWobblePath, roundedRectPoints } from 'wobble-svg';

const points = roundedRectPoints(200, 100, 10);
const path = generateWobblePath(points, {
  seed: 1,
  frequency: 0.05,
  wiggle: 1,
  smoothen: 0.5,
  widthVariance: 0.5
});

// Render
const svg = `<svg viewBox="0 0 200 100" width="400" height="200">
  <path d="${path}" fill="none" stroke="#333" stroke-width="2"/>
</svg>`;
```

**Result:** A hand-drawn rectangular border with variable-width strokes.

---

## Variable-Width Pill Shape

```javascript
import { generateWobblePath, roundedRectPoints } from 'wobble-svg';

// Pill shape = height/2 radius on all corners
const points = roundedRectPoints(300, 60, 30);

const path = generateWobblePath(points, {
  seed: 42,
  frequency: 0.08,
  wiggle: 1.2,
  smoothen: 0.6,
  widthVariance: 0.8  // More variation
});

const svg = `<svg viewBox="0 0 300 60" width="600" height="120">
  <path d="${path}" fill="none" stroke="#c2a783" stroke-width="3"/>
</svg>`;
```

**Result:** A pill-shaped border with organic, flowing width variation.

---

## Scalene Triangle (Dialogue Tail)

```javascript
import { generateWobblePath } from 'wobble-svg';

// Custom scalene triangle (not symmetric)
const points = [
  { x: 2, y: 0 },
  { x: 7, y: 20 },
  { x: 17.5, y: 0 }
];

const path = generateWobblePath(points, {
  seed: 9,
  frequency: 0.05,
  wiggle: 0.8,
  smoothen: 0.4,
  widthVariance: 0.6
});

const svg = `<svg viewBox="0 0 20 20" width="100" height="100">
  <path d="${path}" fill="#f0e6d2" stroke="#c2a783" stroke-width="1.5"/>
</svg>`;
```

**Result:** An asymmetric triangle with hand-drawn wobble, perfect for dialogue bubbles.

---

## Animated Wobble Circle

```javascript
import { generateWobblePath } from 'wobble-svg';

// Generate circle points
const radius = 50;
const points = [];
for (let i = 0; i < 360; i += 10) {
  const rad = (i * Math.PI) / 180;
  points.push({
    x: 50 + radius * Math.cos(rad),
    y: 50 + radius * Math.sin(rad)
  });
}

const path = generateWobblePath(points, {
  seed: 10,
  frequency: 0.1,
  wiggle: 1,
  smoothen: 0.5,
  widthVariance: 0.4
});

const svg = `<svg viewBox="0 0 100 100" width="200" height="200">
  <path d="${path}" fill="none" stroke="#4169E1" stroke-width="2" 
    style="animation: spin 4s linear infinite"/>
  <style>
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  </style>
</svg>`;
```

**Result:** A wobbled circle that rotates smoothly (SVG animations work perfectly with generated paths).

---

## Multiple Wobbles with Different Seeds

```javascript
import { generateWobblePath, roundedRectPoints } from 'wobble-svg';

const seeds = [1, 42, 99];
const paths = seeds.map((seed, i) => {
  const points = roundedRectPoints(150, 100, 12);
  return generateWobblePath(points, {
    seed,
    frequency: 0.05,
    wiggle: 1,
    smoothen: 0.5,
    widthVariance: 0.6
  });
});

const svg = `<svg viewBox="0 0 500 120" width="500" height="120">
  ${paths.map((path, i) => `
    <g transform="translate(${i * 170}, 0)">
      <path d="${path}" fill="none" stroke="#c2a783" stroke-width="2"/>
    </g>
  `).join('')}
</svg>`;
```

**Result:** Three identical rectangles with three different wobble patterns (different seeds).

---

## Design System Component

```javascript
// React example
import { generateWobblePath, roundedRectPoints } from 'wobble-svg';

export function WobbleButton({ children, ...props }) {
  const points = roundedRectPoints(200, 50, 10);
  const borderPath = generateWobblePath(points, {
    seed: 5,
    frequency: 0.05,
    wiggle: 0.8,
    smoothen: 0.5,
    widthVariance: 0.5
  });

  return (
    <button {...props}>
      <svg className="wobble-border" viewBox="0 0 200 50">
        <path d={borderPath} fill="none" stroke="#c2a783" strokeWidth="2" />
      </svg>
      {children}
    </button>
  );
}
```

Perfect for design systems where every instance should have the same, reproducible wobble.

---

## Tips & Tricks

- **Determinism**: Same seed + same options = same output. Great for testing and design systems.
- **Animation-friendly**: Generated paths work with SVG animations (rotate, scale, etc.).
- **React Native**: Use the same path data with `<Path d={pathData}>` from `react-native-svg`.
- **Seed variation**: Increment seed by 1 for each element in a grid to create subtle variation without randomness.
- **Width variation**: Higher `widthVariance` (0.7+) creates more organic, flowing strokes; lower (0.3-) looks more refined.

---

See [API Reference ¡÷](/api) for all available functions and options.