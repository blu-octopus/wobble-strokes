import {
  roundedRectBoundary,
  openPolylineBoundary,
  generateWobbleRibbon,
  animateWobbleRibbon,
  resolveSeedCycle,
} from './vendor/wobble-svg.mjs';
import {
  attachWobbleBorder,
  attachWobbleBorders,
  attachWobbleDivider,
  attachInteractiveButton,
  attachHoverSeedCycle,
  attachContinuousSeedCycle,
  attachHoverTextWobble,
  attachContinuousTextWobble,
  buildDialogueBubbleBoundary,
  spawnSparks,
} from './wobble-ui.js';
import { bind as bindCueSounds, play as playCue, setVolume as setCueVolume } from './vendor/cuelume/index.js';

const CANVAS_W = 320;
const CANVAS_H = 200;
const ANIMATE_INTERVAL_MS = 220;

const state = {
  shape: 'rect',
  seed: 42,
  frequency: 0.05,
  wiggle: 1.5,
  smoothen: 0.5,
  variance: 0.5,
  strokeWidth: 1.5,
  colorHex: '#2b2420',
  alpha: 1,
  fill: false,
  fontFamily: "'M PLUS Rounded 1c', sans-serif",
  animate: false,
};

function rgbaFrom(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = Number.parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function colorCss() {
  return rgbaFrom(state.colorHex, state.alpha);
}

function boundaryFor(shape) {
  switch (shape) {
    case 'rect': {
      const w = 220,
        h = 120,
        r = 14;
      const ox = (CANVAS_W - w) / 2,
        oy = (CANVAS_H - h) / 2;
      return {
        closed: true,
        label: `rect ${w}x${h}`,
        boundary: roundedRectBoundary(w, h, r).map((p) => ({ ...p, x: p.x + ox, y: p.y + oy })),
      };
    }
    case 'pill': {
      const w = 220,
        h = 64,
        r = 32;
      const ox = (CANVAS_W - w) / 2,
        oy = (CANVAS_H - h) / 2;
      return {
        closed: true,
        label: `pill ${w}x${h}`,
        boundary: roundedRectBoundary(w, h, r).map((p) => ({ ...p, x: p.x + ox, y: p.y + oy })),
      };
    }
    case 'circle': {
      const w = 140,
        h = 140,
        r = 70;
      const ox = (CANVAS_W - w) / 2,
        oy = (CANVAS_H - h) / 2;
      return {
        closed: true,
        label: `circle O${w}`,
        boundary: roundedRectBoundary(w, h, r).map((p) => ({ ...p, x: p.x + ox, y: p.y + oy })),
      };
    }
    case 'tail': {
      const points = [
        { x: 95, y: 40 },
        { x: 150, y: 188 },
        { x: 238, y: 52 },
      ];
      return { closed: false, label: 'triangle tail (open)', boundary: openPolylineBoundary(points) };
    }
    case 'bubble': {
      const w = 200,
        h = 88;
      const ox = (CANVAS_W - w) / 2;
      const oy = 36;
      // Leave room below for the spliced tail (~TAIL_DEPTH + lift).
      const boundary = buildDialogueBubbleBoundary(w, h, state.strokeWidth).map((p) => ({
        ...p,
        x: p.x + ox,
        y: p.y + oy,
      }));
      return { closed: true, label: `dialogue bubble ${w}x${h}`, boundary };
    }
    case 'font':
      return { closed: true, label: `font - ${state.fontFamily.split(',')[0].replace(/'/g, '')}`, boundary: null };
    default:
      throw new Error(`unknown shape: ${shape}`);
  }
}

const canvasSvg = document.getElementById('canvas-svg');
const canvasFill = document.getElementById('canvas-fill');
const canvasStroke = document.getElementById('canvas-stroke');
const canvasLabel = document.getElementById('canvas-label');
const canvasFont = document.getElementById('canvas-font');
const canvasFontText = document.getElementById('canvas-font-text');
const fontNoise = document.getElementById('wobble-text-noise');
const fontDisplace = document.getElementById('wobble-text-displace');
const fontWrap = document.getElementById('ctl-font-wrap');

function setPathControlsVisible(visible) {
  document.querySelectorAll('.path-only').forEach((el) => {
    el.hidden = !visible;
  });
}

function seedCycleFromBase(base) {
  const s = Math.round(base);
  return [s, s + 11, s + 23, s + 37];
}

function ribbonOpts(extra = {}) {
  return {
    seed: state.seed,
    halfWidth: state.strokeWidth / 2,
    frequency: state.frequency,
    wiggle: state.wiggle,
    smoothen: state.smoothen,
    widthVariance: state.variance,
    ...extra,
  };
}

function applyRibbonToCanvas(ribbon, closed, label, displaySeed) {
  const color = colorCss();
  canvasStroke.setAttribute('d', ribbon.ribbonPath);
  canvasStroke.setAttribute('fill', color);

  if (state.shape === 'bubble') {
    canvasFill.setAttribute('d', ribbon.fillPath);
    canvasFill.setAttribute('fill', state.fill ? color : '#fffdf8');
    canvasFill.style.opacity = '1';
  } else if (state.fill && closed) {
    canvasFill.setAttribute('d', ribbon.fillPath);
    canvasFill.setAttribute('fill', color);
    canvasFill.style.opacity = '1';
  } else {
    canvasFill.removeAttribute('d');
  }

  const seedLabel = displaySeed ?? state.seed;
  canvasLabel.textContent = `${label}  |  seed ${seedLabel}`;
}

function renderFontCanvas(animProgress) {
  canvasSvg.style.visibility = 'hidden';
  canvasFont.hidden = false;
  fontWrap.hidden = false;
  setPathControlsVisible(false);

  canvasFontText.style.fontFamily = state.fontFamily;
  canvasFontText.style.color = colorCss();
  fontNoise.setAttribute('baseFrequency', String(Math.max(0.01, state.frequency)));
  fontDisplace.setAttribute('scale', String(Math.max(0.4, state.wiggle * 1.6)));

  if (animProgress !== undefined) {
    const frame = resolveSeedCycle(animProgress, seedCycleFromBase(state.seed));
    fontNoise.setAttribute('seed', String(Math.round(frame.seed)));
    canvasLabel.textContent = `font  |  seed ${frame.seed}->${frame.seedTo}`;
  } else {
    fontNoise.setAttribute('seed', String(Math.round(state.seed)));
    canvasLabel.textContent = `font  |  seed ${state.seed}`;
  }
}

function renderPathCanvas(animProgress) {
  canvasSvg.style.visibility = 'visible';
  canvasFont.hidden = true;
  fontWrap.hidden = true;
  setPathControlsVisible(true);

  const { closed, label, boundary } = boundaryFor(state.shape);
  const opts = ribbonOpts({ closed });

  let ribbon;
  let displaySeed;
  if (animProgress !== undefined) {
    ribbon = animateWobbleRibbon(boundary, {
      ...opts,
      seeds: seedCycleFromBase(state.seed),
      progress: animProgress,
    });
    const frame = resolveSeedCycle(animProgress, seedCycleFromBase(state.seed));
    displaySeed = `${frame.seed}->${frame.seedTo}`;
  } else {
    ribbon = generateWobbleRibbon(boundary, opts);
  }

  applyRibbonToCanvas(ribbon, closed, label, displaySeed);
}

function renderCanvas(animProgress) {
  if (state.shape === 'font') renderFontCanvas(animProgress);
  else renderPathCanvas(animProgress);
}

let animateRaf = 0;
let animateT0 = 0;

function stopSeedAnimation({ freezeSeed = true } = {}) {
  if (animateRaf) cancelAnimationFrame(animateRaf);
  animateRaf = 0;

  if (!freezeSeed) return;

  const elapsed = (performance.now() - animateT0) / ANIMATE_INTERVAL_MS;
  const frame = resolveSeedCycle(elapsed, seedCycleFromBase(state.seed));
  const frozen = Math.round(frame.mix < 0.5 ? frame.seed : frame.seedTo);
  state.seed = frozen;
  const seedInput = document.getElementById('ctl-seed');
  if (seedInput) {
    seedInput.value = String(frozen);
    const readout = document.querySelector('[data-readout-for="ctl-seed"]');
    if (readout) readout.textContent = String(frozen);
  }
}

function tickSeedAnimation(now) {
  if (!state.animate) return;
  const progress = (now - animateT0) / ANIMATE_INTERVAL_MS;
  renderCanvas(progress);
  animateRaf = requestAnimationFrame(tickSeedAnimation);
}

function startSeedAnimation() {
  stopSeedAnimation({ freezeSeed: false });
  animateT0 = performance.now();
  animateRaf = requestAnimationFrame(tickSeedAnimation);
}

function setAnimateEnabled(on) {
  state.animate = on;
  if (on) startSeedAnimation();
  else {
    stopSeedAnimation({ freezeSeed: true });
    renderCanvas();
  }
}

function buildSnippet() {
  if (state.shape === 'font') {
    return `/* Web-only: SVG displacement filter on live text (any font).
   Path-based wobble-svg ribbons need outlines - use this for glyphs. */
const filter = \`
<svg width="0" height="0">
  <filter id="wobble-text" x="-12%" y="-35%" width="124%" height="170%">
    <feTurbulence type="fractalNoise" baseFrequency="${state.frequency}" numOctaves="2" seed="${state.seed}" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="${(state.wiggle * 1.6).toFixed(2)}" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>\`;

el.style.fontFamily = ${JSON.stringify(state.fontFamily)};
el.style.filter = 'url(#wobble-text)';
el.style.color = ${JSON.stringify(colorCss())};`;
  }

  if (state.shape === 'bubble') {
    return `import { roundedRectBoundary, generateWobbleRibbon, segmentNormal } from 'wobble-svg';
// See docs/examples.md - splice a scalene tail into roundedRectBoundary,
// then one generateWobbleRibbon pass for a seamless dialogue bubble.

const ribbon = generateWobbleRibbon(splicedBoundary, {
  seed: ${state.seed},
  halfWidth: ${(state.strokeWidth / 2).toFixed(2)},
  frequency: ${state.frequency},
  wiggle: ${state.wiggle},
  smoothen: ${state.smoothen},
  widthVariance: ${state.variance},
  closed: true,
});
// <path d={ribbon.fillPath} fill="white" />
// <path d={ribbon.ribbonPath} fill="${colorCss()}" fill-rule="evenodd" />`;
  }

  const { closed } = boundaryFor(state.shape);
  const isTail = state.shape === 'tail';
  const importLine = isTail
    ? "import { openPolylineBoundary, generateWobblePath } from 'wobble-svg';"
    : "import { roundedRectBoundary, generateWobblePath } from 'wobble-svg';";
  const boundaryLine = isTail
    ? 'const boundary = openPolylineBoundary(points);'
    : 'const boundary = roundedRectBoundary(width, height, radius);';

  return `${importLine}

${boundaryLine}
const path = generateWobblePath(boundary, {
  seed: ${state.seed},
  halfWidth: ${(state.strokeWidth / 2).toFixed(2)},
  frequency: ${state.frequency},
  wiggle: ${state.wiggle},
  smoothen: ${state.smoothen},
  widthVariance: ${state.variance},
  closed: ${closed},
});`;
}

function bindSlider(id, key, format = (v) => v) {
  const input = document.getElementById(id);
  const readout = document.querySelector(`[data-readout-for="${id}"]`);
  const update = () => {
    const value = Number(input.value);
    state[key] = value;
    if (readout) readout.textContent = format(value);
    // While animating, seed slider retargets the cycle base; other knobs redraw live.
    if (state.animate && key === 'seed') {
      animateT0 = performance.now();
      return;
    }
    if (!state.animate) renderCanvas();
  };
  input.addEventListener('input', update);
  update();
}

bindSlider('ctl-seed', 'seed', (v) => v.toFixed(0));
bindSlider('ctl-frequency', 'frequency', (v) => v.toFixed(3));
bindSlider('ctl-wiggle', 'wiggle', (v) => v.toFixed(2));
bindSlider('ctl-smoothen', 'smoothen', (v) => v.toFixed(2));
bindSlider('ctl-variance', 'variance', (v) => v.toFixed(2));
bindSlider('ctl-strokewidth', 'strokeWidth', (v) => v.toFixed(1));

const alphaInput = document.getElementById('ctl-alpha');
const alphaReadout = document.getElementById('ctl-alpha-readout');
alphaInput.addEventListener('input', () => {
  state.alpha = Number(alphaInput.value);
  alphaReadout.textContent = `${Math.round(state.alpha * 100)}%`;
  if (!state.animate) renderCanvas();
});
alphaReadout.textContent = '100%';

document.getElementById('ctl-color').addEventListener('input', (e) => {
  state.colorHex = e.target.value;
  if (!state.animate) renderCanvas();
});

document.getElementById('ctl-fill').addEventListener('change', (e) => {
  state.fill = e.target.checked;
  if (!state.animate) renderCanvas();
});

document.getElementById('ctl-font').addEventListener('change', (e) => {
  state.fontFamily = e.target.value;
  if (!state.animate) renderCanvas();
});

document.getElementById('ctl-animate').addEventListener('change', (e) => {
  setAnimateEnabled(e.target.checked);
});

document.getElementById('ctl-randomize').addEventListener('click', () => {
  const seedInput = document.getElementById('ctl-seed');
  const next = Math.floor(Math.random() * Number(seedInput.max));
  seedInput.value = String(next);
  seedInput.dispatchEvent(new Event('input'));
  spawnSparks(document.getElementById('ctl-randomize'));
});

document.querySelectorAll('.shape-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.shape-item').forEach((el) => el.classList.remove('active'));
    item.classList.add('active');
    state.shape = item.dataset.shape;
    syncShapeChipBorders();
    // Bubbles look best denser - nudge frequency when switching in.
    if (state.shape === 'bubble') {
      if (state.frequency < 0.12) {
        const freq = document.getElementById('ctl-frequency');
        freq.value = '0.18';
        freq.dispatchEvent(new Event('input'));
      }
      const colorInput = document.getElementById('ctl-color');
      if (colorInput.value === '#2b2420') {
        colorInput.value = '#823d00';
        state.colorHex = '#823d00';
      }
      state.fill = false;
      document.getElementById('ctl-fill').checked = false;
    }
    renderCanvas();
  });
});

