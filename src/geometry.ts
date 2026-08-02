/**
 * Pure geometry helpers: turn a plain shape description (a rounded rect, an
 * open polyline) into a dense list of boundary samples — each carrying its
 * position, outward normal, and running arc-length — which `wobble.ts`
 * perturbs into a hand-drawn ribbon. No SVG, no DOM: just numbers, so this
 * runs the same in a browser or a React Native JS engine.
 */

export interface Point {
  x: number;
  y: number;
}

export interface BoundarySample extends Point {
  /** Outward unit normal at this sample. */
  nx: number;
  ny: number;
  /** Running arc-length from the start of the boundary, in px. */
  t: number;
}

const STEP = 4; // px between samples along straight runs and arcs — small enough to read as smooth at typical stroke widths.

/**
 * Samples a rounded rect's boundary clockwise starting at the top-left
 * corner's end. Passing `radius >= min(width, height) / 2` produces a full
 * stadium/pill (the straight runs on the short axis disappear entirely),
 * which is how `Bubble` gets its pill shape at small heights.
 */
export function roundedRectBoundary(width: number, height: number, radius: number): BoundarySample[] {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const samples: BoundarySample[] = [];
  let t = 0;

  const line = (x1: number, y1: number, x2: number, y2: number, nx: number, ny: number) => {
    const length = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.round(length / STEP));
    for (let i = 0; i < steps; i++) {
      const f = i / steps;
      samples.push({ x: x1 + (x2 - x1) * f, y: y1 + (y2 - y1) * f, nx, ny, t });
      t += length / steps;
    }
  };

  const arc = (cx: number, cy: number, startDeg: number, endDeg: number) => {
    if (r === 0) return;
    const length = (Math.abs(endDeg - startDeg) * (Math.PI / 180)) * r;
    const steps = Math.max(1, Math.round(length / STEP));
    for (let i = 0; i < steps; i++) {
      const deg = startDeg + (endDeg - startDeg) * (i / steps);
      const rad = (deg * Math.PI) / 180;
      const nx = Math.cos(rad);
      const ny = Math.sin(rad);
      samples.push({ x: cx + nx * r, y: cy + ny * r, nx, ny, t });
      t += length / steps;
    }
  };

  line(r, 0, width - r, 0, 0, -1);
  arc(width - r, r, -90, 0);
  line(width, r, width, height - r, 1, 0);
  arc(width - r, height - r, 0, 90);
  line(width - r, height, r, height, 0, 1);
  arc(r, height - r, 90, 180);
  line(0, height - r, 0, r, -1, 0);
  arc(r, r, 180, 270);

  // No explicit closing duplicate of samples[0]: the SVG path's own `Z`
  // closes the loop with a short straight segment instead, avoiding a seam
  // where a duplicated point would get a different noise value than the
  // original (t=0 and t=perimeter aren't equal inputs to the noise
  // function, so the two "same" points would otherwise wobble apart).
  return samples;
}

/**
 * Samples an OPEN polyline (e.g. a tail's two visible edges: base-left ->
 * apex -> base-right) with a per-vertex outward normal, for shapes that
 * shouldn't close back into a loop.
 */
export function openPolylineBoundary(points: Point[]): BoundarySample[] {
  if (points.length < 2) return points.map((p) => ({ ...p, nx: 0, ny: 0, t: 0 }));

  // Per-vertex normal: average of the two adjacent segment normals (mitered), so corners don't pinch.
  const segmentNormal = (a: Point, b: Point) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { nx: dy / len, ny: -dx / len };
  };

  const samples: BoundarySample[] = [];
  let t = 0;
  for (let i = 0; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const nPrev = prev ? segmentNormal(prev, curr) : undefined;
    const nNext = next ? segmentNormal(curr, next) : undefined;
    const n = nPrev && nNext ? { nx: (nPrev.nx + nNext.nx) / 2, ny: (nPrev.ny + nNext.ny) / 2 } : nPrev ?? nNext!;
    const nLen = Math.hypot(n.nx, n.ny) || 1;

    if (i > 0) t += Math.hypot(curr.x - prev.x, curr.y - prev.y);
    samples.push({ x: curr.x, y: curr.y, nx: n.nx / nLen, ny: n.ny / nLen, t });
  }
  return samples;
}

export function toClosedPath(points: Point[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${rest.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')} Z`;
}

export function toOpenPath(points: Point[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${rest.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')}`;
}

/**
 * Ribbon fill tracing the band between an outer and inner boundary.
 *
 * For an OPEN run (e.g. a tail's two visible edges), the ribbon is one
 * connected loop: outer forward, across the far end, inner backward, across
 * the near end, closed — the two "caps" are real endpoints of the stroke.
 *
 * For a CLOSED loop (a rect/pill), outer[0] and outer[last] are two
 * different-but-adjacent samples, not the same point — stitching them into
 * one loop the same way leaves a thin unfilled slit at the seam. Instead
 * this renders the outer and inner boundaries as two independent closed
 * subpaths (an annulus/ring), which needs `fill-rule="evenodd"` on the
 * consuming `<path>` to punch the inner loop out of the outer one.
 */
export function toRibbonPath(outer: Point[], inner: Point[], closed = true): string {
  if (outer.length === 0) return '';

  if (closed) {
    return `${toClosedPath(outer)} ${toClosedPath(inner)}`;
  }

  const forward = outer
    .slice(1)
    .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const backward = [...inner]
    .reverse()
    .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  return `M ${outer[0].x.toFixed(2)} ${outer[0].y.toFixed(2)} ${forward} ${backward} Z`;
}
