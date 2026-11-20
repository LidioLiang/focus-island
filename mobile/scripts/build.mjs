import { readFile, writeFile, mkdir, readdir, lstat, cp, rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { selectAssets } from './select-assets.mjs';

export const mobileRoot = fileURLToPath(new URL('..', import.meta.url));
const sourceRoot = path.resolve(mobileRoot, '..');
const hash = (buffer, algorithm = 'sha256') => createHash(algorithm).update(buffer).digest('hex');
export function gitBlobHash(buffer) {
  return hash(Buffer.concat([Buffer.from(`blob ${buffer.length}\0`), buffer]), 'sha1');
}

export async function verifyBaseline(root, baseline) {
  for (const [name, expected] of Object.entries(baseline.files)) {
    if (path.isAbsolute(name) || name.split('/').includes('..')) throw new Error(`Unsafe source path: ${name}`);
    const actual = gitBlobHash(await readFile(path.join(root, name)));
    if (actual !== expected) throw new Error(`Production baseline mismatch: ${name}. Expected ${expected}, got ${actual}.`);
  }
}

async function inventory(root, dir = '') {
  const result = [];
  for (const entry of (await readdir(path.join(root, dir), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not bundled: ${relative}`);
    if (entry.isDirectory()) result.push(...await inventory(root, relative));
    else if (entry.isFile()) result.push(relative);
  }
  return result;
}

export async function build() {
  const channel = process.env.FOCUS_IOS_CHANNEL || 'offline-alpha';
  if (!['offline-alpha', 'online-beta'].includes(channel)) throw new Error('Unknown mobile channel');
  const baseline = JSON.parse(await readFile(path.join(mobileRoot, 'baseline.json')));
  await verifyBaseline(sourceRoot, baseline);
  const cap = JSON.parse(await readFile(path.join(mobileRoot, 'capacitor.config.json')));
  if (cap.server || cap.webDir !== 'dist') throw new Error('Mobile build must use local dist, without remote server configuration.');
  const output = path.join(mobileRoot, 'dist');
  const staging = path.join(mobileRoot, `.dist-${process.pid}`);
  await mkdir(staging, { recursive: false });
  try {
    // Only explicitly verified web source is copied; no Next server, env files or Godot exports.
    for (const name of Object.keys(baseline.files).filter(name => name.startsWith('public/'))) {
      const target = path.join(staging, name.slice('public/'.length));
      await mkdir(path.dirname(target), { recursive: true });
      await cp(path.join(sourceRoot, name), target);
    }
    const assetRoot = path.join(sourceRoot, 'public/assets');
    const catalog = JSON.parse(await readFile(path.join(sourceRoot, 'lib/scene-catalog.json')));
    const assetNames = selectAssets({
      catalog,
      minimalSource: await readFile(path.join(staging, 'minimal-mvp.js'), 'utf8'),
      appSource: await readFile(path.join(staging, 'app.js'), 'utf8'),
      styles: await Promise.all(['styles.css', 'landing-final.css', 'minimal-mvp.css', 'account-center.css'].map(name => readFile(path.join(staging, name), 'utf8')))
    });
    for (const name of assetNames) {
      if (!(await lstat(path.join(assetRoot, name))).isFile()) throw new Error(`Not a regular asset file: ${name}`);
      const target = path.join(staging, 'assets', name);
      await mkdir(path.dirname(target), { recursive: true });
      await cp(path.join(assetRoot, name), target);
    }
    // Production serves music from Storage; the iOS package needs real local bytes.
    // Explicit asset directory only: no server env files or service credentials are read.
    const musicRoot = process.env.FOCUS_IOS_MUSIC_DIR || path.resolve(sourceRoot, '../archive/assets/focus-audio-v1.0.0');
    const music = JSON.parse(await readFile(path.join(mobileRoot, 'music-assets.json')));
    await mkdir(path.join(staging, 'assets/audio'), { recursive: true });
    for (const [name, expected] of Object.entries(music)) {
      if (!/^20261028-focus-music-[a-z-]+\.mp3$/.test(name)) throw new Error(`Unexpected music path: ${name}`);
      const source = path.join(musicRoot, name);
      if (hash(await readFile(source)) !== expected) throw new Error(`Music hash mismatch: ${name}`);
      await cp(source, path.join(staging, 'assets/audio', name));
    }
    for (const name of ['mobile.css', 'mobile-runtime.js', 'mobile-online.js', 'scene-rotation.js', 'mobile-experience.js']) await cp(path.join(mobileRoot, 'src', name), path.join(staging, name));
    // One continuous panorama per scene; never overlay the old central image.
    await mkdir(path.join(staging, 'assets/landscape'), { recursive: true });
    const panoramas = [
      ...['room', 'window', 'bar', 'lounge', 'mist', 'snow', 'clearing'].map(name => `cafe-${name}`),
      ...['room', 'window', 'reading', 'alcove'].map(name => `library-${name}`),
      ...['room', 'root', 'deep', 'fern', 'sun', 'mist'].map(name => `forest-${name}`)
    ];
    for (const name of panoramas) {
      await cp(path.join(mobileRoot, 'src/landscape', `${name}.png`), path.join(staging, 'assets/landscape', `${name}.png`));
    }
    const config = {
      minimalMvp: true,
      appVersion: `${baseline.version}-ios-alpha.8`,
      sceneCatalog: catalog,
      supabaseUrl: '', audioBaseUrl: '', turnstileSiteKey: '',
      release: { version: baseline.version, environment: 'ios-offline-alpha', commit: baseline.commit },
      mobile: { channel, networkEnabled: channel === 'online-beta' }
    };
    // Require all scene images/audio to be present before replacing an existing successful build.
    for (const scene of Object.values(config.sceneCatalog)) {
      const assets = [scene.roomImage, scene.ambientAsset, ...scene.focusViews.flatMap(view => [view.image, view.thumbnail])].filter(Boolean);
      for (const asset of assets) {
        if (!asset.startsWith('/assets/') || asset.includes('..')) throw new Error(`Unexpected scene asset: ${asset}`);
        if (!(await lstat(path.join(staging, asset.slice(1)))).isFile()) throw new Error(`Missing scene asset: ${asset}`);
      }
    }
    await writeFile(path.join(staging, 'mobile-config.js'), `window.__FOCUS_ISLAND_CONFIG__=${JSON.stringify(config).replace(/</g, '\\u003c')};\nwindow.__FOCUS_ANALYTICS_CONFIG__={projectToken:'',apiHost:'',environment:'ios-offline-alpha'};\n`);
    const scripts = ['mobile-config.js', 'mobile-runtime.js', 'mobile-online.js', 'analytics.js', 'vendor/i18next.min.js', 'locales/en.js', 'focus-history.js', 'account-center.js', 'scene-runtime.js', 'minimal-mvp.js', 'app.js', 'scene-rotation.js', 'mobile-experience.js', 'i18n.js'];
    const styles = ['styles.css', 'landing-final.css', 'minimal-mvp.css', 'account-center.css', 'mobile.css'];
    await writeFile(path.join(staging, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'">
<meta name="theme-color" content="#f4f8fb"><title>Focus Isle</title>
${styles.map(name => `<link rel="stylesheet" href="./${name}">`).join('\n')}
</head><body><main id="app" aria-live="polite"></main>
<dialog id="mobile-notice" aria-labelledby="mobile-notice-title"><h2 id="mobile-notice-title">Offline preview</h2><p id="mobile-notice-message"></p><form method="dialog"><button autofocus>Continue</button></form></dialog>
${scripts.map(name => `<script src="./${name}"></script>`).join('\n')}
</body></html>\n`);
    const files = {};
    let bytes = 0;
    for (const name of await inventory(staging)) {
      const buffer = await readFile(path.join(staging, name));
      files[name] = { bytes: buffer.length, sha256: hash(buffer) }; bytes += buffer.length;
    }
    await writeFile(path.join(staging, 'bundle-manifest.json'), JSON.stringify({
      channel, releaseReady: false,
      sourceCommit: baseline.commit, sourceVersion: baseline.version,
      assetSelection: 'Catalog scenes, pinned minimal island views, avatar portraits and stylesheet assets; music copied separately.',
      provenance: 'Scripts and styles verified against GitHub blobs; asset hashes describe local snapshot, not remote verification.',
      bytes, files
    }, null, 2) + '\n');
    await rm(output, { recursive: true, force: true });
    await rename(staging, output);
    console.log(`Built offline alpha: ${Object.keys(files).length} files, ${(bytes / 1024 / 1024).toFixed(1)} MiB. NOT an App Store build.`);
    return { output, bytes, files };
  } catch (error) { await rm(staging, { recursive: true, force: true }); throw error; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