const copyBtn = document.getElementById('ctl-copy');
copyBtn.addEventListener('click', async () => {
  const snippet = buildSnippet();
  const label = copyBtn.querySelector('.btn-label');
  try {
    await navigator.clipboard.writeText(snippet);
    const original = label.textContent;
    label.textContent = 'Copied!';
    playCue('success');
    setTimeout(() => (label.textContent = original), 1400);
  } catch {
    console.warn('Clipboard write failed; snippet:\n' + snippet);
    playCue('error');
  }
});

async function copyInstall(btn) {
  try {
    await navigator.clipboard.writeText('npm install wobble-svg');
    btn.classList.add('is-copied');
    const code = btn.querySelector('.copy-prompt-code');
    const original = code?.innerHTML;
    if (code) code.textContent = 'Copied!';
    playCue('success');
    setTimeout(() => {
      btn.classList.remove('is-copied');
      if (code && original) code.innerHTML = original;
    }, 1400);
  } catch {
    playCue('error');
  }
}

const primaryBtn = document.getElementById('btn-primary');
const installChip = document.getElementById('install-chip');
installChip.addEventListener('click', () => {
  copyInstall(installChip);
  spawnSparks(installChip);
});

const starterCopy = document.getElementById('starter-copy');
const starterSnippet = document.getElementById('starter-snippet');
starterCopy?.addEventListener('click', async () => {
  const text = starterSnippet?.innerText?.trim() || '';
  try {
    await navigator.clipboard.writeText(text);
    starterCopy.setAttribute('aria-label', 'Copied');
    playCue('success');
    setTimeout(() => starterCopy.setAttribute('aria-label', 'Copy sample code'), 1400);
  } catch {
    playCue('error');
  }
});

