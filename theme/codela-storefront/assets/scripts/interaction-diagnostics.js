/**
 * Codela mobile interaction diagnostics (opt-in, administrators only).
 * No network calls, no URLs, form values, cookies, account data or storage of
 * reports. Only numeric timings and fixed UI action names are captured.
 * Enable with ?codela_debug=1; disable with ?codela_debug=0 or Stop.
 */
(function(){
  'use strict';
  const key='codela-performance-debug';
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
  function clean(value){
    if(value===null || typeof value==='boolean')return value;
    if(typeof value==='number')return Number.isFinite(value)?round(value):null;
    if(typeof value==='string' && allowed.test(value))return value;
    return null;
  }
  function record(type, fields={}){
    if(destroyed)return;
    const item={ms:time(),type};
    for(const [k,v] of Object.entries(fields)){
      if(!allowed.test(k))continue;
      const safe=clean(v);
      if(safe!==null)item[k]=safe;
    }
    records.push(item);
    if(records.length>limit)records.shift();
    if(status && expanded)update();
    return item;
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
        theme:'0.1.331',
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
    clear(){records.length=0;summaries.length=0;sequence=0;lastInput=null;update();}
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
      modal:!!modal?.open,
      dockHidden:!!dock?.hidden,
      dockCollapsed:!!dock?.classList.contains('is-collapsed'),
      scrollLocked:document.documentElement.classList.contains('sf-overlay-scroll-locked')
    };
  }
  function start(label,source,stamp){
    if(destroyed)return;
    const id=++sequence,begin=now();
    lastInput={id,label,at:begin};
    const inputDelay=Math.max(0,begin-(stamp||begin));
    record('input',{id,control:label,source,inputDelay,...snapshot()});
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
        id,control:label,frames:intervals.length+1,
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
  `;
  function bootstrap(){
    if(!document.body || destroyed)return;
    connect();
    const sheet=document.createElement('style');sheet.id='sf-performance-debug-style';sheet.textContent=style;
    document.head.append(sheet);
    hud=document.createElement('div');hud.id='sf-performance-debug';
    hud.innerHTML='<button type="button" class="sf-debug-toggle" aria-expanded="false">PERF · DEBUG</button>'+
      '<div class="sf-debug-body" hidden><div class="sf-debug-status" aria-live="polite"></div>'+
      '<div class="sf-debug-desc">Menü ve alt menüyü 5–6 kez kullan. Rapor yalnızca süreleri ve arayüz durumlarını içerir; otomatik gönderilmez.</div>'+
      '<div class="sf-debug-actions"><button type="button" data-action="copy">Raporu kopyala</button>'+
      '<button type="button" data-action="clear">Temizle</button>'+
      '<button type="button" data-action="stop">Kapat</button></div>'+
      '<textarea aria-label="Kopyalanamayan rapor"></textarea></div>';
    document.body.append(hud);
    status=hud.querySelector('.sf-debug-status');
    output=hud.querySelector('textarea');
    const toggle=hud.querySelector('.sf-debug-toggle'),body=hud.querySelector('.sf-debug-body');
    toggle.addEventListener('click',()=>{expanded=!expanded;body.hidden=!expanded;toggle.setAttribute('aria-expanded',String(expanded));update()});
    hud.querySelector('[data-action="clear"]').addEventListener('click',()=>api.clear());
    hud.querySelector('[data-action="stop"]').addEventListener('click',()=>{
      try{sessionStorage.removeItem(key)}catch(e){}
      destroyed=true;observer.disconnect();longTaskObserver?.disconnect();hud.remove();sheet.remove();
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
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap,{once:true});
  else bootstrap();
})();
