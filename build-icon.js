const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const SVG_PATH = path.join(__dirname, 'icon.svg');
const ICO_PATH = path.join(__dirname, 'icon.ico');
const PNG_PATH = path.join(__dirname, 'icon.png');

async function build() {
  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = [];
  for (const size of sizes) {
    const buf = await sharp(SVG_PATH).resize(size, size).png().toBuffer();
    pngBuffers.push(buf);
  }
  const icoBuf = await toIco(pngBuffers);
  fs.writeFileSync(ICO_PATH, icoBuf);
  fs.writeFileSync(PNG_PATH, pngBuffers[0]); // 256x256
  console.log('Icon built: icon.ico (' + Math.round(icoBuf.length/1024) + 'KB) + icon.png');
}
build().catch(e => { console.error(e); process.exit(1); });
