import { expect, test } from "@playwright/test";

async function seedFocus(page: import("@playwright/test").Page, running: boolean) {
  await page.addInitScript(({ running: active }) => {
    localStorage.setItem("focusIslandPreferencesV1", JSON.stringify({ language: "zh-CN", reduceMotion: true }));
    localStorage.setItem("focusIslandActiveSessionV1", JSON.stringify({
      sceneId: "cafe", roomId: "cafe-local", localRoom: true, selectedSeat: 0,
      timerMode: 25, durationSeconds: 1500, remainingSeconds: active ? 1380 : 1500,
      elapsedSeconds: active ? 120 : 0, isRunning: active, sessionPhase: "focus",
      sessionStartedAt: active ? Date.now() - 120000 : null,
      cloudFocusClientId: active ? "previous-session" : null,
      focusImageChoice: "window", savedAt: Date.now(),
    }));
  }, { running });
}

test("leaving an active room requires confirmation and closes its cloud session", async ({ page }) => {
  await seedFocus(page, true);
  const updates: Array<{ status: string; actualSeconds: number }> = [];
  await page.route("**/api/focus/sessions/previous-session", async (route) => {
    updates.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.goto("/");
  await page.locator(".immersive-timer").hover();
  await page.locator('[data-minimal="back-room"]').first().click();
  await expect(page.locator(".static-seat-room")).toBeVisible();
  await page.locator('[data-minimal="back-island"]').click();
  await expect(page.locator("#minimal-confirm-title")).toBeVisible();
  expect(updates).toHaveLength(0);
  await page.locator('[data-minimal="accept-confirm"]').click();
  await expect(page.locator('[data-place="cafe"]')).toBeVisible();
  expect(updates).toHaveLength(1);
  expect(updates[0]).toMatchObject({ status: "ended_early" });
  expect(updates[0].actualSeconds).toBeGreaterThanOrEqual(120);
  expect(await page.evaluate(() => localStorage.getItem("focusIslandActiveSessionV1"))).toBeNull();
});

test("a previous-session conflict offers recovery and can end the old session before a new start", async ({ page }) => {
  await seedFocus(page, false);
  const order: string[] = [];
  const previous = { client_session_id: "previous-session", status: "running", timer_mode: 25,
    planned_seconds: 1500, started_at: new Date(Date.now() - 120000).toISOString(),
    actual_seconds: 120, scene_id: "cafe", room_id: "cafe-local", seat_id: 1 };
  let ended = false;
  await page.route("**/api/focus/sessions/start", async (route) => {
    order.push("start");
    await route.fulfill({ status: ended ? 200 : 409, contentType: "application/json",
      body: JSON.stringify(ended ? { session: { status: "running" } } : { error: "active_session_exists" }) });
  });
  await page.route("**/api/focus/sessions?active=1", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ sessions: [previous] }),
  }));
  await page.route("**/api/focus/sessions/previous-session", async (route) => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postDataJSON().status).toBe("interrupted");
    order.push("end-previous");
    ended = true;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.goto("/");
  await page.locator(".immersive-timer").hover();
  await page.locator('[data-action="toggle-timer"]').click();
  await expect(page.locator("#focus-recovery-title")).toBeVisible();
  await expect(page.locator('[data-action="continue-previous-focus"]')).toBeVisible();
  await page.locator('[data-action="replace-previous-focus"]').click();
  await expect(page.locator("#focus-recovery-title")).toHaveCount(0);
  await expect.poll(() => order).toEqual(["start", "end-previous", "start"]);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("focusIslandActiveSessionV1") || "null")?.isRunning)).toBe(true);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("focusIslandActiveSessionV1") || "null"));
  expect(saved.isRunning).toBe(true);
  expect(saved.cloudFocusClientId).not.toBe("previous-session");
});
