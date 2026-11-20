// The pinned minimal UI uses catalog scenes, four profile portraits and three island views.
// Legacy furniture layers and sprite sheets stay in the web repository, outside the iOS bundle.
export function selectAssets({ catalog, minimalSource, appSource, styles }) {
  const assets = new Set();
  function add(value) {
    if (!value.startsWith('/assets/') || value.includes('..') || /[?#]/.test(value)) throw new Error(`Unsafe packaged asset: ${value}`);
    assets.add(value.slice('/assets/'.length));
  }
  function visit(value) {
    if (typeof value === 'string' && value.startsWith('/assets/')) add(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  }
  visit(catalog);
  const island = [...minimalSource.matchAll(/const MINIMAL_ISLAND_(?:IMAGE|WIDE|PORTRAIT) = "(\/assets\/[^"\n]+)";/g)];
  if (island.length !== 3) throw new Error('Island asset declarations changed; review the mobile asset selector.');
  island.forEach(match => add(match[1]));
  const avatars = appSource.match(/const AVATAR_OPTIONS = \[([\s\S]*?)\n\];/);
  if (!avatars) throw new Error('Avatar declarations missing.');
  const portraits = [...avatars[1].matchAll(/\$\{ASSET_BASE\}([^`]+)`/g)];
  if (portraits.length !== 4) throw new Error('Avatar asset count changed; review the mobile asset selector.');
  portraits.forEach(match => add('/assets/' + match[1]));
  for (const css of styles) for (const match of css.matchAll(/url\(["']?(\.?\/assets\/[^"')]+)["']?\)/g)) add(match[1].replace(/^\.\//, '/'));
  return [...assets].sort();
}
