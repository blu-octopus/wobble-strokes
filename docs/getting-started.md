# Getting started

Six primitives for hand-drawn SVG ribbons. Most projects only ever need `roundedRectBoundary` and `generateWobbleRibbon`. The rest is here when you want open tails, fonts, or dialogue bubbles.

## Install

Install wobble-svg, then import it wherever your interface runs.

::: code-group

```bash [npm]
npm install wobble-svg
```

```bash [pnpm]
pnpm add wobble-svg
```

```bash [yarn]
yarn add wobble-svg
```

:::

ESM + CJS builds, zero runtime dependencies, and safe to use on web or React Native (path data only �X no DOM APIs).

## Quick start

Sample a shape boundary, generate a ribbon, fill both paths with `evenodd`.

::: code-group

```js [app.js]
import {
  roundedRectBoundary,
  generateWobbleRibbon,
} from 'wobble-svg';

const boundary = roundedRectBoundary(200, 80, 16);
const ribbon = generateWobbleRibbon(boundary, {
  seed: 42,
  halfWidth: 1.2,
  frequency: 0.05,
  wiggle: 1.2,
  closed: true,
});

// <path d={ribbon.fillPath} fill="white" />
// <path d={ribbon.ribbonPath} fill="#2b2420" fill-rule="evenodd" />
```

```html [index.html]
<svg viewBox="0 0 200 80" width="200" height="80">
  <path id="fill" fill="#fffdf8" />
  <path id="stroke" fill="#2b2420" fill-rule="evenodd" />
</svg>
```

:::

## Concepts

### Why fill, not stroke?

Native SVG `stroke-width` is constant along a path. Wobble builds the **outer and inner edges of a band**, then fills the ring (`fill-rule="evenodd"`). That is what unlocks true variable width.

`generateWobbleRibbon()` returns:

- `ribbonPath` �X the stroke band (use with evenodd)
- `fillPath` �X the outer silhouette (paper fill, masks, solid shapes)

### Deterministic seeds

Same `seed` �� same path. Use it for design systems, tests, and reproducible generative UI.

```js
const a = generateWobbleRibbon(boundary, { seed: 42, halfWidth: 1, closed: true });
const b = generateWobbleRibbon(boundary, { seed: 42, halfWidth: 1, closed: true });
// a.ribbonPath === b.ribbonPath
```

### Boundaries, not raw points

Start from a boundary helper (`roundedRectBoundary`, `openPolylineBoundary`, or a dialogue-bubble splice), then one ribbon pass. See [API](/api) and [Examples](/examples).


::: tip Animate seeds
Use `animateWobbleRibbon` (or `seed` + `seedTo` + `mix`) to morph smoothly between patterns — see [API](/api#animatewobbleribbon).
:::

## Next

- Live studio on the [landing page](https://blu-octopus.github.io/wobble-strokes/)
- Full surface area in [API reference](/api)
- Production patterns in [Examples](/examples)
