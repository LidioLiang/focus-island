import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const master = path.join(root, 'src/app-icon/focus-isle-1024.png');
const png = await readFile(master);
if (png.toString('hex', 0, 8) !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== 1024 || png.readUInt32BE(20) !== 1024 || png[25] !== 2) {
  throw new Error('App icon must be a 1024 × 1024 opaque RGB PNG.');
}
const ios = path.join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
await mkdir(ios, { recursive: true });
await copyFile(master, path.join(ios, 'AppIcon-512@2x.png'));
await writeFile(path.join(ios, 'Contents.json'), JSON.stringify({ images: [{ filename: 'AppIcon-512@2x.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }], info: { author: 'xcode', version: 1 } }, null, 2) + '\n');

// Prepared for a future macOS target; the current project contains only iOS/iPadOS.
const mac = path.join(root, 'src/app-icon/macos/AppIcon.appiconset');
const iconset = path.join(root, 'src/app-icon/macos/FocusIsle.iconset');
await mkdir(mac, { recursive: true });
await mkdir(iconset, { recursive: true });
const images = [];
for (const size of [16, 32, 128, 256, 512]) {
  for (const scale of [1, 2]) {
    const filename = `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`;
    const target = path.join(mac, filename);
    const result = spawnSync('/usr/bin/sips', ['-z', String(size * scale), String(size * scale), master, '--out', target], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || 'Icon resize failed');
    await copyFile(target, path.join(iconset, filename));
    images.push({ filename, idiom: 'mac', size: `${size}x${size}`, scale: `${scale}x` });
  }
}
await writeFile(path.join(mac, 'Contents.json'), JSON.stringify({ images, info: { author: 'xcode', version: 1 } }, null, 2) + '\n');
// ICNS stores the same PNG bytes in typed blocks; no second artwork rendering.
const types = ['icp4', 'ic11', 'icp5', 'ic12', 'ic07', 'ic13', 'ic08', 'ic14', 'ic09', 'ic10'];
const blocks = await Promise.all(images.map(async (entry, i) => {
  const data = await readFile(path.join(mac, entry.filename));
  const header = Buffer.alloc(8);
  header.write(types[i], 0, 'ascii');
  header.writeUInt32BE(data.length + 8, 4);
  return Buffer.concat([header, data]);
}));
const header = Buffer.alloc(8);
header.write('icns', 0, 'ascii');
header.writeUInt32BE(8 + blocks.reduce((sum, block) => sum + block.length, 0), 4);
await writeFile(path.join(root, 'src/app-icon/macos/FocusIsle.icns'), Buffer.concat([header, ...blocks]));
console.log('Updated universal iPhone/iPad icon; exported macOS asset catalog and ICNS (no macOS app target yet).');
