// Chrome for the landing page itself: every panel, button, and pill on this
// page is bordered by the real library, not CSS border. Framework-free:
// measure the element, sample a rounded-rect boundary, perturb it, and drop
// the ribbon in as an absolutely-positioned SVG behind the content.
import {
  roundedRectBoundary,
  generateWobbleRibbon,
  resolveSeedCycle,
  segmentNormal,
} from './vendor/wobble-svg.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Asymmetric spark burst - same hand-flicked scatter as capy-ui Sparks. */
const SPARK_PARTICLES = [
  { tx: 20, ty: -9, size: 3.6, delay: 0, color: '#e8b84a' },
  { tx: -21, ty: -11, size: 3, delay: 30, color: '#823D00' },
  { tx: 22, ty: 10, size: 3.2, delay: 15, color: '#c1502e' },
  { tx: -18, ty: 14, size: 2.6, delay: 45, color: '#823D00' },
  { tx: 3, ty: -22, size: 3, delay: 10, color: '#e8b84a' },
  { tx: -4, ty: 21, size: 2.6, delay: 35, color: '#c1502e' },
];

export function spawnSparks(el) {
  const host = document.createElement('span');
  host.className = 'sparks';
  host.setAttribute('aria-hidden', 'true');
  for (const p of SPARK_PARTICLES) {
    const dot = document.createElement('span');
    dot.className = 'spark';
    dot.style.setProperty('--tx', `${p.tx}px`);
    dot.style.setProperty('--ty', `${p.ty}px`);
    dot.style.setProperty('--spark-size', `${p.size}px`);
    dot.style.background = p.color;
    dot.style.animationDelay = `${p.delay}ms`;
    host.appendChild(dot);
  }
  el.appendChild(host);
  window.setTimeout(() => host.remove(), 480);
}

export function attachWobbleBorder(el, initial = {}) {
  const state = {
    radius: 14,
    seed: 1,
    seedTo: undefined,
    mix: 0,
    halfWidth: 1,
    color: 'var(--ink)',
    frequency: 0.05,
    wiggle: 1,
    smoothen: 0.55,
    widthVariance: 0.5,
    fill: null,
    ...initial,
  };

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'wobble-border-svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.style.inset = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.pointerEvents = 'none';
  svg.style.overflow = 'visible';

  const fillPathEl = document.createElementNS(SVG_NS, 'path');
  const strokePathEl = document.createElementNS(SVG_NS, 'path');
  strokePathEl.setAttribute('fill-rule', 'evenodd');
  svg.appendChild(fillPathEl);
  svg.appendChild(strokePathEl);

  const computed = getComputedStyle(el);
  if (computed.position === 'static') el.style.position = 'relative';
  el.insertBefore(svg, el.firstChild);

  function redraw() {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w <= 1 || h <= 1) return;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const inset = state.halfWidth;
    const boundary = roundedRectBoundary(
      Math.max(w - state.halfWidth * 2, 1),
      Math.max(h - state.halfWidth * 2, 1),
      Math.max(state.radius - state.halfWidth, 0),
    ).map((p) => ({ ...p, x: p.x + inset, y: p.y + inset }));

    const ribbonOpts = {
      seed: state.seed,
      halfWidth: state.halfWidth,
      frequency: state.frequency,
      wiggle: state.wiggle,
      smoothen: state.smoothen,
      widthVariance: state.widthVariance,
      closed: true,
    };
    if (state.seedTo !== undefined) {
      ribbonOpts.seedTo = state.seedTo;
      ribbonOpts.mix = state.mix ?? 0;
    }
    const ribbon = generateWobbleRibbon(boundary, ribbonOpts);

    strokePathEl.setAttribute('d', ribbon.ribbonPath);
    strokePathEl.setAttribute('fill', state.color);
    if (state.fill) {
      fillPathEl.setAttribute('d', ribbon.fillPath);
      fillPathEl.setAttribute('fill', state.fill);
    } else {
      fillPathEl.removeAttribute('d');
    }
  }

  redraw();
  const ro = new ResizeObserver(() => redraw());
  ro.observe(el);

  return {
    redraw,
    getSeed: () => state.seed,
    update(patch) {
      Object.assign(state, patch);
      redraw();
    },
    destroy() {
      ro.disconnect();
      svg.remove();
    },
  };
}

export function attachWobbleBorders(selector, initial = {}) {
  return Array.from(document.querySelectorAll(selector)).map((el, i) =>
    attachWobbleBorder(el, { ...initial, seed: (initial.seed ?? 1) + i }),
  );
}

