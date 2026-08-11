# Wobble

Variable-width hand-drawn SVG path generator for web and React Native. Deterministic, dependency-free, and tuned to procedural design systems.

[![npm](https://img.shields.io/npm/v/wobble-svg)](https://www.npmjs.com/package/wobble-svg)
[![license](https://img.shields.io/github/license/blu-octopus/wobble-strokes)](LICENSE)

**[Live demo & interactive studio →](https://blu-octopus.github.io/wobble-strokes/)**

## What's new in 0.2.0

- Seed morphing via `animateWobbleRibbon` and `seed`/`seedTo`/`mix`
- Polished landing page with live studio, benefits, and agent prompt CTA
- Docs/FAQ updates for fill-vs-stroke and React Native usage


## What is Wobble?

Wobble generates pure SVG path data (`d` attribute strings) that render hand-drawn, organically-wobbly outlines with **true variable-width strokes**. Unlike Rough.js, Wobble supports varying stroke widths along a path — like Figma's Dynamic Stroke. Unlike native SVG filters, Wobble generates portable paths that work everywhere: web `<path>` elements, React Native `<Path>`, Canvas, or print.

**Key features:**
- ✨ Variable-width strokes (procedurally generated, no filters)
- 🎯 Deterministic output via seeded PRNG
- Smooth seed morphs via `animateWobbleRibbon` / `seedTo`+`mix`
- 📦 Zero dependencies, ~4KB gzipped
- 🌐 Framework-agnostic: web, React Native, anywhere SVG paths render
- ⚡ Fast: generates paths at render time, no precomputation needed

## Installation

```bash
npm install wobble-svg
```

## Quick Start

```javascript
import { roundedRectBoundary, generateWobblePath } from 'wobble-svg';

// 1. Sample a rounded rectangle's boundary
const boundary = roundedRectBoundary(200, 100, 10);

// 2. Perturb it into a hand-drawn, variable-width ribbon path
const pathData = generateWobblePath(boundary, {
  seed: 42,
  halfWidth: 1,        // required — roughly desired stroke width / 2
  frequency: 0.05,
  wiggle: 1,
  smoothen: 0.5,
  widthVariance: 0.5
});

// 3. A wobble path is a FILLED band, not a stroked line
const svg = `<svg viewBox="0 0 200 100">
  <path d="${pathData}" fill="#333" fill-rule="evenodd" />
</svg>`;
```

See the [docs]([https://wobble-svg.vercel.app](https://github.com/blu-octopus/wobble-strokes/tree/main/docs)) for why the output is a fill shape rather than a stroked line — that's the trick that makes true variable-width strokes possible.

## Animate seeds

Smoothly morph between patterns (same technique as the landing-page logo hover):

```javascript
import { roundedRectBoundary, animateWobbleRibbon } from 'wobble-svg';

const boundary = roundedRectBoundary(200, 80, 16);

function frame(now) {
  const ribbon = animateWobbleRibbon(boundary, {
    halfWidth: 1.2,
    seeds: [2, 13, 25, 39],
    progress: now / 180,
  });
  path.setAttribute('d', ribbon.ribbonPath);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

Or blend two seeds with `seed` / `seedTo` / `mix` on `generateWobbleRibbon`.

## Documentation

Full docs, API reference, and examples: **[docs](https://github.com/blu-octopus/wobble-strokes/tree/main/docs)**

### Why Wobble?

| Feature | Wobble | Rough.js | Native SVG |
|---------|--------|----------|-----------|
| Variable-width strokes | ✅ | ❌ | ❌ |
| Deterministic (seeded) | ✅ | ✅ | N/A |
| Zero dependencies | ✅ | ✅ | N/A |
| Web + React Native | ✅ | ❌* | ❌** |
| Sketchy aesthetics | ⚠️ | ✅ | N/A |

\* Rough.js uses browser APIs unavailable on RN
\*\* Native SVG filters not supported on `react-native-svg`

## License

MIT — see [LICENSE](LICENSE) for details.

## Contributing

Issues, feature requests, and PRs welcome! See [GitHub](https://github.com/blu-octopus/wobble-strokes) for the repo.

## Credits

The [landing page](https://blu-octopus.github.io/wobble-strokes/)'s interaction sound design runs on [cuelume](https://cuelume.dev/), by [Daniel White](https://www.danielwhite.uk/). Design input from [Kevin Doyle](https://kevdoy.com/opensource.html).

## Quick Links

- 🎨 [Live Demo & Studio](https://blu-octopus.github.io/wobble-strokes/)
- 📚 [Full Documentation](https://github.com/blu-octopus/wobble-strokes/tree/main/docs)
- 🐙 [GitHub](https://github.com/blu-octopus/wobble-strokes)
- 📦 [npm Package](https://www.npmjs.com/package/wobble-svg)
