import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { MARKETING_PATHS, websiteDestination } from "../lib/marketing-routes.ts";

test("marketing pages, app and APIs have separate destinations", () => {
  const resolve = (p: string) => websiteDestination(new URL(p, "https://focusisle.online"));
  assert.deepEqual(resolve("/app?utm_source=x"), { app: true });
  assert.deepEqual(resolve("/api/auth/session"), {});
  assert.deepEqual(resolve("/auth/callback?code=private"), {});
  assert.deepEqual(resolve("/privacy"), {});
  assert.deepEqual(resolve("/not-a-real-page"), {});
  assert.deepEqual(resolve("/blog/"), { rewrite: "/_website/blog/index.html" });
  assert.deepEqual(resolve("/?utm_source=google"), { rewrite: "/_website/index.html" });
  for (const route of MARKETING_PATHS) assert.ok(resolve(route).rewrite);
});

test("legacy auth, recovery, payment and invite links reach the app without losing parameters", () => {
  for (const query of ["account=profile&merged-from=guest", "account=reset-password", "auth=reset-password&code=private&sb_flow_id=flow", "billing=success", "lifetime_invite=test-token", "account-error=sign_in_failed"]) {
    assert.deepEqual(websiteDestination(new URL("https://focusisle.online/?"+query)), {redirect:"/app?"+query});
  }
});

test("published pages provide indexable content, contact address, and same-origin app links", async () => {
  for (const route of MARKETING_PATHS) {
    const file=new URL("../public/_website"+(route==="/"?"":route)+"/index.html",import.meta.url);
    const html=await readFile(file,"utf8");
    assert.match(html, /content="index,follow"/);
    assert.match(html, /href="\/app"/);
    assert.doesNotMatch(html, /Website preview|preview-ribbon|href="https:\/\/focusisle.online\/app"/);
    assert.match(html, /<h1[ >]/);
  }
  const contact=await readFile(new URL("../public/_website/contact/index.html",import.meta.url),"utf8");
  assert.match(contact, /mailto:support@nisoniy.com/);
  const sitemap=await readFile(new URL("../public/_website/sitemap.xml",import.meta.url),"utf8");
  assert.equal((sitemap.match(/<url>/g)||[]).length,12);
  assert.doesNotMatch(sitemap, /<loc>[^<]*\/app<\/loc>/);
});
