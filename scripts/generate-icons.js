// scripts/generate-icons.js
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

function buildIconSVG(size) {
  // The M mark from the spec, centered in a square.
  // Original M viewBox: 88x60. We scale it to ~70% of the icon width.
  const mWidth  = size * 0.70;
  const mHeight = mWidth * (60 / 88);
  const mScale  = mWidth / 88;
  const tx      = (size - mWidth)  / 2;
  const ty      = (size - mHeight) / 2;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#18160f"/>
  <g transform="translate(${tx}, ${ty}) scale(${mScale})">
    <path
      d="M 10 54 C 6 44 2 26 6 6 C 14 -4 32 0 38 16 C 42 28 42 36 44 38 C 46 36 46 28 52 16 C 58 0 76 -4 82 6 C 86 26 82 44 78 54"
      stroke="#c4a35a"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <circle cx="44" cy="38" r="6"   fill="#18160f"/>
    <circle cx="44" cy="38" r="4.5" fill="#c4a35a"/>
  </g>
</svg>`;
}

async function generateIcon(size) {
  const svg    = buildIconSVG(size);
  const resvg  = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const pngData = resvg.render();
  const buffer  = pngData.asPng();

  const outDir  = path.join(__dirname, '..', 'public', 'icons');
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated: ${outPath} (${buffer.length} bytes)`);
}

(async () => {
  await generateIcon(192);
  await generateIcon(512);
  console.log('Icons generated successfully.');
})();
