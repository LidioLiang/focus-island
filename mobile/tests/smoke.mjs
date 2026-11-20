// Browser-level checks; these do NOT substitute for a real iPhone/WKWebView run.
import { chromium, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { build, mobileRoot } from '../scripts/build.mjs';

const { output } = await build();
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(output, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(output + path.sep)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(file); res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
let browser;
try {
  // Launch first: fail early when browser execution is unavailable.
  browser = await chromium.launch();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const results = path.join(mobileRoot, 'test-results'); await mkdir(results, { recursive: true });
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    for (const scene of ['cafe', 'library', 'forest']) {
      const context = await browser.newContext({ viewport, hasTouch: true });
      const page = await context.newPage();
      const errors = [], external = [], missing = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (!request.url().startsWith(origin)) external.push(request.url()); });
      page.on('response', response => { if (response.status() >= 400) missing.push(response.url()); });
      await page.goto(origin); await expect(page.locator('[data-place]')).toHaveCount(6);
      await page.locator(`[data-place="${scene}"]`).click();
      await expect(page.locator('.minimal-room-mode')).toHaveCount(0);
      await expect(page.locator('.mobile-alpha-label')).toHaveCount(0);
      await page.locator('button.seat.available').first().click();
      await expect(page.locator('[data-session-clock]')).toHaveText('25:00');
      await page.locator('.time-readout').click();
      await page.getByRole('button', { name: 'Start', exact: true }).click();
      await expect.poll(() => page.evaluate(() => state.isRunning)).toBe(true);
      await expect(page.locator('[data-session-clock]')).not.toHaveText('25:00');
      const start = await page.evaluate(() => ({startedAt: state.sessionStartedAt, elapsed: state.elapsedSeconds}));
      await page.getByRole('button', { name: 'Back to room', exact: true }).click();
      await expect(page.locator('.static-seat-room .mobile-focus-widget')).toBeVisible();
      await expect.poll(() => page.evaluate(() => state.elapsedSeconds)).toBeGreaterThan(start.elapsed);
      expect(await page.evaluate(() => state.sessionStartedAt)).toBe(start.startedAt);
      await expect.poll(() => page.locator('[data-mobile-music]').evaluate(a => a.paused)).toBe(false);
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Close settings', exact: true }).click();
      await page.getByRole('button', { name: 'Return to focus', exact: true }).click();
      expect(await page.evaluate(() => state.sessionStartedAt)).toBe(start.startedAt);
      await page.locator('.time-readout').click();
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      const paused = await page.locator('[data-session-clock]').textContent();
      await page.reload(); await expect(page.locator('[data-session-clock]')).toHaveText(paused);
      await expect.poll(() => page.evaluate(() => state.isRunning)).toBe(false);
      await page.locator('.time-readout').click();
      await page.locator('[data-action="toggle-timer"]').click();
      await expect.poll(() => page.evaluate(() => state.isRunning)).toBe(true);
      await page.reload();
      await expect.poll(() => page.evaluate(() => state.isRunning)).toBe(true);
      const resumed = await page.locator('[data-session-clock]').textContent();
      await expect(page.locator('[data-session-clock]')).not.toHaveText(resumed);
      await page.screenshot({ path: path.join(results, `${scene}-${viewport.width}.png`) });
      await page.locator('.time-readout').click();
      await page.locator('[data-minimal="end"]').click();
      await page.locator('[data-minimal="accept-confirm"]').click();
      await expect(page.locator('[data-minimal="again"]')).toBeVisible();
      expect(await page.evaluate(() => focusHistory.records().length)).toBe(1);
      await page.reload(); expect(await page.evaluate(() => focusHistory.records().length)).toBe(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]); expect(external).toEqual([]); expect(missing).toEqual([]);
      await context.close(); console.log(`PASS ${scene} ${viewport.width}x${viewport.height}: start, pause, restore, finish, local history, no external requests`);
    }
  }
} finally {
  await browser?.close();
  if (server.listening) await new Promise(resolve => server.close(resolve));
}
