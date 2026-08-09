# Roadmap

Wobble's development roadmap for the coming months. Dates are estimates and subject to change based on community feedback.

## v0.1 (Current)

**Released:** Q4 2025

- Core path generation (`generateWobblePath`, `generateWobbleRibbon`)
- Boundary helpers (`roundedRectBoundary`, `openPolylineBoundary`)
- Seeded, dependency-free PRNG (`mulberry32`) and continuous noise (`smoothNoise1D`)
- True variable-width ribbons (`widthVariance`), not just position jitter
- Full TypeScript support
- VitePress documentation site
- npm publishing

## v0.2 (Q4 2025 - Q1 2026)

**Goal:** Performance optimization and refinement

- **WASM build** — faster path generation for large-scale use (hundreds to thousands of shapes)
- **Precomputed lookups** — LUT-based noise for faster execution
- **Performance benchmarks** — publish baseline metrics and comparisons with alternatives
- **More boundary helpers** — stars, arbitrary polygons, circles
- **Bug fixes & refinements** based on community feedback

## v0.3 (Q1 - Q2 2026)

**Goal:** Extended capabilities and interoperability

- **Text path distortion** (experimental) — distort rendered text to follow a wobbly path
- **SVG filter export** — optionally export as SVG filters, for comparison/interop with filter-based approaches
- **Canvas rendering examples** — native Canvas 2D integration patterns
- **Splice-notch helper** — first-class utility for the boundary-splicing pattern currently shown as a hand-rolled example (see [Examples](/examples#splicing-a-notch-into-a-boundary))

## v1.0 (Q2 2026)

**Goal:** Production stability

- **Stable API guarantee** — no breaking changes after v1.0
- **Comprehensive test suite** — high coverage across boundary/wobble/geometry modules
- **Native bindings** (optional) — C/WASM bindings for specialized use cases
- **Extended documentation** — guides, tutorials, design-system case studies

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
- **Examples & tutorials** — guides for specific use cases
- **Performance optimization** — profile and improve path generation
- **Testing** — expand test coverage, edge-case discovery
- **Documentation** — API docs, design-system integration guides
- **Bindings** — WASM, native compiled versions

---

**Last updated:** Q4 2025
