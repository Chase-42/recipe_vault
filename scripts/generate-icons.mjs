import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');
const svg = readFileSync(join(publicDir, 'recipe_vault_image.svg'));

const icons = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

for (const { size, name } of icons) {
  const padding = Math.round(size * 0.18);
  const innerSize = size - padding * 2;

  const iconBuffer = await sharp(svg)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: iconBuffer, gravity: 'center' }])
    .png()
    .toFile(join(publicDir, name));

  console.log(`✓ ${name}`);
}
