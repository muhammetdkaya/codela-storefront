/**
 * Codela Storefront WebAuthn passkeys.
 * Native platform verification only; no fake Face ID, no biometric material,
 * and no session until WordPress verifies the signed assertion.
 */
(() => {
  'use strict';
  const config = window.CodelaSFPasskey;
  if (!config) return;
  const key = 'codela_sf_passkey_hint_v1';
  const available = !!(window.isSecureContext && window.PublicKeyCredential && navigator.credentials);
  const getHint = () => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && Number.isSafeInteger(value.userId) && typeof value.credentialId === 'string' ? value : null;
    } catch (_) { return null; }
  };
  const encode = input => {
    const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input || []);
    let text = '';
    for (const byte of bytes) text += String.fromCharCode(byte);
    return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const decode = text => Uint8Array.from(atob(String(text).replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - String(text).length % 4) % 4)), ch => ch.charCodeAt(0));
  const toCreationOptions = data => {
    if (PublicKeyCredential.parseCreationOptionsFromJSON) {
      return PublicKeyCredential.parseCreationOptionsFromJSON(data);
    }
    return { ...data, challenge:decode(data.challenge), user:{...data.user,id:decode(data.user.id)},
      excludeCredentials:(data.excludeCredentials || []).map(item=>({...item,id:decode(item.id)})) };
  };
  const toRequestOptions = data => {
    if (PublicKeyCredential.parseRequestOptionsFromJSON) {
      return PublicKeyCredential.parseRequestOptionsFromJSON(data);
    }
    return {...data,challenge:decode(data.challenge),
      allowCredentials:(data.allowCredentials||[]).map(item=>({...item,id:decode(item.id)}))};
  };
  const identity = config.identity;
  const hint = getHint();
  if (hint && identity && identity.userId !== hint.userId) {
    localStorage.removeItem(key); // Different signed-in customer: do not show old name.
  }
  async function post(path, data = {}) {
    const headers = {'Content-Type':'application/json'};
    if (config.nonce) headers['X-WP-Nonce'] = config.nonce;
    const res = await fetch(config.rest + path, {method:'POST', credentials:'same-origin',
      cache:'no-store',headers,body:JSON.stringify(data)});
    let result;
    try { result = await res.json(); } catch (_) { result = {}; }
    if (!res.ok || result?.code || result?.ok === false) {
      throw Error(result?.message || 'Doğrulama tamamlanamadı. Yeniden deneyin.');
    }
    return result;
  }
  function notify(node, message) {
    if (node) node.textContent = message;
  }
  function responseJSON(credential) {
    return {
      id:encode(credential.rawId),
      response:{
        clientDataJSON:encode(credential.response.clientDataJSON),
        authenticatorData:encode(credential.response.getAuthenticatorData?.() || credential.response.authenticatorData),
        publicKey:credential.response.getPublicKey ? encode(credential.response.getPublicKey()) : '',
        signature:credential.response.signature ? encode(credential.response.signature) : '',
        userHandle:credential.response.userHandle ? encode(credential.response.userHandle) : '',
      }
    };
  }
  async function signIn(node, button) {
    if (button?.disabled) return;
    if (!available) { notify(node,'Bu cihazda geçiş anahtarı desteklenmiyor. E-posta ile devam edebilirsiniz.'); return; }
    // Only the selected Face ID glyph animates while the real iOS/Android
    // authenticator is pending. No visible "Telefon doğrulaması açılıyor" row.
    notify(node,'');
    if (button) {
      button.disabled = true;
      button.classList.add('is-verifying');
      button.setAttribute('aria-busy','true');
    }
    try {
      // Target this exact saved credential rather than making iOS present a
      // general passkey/account picker before its system verification.
      // The server independently confirms it is active and challenge-binds it.
      const remembered = getHint();
      const selectedId = remembered && !remembered.paused ? remembered.credentialId : '';
      const options = await post('/assert-options', selectedId ? {credential_id:selectedId} : {});
      const credential = await navigator.credentials.get({
        publicKey:toRequestOptions(options.publicKey), mediation:'optional',
      });
      if (!credential || credential.type !== 'public-key') throw Error('Kimlik doğrulama iptal edildi.');
      const body = responseJSON(credential);
      const result = await post('/assert', {requestId:options.requestId, id:body.id,response:body.response});
      if (!result.ok || typeof result.account_url !== 'string') throw Error('Sunucu girişe izin vermedi.');
      const url = new URL(result.account_url,location.href);
      if (url.origin !== location.origin) throw Error('Geçersiz yönlendirme.');
      // Real WordPress auth cookie has already been set by the server.
      url.searchParams.set('sf_quick_auth',Date.now().toString(36));
      window.location.replace(url.href);
    } catch (error) {
      notify(node, error?.name === 'NotAllowedError' ? 'Doğrulama iptal edildi.' :
        (error?.message || 'Giriş tamamlanamadı.'));
    } finally {
      if (button) {
        button.disabled = false;
        button.classList.remove('is-verifying');
        button.removeAttribute('aria-busy');
      }
    }
  }
  async function register(settings, button, status) {
    if (!available || !navigator.credentials.create) {
      notify(status,'Bu tarayıcıda cihazla giriş desteklenmiyor. 6 haneli PIN kullanılabilir.');
      return;
    }
    button.disabled = true;
    notify(status,'Telefon doğrulaması açılıyor…');
    try {
      const options = await post('/register-options');
      const credential = await navigator.credentials.create({publicKey:toCreationOptions(options)});
      if (!credential || credential.type !== 'public-key') throw Error('Anahtar oluşturulamadı.');
      if (!credential.response.getPublicKey || !credential.response.getAuthenticatorData) {
        throw Error('Bu tarayıcı WebAuthn anahtar kayıt biçimini desteklemiyor.');
      }
      const body = responseJSON(credential);
      const result = await post('/register', {id:body.id,response:body.response});
      if (!result.ok) throw Error('Anahtar sunucuya kaydedilemedi.');
      localStorage.setItem(key,JSON.stringify({
        credentialId:body.id,userId:identity.userId,
        displayName:identity.displayName,email:identity.email,paused:false,
      }));
      notify(status,'Giriş anahtarı etkinleştirildi.');
      window.location.reload();
    } catch (error) {
      notify(status,error?.name === 'NotAllowedError' ? 'İşlem iptal edildi.' :
        (error?.message || 'Giriş anahtarı oluşturulamadı.'));
      button.disabled = false;
    }
  }
  function initSettings(settings) {
    const status = settings.querySelector('.sf-pk-result');
    const enroll = settings.querySelector('.sf-pk-enroll');
    enroll?.addEventListener('click', () => register(settings,enroll,status));
    settings.querySelectorAll('.sf-pk-record').forEach(row => {
      const id = row.dataset.credentialId;
      const paused = row.querySelector('.sf-pk-record-caption small')?.textContent?.trim() === 'Paused'
        || row.querySelector('.sf-pk-record-caption small')?.textContent?.trim() === 'Duraklatıldı';
      const toggle = row.querySelector('.sf-pk-toggle');
      const revoke = row.querySelector('.sf-pk-revoke');
      async function manage(action, target) {
        if (action==='revoke' && !window.confirm('Bu cihaz giriş anahtarı kalıcı olarak kaldırılacak. Onaylıyor musunuz?')) return;
        target.disabled = true;
        try {
          await post('/manage',{id,action});
          const stored = getHint();
          if(stored?.credentialId===id){
            if(action==='revoke') localStorage.removeItem(key);
            else localStorage.setItem(key,JSON.stringify({...stored,paused:action==='pause'}));
          }
          window.location.reload();
        }catch(error){notify(status,error.message);target.disabled=false}
      }
      toggle?.addEventListener('click',()=>manage(paused?'resume':'pause',toggle));
      revoke?.addEventListener('click',()=>manage('revoke',revoke));
    });
    const legacyToggle = settings.querySelector('.sf-pk-legacy-toggle');
    const legacyContent = settings.querySelector('.sf-pk-legacy-content');
    legacyToggle?.addEventListener('click',()=>{
      const open = legacyToggle.getAttribute('aria-expanded') !== 'true';
      legacyToggle.setAttribute('aria-expanded',String(open));
      legacyContent.hidden=!open;
    });
  }
  function initGuest(section) {
    const host = section.closest('.sf-overlay-auth') || section.closest('.woocommerce');
    if (!host || !available) return;
    const remembered = getHint();
    if (!remembered || remembered.paused) return;

    const name = section.querySelector('.sf-pk-name');
    const detail = section.querySelector('.sf-pk-detail');
    const avatar = section.querySelector('.sf-pk-avatar');
    if (remembered.displayName) {
      name.textContent = remembered.displayName;
      avatar.textContent = Array.from(remembered.displayName)[0]?.toUpperCase() || '◉';
    }
    if (remembered.email) detail.textContent = remembered.email;

    const standalone = () => {
      section.hidden = false;
      host.classList.remove('sf-pin-active');
      host.classList.add('sf-passkey-active');
      const button = section.querySelector('.sf-pk-choice');
      const result = document.createElement('p');
      result.className = 'sf-pk-guest-status';
      result.setAttribute('role','status');
      result.setAttribute('aria-live','polite');
      button.after(result);
      button.addEventListener('click', () => void signIn(result, button));
    };

    const useNative = () => {
      host.classList.remove('sf-passkey-active','sf-pin-active');
      host.querySelectorAll('.sf-quick-login').forEach(node => { node.hidden = true; });
      section.hidden = true;
    };
    section.querySelector('.sf-pk-use-email')?.addEventListener('click', useNative);

    // A verified PIN and a remembered passkey for this SAME customer share
    // ONE identity card. Wait for the PIN server check before deciding which
    // view to paint; independent script startup used to flash both surfaces.
    let legacy = null;
    try {
      legacy = JSON.parse(localStorage.getItem('codela_sf_quick_profile_v1') || 'null');
    } catch (_) { /* No valid browser PIN hint. */ }
    const matchingPin = legacy?.userId === remembered.userId
      && /^[0-9a-f]{32}$/.test(legacy.deviceId || '');
    if (!matchingPin) {
      standalone();
      return;
    }

    let resolved = false;
    let safetyTimer = null;
    const onQuickStatus = event => {
      const data = event.detail;
      if (resolved || !data || Number(data.userId) !== remembered.userId) return;
      resolved = true;
      if (safetyTimer) clearTimeout(safetyTimer);
      host.removeEventListener('codela:quick-status', onQuickStatus);
      const quick = host.querySelector('.sf-quick-login');
      const bio = quick?.querySelector('.sf-quick-method--passkey');
      if (!data.active || !quick || quick.hidden || !bio) {
        standalone();
        return;
      }
      // PIN is already trusted by the server. Preserve its expanded inline
      // code interface and add a separate native biometric gesture target.
      quick.classList.add('has-passkey');
      bio.hidden = false;
      section.hidden = true;
      host.classList.remove('sf-passkey-active');
      const error = document.createElement('p');
      error.className = 'sf-quick-passkey-error';
      error.setAttribute('role','status');
      error.setAttribute('aria-live','polite');
      quick.querySelector('.sf-quick-account-frame')?.after(error);
      bio.addEventListener('click', () => {
        if (bio.disabled) return;
        if (quick.querySelector('.sf-quick-pin-track.is-checking')) return;
        if (quick.classList.contains('is-inline-open')) {
          quick.dispatchEvent(new CustomEvent('codela:quick-pin-close'));
        }
        void signIn(error, bio);
      });
    };

    host.addEventListener('codela:quick-status', onQuickStatus);
    if (host.dataset.sfQuickStatus && Number(host.dataset.sfQuickUserId) === remembered.userId) {
      onQuickStatus({detail:{active:host.dataset.sfQuickStatus === 'active',
        userId:remembered.userId}});
    } else {
      // If a browser's PIN module is unavailable, never trap the visitor
      // behind the preflight skeleton; show the working passkey alone.
      safetyTimer = window.setTimeout(() => onQuickStatus({
        detail:{active:false,userId:remembered.userId}
      }), 13500);
    }
  }
  function init(){
    document.querySelectorAll('[data-pk-settings]').forEach(initSettings);
    document.querySelectorAll('.sf-pk-guest').forEach(initGuest);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
