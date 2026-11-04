import assert from "node:assert/strict";
import test from "node:test";

import { assertStripeKeyMatchesDeployment, canonicalApplicationOrigin } from "../lib/deployment-safety.ts";

test("Preview and local deployments accept only Stripe Test keys", () => {
  assert.doesNotThrow(() => assertStripeKeyMatchesDeployment("sk_test_example", { VERCEL_ENV: "preview" }));
  assert.doesNotThrow(() => assertStripeKeyMatchesDeployment("sk_test_example", {}));
  assert.throws(
    () => assertStripeKeyMatchesDeployment("sk_live_example", { VERCEL_ENV: "preview" }),
    /stripe_environment_mismatch/,
  );
});

test("Production accepts only Stripe Live keys", () => {
  assert.doesNotThrow(() => assertStripeKeyMatchesDeployment("sk_live_example", { VERCEL_ENV: "production" }));
  assert.throws(
    () => assertStripeKeyMatchesDeployment("sk_test_example", { VERCEL_ENV: "production" }),
    /stripe_environment_mismatch/,
  );
});

test("Preview checkout always returns to the current Vercel deployment", () => {
  const origin = canonicalApplicationOrigin("https://ignored.example/checkout", {
    VERCEL_ENV: "preview",
    VERCEL_URL: "focus-island-preview.example.vercel.app",
    NEXT_PUBLIC_APP_URL: "https://focus-island-nine.vercel.app",
  });
  assert.equal(origin, "https://focus-island-preview.example.vercel.app");
});

test("Production checkout uses the configured canonical origin", () => {
  const origin = canonicalApplicationOrigin("https://ignored.example/checkout", {
    VERCEL_ENV: "production",
    NEXT_PUBLIC_APP_URL: "https://focus-island-nine.vercel.app/path",
  });
  assert.equal(origin, "https://focus-island-nine.vercel.app");
});

test("Local checkout allows localhost but deployed origins require HTTPS", () => {
  assert.equal(canonicalApplicationOrigin("http://localhost:5173/api/billing/checkout", {}), "http://localhost:5173");
  assert.throws(
    () => canonicalApplicationOrigin("http://localhost:5173/api/billing/checkout", {
      VERCEL_ENV: "production",
      NEXT_PUBLIC_APP_URL: "http://focus-island.example",
    }),
    /application_url_not_secure/,
  );
});
