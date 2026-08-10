import { smoothNoise1D } from './noise';
import { toClosedPath, toOpenPath, toRibbonPath, type BoundarySample, type Point } from './geometry';

export interface WobbleOptions {
  /** Fixed per instance, not randomized per render ¡X same seed always reproduces the same wobble. */
  seed?: number;
  /**
   * Optional second seed to blend toward. Pair with `mix` (0 = `seed` only, 1 = `seedTo` only).
   * Blending happens in noise space so the ribbon morphs smoothly between patterns.
   */
  seedTo?: number;
  /**
   * Blend factor in [0, 1] between `seed` and `seedTo`. Ignored unless `seedTo` is set.
   * Values outside [0, 1] are clamped.
   */
  mix?: number;
  /** How tightly the wobble oscillates along the boundary's arc-length. */
  frequency?: number;
  /** How far the centerline itself jitters, in px ¡X the position wobble. */
  wiggle?: number;
  /** 0-1 smoothing pass strength; higher softens jitter into gentler curves. */
  smoothen?: number;
  /** Base half-width of the ribbon, in px (roughly stroke-width / 2). */
  halfWidth: number;
  /** How much the width itself varies, as a fraction of halfWidth (0 = constant width). */
  widthVariance?: number;
  /**
   * Whether the input boundary is a closed loop (a rect/pill) or an open run
   * (e.g. a tail's two edges). Not inferred ¡X a plain `BoundarySample[]`
   * looks the same either way, so getting this wrong for a hand-built open
   * boundary silently closes it into a loop instead of erroring.
   * Defaults to `true`. Pass `false` for `openPolylineBoundary` results.
   */
  closed?: boolean;
}

export interface WobbleRibbon {
  /** Outer boundary points after wobble + width, in order. */
  outer: Point[];
  /** Inner boundary points after wobble + width, in order (mirrors outer). */
  inner: Point[];
  /** Path along the outer boundary only ¡X usable as a plain fill silhouette. */
  fillPath: string;
  /** Full ribbon path: outer forward + inner backward, closed ¡X the hand-drawn stroke itself. */
  ribbonPath: string;
}

export interface WobbleAnimateOptions extends Omit<WobbleOptions, 'seedTo' | 'mix'> {
  /**
   * Seeds to cycle through. Defaults to `[seed, seed+11, seed+23, seed+37]`
   * (same cadence as the landing-page wordmark hover).
   */
  seeds?: number[];
  /**
   * Progress through the cycle. Whole part picks the segment between seeds;
   * fractional part is the blend. Pass an ever-increasing value (e.g. `elapsedMs / durationMs`)
   * to loop forever ¡X it wraps with modulo.
   */
  progress: number;
  /** Optional ease applied to each segment's local mix. Defaults to smoothstep. */
  ease?: (t: number) => number;
}

export interface SeedCycleFrame {
  /** Index of the current "from" seed in `seeds`. */
  index: number;
  /** Next seed index (wraps). */
  nextIndex: number;
  /** Local eased mix in [0, 1] between those two seeds. */
  mix: number;
  /** The two seeds being blended. */
  seed: number;
  seedTo: number;
}

interface SmoothPoint extends Point {
  nx: number;
  ny: number;
  width: number;
}

/** Clamp to [0, 1]. */
function clamp01(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t;
}

/** Hermite smoothstep ¡X gentle ease in/out for seed morphs. */
export function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/**
 * Resolve a cycling seed-blend from a continuous progress value.
 * `progress = 2.35` with 4 seeds ¡÷ between seed[2] and seed[3] at mix 0.35.
 */
export function resolveSeedCycle(
  progress: number,
  seeds: number[],
  ease: (t: number) => number = smoothstep,
): SeedCycleFrame {
  if (!seeds.length) {
    throw new Error('resolveSeedCycle: seeds must be a non-empty array');
  }
  if (seeds.length === 1) {
    return { index: 0, nextIndex: 0, mix: 0, seed: seeds[0], seedTo: seeds[0] };
  }
  const n = seeds.length;
  const wrapped = ((progress % n) + n) % n;
  const index = Math.floor(wrapped) % n;
  const nextIndex = (index + 1) % n;
  const mix = ease(wrapped - Math.floor(wrapped));
  return {
    index,
    nextIndex,
    mix,
    seed: seeds[index],
    seedTo: seeds[nextIndex],
  };
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
 * width stroked line). Pure math ¡X the result is plain point arrays and SVG
 * path strings, so the same call renders identically via a browser `<path>`
 * or React Native's `<Path>`.
 *
 * Pass `seedTo` + `mix` to morph smoothly between two seeds (noise-space lerp).
 */
