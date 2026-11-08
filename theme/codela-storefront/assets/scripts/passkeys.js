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
  async function signIn(node) {
    if (!available) { notify(node,'Bu cihazda geçiş anahtarı desteklenmiyor. E-posta ile devam edebilirsiniz.'); return; }
    notify(node,'Telefon doğrulaması açılıyor…');
    try {
      const options = await post('/assert-options');
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
    if(!host || !available)return;
    const remembered = getHint();
    if (remembered && !remembered.paused) {
      const name = section.querySelector('.sf-pk-name');
      const detail = section.querySelector('.sf-pk-detail');
      const avatar = section.querySelector('.sf-pk-avatar');
      if (remembered.displayName) {
        name.textContent=remembered.displayName;
        avatar.textContent=Array.from(remembered.displayName)[0]?.toUpperCase()||'◉';
      }
      if (remembered.email) detail.textContent=remembered.email;
      section.hidden=false;
      host.classList.add('sf-passkey-active');
      const btn = section.querySelector('.sf-pk-choice');
      const result = document.createElement('p');
      result.className='sf-pk-guest-status';
      result.setAttribute('role','status');result.setAttribute('aria-live','polite');
      btn.after(result);
      btn.addEventListener('click',()=>signIn(result));
      section.querySelector('.sf-pk-use-email')?.addEventListener('click',()=>{
        host.classList.remove('sf-passkey-active','sf-pin-active');
        host.querySelectorAll('.sf-quick-login').forEach(node=>node.hidden=true);
        section.hidden=true;
      });
      return;
    }
    // A synced passkey may exist on a new phone without a local hint.
    // Keep the native Woo login fully visible and add an optional action.
    const button = document.createElement('button');
    button.type='button'; button.className='sf-pk-discover';
    button.textContent='Telefonla hızlı giriş';
    const result=document.createElement('p');result.className='sf-pk-guest-status';
    result.setAttribute('role','status');result.setAttribute('aria-live','polite');
    const login = host.querySelector('#customer_login');
    if (login) {
      login.parentNode.insertBefore(button, login);
      button.after(result);
      button.addEventListener('click',()=>signIn(result));
    }
  }
  function init(){
    document.querySelectorAll('[data-pk-settings]').forEach(initSettings);
    document.querySelectorAll('.sf-pk-guest').forEach(initGuest);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
