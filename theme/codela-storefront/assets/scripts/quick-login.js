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
    const response = await fetch(config.rest + path, {
      method:'POST', credentials:'same-origin', cache:'no-store',
      headers, body:JSON.stringify(payload)
    });
    let body = {};
    try { body = await response.json(); } catch (_) {}
    if (!response.ok) throw Error(body.message || t('requestFailed','Request could not be completed. Try again.'));
    return body;
  }
  const randomDeviceId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(v => v.toString(16).padStart(2,'0')).join('');

  async function initGuest(section, profile) {
    const privateKey = await getKey(profile.deviceId);
    if (!privateKey) {
      localStorage.removeItem(savedKey);
      return;
    }
    const host = section.closest('.sf-overlay-auth') || section.closest('.woocommerce');
    if (!host) return;
    const dots = [...section.querySelectorAll('.sf-quick-dots span')];
    const buttons = [...section.querySelectorAll('[data-quick-digit]')];
    const status = section.querySelector('.sf-quick-status');
    const username = section.querySelector('.sf-quick-user');
    username.textContent = profile.username || t('account','Your account');
    section.hidden = false;
    host.classList.add('sf-pin-active');
    let pin = '';
    let pending = false;
    const render = () => dots.forEach((dot,i) => dot.classList.toggle('is-filled', i < pin.length));
    const lock = value => {
      pending = value;
      buttons.forEach(button => button.disabled = value);
      section.classList.toggle('is-pending', value);
    };
    async function submit() {
      if (pin.length !== 6 || pending) return;
      lock(true);
      status.textContent = t('waiting','Signing in…');
      try {
        const challenge = await request('challenge', {
          user_id:profile.userId, device_id:profile.deviceId
        });
        const message = 'codela-pin-login:v1:' + profile.userId + ':' + profile.deviceId + ':' + challenge.challenge;
        const signed = await signature(privateKey, message);
        const result = await request('verify', {
          user_id:profile.userId, device_id:profile.deviceId,
          challenge:challenge.challenge, signature:signed, pin
        });
        pin = '';
        status.textContent = t('success','Signed in');
        if (result.ok && typeof result.account_url === 'string') {
          window.location.assign(result.account_url);
          return;
        }
        throw Error(t('responseInvalid','Sign-in response could not be verified.'));
      } catch (error) {
        status.textContent = error.message || t('failed','Sign-in failed. Try again.');
        pin = '';
        render();
        section.classList.add('is-error');
        window.setTimeout(() => section.classList.remove('is-error'), 380);
      } finally { lock(false); }
    }
    function enter(value) {
      if (pending) return;
      status.textContent = '';
      if (value === 'erase') pin = pin.slice(0,-1);
      else if (pin.length < 6 && /^[0-9]$/.test(value)) pin += value;
      render();
      if (pin.length === 6) void submit();
    }
    buttons.forEach(button => button.addEventListener('click', () => enter(button.dataset.quickDigit)));
    // Physical keyboards are supported when the quick-login view is visible.
    section.addEventListener('keydown', event => {
      if (event.key === 'Backspace') { event.preventDefault(); enter('erase'); }
      else if (/^[0-9]$/.test(event.key)) { event.preventDefault(); enter(event.key); }
    });
    section.querySelector('.sf-quick-password')?.addEventListener('click', () => {
      host.classList.remove('sf-pin-active');
      section.hidden = true;
    });
    section.querySelector('.sf-quick-forget')?.addEventListener('click', async () => {
      try { await forgetKey(profile.deviceId); } catch (_) {}
      localStorage.removeItem(savedKey);
      host.classList.remove('sf-pin-active');
      section.hidden = true;
    });
  }

  async function initSettings(settings) {
    const userId = Number(settings.dataset.userId);
    if (!Number.isSafeInteger(userId)) return;
    const button = settings.querySelector('.sf-quick-enable');
    const pinInput = settings.querySelector('.sf-quick-create');
    const confirm = settings.querySelector('.sf-quick-confirm');
    const status = settings.querySelector('.sf-quick-enroll-status');
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
          deviceId, userId, username:settings.dataset.username || ''
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
    if (profile) {
      // All login surfaces refer to the same browser key but are independent dialogs.
      for (const section of document.querySelectorAll('.sf-quick-login')) {
        try { await initGuest(section,profile); }
        catch (_) { /* Always preserve the native Woo login fallback. */ }
      }
    }
    for (const settings of document.querySelectorAll('.sf-quick-settings')) {
      void initSettings(settings);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void init(), {once:true});
  else void init();
})();
