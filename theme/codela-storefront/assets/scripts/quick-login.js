/**
 * Codela Storefront browser-bound quick login.
 * Private ECDSA key: non-exportable CryptoKey in IndexedDB (not localStorage).
 * localStorage contains a display-only profile hint, NEVER a PIN or password.
 */
(() => {
  'use strict';
  const config = window.CodelaQuickLogin;
  if (!config || !window.isSecureContext || !crypto?.subtle || !window.indexedDB) return;
  const savedKey = 'codela_sf_quick_profile_v1'; // Migrated legacy single-account hint.
  const savedListKey = 'codela_sf_quick_profiles_v2';
  const passkeyLegacyKey = 'codela_sf_passkey_hint_v1';
  const passkeyListKey = 'codela_sf_passkey_hints_v2';
  const selectedAccountKey = 'codela_sf_selected_account_v2';
  const databaseName = 'codela_sf_quick_keys_v1';
  const encoding = new TextEncoder();
  const t = (key, fallback) => config.strings?.[key] || fallback;
  // Local storage holds ONLY account names and public device/credential IDs.
  // Private ECDSA keys stay non-exportable in IndexedDB; neither a saved row
  // nor an old WordPress session can log in without server-side verification.
  const readJSON = (name, fallback) => {
    try { const value=JSON.parse(localStorage.getItem(name) || 'null');return value ?? fallback; }
    catch (_) { return fallback; }
  };
  const validPin = item => item && Number.isSafeInteger(item.userId) && item.userId>0
    && typeof item.deviceId === 'string' && /^[a-f0-9]{32}$/.test(item.deviceId);
  const validPasskey = item => item && Number.isSafeInteger(item.userId) && item.userId>0
    && typeof item.credentialId === 'string' && item.credentialId.length>8
    && item.credentialId.length<4096;
  const preferredUser = () => Number(localStorage.getItem(selectedAccountKey)) || 0;
  const ordered = items => {
    const preferred=preferredUser();
    return [...items].sort((a,b)=>Number(b.userId===preferred)-Number(a.userId===preferred));
  };
  function readHints(listName, legacyName, valid, uniqueField) {
    const stored=readJSON(listName,[]);
    const list=Array.isArray(stored)?stored.filter(valid).slice(0,12):[];
    const legacy=readJSON(legacyName,null);
    if(valid(legacy) && !list.some(item=>item.userId===legacy.userId || item[uniqueField]===legacy[uniqueField])){
      list.push(legacy);
    }
    const seen=new Set();
    return ordered(list.filter(item=>{
      if(seen.has(item.userId)) return false;
      seen.add(item.userId);
      return true;
    })).slice(0,8);
  }
  const pins=()=>readHints(savedListKey,savedKey,validPin,'deviceId');
  const passkeys=()=>readHints(passkeyListKey,passkeyLegacyKey,validPasskey,'credentialId');
  const select=userId=>{
    if(Number.isSafeInteger(Number(userId)) && Number(userId)>0){
      localStorage.setItem(selectedAccountKey,String(userId));
    }
  };
  const storePin=profile=>{
    if(!validPin(profile))return;
    const updated=[profile,...pins().filter(x=>x.userId!==profile.userId)].slice(0,8);
    localStorage.setItem(savedListKey,JSON.stringify(updated));
    localStorage.removeItem(savedKey);
    select(profile.userId);
  };
  const forgetPin=deviceId=>{
    localStorage.setItem(savedListKey,JSON.stringify(pins().filter(item=>item.deviceId!==deviceId)));
    const old=readJSON(savedKey,null);
    if(old?.deviceId===deviceId)localStorage.removeItem(savedKey);
  };
  const storePasskey=hint=>{
    if(!validPasskey(hint))return;
    localStorage.setItem(passkeyListKey,JSON.stringify(
      [hint,...passkeys().filter(item=>item.userId!==hint.userId)].slice(0,8)
    ));
    localStorage.removeItem(passkeyLegacyKey);
    select(hint.userId);
  };
  const forgetPasskey=credentialId=>{
    localStorage.setItem(passkeyListKey,JSON.stringify(passkeys().filter(x=>x.credentialId!==credentialId)));
    const old=readJSON(passkeyLegacyKey,null);
    if(old?.credentialId===credentialId)localStorage.removeItem(passkeyLegacyKey);
  };
  const accountStore={pins,passkeys,select,preferredUser,storePin,forgetPin,storePasskey,forgetPasskey,
    setPasskeyPaused:(credentialId,paused)=>{
      const profile=passkeys().find(item=>item.credentialId===credentialId);
      if(profile)storePasskey({...profile,paused:!!paused});
    }
  };
  window.CodelaSFRemembered=accountStore;
  const log = () => pins()[0] || null;
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('keys');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function getKey(deviceId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keys', 'readonly');
      const req = tx.objectStore('keys').get(deviceId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  }
  async function saveKey(deviceId, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keys', 'readwrite');
      tx.objectStore('keys').put(key, deviceId);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }
  async function forgetKey(deviceId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keys', 'readwrite');
      tx.objectStore('keys').delete(deviceId);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }
  function b64(bytes) {
    let result = '';
    for (const byte of new Uint8Array(bytes)) result += String.fromCharCode(byte);
    return btoa(result);
  }
  // WebCrypto's ECDSA output is IEEE P1363 (r|s). OpenSSL expects ASN.1 DER.
  function derFromP1363(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length !== 64) throw Error('Unsupported ECDSA signature');
    const integer = part => {
      let i = 0;
      while (i < part.length - 1 && part[i] === 0) i++;
      const trimmed = Array.from(part.slice(i));
      if (trimmed[0] & 0x80) trimmed.unshift(0);
      return [2, trimmed.length, ...trimmed];
    };
    const body = [...integer(bytes.slice(0, 32)), ...integer(bytes.slice(32))];
    return Uint8Array.from([0x30, body.length, ...body]);
  }
  async function signature(privateKey, message) {
    const signed = await crypto.subtle.sign({name:'ECDSA', hash:'SHA-256'}, privateKey, encoding.encode(message));
    return b64(derFromP1363(signed));
  }
  async function request(path, payload) {
    const headers = {'Content-Type':'application/json'};
    if (config.nonce) headers['X-WP-Nonce'] = config.nonce;
    const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(12000) : undefined;
    const response = await fetch(config.rest + path, {
      method:'POST', credentials:'same-origin', cache:'no-store',
      headers, body:JSON.stringify(payload), signal
    });
    let body = {};
    try { body = await response.json(); } catch (_) {}
    if (!response.ok) throw Error(body.message || t('requestFailed','Request could not be completed. Try again.'));
    return body;
  }
  const randomDeviceId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(v => v.toString(16).padStart(2,'0')).join('');

  // Browser memory is a display hint, not proof that the device remains trusted.
  // The server signs off on each presentation of a remembered account.
  async function currentBrowserStatus(profile, privateKey) {
    if (!config.statusUrl) throw Error('No device-status endpoint');
    // A fresh random challenge binds the response to this local private key.
    // Status is read-only; even a captured signature cannot create a session.
    const challenge = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(value => value.toString(16).padStart(2, '0')).join('');
    const signed = await signature(privateKey,
      'codela-pin-status:v1:' + profile.userId + ':' + profile.deviceId + ':' + challenge);
    const data = new URLSearchParams({
      action:'codela_sf_quick_status',
      user_id:String(profile.userId),
      device_id:profile.deviceId,
      challenge, signature:signed
    });
    const response = await fetch(config.statusUrl, {
      method:'POST', credentials:'same-origin', cache:'no-store',
      headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body:data,
      signal:typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(12000) : undefined
    });
    if (!response.ok) throw Error('Status could not be verified');
    const result = await response.json();
    if (typeof result?.active !== 'boolean' || typeof result?.authenticated !== 'boolean') {
      throw Error('Invalid device status');
    }
    return result;
  }

  async function forgetRemembered(profile) {
    accountStore.forgetPin(profile.deviceId);
    try { await forgetKey(profile.deviceId); } catch (_) { /* Already unavailable. */ }
  }

  function freshAccountDocument(url = config.account || window.location.href) {
    const destination = new URL(url, window.location.href);
    if (destination.origin !== window.location.origin) return;
    destination.searchParams.set('sf_quick_auth', Date.now().toString(36));
    document.documentElement.classList.add('sf-quick-auth-redirect');
    window.location.replace(destination.href);
  }

  function announceQuickStatus(section, profile, active) {
    const host = section.closest('.sf-overlay-auth') || section.closest('.woocommerce');
    if (!host) return;
    host.dataset.sfQuickStatus = active ? 'active' : 'inactive';
    host.dataset.sfQuickUserId = String(profile.userId);
    section.dataset.sfQuickStatus = active ? 'active' : 'inactive';
    section.dataset.sfQuickUserId = String(profile.userId);
    host.dispatchEvent(new CustomEvent('codela:quick-status', {
      detail:{active, userId:profile.userId, section}
    }));
  }
  async function initGuest(section, profile) {
    const report = active => announceQuickStatus(section, profile, active);
    const privateKey = await getKey(profile.deviceId);
    if (!privateKey) {
      await forgetRemembered(profile);
      report(false);
      return;
    }
    let browserStatus;
    try { browserStatus = await currentBrowserStatus(profile, privateKey); }
    catch (_) {
      // The network may be unavailable: keep normal Woo/Google login, never
      // present an unverified remembered account as usable.
      report(false);
      return;
    }
    if (browserStatus.authenticated) {
      // Cached anonymous HTML must not overrule an active WordPress session.
      freshAccountDocument();
      return;
    }
    if (browserStatus.active && browserStatus.paused) { report(false); return; } // Pause keeps the local key for later reactivation.
    if (!browserStatus.active) {
      await forgetRemembered(profile);
      report(false);
      return;
    }
    // A parallel tab may have disabled quick login while status was in flight.
    if (!accountStore.pins().some(x=>x.deviceId===profile.deviceId && x.userId===profile.userId)) {
      report(false); return;
    }
    const host = section.closest('.sf-overlay-auth') || section.closest('.woocommerce');
    if (!host) return;
    const choose = section.querySelector('.sf-quick-method--pin');
    const frame = section.querySelector('.sf-quick-account-frame');
    const inline = section.querySelector('.sf-quick-inline-pin');
    const changeAccount = section.querySelector('.sf-quick-switch');
    const name = section.querySelector('.sf-quick-user');
    const monogram = section.querySelector('.sf-quick-monogram');
    const scrim = section.querySelector('.sf-quick-scrim');
    const input = section.querySelector('.sf-quick-native-pin');
    const track = section.querySelector('.sf-quick-pin-track');
    const slots = [...section.querySelectorAll('.sf-quick-slot')];
    const status = section.querySelector('.sf-quick-status');
    if (!choose || !frame || !inline || !scrim || !input || !track || !status || slots.length !== 6) return;

    const displayName = String(profile.displayName || profile.username || '').trim();
    const rememberedEmail = String(profile.email || '').trim();
    // Email is the sole visible identity; keep the saved name only for the avatar.
    name.textContent = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rememberedEmail)
      ? rememberedEmail : t('account','Your account');
    monogram.textContent = Array.from(displayName || rememberedEmail)[0]?.toLocaleUpperCase() || '?';
    section.hidden = false;
    host.classList.add('sf-pin-active');
    inline.inert = true;
    // The passkey module may now enrich this SAME verified card with a Face ID
    // icon; no second welcome/identity card may be rendered beside it.
    report(true);

    let pending = false;
    let challengePromise = null;
    let challengeStarted = 0;
    let scrollFrame = 0;
    let keyboardLift = 0;
    const fullViewportHeight = window.visualViewport?.height || window.innerHeight;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const pause = ms => new Promise(resolve => window.setTimeout(resolve, reducedMotion ? 0 : ms));

    function getChallenge() {
      if (challengePromise && Date.now() - challengeStarted < 65000) return challengePromise;
      challengeStarted = Date.now();
      challengePromise = request('challenge', {
        user_id:profile.userId, device_id:profile.deviceId
      });
      return challengePromise;
    }

    function render() {
      const filtered = input.value.replace(/[^0-9]/g, '').slice(0, 6);
      if (input.value !== filtered) input.value = filtered;
      slots.forEach((slot, i) => {
        slot.classList.toggle('is-filled', i < filtered.length);
        slot.classList.toggle('is-current', i === filtered.length && filtered.length < 6);
      });
    }

    function clearTrack() {
      track.classList.remove('is-merging','is-checking','is-verified','is-error');
      slots.forEach(slot => slot.style.removeProperty('--sf-quick-shift'));
      input.value = '';
      render();
      status.textContent = '';
      status.classList.remove('is-error','is-success');
    }

    function keepCardVisible() {
      scrollFrame = 0;
      if (!section.classList.contains('is-inline-open')) return;
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop || 0;
      const viewportHeight = viewport?.height || window.innerHeight;
      const nativeKeyboardVisible = fullViewportHeight - viewportHeight > 110;
      // Safari's keyboard assistant, bottom URL pill and Done bar occupy
      // additional space above the keypad even inside visualViewport.
      // Reserve that space only while the system keyboard is visible.
      const browserChrome = nativeKeyboardVisible
        ? Math.min(140, Math.max(100, Math.round(fullViewportHeight * .14))) : 12;
      const safeTop = top + (nativeKeyboardVisible ? 100 : 12);
      const safeBottom = top + viewportHeight - browserChrome;
      const rect = frame.getBoundingClientRect();
      // Transforms affect getBoundingClientRect: undo our PREVIOUS lift
      // before computing the new target, otherwise resize events oscillate.
      const naturalTop = rect.top + keyboardLift;
      const naturalBottom = rect.bottom + keyboardLift;
      const requiredLift = Math.max(0, naturalBottom - safeBottom);
      const availableLift = Math.max(0, naturalTop - safeTop);
      keyboardLift = Math.min(requiredLift, availableLift);
      frame.style.setProperty('--sf-quick-keyboard-lift', (-keyboardLift) + 'px');
    }
    function queueCardAlignment() {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(keepCardVisible);
    }

    function closeInline(restoreFocus = true, force = false) {
      if (pending && !force) return;
      input.blur();
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
      keyboardLift = 0;
      frame.style.removeProperty('--sf-quick-keyboard-lift');
      section.classList.remove('is-inline-open');
      choose.setAttribute('aria-expanded','false');
      inline.setAttribute('aria-hidden','true');
      inline.inert = true;
      scrim.hidden = true;
      challengePromise = null;
      clearTrack();
      if (restoreFocus) choose.focus({preventScroll:true});
    }

    function openInline() {
      if (pending) return;
      clearTrack();
      section.classList.add('is-inline-open');
      choose.setAttribute('aria-expanded','true');
      inline.setAttribute('aria-hidden','false');
      inline.inert = false;
      scrim.hidden = false;
      // Commit the expanded layout synchronously before focusing. This keeps
      // Safari from treating the formerly collapsed child as invisible; the
      // focus still runs inside the real user-tap activation.
      void inline.offsetHeight;
      // This focus must occur directly in the user's tap event for iOS to
      // display the system numeric keypad. No custom keyboard is created.
      input.focus({preventScroll:true});
      queueCardAlignment();
      // The native iOS keyboard animates AFTER focus. A second measurement
      // catches its final viewport size without creating a fake keyboard.
      window.setTimeout(queueCardAlignment, 280);
    }

    function showNativeLogin(view = 'login') {
      if (pending) return;
      closeInline(false);
      if (section.contains(document.activeElement)) document.activeElement.blur();
      host.classList.remove('sf-pin-active');
      section.hidden = true;
      // Changing to native Woo password login never autofocuses the fields.
      const form = host.querySelector('#customer_login');
      form?.dispatchEvent(new CustomEvent('codela:auth-select', {
        detail:{view:view === 'register' ? 'register' : 'login'}
      }));
    }

    // After the verified response, the SIX squares converge and one center
    // square receives a tick. Never reveal correctness digit by digit.
    function mergeSlots() {
      const bounds = track.getBoundingClientRect();
      const middle = bounds.left + bounds.width / 2;
      slots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        slot.style.setProperty('--sf-quick-shift', (middle - rect.left - rect.width / 2) + 'px');
      });
      track.classList.add('is-merging');
    }

    async function submit() {
      if (pending || input.value.length !== 6) return;
      pending = true;
      // Dismiss the iOS numeric keyboard when digit six arrives. Verification
      // starts automatically and does not require the keyboard's Done arrow.
      input.blur();
      const pin = input.value;
      track.classList.add('is-checking');
      status.textContent = t('waiting','Signing in…');
      status.classList.remove('is-error','is-success');
      try {
        const challenge = await getChallenge();
        const message = 'codela-pin-login:v1:' + profile.userId + ':' + profile.deviceId + ':' + challenge.challenge;
        const signed = await signature(privateKey, message);
        const result = await request('verify', {
          user_id:profile.userId, device_id:profile.deviceId,
          challenge:challenge.challenge, signature:signed, pin
        });
        if (!result.ok || typeof result.account_url !== 'string') {
          throw Error(t('responseInvalid','Sign-in response could not be verified.'));
        }
        const destination = new URL(result.account_url, window.location.href);
        if (destination.origin !== window.location.origin) {
          throw Error(t('responseInvalid','Sign-in response could not be verified.'));
        }
        input.blur();
        track.classList.remove('is-checking');
        mergeSlots();
        await pause(580);
        track.classList.add('is-verified');
        status.textContent = t('success','Signed in'); // screen readers only
        status.classList.add('is-success');
        // WebKit/Safari must have time to finish the merged-square check
        // before the authenticated document replaces this guest card.
        await pause(650);
        // The server has already issued the real WordPress login cookie.
        // Bypass anonymous HTML caching with a disposable public query value.
        destination.searchParams.set('sf_quick_auth', Date.now().toString(36));
        section.classList.add('is-auth-redirecting');
        window.location.replace(destination.href);
      } catch (error) {
        track.classList.remove('is-checking','is-merging','is-verified');
        slots.forEach(slot => slot.style.removeProperty('--sf-quick-shift'));
        status.textContent = error.message || t('failed','Sign-in failed. Try again.');
        status.classList.add('is-error');
        track.classList.add('is-error');
        await pause(630);
        input.value = '';
        render();
        track.classList.remove('is-error');
        pending = false;
      } finally {
        challengePromise = null;
      }
    }

    choose.addEventListener('click', () => {
      accountStore.select(profile.userId);
      if (section.classList.contains('is-inline-open')) closeInline();
      else openInline();
    });
    changeAccount?.addEventListener('click', () => showNativeLogin('login'));
    section.querySelector('.sf-quick-native-alt')?.addEventListener('click', () => showNativeLogin('login'));
    section.addEventListener('codela:quick-pin-close', () => closeInline(false));
    scrim.addEventListener('click', () => closeInline());
    track.addEventListener('click', () => {
      if (!pending && section.classList.contains('is-inline-open')) input.focus({preventScroll:true});
    });
    const handleDigits = () => {
      if (pending) return;
      const oldLength = input.value.length;
      render();
      if (input.value.length && oldLength && !challengePromise) {
        void getChallenge().catch(() => { challengePromise = null; });
      }
      if (input.value.length === 6) {
        input.blur();
        void submit();
      } else {
        status.classList.remove('is-error');
        status.textContent = '';
        track.classList.remove('is-error');
      }
    };
    input.addEventListener('input', handleDigits);
    // Also catch iOS one-time-code insertion, keypad Done, and autofill paths
    // that dispatch a change event rather than a regular input event.
    input.addEventListener('change', handleDigits);
    input.addEventListener('compositionend', handleDigits);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && input.value.length === 6) {
        // Do not treat IME candidate confirmation as a PIN submit (including WebKit).
        if (event.isComposing || event.keyCode === 229) return;
        event.preventDefault();
        handleDigits();
      }
    });
    section.addEventListener('keydown', event => {
      if (!section.classList.contains('is-inline-open') || pending) return;
      if (event.key === 'Escape') { event.preventDefault(); closeInline(); }
    });
    window.visualViewport?.addEventListener('resize', queueCardAlignment, {passive:true});
    window.visualViewport?.addEventListener('scroll', queueCardAlignment, {passive:true});
    window.addEventListener('resize', queueCardAlignment, {passive:true});
    window.addEventListener('orientationchange', queueCardAlignment, {passive:true});

    // Another tab may revoke the recognized device while the card is open.
    window.addEventListener('storage', event => {
      if(![savedKey,savedListKey].includes(event.key))return;
      if(accountStore.pins().some(x=>x.deviceId===profile.deviceId))return;
      closeInline(false,true);
      section.hidden=true;
      if(!host.querySelector('.sf-quick-login:not([hidden])'))host.classList.remove('sf-pin-active');
    });
  }

  async function initSettings(settings) {
    const userId = Number(settings.dataset.userId);
    if (!Number.isSafeInteger(userId)) return;
    const button = settings.querySelector('.sf-quick-enable');
    const pinInput = settings.querySelector('.sf-quick-create');
    const confirm = settings.querySelector('.sf-quick-confirm');
    const status = settings.querySelector('.sf-quick-enroll-status');
    // Previous devices stored a username only. Refresh their display label
    // whenever the customer visits WooCommerce Account Information again.
    const remembered = accountStore.pins().find(x=>x.userId===userId);
    if (remembered) {
      accountStore.storePin({...remembered,
        displayName:settings.dataset.displayName || remembered.username || '',
        email:settings.dataset.email || remembered.email || ''
      });
    }
    button?.addEventListener('click', async () => {
      const pin = pinInput.value;
      if (!/^[0-9]{6}$/.test(pin) || pin !== confirm.value) {
        status.textContent = t('pinMismatch','Enter and confirm the same six digits.');
        return;
      }
      button.disabled = true;
      status.textContent = t('linking','Linking this browser securely…');
      let deviceId = '';
      try {
        const keypair = await crypto.subtle.generateKey(
          {name:'ECDSA',namedCurve:'P-256'}, false, ['sign','verify']
        );
        deviceId = randomDeviceId();
        await saveKey(deviceId,keypair.privateKey);
        const publicKey = b64(await crypto.subtle.exportKey('spki',keypair.publicKey));
        const signed = await signature(keypair.privateKey, 'codela-pin-enroll:v1:' + deviceId);
        await request('enroll', {
          device_id:deviceId, public_key:publicKey, signature:signed, pin
        });
        accountStore.storePin({
          deviceId, userId, username:settings.dataset.username || '',
          displayName:settings.dataset.displayName || settings.dataset.username || '',
          email:settings.dataset.email || ''
        });
        pinInput.value = '';
        confirm.value = '';
        status.textContent = t('enabled','Quick sign-in is enabled for this browser.');
        window.location.reload();
      } catch (error) {
        if (deviceId) try { await forgetKey(deviceId); } catch (_) {}
        status.textContent = error.message || t('enableFailed','Could not enable quick sign-in.');
      } finally { button.disabled = false; }
    });
    settings.querySelectorAll('.sf-quick-toggle').forEach(toggle => {
      toggle.addEventListener('click', async () => {
        toggle.disabled = true;
        try {
          await request('toggle', {device_id:toggle.dataset.deviceId, paused:toggle.dataset.paused !== '1'});
          window.location.reload();
        } catch (error) {
          status.textContent = error.message || 'Could not update this browser.';
          toggle.disabled = false;
        }
      });
    });
    settings.querySelectorAll('.sf-quick-revoke').forEach(button => {
      button.addEventListener('click', async () => {
        button.disabled = true;
        const deviceId = button.dataset.deviceId;
        try {
          await request('revoke', {device_id:deviceId});
          const profile = accountStore.pins().find(x=>x.deviceId===deviceId);
          if(profile) await forgetRemembered(profile);
          window.location.reload();
        } catch (error) {
          status.textContent = error.message || t('revokeFailed','Could not remove browser.');
          button.disabled = false;
        }
      });
    });
  }
  // One guest surface for every remembered user, regardless of whether they
  // have a PIN, a passkey, or both. The same markup is reused across /hesabim/
  // and the instantly opened account dialog; no second welcome card flashes.
  function renderGuestAccountGroups() {
    const users=new Map();
    for(const profile of accountStore.pins()){
      users.set(profile.userId,{userId:profile.userId,pin:profile,passkey:null});
    }
    for(const hint of accountStore.passkeys()){
      if(hint.paused)continue;
      const account=users.get(hint.userId)||{userId:hint.userId,pin:null,passkey:null};
      account.passkey=hint;
      users.set(hint.userId,account);
    }
    const preferred=accountStore.preferredUser();
    const accounts=[...users.values()].sort((a,b)=>
      Number(b.userId===preferred)-Number(a.userId===preferred)
    ).slice(0,8);
    if(!accounts.length)return [];
    const groups=[];
    for(const template of [...document.querySelectorAll('.sf-quick-login')]){
      if(template.closest('.sf-quick-accounts'))continue;
      const host=template.closest('.sf-overlay-auth')||template.closest('.woocommerce');
      if(!host)continue;
      const group=document.createElement('div');
      group.className='sf-quick-accounts';
      if(accounts.length>1)group.classList.add('has-many');
      const choice=template.querySelector('.sf-quick-choice');
      const hero=choice.querySelector('.sf-quick-choice-intro');
      const alternatives=choice.querySelector('.sf-quick-choice-alternatives');
      template.before(group);
      if(hero)group.append(hero);
      if(alternatives)alternatives.remove();
      for(const [index,account] of accounts.entries()){
        const section=index===0?template:template.cloneNode(true);
        if(index){
          section.classList.add('is-extra-account');
          section.querySelector('.sf-quick-choice-intro')?.remove();
          section.querySelector('.sf-quick-choice-alternatives')?.remove();
        }
        section.dataset.sfQuickUserId=String(account.userId);
        section.hidden=true;
        const pin=section.querySelector('.sf-quick-method--pin');
        if(pin){
          pin.hidden=!account.pin;
          const uid='sf-quick-inline-pin-'+account.userId;
          const inline=section.querySelector('.sf-quick-inline-pin');
          if(inline)inline.id=uid;
          pin.setAttribute('aria-controls',uid);
        }
        group.append(section);
        groups.push({section,account,host});
      }
      if(alternatives){
        group.append(alternatives);
        const nativeForm=host.querySelector('#customer_login') || host.querySelector('form.woocommerce-form-login');
        let returnButton=host.querySelector('.sf-quick-return');
        if(nativeForm && !returnButton){
          returnButton=document.createElement('button');
          returnButton.type='button';
          returnButton.className='sf-quick-return';
          returnButton.hidden=true;
          returnButton.setAttribute('aria-label','Hızlı giriş ekranına dön');
          const icon=document.createElement('span');
          icon.className='sf-quick-return-icon';
          icon.setAttribute('aria-hidden','true');
          // A platform-neutral Face ID scan icon also represents PIN/passkey.
          icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3"/><path d="M9 9h.01M15 9h.01M12 9v4M9 16c1.5 1.5 4.5 1.5 6 0"/></svg>';
          returnButton.append(icon,document.createTextNode('Hızlı girişe dön'));
          const social=host.querySelector('.sf-auth-social');
          if(social)social.before(returnButton);
          else nativeForm.before(returnButton);
        }
        const showNative=()=>{
          for(const child of group.querySelectorAll('.sf-quick-login.is-inline-open')){
            child.dispatchEvent(new CustomEvent('codela:quick-pin-close'));
          }
          group.hidden=true;
          host.classList.remove('sf-pin-active','sf-passkey-active');
          host.dispatchEvent(new Event('codela:smart-reset'));
          if(returnButton)returnButton.hidden=false;
          nativeForm?.dispatchEvent(new CustomEvent(
            'codela:auth-select',{detail:{view:'login'}}
          ));
        };
        returnButton?.addEventListener('click',()=>{
          // Reuse only the trusted, already verified cards. No reload,
          // no new authentication and no stale WordPress session restore.
          if(![...group.querySelectorAll('.sf-quick-login')].some(card=>!card.hidden))return;
          if(host.contains(document.activeElement) && document.activeElement instanceof HTMLElement){
            document.activeElement.blur();
          }
          host.classList.remove('sf-auth-focus-mode','sf-auth-register-view');
          returnButton.hidden=true;
          group.hidden=false;
          host.classList.add('sf-pin-active');
        });
        alternatives.querySelector('.sf-quick-switch')?.addEventListener('click',showNative);
        alternatives.querySelector('.sf-quick-native-alt')?.addEventListener('click',showNative);
      }
    }
    return groups;
  }

  function showPasskeyOnly(section,hint) {
    const host=section.closest('.sf-overlay-auth')||section.closest('.woocommerce');
    const name=String(hint.displayName||'').trim();
    const rememberedEmail=String(hint.email||'').trim();
    section.querySelector('.sf-quick-user').textContent=
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rememberedEmail)
        ? rememberedEmail : t('account','Your account');
    section.querySelector('.sf-quick-monogram').textContent=
      Array.from(name||rememberedEmail)[0]?.toLocaleUpperCase()||'?';
    const pin=section.querySelector('.sf-quick-method--pin');
    if(pin)pin.hidden=true;
    section.classList.add('is-passkey-only');
    section.hidden=false;
    host.classList.add('sf-pin-active');
    announceQuickStatus(section,hint,true);
  }
  async function init() {
    try {
    const identity=config.identity;
    // A different real Woo/Google login must NOT discard trusted devices for
    // other local customer accounts. Only refresh the signed-in user's hint.
    const signedInPin=identity && accountStore.pins().find(
      item=>item.userId===Number(identity.userId)
    );
    if(signedInPin){
      accountStore.storePin({...signedInPin,
        displayName:typeof identity.displayName==='string' && identity.displayName.trim()
          ? identity.displayName.trim():signedInPin.displayName,
        email:typeof identity.email==='string'?identity.email.trim():signedInPin.email
      });
    }
    if(!identity){
      const guests=renderGuestAccountGroups();
      // All guest options exist before the passkey script initializes.
      // PIN options must prove the browser key on the server; passkey-only
      // cards merely display a saved account hint until native WebAuthn.
      await Promise.all(guests.map(async ({section,account})=>{
        if(account.pin){
          try {await initGuest(section,account.pin);}
          catch (_){announceQuickStatus(section,account.pin,false);}
          if(section.hidden && account.passkey)showPasskeyOnly(section,account.passkey);
        } else if(account.passkey){
          showPasskeyOnly(section,account.passkey);
        }
      }));
      for(const group of document.querySelectorAll('.sf-quick-accounts')){
        const visible=[...group.querySelectorAll('.sf-quick-login')].some(node=>!node.hidden);
        group.hidden=!visible;
      }
    }
    for (const settings of document.querySelectorAll('.sf-quick-settings')) {
      void initSettings(settings);
    }
    } finally {
      // Atomically reveal either the verified remembered account or the native
      // Woo form; never paint the form first while the status request is pending.
      if (!document.documentElement.classList.contains('sf-quick-auth-redirect')) {
        document.documentElement.classList.remove('sf-quick-checking');
      }
      // The one-time redirect token is needed for the request, not for the
      // visible address. Keep the canonical /my-account/ URL after loading.
      if (config.accountPage) {
        const uri = new URL(window.location.href);
        if (uri.searchParams.has('sf_quick_auth')) {
          uri.searchParams.delete('sf_quick_auth');
          window.history.replaceState(window.history.state, '', uri.pathname + uri.search + uri.hash);
        }
      }
    }
  }
  // Safari/Chromium BFCache can restore a screen from before a login/logout.
  // On account pages, obtain a fresh server document rather than old DOM.
  window.addEventListener('pageshow', event => {
    if (event.persisted && config.accountPage) freshAccountDocument(window.location.href);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void init(), {once:true});
  else void init();
})();
