# Roadmap

Wobble's development roadmap for the coming months. Dates are estimates and subject to change based on community feedback.

## v0.1

**Released:** Q3 2026 (`0.1.0`)

- Core path generation (`generateWobblePath`, `generateWobbleRibbon`)
- Seed animation (`animateWobbleRibbon`, `seedTo`/`mix` blends)
- Boundary helpers (`roundedRectBoundary`, `openPolylineBoundary`)
- Seeded, dependency-free PRNG (`mulberry32`) and continuous noise (`smoothNoise1D`)
- True variable-width ribbons (`widthVariance`), not just position jitter
- Full TypeScript support
- VitePress documentation site
- npm publishing

## v0.2 (Current)

**Released:** Q3 2026 (`0.2.0`)

Shipped as the current npm package:

- Seed-morph animation API (`animateWobbleRibbon`, `seed`/`seedTo`/`mix`)
- Landing page live studio + GitHub Pages deploy
- Docs and FAQ updates for fill-vs-stroke and RN portability

Remaining goals for the 0.2 line:

- **WASM build** ¡X faster path generation for large-scale use (hundreds to thousands of shapes)
- **Precomputed lookups** ¡X LUT-based noise for faster execution
- **Performance benchmarks** ¡X publish baseline metrics and comparisons with alternatives
- **More boundary helpers** ¡X stars, arbitrary polygons, circles
- **Bug fixes & refinements** based on community feedback

## v0.3 (Q4 2026 - Q1 2027)

**Goal:** Extended capabilities and interoperability

- **Text path distortion** (experimental) ¡X distort rendered text to follow a wobbly path
- **SVG filter export** ¡X optionally export as SVG filters, for comparison/interop with filter-based approaches
- **Canvas rendering examples** ¡X native Canvas 2D integration patterns
- **Splice-notch helper** ¡X first-class utility for the boundary-splicing pattern currently shown as a hand-rolled example (see [Examples](/examples#splicing-a-notch-into-a-boundary))

## v1.0 (Q2 2027)

**Goal:** Production stability

- **Stable API guarantee** ¡X no breaking changes after v1.0
- **Comprehensive test suite** ¡X high coverage across boundary/wobble/geometry modules
- **Native bindings** (optional) ¡X C/WASM bindings for specialized use cases
- **Extended documentation** ¡X guides, tutorials, design-system case studies

---

## Community Requests

This roadmap is driven by community interest. If you'd like to see a feature prioritized:

1. **Open an issue** on [GitHub](https://github.com/blu-octopus/wobble-strokes/issues) with your use case
2. **React** to existing feature requests to help them bubble up
3. **Discuss** in [GitHub Discussions](https://github.com/blu-octopus/wobble-strokes/discussions)

---

## Contributing

Contributions welcome! See [GitHub](https://github.com/blu-octopus/wobble-strokes) for guidelines and the current issue backlog.

Areas looking for help:
- **Examples & tutorials** ¡X guides for specific use cases
- **Performance optimization** ¡X profile and improve path generation
- **Testing** ¡X expand test coverage, edge-case discovery
- **Documentation** ¡X API docs, design-system integration guides
- **Bindings** ¡X WASM, native compiled versions

---

**Last updated:** Q3 2026
