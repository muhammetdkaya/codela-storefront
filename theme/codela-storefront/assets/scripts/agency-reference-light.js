/* Codela — original reference's six image-specific amber light sequences. */
(() => {
  'use strict';
  const SOURCE_SVG = {"web":"<svg aria-hidden=\"true\" class=\"geo-fx\" preserveaspectratio=\"xMidYMid slice\" viewbox=\"0 0 1376 768\">\n<defs>\n<filter height=\"160%\" id=\"f-web-b\" width=\"160%\" x=\"-30%\" y=\"-30%\"><fegaussianblur stddeviation=\"12\"></fegaussianblur></filter>\n<pattern height=\"768\" id=\"pat-flutes\" patternunits=\"userSpaceOnUse\" width=\"16\">\n<rect fill=\"white\" fill-opacity=\"0.95\" height=\"768\" width=\"5\" x=\"0\" y=\"0\"></rect>\n<rect fill=\"white\" fill-opacity=\"0.22\" height=\"768\" width=\"4\" x=\"5\" y=\"0\"></rect>\n<rect fill=\"black\" fill-opacity=\"0.92\" height=\"768\" width=\"7\" x=\"9\" y=\"0\"></rect>\n</pattern>\n<mask id=\"m-web-flutes\">\n<rect fill=\"url(#pat-flutes)\" height=\"580\" width=\"308\" x=\"1068\" y=\"0\"></rect>\n<polygon fill=\"black\" points=\"818,168 1232,202 1204,544 794,486\"></polygon>\n<polygon fill=\"black\" points=\"1156,340 1278,350 1268,628 1152,608\"></polygon>\n</mask>\n<lineargradient id=\"g-refract\" x1=\"0%\" x2=\"100%\" y1=\"0%\" y2=\"0%\">\n<stop offset=\"0%\" stop-color=\"#d3a480\" stop-opacity=\"0\"></stop>\n<stop offset=\"45%\" stop-color=\"#f7caa0\" stop-opacity=\"0.72\"></stop>\n<stop offset=\"55%\" stop-color=\"#fff0d8\" stop-opacity=\"0.88\"></stop>\n<stop offset=\"100%\" stop-color=\"#d3a480\" stop-opacity=\"0\"></stop>\n</lineargradient>\n</defs>\n<g mask=\"url(#m-web-flutes)\" style=\"mix-blend-mode:screen\">\n<rect fill=\"url(#g-refract)\" filter=\"url(#f-web-b)\" height=\"580\" id=\"fx-web-beam\" opacity=\"0\" width=\"160\" x=\"960\" y=\"0\"></rect>\n</g>\n</svg>","ecom":"<svg aria-hidden=\"true\" class=\"geo-fx\" preserveaspectratio=\"xMidYMid slice\" viewbox=\"0 0 1024 1024\">\n<defs>\n<filter height=\"160%\" id=\"f-ecom-b\" width=\"160%\" x=\"-30%\" y=\"-30%\"><fegaussianblur stddeviation=\"6\"></fegaussianblur></filter>\n<clippath id=\"clip-ecom-card\">\n<path d=\"M 564 459 L 742 418 Q 756 415 758 428 L 771 548 Q 773 561 759 565 L 580 612 Q 567 615 565 602 L 551 474 Q 549 462 564 459 Z\"></path>\n</clippath>\n<lineargradient id=\"g-card-sweep\" x1=\"0%\" x2=\"100%\" y1=\"0%\" y2=\"18%\">\n<stop offset=\"0%\" stop-color=\"#fff4e2\" stop-opacity=\"0\"></stop>\n<stop offset=\"45%\" stop-color=\"#fae2c4\" stop-opacity=\"0.42\"></stop>\n<stop offset=\"52%\" stop-color=\"#ffffff\" stop-opacity=\"0.62\"></stop>\n<stop offset=\"60%\" stop-color=\"#e3b17c\" stop-opacity=\"0.22\"></stop>\n<stop offset=\"100%\" stop-color=\"#d3a480\" stop-opacity=\"0\"></stop>\n</lineargradient>\n<radialgradient cx=\"50%\" cy=\"50%\" id=\"g-chip-spec\" r=\"50%\">\n<stop offset=\"0%\" stop-color=\"#fff0d6\" stop-opacity=\"0.88\"></stop>\n<stop offset=\"55%\" stop-color=\"#e2ad74\" stop-opacity=\"0.32\"></stop>\n<stop offset=\"100%\" stop-color=\"#d3a480\" stop-opacity=\"0\"></stop>\n</radialgradient>\n</defs>\n<g clip-path=\"url(#clip-ecom-card)\" style=\"mix-blend-mode:screen\">\n<rect fill=\"url(#g-card-sweep)\" height=\"290\" id=\"fx-ecom-sweep\" opacity=\"0\" transform=\"skewX(-18)\" width=\"115\" x=\"420\" y=\"370\"></rect>\n</g>\n<ellipse cx=\"595\" cy=\"520\" fill=\"url(#g-chip-spec)\" filter=\"url(#f-ecom-b)\" id=\"fx-chip-orb\" opacity=\"0\" rx=\"28\" ry=\"24\" style=\"mix-blend-mode:screen\"></ellipse>\n</svg>","ozel":"<svg aria-hidden=\"true\" class=\"geo-fx\" preserveaspectratio=\"xMidYMid slice\" viewbox=\"0 0 1024 1024\">\n<defs>\n<filter height=\"180%\" id=\"f-ozel-b\" width=\"180%\" x=\"-40%\" y=\"-40%\"><fegaussianblur stddeviation=\"14\"></fegaussianblur></filter>\n<filter height=\"220%\" id=\"f-ozel-n\" width=\"220%\" x=\"-60%\" y=\"-60%\"><fegaussianblur stddeviation=\"5\"></fegaussianblur></filter>\n<mask id=\"m-ozel-back\">\n<rect fill=\"white\" height=\"1024\" width=\"1024\" x=\"0\" y=\"0\"></rect>\n<rect fill=\"black\" height=\"340\" rx=\"18\" width=\"388\" x=\"316\" y=\"187\"></rect>\n</mask>\n<radialgradient cx=\"50%\" cy=\"55%\" id=\"g-ozel-back\" r=\"52%\">\n<stop offset=\"0%\" stop-color=\"#f7c68e\" stop-opacity=\"0.48\"></stop>\n<stop offset=\"55%\" stop-color=\"#d3a480\" stop-opacity=\"0.16\"></stop>\n<stop offset=\"100%\" stop-color=\"#d3a480\" stop-opacity=\"0\"></stop>\n</radialgradient>\n<radialgradient cx=\"50%\" cy=\"50%\" id=\"g-node-warm\" r=\"50%\">\n<stop offset=\"0%\" stop-color=\"#fff2dc\" stop-opacity=\"0.98\"></stop>\n<stop offset=\"45%\" stop-color=\"#e8b47c\" stop-opacity=\"0.55\"></stop>\n<stop offset=\"100%\" stop-color=\"#d3a480\" stop-opacity=\"0\"></stop>\n</radialgradient>\n</defs>\n<g mask=\"url(#m-ozel-back)\" style=\"mix-blend-mode:screen\">\n<ellipse cx=\"510\" cy=\"465\" fill=\"url(#g-ozel-back)\" filter=\"url(#f-ozel-b)\" id=\"fx-ozel-back\" opacity=\"0\" rx=\"310\" ry=\"150\"></ellipse>\n</g>\n<circle cx=\"604\" cy=\"281\" fill=\"url(#g-node-warm)\" filter=\"url(#f-ozel-n)\" id=\"fx-node-1\" opacity=\"0\" r=\"18\" style=\"mix-blend-mode:screen\"></circle>\n<circle cx=\"604\" cy=\"386\" fill=\"url(#g-node-warm)\" filter=\"url(#f-ozel-n)\" id=\"fx-node-2\" opacity=\"0\" r=\"18\" style=\"mix-blend-mode:screen\"></circle>\n<circle cx=\"536\" cy=\"426\" fill=\"url(#g-node-warm)\" filter=\"url(#f-ozel-n)\" id=\"fx-node-3\" opacity=\"0\" r=\"18\" style=\"mix-blend-mode:screen\"></circle>\n</svg>","proc0":"<svg aria-hidden=\"true\" class=\"proc-geo proc-geo-0\" preserveaspectratio=\"xMidYMid slice\" viewbox=\"0 0 1376 768\">\n<defs>\n<filter height=\"160%\" id=\"f-tab-bloom\" width=\"160%\" x=\"-30%\" y=\"-30%\"><fegaussianblur stddeviation=\"6\"></fegaussianblur></filter>\n<mask id=\"m-tablet-core\">\n<path d=\"M 206 349 L 814 139 Q 832 132 850 142 L 1198 342 Q 1215 352 1196 363 L 546 635 Q 526 644 509 629 L 194 374 Q 178 360 206 349 Z\" fill=\"none\" id=\"p-tablet-rim\" stroke=\"white\" stroke-linejoin=\"round\" stroke-width=\"6.5\"></path>\n</mask>\n<mask id=\"m-tablet-bloom\">\n<path d=\"M 206 349 L 814 139 Q 832 132 850 142 L 1198 342 Q 1215 352 1196 363 L 546 635 Q 526 644 509 629 L 194 374 Q 178 360 206 349 Z\" fill=\"none\" filter=\"url(#f-tab-bloom)\" stroke=\"white\" stroke-linejoin=\"round\" stroke-width=\"18\"></path>\n</mask>\n<radialgradient cx=\"50%\" cy=\"50%\" id=\"g-tab-spec\" r=\"50%\">\n<stop offset=\"0%\" stop-color=\"#fff4e0\" stop-opacity=\"0.98\"></stop>\n<stop offset=\"32%\" stop-color=\"#ebb477\" stop-opacity=\"0.62\"></stop>\n<stop offset=\"68%\" stop-color=\"#c98e54\" stop-opacity=\"0.18\"></stop>\n<stop offset=\"100%\" stop-color=\"#c98e54\" stop-opacity=\"0\"></stop>\n</radialgradient>\n</defs>\n<g id=\"g-tab-wrap\" opacity=\"0\">\n<g mask=\"url(#m-tablet-bloom)\" opacity=\"0.56\" style=\"mix-blend-mode:screen\">\n<circle cx=\"830\" cy=\"136\" fill=\"url(#g-tab-spec)\" id=\"orb-tab-bloom\" r=\"175\"></circle>\n</g>\n<g mask=\"url(#m-tablet-core)\" opacity=\"0.96\" style=\"mix-blend-mode:screen\">\n<circle cx=\"830\" cy=\"136\" fill=\"url(#g-tab-spec)\" id=\"orb-tab-core\" r=\"140\"></circle>\n</g>\n</g>\n</svg>","proc1":"<svg aria-hidden=\"true\" class=\"proc-geo proc-geo-1\" preserveaspectratio=\"xMidYMid slice\" viewbox=\"0 0 1376 768\">\n<defs>\n<filter height=\"160%\" id=\"f-mon-b\" width=\"160%\" x=\"-30%\" y=\"-30%\"><fegaussianblur stddeviation=\"18\"></fegaussianblur></filter>\n<filter height=\"160%\" id=\"f-mon-r\" width=\"160%\" x=\"-30%\" y=\"-30%\"><fegaussianblur stddeviation=\"3.5\"></fegaussianblur></filter>\n<mask id=\"m-mon-screen\">\n<rect fill=\"white\" height=\"768\" width=\"1376\" x=\"0\" y=\"0\"></rect>\n<rect fill=\"black\" height=\"325\" rx=\"8\" width=\"546\" x=\"415\" y=\"175\"></rect>\n</mask>\n<radialgradient cx=\"50%\" cy=\"54%\" id=\"g-mon-bias\" r=\"54%\">\n<stop offset=\"0%\" stop-color=\"#f6c48c\" stop-opacity=\"0.54\"></stop>\n<stop offset=\"52%\" stop-color=\"#d3a480\" stop-opacity=\"0.20\"></stop>\n<stop offset=\"100%\" stop-color=\"#d3a480\" stop-opacity=\"0\"></stop>\n</radialgradient>\n</defs>\n<g mask=\"url(#m-mon-screen)\" style=\"mix-blend-mode:screen\">\n<ellipse cx=\"688\" cy=\"365\" fill=\"url(#g-mon-bias)\" filter=\"url(#f-mon-b)\" id=\"fx-mon-bias\" opacity=\"0\" rx=\"455\" ry=\"270\"></ellipse>\n</g>\n<rect fill=\"#ffe1ba\" filter=\"url(#f-mon-r)\" height=\"6\" id=\"fx-code-1\" opacity=\"0\" rx=\"3\" style=\"mix-blend-mode:screen\" width=\"38\" x=\"762\" y=\"238\"></rect>\n<rect fill=\"#ffe1ba\" filter=\"url(#f-mon-r)\" height=\"6\" id=\"fx-code-2\" opacity=\"0\" rx=\"3\" style=\"mix-blend-mode:screen\" width=\"74\" x=\"768\" y=\"298\"></rect>\n<rect fill=\"#ffe1ba\" filter=\"url(#f-mon-r)\" height=\"6\" id=\"fx-code-3\" opacity=\"0\" rx=\"3\" style=\"mix-blend-mode:screen\" width=\"128\" x=\"772\" y=\"361\"></rect>\n</svg>","proc2":"<svg aria-hidden=\"true\" class=\"proc-geo proc-geo-2\" preserveaspectratio=\"xMidYMid slice\" viewbox=\"0 0 1376 768\">\n<defs>\n<filter height=\"160%\" id=\"f-cnd-b\" width=\"160%\" x=\"-30%\" y=\"-30%\"><fegaussianblur stddeviation=\"18\"></fegaussianblur></filter>\n<mask id=\"m-laptop-screen\">\n<rect fill=\"white\" height=\"768\" width=\"1376\" x=\"0\" y=\"0\"></rect>\n<rect fill=\"black\" height=\"334\" rx=\"10\" width=\"488\" x=\"444\" y=\"224\"></rect>\n</mask>\n<mask id=\"m-yayin-curve\">\n<path d=\"M 454 505 L 550 505 C 590 505 610 480 640 460 C 665 442 690 448 718 452 C 750 456 770 402 796 382 C 818 365 838 378 862 356 C 886 334 902 308 924 306\" fill=\"none\" id=\"p-yayin-curve\" stroke=\"white\" stroke-linecap=\"round\" stroke-width=\"5.5\"></path>\n</mask>\n<radialgradient cx=\"50%\" cy=\"62%\" id=\"g-cnd-outer\" r=\"55%\">\n<stop offset=\"0%\" stop-color=\"#f9bf7c\" stop-opacity=\"0.62\"></stop>\n<stop offset=\"48%\" stop-color=\"#d4985e\" stop-opacity=\"0.24\"></stop>\n<stop offset=\"100%\" stop-color=\"#d4985e\" stop-opacity=\"0\"></stop>\n</radialgradient>\n<radialgradient cx=\"50%\" cy=\"66%\" id=\"g-cnd-inner\" r=\"52%\">\n<stop offset=\"0%\" stop-color=\"#ffe2b8\" stop-opacity=\"0.52\"></stop>\n<stop offset=\"52%\" stop-color=\"#e3a96e\" stop-opacity=\"0.16\"></stop>\n<stop offset=\"100%\" stop-color=\"#e3a96e\" stop-opacity=\"0\"></stop>\n</radialgradient>\n<radialgradient cx=\"50%\" cy=\"50%\" id=\"g-curve-spec\" r=\"50%\">\n<stop offset=\"0%\" stop-color=\"#fff4e0\" stop-opacity=\"0.98\"></stop>\n<stop offset=\"40%\" stop-color=\"#ebb478\" stop-opacity=\"0.55\"></stop>\n<stop offset=\"100%\" stop-color=\"#d3a480\" stop-opacity=\"0\"></stop>\n</radialgradient>\n<radialgradient cx=\"50%\" cy=\"50%\" id=\"g-orb-spec\" r=\"50%\">\n<stop offset=\"0%\" stop-color=\"#ffe8c4\" stop-opacity=\"0.84\"></stop>\n<stop offset=\"48%\" stop-color=\"#e3aa70\" stop-opacity=\"0.26\"></stop>\n<stop offset=\"100%\" stop-color=\"#e3aa70\" stop-opacity=\"0\"></stop>\n</radialgradient>\n</defs>\n<g mask=\"url(#m-laptop-screen)\" style=\"mix-blend-mode:screen\">\n<ellipse cx=\"688\" cy=\"450\" fill=\"url(#g-cnd-outer)\" filter=\"url(#f-cnd-b)\" id=\"fx-cnd-outer\" opacity=\"0\" rx=\"425\" ry=\"280\"></ellipse>\n<ellipse cx=\"688\" cy=\"468\" fill=\"url(#g-cnd-inner)\" filter=\"url(#f-cnd-b)\" id=\"fx-cnd-inner\" opacity=\"0\" rx=\"305\" ry=\"200\"></ellipse>\n</g>\n<g mask=\"url(#m-yayin-curve)\" style=\"mix-blend-mode:screen\">\n<circle cx=\"454\" cy=\"505\" fill=\"url(#g-curve-spec)\" id=\"orb-yayin-curve\" opacity=\"0\" r=\"82\"></circle>\n</g>\n<circle cx=\"688\" cy=\"383\" fill=\"url(#g-orb-spec)\" id=\"fx-yayin-orb\" opacity=\"0\" r=\"46\" style=\"mix-blend-mode:screen\"></circle>\n</svg>"};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    Boolean(navigator.connection && navigator.connection.saveData);
  const running = new WeakMap();
  const ease = p => p < .5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;
  const bell = p => Math.sin(Math.max(0,Math.min(1,p))*Math.PI);
  const segment = (p,a,b) => p > a && p < b ? bell((p-a)/(b-a)) : 0;
  let serial = 0;

  // SVG IDs are namespaced per instance so homepage and detail page can reuse geometry.
  function attach(host, kind) {
    const markup = SOURCE_SVG[kind];
    if (!host || !markup) return null;
    const prefix = 'cdl-ref-' + (++serial);
    const unique = markup
      .replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}-${id}"`)
      .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}-${id})`)
      .replace(/href="#([^"]+)"/g, (_, id) => `href="#${prefix}-${id}"`);
    host.insertAdjacentHTML('beforeend', unique);
    const svg = host.lastElementChild;
    svg.classList.add('cdl-reference-light');
    svg.dataset.cdlLight = kind;
    return svg;
  }

  function illuminate(svg, kind) {
    if (reduced || document.hidden || !svg) return;
    const active = running.get(svg);
    if (active) cancelAnimationFrame(active);
    const find = id => svg.querySelector(`[id$="-${id}"]`);
    const put = (node, attr, value) => { if (node) node.setAttribute(attr, Number(value).toFixed(3)); };
    const el = {};
    const get = ids => ids.forEach(id => { el[id] = find(id); });
    if (kind === 'web') get(['fx-web-beam']);
    if (kind === 'ecom') get(['fx-ecom-sweep','fx-chip-orb']);
    if (kind === 'ozel') get(['fx-node-1','fx-node-2','fx-node-3','fx-ozel-back']);
    if (kind === 'proc0') get(['p-tablet-rim','g-tab-wrap','orb-tab-core','orb-tab-bloom']);
    if (kind === 'proc1') get(['fx-mon-bias','fx-code-1','fx-code-2','fx-code-3']);
    if (kind === 'proc2') get(['fx-cnd-outer','fx-cnd-inner','orb-yayin-curve','fx-yayin-orb','p-yayin-curve']);
    const lenTab = kind === 'proc0' && el['p-tablet-rim'] ? el['p-tablet-rim'].getTotalLength() : 0;
    const lenCurve = kind === 'proc2' && el['p-yayin-curve'] ? el['p-yayin-curve'].getTotalLength() : 0;
    const duration = { web:3400, ecom:2800, ozel:3400, proc0:5200, proc1:3800, proc2:5600 }[kind];
    if (!duration) return;
    let began = null, last = -100;
    const frame = now => {
      if (document.hidden || !svg.isConnected) { running.delete(svg); return; }
      if (began === null) began = now;
      const elapsed = now-began;
      const p = Math.min(1,elapsed/duration);
      // Approx. 30fps for SVG lighting: less main-thread cost on mobile.
      if (elapsed-last >= 30 || p === 1) {
        last=elapsed;
        if (kind === 'web') {
          put(el['fx-web-beam'],'x',980+ease(p)*380);
          put(el['fx-web-beam'],'opacity',.85*bell(p));
        } else if (kind === 'ecom') {
          put(el['fx-ecom-sweep'],'x',420+ease(p)*470);
          put(el['fx-ecom-sweep'],'opacity',.90*bell(p));
          const chip=(p-.14)/.44;
          put(el['fx-chip-orb'],'opacity',chip>0 && chip<1 ? .72*bell(chip):0);
        } else if (kind === 'ozel') {
          put(el['fx-node-1'],'opacity',.85*segment(p,.04,.50));
          put(el['fx-node-2'],'opacity',.85*segment(p,.24,.70));
          put(el['fx-node-3'],'opacity',.85*segment(p,.44,.92));
          put(el['fx-ozel-back'],'opacity',.55*bell(p));
        } else if (kind === 'proc0' && lenTab) {
          const pt=el['p-tablet-rim'].getPointAtLength(((ease(p)+.22)%1)*lenTab);
          ['orb-tab-core','orb-tab-bloom'].forEach(k => { put(el[k],'cx',pt.x); put(el[k],'cy',pt.y); });
          const env=p<.15?p/.15:p>.8?(1-p)/.2:1;
          put(el['g-tab-wrap'],'opacity',.95*env);
        } else if (kind === 'proc1') {
          const warm=p<.45?p/.45*.62:.62-(p-.45)*.62;
          put(el['fx-mon-bias'],'opacity',Math.max(.18,warm));
          put(el['fx-code-1'],'opacity',.62*segment(p,.12,.52));
          put(el['fx-code-2'],'opacity',.62*segment(p,.30,.70));
          put(el['fx-code-3'],'opacity',.62*segment(p,.48,.88));
        } else if (kind === 'proc2') {
          const t=p*5.6;
          const settle=p<.14?p/.14:p>.78?1-((p-.78)/.22)*.62:1;
          const flicker=.56+.16*Math.sin(t*2.1)+.11*Math.sin(t*4.7+.8)+.06*Math.sin(t*7.3);
          const sway=5*Math.sin(t*2.3)+2.5*Math.sin(t*5.1);
          put(el['fx-cnd-outer'],'opacity',Math.max(.16,Math.min(.84,flicker*settle)));
          put(el['fx-cnd-outer'],'cx',688+sway);
          put(el['fx-cnd-inner'],'opacity',Math.max(.12,Math.min(.74,(flicker-.08)*settle)));
          put(el['fx-cnd-inner'],'cx',688-sway*.7);
          const cp=(p-.06)/.58;
          if (lenCurve && cp>0 && cp<1) {
            const pt=el['p-yayin-curve'].getPointAtLength(ease(cp)*lenCurve);
            put(el['orb-yayin-curve'],'cx',pt.x);
            put(el['orb-yayin-curve'],'cy',pt.y);
            put(el['orb-yayin-curve'],'opacity',.94*bell(cp));
          } else put(el['orb-yayin-curve'],'opacity',0);
          const op=(p-.25)/.55;
          put(el['fx-yayin-orb'],'opacity',op>0&&op<1?.72*bell(op):0);
        }
      }
      if (p<1) running.set(svg,requestAnimationFrame(frame));
      else running.delete(svg);
    };
    running.set(svg,requestAnimationFrame(frame));
  }

  // Initial sequences are queued rather than rendered concurrently as in the prototype.
  const pending=[];
  let queued=false;
  function schedule(svg,kind) {
    if (reduced) return;
    pending.push({svg,kind});
    if (queued) return;
    queued=true;
    const drain=() => {
      const next=pending.shift();
      if (!next) {queued=false;return;}
      if (next.svg.isConnected) illuminate(next.svg,next.kind);
      window.setTimeout(drain,{web:3500,ecom:2900,ozel:3500,proc0:5300,proc1:3900,proc2:5700}[next.kind] || 3000);
    };
    drain();
  }
  const observe = (target,svg,kind,always=false) => {
    if (!target || !svg) return;
    if (!('IntersectionObserver' in window)) { schedule(svg,kind);return; }
    const io=new IntersectionObserver(entries=>{
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!always) io.disconnect();
        schedule(svg,kind);
      }
    },{threshold:.28,rootMargin:'-9% 0px -9% 0px'});
    io.observe(target);
  };

  const grid = document.querySelector('.sf-agency-widget--bento .cdl-bento__grid');
  document.querySelectorAll('.sf-agency-widget--bento .cdl-bento__card').forEach(card=>{
    const kind = card.classList.contains('cdl-bento__card--web')?'web':
      card.classList.contains('cdl-bento__card--commerce')?'ecom':
      card.classList.contains('cdl-bento__card--software')?'ozel':null;
    if (!kind) return; // The reference has no photo or SVG effect on the support strip.
    const svg=attach(card,kind);
    observe(card,svg,kind);
    card.addEventListener('pointerenter', e=>{
      if (e.pointerType==='mouse' || e.pointerType==='pen') {
        if (grid) grid.classList.add('cdl-light-has-focus');
        card.classList.add('cdl-light-focused');
        illuminate(svg,kind);
      }
    });
    card.addEventListener('pointerleave',()=>{
      card.classList.remove('cdl-light-focused');
      if (grid && !grid.querySelector('.cdl-light-focused')) grid.classList.remove('cdl-light-has-focus');
    });
    card.addEventListener('focusin',()=>illuminate(svg,kind));
    let pointerFrame=0;
    card.addEventListener('pointermove',event=>{
      if (event.pointerType!=='mouse' || pointerFrame) return;
      const x=event.clientX,y=event.clientY;
      pointerFrame=requestAnimationFrame(()=>{
        pointerFrame=0;
        const r=card.getBoundingClientRect();
        if (!r.width || !r.height) return;
        card.style.setProperty('--cdl-light-x',((x-r.left)/r.width*100).toFixed(1)+'%');
        card.style.setProperty('--cdl-light-y',((y-r.top)/r.height*100).toFixed(1)+'%');
      });
    },{passive:true});
  });

  // Detail pages show exactly the same image and image-mapped lighting as their Bento card.
  document.querySelectorAll('.sf-agency-widget--detail [data-reference-fx]').forEach(visual=>{
    const kind=({web:'web',commerce:'ecom',software:'ozel'})[visual.dataset.referenceFx];
    if (!kind) return;
    const svg=attach(visual,kind);
    observe(visual,svg,kind);
    visual.addEventListener('pointerenter',event=>{
      if (event.pointerType==='mouse' || event.pointerType==='pen') illuminate(svg,kind);
    });
  });

  document.querySelectorAll('.sf-agency-widget--process').forEach(widget=>{
    const stage=widget.querySelector('[data-agency-widget-stage]');
    const visual=widget.querySelector('.sf-agency-process-stage-visual');
    if (!stage || !visual) return;
    const overlays=[0,1,2].map(i=>attach(visual,'proc'+i));
    if (overlays.some(svg=>!svg)) return;
    let inView=false;
    const current=()=>Math.max(0,Math.min(2,Number(stage.dataset.step)||0));
    const sync=()=>{
      const i=current();
      visual.dataset.cdlLightStep=String(i);
      overlays.forEach((svg,n)=>{
        if (n===i) return;
        const id=running.get(svg);
        if (id) cancelAnimationFrame(id);
        running.delete(svg);
      });
      if (inView) illuminate(overlays[i],'proc'+i);
    };
    new MutationObserver(sync).observe(stage,{attributes:true,attributeFilter:['data-step']});
    sync(); // The native widget activated step 0 before this enhancement loaded.
    if ('IntersectionObserver' in window) {
      const io=new IntersectionObserver(entries=>{
        inView=entries.some(e=>e.isIntersecting);
        if (inView) schedule(overlays[current()],'proc'+current());
      },{threshold:.28,rootMargin:'-10% 0px -10% 0px'});
      io.observe(visual);
    } else { inView=true;schedule(overlays[current()],'proc'+current()); }
    visual.addEventListener('pointerenter',event=>{
      if ((event.pointerType==='mouse'||event.pointerType==='pen') && inView)
        illuminate(overlays[current()],'proc'+current());
    });
    visual.addEventListener('click',()=>{
      if (inView) illuminate(overlays[current()],'proc'+current());
    });
  });
})();