const AGENT_PROMPT = `Install the npm package wobble-svg (https://www.npmjs.com/package/wobble-svg).

Use it to generate deterministic hand-drawn SVG ribbon paths (variable-width fills, not constant strokes). Prefer:
- roundedRectBoundary(width, height, radius) for a closed rect boundary
- generateWobbleRibbon(boundary, { seed, halfWidth, frequency, wiggle, closed }) for fillPath + ribbonPath
- generateWobblePath / animateWobbleRibbon when a centerline path or seed animation is needed

Drop the returned path d strings into SVG <path> (or react-native-svg). Keep seeds fixed for reproducibility. Zero DOM dependency - path data only.`;

const ctaCopyPrompt = document.getElementById('cta-copy-prompt');
ctaCopyPrompt?.addEventListener('click', async () => {
  const label = ctaCopyPrompt.querySelector('.btn-label');
  const original = label?.textContent || 'Copy a prompt';
  try {
    await navigator.clipboard.writeText(AGENT_PROMPT);
    if (label) label.textContent = 'Copied!';
    ctaCopyPrompt.classList.add('is-copied');
    spawnSparks(ctaCopyPrompt);
    playCue('success');
    setTimeout(() => {
      if (label) label.textContent = original;
      ctaCopyPrompt.classList.remove('is-copied');
    }, 1400);
  } catch {
    playCue('error');
  }
});

