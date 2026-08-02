# Wobble

Variable-width hand-drawn SVG path generator for web and React Native.

<div style="display: flex; gap: 16px; margin: 32px 0; align-items: center; flex-wrap: wrap;">
  <a href="https://www.npmjs.com/package/wobble-svg" style="display: inline-block;">
    <img src="https://img.shields.io/npm/v/wobble-svg" alt="npm" />
  </a>
  <a href="https://github.com/your-username/wobble" style="display: inline-block;">
    <img src="https://img.shields.io/github/license/your-username/wobble" alt="license" />
  </a>
</div>

## What is Wobble?

Wobble generates pure SVG path data that renders hand-drawn, organically-wobbly outlines with **true variable-width strokes**. Unlike Rough.js, Wobble supports varying stroke widths along a path. Unlike native SVG filters, Wobble generates portable paths that work everywhere: web, React Native, Canvas, or print.

**Key features:**
- ? **Variable-width strokes** ¡X procedurally generated, no filters
- ? **Deterministic** ¡X seeded PRNG for reproducible output
- ? **Zero dependencies** ¡X ~4KB gzipped
- ? **Framework-agnostic** ¡X web, React Native, anywhere SVG paths render
- ? **Fast** ¡X generates paths at render time

## Quick Example

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

## Wobble vs. Alternatives

<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; margin: 32px 0;">
  <!-- Background -->
  <rect width="800" height="400" fill="#fafafa" rx="8" />
  
  <!-- Wobble circle -->
  <circle cx="280" cy="200" r="120" fill="#c2a783" opacity="0.2" stroke="#c2a783" stroke-width="2" />
  
  <!-- Rough.js circle -->
  <circle cx="520" cy="200" r="120" fill="#8B4513" opacity="0.2" stroke="#8B4513" stroke-width="2" />
  
  <!-- Native SVG circle -->
  <circle cx="400" cy="200" r="120" fill="#4169E1" opacity="0.2" stroke="#4169E1" stroke-width="2" />
  
  <!-- Labels -->
  <text x="180" y="120" font-size="14" font-weight="600" fill="#333">Wobble</text>
  <text x="340" y="390" font-size="12" font-weight="600" fill="#c2a783">Variable-width</text>
  <text x="335" y="406" font-size="12" font-weight="600" fill="#c2a783">Deterministic</text>
  <text x="355" y="422" font-size="12" font-weight="600" fill="#c2a783">Zero deps</text>
  
  <text x="460" y="120" font-size="14" font-weight="600" fill="#333">Rough.js</text>
  <text x="440" y="390" font-size="12" font-weight="600" fill="#8B4513">Sketchy styles</text>
  <text x="420" y="406" font-size="12" font-weight="600" fill="#8B4513">Large community</text>
  
  <text x="330" y="120" font-size="14" font-weight="600" fill="#333">Native SVG</text>
  <text x="300" y="340" font-size="12" font-weight="600" fill="#4169E1">Filters</text>
  <text x="310" y="356" font-size="12" font-weight="600" fill="#4169E1">Animations</text>
  <text x="295" y="372" font-size="12" font-weight="600" fill="#4169E1">Browser-native</text>
  
  <!-- Center (all three overlap) -->
  <text x="390" y="185" font-size="11" text-anchor="middle" fill="#333">Deterministic</text>
  <text x="390" y="200" font-size="11" text-anchor="middle" fill="#333">Zero deps</text>
  <text x="390" y="215" font-size="11" text-anchor="middle" fill="#333">SVG paths</text>
  
  <!-- Between Wobble & Rough.js -->
  <text x="400" y="280" font-size="10" text-anchor="middle" fill="#666">Seeded</text>
  
  <!-- Between Wobble & Native SVG -->
  <text x="330" y="280" font-size="10" text-anchor="middle" fill="#666">Portable</text>
  
  <!-- Title -->
  <text x="400" y="30" font-size="16" font-weight="700" text-anchor="middle" fill="#333">Wobble vs Alternatives</text>
</svg>

**Wobble can:** Variable-width strokes, deterministic (seeded), zero deps, web + React Native support

**Wobble can't:** Complex sketchy aesthetics (Rough.js' specialty), frame-by-frame animated generation

## Get Started

[¡÷ Installation & Quick Start](/getting-started)

---

**Built with ?? for design systems, creative coders, and procedural art enthusiasts.**