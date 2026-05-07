// One-off script: convert source PNGs in repo root to optimized WebPs under public/images/.
// Run with: npm run convert-images
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'public', 'images');
await mkdir(outDir, { recursive: true });

const jobs = [
  { src: 'image 1.1.png',   dest: 'shot-1-door-closed.webp' },
  { src: 'Image 2 TB.png',  dest: 'shot-2-interior.webp' },
  { src: 'Image 3 TB.png',  dest: 'shot-3-bowl.webp' },
];

for (const { src, dest } of jobs) {
  const srcPath = path.join(root, src);
  const destPath = path.join(outDir, dest);
  if (!existsSync(srcPath)) {
    console.warn(`skip: ${src} not found`);
    continue;
  }
  await sharp(srcPath)
    .resize({ width: 1280, withoutEnlargement: true })
    .webp({ quality: 85, effort: 5 })
    .toFile(destPath);
  console.log(`wrote ${path.relative(root, destPath)}`);
}
