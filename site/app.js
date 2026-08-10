import {
  roundedRectBoundary,
  openPolylineBoundary,
  generateWobbleRibbon,
} from './vendor/wobble-svg.mjs';
import {
  attachWobbleBorder,
  attachWobbleBorders,
  attachInteractiveButton,
  attachHoverSeedCycle,
  buildDialogueBubbleBoundary,
  spawnSparks,
} from './wobble-ui.js';

const CANVAS_W = 320;
const CANVAS_H = 200;

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

function renderFontCanvas() {
  canvasSvg.style.visibility = 'hidden';
  canvasFont.hidden = false;
  fontWrap.hidden = false;
  setPathControlsVisible(false);

  canvasFontText.style.fontFamily = state.fontFamily;
  canvasFontText.style.color = colorCss();
  // Map studio knobs onto the SVG displacement filter (capy-ui Text pattern).
  fontNoise.setAttribute('seed', String(Math.round(state.seed)));
  fontNoise.setAttribute('baseFrequency', String(Math.max(0.01, state.frequency)));
  fontDisplace.setAttribute('scale', String(Math.max(0.4, state.wiggle * 1.6)));
  canvasLabel.textContent = `font  |  seed ${state.seed}`;
}

function renderPathCanvas() {
  canvasSvg.style.visibility = 'visible';
  canvasFont.hidden = true;
  fontWrap.hidden = true;
  setPathControlsVisible(true);

  const { closed, label, boundary } = boundaryFor(state.shape);
  const ribbon = generateWobbleRibbon(boundary, {
    seed: state.seed,
    halfWidth: state.strokeWidth / 2,
    frequency: state.frequency,
    wiggle: state.wiggle,
    smoothen: state.smoothen,
    widthVariance: state.variance,
    closed,
  });

  const color = colorCss();
  canvasStroke.setAttribute('d', ribbon.ribbonPath);
  canvasStroke.setAttribute('fill', color);

  if (state.shape === 'bubble') {
    // Dialogue bubbles always show a paper (or chosen) fill behind the stroke.
    canvasFill.setAttribute('d', ribbon.fillPath);
    canvasFill.setAttribute('fill', state.fill ? color : '#fffdf8');
    canvasFill.style.opacity = '1';
  } else if (state.fill && closed) {
    // Solid fill silhouette at full opacity of the chosen color (incl. alpha).
    canvasFill.setAttribute('d', ribbon.fillPath);
    canvasFill.setAttribute('fill', color);
    canvasFill.style.opacity = '1';
  } else {
    canvasFill.removeAttribute('d');
  }

  canvasLabel.textContent = `${label}  |  seed ${state.seed}`;
}

function renderCanvas() {
  if (state.shape === 'font') renderFontCanvas();
  else renderPathCanvas();
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
    renderCanvas();
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
  renderCanvas();
});
alphaReadout.textContent = '100%';

document.getElementById('ctl-color').addEventListener('input', (e) => {
  state.colorHex = e.target.value;
  renderCanvas();
});

document.getElementById('ctl-fill').addEventListener('change', (e) => {
  state.fill = e.target.checked;
  renderCanvas();
});

document.getElementById('ctl-font').addEventListener('change', (e) => {
  state.fontFamily = e.target.value;
  renderCanvas();
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
    setTimeout(() => (label.textContent = original), 1400);
  } catch {
    console.warn('Clipboard write failed; snippet:\n' + snippet);
  }
});

async function copyInstall(btn) {
  const label = btn.querySelector('.btn-label, .chip-label') || btn;
  try {
    await navigator.clipboard.writeText('npm install wobble-svg');
    const original = label.textContent;
    label.textContent = 'Copied!';
    setTimeout(() => (label.textContent = original), 1400);
  } catch {
    /* clipboard unavailable */
  }
}

const primaryBtn = document.getElementById('btn-primary');
const installChip = document.getElementById('install-chip');
installChip.addEventListener('click', () => copyInstall(installChip));

renderCanvas();

// Borders + interactions (compact layout)
attachWobbleBorders('[data-wobble-panel]', { radius: 14, halfWidth: 1.15, seed: 10 });
attachWobbleBorders('.benefit', { radius: 14, halfWidth: 1.1, seed: 80 });

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
attachInteractiveButton(primaryBtn, primary, { baseSeed: 2 });

const secondaryBtn = document.getElementById('btn-secondary');
const secondary = attachWobbleBorder(secondaryBtn, {
  radius: 999,
  halfWidth: 1.45,
  seed: 3,
  color: 'var(--ink)',
});
attachInteractiveButton(secondaryBtn, secondary, { baseSeed: 3 });

const footerInstall = attachWobbleBorder(installChip, {
  radius: 999,
  halfWidth: 1.45,
  seed: 5,
  color: 'var(--ink)',
  fill: 'var(--ink)',
});
attachInteractiveButton(installChip, footerInstall, { baseSeed: 5 });

const copyBorder = attachWobbleBorder(copyBtn, {
  radius: 999,
  halfWidth: 1.25,
  seed: 8,
  color: 'var(--ink)',
  fill: 'var(--ink)',
});
attachInteractiveButton(copyBtn, copyBorder, { baseSeed: 8 });

attachWobbleBorder(document.getElementById('badge-tertiary'), {
  radius: 999,
  halfWidth: 0.95,
  seed: 60,
  frequency: 0.08,
});

// Brand seed: orange pip with matching wobble stroke; cycles on wordmark hover.
const brandSeed = document.getElementById('brand-seed');
const seedBorder = attachWobbleBorder(brandSeed, {
  radius: 999,
  halfWidth: 1.35,
  seed: 2,
  frequency: 0.16,
  wiggle: 1.25,
  widthVariance: 0.65,
  // Stroke matches the seed fill (same rule as filled CTAs).
  color: '#c1502e',
  fill: '#c1502e',
});
const wordmark = document.getElementById('wordmark');
attachHoverSeedCycle(wordmark, seedBorder, {
  homeSeed: 2,
  seeds: [2, 13, 25, 39, 2],
  intervalMs: 160,
});
