import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { build, mobileRoot, verifyBaseline, gitBlobHash } from '../scripts/build.mjs';

await build();
const dist = path.join(mobileRoot, 'dist');
const manifest = JSON.parse(await readFile(path.join(dist, 'bundle-manifest.json')));

test('all packaged bytes match the manifest and all scripts parse', async () => {
  let bytes = 0;
  for (const [file, item] of Object.entries(manifest.files)) {
    const data = await readFile(path.join(dist, file)); bytes += data.length;
    assert.equal(data.length, item.bytes, file);
    assert.equal(createHash('sha256').update(data).digest('hex'), item.sha256, file);
    if (file.endsWith('.js')) new vm.Script(data.toString(), { filename: file });
  }
  assert.equal(bytes, manifest.bytes);
});

test('baseline guard fails on a changed file or unsafe path', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'focus-ios-baseline-'));
  try {
    const original = Buffer.from('const revision = 1;\n');
    await writeFile(path.join(root, 'app.js'), original);
    const baseline = { files: { 'app.js': gitBlobHash(original) } };
    await verifyBaseline(root, baseline);
    await writeFile(path.join(root, 'app.js'), 'const revision = 2;\n');
    await assert.rejects(verifyBaseline(root, baseline), /baseline mismatch/);
    await assert.rejects(verifyBaseline(root, { files: { '../secret': 'irrelevant' } }), /Unsafe source path/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('local entry point has all referenced scripts and styles, no remote scripts or server redirect', async () => {
  const html = await readFile(path.join(dist, 'index.html'), 'utf8');
  const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  assert.ok(urls.length > 10);
  for (const url of urls) {
    assert.ok(url.startsWith('./'), url);
    assert.ok(manifest.files[url.slice(2)], url);
  }
  assert.match(html, /connect-src 'self'/);
  const config = JSON.parse(await readFile(path.join(mobileRoot, 'capacitor.config.json')));
  assert.equal(config.webDir, 'dist'); assert.equal(config.server, undefined);
  assert.equal(manifest.releaseReady, false);
  for (const name of Object.keys(manifest.files)) assert.doesNotMatch(name, /(?:^|\/)(?:\.env|node_modules|godot-room)|\.(?:wasm|pck|pem|p8)$/i);
});

test('all three enabled scenes, desk images, thumbnails and local audio are bundled', async () => {
  const c = vm.createContext({ window: {} });
  vm.runInContext(await readFile(path.join(dist, 'mobile-config.js'), 'utf8'), c);
  const config = c.window.__FOCUS_ISLAND_CONFIG__;
  assert.deepEqual(Object.keys(config.sceneCatalog), ['cafe', 'library', 'forest']);
  assert.equal(config.mobile.networkEnabled, false); assert.equal(config.supabaseUrl, '');
  assert.equal(c.window.__FOCUS_ANALYTICS_CONFIG__.projectToken, '');
  for (const scene of Object.values(config.sceneCatalog)) {
    assert.equal(scene.enabled, true); assert.equal(scene.seats.length, 6);
    for (const name of [scene.roomImage, scene.ambientAsset, ...scene.focusViews.flatMap(view => [view.image, view.thumbnail])].filter(Boolean)) assert.ok(manifest.files[name.slice(1)], name);
  }
  assert.equal(Object.keys(manifest.files).filter(name => name.endsWith('.mp3')).length, 4);
});
