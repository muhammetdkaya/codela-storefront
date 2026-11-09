/**
 * Codela Smart Auth: progressive, single-page presentation of WooCommerce's
 * ORIGINAL forms. No duplicate auth endpoint, cookie handler or password
 * verification. With JavaScript disabled, native Woo forms still work.
 */
(() => {
  'use strict';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const query = (root,selector) => root.querySelector(selector);
  function initRoot(root) {
    const intro = query(root,'.sf-account-intro');
    const loginForm = query(root,'form.woocommerce-form-login');
    if (!intro?.dataset.authLookupUrl || !loginForm || root.classList.contains('sf-smart-auth-active')) return;
    const container = query(root,'#customer_login');
    const registerForm = query(root,'form.woocommerce-form-register');
    const loginUser = query(loginForm,'input[name="username"],input#username');
    const loginPassword = query(loginForm,'input[name="password"],input#password');
    if (!loginUser || !loginPassword) return;
    const registerEmail = registerForm && query(registerForm,'input[name="email"]');
    const registerPassword = registerForm && query(registerForm,'input[name="password"]');
    const registerUsername = registerForm && query(registerForm,'input[name="username"]');
    const first = registerForm && query(registerForm,'input[name="first_name"]');
    const last = registerForm && query(registerForm,'input[name="last_name"]');
    const registerAllowed = !!(registerForm && registerEmail && first && last);
    const registerSubmit=registerForm && query(registerForm,'button[type="submit"],input[type="submit"]');
    // Keep WooCommerce's native button/nonce, but give the automatic signup
    // step an unmistakable action label instead of the default "Join".
    if(registerSubmit){
      const registerLabel=intro.dataset.authSmartRegisterAction||'Register';
      if(registerSubmit.tagName==='INPUT')registerSubmit.value=registerLabel;
      else registerSubmit.textContent=registerLabel;
    }
    let strength=null;
    if(registerPassword){
      registerPassword.placeholder=intro.dataset.authSmartRegisterPassword||'Password (8+ characters)';
      registerPassword.minLength=Math.max(registerPassword.minLength||0,8);
      strength=document.createElement('div');
      strength.className='sf-smart-strength';
      strength.hidden=true;
      strength.dataset.level='0';
      const bars=document.createElement('span');
      bars.className='sf-smart-strength-bars';
      bars.setAttribute('aria-hidden','true');
      for(let i=0;i<3;i++)bars.append(document.createElement('span'));
      const feedback=document.createElement('span');
      feedback.className='sf-smart-strength-feedback';
      feedback.setAttribute('role','status');
      feedback.setAttribute('aria-live','polite');
      strength.append(bars,feedback);
      registerPassword.closest('.form-row,.woocommerce-form-row')?.after(strength);
    }
    const passwordQuality=value=>{
      if(!value)return {level:0,eligible:false,message:intro.dataset.authSmartStrengthMin||'At least 8 characters'};
      if(value.length<8)return {level:1,eligible:false,message:intro.dataset.authSmartStrengthMin||'At least 8 characters'};
      const variety=Number(/[a-zA-Z]/.test(value))+Number(/[0-9]/.test(value))+Number(/[^a-zA-Z0-9]/.test(value));
      const common=/^(?:password|12345678|qwerty|abcdefgh|11111111)/i.test(value)||/^(.)\1{7,}$/.test(value);
      if(variety<2||common)return {level:1,eligible:false,message:intro.dataset.authSmartStrengthMix||'Add a number or symbol'};
      const strong=value.length>=12&&variety>=3;
      return {level:strong?3:2,eligible:true,message:strong?(intro.dataset.authSmartStrengthStrong||'Strong password'):(intro.dataset.authSmartStrengthOk||'Password meets requirements')};
    };

    const shell=document.createElement('div');
    shell.className='sf-smart-auth';
    const label=document.createElement('label');
    label.className='sf-smart-label';
    label.textContent=intro.dataset.authSmartLabel||'Email address';
    const input=document.createElement('input');
    input.className='sf-smart-identity';
    input.type='email';input.inputMode='email';input.maxLength=254;input.autocomplete='email';
    input.autocapitalize='none';input.spellcheck=false;
    input.placeholder=intro.dataset.authSmartLabel||'Email address';
    input.setAttribute('aria-label',input.placeholder);
    input.setAttribute('aria-describedby','sf-smart-message');
    label.append(input);
    const indicator=document.createElement('span');
    indicator.className='sf-smart-progress';
    indicator.setAttribute('aria-hidden','true');indicator.hidden=true;
    label.append(indicator);
    const hint=document.createElement('p');
    hint.className='sf-smart-message';hint.id='sf-smart-message';
    hint.setAttribute('role','status');hint.setAttribute('aria-live','polite');
    // An editable email input is the only identity control. No separate
    // "change email" action, login/register tabs or username prompt.
    const actions=document.createElement('div');actions.className='sf-smart-actions';
    const manual=document.createElement('button');
    manual.type='button';manual.className='sf-smart-manual-register';
    manual.textContent=intro.dataset.authSmartContinue||'Continue with email';
    manual.hidden=true;actions.append(manual);
    actions.hidden=true;
    shell.append(label,hint,actions);
    const insertion=container||loginForm;
    insertion.before(shell);
    root.classList.add('sf-smart-auth-active','sf-smart-start');
    const loginRow=loginUser.closest('.form-row,.woocommerce-form-row');
    loginRow?.classList.add('sf-smart-native-identity');
    registerEmail?.closest('.form-row,.woocommerce-form-row')?.classList.add('sf-smart-register-email');
    loginPassword.closest('.form-row,.woocommerce-form-row')?.classList.add('sf-smart-password-row');
    if(registerUsername){
      registerUsername.closest('.form-row,.woocommerce-form-row')?.classList.add('sf-smart-register-username');
    }
    const passwordHelp=document.createElement('p');
    passwordHelp.className='sf-smart-password-help';
    passwordHelp.textContent=intro.dataset.authSmartPasswordLink||'Your password setup link will be sent by email.';
    if(registerAllowed && !registerPassword){
      const submit=registerForm.querySelector('button[type="submit"],input[type="submit"]');
      submit?.closest('.form-row')?.before(passwordHelp);
    }
    const nativeRegisterCTA=query(root,'.sf-auth-register-cta');
    if(nativeRegisterCTA)nativeRegisterCTA.setAttribute('tabindex','-1');
    let stage='start',active='',sequence=0,timer=0,controller=null;
    let lastProcessedIdentity='';
    const cache=new Map();
    const status=message=>{hint.textContent=message||'';};
    const chooseForm=view=>{
      // Keep the real Woo nonce and server processing. This event also updates
      // Woo's existing registration/header state without navigation.
      container?.dispatchEvent(new CustomEvent('codela:auth-select',{
        detail:{view:view==='new'?'register':'login'}
      }));
      // A single welcome heading persists across both native form stages.
      const title=query(intro,'.sf-auth-heading-text');
      if(title)title.textContent=intro.dataset.authSmartTitle||intro.dataset.authLoginTitle||'Welcome';
      const sub=query(intro,'.sf-auth-description');
      if(sub)sub.textContent=intro.dataset.authSmartDescription||intro.dataset.authLoginDescription||'Sign in securely.';
      const wave=query(intro,'.sf-auth-heading-wave');
      if(wave)wave.hidden=false;
    };
    const setStage=(next,message='')=>{
      stage=next;
      root.classList.remove('sf-smart-start','sf-smart-checking','sf-smart-existing','sf-smart-new','sf-smart-closed','sf-smart-unavailable','sf-smart-partial','sf-smart-password-ready','sf-smart-register-ready');
      root.classList.add('sf-smart-'+next);
      status(message);
      indicator.hidden=!['checking','existing','new'].includes(next);
      indicator.dataset.state=next==='checking'?'checking':'done';
      // The fallback appears only when an actual email lookup fails.
      // A new address opens the same native Woo registration form automatically.
      manual.hidden=!registerAllowed || !(next==='unavailable' && emailPattern.test(active));
      actions.hidden=manual.hidden;
      if(next==='new' && registerAllowed) {
        chooseForm('new');
        registerEmail.value=active;
        if(registerUsername){
          // Woo stores with username autogeneration disabled still require the
          // native reg_username POST. Use the email as the account login name,
          // without asking the visitor to create a second identifier.
          registerUsername.value=active;
        }
      }else{
        chooseForm('login');
        loginUser.value=active;
      }
      updateSubmit();
    };
    const updateSubmit=()=>{
      if(stage==='existing' && active && loginPassword.value.length>0){
        root.classList.add('sf-smart-password-ready');
      }else root.classList.remove('sf-smart-password-ready');
      if(stage==='new' && registerAllowed){
        const hasNames=first.value.trim().length>0 && last.value.trim().length>0;
        const quality=registerPassword?passwordQuality(registerPassword.value):null;
        const hasPassword=!quality || quality.eligible;
        if(strength){
          strength.hidden=false;
          strength.dataset.level=String(quality.level);
          strength.querySelector('.sf-smart-strength-feedback').textContent=quality.message;
        }
        const hasUsername=!registerUsername || registerUsername.value.trim()===active;
        const ready=hasNames&&hasPassword&&hasUsername;
        root.classList.toggle('sf-smart-register-ready',ready);
        if(registerSubmit)registerSubmit.disabled=!ready;
      }else{
        root.classList.remove('sf-smart-register-ready');
        if(registerSubmit)registerSubmit.disabled=false;
        if(strength)strength.hidden=true;
      }
    };
    const abort=()=>{
      sequence++;clearTimeout(timer);
      if(controller){controller.abort();controller=null;}
    };
    const check=()=>{
      abort();
      active=input.value.trim();
      loginUser.value=active;
      // Clear fields only on an actual identity change, never merely because
      // iOS fires "change" when tapping the inline registration action.
      if(active!==lastProcessedIdentity){
        loginPassword.value='';
        if(registerPassword)registerPassword.value='';
        if(first)first.value='';
        if(last)last.value='';
        if(registerUsername)registerUsername.value='';
        lastProcessedIdentity=active;
      }
      if(registerEmail && emailPattern.test(active))registerEmail.value=active;
      if(!active){setStage('start');return;}
      // Only complete email addresses enter the account discovery flow.
      // Arbitrary text such as "test" must never open a password field.
      if(!emailPattern.test(active) || active.length>254){
        // Incomplete emails get a lightweight, immediate hint; never open
        // a password or register form from unverified input.
        const message=!active.includes('@')
          ? intro.dataset.authSmartMissingAt||'Add @ to your email address.'
          : intro.dataset.authSmartIncomplete||'Complete your email address.';
        setStage('start',message);
        root.classList.add('sf-smart-partial');
        indicator.hidden=false;
        indicator.dataset.state='invalid';
        return;
      }
      if(cache.has(active.toLowerCase())){setStage(cache.get(active.toLowerCase()));return;}
      setStage('checking',intro.dataset.authSmartChecking||'Checking account…');
      const request=sequence,lookupEmail=active;
      timer=window.setTimeout(async()=>{
        controller=new AbortController();
        try{
          const body=new URLSearchParams({
            action:'codela_sf_auth_lookup',identity:lookupEmail,
            token:intro.dataset.authLookupNonce||''
          });
          const resp=await fetch(intro.dataset.authLookupUrl,{
            method:'POST',credentials:'same-origin',cache:'no-store',
            headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
            body,signal:controller.signal
          });
          const result=await resp.json();
          if(request!==sequence)return;
          if(!resp.ok || !['existing','new','closed'].includes(result.status))throw Error('lookup unavailable');
          const next=result.status==='new'&&!registerAllowed?'closed':result.status;
          cache.set(lookupEmail.toLowerCase(),next);
          setStage(next,next==='closed'?intro.dataset.authSmartClosed||'Registration unavailable.':'');
        }catch(error){
          if(request!==sequence || error.name==='AbortError')return;
          setStage('unavailable',intro.dataset.authSmartError||'Check unavailable.');
        }finally{
          if(request===sequence)controller=null;
        }
      },680);
    };
    input.addEventListener('input',check);
    input.addEventListener('change',()=>{
      // Autofill can update without input events; blur after an ordinary
      // keystroke must NOT restart lookup or undo a chosen registration stage.
      if(input.value.trim()!==lastProcessedIdentity)check();
    });
    input.addEventListener('keydown',event=>{
      if(event.key==='Enter'){
        event.preventDefault();
        if(stage==='existing' && loginPassword.value)loginForm.requestSubmit();
        else if(stage==='new' && registerForm && root.classList.contains('sf-smart-register-ready'))registerForm.requestSubmit();
        else input.blur();
      }
    });
    manual.addEventListener('click',()=>{
      if(!registerAllowed)return;
      if(!emailPattern.test(active)){
        setStage('start',intro.dataset.authSmartConfirm||'Please enter a valid email address.');
        input.focus();return;
      }
      setStage('new');
    });
    loginPassword.addEventListener('input',updateSubmit);
    for(const field of [first,last,registerPassword,registerUsername]){
      field?.addEventListener('input',updateSubmit);
    }
    loginForm.addEventListener('submit',event=>{
      loginUser.value=input.value.trim();
      if(!['existing','unavailable'].includes(stage) || !emailPattern.test(loginUser.value) || !loginPassword.value){
        event.preventDefault();
      }
    },true);
    if(registerForm){
      registerForm.addEventListener('submit',event=>{
        if(stage!=='new' || !emailPattern.test(active) || !root.classList.contains('sf-smart-register-ready')){
          event.preventDefault();status(intro.dataset.authSmartNameRequired||'Please fill all fields.');return;
        }
        registerEmail.value=active;
      },true);
    }
    setStage('start');
    // Reflect a native email autofill without an unsolicited focus request.
    if(loginUser.value && !input.value){
      input.value=loginUser.value;check();
    }
    // On a rejected Woo POST, keep the relevant native registration visible.
    if(intro.dataset.authInitial==='register' && registerAllowed && registerEmail.value){
      input.value=registerEmail.value;active=input.value.trim();
      if(emailPattern.test(active)){
        if(registerUsername)registerUsername.value=active;
        setStage('new');
      }else setStage('start');
    }
    root.closest('#sf-account')?.addEventListener('codela:account-open',()=>{
      // Updated nonce is available after the native nonce refresh resolves.
      updateSubmit();
    });
    root.addEventListener('codela:smart-reset',()=>{
      abort();
      active='';input.value='';loginUser.value='';loginPassword.value='';
      if(registerEmail)registerEmail.value='';
      if(registerPassword)registerPassword.value='';
      setStage('start');
    });
    root.addEventListener('codela:auth-nonce-refreshed',event=>{
      if(event.detail?.lookup_nonce)intro.dataset.authLookupNonce=event.detail.lookup_nonce;
    });
  }
  const start=()=>{
    for(const root of document.querySelectorAll('.woocommerce')){
      if(root.querySelector('.sf-account-intro'))initRoot(root);
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
