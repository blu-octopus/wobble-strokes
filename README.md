# Wobble

Variable-width hand-drawn SVG path generator for web and React Native. Deterministic, dependency-free, and tuned to procedural design systems.

[![npm](https://img.shields.io/npm/v/wobble-svg)](https://www.npmjs.com/package/wobble-svg)
[![license](https://img.shields.io/github/license/blu-octopus/wobble-strokes)](LICENSE)

## What is Wobble?

Wobble generates pure SVG path data (`d` attribute strings) that render hand-drawn, organically-wobbly outlines with **true variable-width strokes**. Unlike Rough.js, Wobble supports varying stroke widths along a path — like Figma's Dynamic Stroke. Unlike native SVG filters, Wobble generates portable paths that work everywhere: web `<path>` elements, React Native `<Path>`, Canvas, or print.

**Key features:**
- ✨ Variable-width strokes (procedurally generated, no filters)
- 🎯 Deterministic output via seeded PRNG
- 📦 Zero dependencies, ~4KB gzipped
- 🌐 Framework-agnostic: web, React Native, anywhere SVG paths render
- ⚡ Fast: generates paths at render time, no precomputation needed

## Installation

```bash
npm install wobble-svg
```

## Quick Start

```javascript
import { generateWobblePath, roundedRectPoints } from 'wobble-svg';

// Generate a wobbly rounded rectangle
const points = roundedRectPoints(200, 100, 10);
const pathData = generateWobblePath(points, {
  seed: 42,
  frequency: 0.05,
  wiggle: 1,
  smoothen: 0.5,
  widthVariance: 0.5
});

// Render in SVG
const svg = `<svg viewBox="0 0 200 100">
  <path d="${pathData}" fill="none" stroke="#333" stroke-width="2" />
</svg>`;
```

## Documentation

Full docs, API reference, and examples: **[wobble-svg.vercel.app](https://wobble-svg.vercel.app)**

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

## Quick Links

- 📚 [Full Documentation](https://wobble-svg.vercel.app)
- 🐙 [GitHub](https://github.com/blu-octopus/wobble-strokes)
- 📦 [npm Package](https://www.npmjs.com/package/wobble-svg)
