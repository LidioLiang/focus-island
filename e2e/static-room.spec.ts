import { expect, test } from "@playwright/test";

test("the cafe opens with two stable islanders and the user avatar never replays an entrance animation", async ({ page }) => {
  let occupied = false;
  let occupiedSeatId = 0;
  let identity: { sessionId: string; displayName: string; avatarSkin: number } | null = null;

  await page.route("**/api/access/status", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      authenticated: true,
      emailVerified: true,
      accountType: "permanent",
      trialStatus: "available",
      entitlementType: "none",
      subscriptionStatus: null,
      canEnterProduct: true,
      canStartFocus: true,
      offlineGraceUntil: null,
      paywallReason: null,
      developer: false,
    }),
  }));
  await page.route("**/api/auth/session", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ authenticated: true, anonymous: false, userId: "room-test-user", developer: false }),
  }));
  await page.route("**/api/scenes/cafe/allocate", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ roomId: "cafe-01", mode: "online" }),
  }));
  await page.route("**/api/rooms/cafe-01/state", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      leases: occupied && identity ? [{
        roomId: "cafe-01",
        seatId: occupiedSeatId,
        sessionId: identity.sessionId,
        displayName: identity.displayName,
        avatarSkin: identity.avatarSkin,
        memberType: "human",
        state: "occupied",
        activity: "已入座",
        focusStartedAt: null,
      }] : [],
      serverNow: Date.now(),
    }),
  }));
  await page.route("**/api/rooms/cafe-01/seats/*/reserve", async (route) => {
    const payload = route.request().postDataJSON() as { sessionId: string; displayName: string; avatarSkin: number };
    identity = payload;
    occupiedSeatId = Number(new URL(route.request().url()).pathname.split("/").at(-2));
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("**/api/sessions/*/occupy", async (route) => {
    const payload = route.request().postDataJSON() as { seatId: number };
    occupiedSeatId = payload.seatId;
    occupied = true;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("**/api/focus/sessions/start", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: "{}",
  }));

  await page.goto("/");
  await page.locator('[data-action="enter-island"]').first().click();
  await expect(page.locator('[data-scene="cafe"]')).toBeVisible();
  await page.locator('[data-scene="cafe"]').click();

  await expect(page.locator(".static-seat-room")).toBeVisible();
  await expect(page.locator(".static-seat-label.is-npc")).toHaveCount(2);
  await expect(page.locator(".static-seat-occupant")).toHaveCount(2);
  expect(await page.locator(".static-seat-occupant").evaluateAll((elements) =>
    elements.reduce((count, element) => count + element.getAnimations().length, 0)
  )).toBe(0);

  await page.locator("button.seat.available").first().click();
  await expect(page.locator(".static-seat-occupant.is-mine")).toHaveCount(1);
  await expect(page.locator(".static-seat-label.is-npc")).toHaveCount(2);

  for (let refresh = 0; refresh < 3; refresh += 1) {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("focus-island:room-change", { detail: { roomId: "cafe-01" } })));
    await page.waitForTimeout(80);
  }

  const userAvatar = page.locator(".static-seat-occupant.is-mine");
  await expect(userAvatar).toHaveCount(1);
  expect(await userAvatar.evaluate((element) => ({
    animations: element.getAnimations().length,
    opacity: getComputedStyle(element).opacity,
  }))).toEqual({ animations: 0, opacity: "1" });
});
