/* App account, billing and permission controls. Store prices always come from StoreKit. */
(() => {
  'use strict';
  if (PUBLIC_CONFIG.mobile?.channel !== 'online-beta') return;
  const billing = window.Capacitor?.registerPlugin?.('FocusOnline');
  const device = window.Capacitor?.registerPlugin?.('FocusSession');
  turnstileToken = async function () { return (await billing.securityCheck()).token; };
  let products = [], billingReady = false, loading = false, buying = false, message = '', verificationEmail = '', epoch = 0;
  const pendingPayment = () => Boolean(onlineUserId) && localStorage.getItem('focusApplePaymentPending:' + onlineUserId) === 'true';
  const signedIn = () => Boolean(onlineUserId) && !historyAnonymous;
  const legal = () => '<div class="mobile-legal"><button type="button" data-mobile-link="privacy">Privacy</button><button type="button" data-mobile-link="terms">Terms</button><button type="button" data-mobile-link="support">Support</button></div>';
  const statusText = () => ({ synced: 'Settings synced', syncing: 'Syncing settings…', pending: 'Saved on this device · waiting to sync', local: 'Saved on this device' })[window.FocusPreferenceStatus || 'local'];
  const originalMessage = accountMessage;
  accountMessage = code => ({ registration_session_unavailable: 'Confirm your email first, then return here to sign in.', email_confirmation_required: 'Check your email and open the confirmation link. Then return here to sign in.', mobile_auth_unavailable: 'Account services are not available in this build yet. Your local records are safe.', verification_failed: 'Verification did not finish. Request a new confirmation email.', captcha_required: 'The security check did not finish. Please try again.' })[code] || originalMessage(code);
  const originalApi = api;
  api = async function (path, options) {
    if (path === '/api/auth/password/update') { const values = JSON.parse(options.body); values.captchaToken = await turnstileToken(); options = { ...options, body: JSON.stringify(values) }; }
    if (path === '/api/auth/sign-up') { try { verificationEmail = JSON.parse(options.body).email || ''; } catch { /* no draft */ } }
    return originalApi(path, options);
  };
  const security = accountSecurityContent;
  accountSecurityContent = function () {
    return security().replace('You don’t need an account to take a seat or start a timer. Signing in is always optional.', 'Your account keeps your focus history, settings and membership together across devices.')
      .replace('Open it in this browser on this device within 10 minutes after verification.', 'Open the email link in your browser, set a new password, then return to this app to sign in.')
      + (verificationEmail && !signedIn() ? `<section class="ac-card"><h3>Waiting for confirmation?</h3><p>${escapeHtml(verificationEmail)}</p><button class="ac-button" type="button" data-mobile-resend>Resend confirmation email</button></section>` : '')
      + (signedIn() ? `<section class="ac-card"><h3>Delete account</h3><p>Permanently delete your profile, cloud history and settings. Apple subscriptions must be cancelled separately.</p><button class="ac-button" type="button" data-mobile-link="subscriptions">Manage Apple subscription</button><button class="ac-button" type="button" data-mobile-delete ${hasActiveSeatSession() ? 'disabled' : ''}>Delete my account…</button></section>` : '') + legal();
  };
  const other = accountOtherContent;
  accountOtherContent = function (tab) {
    const base = other(tab);
    if (tab !== 'preferences') return base;
    return base + `<section class="ac-card"><h3>On this device</h3><label class="ac-setting"><div><strong>Session complete reminder</strong><p>Notify me when a countdown finishes.</p></div><input type="checkbox" data-mobile-notify ${preferences.desktopNotifications ? 'checked' : ''}></label><p data-mobile-sync-status role="status">${escapeHtml(statusText())}</p></section>` + legal();
  };
  const profile = accountProfileContent;
  accountProfileContent = () => profile() + `<section class="ac-card"><h3>Focus Isle membership</h3><p>Immersive rooms, online focus and your history across devices.</p><button class="ac-button" type="button" data-mobile-membership>Membership & purchases</button><p data-mobile-sync-status role="status">${escapeHtml(statusText())}</p></section>`;
  const renderCenter = renderAccountCenter;
  renderAccountCenter = function () {
    if (state.personalCenter.tab === 'developer') state.personalCenter.tab = 'account';
    if (accountCenter.notice.includes('Open it in this browser.')) accountCenter.notice = 'If this address has an account, a reset link is on its way. Open it in your browser, then return here to sign in.';
    if (accountCenter.notice.includes('keep focusing as a guest')) accountCenter.notice = 'You’re signed out on this device.';
    renderCenter(); document.querySelector('[data-profile-tab="developer"]')?.remove();
  };
  openAuthGate = function (error = '', continuation = null) {
    if (continuation) state.authContinuation = continuation;
    closeMembership(); closeAccessOverlay(); state.authContinuation = continuation;
    openPersonalCenter({ tab: 'security' });
    if (error) { accountCenter.error = accountMessage(error); renderAccountCenter(); }
  };
  function closeMembership() { epoch++; state.accessOverlay = null; document.querySelector('.mobile-membership')?.remove(); }
  function paint() {
    document.querySelector('.mobile-membership')?.remove();
    if (state.accessOverlay !== 'paywall') return;
    const member = state.accessStatus && state.accessStatus.entitlementType !== 'none';
    const trial = signedIn() && state.accessStatus?.trialGateEnabled && state.accessStatus?.trialStatus === 'available';
    const overlay = document.createElement('section');
    overlay.className = 'mobile-membership'; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-labelledby', 'mobile-member-title');
    overlay.innerHTML = `<div class="mobile-member-card"><button type="button" class="ac-close" data-mobile-member-close aria-label="Close membership">${minimalIcon('close')}</button><span class="ac-eyebrow">YOUR SPACE TO FOCUS</span><h2 id="mobile-member-title">${member ? 'Your membership is active' : 'Make time for your island.'}</h2><p>All immersive rooms, online companionship, focus history and cloud settings.</p>${state.accessStatus?.trialGateEnabled ? '<p>One 25-minute focus session is included per account. Afterwards, a subscription is required to start new sessions.</p>' : ''}${!signedIn() ? '<button type="button" class="ac-button ac-primary" data-mobile-member-signin>Sign in or create an account</button>' : ''}${trial ? '<button type="button" class="ac-button" data-mobile-trial>Use my 25-minute trial</button>' : ''}<div class="mobile-plans">${!member && signedIn() && billingReady ? products.map(product => `<button type="button" class="ac-button" data-mobile-buy="${escapeHtml(product.id)}" ${buying || pendingPayment() ? 'disabled' : ''}><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.price)} / ${product.id.endsWith('.annual') ? 'year' : 'month'}</span></button>`).join('') : ''}</div><p role="status">${escapeHtml(message || (pendingPayment() ? 'A purchase is awaiting approval or membership sync. Use Restore purchases; do not pay again.' : loading ? 'Loading membership…' : !billingReady && !member ? 'Purchases are not available in this build yet.' : ''))}</p>${billingReady && !member ? '<p class="ac-caption">Payment is charged to your Apple Account. Your subscription renews automatically unless cancelled at least 24 hours before the current period ends. Manage or cancel in your Apple Account settings.</p>' : ''}<div class="mobile-member-actions"><button type="button" class="ac-button" data-mobile-restore ${buying || !signedIn() || !billingReady ? 'disabled' : ''}>Restore purchases</button><button type="button" class="ac-button" data-mobile-link="subscriptions">Manage subscription</button></div>${legal()}</div>`;
    document.body.appendChild(overlay); overlay.querySelector('[data-mobile-member-close]').focus();
  }
  openPaywall = async function () {
    closeAccessOverlay(); state.accessOverlay = 'paywall'; loading = true; message = ''; billingReady = false; products = [];
    const revision = ++epoch, owner = onlineUserId; paint();
    try {
      const [access, config] = await Promise.all([getAccessStatus({ refresh: true }), api('/api/mobile/billing/config')]);
      if (revision !== epoch || owner !== onlineUserId) return;
      state.accessStatus = access;
      if (config.enabled && billing) {
        const result = await billing.products();
        if (revision !== epoch || owner !== onlineUserId) return;
        products = (result.products || []).filter(p => ['online.focusisle.plus.monthly', 'online.focusisle.plus.annual'].includes(p.id));
        billingReady = products.length > 0;
      }
    } catch { if (revision === epoch) message = 'Membership could not refresh. Please check your connection and try again.'; }
    finally { if (revision === epoch) { loading = false; paint(); } }
  };
  const renderOverlay = renderAccessOverlay;
  renderAccessOverlay = function () { if (state.accessOverlay === 'paywall') paint(); else renderOverlay(); };
  // A previously authorized session may continue offline; a new one must be authorized by the server.
  authorizeFocusStart = async function () {
    if (state.cloudFocusClientId) return true;
    if (focusAuthorizationPromise) return focusAuthorizationPromise;
    state.offlineFocus = false;
    focusAuthorizationPromise = requestFocusAuthorization().then(result => {
      if (!result && state.offlineStartAvailable) { state.offlineStartAvailable = false; showToast('Connect to the internet to start a new session.'); if (state.view === 'focus') renderFocus(); }
      return result;
    }).finally(() => { focusAuthorizationPromise = null; });
    return focusAuthorizationPromise;
  };
  window.addEventListener('click', async event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.minimal === 'start-local') { event.preventDefault(); event.stopImmediatePropagation(); showToast('Connect to the internet to start a new session.'); return; }
    if (![...button.attributes].some(a => a.name.startsWith('data-mobile-')) || button.hasAttribute('data-mobile-auto-scene')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    try {
      if (button.hasAttribute('data-mobile-member-close')) closeMembership();
      if (button.hasAttribute('data-mobile-membership')) await openPaywall();
      if (button.hasAttribute('data-mobile-member-signin')) openAuthGate();
      if (button.dataset.mobileLink) await device.openLink({ key: button.dataset.mobileLink });
      if (button.hasAttribute('data-mobile-trial')) {
        closeMembership(); closePersonalCenter();
        if (state.sessionStartedAt) { showToast('Your existing session is still available.'); return; }
        state.timerMode = 25; state.durationSeconds = 1500; state.remainingSeconds = 1500;
        if (state.selectedSeat !== null && state.view === 'room') await enterImmersiveFocus(); else showToast('Choose a room and a seat to begin your trial.');
      }
      if (button.hasAttribute('data-mobile-resend')) {
        button.disabled = true;
        await api('/api/auth/resend-email', { method: 'POST', body: JSON.stringify({ email: verificationEmail, captchaToken: await turnstileToken() }) });
        accountCenter.notice = 'If confirmation is needed, an email is on its way. Open its link, then return here to sign in.'; renderAccountCenter();
      }
      if (button.hasAttribute('data-mobile-delete')) {
        if (hasActiveSeatSession()) throw new Error('active_session_exists');
        button.parentElement.innerHTML = '<h3>Permanently delete your account?</h3><p>This removes your profile, focus records and settings. It cannot be undone. It does not cancel an Apple subscription.</p><button class="ac-button" type="button" data-mobile-link="subscriptions">Manage subscription</button><button class="ac-button" type="button" data-mobile-delete-confirm>Delete permanently</button><button class="ac-button" type="button" data-mobile-delete-cancel>Keep account</button>';
      }
      if (button.hasAttribute('data-mobile-delete-cancel')) renderAccountCenter();
      if (button.hasAttribute('data-mobile-delete-confirm')) {
        if (hasActiveSeatSession()) throw new Error('active_session_exists');
        const owner = onlineUserId; button.disabled = true;
        await api('/api/account', { method: 'DELETE', headers: { 'X-Focus-User': owner } });
        if (onlineUserId !== owner) throw new Error('identity_changed');
        focusHistory.clear(); localStorage.removeItem('focusApplePaymentPending:' + owner); localStorage.removeItem('focusMobilePreferencesV1:' + owner);
        const key = 'focusIslandPendingFocusUpdatesV1';
        try { const pending = JSON.parse(localStorage.getItem(key) || '[]'); localStorage.setItem(key, JSON.stringify(pending.filter(item => item.ownerUserId !== owner))); } catch { /* unrelated data is not removed */ }
        clearSignedInHistory(); localStorage.removeItem('focusMobilePreferencesV1:' + owner); onlineIdentityPromise = null;
        identity.displayName = 'Guest'; identity.avatarSkin = 0; identity.avatarUrl = null; identity.avatarSource = 'builtin'; identity.sessionId = crypto.randomUUID(); persistIdentity();
        state.accessStatus = null; state.isDeveloper = false; accountCenter.loaded = false; accountCenter.data = null; accountCenter.draft = null; verificationEmail = '';
        accountCenter.notice = 'Your account and cloud data were deleted.'; accountCenter.error = ''; renderAccountCenter();
      }
      if (button.dataset.mobileBuy || button.hasAttribute('data-mobile-restore')) {
        if (buying || !billingReady || !signedIn() || (button.dataset.mobileBuy && pendingPayment())) return;
        buying = true; message = ''; const owner = onlineUserId; paint();
        try {
          const result = button.dataset.mobileBuy ? await billing.purchase({ productId: button.dataset.mobileBuy }) : await billing.restore();
          if (owner !== onlineUserId) return;
          if (['sync_pending','pending'].includes(result.status)) localStorage.setItem('focusApplePaymentPending:' + owner, 'true');
          if (result.status === 'sync_pending') message = 'Payment received. Membership is still syncing. Do not purchase again; use Restore purchases to retry.';
          else if (result.status === 'pending') message = 'Your purchase is waiting for approval.';
          else if (result.status === 'cancelled') message = 'Purchase cancelled. You have not been charged.';
          else { state.accessStatus = await getAccessStatus({ refresh: true }); localStorage.removeItem('focusApplePaymentPending:' + owner); message = result.restored === 0 ? 'No active Apple subscription was found for this account.' : 'Membership refreshed.'; }
        } finally { buying = false; paint(); }
      }
    } catch (error) { message = 'This action could not finish. Please try again.'; accountCenter.error = accountMessage(error.message); if (state.accessOverlay === 'paywall') paint(); else if (state.personalCenter.open) renderAccountCenter(); }
  }, true);
  window.addEventListener('change', async event => {
    if (!event.target.matches('[data-mobile-notify]')) return;
    const checkbox = event.target; checkbox.disabled = true;
    try {
      preferences.desktopNotifications = checkbox.checked ? (await device.notifications()).granted === true : false;
      savePreferences(); window.FocusNativeSession?.sync();
      if (checkbox.checked && !preferences.desktopNotifications) showToast('Notifications are off. You can enable them in iPhone Settings.');
    } catch { showToast('Notification permission could not update.'); }
    checkbox.checked = preferences.desktopNotifications; checkbox.disabled = false;
  }, true);
  window.addEventListener('keydown', event => {
    const dialog = document.querySelector('.mobile-membership'); if (!dialog) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeMembership(); }
    if (event.key === 'Tab') {
      event.stopImmediatePropagation(); const nodes = [...dialog.querySelectorAll('button:not(:disabled)')], first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && (!dialog.contains(document.activeElement) || document.activeElement === first)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (!dialog.contains(document.activeElement) || document.activeElement === last)) { event.preventDefault(); first?.focus(); }
    }
  }, true);
  billing?.addListener('subscriptionChanged', () => { const owner = onlineUserId; void getAccessStatus({ refresh: true }).then(access => { if (owner === onlineUserId && access.entitlementType !== 'none') localStorage.removeItem('focusApplePaymentPending:' + owner); if (state.accessOverlay === 'paywall') paint(); }).catch(() => {}); });
})();