/**
 * Hover: slight scale-up + re-roll wobble seed.
 * Press: scale-down + spark particles.
 */
export function attachInteractiveButton(el, borderHandle, { baseSeed } = {}) {
  el.classList.add('btn-interactive');
  let seed = baseSeed ?? borderHandle.getSeed();
  const homeSeed = seed;

  el.addEventListener('pointerenter', () => {
    seed += 7;
    borderHandle.update({ seed });
  });

  el.addEventListener('pointerleave', () => {
    seed = homeSeed;
    borderHandle.update({ seed: homeSeed });
  });

  el.addEventListener('click', () => {
    spawnSparks(el);
  });

  return borderHandle;
}

/** Smoothly morph border seeds while hovered, restore on leave. */
export function attachHoverSeedCycle(
  el,
  borderHandle,
  { homeSeed, seeds = [homeSeed, homeSeed + 11, homeSeed + 23, homeSeed + 37], intervalMs = 180 } = {},
) {
  let raf = 0;
  let t0 = 0;

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const tick = (now) => {
    const progress = (now - t0) / intervalMs;
    const frame = resolveSeedCycle(progress, seeds);
    borderHandle.update({
      seed: frame.seed,
      seedTo: frame.seedTo,
      mix: frame.mix,
    });
    raf = requestAnimationFrame(tick);
  };

  el.addEventListener('pointerenter', () => {
    stop();
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
  });

  el.addEventListener('pointerleave', () => {
    stop();
    borderHandle.update({ seed: homeSeed, seedTo: undefined, mix: 0 });
  });
}

/** Keep a wobble border morphing seeds forever (live indicators, etc.). */
export function attachContinuousSeedCycle(
  borderHandle,
  { seeds = [1, 12, 24, 36, 1], intervalMs = 180 } = {},
) {
  if (!borderHandle) return () => {};
  let raf = 0;
  const t0 = performance.now();

  const tick = (now) => {
    const progress = (now - t0) / intervalMs;
    const frame = resolveSeedCycle(progress, seeds);
    borderHandle.update({
      seed: frame.seed,
      seedTo: frame.seedTo,
      mix: frame.mix,
    });
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
}

/**
 * Hover: apply SVG displacement filter and cycle turbulence seed
 * so typography visibly wobbles, then restore on leave.
 */
export function attachHoverTextWobble(
  el,
  {
    noiseEl = document.getElementById('wobble-text-noise'),
    displaceEl = document.getElementById('wobble-text-displace'),
    homeSeed = 3,
    seeds = [3, 11, 19, 27, 3],
    intervalMs = 140,
    scale = 2.4,
  } = {},
) {
  if (!el || !noiseEl || !displaceEl) return;
  let timer = null;
  let i = 0;
  const homeScale = Number(displaceEl.getAttribute('scale') || 2.2);

  el.addEventListener('pointerenter', () => {
    el.classList.add('is-wobbling');
    displaceEl.setAttribute('scale', String(scale));
    i = 0;
    noiseEl.setAttribute('seed', String(seeds[0]));
    timer = window.setInterval(() => {
      i = (i + 1) % seeds.length;
      noiseEl.setAttribute('seed', String(seeds[i]));
    }, intervalMs);
  });

  el.addEventListener('pointerleave', () => {
    if (timer) window.clearInterval(timer);
    timer = null;
    el.classList.remove('is-wobbling');
    noiseEl.setAttribute('seed', String(homeSeed));
    displaceEl.setAttribute('scale', String(homeScale));
  });
}

/**
 * Always-on text wobble via a dedicated SVG displacement filter
 * (defaults to #wobble-text-filter-live so hover text stays independent).
 */
export function attachContinuousTextWobble(
  el,
  {
    noiseEl = document.getElementById('wobble-text-noise-live'),
    displaceEl = document.getElementById('wobble-text-displace-live'),
    seeds = [11, 19, 27, 35, 11],
    intervalMs = 150,
    scale = 3.2,
  } = {},
) {
  if (!el || !noiseEl || !displaceEl) return () => {};
  let i = 0;
  displaceEl.setAttribute('scale', String(scale));
  noiseEl.setAttribute('seed', String(seeds[0]));
  const timer = window.setInterval(() => {
    i = (i + 1) % seeds.length;
    noiseEl.setAttribute('seed', String(seeds[i]));
  }, intervalMs);
  return () => window.clearInterval(timer);
}

// --- Dialogue bubble: one continuous boundary with a densified scalene tail ---

const TAIL_HALF_BASE = 11;
const TAIL_APEX_FRACTION = 0.62;
const TAIL_DEPTH = 17;
/** Raise joins slightly into the stroke band so edges meet without a gap. */
const TAIL_LIFT = 3;
const TAIL_STEP = 2;
const BUBBLE_CORNER_RADIUS = 24;

function densifySegment(a, b, stepPx = TAIL_STEP) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(2, Math.round(len / stepPx));
  const out = [];
  for (let s = 1; s < steps; s++) {
    const f = s / steps;
    out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, nx: 0, ny: 0, t: 0 });
  }
  return out;
}

