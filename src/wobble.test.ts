import { describe, expect, it } from 'vitest';
import {
  openPolylineBoundary,
  roundedRectBoundary,
  toRibbonPath,
} from './geometry';
import {
  animateWobbleRibbon,
  generateWobblePath,
  generateWobbleRibbon,
  resolveSeedCycle,
  smoothstep,
} from './wobble';

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
    const dx = ribbon.outer[0].x - ribbon.inner[0].x;
    const dy = ribbon.outer[0].y - ribbon.inner[0].y;
    const separation = Math.hypot(dx, dy);
    expect(separation).toBeCloseTo(0.8, 5);
  });

  it('mix=0 matches seed-only and mix=1 matches seedTo-only', () => {
    const from = generateWobbleRibbon(boundary, { seed: 2, halfWidth: 1.2, closed: true });
    const to = generateWobbleRibbon(boundary, { seed: 13, halfWidth: 1.2, closed: true });
    const at0 = generateWobbleRibbon(boundary, {
      seed: 2,
      seedTo: 13,
      mix: 0,
      halfWidth: 1.2,
      closed: true,
    });
    const at1 = generateWobbleRibbon(boundary, {
      seed: 2,
      seedTo: 13,
      mix: 1,
      halfWidth: 1.2,
      closed: true,
    });
    expect(at0.ribbonPath).toBe(from.ribbonPath);
    expect(at1.ribbonPath).toBe(to.ribbonPath);
  });

  it('mid mix sits between two seeds (not equal to either endpoint)', () => {
    const from = generateWobblePath(boundary, { seed: 2, halfWidth: 1 });
    const to = generateWobblePath(boundary, { seed: 13, halfWidth: 1 });
    const mid = generateWobblePath(boundary, { seed: 2, seedTo: 13, mix: 0.5, halfWidth: 1 });
    expect(mid).not.toBe(from);
    expect(mid).not.toBe(to);
  });
});

describe('animateWobbleRibbon / resolveSeedCycle', () => {
  const boundary = roundedRectBoundary(120, 60, 12);
  const seeds = [2, 13, 25, 39];

  it('resolveSeedCycle wraps and reports adjacent seeds', () => {
    expect(resolveSeedCycle(0, seeds, (t) => t)).toMatchObject({
      index: 0,
      nextIndex: 1,
      seed: 2,
      seedTo: 13,
      mix: 0,
    });
    expect(resolveSeedCycle(1.25, seeds, (t) => t)).toMatchObject({
      index: 1,
      nextIndex: 2,
      seed: 13,
      seedTo: 25,
      mix: 0.25,
    });
    expect(resolveSeedCycle(3.9, seeds, (t) => t).nextIndex).toBe(0);
  });

  it('smoothstep eases midpoints toward the ends', () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBe(0.5);
    expect(smoothstep(0.25)).toBeLessThan(0.25);
    expect(smoothstep(0.75)).toBeGreaterThan(0.75);
  });

  it('animateWobbleRibbon at integer progress matches a plain seed', () => {
    const plain = generateWobbleRibbon(boundary, { seed: 13, halfWidth: 1, closed: true });
    const animated = animateWobbleRibbon(boundary, {
      halfWidth: 1,
      closed: true,
      seeds,
      progress: 1,
      ease: (t) => t,
    });
    expect(animated.ribbonPath).toBe(plain.ribbonPath);
  });

  it('throws without finite progress', () => {
    expect(() =>
      animateWobbleRibbon(boundary, { halfWidth: 1, progress: Number.NaN }),
    ).toThrow(/progress/);
  });
});

describe('openPolylineBoundary', () => {
  it('densifies sparse control points along edges', () => {
    const samples = openPolylineBoundary([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(samples.length).toBeGreaterThan(3);
    expect(samples[0]).toMatchObject({ x: 0, y: 0, t: 0 });
    expect(samples[samples.length - 1]).toMatchObject({ x: 100, y: 100 });
    expect(samples.every((s) => Number.isFinite(s.nx) && Number.isFinite(s.ny))).toBe(true);
  });
});