renderCanvas();

const SVG_NS = 'http://www.w3.org/2000/svg';

function appendRibbonPath(svg, d, fill) {
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', fill);
  path.setAttribute('fill-rule', 'evenodd');
  svg.appendChild(path);
}

function appendLabel(svg, text, x, y, { fill = 'var(--ink-soft)', size = 10, weight = '600' } = {}) {
  const el = document.createElementNS(SVG_NS, 'text');
  el.textContent = text;
  el.setAttribute('x', String(x));
  el.setAttribute('y', String(y));
  el.setAttribute('fill', fill);
  el.setAttribute('font-size', String(size));
  el.setAttribute('font-weight', weight);
  el.setAttribute('text-anchor', 'middle');
  el.style.fontFamily = 'var(--mono)';
  svg.appendChild(el);
}

function paintBenefitDemos() {
  const widthSvg = document.getElementById('benefit-demo-width');
  if (widthSvg) {
    widthSvg.replaceChildren();
    const points = [
      { x: 18, y: 58 },
      { x: 52, y: 28 },
      { x: 96, y: 78 },
      { x: 140, y: 34 },
      { x: 182, y: 62 },
    ];
    const ribbon = generateWobbleRibbon(openPolylineBoundary(points), {
      closed: false,
      seed: 42,
      halfWidth: 5.5,
      frequency: 0.09,
      wiggle: 1.1,
      smoothen: 0.45,
      widthVariance: 0.95,
    });
    appendRibbonPath(widthSvg, ribbon.ribbonPath, 'var(--ink)');
  }

  const seedSvg = document.getElementById('benefit-demo-seed');
  if (seedSvg) {
    seedSvg.replaceChildren();
    const opts = {
      closed: true,
      seed: 42,
      halfWidth: 2.2,
      frequency: 0.14,
      wiggle: 1.05,
      smoothen: 0.5,
      widthVariance: 0.55,
    };
    const left = roundedRectBoundary(54, 54, 14).map((p) => ({ ...p, x: p.x + 28, y: p.y + 22 }));
    const right = roundedRectBoundary(54, 54, 14).map((p) => ({ ...p, x: p.x + 118, y: p.y + 22 }));
    appendRibbonPath(seedSvg, generateWobbleRibbon(left, opts).ribbonPath, 'var(--ink)');
    appendRibbonPath(seedSvg, generateWobbleRibbon(right, opts).ribbonPath, 'var(--ink)');
    appendLabel(seedSvg, 'seed 42', 55, 102, { fill: 'var(--brand)', size: 11 });
    appendLabel(seedSvg, 'seed 42', 145, 102, { fill: 'var(--brand)', size: 11 });
    appendLabel(seedSvg, '=', 100, 55, { fill: 'var(--ink)', size: 18, weight: '700' });
  }

  const portSvg = document.getElementById('benefit-demo-port');
  if (portSvg) {
    portSvg.replaceChildren();
    const targets = [
      { x: 16, y: 28, w: 50, h: 40, r: 8, label: 'Web' },
      { x: 75, y: 22, w: 50, h: 52, r: 12, label: 'RN' },
      { x: 134, y: 28, w: 50, h: 40, r: 8, label: 'Print' },
    ];
    targets.forEach((t, i) => {
      const boundary = roundedRectBoundary(t.w, t.h, t.r).map((p) => ({
        ...p,
        x: p.x + t.x,
        y: p.y + t.y,
      }));
      const ribbon = generateWobbleRibbon(boundary, {
        closed: true,
        seed: 18 + i * 9,
        halfWidth: 1.6,
        frequency: 0.12,
        wiggle: 0.9,
        smoothen: 0.55,
        widthVariance: 0.45,
      });
      appendRibbonPath(portSvg, ribbon.ribbonPath, i === 1 ? 'var(--brand)' : 'var(--ink)');
      appendLabel(portSvg, t.label, t.x + t.w / 2, 98, {
        fill: i === 1 ? 'var(--brand)' : 'var(--ink-soft)',
        size: 11,
      });
    });
  }
}

