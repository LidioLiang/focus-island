import { expect, test } from "@playwright/test";

const remoteGates = process.env.E2E_REMOTE_GATES === "1";
const billingExpectation = process.env.E2E_EXPECT_BILLING_CONFIGURED;

function captureHydrationErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    if (/hydration|server rendered text didn't match/i.test(error.message)) errors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration|server rendered text didn't match/i.test(message.text())) errors.push(message.text());
  });
  return errors;
}

test("landing page loads without requesting retired Godot runtime assets", async ({ page }) => {
  const retiredRuntimeRequests: string[] = [];
  const hydrationErrors = captureHydrationErrors(page);
  page.on("request", (request) => {
    if (/godot-room|\.wasm(?:\?|$)|\.pck(?:\?|$)/i.test(request.url())) retiredRuntimeRequests.push(request.url());
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/Focus Isle v1\.1/);
  await expect(page.locator("#welcome-title")).toBeVisible();
  await expect(page.locator('[data-action="enter-island"]').first()).toBeVisible();
  expect(retiredRuntimeRequests).toEqual([]);
  expect(hydrationErrors).toEqual([]);
});

test("an unauthenticated visitor is routed to the account gate", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-action="enter-island"]').first().click();
  await expect(page.locator('[role="dialog"][aria-labelledby="auth-title"]')).toBeVisible();
  await expect(page.locator('[data-auth-form] input[name="email"]')).toBeVisible();
  await expect(page.locator('[data-auth-form] input[name="password"]')).toBeVisible();
});

test("privacy and terms pages remain publicly reachable", async ({ page }) => {
  const hydrationErrors = captureHydrationErrors(page);
  await page.goto("/privacy");
  await expect(page.locator("main")).toBeVisible();
  await page.goto("/terms");
  await expect(page.locator("main")).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});

test("remote unauthenticated billing and unsigned webhook gates stay closed", async ({ request }) => {
  test.skip(!remoteGates, "Set E2E_REMOTE_GATES=1 only for an approved Preview or Production smoke run.");

  const checkout = await request.post("/api/billing/checkout", { data: { plan: "plus_monthly" } });
  expect(checkout.status()).toBe(401);
  await expect(checkout.json()).resolves.toMatchObject({ error: "registration_required" });

  const webhook = await request.post("/api/billing/webhook", { data: {} });
  expect(webhook.status()).toBe(401);
  await expect(webhook.json()).resolves.toMatchObject({ error: "invalid_signature" });
});

test("remote billing plans match the selected environment expectation", async ({ request }) => {
  test.skip(billingExpectation === undefined, "Set E2E_EXPECT_BILLING_CONFIGURED=true or false for a remote run.");

  const response = await request.get("/api/billing/plans");
  expect(response.ok()).toBeTruthy();
  const payload = await response.json() as { plans: Array<{ configured: boolean }> };
  expect(payload.plans).toHaveLength(3);
  expect(payload.plans.every((plan) => plan.configured)).toBe(billingExpectation === "true");
});
