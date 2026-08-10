# Frequently Asked Questions

## Why Wobble?

### Why not just use Rough.js?

Rough.js is excellent for sketchy, hand-drawn aesthetics. However:

- **Variable-width strokes**: Rough.js uses a constant stroke width. Wobble generates the outer and inner edges of a band as two separate boundaries, so width can vary along the path — like Figma's Dynamic Stroke feature.
- **Purpose**: Rough.js aims for a "sketchy whiteboard" style (drawing each line twice with independent jitter). Wobble targets refined, organic, hand-drawn borders for design systems.
- **Portability**: Rough.js relies on browser canvas/SVG APIs. Wobble is pure math over `{x, y}` samples — no DOM, no browser APIs — so it runs identically under React Native's JS engine.

**When to use Rough.js**: you want sketchy, expressive aesthetics with lots of detail randomization.

**When to use Wobble**: you need variable-width strokes, deterministic output, or React Native support.

### Why not use native SVG filters?

SVG filters (`feTurbulence`, `feDisplacementMap`) create hand-drawn effects on the browser. However:

- **`react-native-svg` doesn't support these filters** — it only implements a limited subset (FeBlend, FeComposite, FeColorMatrix, FeDropShadow, FeFlood, FeGaussianBlur, FeMerge, FeOffset).
- **Not portable** to Canvas, PDFs, or other rendering targets.
- **Wobble generates pure path data** (`d` attribute strings) that renders identically everywhere a path can be drawn.

---

## Technical Questions

### How is Wobble deterministic?

Wobble uses a seeded pseudo-random number generator (`mulberry32`), and every noise sample is a pure function of `(seed, arc-length position)`. Same `seed` + same boundary + same options → same output, every time.

```javascript
const path1 = generateWobblePath(boundary, { seed: 42, halfWidth: 1 });
const path2 = generateWobblePath(boundary, { seed: 42, halfWidth: 1 });
// path1 === path2
```

This is what makes it safe to use in a design system: every instance of a component renders with the exact same "hand".

### Why does the output need `fill`, not `stroke`?

A wobble ribbon isn't a stroked centerline — it's built from two separate boundaries (outer and inner edges of the band), filled as a ring. That's the only way to get true variable width: a native `stroke-width` is a single constant along the whole path, so it physically can't get thicker in the middle and thinner at the ends. See [Getting Started](/getting-started#why-fill-not-stroke).

### Can I animate the generated paths?

Yes, as a static shape — the returned path data works with standard SVG transforms and animations (rotate, scale, opacity, etc.):

```html
<svg viewBox="0 0 200 100">
  <path d="{generatedPath}" fill="#333" fill-rule="evenodd"
    style="animation: spin 3s linear infinite" />
  <style>
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  </style>
</svg>
```

**Animating the wobble pattern:** use `animateWobbleRibbon` (or `seed` + `seedTo` + `mix` on `generateWobbleRibbon`) to morph smoothly between seeds — the same approach as the landing-page logo hover. Drive `progress` from `requestAnimationFrame` or any RN clock; see [API](/api#animatewobbleribbon).

### Does this work with React Native?

Yes. Wobble generates plain SVG path data with zero DOM dependency. `react-native-svg`'s `<Path>` component accepts the exact same `d` string a browser `<path>` does:

```jsx
import { roundedRectBoundary, generateWobblePath } from 'wobble-svg';
import { Svg, Path } from 'react-native-svg';

const boundary = roundedRectBoundary(200, 100, 10);
const pathData = generateWobblePath(boundary, { seed: 42, halfWidth: 1 });

export default function MyComponent() {
  return (
    <Svg viewBox="0 0 200 100">
      <Path d={pathData} fill="#333" fillRule="evenodd" />
    </Svg>
  );
}
```

### Performance: can I generate 1000+ paths efficiently?

Wobble generates paths at call time in milliseconds — generating a few hundred boundary shapes typically takes well under 100ms on modern hardware.

**Optimization tips:**
- Memoize generated paths (e.g. `useMemo` in React) if the same shape/size/seed renders repeatedly.
- For very large counts (thousands of shapes), consider Canvas rendering instead of one DOM `<path>` per shape.
- A WASM build for large-scale generation is on the [roadmap](/roadmap) for v0.2.

### Can I export paths to other formats (PDF, PNG, etc.)?

Wobble only generates SVG path `d` data. To convert:

1. **Render to SVG**, then use `puppeteer`, `sharp`, or server-side rendering to rasterize to PNG.
2. **Canvas**: draw the path with `Path2D` and export via `canvas.toDataURL()`.
3. **PDF**: libraries like `PDFKit` accept SVG path data directly.

---

## Design & Usage

### What's the difference between `seed`, `frequency`, and `wiggle`?

- **`seed`** (integer) — which deterministic noise sequence to use. Different seeds = different wobble patterns; same seed = identical output.
- **`frequency`** (number, default `0.05`) — how rapidly the wobble oscillates along the boundary's arc-length. Low = slow, organic changes; high = rapid, busier wiggles.
- **`wiggle`** (number, default `1.5`) — amplitude of the *position* jitter, in px (how far the centerline itself moves).
- **`widthVariance`** (0-1, default `0.5`) — how much the *width* varies, independent of position.

### How do I create consistent components in a design system?

Use fixed seeds per component:

```javascript
// Button border — always seed 5
const buttonPath = generateWobblePath(buttonBoundary, { seed: 5, halfWidth: 0.75 });

// Card border — always seed 6
const cardPath = generateWobblePath(cardBoundary, { seed: 6, halfWidth: 0.75 });
```

Or increment seed slightly across repeated instances for controlled variation:

```javascript
buttons.map((_, i) =>
  generateWobblePath(boundary, { seed: 100 + i, halfWidth: 0.75 })
);
```

### My wobble looks too aggressive. How do I make it more subtle?

Reduce these:

1. **`wiggle`** — lower from `1.5` toward `0.5`-`0.8`
2. **`frequency`** — lower from `0.05` toward `0.02`-`0.03`
3. **`widthVariance`** — lower from `0.5` toward `0.2`-`0.3`
4. **`smoothen`** — raise from `0.5` toward `0.7`-`0.8` for smoother curves

```javascript
generateWobblePath(boundary, {
  seed: 42,
  halfWidth: 1,
  frequency: 0.02,
  wiggle: 0.6,
  smoothen: 0.8,
  widthVariance: 0.2
});
```

---

## Contributing & Support

### How can I contribute?

Issues, PRs, and feature requests are welcome on [GitHub](https://github.com/blu-octopus/wobble-strokes). Start with the [Roadmap](/roadmap).

### Is there commercial support?

Wobble is MIT-licensed open source. No formal commercial support, but community discussion on GitHub is active.

### Where can I see the roadmap?

[Roadmap](/roadmap) has planned features for v0.2, v0.3, and v1.0.

---

Still have questions? [Open an issue on GitHub](https://github.com/blu-octopus/wobble-strokes/issues).