paintBenefitDemos();

// Borders + interactions (compact layout)
const headerDivider = document.getElementById('header-divider');
if (headerDivider) attachWobbleDivider(headerDivider, { seed: 3, halfWidth: 1.1 });

attachWobbleBorders('[data-wobble-panel]', { radius: 14, halfWidth: 1.15, seed: 10 });
const benefitBorders = attachWobbleBorders('.benefit', { radius: 14, halfWidth: 1.1, seed: 80 });
document.querySelectorAll('.benefit').forEach((el, i) => {
  const homeSeed = 80 + i;
  attachHoverSeedCycle(el, benefitBorders[i], {
    homeSeed,
    seeds: [homeSeed, homeSeed + 11, homeSeed + 23, homeSeed + 37, homeSeed],
    intervalMs: 180,
  });
});

const shapeBorders = attachWobbleBorders('.shape-item', {
  radius: 999,
  halfWidth: 0.9,
  seed: 40,
  frequency: 0.08,
  color: 'var(--ink-soft)',
});

function syncShapeChipBorders() {
  document.querySelectorAll('.shape-item').forEach((el, i) => {
    const active = el.classList.contains('active');
    shapeBorders[i]?.update({
      color: active ? 'var(--ink)' : 'var(--ink-soft)',
      halfWidth: active ? 1.05 : 0.85,
    });
  });
}
syncShapeChipBorders();

const primary = attachWobbleBorder(primaryBtn, {
  radius: 999,
  halfWidth: 1.45,
  seed: 2,
  // Filled: stroke matches fill (ink on ink).
  color: 'var(--ink)',
  fill: 'var(--ink)',
});
// Continuous seed morph while hovered (not a one-shot reseed).
attachHoverSeedCycle(primaryBtn, primary, {
  homeSeed: 2,
  seeds: [2, 13, 25, 39, 2],
  intervalMs: 160,
});
primaryBtn.addEventListener('click', () => spawnSparks(primaryBtn));

