import { roundedRectBoundary, openPolylineBoundary, generateWobbleRibbon } from './vendor/wobble-svg.mjs';
import { attachWobbleBorder, attachWobbleBorders } from './wobble-ui.js';

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
  color: '#2b2420',
  fill: false,
};

function boundaryFor(shape) {
  switch (shape) {
    case 'rect': {
      const w = 220, h = 120, r = 14;
      const ox = (CANVAS_W - w) / 2, oy = (CANVAS_H - h) / 2;
      return {
        closed: true,
        label: `rect ${w}×${h}`,
        boundary: roundedRectBoundary(w, h, r).map((p) => ({ ...p, x: p.x + ox, y: p.y + oy })),
      };
    }
    case 'pill': {
      const w = 220, h = 64, r = 32;
      const ox = (CANVAS_W - w) / 2, oy = (CANVAS_H - h) / 2;
      return {
        closed: true,
        label: `pill ${w}×${h}`,
        boundary: roundedRectBoundary(w, h, r).map((p) => ({ ...p, x: p.x + ox, y: p.y + oy })),
      };
    }
    case 'circle': {
      const w = 140, h = 140, r = 70;
      const ox = (CANVAS_W - w) / 2, oy = (CANVAS_H - h) / 2;
      return {
        closed: true,
        label: `circle ⌀${w}`,
        boundary: roundedRectBoundary(w, h, r).map((p) => ({ ...p, x: p.x + ox, y: p.y + oy })),
      };
    }
    case 'tail': {
      // Sparse control points — openPolylineBoundary densifies edges ~4px.
      const points = [
        { x: 95, y: 30 },
        { x: 150, y: 178 },
        { x: 238, y: 42 },
      ];
      return { closed: false, label: 'triangle tail (open)', boundary: openPolylineBoundary(points) };
    }
    default:
      throw new Error(`unknown shape: ${shape}`);
  }
}

const canvasSvg = document.getElementById('canvas-svg');
const canvasFill = document.getElementById('canvas-fill');
const canvasStroke = document.getElementById('canvas-stroke');
const canvasLabel = document.getElementById('canvas-label');

function renderCanvas() {
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

  canvasStroke.setAttribute('d', ribbon.ribbonPath);
  canvasStroke.setAttribute('fill', state.color);

  if (state.fill && closed) {
    canvasFill.setAttribute('d', ribbon.fillPath);
    canvasFill.setAttribute('fill', state.color);
    canvasFill.style.opacity = '0.12';
  } else {
    canvasFill.removeAttribute('d');
  }

  canvasLabel.textContent = `${label} · seed ${state.seed}`;
}

function buildSnippet() {
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

document.getElementById('ctl-color').addEventListener('input', (e) => {
  state.color = e.target.value;
  renderCanvas();
});

document.getElementById('ctl-fill').addEventListener('change', (e) => {
  state.fill = e.target.checked;
  renderCanvas();
});

document.getElementById('ctl-randomize').addEventListener('click', () => {
  const seedInput = document.getElementById('ctl-seed');
  const next = Math.floor(Math.random() * Number(seedInput.max));
  seedInput.value = String(next);
  seedInput.dispatchEvent(new Event('input'));
});

document.querySelectorAll('.shape-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.shape-item').forEach((el) => el.classList.remove('active'));
    item.classList.add('active');
    state.shape = item.dataset.shape;
    renderCanvas();
  });
});

const copyBtn = document.getElementById('ctl-copy');
copyBtn.addEventListener('click', async () => {
  const snippet = buildSnippet();
  try {
    await navigator.clipboard.writeText(snippet);
    const original = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = original), 1400);
  } catch {
    console.warn('Clipboard write failed; snippet:\n' + snippet);
  }
});

const installChip = document.getElementById('install-chip');
installChip.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('npm install wobble-svg');
    const label = installChip.querySelector('.chip-label');
    const original = label.textContent;
    label.textContent = 'Copied!';
    setTimeout(() => (label.textContent = original), 1400);
  } catch {
    /* clipboard unavailable — silently ignore, the command is still visible */
  }
});

renderCanvas();

// Every panel and button on the page is bordered by the real package —
// distinct seeds so neighboring shapes don't wobble in lockstep.
attachWobbleBorders('[data-wobble-panel]', { radius: 16, halfWidth: 1.25, seed: 10 });
attachWobbleBorders('.shape-item', { radius: 10, halfWidth: 1, seed: 40, frequency: 0.07 });
attachWobbleBorder(document.getElementById('btn-primary'), { radius: 999, halfWidth: 1.5, seed: 2, color: 'var(--paper)', fill: 'var(--ink)' });
attachWobbleBorder(document.getElementById('btn-secondary'), { radius: 999, halfWidth: 1.5, seed: 3 });
attachWobbleBorder(installChip, { radius: 999, halfWidth: 1.25, seed: 5 });
attachWobbleBorders('.badge', { radius: 999, halfWidth: 1, seed: 60, frequency: 0.08 });
