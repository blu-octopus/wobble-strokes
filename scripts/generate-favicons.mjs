/**
 * Generate a small favicon library from the wobble wordmark mark:
 * a rounded square with a live wobble border and a bold "w" glyph.
 * Run: node scripts/generate-favicons.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { roundedRectBoundary, generateWobbleRibbon } from '../dist/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../site/favicons');
mkdirSync(outDir, { recursive: true });

const INK = '#2b2420';
const PAPER = '#f7f2ea';
const ACCENT = '#c1502e';

function faviconSvg(size, seed) {
  const pad = Math.max(2, size * 0.08);
  const halfWidth = Math.max(0.6, size * 0.04);
  const inner = size - pad * 2;
  const radius = inner * 0.28;
  const boundary = roundedRectBoundary(inner - halfWidth * 2, inner - halfWidth * 2, Math.max(radius - halfWidth, 0)).map(
    (p) => ({ ...p, x: p.x + pad + halfWidth, y: p.y + pad + halfWidth }),
  );
  const ribbon = generateWobbleRibbon(boundary, {
    seed,
    halfWidth,
    frequency: 0.08,
    wiggle: Math.max(0.6, size * 0.03),
    smoothen: 0.55,
    widthVariance: 0.45,
    closed: true,
  });
  const fontSize = size * 0.48;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${PAPER}" rx="${radius}"/>
  <path d="${ribbon.fillPath}" fill="${PAPER}"/>
  <path d="${ribbon.ribbonPath}" fill="${INK}" fill-rule="evenodd"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="ui-rounded, 'SF Pro Rounded', system-ui, sans-serif"
    font-weight="700" font-size="${fontSize}" fill="${ACCENT}">w</text>
</svg>
`;
}

const specs = [
  { name: 'favicon.svg', size: 32, seed: 2 },
  { name: 'favicon-16.svg', size: 16, seed: 2 },
  { name: 'favicon-32.svg', size: 32, seed: 2 },
  { name: 'favicon-48.svg', size: 48, seed: 2 },
  { name: 'favicon-128.svg', size: 128, seed: 2 },
  { name: 'favicon-seed-a.svg', size: 48, seed: 2 },
  { name: 'favicon-seed-b.svg', size: 48, seed: 13 },
  { name: 'favicon-seed-c.svg', size: 48, seed: 25 },
  { name: 'favicon-seed-d.svg', size: 48, seed: 39 },
  { name: 'apple-touch-icon.svg', size: 180, seed: 2 },
];

for (const { name, size, seed } of specs) {
  writeFileSync(join(outDir, name), faviconSvg(size, seed));
  console.log('wrote', name);
}

writeFileSync(
  join(outDir, 'README.md'),
  `# Wobble favicon library

Generated from the landing-page wordmark mark (rounded square + wobble ribbon + \`w\`).

| File | Size | Seed |
|------|------|------|
${specs.map((s) => `| \`${s.name}\` | ${s.size} | ${s.seed} |`).join('\n')}

Regenerate after changing stroke defaults:

\`\`\`bash
npm run build && node scripts/generate-favicons.mjs
\`\`\`
`,
);

console.log('favicon library ready in site/favicons/');
