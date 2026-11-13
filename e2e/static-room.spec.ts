import { expect, test } from "@playwright/test";

test("the cafe opens with only real occupants and an upright portrait appears above the selected seat", async ({ page }) => {
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
  await expect(page.locator('[data-place="cafe"]')).toBeVisible();
  await page.locator('[data-place="cafe"]').click();

  await expect(page.locator(".static-seat-room")).toBeVisible();
  await expect(page.locator(".avatar-marker")).toHaveCount(0);
  await expect(page.locator("button.seat.available")).toHaveCount(6);
  await page.locator("button.seat.available").first().click();
  await expect(page.locator('[data-session-clock]')).toBeVisible();
  await page.locator('[data-minimal="back-room"]').click();
  await expect(page.locator('.avatar-marker.is-mine')).toHaveCount(1);
  await expect(page.locator('.static-seat-occupant')).toHaveCount(0);
  for (let refresh = 0; refresh < 3; refresh += 1) {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("focus-island:room-change", { detail: { roomId: "cafe-01" } })));
    await page.waitForTimeout(80);
  }

  const userAvatar = page.locator(".avatar-marker.is-mine");
  await expect(userAvatar).toHaveCount(1);
  expect(await userAvatar.evaluate((element) => ({
    animations: element.getAnimations().length,
    opacity: getComputedStyle(element).opacity,
  }))).toEqual({ animations: 0, opacity: "1" });
});

test("an expired background lease silently recovers or moves seats without resetting focus time", async ({ page }) => {
  const sessionId = "7d813b27-a6a8-46b8-9d31-5f9df8c1907e";
  const startedAt = Date.now() - 42 * 60_000;
  let resumePayload: Record<string, unknown> | null = null;

  await page.addInitScript(({ sessionId: seededSessionId, startedAt: seededStartedAt }) => {
    localStorage.setItem("focusIslandGuestIdentityV2", JSON.stringify({
      guestId: "e2423fbb-03a8-4430-80d1-ae035dbb53b5",
      sessionId: seededSessionId,
      displayName: "Quiet Otter",
      avatarSkin: 1,
    }));
    localStorage.setItem("focusIslandHistoryGuestV2", "local:test-guest");
    localStorage.setItem("focusIslandActiveSessionV1", JSON.stringify({
      ownerUserId: "room-test-user",
      sceneId: "cafe",
      roomId: "cafe-01",
      localRoom: false,
      selectedSeat: 0,
      timerMode: 50,
      durationSeconds: 3000,
      remainingSeconds: 500,
      elapsedSeconds: 2500,
      isRunning: true,
      sessionPhase: "focus",
      restDurationSeconds: 300,
      restRemainingSeconds: 300,
      restStartedAt: null,
      nextFocusMode: 50,
      sessionStartedAt: seededStartedAt,
      cloudFocusClientId: "focus-test-session",
      companions: 6,
      focusImageChoice: "window",
      sounds: { ambient: false, white: false, music: false },
      musicTrack: "rainy-notes",
      soundVolumes: { ambient: 55, white: 30, music: 24 },
      savedAt: Date.now(),
    }));
  }, { sessionId, startedAt });

  await page.route("**/api/sessions/*/heartbeat", (route) => route.fulfill({
    status: 409,
    contentType: "application/json",
    body: JSON.stringify({ error: "session_expired" }),
  }));
  await page.route("**/api/sessions/*/resume", async (route) => {
    resumePayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, recovered: true, moved: true, roomId: "cafe-02", seatId: 4 }),
    });
  });
  await page.route("**/api/rooms/cafe-02/state", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      leases: [{
        roomId: "cafe-02",
        seatId: 4,
        sessionId,
        displayName: "Quiet Otter",
        avatarSkin: 1,
        memberType: "human",
        state: "occupied",
        activity: "专注计时中",
        focusStartedAt: startedAt,
      }],
      serverNow: Date.now(),
    }),
  }));

  await page.goto("/");
  await expect.poll(() => resumePayload).not.toBeNull();
  expect(resumePayload).toMatchObject({
    preferredRoomId: "cafe-01",
    preferredSeatId: 1,
    focusing: true,
    focusStartedAt: startedAt,
  });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("focusIslandActiveSessionV1") || "null"));
  expect(saved).toMatchObject({ roomId: "cafe-02", selectedSeat: 3, sessionStartedAt: startedAt });
  await expect(page.getByText("座位连接已过期，请重新选座")).toHaveCount(0);
});
