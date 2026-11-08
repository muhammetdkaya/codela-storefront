/**
 * Codela Storefront WebAuthn passkeys.
 * Native platform verification only; no fake Face ID, no biometric material,
 * and no session until WordPress verifies the signed assertion.
 */
(() => {
  'use strict';
  const config = window.CodelaSFPasskey;
  if (!config) return;
  const key = 'codela_sf_passkey_hint_v1'; // Legacy single-account hint.
  const store = window.CodelaSFRemembered;
  const available = !!(window.isSecureContext && window.PublicKeyCredential && navigator.credentials);
  const getHints = () => {
    if(store)return store.passkeys();
    try {
      const value=JSON.parse(localStorage.getItem(key)||'null');
      return value && Number.isSafeInteger(value.userId) && typeof value.credentialId==='string'
        ? [value]:[];
    }catch(_){return []}
  };
  const getHint = userId => getHints().find(x=>x.userId===Number(userId)) ||
    (!userId ? getHints()[0] : null);
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
  // Multiple remembered customers are intentional. Switching the real
  // WordPress account does not revoke other local passkeys or PIN devices.
  // Old entries are removed only through an explicit revoke or server denial.
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
  async function signIn(node, button, selectedHint = null) {
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
      const remembered = selectedHint || getHint();
      const selectedId = remembered && !remembered.paused ? remembered.credentialId : '';
      if(remembered?.userId)store?.select(remembered.userId);
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
      // Never draw the success check before the server has issued the real
      // WordPress authentication cookie. Animate the SVG check, then navigate.
      if(button){
        button.classList.remove('is-verifying');
        button.classList.add('is-verified');
        button.setAttribute('aria-label','Doğrulandı');
      }
      await new Promise(resolve=>window.setTimeout(resolve,
        window.matchMedia?.('(prefers-reduced-motion:reduce)').matches?0:390));
      url.searchParams.set('sf_quick_auth',Date.now().toString(36));
      window.location.replace(url.href);
    } catch (error) {
      notify(node, error?.name === 'NotAllowedError' ? 'Doğrulama iptal edildi.' :
        (error?.message || 'Giriş tamamlanamadı.'));
      if(button){
        button.classList.add('is-rejected');
        window.setTimeout(()=>button.classList.remove('is-rejected'),470);
      }
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
      const saved={credentialId:body.id,userId:identity.userId,
        displayName:identity.displayName,email:identity.email,paused:false};
      if(store)store.storePasskey(saved);
      else localStorage.setItem(key,JSON.stringify(saved));
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
          const stored=getHints().find(item=>item.credentialId===id);
          if(stored){
            if(store){
              if(action==='revoke')store.forgetPasskey(id);
              else store.setPasskeyPaused(id,action==='pause');
            } else if(action==='revoke')localStorage.removeItem(key);
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
    const host=section.closest('.sf-overlay-auth')||section.closest('.woocommerce');
    if(!host||!available)return;
    const hints=getHints().filter(h=>!h.paused);
    if(!hints.length)return;

    // One face icon belongs to its own local customer card. Never duplicate
    // the welcome page or promote a saved hint to an authenticated session.
    const connectCards=()=>{
      for(const quick of host.querySelectorAll('.sf-quick-login[data-sf-user-id]')){
        const hint=hints.find(item=>item.userId===Number(quick.dataset.sfQuickUserId));
        if(!hint)continue;
        const button=quick.querySelector('.sf-quick-method--passkey');
        if(!button||button.dataset.sfBioBound==='yes')continue;
        button.dataset.sfBioBound='yes';
        button.hidden=false;
        quick.classList.add('has-passkey');
        quick.closest('.sf-quick-accounts')?.classList.add('has-passkey');
        section.hidden=true;
        const error=document.createElement('p');
        error.className='sf-quick-passkey-error';
        error.setAttribute('role','status');
        error.setAttribute('aria-live','polite');
        quick.querySelector('.sf-quick-account-frame')?.after(error);
        button.addEventListener('click',()=>{
          if(button.disabled)return;
          if(quick.querySelector('.sf-quick-pin-track.is-checking'))return;
          if(quick.classList.contains('is-inline-open')){
            quick.dispatchEvent(new CustomEvent('codela:quick-pin-close'));
          }
          void signIn(error,button,hint);
        });
      }
    };
    host.addEventListener('codela:quick-status',connectCards);
    connectCards();
    if(host.querySelector('.sf-quick-accounts'))return;

    // Defensive native fallback if the PIN/UI module cannot initialize.
    const remembered=getHint();
    if(!remembered||remembered.paused)return;
    const name=section.querySelector('.sf-pk-name');
    const detail=section.querySelector('.sf-pk-detail');
    const avatar=section.querySelector('.sf-pk-avatar');
    if(remembered.displayName && name && avatar){
      name.textContent=remembered.displayName;
      avatar.textContent=Array.from(remembered.displayName)[0]?.toUpperCase()||'◉';
    }
    if(remembered.email && detail)detail.textContent=remembered.email;
    section.hidden=false;
    host.classList.add('sf-passkey-active');
    const button=section.querySelector('.sf-pk-choice');
    const status=document.createElement('p');
    status.className='sf-pk-guest-status';
    status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    button.after(status);
    button.addEventListener('click',()=>void signIn(status,button,remembered));
    section.querySelector('.sf-pk-use-email')?.addEventListener('click',()=>{
      host.classList.remove('sf-passkey-active','sf-pin-active');
      section.hidden=true;
    });
  }
  function init(){
    document.querySelectorAll('[data-pk-settings]').forEach(initSettings);
    document.querySelectorAll('.sf-pk-guest').forEach(initGuest);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
