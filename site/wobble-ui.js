// Chrome for the landing page itself: every panel, button, and pill on this
// page is bordered by the real library, not CSS `border`. This is the same
// "generated overlay" pattern documented in examples.md (WobbleBorder), just
// framework-free - measure the element, sample a rounded-rect boundary,
// perturb it, and drop the resulting ribbon in as an absolutely-positioned
// <svg> behind the element's own content.
import {
  roundedRectBoundary,
  generateWobbleRibbon,
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

    const ribbon = generateWobbleRibbon(boundary, {
      seed: state.seed,
      halfWidth: state.halfWidth,
      frequency: state.frequency,
      wiggle: state.wiggle,
      smoothen: state.smoothen,
      widthVariance: state.widthVariance,
      closed: true,
    });

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
 * Press: scale-down + SVG/CSS spark particles (capy-ui Sparks).
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

/** Wordmark: cycle seeds while hovered, restore on leave. */
export function attachHoverSeedCycle(el, borderHandle, { homeSeed, seeds = [homeSeed, homeSeed + 11, homeSeed + 23, homeSeed + 37], intervalMs = 180 } = {}) {
  let timer = null;
  let i = 0;

  el.addEventListener('pointerenter', () => {
    i = 0;
    timer = window.setInterval(() => {
      i = (i + 1) % seeds.length;
      borderHandle.update({ seed: seeds[i] });
    }, intervalMs);
  });

  el.addEventListener('pointerleave', () => {
    if (timer) window.clearInterval(timer);
    timer = null;
    borderHandle.update({ seed: homeSeed });
  });
}

// --- Dialogue bubble splice (ported from capy-ui DialogueBubble) ---

const TAIL_HALF_BASE = 7.75;
const TAIL_APEX_FRACTION = 0.677;
const TAIL_DEPTH = 19;
/** Pull base vertices into the body so the ribbon meets the bottom stroke without a gap. */
const TAIL_BLEND_IN = 3.5;
const TAIL_STEP = 3;
const BUBBLE_CORNER_RADIUS = 24;

function edgeCenterline(edge, width, height, strokeWidth) {
  const half = strokeWidth / 2;
  switch (edge) {
    case 'bottom':
      return height - half;
    case 'top':
      return half;
    case 'right':
      return width - half;
    case 'left':
      return half;
  }
}

/** Dense samples along a polyline so the ribbon keeps the same weight as the bubble body. */
function densifySegment(a, b, stepPx = TAIL_STEP) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(1, Math.round(len / stepPx));
  const out = [];
  for (let s = 1; s <= steps; s++) {
    const f = s / steps;
    out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, nx: 0, ny: 0, t: 0 });
  }
  return out;
}

/**
 * Build a closed bubble boundary with a scalene tail spliced into the bottom edge.
 * Tail bases sit slightly inside the body and edges are densified so stroke weight
 * matches the rest of the bubble and the join reads continuous.
 */
export function buildDialogueBubbleBoundary(width, height, strokeWidth = 1.5) {
  const inset = strokeWidth / 2;
  const innerW = width - strokeWidth;
  const innerH = height - strokeWidth;
  const radius = Math.min(innerH / 2, BUBBLE_CORNER_RADIUS);
  const base = roundedRectBoundary(innerW, innerH, radius).map((p) => ({
    ...p,
    x: p.x + inset,
    y: p.y + inset,
  }));

  const along = Math.min(Math.max(width * 0.5, BUBBLE_CORNER_RADIUS), width - BUBBLE_CORNER_RADIUS);
  const centerline = edgeCenterline('bottom', width, height, strokeWidth);
  // Lift the whole notch into the bottom stroke band so outer edges meet.
  const lift = TAIL_BLEND_IN;
  const baseY = centerline - lift;
  const aWalk = along - TAIL_HALF_BASE;
  const bWalk = along + TAIL_HALF_BASE;
  const apexWalk = aWalk + (bWalk - aWalk) * TAIL_APEX_FRACTION;
  const apexOutward = centerline + TAIL_DEPTH - lift;

  const pointA = { x: aWalk, y: baseY };
  const apex = { x: apexWalk, y: apexOutward };
  const pointB = { x: bWalk, y: baseY };
  const minWalk = Math.min(aWalk, bWalk);
  const maxWalk = Math.max(aWalk, bWalk);

  // Dense notch: A ¡÷ apex ¡÷ B at the same ~4px spacing as roundedRectBoundary.
  const notch = [
    { ...pointA, nx: 0, ny: 0, t: 0 },
    ...densifySegment(pointA, apex),
    ...densifySegment(apex, pointB),
  ];

  const result = [];
  let inserted = false;
  let insertAt = -1;
  for (const sample of base) {
    const onEdge = sample.nx === 0 && sample.ny === 1;
    if (onEdge && sample.x > minWalk && sample.x < maxWalk) {
      if (!inserted) {
        insertAt = result.length;
        result.push(...notch);
        inserted = true;
      }
      continue;
    }
    result.push(sample);
  }

  if (!inserted) {
    // Fallback: append before the last bottom-edge samples if range missed.
    insertAt = result.length;
    result.push(...notch);
  }

  const n = result.length;
  const start = insertAt;
  const end = insertAt + notch.length;
  for (let i = start; i < end; i++) {
    const prev = result[(i - 1 + n) % n];
    const next = result[(i + 1) % n];
    const n1 = segmentNormal(prev, result[i]);
    const n2 = segmentNormal(result[i], next);
    const nx = n1.nx + n2.nx;
    const ny = n1.ny + n2.ny;
    const len = Math.hypot(nx, ny) || 1;
    result[i] = { ...result[i], nx: nx / len, ny: ny / len };
  }

  // Also remiter the samples immediately before/after the notch so the join is continuous.
  for (const i of [(start - 1 + n) % n, end % n]) {
    const prev = result[(i - 1 + n) % n];
    const next = result[(i + 1) % n];
    const n1 = segmentNormal(prev, result[i]);
    const n2 = segmentNormal(result[i], next);
    const nx = n1.nx + n2.nx;
    const ny = n1.ny + n2.ny;
    const len = Math.hypot(nx, ny) || 1;
    result[i] = { ...result[i], nx: nx / len, ny: ny / len };
  }

  let t = 0;
  result[0] = { ...result[0], t: 0 };
  for (let i = 1; i < n; i++) {
    t += Math.hypot(result[i].x - result[i - 1].x, result[i].y - result[i - 1].y);
    result[i] = { ...result[i], t };
  }
  return result;
}
