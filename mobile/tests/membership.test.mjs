import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/mobile-membership.js', import.meta.url), 'utf8');
function setup() {
  let rendered = null, purchaseCount = 0, enabled = false;
  const events = {}, storage = new Map();
  const state = { personalCenter: { open: false }, accessStatus: null, view: 'room', offlineFocus: true, cloudFocusClientId: null };
  const access = { entitlementType: 'none', trialStatus: 'available', trialGateEnabled: true };
  const billing = { addListener: () => {}, securityCheck: async () => ({ token: '' }), products: async () => ({ products: [{ id: 'online.focusisle.plus.monthly', name: 'Monthly', price: '$9.99' }] }), purchase: async () => { purchaseCount++; return { status: 'sync_pending' }; } };
  const document = { querySelector: selector => selector === '.mobile-membership' ? rendered : null, createElement: () => ({ innerHTML: '', setAttribute() {}, querySelector: () => ({ focus() {} }), remove() { rendered = null; } }), body: { appendChild: node => { rendered = node; } } };
  const context = vm.createContext({ PUBLIC_CONFIG: { mobile: { channel: 'online-beta' } }, window: { Capacitor: { registerPlugin: () => billing }, addEventListener: (name, callback) => { events[name] = callback; } }, document, state, onlineUserId: 'A', historyAnonymous: false, focusAuthorizationPromise: null, accountCenter: { notice: '', data: {}, emailMode: 'sign-in' }, preferences: {}, localStorage: { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) }, accountMessage: v => v, turnstileToken: async () => '', api: async path => path === '/api/mobile/billing/config' ? { enabled } : {}, getAccessStatus: async () => access, accountSecurityContent: () => '', accountOtherContent: () => '', accountProfileContent: () => '', renderAccountCenter: () => {}, openAuthGate: () => {}, openPersonalCenter: () => {}, closeAccessOverlay: () => { state.accessOverlay = null; }, openPaywall: () => {}, renderAccessOverlay: () => {}, authorizeFocusStart: () => {}, requestFocusAuthorization: async () => { state.offlineStartAvailable = true; return false; }, hasActiveSeatSession: () => false, minimalIcon: () => '', escapeHtml: value => String(value), showToast: () => {}, renderFocus: () => {} });
  vm.runInContext(source, context);
  const clickBuy = () => events.click({ preventDefault() {}, stopImmediatePropagation() {}, target: { closest: () => ({ attributes: [{ name: 'data-mobile-buy' }], dataset: { mobileBuy: 'online.focusisle.plus.monthly' }, hasAttribute: key => key === 'data-mobile-buy' }) } });
  return { context, state, access, storage, html: () => rendered?.innerHTML || '', enable: () => { enabled = true; }, clickBuy, purchaseCount: () => purchaseCount };
}
test('unconfigured billing displays no invented price and disables restore', async () => {
  const { context, html } = setup(); await context.openPaywall();
  assert.match(html(), /Purchases are not available/); assert.doesNotMatch(html(), /\$9\.99/); assert.match(html(), /data-mobile-restore disabled/);
});
test('paid but unsynced purchase survives reopening and blocks another payment', async () => {
  const app = setup(); app.enable(); await app.context.openPaywall(); assert.match(app.html(), /\$9\.99/);
  await app.clickBuy(); assert.equal(app.purchaseCount(), 1); assert.equal(app.storage.get('focusApplePaymentPending:A'), 'true');
  await app.context.openPaywall(); assert.match(app.html(), /data-mobile-buy="online.focusisle.plus.monthly" disabled/);
  await app.clickBuy(); assert.equal(app.purchaseCount(), 1);
});
test('a valid existing entitlement hides purchase buttons', async () => {
  const app = setup(); app.enable(); app.access.entitlementType = 'lifetime'; await app.context.openPaywall();
  assert.match(app.html(), /Your membership is active/); assert.doesNotMatch(app.html(), /data-mobile-buy=/);
});
test('new local-only sessions cannot bypass server authorization; an existing authorized session can resume offline', async () => {
  const { context, state } = setup(); assert.equal(await context.authorizeFocusStart(), false);
  assert.equal(state.offlineFocus, false); assert.equal(state.offlineStartAvailable, false);
  state.cloudFocusClientId = 'authorized-session'; assert.equal(await context.authorizeFocusStart(), true);
});