const secondaryBtn = document.getElementById('btn-secondary');
const secondary = attachWobbleBorder(secondaryBtn, {
  radius: 999,
  halfWidth: 1.45,
  seed: 3,
  color: 'var(--ink)',
});
attachHoverSeedCycle(secondaryBtn, secondary, {
  homeSeed: 3,
  seeds: [3, 14, 26, 40, 3],
  intervalMs: 160,
});
secondaryBtn.addEventListener('click', () => spawnSparks(secondaryBtn));

const ctaStar = document.getElementById('cta-star');
const ctaInstall = document.getElementById('cta-install');
if (ctaStar) {
  const ctaStarBorder = attachWobbleBorder(ctaStar, {
    radius: 999,
    halfWidth: 1.45,
    seed: 51,
    color: 'var(--ink)',
  });
  attachHoverSeedCycle(ctaStar, ctaStarBorder, {
    homeSeed: 51,
    seeds: [51, 62, 74, 88, 51],
    intervalMs: 160,
  });
  ctaStar.addEventListener('click', () => spawnSparks(ctaStar));
}
if (ctaInstall) {
  const ctaInstallBorder = attachWobbleBorder(ctaInstall, {
    radius: 999,
    halfWidth: 1.45,
    seed: 52,
    color: 'var(--ink)',
    fill: 'var(--ink)',
  });
  attachHoverSeedCycle(ctaInstall, ctaInstallBorder, {
    homeSeed: 52,
    seeds: [52, 63, 75, 89, 52],
    intervalMs: 160,
  });
  ctaInstall.addEventListener('click', () => spawnSparks(ctaInstall));
}
if (ctaCopyPrompt) {
  const ctaPromptBorder = attachWobbleBorder(ctaCopyPrompt, {
    radius: 999,
    halfWidth: 1.45,
    seed: 53,
    color: 'var(--ink)',
  });
  attachHoverSeedCycle(ctaCopyPrompt, ctaPromptBorder, {
    homeSeed: 53,
    seeds: [53, 64, 76, 90, 53],
    intervalMs: 160,
  });
}

const copyBorder = attachWobbleBorder(copyBtn, {
  radius: 999,
  halfWidth: 1.25,
  seed: 8,
  color: 'var(--ink)',
  fill: 'var(--ink)',
});
attachInteractiveButton(copyBtn, copyBorder, { baseSeed: 8 });

// Brand seed pip (filled orange) - no outer stroke around the wordmark.
const brandSeed = document.getElementById('brand-seed');
const seedBorder = attachWobbleBorder(brandSeed, {
  radius: 999,
  halfWidth: 1.35,
  seed: 2,
  frequency: 0.16,
  wiggle: 1.25,
  widthVariance: 0.65,
  color: 'var(--brand)',
  fill: 'var(--brand)',
});

const wordmark = document.getElementById('wordmark');
const wordmarkLabel = document.getElementById('wordmark-label');
attachHoverSeedCycle(wordmark, seedBorder, {
  homeSeed: 2,
  seeds: [2, 13, 25, 39, 2],
  intervalMs: 160,
});
attachHoverTextWobble(wordmarkLabel, {
  homeSeed: 2,
  seeds: [2, 13, 25, 39, 2],
  intervalMs: 150,
  scale: 2.8,
});

const studioLiveDot = document.getElementById('studio-live-dot');
if (studioLiveDot) {
  const liveDotBorder = attachWobbleBorder(studioLiveDot, {
    radius: 999,
    halfWidth: 1.1,
    seed: 7,
    frequency: 0.18,
    wiggle: 1.15,
    widthVariance: 0.55,
    color: 'var(--brand)',
    fill: 'var(--brand)',
  });
  attachContinuousSeedCycle(liveDotBorder, {
    seeds: [7, 18, 29, 41, 7],
    intervalMs: 450,
  });
}

const heroDrawnByHand = document.getElementById('hero-drawn-by-hand');
if (heroDrawnByHand) {
  attachContinuousTextWobble(heroDrawnByHand, {
    seeds: [11, 19, 27, 35, 11],
    intervalMs: 150,
    scale: 3.2,
  });
}

// Headings / typed labels wobble on hover.
document.querySelectorAll('.wobble-hover-text').forEach((el, i) => {
  attachHoverTextWobble(el, {
    homeSeed: 3 + i,
    seeds: [3 + i, 11 + i, 19 + i, 27 + i, 3 + i],
    intervalMs: 150,
    scale: el.closest('h1') ? 3.2 : 2.4,
  });
});

// ---------- Scroll-reveal for major sections ----------
// Each .reveal section fades/rises in the first time it crosses into view;
// unobserving after the first hit keeps this a one-way "appear", not a
// toggle that re-hides content when the visitor scrolls back up.
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  revealEls.forEach((el) => revealObserver.observe(el));
}

