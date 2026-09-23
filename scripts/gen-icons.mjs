import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const iconsDir = join(publicDir, "icons");
mkdirSync(iconsDir, { recursive: true });

function svgIcon({ size, padding = 0, background = "#0f172a" }) {
  const inner = size - padding * 2;
  const boothW = inner * 0.62;
  const boothH = inner * 0.4;
  const boothX = (size - boothW) / 2;
  const boothY = size * 0.3;
  const checkSize = inner * 0.16;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="${background}" />
  <rect x="${boothX}" y="${boothY}" width="${boothW}" height="${boothH}" rx="${size * 0.03}" fill="none" stroke="#22c55e" stroke-width="${size * 0.035}" />
  <line x1="${size * 0.5}" y1="${boothY}" x2="${size * 0.5}" y2="${size * 0.22}" stroke="#22c55e" stroke-width="${size * 0.035}" stroke-linecap="round" />
  <circle cx="${size * 0.32}" cy="${boothY + boothH + checkSize * 0.9}" r="${checkSize * 0.55}" fill="#22c55e" />
  <circle cx="${size * 0.5}" cy="${boothY + boothH + checkSize * 0.9}" r="${checkSize * 0.55}" fill="#38bdf8" />
  <circle cx="${size * 0.68}" cy="${boothY + boothH + checkSize * 0.9}" r="${checkSize * 0.55}" fill="#475569" />
</svg>`;
}

async function main() {
  // Favicon (transparent-ish simple mark, source SVG kept for crisp browser tab icon).
  writeFileSync(join(publicDir, "favicon.svg"), svgIcon({ size: 64 }).trim());

  const targets = [
    { file: "icons/icon-192.png", size: 192, padding: 0 },
    { file: "icons/icon-512.png", size: 512, padding: 0 },
    { file: "icons/icon-maskable-512.png", size: 512, padding: 64 },
    { file: "apple-touch-icon.png", size: 180, padding: 0 },
  ];

  for (const t of targets) {
    const svg = svgIcon({ size: t.size, padding: t.padding });
    await sharp(Buffer.from(svg)).png().toFile(join(publicDir, t.file));
    console.log("wrote", t.file);
  }
}

main();
