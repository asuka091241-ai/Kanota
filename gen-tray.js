const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const toIco = require('to-ico');

async function gen() {
  // Render SVG directly to 32x32 PNG (sharp preserves rounded rect transparency)
  const svgBuf = fs.readFileSync(path.join(__dirname, 'icon.svg'));
  const pngBuf = await sharp(svgBuf).resize(32, 32).png().toBuffer();

  fs.writeFileSync(path.join(__dirname, 'tray-icon.png'), pngBuf);

  // Convert to ICO with no extra scaling
  const icoBuf = await toIco(pngBuf, { resize: false });
  fs.writeFileSync(path.join(__dirname, 'tray-icon.ico'), icoBuf);

  console.log('done');
}
gen();
