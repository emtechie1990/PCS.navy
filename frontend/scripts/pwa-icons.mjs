// Renders every PWA icon for all three brands from the SVG marks in components/Brand.tsx.
//   cd frontend && npm run icons   -> public/brand/<brand>/icons/icon-*.png + maskable-*.png
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "brand");
const SIZES = [16, 32, 48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512];

const BRANDS = {
  army: { primary: "#4B5320", accent: "#C8A951", paper: "#F5F4F0", base: "#23261A", camo: ["#4B5320", "#81613C", "#1A1A1A", "#8A8F5E"], logo: "shield" },
  navy: { primary: "#0B1F3A", accent: "#C5A253", paper: "#F6F5F1", base: "#0D1B30", camo: ["#264678", "#506E96", "#060C18", "#788CAA"], logo: "anchor" },
  airforce: { primary: "#00308F", accent: "#FFC72C", paper: "#F4F6F9", base: "#141E33", camo: ["#5D8AA8", "#A7A9AC", "#0B1426", "#00308F"], logo: "wings" },
};

const MARK = {
  shield: (b) => `<svg viewBox="0 0 40 46" xmlns="http://www.w3.org/2000/svg">
<path d="M20 1 L38 7 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V7 Z" fill="${b.primary}" stroke="${b.accent}" stroke-width="2"/>
<path d="M20 5.5 L34 10.2 V22 C34 31.5 27.8 37.4 20 40.6 C12.2 37.4 6 31.5 6 22 V10.2 Z" fill="none" stroke="${b.accent}" stroke-opacity=".45" stroke-width=".8"/>
<polygon points="20,11 22.6,18.2 30.2,18.4 24.2,23 26.4,30.2 20,26 13.6,30.2 15.8,23 9.8,18.4 17.4,18.2" fill="${b.accent}"/>
<path d="M11 34 L20 29.5 L29 34" fill="none" stroke="${b.paper}" stroke-width="2" stroke-linecap="square"/></svg>`,
  anchor: (b) => `<svg viewBox="0 0 40 46" xmlns="http://www.w3.org/2000/svg">
<path d="M20 1 L38 7 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V7 Z" fill="${b.primary}" stroke="${b.accent}" stroke-width="2"/>
<circle cx="20" cy="11" r="3" fill="none" stroke="${b.accent}" stroke-width="2"/>
<path d="M20 14 V36 M13 19 H27 M9 27 C10 33 15 36 20 36 C25 36 30 33 31 27" fill="none" stroke="${b.accent}" stroke-width="2.2" stroke-linecap="round"/>
<path d="M6 27 L9 24 L12 27 M28 27 L31 24 L34 27" fill="none" stroke="${b.accent}" stroke-width="2" stroke-linecap="round"/></svg>`,
  wings: (b) => `<svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg">
<path d="M32 4 L2 14 L14 18 L4 24 L20 24 L32 36 L44 24 L60 24 L50 18 L62 14 Z" fill="${b.primary}" stroke="${b.accent}" stroke-width="1.6" stroke-linejoin="round"/>
<polygon points="32,10 34.4,16.8 41.6,17 35.9,21.4 38,28.2 32,24.2 26,28.2 28.1,21.4 22.4,17 29.6,16.8" fill="${b.accent}"/></svg>`,
};

// Digital-camo tile + radial veil, then the mark; `maskable` keeps the mark inside the 80% safe zone.
function icon(b, maskable) {
  const [c1, c2, c3, c4] = b.camo;
  const size = maskable ? 290 : 380;
  const m = MARK[b.logo](b).replace("<svg ", `<svg x="${(512 - size) / 2}" y="${(512 - size) / 2}" width="${size}" height="${size}" `);
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
