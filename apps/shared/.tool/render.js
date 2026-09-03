const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const svg = fs.readFileSync(path.join(ROOT, "icon.svg"));

const outDir = (p) => { fs.mkdirSync(p, { recursive: true }); return p; };

async function run() {
  // master
  await sharp(svg, { density: 300 }).resize(1024, 1024).png().toFile(path.join(ROOT, "icon-1024.png"));

  // splash: icon centered on dark background (mobile splash)
  const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778">
    <rect width="1284" height="2778" fill="#07090f"/>
    <g transform="translate(392,1189)"><rect width="500" height="500" rx="113" fill="url(#g)"/>
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
    <path d="M250 104l30 85 85 30-85 30-30 85-30-85-85-30 85-30z" fill="#fff"/>
    <circle cx="359" cy="141" r="17" fill="#fff" opacity="0.9"/></g>
    <text x="642" y="1800" font-family="Segoe UI, Arial" font-size="96" font-weight="700" fill="#f8fafc" text-anchor="middle">SheetNative</text>
    <text x="642" y="1880" font-family="Segoe UI, Arial" font-size="44" fill="#818cf8" text-anchor="middle">Your business, as software</text>
  </svg>`;
  await sharp(Buffer.from(splashSvg)).png().toFile(path.join(ROOT, "splash-1284.png"));

  // small sizes for desktop
  for (const s of [512, 256, 64, 32]) {
    await sharp(svg, { density: 300 }).resize(s, s).png().toFile(path.join(outDir(path.join(ROOT, "desktop-build")), `icon-${s}.png`));
  }
  console.log("done");
}
run().catch((e) => { console.error(e); process.exit(1); });
