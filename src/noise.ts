/**
 * Deterministic, dependency-free randomness backing every hand-drawn shape in
 * this package. No Math.random anywhere — the same seed always reproduces
 * the same wobble, on any platform (this file has zero DOM/browser API
 * usage, so it runs identically under React Native's JS engine).
 */

/** mulberry32 — a tiny, fast, seeded PRNG. Returns a function yielding floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Smooth, seeded 1D noise: a small sum of sine waves at irrational-ratio
 * frequencies and random phases/amplitudes. Unlike raw per-sample PRNG
 * noise, this is continuous — neighboring positions along a path get
 * similar values, which is what makes the wobble read as one hand-drawn
 * line instead of static. Returns a function mapping arc-length position
 * `t` to a value roughly in [-1, 1].
 */
export function smoothNoise1D(seed: number, frequency: number): (t: number) => number {
  const random = mulberry32(seed);
  const terms = Array.from({ length: 4 }, (_, i) => ({
    freq: frequency * (0.6 + i * 0.9 + random() * 0.5),
    phase: random() * Math.PI * 2,
    amp: 0.35 + random() * 0.65,
  }));
  const totalAmp = terms.reduce((sum, term) => sum + term.amp, 0);
  return (t: number) => {
    const raw = terms.reduce((sum, term) => sum + term.amp * Math.sin(t * term.freq + term.phase), 0);
    return raw / totalAmp;
  };
}
