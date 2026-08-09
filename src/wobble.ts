import { smoothNoise1D } from './noise';
import { toClosedPath, toOpenPath, toRibbonPath, type BoundarySample, type Point } from './geometry';

export interface WobbleOptions {
  /** Fixed per instance, not randomized per render — same seed always reproduces the same wobble. */
  seed?: number;
  /** How tightly the wobble oscillates along the boundary's arc-length. */
  frequency?: number;
  /** How far the centerline itself jitters, in px — the position wobble. */
  wiggle?: number;
  /** 0-1 smoothing pass strength; higher softens jitter into gentler curves. */
  smoothen?: number;
  /** Base half-width of the ribbon, in px (roughly stroke-width / 2). */
  halfWidth: number;
  /** How much the width itself varies, as a fraction of halfWidth (0 = constant width). */
  widthVariance?: number;
  /**
   * Whether the input boundary is a closed loop (a rect/pill) or an open run
   * (e.g. a tail's two edges). Required, not inferred — a plain
   * `BoundarySample[]` looks the same either way, so getting this wrong for
   * a hand-built open boundary silently closes it into a loop instead of
   * erroring. Defaults to `true` at runtime for plain-JS callers, but
   * TypeScript callers must state it explicitly.
   */
  closed: boolean;
}

export interface WobbleRibbon {
  /** Outer boundary points after wobble + width, in order. */
  outer: Point[];
  /** Inner boundary points after wobble + width, in order (mirrors outer). */
  inner: Point[];
  /** Path along the outer boundary only — usable as a plain fill silhouette. */
  fillPath: string;
  /** Full ribbon path: outer forward + inner backward, closed — the hand-drawn stroke itself. */
  ribbonPath: string;
}

interface SmoothPoint extends Point {
  nx: number;
  ny: number;
  width: number;
}

/**
 * Convenience wrapper: perturbs a boundary and returns just the ribbon path string.
 * Same as generateWobbleRibbon but returns `ribbonPath` directly for simple use cases.
 *
 * @example
 * const points = roundedRectBoundary(200, 100, 10);
 * const pathData = generateWobblePath(points, { halfWidth: 1.5, seed: 42 });
 */
export function generateWobblePath(boundary: BoundarySample[], options: WobbleOptions): string {
  const ribbon = generateWobbleRibbon(boundary, options);
  return ribbon.ribbonPath;
}

/**
 * Perturbs a sampled boundary into a hand-drawn, variable-width ribbon: a
 * closed fill shape tracing the outer and inner edges of a wobbly band, the
 * same structure Figma's own Dynamic Stroke export uses (not a constant-
 * width stroked line). Pure math — the result is plain point arrays and SVG
 * path strings, so the same call renders identically via a browser `<path>`
 * or React Native's `<Path>`.
 */
export function generateWobbleRibbon(boundary: BoundarySample[], options: WobbleOptions): WobbleRibbon {
  const {
    seed = 1,
    frequency = 0.05,
    wiggle = 1.5,
    smoothen = 0.5,
    halfWidth,
    widthVariance = 0.5,
    closed = true,
  } = options;

  if (!Number.isFinite(halfWidth)) {
    throw new Error('generateWobbleRibbon: options.halfWidth is required and must be a finite number');
  }

  const jitterNoise = smoothNoise1D(seed, frequency);
  const widthNoise = smoothNoise1D(seed + 1013, frequency * 1.7);

  const perturbed: SmoothPoint[] = boundary.map((p) => {
    const jitter = jitterNoise(p.t) * wiggle;
    const width = Math.max(0.4, halfWidth * (1 + widthNoise(p.t) * widthVariance));
    return { x: p.x + p.nx * jitter, y: p.y + p.ny * jitter, nx: p.nx, ny: p.ny, width };
  });

  const smoothed = smoothen > 0 ? smoothPass(perturbed, smoothen, closed) : perturbed;

  const outer = smoothed.map((p) => ({ x: p.x + p.nx * p.width, y: p.y + p.ny * p.width }));
  const inner = smoothed.map((p) => ({ x: p.x - p.nx * p.width, y: p.y - p.ny * p.width }));

  return {
    outer,
    inner,
    fillPath: closed ? toClosedPath(outer) : toOpenPath(outer),
    ribbonPath: toRibbonPath(outer, inner, closed),
  };
}

/** Moving-average smoothing over neighbors, wrapping around for closed boundaries and holding endpoints fixed for open ones. */
function smoothPass(points: SmoothPoint[], strength: number, wrap: boolean): SmoothPoint[] {
  const n = points.length;
  if (n < 3) return points;
  const at = (i: number) => points[((i % n) + n) % n];

  return points.map((p, i) => {
    if (!wrap && (i === 0 || i === n - 1)) return p;
    const prev = wrap ? at(i - 1) : points[Math.max(0, i - 1)];
    const next = wrap ? at(i + 1) : points[Math.min(n - 1, i + 1)];
    const avgX = (prev.x + p.x + next.x) / 3;
    const avgY = (prev.y + p.y + next.y) / 3;
    const avgWidth = (prev.width + p.width + next.width) / 3;
    return {
      x: p.x + (avgX - p.x) * strength,
      y: p.y + (avgY - p.y) * strength,
      width: p.width + (avgWidth - p.width) * strength,
      nx: p.nx,
      ny: p.ny,
    };
  });
}
