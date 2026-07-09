// Rasterizes the Sofra brand SVGs into the Expo asset PNGs and the native
// Android mipmap webp files. Node-only dev tool (not bundled into the app).
// Run: node scripts/gen-icons.js   (requires sharp as a devDependency)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const BRAND = path.join(ROOT, 'assets', 'brand');
const ASSETS = path.join(ROOT, 'assets');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

const read = (name) => fs.readFileSync(path.join(BRAND, name));
const full = read('icon_full.svg');
const round = read('icon_round.svg');
const fg = read('mark_cream.svg');
const splash = read('mark_terracotta.svg');

async function png(svg, size, out) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out);
  console.log('png', path.relative(ROOT, out), size);
}
async function webp(svg, size, out) {
  await sharp(svg, { density: 384 }).resize(size, size).webp({ lossless: true }).toFile(out);
  console.log('webp', path.relative(ROOT, out), size);
}

const LEGACY = { 'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96, 'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192 };
const FORE = { 'mipmap-mdpi': 108, 'mipmap-hdpi': 162, 'mipmap-xhdpi': 216, 'mipmap-xxhdpi': 324, 'mipmap-xxxhdpi': 432 };

(async () => {
  // Expo asset PNGs (used on future prebuilds / iOS / web)
  await png(full, 1024, path.join(ASSETS, 'icon.png'));
  await png(fg, 1024, path.join(ASSETS, 'adaptive-icon.png'));
  await png(splash, 1024, path.join(ASSETS, 'splash.png'));
  await png(full, 196, path.join(ASSETS, 'favicon.png'));

  // Native Android mipmaps (what the installed app actually shows)
  for (const [dir, size] of Object.entries(LEGACY)) {
    await webp(full, size, path.join(RES, dir, 'ic_launcher.webp'));
    await webp(round, size, path.join(RES, dir, 'ic_launcher_round.webp'));
  }
  for (const [dir, size] of Object.entries(FORE)) {
    await webp(fg, size, path.join(RES, dir, 'ic_launcher_foreground.webp'));
  }
  console.log('done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
