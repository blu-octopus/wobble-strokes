import { describe, expect, it } from 'vitest';
import {
  openPolylineBoundary,
  roundedRectBoundary,
  toRibbonPath,
} from './geometry';
import { generateWobblePath, generateWobbleRibbon } from './wobble';

describe('generateWobblePath / generateWobbleRibbon', () => {
  const boundary = roundedRectBoundary(200, 100, 10);

  it('is deterministic for the same seed', () => {
    const a = generateWobblePath(boundary, { seed: 42, halfWidth: 1 });
    const b = generateWobblePath(boundary, { seed: 42, halfWidth: 1 });
    expect(a).toBe(b);
  });

  it('changes when the seed changes', () => {
    const a = generateWobblePath(boundary, { seed: 42, halfWidth: 1 });
    const b = generateWobblePath(boundary, { seed: 43, halfWidth: 1 });
    expect(a).not.toBe(b);
  });

  it('defaults closed to true so README-style calls typecheck and run', () => {
    const ribbon = generateWobbleRibbon(boundary, { halfWidth: 1, seed: 1 });
    expect(ribbon.ribbonPath).toContain(' Z ');
    expect((ribbon.ribbonPath.match(/ Z/g) ?? []).length).toBe(2);
  });

  it('throws when halfWidth is missing or non-finite', () => {
    expect(() => generateWobbleRibbon(boundary, { halfWidth: NaN } as never)).toThrow(
      /halfWidth/,
    );
    expect(() =>
      generateWobbleRibbon(boundary, { halfWidth: undefined as unknown as number }),
    ).toThrow(/halfWidth/);
  });

  it('builds a closed ribbon as two independent subpaths (evenodd annulus)', () => {
    const ribbon = generateWobbleRibbon(boundary, {
      seed: 7,
      halfWidth: 1,
      closed: true,
    });
    expect(ribbon.ribbonPath).toBe(toRibbonPath(ribbon.outer, ribbon.inner, true));
    expect((ribbon.ribbonPath.match(/\bM\b/g) ?? []).length).toBe(2);
    expect((ribbon.ribbonPath.match(/ Z/g) ?? []).length).toBe(2);
    expect(ribbon.fillPath.endsWith(' Z')).toBe(true);
  });

  it('builds an open ribbon as a single capped loop', () => {
    const open = openPolylineBoundary([
      { x: 0, y: 0 },
      { x: 40, y: 80 },
      { x: 90, y: 10 },
    ]);
    const ribbon = generateWobbleRibbon(open, {
      seed: 9,
      halfWidth: 0.75,
      closed: false,
    });
    expect(ribbon.ribbonPath).toBe(toRibbonPath(ribbon.outer, ribbon.inner, false));
    expect((ribbon.ribbonPath.match(/\bM\b/g) ?? []).length).toBe(1);
    expect((ribbon.ribbonPath.match(/ Z/g) ?? []).length).toBe(1);
    expect(ribbon.fillPath.includes(' Z')).toBe(false);
  });

  it('floors ribbon half-width at 0.4px', () => {
    const ribbon = generateWobbleRibbon(boundary, {
      seed: 1,
      halfWidth: 0.1,
      widthVariance: 0,
      wiggle: 0,
      smoothen: 0,
      closed: true,
    });
    // With zero variance/wiggle, outer-inner distance along a normal ? 2 * width.
    const dx = ribbon.outer[0].x - ribbon.inner[0].x;
    const dy = ribbon.outer[0].y - ribbon.inner[0].y;
    const separation = Math.hypot(dx, dy);
    expect(separation).toBeCloseTo(0.8, 5);
  });
});

describe('openPolylineBoundary', () => {
  it('densifies sparse control points along edges', () => {
    const samples = openPolylineBoundary([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    // Two 100px edges at ~4px step ¡÷ well over 3 vertices.
    expect(samples.length).toBeGreaterThan(3);
    expect(samples[0]).toMatchObject({ x: 0, y: 0, t: 0 });
    expect(samples[samples.length - 1]).toMatchObject({ x: 100, y: 100 });
    expect(samples.every((s) => Number.isFinite(s.nx) && Number.isFinite(s.ny))).toBe(true);
  });
});
