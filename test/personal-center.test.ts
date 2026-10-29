import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

test("personal center uses one persistent preferences store and a full-screen overlay", () => {
  assert.match(source, /preferences: "focusIslandPreferencesV1"/);
  assert.match(source, /function renderPersonalCenter\(\)/);
  assert.match(source, /className = "personal-center-overlay"/);
  assert.match(styles, /\.personal-center-overlay\s*\{[\s\S]*position: fixed;[\s\S]*z-index: 500/);
});

test("the four confirmed personal center sections are present", () => {
  const overlay = source.slice(source.indexOf("function renderPersonalCenter()"), source.indexOf("function personalCenterPrimaryAction"));
  for (const label of ["个人概览", "专注记录", "偏好设置", "账户与数据"]) assert.match(overlay, new RegExp(label));
});

test("opening personal center during focus preserves the active session", () => {
  const openFlow = source.slice(source.indexOf("function openPersonalCenter"), source.indexOf("function closePersonalCenter"));
  assert.match(openFlow, /syncTimerFromClock\(\)/);
  assert.match(openFlow, /persistActiveSession\(true\)/);
  assert.doesNotMatch(openFlow, /stopTicker|stopAudio|releaseSeat/);
  assert.match(source, /你还在专注中，倒计时仍在继续，请尽快返回专注页面/);
  assert.match(source, /data-action="return-active-focus"/);
});

test("overview and history derive only from real saved focus records", () => {
  assert.match(source, /function validFocusHistory\(\)/);
  assert.match(source, /Number\(item\?\.elapsedSeconds\) > 0/);
  assert.match(source, /timeZone: "Asia\/Shanghai"/);
  assert.match(source, /function renderPersonalOverview\(\)/);
  assert.match(source, /function renderPersonalHistory\(\)/);
  assert.match(source, /data-profile-filter="scene"/);
  assert.match(source, /data-profile-filter="status"/);
  assert.match(source, /data-profile-filter="mode"/);
});

test("preferences support timer, sound, interface and notification controls", () => {
  assert.match(source, /data-preference-timer/);
  assert.match(source, /data-profile-sound-toggle/);
  assert.match(source, /data-profile-volume/);
  assert.match(source, /rememberLastFocusView/);
  assert.match(source, /completionSound/);
  assert.match(source, /desktopNotifications/);
});

test("identity and destructive data actions follow the confirmed safety boundary", () => {
  assert.match(source, /maxlength="16"/);
  assert.match(source, /data-profile-avatar/);
  assert.match(source, /data-confirm-profile="reset-preferences"/);
  assert.match(source, /data-confirm-profile="clear-history"/);
  assert.match(source, /data-confirm-profile="delete-all"/);
  const deleteFlow = source.slice(source.indexOf("function executeProfileDataAction"), source.indexOf("function renderWelcome"));
  assert.match(deleteFlow, /if \(hasActiveSeatSession\(\)\)/);
  assert.match(deleteFlow, /请先结束当前专注，再删除全部本地数据/);
});

test("personal center has compact 1280 by 720 adaptations", () => {
  assert.match(styles, /@media \(max-width: 1280px\), \(max-height: 760px\)/);
  assert.match(styles, /\.profile-history-layout[\s\S]*grid-template-columns/);
  assert.match(styles, /\.personal-focus-notice/);
});
