/* Native English account center. Profiles are owned by the authenticated user. */
const accountCenter = { loaded: false, loading: false, data: null, providers: null, error: '', notice: '', busy: false, emailMode: 'sign-in', draft: null };
function accountAvatar(person = identity) {
  const value = person.avatarUrl;
  if (typeof value === 'string') {
    try {
      const u = new URL(value), host = u.hostname;
      const ownHost = new URL(PUBLIC_CONFIG.supabaseUrl || 'https://invalid.invalid').hostname;
      if (u.protocol === 'https:' && !u.username && !u.password && !u.port && (host.endsWith('.googleusercontent.com') || host === 'avatars.githubusercontent.com' || (host === ownHost && u.pathname.startsWith('/storage/v1/object/public/profile-avatars/')))) return u.href;
    } catch (_) { /* Fall back to an illustrated avatar. */ }
  }
  return (AVATAR_OPTIONS.find(a => a.id === Number(person.avatarSkin)) || AVATAR_OPTIONS[0]).image;
}
function applyAccountProfile(profile) {
  if (!profile) return;
  identity.displayName = profile.displayName;
  identity.avatarSkin = Number(profile.avatarSkin) || 0;
  identity.avatarUrl = profile.avatarUrl || null;
  identity.avatarSource = profile.avatarSource || 'builtin';
  persistIdentity();
  document.querySelectorAll('.avatar-tool img, .avatar-marker.is-mine img').forEach(img => { img.src = accountAvatar(); });
}
function accountMessage(error) {
  const messages = { invalid_credentials: 'That email and password don’t match. Please try again.', email_already_registered: 'An account already uses that email. Try signing in.', password_mismatch: 'Your passwords don’t match.', invalid_registration: 'Use a valid email and a password with at least 10 characters, including uppercase and lowercase letters, a number and a symbol.', invalid_password: 'Use at least 10 characters, including uppercase and lowercase letters, a number and a symbol.', invalid_current_password: 'Your current password isn’t correct.', active_session_exists: 'End your focus session before signing in or switching accounts.', rate_limited: 'Please wait a moment before trying again.', provider_unavailable: 'This sign-in option isn’t available yet. You can use email instead.', auth_service_unavailable: 'Sign-in is temporarily unavailable. Please try again.', profile_save_failed: 'Your changes weren’t saved. Please try again.', profile_unavailable: 'We couldn’t load your profile. Please try again.', avatar_upload_failed: 'Your photo couldn’t be uploaded. Please try again.', invalid_image: 'Choose a JPG, PNG or WebP image under 4 MB.', image_too_large: 'Choose an image under 4 MB.', profile_transfer_failed: 'You’re signed in. Some profile details couldn’t be transferred. You can update them here.', history_merge_failed: 'You’re signed in, but your guest history couldn’t be transferred.', sign_in_cancelled: 'Sign-in was cancelled. You can try again whenever you’re ready.', sign_in_failed: 'Sign-in didn’t finish. Please try again.', captcha_required: 'Please complete the security check and try again.', verification_expired: 'This link has expired. Please request a new one.' };
  return messages[error] || 'Something went wrong. Please try again.';
}
async function loadAccountCenter({ refresh = false } = {}) {
  if (accountCenter.loading || (accountCenter.loaded && !refresh)) return;
  accountCenter.loading = true;
  try {
    const session = await api('/api/auth/session');
    if (session.authenticated) {
      const data = await api('/api/profile'); accountCenter.data = data; applyAccountProfile(data.profile);
    } else accountCenter.data = { anonymous: true, providers: [], providerPhotos: [] };
    accountCenter.loaded = true;
  } catch (_) { accountCenter.error = 'We couldn’t load your profile. Your current session is safe.'; }
  try { accountCenter.providers = (await api('/api/auth/providers')).providers; } catch (_) { accountCenter.providers = {}; }
  accountCenter.loading = false;
  accountCenter.loaded = true;
  if (state.personalCenter.open) renderPersonalCenter();
}
function accountField(label, name, type = 'text', extra = '') {
  return `<label class="ac-field"><span>${label}</span><input name="${name}" type="${type}" ${extra} required></label>`;
}
function accountProviderButtons() {
  return ['google','apple','github'].map(provider => {
    const name = {google:'Google',apple:'Apple',github:'GitHub'}[provider];
    const available = accountCenter.providers?.[provider] === true;
    return `<button class="ac-provider" type="button" data-center-action="oauth" data-provider="${provider}" ${!available || accountCenter.busy || hasActiveSeatSession() ? 'disabled' : ''}><span class="ac-provider-mark" aria-hidden="true">${{google:'G',apple:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 12.8c0-2 1.7-3 1.8-3.1-1-1.5-2.5-1.7-3.1-1.7-1.3-.1-2.6.8-3.3.8-.6 0-1.7-.8-2.8-.8-1.5 0-2.8.9-3.6 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.5 2.1 2.6 2 1-.1 1.5-.7 2.8-.7s1.7.7 2.8.7 1.9-1 2.6-2.1c.8-1.2 1.1-2.3 1.1-2.4-.1 0-2-.8-2-3.4ZM14.5 6.6c.6-.8 1.1-1.8 1-2.8-.9 0-2 .6-2.7 1.3-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.2Z"/></svg>',github:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.7.1-.6.1-.6 1 0 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .9-.3 2.8 1a9.4 9.4 0 0 1 5.2 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>'}[provider]}</span><span>Continue with ${name}</span>${available ? '<span aria-hidden="true">→</span>' : '<small>Coming soon</small>'}</button>`;
  }).join('');
}
function accountProfileContent() {
  const profile = accountCenter.draft || identity;
  const names = ['Golden Hour','Stillwater','Morning Mist','Moonlight'];
  return `<div class="ac-grid"><section class="ac-card ac-profile-card"><div class="ac-card-heading"><div><span class="ac-eyebrow">YOUR QUIET CORNER</span><h2>Make yourself at home.</h2><p>Your name and photo appear wherever you take a seat.</p></div></div><div class="ac-photo-editor"><img class="ac-avatar-preview" src="${escapeHtml(accountAvatar(profile))}" alt="Your avatar"><div><button type="button" class="ac-button" data-center-action="choose-photo">Upload a photo</button><input type="file" accept="image/jpeg,image/png,image/webp" data-center-upload hidden><small>JPG, PNG or WebP · Up to 4 MB<br>We’ll crop your photo into a circle.</small></div></div><form data-center-form="profile"><label class="ac-field"><span>Display name</span><input name="displayName" maxlength="24" value="${escapeHtml(localizedIdentityDisplayName(profile.displayName))}" autocomplete="nickname" required></label><div class="ac-field-note">1–24 characters. This is how others see you in the room.</div><fieldset class="ac-avatar-choices"><legend>Or choose an illustrated avatar</legend>${AVATAR_OPTIONS.map((a,i) => `<button class="ac-avatar-choice" type="button" data-center-action="preset" data-skin="${a.id}" aria-label="${names[i]}" aria-pressed="${!profile.avatarUrl && Number(profile.avatarSkin)===a.id}"><img src="${a.image}" alt=""><span>${names[i]}</span></button>`).join('')}</fieldset>${(accountCenter.data?.providerPhotos || []).map(photo=>`<button class="ac-button ac-provider-photo" type="button" data-center-action="provider-photo" data-provider="${photo.provider}"><img src="${escapeHtml(photo.url)}" alt="">Use my ${photo.provider==='google'?'Google':'GitHub'} photo</button>`).join('')}<footer class="ac-form-footer"><span>${accountCenter.draft ? 'You have unsaved changes.' : 'Your profile follows you into every room.'}</span><button class="ac-button ac-primary" type="submit" ${accountCenter.busy?'disabled':''}>${accountCenter.busy?'Saving…':'Save changes'}</button></footer></form></section><aside class="ac-aside"><section class="ac-card"><span class="ac-eyebrow">${accountCenter.data?.anonymous !== false?'KEEP YOUR PLACE':'YOUR ACCOUNT'}</span><h2>${accountCenter.data?.anonymous !== false?'A little more continuity.':'You’re right at home.'}</h2><p>${accountCenter.data?.anonymous !== false?'An account keeps your profile and focus history with you across devices. You can keep focusing as a guest, too.':escapeHtml(accountCenter.data.email || 'Your account is connected.')}</p><button class="ac-button ac-primary" type="button" data-profile-tab="security">${accountCenter.data?.anonymous !== false?'Sign in or create an account':'Manage sign-in'}</button></section><section class="ac-card ac-soft"><span class="ac-status-dot"></span><h3>One profile. Every seat.</h3><p>Update your photo or name here. Your seat updates automatically, even during a session.</p></section></aside></div>`;
}
function accountSecurityContent() {
  const guest = accountCenter.data?.anonymous !== false;
  const mode = accountCenter.emailMode;
  return `<div class="ac-grid"><section class="ac-card"><span class="ac-eyebrow">${guest?'WELCOME BACK':'SIGN-IN OPTIONS'}</span><h2>${guest?'Bring your quiet corner with you.':'Your connected account'}</h2><p>${guest?'Sign in to keep your profile and focus history across devices.':'You’re signed in as '+escapeHtml(accountCenter.data.email || 'a connected account')+'.'}</p>${hasActiveSeatSession()?'<div class="ac-inline-note">Your focus session is safe. End it before signing in or switching accounts.</div>':''}<div class="ac-provider-list">${accountProviderButtons()}</div><p class="ac-caption">Apple doesn’t share a profile photo. You can upload your own after signing in.</p>${guest?`<div class="ac-divider">or use email</div><div class="ac-segmented"><button type="button" data-center-action="email-mode" data-mode="sign-in" aria-pressed="${mode==='sign-in'}">Sign in</button><button type="button" data-center-action="email-mode" data-mode="sign-up" aria-pressed="${mode==='sign-up'}">Create account</button></div><form data-center-form="${mode}">${accountField('Email address','email','email','autocomplete="email" maxlength="254"')}${accountField('Password','password','password',`autocomplete="${mode==='sign-up'?'new-password':'current-password'}" minlength="${mode==='sign-up'?10:1}" maxlength="128"`)}${mode==='sign-up'?accountField('Confirm password','confirmPassword','password','autocomplete="new-password" minlength="10" maxlength="128"')+'<p class="ac-caption">Use at least 10 characters, including uppercase and lowercase letters, a number and a symbol.</p>':''}<button class="ac-button ac-primary ac-wide" type="submit" ${accountCenter.busy || hasActiveSeatSession() || accountCenter.providers?.email === false?'disabled':''}>${accountCenter.busy?'Please wait…':mode==='sign-up'?'Create account':'Sign in with email'}</button></form>`:`<div class="ac-inline-note">Connected with ${(accountCenter.data.providers || []).filter(p=>p!=='anonymous').map(p=>escapeHtml(p==='github'?'GitHub':p[0].toUpperCase()+p.slice(1))).join(', ') || 'email'}.</div><button class="ac-button" data-center-action="sign-out" type="button" ${hasActiveSeatSession()?'disabled':''}>Sign out on this device</button>`}</section><aside class="ac-aside"><section class="ac-card ac-soft"><h3>Focus first.</h3><p>You don’t need an account to take a seat or start a timer. Signing in is always optional.</p></section>${!guest && accountCenter.data.providers?.includes('email')?`<section class="ac-card"><h3>Change password</h3><form data-center-form="password">${accountField('Current password','currentPassword','password','autocomplete="current-password"')}${accountField('New password','password','password','minlength="10" maxlength="128" autocomplete="new-password"')}${accountField('Confirm new password','confirmPassword','password','minlength="10" maxlength="128" autocomplete="new-password"')}<p class="ac-caption">Use at least 10 characters, with uppercase and lowercase letters, a number and a symbol.</p><button class="ac-button" type="submit" ${accountCenter.busy?'disabled':''}>Update password</button></form></section>`:''}</aside></div>`;
}
function accountOtherContent(tab) {
  if (tab==='developer' && state.isDeveloper) return renderDeveloperTools()+renderPersonalCenterConfirm();
  if (tab==='history') {
    const items = readHistory().slice(0,30);
    return `<section class="ac-card"><span class="ac-eyebrow">A LITTLE, OFTEN</span><h2>Your recent focus</h2><p>Focus sessions saved on this device.</p>${items.length?`<ul class="ac-history">${items.map(item=>`<li><div><strong>${escapeHtml(sceneLabel(item.sceneId || item.scene_id || "cafe"))}</strong><small>${escapeHtml(new Date(item.endedAt || item.startedAt || item.timestamp || Date.now()).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}))}</small></div><span>${Math.max(0,Math.round(Number(item.elapsedSeconds || item.actualSeconds || item.durationSeconds || item.duration || 0)/60))} min</span><small>${focusStatusKey(item.status)==='completed'?'Completed':'Ended'}</small></li>`).join('')}</ul>`:'<div class="ac-empty">A fresh start.<p>Your next focus session will appear here.</p></div>'}</section>`;
  }
  return `<section class="ac-card ac-preferences"><span class="ac-eyebrow">MAKE ROOM FOR FOCUS</span><h2>Your preferences</h2><div class="ac-setting"><div><strong>Focus length</strong><p>Your default for a new session.</p></div><div class="ac-segmented">${[25,50,0].map(mode=>`<button type="button" data-center-action="timer-mode" data-mode="${mode}" aria-pressed="${Number(preferences.defaultTimerMode)===mode}">${mode?mode+' min':'Open'}</button>`).join('')}</div></div><label class="ac-setting"><div><strong>Reduce motion</strong><p>Keep transitions and focus ripples still.</p></div><input type="checkbox" data-center-motion ${preferences.reduceMotion?'checked':''}></label><div class="ac-setting"><div><strong>Language</strong><p>English</p></div><span class="ac-tag">Default</span></div><p class="ac-caption">Sound and scene controls are always within reach in your focus space.</p></section>`;
}
function renderAccountCenter() {
  const old = document.querySelector('.personal-center-overlay');
  const scroll = old?.querySelector('.ac-main')?.scrollTop || 0;
  const active = old?.contains(document.activeElement) ? document.activeElement : null;
  const focusSelector = active?.name ? `[name="${CSS.escape(active.name)}"]` : active?.dataset.profileTab ? `[data-profile-tab="${active.dataset.profileTab}"]` : active?.dataset.centerAction === 'close' ? '[data-center-action="close"]' : null;
  old?.remove();
  let tab = state.personalCenter.tab;
  if (!['account','security','history','preferences','developer'].includes(tab) || (tab==='developer'&&!state.isDeveloper)) tab='account';
  state.personalCenter.tab=tab;
  const tabs = [['account','Profile','scene'],['security','Sign-in & security','check'],['preferences','Preferences','settings'],['history','Focus history','restart'],...(state.isDeveloper?[['developer','Developer tools','move']]:[])];
  const title = tabs.find(t=>t[0]===tab)[1];
  const overlay = document.createElement('section'); overlay.className='personal-center-overlay account-center'; overlay.dataset.noAutoI18n=''; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true'); overlay.setAttribute('aria-labelledby','personal-center-title');
  overlay.innerHTML=`<div class="ac-shell"><aside class="ac-sidebar"><a class="ac-brand" href="/" data-center-action="close">${minimalIcon('sea')}<span>Focus Isle<small>A little space to focus.</small></span></a><div class="ac-identity"><img src="${escapeHtml(accountAvatar())}" alt=""><strong>${escapeHtml(localizedIdentityDisplayName(identity.displayName))}</strong><span class="ac-tag">${accountCenter.data?.anonymous===false?'Member':'Guest'}</span></div><nav aria-label="Your account">${tabs.map(([id,label,icon])=>`<button type="button" data-profile-tab="${id}" aria-current="${id===tab?'page':'false'}">${minimalIcon(icon)}<span>${label}</span></button>`).join('')}</nav><div class="ac-sidebar-bottom"><span class="ac-status-dot"></span>A quiet place, at your pace.<small>Focus Isle ${escapeHtml(PUBLIC_CONFIG.appVersion)}</small></div></aside><div class="ac-main"><header class="ac-header"><div><span class="ac-eyebrow">YOUR SPACE</span><h1 id="personal-center-title">${title}</h1></div><button class="ac-close" type="button" data-center-action="close" aria-label="Close profile">${minimalIcon('close')}</button></header>${isActiveFocusSession()?'<div class="ac-session-note"><span>Your session is '+(state.isRunning?'still running.':'paused.')+'</span><button type="button" data-action="return-active-focus">Back to focus →</button></div>':''}<div class="ac-body">${accountCenter.error?`<div class="ac-feedback ac-error" role="alert">${escapeHtml(accountCenter.error)} <button type="button" class="ac-retry" data-center-action="retry">Try again</button></div>`:''}${accountCenter.notice?`<div class="ac-feedback" role="status">${escapeHtml(accountCenter.notice)}</div>`:''}${tab==='account'?accountProfileContent():tab==='security'?accountSecurityContent():accountOtherContent(tab)}</div></div></div>`;
  app.appendChild(overlay); overlay.querySelector('.ac-main').scrollTop=scroll;
  if (focusSelector) overlay.querySelector(focusSelector)?.focus({preventScroll:true});
  else if (!old) overlay.querySelector('.ac-close')?.focus({preventScroll:true});
  if (!accountCenter.loaded && !accountCenter.loading) void loadAccountCenter();
}
function accountKeepDraft() {
  const input = document.querySelector('.account-center [name="displayName"]');
  accountCenter.draft = { ...(accountCenter.draft || identity), displayName: input?.value || accountCenter.draft?.displayName || identity.displayName };
}
async function accountSaveProfile() {
  await ensureOnlineIdentity();
  const draft = accountCenter.draft || identity;
  const { profile } = await api('/api/profile',{method:'PATCH',body:JSON.stringify({displayName:draft.displayName,avatarSkin:draft.avatarSkin,avatarSource:draft.avatarSource || 'builtin'})});
  applyAccountProfile(profile); accountCenter.draft=null;
  if (accountCenter.data) accountCenter.data.profile=profile;
}
document.addEventListener('click',async event=>{
  const button = event.target.closest('[data-center-action]'); if (!button) return;
  event.preventDefault(); event.stopImmediatePropagation();
  const action=button.dataset.centerAction;
  if (action==='close') {closePersonalCenter();return;}
  if (action==='retry') {accountCenter.error='';accountCenter.loaded=false;void loadAccountCenter({refresh:true});return;}
  if (accountCenter.busy) return;
  accountCenter.error='';accountCenter.notice='';
  if (action==='preset' || action==='provider-photo') {
    accountKeepDraft();
    if (action==='preset') Object.assign(accountCenter.draft,{avatarSkin:Number(button.dataset.skin),avatarUrl:null,avatarSource:'builtin'});
    else {const photo=accountCenter.data?.providerPhotos?.find(p=>p.provider===button.dataset.provider);if(photo)Object.assign(accountCenter.draft,{avatarUrl:photo.url,avatarSource:photo.provider});}
    renderAccountCenter();return;
  }
  if (action==='choose-photo'){document.querySelector('[data-center-upload]').click();return;}
  if (action==='email-mode'){accountCenter.emailMode=button.dataset.mode;renderAccountCenter();return;}
  if (action==='timer-mode'){if(hasActiveSeatSession()){accountCenter.error='End your session before changing its length.';}else{preferences.defaultTimerMode=Number(button.dataset.mode);state.timerMode=preferences.defaultTimerMode;savePreferences();accountCenter.notice='Preferences saved.';}renderAccountCenter();return;}
  accountCenter.busy=true;renderAccountCenter();
  try {
    if(hasActiveSeatSession()) throw new Error('active_session_exists');
    if(action==='oauth') {const result=await api('/api/auth/oauth',{method:'POST',body:JSON.stringify({provider:button.dataset.provider})});location.assign(result.url);}
    if(action==='sign-out') {await api('/api/auth/sign-out',{method:'POST',body:'{}'});onlineIdentityPromise=null;onlineUserId=null;state.isDeveloper=false;state.accessStatus=null;accountCenter.loaded=false;accountCenter.data=null;accountCenter.draft=null;identity.avatarUrl=null;identity.avatarSource='builtin';identity.sessionId=crypto.randomUUID();persistIdentity();await loadAccountCenter({refresh:true});accountCenter.notice='You’re signed out. You can keep focusing as a guest.';}
  }catch(error){accountCenter.error=accountMessage(error.message);}finally{accountCenter.busy=false;if(state.personalCenter.open)renderAccountCenter();}
},true);
document.addEventListener('submit',async event=>{
  const form=event.target.closest('[data-center-form]');if(!form)return;
  event.preventDefault();event.stopImmediatePropagation();if(accountCenter.busy)return;
  const flow=form.dataset.centerForm,values=new FormData(form);accountCenter.error='';accountCenter.notice='';
  if(flow==='profile'){accountKeepDraft();if(!String(values.get('displayName')).trim()){accountCenter.error='Choose a display name.';renderAccountCenter();return;}accountCenter.draft.displayName=String(values.get('displayName')).trim();}
  accountCenter.busy=true;renderAccountCenter();
  try{
    if(flow==='profile'){await accountSaveProfile();accountCenter.notice='Your profile is saved. Your seat has updated, too.';}
    else if(flow==='password'){if(values.get('password')!==values.get('confirmPassword'))throw new Error('password_mismatch');await api('/api/auth/password/update',{method:'POST',body:JSON.stringify(Object.fromEntries(values))});accountCenter.notice='Your password has been updated.';}
    else {
      if(hasActiveSeatSession())throw new Error('active_session_exists');
      if(flow==='sign-up'&&values.get('password')!==values.get('confirmPassword'))throw new Error('password_mismatch');
      let mergeToken=sessionStorage.getItem(STORAGE_KEYS.pendingMergeToken);
      const session=await api('/api/auth/session');
      if(!mergeToken&&session.authenticated&&session.anonymous){const prepared=await api('/api/auth/merge/prepare',{method:'POST',body:'{}'});mergeToken=prepared.mergeToken;sessionStorage.setItem(STORAGE_KEYS.pendingMergeToken,mergeToken);}
      const captchaToken=await turnstileToken();
      const result=await api('/api/auth/'+flow,{method:'POST',body:JSON.stringify({...Object.fromEntries(values),captchaToken})});
      let mergeFailed=false;
      if(mergeToken){try{const merge=await api('/api/auth/merge/complete',{method:'POST',body:JSON.stringify({mergeToken})});mergeFailed=Boolean(merge.result?.profileTransferWarning);sessionStorage.removeItem(STORAGE_KEYS.pendingMergeToken);}catch(_){mergeFailed=true;}}
      closePersonalCenter();await completeAuthenticatedFlow(result);accountCenter.loaded=false;accountCenter.draft=null;await loadAccountCenter({refresh:true});openPersonalCenter({tab:'account'});accountCenter.notice=mergeFailed?accountMessage('history_merge_failed'):'You’re signed in. Welcome to your quiet corner.';
    }
  }catch(error){accountCenter.error=accountMessage(error.message);}finally{accountCenter.busy=false;if(state.personalCenter.open)renderAccountCenter();}
},true);
document.addEventListener('change',async event=>{
  if(event.target.matches('[data-center-motion]')){preferences.reduceMotion=event.target.checked;savePreferences();document.querySelector('.minimal-root')?.setAttribute('data-reduced',String(preferences.reduceMotion));return;}
  if(!event.target.matches('[data-center-upload]')||!event.target.files?.length||accountCenter.busy)return;
  const file=event.target.files[0];accountKeepDraft();
  if(file.size>4*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)){accountCenter.error=accountMessage('invalid_image');renderAccountCenter();return;}
  accountCenter.busy=true;accountCenter.error='';renderAccountCenter();
  try {
    await ensureOnlineIdentity();
    const body=new FormData();body.set('avatar',file);
    const response=await fetch('/api/profile/avatar',{method:'POST',body});const result=await response.json();if(!response.ok)throw new Error(result.error);
    applyAccountProfile(result.profile);
    accountCenter.draft={...identity,displayName:accountCenter.draft?.displayName || identity.displayName};
    accountCenter.notice='Photo updated. Save changes to update your name, too.';
  }catch(error){accountCenter.error=accountMessage(error.message);}finally{accountCenter.busy=false;if(state.personalCenter.open)renderAccountCenter();}
},true);
document.addEventListener('keydown',event=>{
  const dialog=document.querySelector('.account-center');if(!dialog)return;
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closePersonalCenter();return;}
  if(event.key==='Tab'){const nodes=[...dialog.querySelectorAll('a[href],button:not(:disabled),input:not([hidden]):not(:disabled),select')].filter(n=>n.getClientRects().length);const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&(!dialog.contains(document.activeElement)||document.activeElement===first)){event.preventDefault();last?.focus();}else if(!event.shiftKey&&(!dialog.contains(document.activeElement)||document.activeElement===last)){event.preventDefault();first?.focus();}}
},true);

document.addEventListener('input',event=>{if(event.target.matches('.account-center [name="displayName"]')) accountKeepDraft();},true);
