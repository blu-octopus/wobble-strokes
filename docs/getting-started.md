# Getting Started

## Installation

Install Wobble from npm:

```bash
npm install wobble-svg
```

## Quick Example

Generate a wobbly rounded rectangle:

```javascript
import { generateWobblePath, roundedRectPoints } from 'wobble-svg';

// 1. Create boundary points for a rounded rectangle
const points = roundedRectPoints(
  width = 200,     // width
  height = 100,    // height
  radius = 10      // corner radius
);

// 2. Generate the wobbly path
const pathData = generateWobblePath(points, {
  seed: 42,                // reproducible wobble
  frequency: 0.05,         // how often wobble changes
  wiggle: 1,               // intensity of wobble
  smoothen: 0.5,           // curve smoothing
  widthVariance: 0.5       // width variation (0-1)
});

// 3. Render in SVG
const svg = `
  <svg viewBox="0 0 200 100" width="200" height="100">
    <path 
      d="${pathData}" 
      fill="none" 
      stroke="#333" 
      stroke-width="2" 
    />
  </svg>
`;

console.log(svg);
```

Result: A hand-drawn, variable-width rectangular border with organic wobble.

## Core Concepts

### Deterministic Output

The `seed` parameter ensures the same input always produces the same wobble. Perfect for:
- Design systems (consistent component rendering)
- Testing (predictable SVG output)
- Reproducible art (same seed = same result)

```javascript
// These always produce identical paths
const path1 = generateWobblePath(points, { seed: 42, ... });
const path2 = generateWobblePath(points, { seed: 42, ... });
// path1 === path2 ?
```

### Variable-Width Strokes

Unlike Rough.js (constant width) or native SVG (filters), Wobble generates paths where the stroke width varies along the line. This creates a refined, hand-drawn feel.

The `widthVariance` parameter (0-1) controls how much width varies:
- `0`: uniform width (like constant stroke-width)
- `0.5`: moderate variation (balanced look)
- `1.0`: maximum variation (organic, flowing)

### Options Reference

```typescript
interface WobbleOptions {
  seed: number;           // Seed for reproducible randomness
  frequency?: number;     // How often wobble oscillates (0-1, default 0.05)
  wiggle?: number;        // Amplitude of wobble (default 1)
  smoothen?: number;      // Curve smoothing factor (0-1, default 0.5)
  widthVariance?: number; // Stroke width variation (0-1, default 0.5)
}
```

## Next Steps

- **[Examples ¡÷](/examples)** ¡X See more use cases and patterns
- **[API Reference ¡÷](/api)** ¡X Full function documentation
- **[FAQ ¡÷](/faq)** ¡X Common questions answered