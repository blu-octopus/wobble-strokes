// Chrome for the landing page itself: every panel, button, and pill on this
// page is bordered by the real library, not CSS `border`. This is the same
// "generated overlay" pattern documented in examples.md (WobbleBorder), just
// framework-free ??? measure the element, sample a rounded-rect boundary,
// perturb it, and drop the resulting ribbon in as an absolutely-positioned
// <svg> behind the element's own content.
import { roundedRectBoundary, generateWobbleRibbon } from './vendor/wobble-svg.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';

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
