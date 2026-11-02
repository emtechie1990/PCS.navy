// Renders every PWA icon for all three brands from the SVG marks in components/Brand.tsx.
//   cd frontend && npm run icons   -> public/brand/<brand>/icons/icon-*.png + maskable-*.png
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "brand");
const SIZES = [16, 32, 48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512];

const BRANDS = {
  army: { primary: "#4B5320", accent: "#C8A951", base: "#23261A", camo: ["#4B5320", "#81613C", "#1A1A1A", "#8A8F5E"] },
  navy: { primary: "#0B1F3A", accent: "#C5A253", base: "#0D1B30", camo: ["#264678", "#506E96", "#060C18", "#788CAA"] },
  airforce: { primary: "#00308F", accent: "#FFC72C", base: "#141E33", camo: ["#5D8AA8", "#A7A9AC", "#0B1426", "#00308F"] },
};

// Shared mark (components/Brand.tsx): black shield, gold star with the arrow inside.
const MARK = `<svg viewBox="0 0 40 46" xmlns="http://www.w3.org/2000/svg">
<path d="M20 1 L38 7 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V7 Z" fill="#1A1A1A" stroke="#C8A951" stroke-width="2"/>
<polygon points="20,10 22.8,17.6 30.8,17.8 24.4,22.7 26.7,30.4 20,25.8 13.3,30.4 15.6,22.7 9.2,17.8 17.2,17.6" fill="#C8A951"/>
<path d="M15 26.5 L20 20.5 L25 26.5" fill="none" stroke="#1A1A1A" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter"/></svg>`;

// Digital-camo tile + radial veil, then the mark; `maskable` keeps the mark inside the 80% safe zone.
function icon(b, maskable) {
  const [c1, c2, c3, c4] = b.camo;
  const size = maskable ? 290 : 380;
  const m = MARK.replace("<svg ", `<svg x="${(512 - size) / 2}" y="${(512 - size) / 2}" width="${size}" height="${size}" `);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs><pattern id="camo" width="96" height="72" patternUnits="userSpaceOnUse">
<rect width="96" height="72" fill="${b.base}"/><rect x="0" y="0" width="48" height="36" fill="${c1}" opacity=".55"/>
<rect x="40" y="28" width="56" height="30" fill="${c2}" opacity=".35"/><rect x="12" y="44" width="40" height="28" fill="${c3}" opacity=".55"/>
<rect x="60" y="4" width="36" height="26" fill="${c4}" opacity=".25"/></pattern>
<radialGradient id="veil" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="${b.primary}" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity=".45"/></filter></defs>
<rect width="512" height="512" fill="url(#camo)"/><rect width="512" height="512" fill="url(#veil)"/>
<g filter="url(#sh)">${m}</g></svg>`;
}

for (const [slug, b] of Object.entries(BRANDS)) {
  const dir = join(OUT, slug, "icons");
  mkdirSync(dir, { recursive: true });
  const base = sharp(Buffer.from(icon(b, false)));
  await Promise.all(SIZES.map((s) => base.clone().resize(s, s).png().toFile(join(dir, `icon-${s}.png`))));
  const mask = sharp(Buffer.from(icon(b, true)));
  await Promise.all([192, 512].map((s) => mask.clone().resize(s, s).png().toFile(join(dir, `maskable-${s}.png`))));
  console.log("icons:", slug);
}
