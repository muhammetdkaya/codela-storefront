/**
 * Codela Storefront browser-bound quick login.
 * Private ECDSA key: non-exportable CryptoKey in IndexedDB (not localStorage).
 * localStorage contains a display-only profile hint, NEVER a PIN or password.
 */
(() => {
  'use strict';
  const config = window.CodelaQuickLogin;
  if (!config || !window.isSecureContext || !crypto?.subtle || !window.indexedDB) return;
  const savedKey = 'codela_sf_quick_profile_v1';
  const databaseName = 'codela_sf_quick_keys_v1';
  const encoding = new TextEncoder();
  const t = (key, fallback) => config.strings?.[key] || fallback;
  const log = () => {
    try {
      const profile = JSON.parse(localStorage.getItem(savedKey) || 'null');
      return profile && Number.isSafeInteger(profile.userId)
        && /^[a-f0-9]{32}$/.test(profile.deviceId || '') ? profile : null;
    } catch (_) { return null; }
  };
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
    if (log()?.deviceId === profile.deviceId) localStorage.removeItem(savedKey);
    try { await forgetKey(profile.deviceId); } catch (_) { /* Already unavailable. */ }
  }

  function freshAccountDocument(url = config.account || window.location.href) {
    const destination = new URL(url, window.location.href);
    if (destination.origin !== window.location.origin) return;
    destination.searchParams.set('sf_quick_auth', Date.now().toString(36));
    window.location.replace(destination.href);
  }

  async function initGuest(section, profile) {
    const privateKey = await getKey(profile.deviceId);
    if (!privateKey) {
      await forgetRemembered(profile);
      return;
    }
    let browserStatus;
    try { browserStatus = await currentBrowserStatus(profile, privateKey); }
    catch (_) {
      // The network may be unavailable: keep normal Woo/Google login, never
      // present an unverified remembered account as usable.
      return;
    }
    if (browserStatus.authenticated) {
      // Cached anonymous HTML must not overrule an active WordPress session.
      freshAccountDocument();
      return;
    }
    if (!browserStatus.active) {
      await forgetRemembered(profile);
      return;
    }
    // A parallel tab may have disabled quick login while status was in flight.
    if (log()?.deviceId !== profile.deviceId) return;
    const host = section.closest('.sf-overlay-auth') || section.closest('.woocommerce');
    if (!host) return;
    const choose = section.querySelector('.sf-quick-account');
    const changeAccount = section.querySelector('.sf-quick-switch');
    const name = section.querySelector('.sf-quick-user');
    const email = section.querySelector('.sf-quick-email');
    const monogram = section.querySelector('.sf-quick-monogram');
    const scrim = section.querySelector('.sf-quick-scrim');
    const sheet = section.querySelector('.sf-quick-sheet');
    const close = section.querySelector('.sf-quick-close');
    const input = section.querySelector('.sf-quick-native-pin');
    const track = section.querySelector('.sf-quick-pin-track');
    const slots = [...section.querySelectorAll('.sf-quick-slot')];
    const status = section.querySelector('.sf-quick-status');
    const password = section.querySelector('.sf-quick-password');
    if (!choose || !sheet || !input || slots.length !== 6) return;

    const displayName = String(profile.displayName || profile.username || t('account','Your account')).trim();
    name.textContent = displayName;
    const rememberedEmail = String(profile.email || '').trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rememberedEmail)) {
      email.textContent = rememberedEmail;
      email.hidden = false;
    }
    monogram.textContent = Array.from(displayName)[0]?.toLocaleUpperCase() || '?';
    section.hidden = false;
    host.classList.add('sf-pin-active');
    // Sign-out retains an explicitly trusted device; explicit disable and
    // account switching do not. Honor cross-tab storage updates immediately.
    window.addEventListener('storage', event => {
      if (event.key !== savedKey || log()?.deviceId === profile.deviceId) return;
      input.blur();
      section.hidden = true;
      host.classList.remove('sf-pin-active');
      if (!sheet.hidden) {
        sheet.hidden = true;
        scrim.hidden = true;
        document.documentElement.classList.remove('sf-quick-modal-open');
      }
    });

    let pending = false;
    let challengePromise = null;
    let challengeStarted = 0;
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

    function clearTrack() {
      track.classList.remove('is-merging','is-verifying','is-verified','is-error');
      slots.forEach(slot => slot.style.removeProperty('--sf-quick-shift'));
      input.disabled = false;
      input.value = '';
      render();
    }

    function render() {
      const filtered = input.value.replace(/[^0-9]/g, '').slice(0, 6);
      if (input.value !== filtered) input.value = filtered;
      slots.forEach((slot, i) => {
        slot.classList.toggle('is-filled', i < filtered.length);
        slot.classList.toggle('is-current', i === filtered.length);
      });
    }

    function updateKeyboard() {
      if (sheet.hidden) return;
      const viewport = window.visualViewport;
      const lift = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0;
      sheet.style.setProperty('--sf-quick-keyboard-lift', lift + 'px');
    }

    function openSheet() {
      if (pending) return;
      clearTrack();
      status.textContent = '';
      scrim.hidden = false;
      sheet.hidden = false;
      section.classList.add('is-sheet-open');
      document.documentElement.classList.add('sf-quick-modal-open');
      updateKeyboard();
      // The browser's native numeric keyboard must be triggered by this direct
      // tap; no custom keypad is rendered by Codela.
      input.focus({preventScroll:true});
    }

    function closeSheet() {
      if (pending) return;
      input.blur();
      sheet.hidden = true;
      scrim.hidden = true;
      sheet.style.removeProperty('--sf-quick-keyboard-lift');
      section.classList.remove('is-sheet-open');
      document.documentElement.classList.remove('sf-quick-modal-open');
      challengePromise = null;
      clearTrack();
      choose.focus({preventScroll:true});
    }

    function showNativeLogin() {
      if (pending) return;
      closeSheet();
      host.classList.remove('sf-pin-active');
      section.hidden = true;
      // WooCommerce's original login/register and Google buttons stay intact.
      host.querySelector('input[name="username"]')?.focus({preventScroll:true});
    }

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
      const pin = input.value;
      input.blur();
      input.disabled = true;
      status.textContent = t('waiting','Signing in…');
      status.classList.remove('is-error','is-success');
      mergeSlots();
      // Network verification and visual merging run concurrently. A success
      // check is never drawn before the WooCommerce REST session is issued.
      const mergeFinished = pause(440).then(() => track.classList.add('is-verifying'));
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
        await mergeFinished;
        track.classList.add('is-verified');
        status.classList.add('is-success');
        status.textContent = t('success','Signed in');
        await pause(420);
        // This document was rendered as an anonymous WooCommerce page. A
        // same-URL navigation can show a cached guest view even after the
        // server has issued a valid WordPress login cookie. Force an uncached
        // full DOCUMENT navigation with a one-time public cache-buster.
        const destination = new URL(result.account_url, window.location.href);
        if (destination.origin !== window.location.origin) {
          throw Error(t('responseInvalid','Sign-in response could not be verified.'));
        }
        destination.searchParams.set('sf_quick_auth', Date.now().toString(36));
        section.classList.add('is-auth-redirecting');
        window.location.replace(destination.href);
      } catch (error) {
        await mergeFinished;
        status.textContent = error.message || t('failed','Sign-in failed. Try again.');
        status.classList.add('is-error');
        clearTrack();
        track.classList.add('is-error');
        pending = false;
      } finally {
        challengePromise = null;
      }
    }

    choose.addEventListener('click', openSheet);
    changeAccount?.addEventListener('click', showNativeLogin);
    password?.addEventListener('click', showNativeLogin);
    close?.addEventListener('click', closeSheet);
    scrim?.addEventListener('click', closeSheet);
    input.addEventListener('input', () => {
      if (pending) return;
      const oldLength = input.value.length;
      render();
      if (input.value.length && oldLength && !challengePromise) {
        void getChallenge().catch(() => { challengePromise = null; });
      }
      if (input.value.length === 6) void submit();
      else {
        status.classList.remove('is-error');
        status.textContent = '';
        track.classList.remove('is-error');
      }
    });
    section.addEventListener('keydown', event => {
      if (sheet.hidden || pending) return;
      if (event.key === 'Escape') { event.preventDefault(); closeSheet(); }
      if (event.key === 'Tab') {
        const nodes = [close,input,password,section.querySelector('.sf-quick-lost-password')].filter(Boolean);
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    });
    window.visualViewport?.addEventListener('resize', updateKeyboard, {passive:true});
    window.visualViewport?.addEventListener('scroll', updateKeyboard, {passive:true});
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
    const remembered = log();
    if (remembered && remembered.userId === userId) {
      remembered.displayName = settings.dataset.displayName || remembered.username || '';
      remembered.email = settings.dataset.email || remembered.email || '';
      localStorage.setItem(savedKey, JSON.stringify(remembered));
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
        localStorage.setItem(savedKey, JSON.stringify({
          deviceId, userId, username:settings.dataset.username || '',
          displayName:settings.dataset.displayName || settings.dataset.username || '',
          email:settings.dataset.email || ''
        }));
        pinInput.value = '';
        confirm.value = '';
        status.textContent = t('enabled','Quick sign-in is enabled for this browser.');
        window.location.reload();
      } catch (error) {
        if (deviceId) try { await forgetKey(deviceId); } catch (_) {}
        status.textContent = error.message || t('enableFailed','Could not enable quick sign-in.');
      } finally { button.disabled = false; }
    });
    settings.querySelectorAll('.sf-quick-revoke').forEach(button => {
      button.addEventListener('click', async () => {
        button.disabled = true;
        const deviceId = button.dataset.deviceId;
        try {
          await request('revoke', {device_id:deviceId});
          const profile = log();
          if (profile && profile.deviceId === deviceId) {
            localStorage.removeItem(savedKey);
            await forgetKey(deviceId);
          }
          window.location.reload();
        } catch (error) {
          status.textContent = error.message || t('revokeFailed','Could not remove browser.');
          button.disabled = false;
        }
      });
    });
  }
  async function init() {
    const profile = log();
    // A previously enrolled browser may have saved only "demo". On the next
    // normal Woo sign-in, replace that hint with the actual customer name.
    if (profile && Number.isSafeInteger(Number(config.identity?.userId))
      && Number(config.identity.userId) > 0 && Number(config.identity.userId) !== profile.userId) {
      // Google or password signed into a DIFFERENT customer. Never suggest
      // the previous account on subsequent logout; discard its local key.
      await forgetRemembered(profile);
    } else if (profile && config.identity?.userId === profile.userId) {
      // A signed-in account refreshes its *own* display metadata only.
      if (typeof config.identity.displayName === 'string' && config.identity.displayName.trim()) {
        profile.displayName = config.identity.displayName.trim();
      }
      profile.email = typeof config.identity.email === 'string' ? config.identity.email.trim() : (profile.email || '');
      localStorage.setItem(savedKey, JSON.stringify(profile));
    }
    if (log()) {
      // All login surfaces refer to the same browser key but are independent dialogs.
      for (const section of document.querySelectorAll('.sf-quick-login')) {
        try { await initGuest(section,log()); }
        catch (_) { /* Always preserve the native Woo login fallback. */ }
      }
    }
    for (const settings of document.querySelectorAll('.sf-quick-settings')) {
      void initSettings(settings);
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
