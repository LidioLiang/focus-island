import { expect, test, type Page } from "@playwright/test";
import packageJson from "../package.json";

async function openDeveloper(page: Page, developer = true) {
  await page.addInitScript(() => localStorage.setItem("focusIslandPreferencesV1", JSON.stringify({ language: "en", reduceMotion: true })));
  await page.route("**/api/access/status", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    authenticated: true, emailVerified: true, accountType: "permanent", canEnterProduct: true, canStartFocus: true, entitlementType: "admin", developer,
  }) }));
  await page.route("**/api/auth/session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: true, anonymous: false, userId: "developer-test", developer }) }));
  await page.goto("/?roomRenderer=godot3d");
  await expect(page.locator('[data-place="cafe"]')).toBeVisible();
  await page.locator('[data-panel="settings"]').click();
  if (developer) await page.locator('[data-minimal="developer"]').click();
}

test("developer console shows live rooms in English and confirms the exact leftover session before ending it", async ({ page }) => {
  let ended = false;
  const updates: string[] = [];
  await page.route("**/api/developer/diagnostics", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    version: packageJson.version, checkedAt: new Date().toISOString(),
    activeSessions: ended ? [] : [{ client_session_id: "old-test-session", status: "running", timer_mode: 25, actual_seconds: 120 }],
    rooms: ["cafe-01", "cafe-02", "cafe-03"].map((roomId) => ({ roomId, capacity: 6, occupied: 1, available: true,
      seats: Array.from({ length: 6 }, (_, i) => ({ seatId: i + 1, state: i === 2 ? "occupied" : "available", mine: i === 2 })),
    })),
  }) }));
  await page.route("**/api/focus/sessions/old-test-session", async (route) => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postDataJSON()).toMatchObject({ status: "interrupted", actualSeconds: 120 });
    updates.push(route.request().url()); ended = true;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await openDeveloper(page);
  const consolePanel = page.locator('[data-developer-tools-version="2.1"]');
  await expect(consolePanel).toBeVisible();
  await expect(consolePanel.locator("[data-developer-room]")).toHaveCount(3);
  await expect(consolePanel.locator(".developer-seat")).toHaveCount(18);
  await expect(consolePanel).toContainText(packageJson.version);
  expect(await consolePanel.innerText()).not.toMatch(/[\u4e00-\u9fff]/);
  await page.locator('[data-confirm-profile="developer-end-focus"]').click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  expect(updates).toHaveLength(0);
  await page.locator('[data-action="cancel-profile-confirm"]').click();
  expect(updates).toHaveLength(0);
  await page.locator('[data-confirm-profile="developer-end-focus"]').click();
  await page.locator('[data-action="execute-profile-confirm"]').click();
  await expect(page.locator("[data-developer-no-session]")).toBeVisible();
  expect(updates).toHaveLength(1);
});

test("ordinary accounts never see developer tools", async ({ page }) => {
  let diagnosticsCalls = 0;
  await page.route("**/api/developer/diagnostics", async (route) => { diagnosticsCalls++; await route.fulfill({ status: 403, body: "{}" }); });
  await openDeveloper(page, false);
  await expect(page.locator('[data-profile-tab="developer"]')).toHaveCount(0);
  expect(diagnosticsCalls).toBe(0);
});

test("historical Godot preference cannot change the shipped developer cafe entry", async ({ page }) => {
  const runtimeRequests: string[] = [];
  page.on("request", (request) => { if (/godot-room|\.wasm(?:\?|$)|\.pck(?:\?|$)/i.test(request.url())) runtimeRequests.push(request.url()); });
  await page.route("**/api/developer/diagnostics", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: packageJson.version, rooms: [], activeSessions: [] }) }));
  await page.route("**/api/scenes/cafe/allocate", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ roomId: "cafe-01", mode: "online" }) }));
  await page.route("**/api/rooms/cafe-01/state", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leases: [], serverNow: Date.now() }) }));
  await openDeveloper(page);
  await page.locator('[data-action="developer-enter-cafe"]').click();
  await expect(page.locator(".static-seat-room")).toBeVisible();
  expect(runtimeRequests).toEqual([]);
});