/** Recompute normals from neighbors; flip any that point toward the centroid. */
function remiterOutward(result) {
  const n = result.length;
  let cx = 0;
  let cy = 0;
  for (const p of result) {
    cx += p.x;
    cy += p.y;
  }
  cx /= n;
  cy /= n;

  const next = result.map((curr, i) => {
    const prev = result[(i - 1 + n) % n];
    const following = result[(i + 1) % n];
    const n1 = segmentNormal(prev, curr);
    const n2 = segmentNormal(curr, following);
    let nx = n1.nx + n2.nx;
    let ny = n1.ny + n2.ny;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    if (nx * (curr.x - cx) + ny * (curr.y - cy) < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { ...curr, nx, ny };
  });
  for (let i = 0; i < n; i++) result[i] = next[i];
}

/**
 * Closed bubble boundary with a scalene bottom tail as one continuous sample run.
 * Bottom-edge samples in the notch span are removed (no overlapping bottom stroke).
 *
 * Important: roundedRectBoundary walks the bottom edge right -> left, so the
 * notch must be inserted as right-join -> apex -> left-join to keep winding.
 */
export function buildDialogueBubbleBoundary(width, height, strokeWidth = 1.5) {
  const inset = strokeWidth / 2;
  const half = strokeWidth / 2;
  const innerW = Math.max(width - strokeWidth, 1);
  const innerH = Math.max(height - strokeWidth, 1);
  const radius = Math.min(innerH / 2, BUBBLE_CORNER_RADIUS);
  const body = roundedRectBoundary(innerW, innerH, radius).map((p) => ({
    ...p,
    x: p.x + inset,
    y: p.y + inset,
  }));

  const along = width * 0.5;
  const bottomY = height - half;
  // Lift only within the stroke band (legacy separate-tail overlap fix).
  const lift = Math.min(TAIL_LIFT, half * 0.9);
  const baseY = bottomY - lift;
  const leftX = along - TAIL_HALF_BASE;
  const rightX = along + TAIL_HALF_BASE;
  const apexX = leftX + (rightX - leftX) * TAIL_APEX_FRACTION;
  const apexY = bottomY + TAIL_DEPTH - lift;

  const pointRight = { x: rightX, y: baseY };
  const apex = { x: apexX, y: apexY };
  const pointLeft = { x: leftX, y: baseY };

  // Winding: right -> apex -> left (matches bottom travel direction).
  const notch = [
    { ...pointRight, nx: 0, ny: 0, t: 0 },
    ...densifySegment(pointRight, apex),
    { ...apex, nx: 0, ny: 0, t: 0 },
    ...densifySegment(apex, pointLeft),
    { ...pointLeft, nx: 0, ny: 0, t: 0 },
  ];

  const removeLo = leftX - 0.75;
  const removeHi = rightX + 0.75;

  const result = [];
  let inserted = false;
  for (const sample of body) {
    const onBottom = sample.ny > 0.85 && Math.abs(sample.nx) < 0.5 && sample.y > height * 0.55;
    const inNotch = onBottom && sample.x >= removeLo && sample.x <= removeHi;
    if (inNotch) {
      if (!inserted) {
        result.push(...notch);
        inserted = true;
      }
      continue;
    }
    result.push(sample);
  }

  if (!inserted) {
    const insertAt = Math.max(0, Math.floor(result.length * 0.55));
    result.splice(insertAt, 0, ...notch);
  }

  remiterOutward(result);

  const n = result.length;
  let t = 0;
  result[0] = { ...result[0], t: 0 };
  for (let i = 1; i < n; i++) {
    t += Math.hypot(result[i].x - result[i - 1].x, result[i].y - result[i - 1].y);
    result[i] = { ...result[i], t };
  }
  return result;
}