// ---------- Light 3D tilt: pointer (desktop) or device orientation (mobile) ----------
// Shared by the 3 benefit cards and the final "Ship with wobble today" CTA
// card - anything marked .tilt-card in the HTML.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const MAX_TILT_DEG = 6;
  const tiltCards = document.querySelectorAll('.tilt-card');

  // Most cards use MAX_TILT_DEG; a card can opt into a smaller max via
  // data-tilt-max (the final CTA card wants less elevation than the
  // benefit cards it shares this logic with).
  const maxTiltFor = (card) => Number(card.dataset.tiltMax) || MAX_TILT_DEG;

  const setTilt = (card, rotateX, rotateY) => {
    card.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
  };

  if (tiltCards.length && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    // Desktop / mouse: tilt follows cursor position within the card.
    tiltCards.forEach((card) => {
      const cardMaxTilt = maxTiltFor(card);
      const tiltFromPointer = (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        setTilt(card, (0.5 - py) * 2 * cardMaxTilt, (px - 0.5) * 2 * cardMaxTilt);
      };
      card.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'touch') return;
        card.classList.add('is-tilting');
        tiltFromPointer(e);
      });
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        tiltFromPointer(e);
      });
      card.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'touch') return;
        card.classList.remove('is-tilting');
        setTilt(card, 0, 0);
      });
    });
  } else if (tiltCards.length && typeof DeviceOrientationEvent !== 'undefined') {
    // Touch / coarse-pointer: no hover to read, so tilt the cards with the
    // phone's own tilt instead. beta/gamma deltas are measured from
    // whatever orientation the visitor is already holding the phone at
    // (the first reading), not from "flat" - holding a phone dead level
    // isn't a real resting position, so a fixed zero point would make the
    // cards sit permanently tilted for most people.
    let baseline = null;
    let current = { x: 0, y: 0 };
    let raf = 0;

    const handleOrientation = (e) => {
      if (e.beta === null || e.gamma === null) return;
      if (!baseline) baseline = { beta: e.beta, gamma: e.gamma };

      const dBeta = Math.max(-30, Math.min(30, e.beta - baseline.beta));
      const dGamma = Math.max(-30, Math.min(30, e.gamma - baseline.gamma));
      // Normalized -1..1 fraction of full tilt, not degrees, so each card
      // can scale it by its own max (see maxTiltFor) below.
      const targetX = -dBeta / 30;
      const targetY = dGamma / 30;

      // Low-pass filter - raw sensor deltas are jittery frame to frame,
      // and a subtle effect reads as broken if it visibly judders.
      current.x += (targetX - current.x) * 0.15;
      current.y += (targetY - current.y) * 0.15;

      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          tiltCards.forEach((card) => {
            const cardMaxTilt = maxTiltFor(card);
            setTilt(card, current.x * cardMaxTilt, current.y * cardMaxTilt);
          });
        });
      }
    };

    const enableDeviceTilt = () => {
      tiltCards.forEach((card) => card.classList.add('is-tilting'));
      window.addEventListener('deviceorientation', handleOrientation);
    };

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ gates motion/orientation behind an explicit user gesture -
      // there's no way to ask upfront, so the first tap anywhere doubles
      // as the opt-in. A denial just leaves the cards flat, same as any
      // other browser without DeviceOrientationEvent.
      document.addEventListener(
        'click',
        () => {
          DeviceOrientationEvent.requestPermission()
            .then((state) => {
              if (state === 'granted') enableDeviceTilt();
            })
            .catch(() => {});
        },
        { once: true },
      );
    } else {
      enableDeviceTilt();
    }
  }

  // Final-CTA buttons "pop" onto a layer above the card on hover, tilting
  // toward the cursor - desktop/hover only (CSS gates the actual pop on
  // `hover: hover` too, but skip the listeners entirely on touch since
  // there's no hover to drive --pop-x/--pop-y from).
  const popButtons = document.querySelectorAll('.btn-pop');
  if (popButtons.length && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const MAX_BTN_TILT_DEG = 10;
    popButtons.forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const rect = btn.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        btn.style.setProperty('--pop-x', `${((0.5 - py) * 2 * MAX_BTN_TILT_DEG).toFixed(2)}deg`);
        btn.style.setProperty('--pop-y', `${((px - 0.5) * 2 * MAX_BTN_TILT_DEG).toFixed(2)}deg`);
      });
      btn.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'touch') return;
        btn.style.setProperty('--pop-x', '0deg');
        btn.style.setProperty('--pop-y', '0deg');
      });
    });
  }
}

// ---------- Interaction sounds (cuelume) ----------
// cuelume's bind() wires declarative data-cuelume-* attributes for hover,
// press, release, and click - assign those in bulk here by selector rather
// than hand-editing every element in index.html. Sliders fire on 'input',
// which bind() doesn't cover, so those get their own throttled listener.
setCueVolume(0.6);

