#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports --
   Node CommonJS script; package.json has no "type": "module". */

// scripts/generate-icons.js
//
// Generates Mnemo PWA icons (192x192 and 512x512) into public/icons/.
// Requires the `canvas` package: `npm install --save-dev canvas`
//
// Usage:  node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Logo M path in 88x60 viewBox coordinates (from the spec).
// Equivalent SVG: M 10 54 C 6 44 2 26 6 6 C 14 -4 32 0 38 16
//                 C 42 28 42 36 44 38 C 46 36 46 28 52 16
//                 C 58 0 76 -4 82 6 C 86 26 82 44 78 54
function traceMPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(10, 54);
  ctx.bezierCurveTo( 6, 44,  2, 26,  6,  6);
  ctx.bezierCurveTo(14, -4, 32,  0, 38, 16);
  ctx.bezierCurveTo(42, 28, 42, 36, 44, 38);
  ctx.bezierCurveTo(46, 36, 46, 28, 52, 16);
  ctx.bezierCurveTo(58,  0, 76, -4, 82,  6);
  ctx.bezierCurveTo(86, 26, 82, 44, 78, 54);
}
const VB_W = 88;
const VB_H = 60;

const BG_DARK   = '#18160f';
const PARCHMENT = '#f5f1ea';
const GOLD      = '#c4a35a';

// Stroke is given in viewBox units. The header logo uses 2.2 - too thin
// once the icon is scaled and rasterized, so we use a heavier weight here
// so the M reads at favicon and home-screen sizes.
const STROKE_VB = 4;
const DOT_OUTER_R = 6;   // parchment halo (from spec logo)
const DOT_INNER_R = 4.5; // gold dot

function renderIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background fill
  ctx.fillStyle = BG_DARK;
  ctx.fillRect(0, 0, size, size);

  // Fit the M with ~18% padding on each side
  const padding = size * 0.18;
  const drawW = size - padding * 2;
  const scale = drawW / VB_W;
  const drawH = VB_H * scale;

  ctx.save();
  ctx.translate(padding, (size - drawH) / 2);
  ctx.scale(scale, scale);

  // Stroke the M
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = STROKE_VB;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  traceMPath(ctx);
  ctx.stroke();

  // Halo cutout matching the header logo: parchment circle, then gold dot.
  // On the dark icon background this reads as a small contrasting jewel.
  ctx.fillStyle = PARCHMENT;
  ctx.beginPath();
  ctx.arc(44, 38, DOT_OUTER_R, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(44, 38, DOT_INNER_R, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  return canvas.toBuffer('image/png');
}

function main() {
  const outDir = path.join(__dirname, '..', 'public', 'icons');
  fs.mkdirSync(outDir, { recursive: true });

  for (const size of [192, 512]) {
    const buf = renderIcon(size);
    const file = path.join(outDir, `icon-${size}.png`);
    fs.writeFileSync(file, buf);
    console.log(`Wrote ${path.relative(process.cwd(), file)} (${buf.length} bytes)`);
  }
}

main();