export function generateWobbleRibbon(boundary: BoundarySample[], options: WobbleOptions): WobbleRibbon {
  const {
    seed = 1,
    seedTo,
    mix = 0,
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

  const tMix = seedTo === undefined ? 0 : clamp01(mix);
  const jitterNoiseA = smoothNoise1D(seed, frequency);
  const widthNoiseA = smoothNoise1D(seed + 1013, frequency * 1.7);
  const jitterNoiseB = tMix > 0 ? smoothNoise1D(seedTo as number, frequency) : jitterNoiseA;
  const widthNoiseB = tMix > 0 ? smoothNoise1D((seedTo as number) + 1013, frequency * 1.7) : widthNoiseA;

  const perturbed: SmoothPoint[] = boundary.map((p) => {
    const jitter =
      (jitterNoiseA(p.t) * (1 - tMix) + jitterNoiseB(p.t) * tMix) * wiggle;
    const widthSample = widthNoiseA(p.t) * (1 - tMix) + widthNoiseB(p.t) * tMix;
    // Floor keeps the ribbon from collapsing to a hairline when variance
    // drives width near zero; documented in the API reference.
    const width = Math.max(0.4, halfWidth * (1 + widthSample * widthVariance));
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

/**
 * Animate endpoint: sample a ribbon at a point along a seed cycle.
 * Same idea as the landing-page logo hover ¡X smooth blends between consecutive seeds.
 *
 * @example
 * // Inside requestAnimationFrame / RN animated loop:
 * const ribbon = animateWobbleRibbon(boundary, {
 *   halfWidth: 1.2,
 *   seeds: [2, 13, 25, 39],
 *   progress: performance.now() / 180, // one seed hop every 180ms
 * });
 * path.setAttribute('d', ribbon.ribbonPath);
 */
export function animateWobbleRibbon(
  boundary: BoundarySample[],
  options: WobbleAnimateOptions,
): WobbleRibbon {
  const {
    seed = 1,
    seeds = [seed, seed + 11, seed + 23, seed + 37],
    progress,
    ease = smoothstep,
    ...rest
  } = options;

  if (!Number.isFinite(progress)) {
    throw new Error('animateWobbleRibbon: options.progress is required and must be a finite number');
  }

  const frame = resolveSeedCycle(progress, seeds, ease);
  return generateWobbleRibbon(boundary, {
    ...rest,
    seed: frame.seed,
    seedTo: frame.seedTo,
    mix: frame.mix,
  });
}

/**
 * Optional rAF helper for web (and RN when `requestAnimationFrame` exists).
 * Calls `onFrame` every tick with a freshly blended ribbon. Pure/core path still
 * works without this via `animateWobbleRibbon` + your own clock.
 */
export function startWobbleSeedAnimation(
  boundary: BoundarySample[],
  options: Omit<WobbleAnimateOptions, 'progress'> & {
    /** Milliseconds per seed hop. Default 180 (matches the site wordmark). */
    intervalMs?: number;
    onFrame: (ribbon: WobbleRibbon, frame: SeedCycleFrame & { progress: number }) => void;
  },
): { stop: () => void } {
  const { intervalMs = 180, onFrame, ...animateOpts } = options;

  // Avoid DOM lib dependency ¡X resolve rAF from globalThis when present (browser / RN).
  type RafHost = {
    requestAnimationFrame?: (cb: (time: number) => void) => number;
    cancelAnimationFrame?: (id: number) => void;
    performance?: { now: () => number };
  };
  const host = globalThis as unknown as RafHost;
  const raf = typeof host.requestAnimationFrame === 'function' ? host.requestAnimationFrame.bind(host) : null;
  const caf = typeof host.cancelAnimationFrame === 'function' ? host.cancelAnimationFrame.bind(host) : null;

  if (!raf) {
    throw new Error(
      'startWobbleSeedAnimation: requestAnimationFrame is unavailable; call animateWobbleRibbon with your own clock instead',
    );
  }

  let handle = 0;
  const t0 = typeof host.performance?.now === 'function' ? host.performance.now() : Date.now();

  const tick = (now: number) => {
    const progress = (now - t0) / intervalMs;
    const seeds =
      animateOpts.seeds ??
      (() => {
        const s = animateOpts.seed ?? 1;
        return [s, s + 11, s + 23, s + 37];
      })();
    const frame = resolveSeedCycle(progress, seeds, animateOpts.ease);
    const ribbon = animateWobbleRibbon(boundary, { ...animateOpts, progress });
    onFrame(ribbon, { ...frame, progress });
    handle = raf(tick);
  };

  handle = raf(tick);
  return {
    stop() {
      if (caf) caf(handle);
    },
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
