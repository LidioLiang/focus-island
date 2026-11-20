import { access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { build, mobileRoot } from './build.mjs';

const cli = path.join(mobileRoot, 'node_modules/@capacitor/cli/bin/capacitor');
try { await access(cli); } catch {
  console.error('Capacitor dependencies are missing. Run npm install in mobile/ on a machine with npm access, then npm run ios:prepare. No native project has been generated.');
  process.exit(1);
}
await build();
function cap(args) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: mobileRoot, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
let nativeExists = true;
try { await access(path.join(mobileRoot, 'ios/App/App.xcodeproj/project.pbxproj')); } catch { nativeExists = false; }
if (!nativeExists) cap(['add', 'ios']);
cap(['sync', 'ios']);
await import('./sync-app-icons.mjs');
console.log('Native project prepared. Open with npm run ios:open. Choose your Apple team, then verify on a real iPhone. Internal candidate only; complete device and StoreKit validation before App Store submission.');
