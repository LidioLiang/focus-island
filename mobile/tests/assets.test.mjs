import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectAssets } from '../scripts/select-assets.mjs';
const read = name => readFile(new URL('../../' + name, import.meta.url), 'utf8');
const input = {
  catalog: JSON.parse(await read('lib/scene-catalog.json')),
  minimalSource: await read('public/minimal-mvp.js'),
  appSource: await read('public/app.js'),
  styles: await Promise.all(['styles.css', 'landing-final.css', 'minimal-mvp.css', 'account-center.css'].map(name => read('public/' + name)))
};
test('asset selection preserves all current rooms and views while excluding historical sprite sheets', () => {
  const selected = selectAssets(input);
  for (const scene of Object.values(input.catalog)) {
    for (const asset of [scene.roomImage, scene.ambientAsset, ...scene.focusViews.flatMap(view => [view.image, view.thumbnail])].filter(Boolean)) assert.ok(selected.includes(asset.slice('/assets/'.length)), asset);
  }
  assert.equal(selected.filter(name => name.includes('profile-avatar-')).length, 4);
  for (const name of selected) assert.doesNotMatch(name, /idle-sheet|occupied-idle|chair-cropped|\.pck$|\.wasm$/);
  assert.equal(new Set(selected).size, selected.length);
});
test('asset selector stops on changed source declarations or unsafe catalog paths', () => {
  assert.throws(() => selectAssets({ ...input, minimalSource: '' }), /Island asset declarations changed/);
  assert.throws(() => selectAssets({ ...input, appSource: '' }), /Avatar declarations missing/);
  assert.throws(() => selectAssets({ ...input, catalog: { image: '/assets/../../secret' } }), /Unsafe packaged asset/);
});