const setCue = (selector, attr, sound) => {
  document.querySelectorAll(selector).forEach((el) => el.setAttribute(attr, sound || ''));
};

// Buttons: a soft hover cue builds anticipation, then a physical two-part
// press/release on the click itself, like a key going down and springing
// back.
setCue('.btn-interactive, .mini-btn, .copy-prompt, .copy-icon-btn', 'data-cuelume-hover', 'whisper');
setCue('.btn-interactive, .mini-btn, .copy-prompt, .copy-icon-btn', 'data-cuelume-press', '');
setCue('.btn-interactive, .mini-btn, .copy-prompt, .copy-icon-btn', 'data-cuelume-release', '');

// Plain nav/text links: a light hover tick, then a page-turn click before
// they navigate away.
setCue('.wordmark, .nav-quiet, .eyebrow a, .site-footer a', 'data-cuelume-hover', 'tick');
setCue('.wordmark, .nav-quiet, .eyebrow a, .site-footer a', 'data-cuelume-toggle', 'page');

// Shape chips in the studio are a menu of alternatives - a quick locator
// scan fits better than a generic click.
setCue('.shape-item', 'data-cuelume-toggle', 'scan');

// Checkboxes are literal two-state switches - the default toggle sound
// (a mechanical click-clack) needs no override.
setCue('#ctl-fill, #ctl-animate', 'data-cuelume-toggle', '');

// Big surfaces (benefit cards, the final CTA card, the studio panel, the
// proof screenshots) get a soft ambient hover instead of a sharp tick.
setCue('.tilt-card, [data-wobble-panel]', 'data-cuelume-hover', 'bloom');

// Hover-wobble headings inside a card rely on the card's own bloom hover
// above - a second sound on the heading would double up. Standalone
// headings get their own continuous drone below instead of a cuelume cue.
bindCueSounds();

// Sliders: a soft tick per drag step, throttled so dragging doesn't turn
// into a machine-gun of sound.
const SLIDER_CUE_GAP_MS = 90;
let lastSliderCueAt = -Infinity;
document.querySelectorAll('input[type="range"]').forEach((input) => {
  input.addEventListener('input', () => {
    const now = performance.now();
    if (now - lastSliderCueAt < SLIDER_CUE_GAP_MS) return;
    lastSliderCueAt = now;
    playCue('tick', { volume: 0.5 });
  });
});

// ---------- Continuous text-wobble hover drone ----------
// A separate, non-cuelume effect for standalone .wobble-hover-text headings:
// a low, gritty drone that swells in on hover and holds for as long as the
// pointer stays, instead of a single one-shot "ding" - it echoes the visual
// wobble continuously rather than announcing it once. Headings inside a
// card are excluded (the card's own bloom hover already covers them, and
// stacking a second, different sound on top read as noisy/sharp).
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let droneCtx = null;
  let noiseBuffer = null;
  let activeVoice = null;

  const getDroneContext = () => {
    if (!droneCtx) droneCtx = new (window.AudioContext || window.webkitAudioContext)();
    return droneCtx;
  };

  const getNoiseBuffer = (ctx) => {
    if (noiseBuffer) return noiseBuffer;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffer = buffer;
    return buffer;
  };

  const stopDrone = (immediate = false) => {
    if (!activeVoice) return;
    const { master, nodes } = activeVoice;
    const ctx = droneCtx;
    const now = ctx.currentTime;
    const release = immediate ? 0.02 : 0.18;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + release);
    nodes.forEach((n) => n.stop(now + release + 0.02));
    activeVoice = null;
  };

  const startDrone = () => {
    const ctx = getDroneContext();
    if (ctx.state === 'suspended') ctx.resume();
    stopDrone(true);

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.045, now + 0.14);
    master.connect(ctx.destination);

    // Low tone, gently wobbling in pitch - mirrors the visual wobble.
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(68, now);
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(5.5, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(4, now);
    lfo.connect(lfoGain).connect(osc.frequency);
    const toneFilter = ctx.createBiquadFilter();
    toneFilter.type = 'lowpass';
    toneFilter.frequency.setValueAtTime(300, now);
    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0.6, now);
    osc.connect(toneFilter).connect(toneGain).connect(master);

    // Filtered noise bed for the "scratchy" texture.
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(340, now);
    noiseFilter.Q.setValueAtTime(0.9, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, now);
    noise.connect(noiseFilter).connect(noiseGain).connect(master);

    osc.start(now);
    lfo.start(now);
    noise.start(now);

    activeVoice = { master, nodes: [osc, lfo, noise] };
  };

  window.addEventListener('blur', () => stopDrone());

  document.querySelectorAll('.wobble-hover-text').forEach((el) => {
    if (el.closest('.tilt-card, [data-wobble-panel]')) return;
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      startDrone();
    });
    el.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return;
      stopDrone();
    });
  });
}
