/**
 * Codela mobile interaction diagnostics (opt-in).
 * No report uploads, URLs, form values, cookies or account identifiers. Only
 * numeric timings, a guest/signed-in flag and fixed UI action names are stored
 * in the tab's sessionStorage until cleared.
 * Enable with ?codela_debug=1; disable with ?codela_debug=0 or Stop.
 */
(function(){
  'use strict';
  const key='codela-performance-debug';
  const historyKey='codela-performance-debug-history';
  const modeKey='codela-performance-debug-mode';
  const modes=['normal','no-animation','no-glass','both','nonmodal','guest-form-outside','static-body'];
  let mode='normal';
  try {const val=sessionStorage.getItem(modeKey);if(modes.includes(val))mode=val;}catch(e){}
  const noPanelMotion=()=>mode==='no-animation'||mode==='both';
  const noGlass=()=>mode==='no-glass'||mode==='both';
  const applyMode=()=>document.documentElement.classList.toggle('sf-perf-no-glass',noGlass());
  applyMode();
  const query=new URLSearchParams(location.search).get('codela_debug');
  try {
    if(query==='1') sessionStorage.setItem(key,'1');
    if(query==='0') sessionStorage.removeItem(key);
    if(query!=='1' && sessionStorage.getItem(key)!=='1') return;
    if(query==='0')return;
  } catch(e){if(query!=='1')return;}
  if(window.codelaSFDebug)return;
  const born=performance.now(), records=[], summaries=[];
  const limit=240;
  let longTaskObserver=null;
  let sequence=0, lastInput=null, expanded=false, hud=null, output=null, status=null, destroyed=false;
  const round=n=>Math.round(n*10)/10;
  const now=()=>performance.now();
  const time=()=>round(now()-born);
  const allowed=/^[a-z0-9][a-z0-9._-]{0,65}$/i;
  // A safe schema: no arbitrary strings/properties from external plugins or
  // user content can enter the diagnostic export.
  const fields=new Set(['id','control','source','inputDelay','modal','dockHidden',
    'dockCollapsed','scrollLocked','panel','from','alreadyOpen','elapsed',
    'visible','duration','opened','navigating','collapsed','delay','relocated',
    'index','target','afterInput','part','property','frames','firstFrame',
    'maxGap','p95Gap','droppedFrames','total','open','domReady','responseStart',
    'guest','request','lag','fromInput','visibility','phase','planned',
    'formIsolated','bodyFixed']);
  const labels=new Set(['menu','search','cart','account','filters','home',
    'product','catalog','checkout','content','page','none','other']);
  function clean(key,value){
    if(typeof value==='boolean')return value;
    if(typeof value==='number')return Number.isFinite(value)?round(value):null;
    if(typeof value!=='string')return null;
    if(['panel','from','target'].includes(key))return labels.has(value)?value:'other';
    if(key==='control')return /^(?:dock\.(?:home|search|cart|account|other)|panel\.(?:menu|search|cart|account|filters|close|other))$/.test(value)?value:'other';
    if(key==='source')return ['pointer','touch','click'].includes(value)?value:null;
    if(key==='request')return ['read','write'].includes(value)?value:null;
    if(key==='visibility')return ['visible','hidden','prerender'].includes(value)?value:null;
    if(key==='phase')return ['open','close'].includes(value)?value:null;
    if(key==='part')return ['dock','menu-trigger','panel'].includes(value)?value:null;
    if(key==='property')return ['transform','opacity','scale','visibility','other'].includes(value)?value:null;
    return null;
  }
  // Retain bounded, whitelisted timings across same-tab document navigations.
  // Everything stays inside sessionStorage and is wiped by Clear/Stop.
  let pageIndex=1;
  try {
    const saved=JSON.parse(sessionStorage.getItem(historyKey)||'null');
    if(saved && Array.isArray(saved.events)){
      pageIndex=Math.min(30,Math.max(1,Number(saved.pageIndex)||1)+1);
      for(const old of saved.events.slice(-140)){
        if(!old || typeof old.type!=='string' || !allowed.test(old.type))continue;
        const entry={type:old.type,ms:Number.isFinite(old.ms)?round(old.ms):0,page:Number.isFinite(old.page)?old.page:1};
        for(const [k,v] of Object.entries(old)){
          if(!fields.has(k))continue;
          const value=clean(k,v);
          if(value!==null)entry[k]=value;
        }
        records.push(entry);
      }
      if(Array.isArray(saved.samples)){
        for(const item of saved.samples.slice(-20)){
          if(!item || !Number.isFinite(item.firstFrame))continue;
          summaries.push({
            id:Number(item.id)||0,page:Number(item.page)||1,
            control:clean('control',item.control)||'other',
            frames:Number(item.frames)||0,firstFrame:round(item.firstFrame),
            maxGap:round(Number(item.maxGap)||0),
            p95Gap:round(Number(item.p95Gap)||0),
            droppedFrames:Number(item.droppedFrames)||0,
            total:round(Number(item.total)||0)
          });
        }
      }
    }
  } catch(e){}
  function record(type, data={}){
    if(destroyed)return;
    const item={ms:time(),page:pageIndex,type};
    for(const [k,v] of Object.entries(data)){
      if(!fields.has(k))continue;
      const safe=clean(k,v);
      if(safe!==null)item[k]=safe;
    }
    records.push(item);
    if(records.length>limit)records.shift();
    if(status && expanded)update();
    return item;
  }
  // Guest-only A/B: while testing Menu/Search/Cart, keep the native login
  // section outside the dialog top layer. This simulates the signed-in DOM
  // difference without dropping the Woo form or touching normal visitors.
  let guestForm=null;
  function restoreGuestForm(){
    if(!guestForm)return;
    const {section,marker,display,priority}=guestForm;
    if(marker.isConnected) marker.after(section);
    else document.querySelector('#sf-panel')?.append(section);
    if(display)section.style.setProperty('display',display,priority);
    else section.style.removeProperty('display');
    marker.remove();
    guestForm=null;
  }
  function preparePanel(name){
    if(mode!=='guest-form-outside' || name==='account' || document.body?.classList.contains('logged-in')){
      restoreGuestForm();
      return;
    }
    if(guestForm)return;
    const dialog=document.querySelector('#sf-panel');
    const section=dialog?.querySelector('#sf-account');
    // Never alter active account controls, and move only an already-hidden form.
    if(!section || !section.hidden || dialog.open)return;
    const marker=document.createComment('sf-guest-form-debug-home');
    const display=section.style.getPropertyValue('display');
    const priority=section.style.getPropertyPriority('display');
    section.before(marker);
    section.style.setProperty('display','none','important');
    document.body.append(section);
    guestForm={section,marker,display,priority};
    record('debug.guest-form-isolated',{guest:true});
  }
  const api={
    mark(type,details={}) {
      if(typeof type!=='string'||!allowed.test(type))return;
      record(type,details);
    },
    report(){
      return {
        tool:'codela-interaction-timing',
        schema:1,
        theme:'0.1.342',
        mode,
        pages:pageIndex,
        session:document.body?.classList.contains('logged-in')?'signed-in':'guest',
        device:{
          width:innerWidth,height:innerHeight,
          pixelRatio:Math.round((devicePixelRatio||1)*10)/10,
          platform:/iPad|iPhone|iPod/.test(navigator.userAgent)?'ios':/Android/.test(navigator.userAgent)?'android':'other',
          reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches
        },
        support:{longTask:longTaskSupported},
        samples:summaries.slice(-25),
        events:records.slice()
      };
    },
    clear(){
      records.length=0;summaries.length=0;sequence=0;lastInput=null;
      try{sessionStorage.removeItem(historyKey)}catch(e){}
      update();
    },
    skipPanelAnimation(element){
      return noPanelMotion() && !!element &&
        (element.id==='sf-menu'||element.classList?.contains('sf-search-content'));
    },
    setMode(val){
      if(!modes.includes(val)||val===mode)return;
      mode=val;
      try{sessionStorage.setItem(modeKey,mode)}catch(e){}
      applyMode();preparePanel('menu');api.clear();record('debug.mode-changed');
    },
    mode:()=>mode,
    skipBodyFix:()=>mode==='static-body',
    isGuestFormIsolated:()=>!!guestForm,
    preparePanel,
    useNonModal:()=>mode==='nonmodal',
    // Unlike the pointerdown timer, these probes run AFTER showModal()/close().
    // A 1.8s delay in both timers and frames implicates JS/event-loop blocking;
    // on-time timers with missing frames isolate WebKit rendering/throttling.
    postAction(phase,panel){
      if(!['open','close'].includes(phase)||!labels.has(panel)||destroyed)return;
      const started=now();
      record('post-action.begin',{phase,panel,visibility:document.visibilityState});
      for(const planned of [160,400,900]){
        setTimeout(()=>{
          if(destroyed)return;
          const elapsed=now()-started;
          record('post-action.timer',{
            phase,panel,planned,elapsed,lag:Math.max(0,elapsed-planned),
            visibility:document.visibilityState
          });
        },planned);
      }
      let previous=0,frames=0,maxGap=0;
      function frame(ts){
        if(destroyed)return;
        if(previous)maxGap=Math.max(maxGap,ts-previous);
        previous=ts;frames++;
        if(ts-started<900 && frames<120)requestAnimationFrame(frame);
        else record('post-action.frames',{phase,panel,frames,maxGap,elapsed:ts-started});
      }
      requestAnimationFrame(frame);
    }
  };
  window.codelaSFDebug=api;
  const longTaskSupported=!!(window.PerformanceObserver &&
    PerformanceObserver.supportedEntryTypes?.includes('longtask'));
  if(longTaskSupported){
    try {
      longTaskObserver=new PerformanceObserver(list=>{
        for(const entry of list.getEntries())record('long-task',{duration:entry.duration});
      });
      longTaskObserver.observe({type:'longtask'});
    }catch(e){}
  }
  function identify(el){
    if(!(el instanceof Element) || el.closest('#sf-performance-debug'))return null;
    const item=el.closest('.sf-dock-item');
    if(item)return 'dock.'+(['home','search','cart','account'].includes(item.dataset.dockView)?item.dataset.dockView:'other');
    const trigger=el.closest('[data-panel]');
    if(trigger)return 'panel.'+(['menu','search','cart','account','filters'].includes(trigger.dataset.panel)?trigger.dataset.panel:'other');
    if(el.closest('#sf-panel .sf-close,.sf-search-cancel'))return 'panel.close';
    if(el.closest('.sf-menu-trigger'))return 'panel.menu';
    return null;
  }
  function snapshot(){
    const modal=document.querySelector('#sf-panel');
    const dock=document.querySelector('.sf-mobile-dock');
    return {
      guest:!document.body?.classList.contains('logged-in'),
      modal:!!modal?.open,
      dockHidden:!!dock?.hidden,
      dockCollapsed:!!dock?.classList.contains('is-collapsed'),
      scrollLocked:document.documentElement.classList.contains('sf-overlay-scroll-locked'),
      visibility:document.visibilityState
    };
  }
  function start(label,source,stamp){
    if(destroyed)return;
    const id=++sequence,begin=now();
    lastInput={id,label,at:begin};
    const inputDelay=Math.max(0,begin-(stamp||begin));
    record('input',{id,control:label,source,inputDelay,...snapshot()});
    // Independent timer distinguishes JS event-loop stalls from rAF starvation.
    setTimeout(()=>{
      if(destroyed)return;
      const elapsed=now()-begin;
      record('timer.probe',{id,elapsed,lag:Math.max(0,elapsed-120),visibility:document.visibilityState});
    },120);
    // rAF timestamps are measured independently of handler work, with a short
    // bounded sample. A 200ms animation can finish while long JS blocks frames.
    const intervals=[];
    let prior=0,first=0,second=0;
    function frame(ts){
      if(!first){first=ts;record('frame.first',{id,fromInput:ts-begin,...snapshot()});}
      else {
        intervals.push(ts-prior);
        if(!second){second=ts;record('frame.second',{id,fromInput:ts-begin,...snapshot()});}
      }
      prior=ts;
      if(ts-begin<750 && intervals.length<90){requestAnimationFrame(frame);return;}
      const sorted=intervals.slice().sort((a,b)=>a-b);
      const result={
        id,page:pageIndex,control:label,frames:intervals.length+1,
        firstFrame:round(first-begin),
        maxGap:round(Math.max(0,...intervals)),
        p95Gap:round(sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)]||0),
        droppedFrames:intervals.filter(x=>x>34).length,
        total:round(ts-begin)
      };
      summaries.push(result);
      if(summaries.length>25)summaries.shift();
      record('frames.summary',result);
    }
    requestAnimationFrame(frame);
  }
  const stamp=e=>{
    // Safari Event.timeStamp is normally relative to timeOrigin. Older engines
    // expose epoch timestamps; do not classify those as multi-year input delay.
    const t=e.timeStamp;
    return Number.isFinite(t)&&t>=0&&t<=performance.now()+1000?t:now();
  };
  document.addEventListener('pointerdown',e=>{
    const label=identify(e.target);if(label)start(label,'pointer',stamp(e));
  },true);
  document.addEventListener('touchstart',e=>{
    if(lastInput && now()-lastInput.at<100)return;
    const label=identify(e.target);if(label)start(label,'touch',stamp(e));
  },{capture:true,passive:true});
  document.addEventListener('click',e=>{
    const label=identify(e.target);if(!label)return;
    const recent=lastInput && lastInput.label===label && now()-lastInput.at<900;
    if(recent)record('click',{id:lastInput.id,control:label,afterInput:now()-lastInput.at});
    else start(label,'click',stamp(e));
  },true);
  // Fixed status events do not include route paths or any user content.
  document.addEventListener('visibilitychange',()=>record('page.visibility',{visibility:document.visibilityState}));
  document.addEventListener('transitionend',e=>{
    if(!e.target.closest?.('.sf-mobile-dock,.sf-menu-trigger,#sf-panel'))return;
    const part=e.target.closest('.sf-mobile-dock')?'dock':
      e.target.closest('.sf-menu-trigger')?'menu-trigger':'panel';
    const property=['transform','opacity','scale','visibility'].includes(e.propertyName)?e.propertyName:'other';
    record('transition.end',{part,property,elapsed:e.elapsedTime*1000});
  },true);
  const observer=new MutationObserver(changes=>{
    for(const m of changes){
      const target=m.target;
      if(target.id==='sf-panel') record('dialog.state',{open:target.open});
      else if(target.classList?.contains('sf-mobile-dock'))record('dock.state',{hidden:target.hidden,collapsed:target.classList.contains('is-collapsed')});
    }
  });
  function connect(){
    const modal=document.querySelector('#sf-panel'),dock=document.querySelector('.sf-mobile-dock');
    if(modal)observer.observe(modal,{attributes:true,attributeFilter:['open']});
    if(dock)observer.observe(dock,{attributes:true,attributeFilter:['hidden','class']});
  }
  function update(){
    if(!hud || !status)return;
    const latest=summaries.at(-1);
    status.textContent=records.length+' kayıt'+(latest?' · son '+latest.control+
      ' · ilk kare '+latest.firstFrame+'ms · en uzun kare '+latest.maxGap+'ms':'');
  }
  const style=`
  #sf-performance-debug{position:fixed;top:calc(76px + env(safe-area-inset-top,0px));left:12px;z-index:2147483000;
    font:12px/1.45 system-ui,-apple-system,sans-serif;color:#1c1c1e;direction:ltr}
  #sf-performance-debug *{box-sizing:border-box;font-family:inherit}
  #sf-performance-debug button{cursor:pointer;border:0;border-radius:999px;padding:8px 13px;font-size:12px;font-weight:600;
    color:#222;background:#f5f5f7;box-shadow:inset 0 0 0 1px #d7d7db}
  #sf-performance-debug .sf-debug-toggle{background:#252525;color:#fff;min-height:36px;box-shadow:0 3px 12px #0003}
  #sf-performance-debug .sf-debug-body{width:min(325px,calc(100vw - 24px));padding:14px;background:#fff;
    border:1px solid #d6d6db;border-radius:18px;box-shadow:0 8px 32px #0002;margin-top:8px}
  #sf-performance-debug .sf-debug-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
  #sf-performance-debug .sf-debug-desc{color:#666;line-height:1.5;margin-top:6px}
  #sf-performance-debug .sf-debug-status{font-variant-numeric:tabular-nums;font-weight:600;word-break:break-word}
  #sf-performance-debug textarea{width:100%;height:145px;margin-top:8px;border:1px solid #d7d7db;border-radius:8px;
    padding:8px;font-size:10px;resize:vertical;display:none}
  #sf-performance-debug .sf-debug-modes{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:10px}
  #sf-performance-debug .sf-debug-modes button:is([data-mode="nonmodal"],[data-mode="guest-form-outside"],[data-mode="static-body"]){grid-column:1/-1}
  #sf-panel.sf-perf-nonmodal{z-index:2147481000!important}
  #sf-performance-debug .sf-debug-modes button{border-radius:10px;padding:7px 5px}
  #sf-performance-debug .sf-debug-modes button[aria-pressed="true"]{background:#262629;color:white;box-shadow:none}
  html.sf-perf-no-glass .sf-mobile-dock .sf-dock-surface,
  html.sf-perf-no-glass .sf-shell .sf-header .sf-glisse-glass-plate,
  html.sf-perf-no-glass .sf-shell .sf-header .sf-ui-surface,
  html.sf-perf-no-glass #sf-panel .sf-ui-surface,
  html.sf-perf-no-glass #sf-panel button.sf-ui-icon-button--soft{
    -webkit-backdrop-filter:none!important;backdrop-filter:none!important;
    background:rgba(249,250,252,.97)!important;
  }
  `;
  function bootstrap(){
    if(!document.body || destroyed)return;
    connect();
    preparePanel('menu');
    const sheet=document.createElement('style');sheet.id='sf-performance-debug-style';sheet.textContent=style;
    document.head.append(sheet);
    hud=document.createElement('div');hud.id='sf-performance-debug';
    hud.innerHTML='<button type="button" class="sf-debug-toggle" aria-expanded="false">PERF · DEBUG</button>'+
      '<div class="sf-debug-body" hidden><div class="sf-debug-status" aria-live="polite"></div>'+
      '<div class="sf-debug-desc">Menü ve alt menüyü 5–6 kez kullan. Rapor yalnızca süreleri ve arayüz durumlarını içerir; otomatik gönderilmez.</div>'+
      '<div class="sf-debug-modes" role="group" aria-label="Performans deneme modu">'+
      '<button type="button" data-mode="normal">Normal</button>'+
      '<button type="button" data-mode="no-animation">Animasyonsuz</button>'+
      '<button type="button" data-mode="no-glass">Camsız</button>'+
      '<button type="button" data-mode="both">İkisi kapalı</button>'+
      '<button type="button" data-mode="nonmodal">Yerel modal olmadan</button>'+
       '<button type="button" data-mode="guest-form-outside">Misafir formu dialog dışında</button>'+
       '<button type="button" data-mode="static-body">Body sabitleme olmadan</button></div>'+
      '<div class="sf-debug-actions"><button type="button" data-action="copy">Raporu kopyala</button>'+
      '<button type="button" data-action="clear">Temizle</button>'+
      '<button type="button" data-action="stop">Kapat</button></div>'+
      '<textarea aria-label="Kopyalanamayan rapor"></textarea></div>';
    document.body.append(hud);
    status=hud.querySelector('.sf-debug-status');
    output=hud.querySelector('textarea');
    const toggle=hud.querySelector('.sf-debug-toggle'),body=hud.querySelector('.sf-debug-body');
    toggle.addEventListener('click',()=>{expanded=!expanded;body.hidden=!expanded;toggle.setAttribute('aria-expanded',String(expanded));update()});
    const paintMode=()=>hud.querySelectorAll('[data-mode]').forEach(button=>
      button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
    hud.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
      api.setMode(button.dataset.mode);paintMode();
    }));
    paintMode();
    hud.querySelector('[data-action="clear"]').addEventListener('click',()=>api.clear());
    hud.querySelector('[data-action="stop"]').addEventListener('click',()=>{
      try{sessionStorage.removeItem(key);sessionStorage.removeItem(historyKey);sessionStorage.removeItem(modeKey)}catch(e){}
      document.documentElement.classList.remove('sf-perf-no-glass');
      restoreGuestForm();destroyed=true;observer.disconnect();longTaskObserver?.disconnect();hud.remove();sheet.remove();
      delete window.codelaSFDebug;
    });
    hud.querySelector('[data-action="copy"]').addEventListener('click',async()=>{
      const data=JSON.stringify(api.report(),null,2);
      try{
        if(!navigator.clipboard?.writeText)throw Error('clipboard-unavailable');
        await navigator.clipboard.writeText(data);
        status.textContent='Rapor kopyalandı · '+records.length+' kayıt';
      }catch(e){
        output.style.display='block';output.value=data;output.focus();output.select();
        status.textContent='Kopyalama engellendi: aşağıdaki metni seçip kopyala.';
      }
    });
    update();
    record('debug.ready',{...snapshot()});
    const nav=performance.getEntriesByType('navigation')[0];
    if(nav)record('page.navigation',{duration:nav.duration,
      domReady:nav.domContentLoadedEventEnd,responseStart:nav.responseStart});
  }
  window.addEventListener('pagehide',()=>{
    try {sessionStorage.setItem(historyKey,JSON.stringify({
      pageIndex,events:records.slice(-140),samples:summaries.slice(-20)
    }))}catch(e){}
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap,{once:true});
  else bootstrap();
})();
