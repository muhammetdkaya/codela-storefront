// Section galleries only. Native scrolling is the fallback; the hero pilot
// hands movement to one lazy-loaded Embla instance without changing its slides.
(()=>{
  const key=Symbol.for('codela.storefront.section-galleries');
  if(window[key]){window[key]();return;}
  const instances=new Map();
  let vendor;
  const loadEmbla=()=>vendor||(vendor=import(window.codelaSfVendors.embla));
  const mount=gallery=>{
    const track=gallery.querySelector('.sf-ui-gallery-track');
    const items=track?[...track.children]:[];
    const controls=gallery.querySelector('[data-gallery-controls]');
    if(!track||items.length<2||!controls)return;
    const previous=controls.querySelector('[data-gallery-prev]');
    const next=controls.querySelector('[data-gallery-next]');
    const count=controls.querySelector('[data-gallery-count]');
    const hero=gallery.classList.contains('sf-section--hero');
    const reduced=matchMedia('(prefers-reduced-motion:reduce)');
    const disposers=[];
    let current=0,frame=0,captionFrame=0,disposed=false,nativeWheel=false,api=null,viewport=null;
    const listen=(target,type,callback,options)=>{
      target.addEventListener(type,callback,options);
      disposers.push(()=>target.removeEventListener(type,callback,options));
    };
    const saveStyle=(element,property)=>{
      const value=element.style.getPropertyValue(property),priority=element.style.getPropertyPriority(property);
      return ()=>value?element.style.setProperty(property,value,priority):element.style.removeProperty(property);
    };
    const restoreTrack=['overflow-x','overflow-y','scroll-snap-type','scroll-behavior','touch-action','transform'].map(property=>saveStyle(track,property));
    const originalHidden=controls.hidden;
    const originalTabIndex=track.getAttribute('tabindex');
    const restoreCaption=saveStyle(gallery,'--sf-hero-caption-height');
    gallery.dataset.sfGalleryReady='1';
    gallery.dataset.sfGalleryEngine='native';
    const prepare=index=>items[index]?.dispatchEvent(new Event('codela:media-intent',{bubbles:true}));
    const paint=()=>{
      const format=value=>hero?String(value).padStart(2,'0'):String(value);
      const text=format(current+1)+' / '+format(items.length);
      // Avoid duplicate live-region announcements on scroll/resize events.
      if(count&&count.textContent!==text)count.textContent=text;
      controls.querySelectorAll('.sf-hero-progress > span').forEach((step,i)=>step.classList.toggle('is-current',i===current));
      if(previous)previous.disabled=current===0;
      if(next)next.disabled=current===items.length-1;
    };
    const updateNative=()=>{
      frame=0;
      if(disposed||api)return;
      const edge=track.getBoundingClientRect().left;
      current=items.reduce((best,item,i)=>Math.abs(item.getBoundingClientRect().left-edge)<Math.abs(items[best].getBoundingClientRect().left-edge)?i:best,0);
      paint();
    };
    const select=index=>{
      index=Math.max(0,Math.min(items.length-1,index));
      prepare(index);
      if(api){api.scrollTo(index,reduced.matches);return;}
      track.scrollTo({left:track.scrollLeft+items[index].getBoundingClientRect().left-track.getBoundingClientRect().left,behavior:reduced.matches?'instant':'smooth'});
    };
    if(previous)listen(previous,'click',()=>select(current-1));
    if(next)listen(next,'click',()=>select(current+1));
    listen(track,'scroll',()=>{if(!api&&!frame)frame=requestAnimationFrame(updateNative);},{passive:true});
    listen(track,'pointerdown',()=>{if(!api){prepare(current-1);prepare(current+1);}},{passive:true});
    const keyboard=event=>{
      if((event.target!==track&&event.target!==viewport)||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const direction=getComputedStyle(track).direction==='rtl'?-1:1;
      select(event.key==='Home'?0:event.key==='End'?items.length-1:current+(event.key==='ArrowRight'?direction:-direction));
    };
    listen(track,'keydown',keyboard);
    // Keep the existing Codela caption measurement, including font and dock
    // changes. Neither this measurement nor engine loading gates the LCP image.
    if(hero){
      const captions=items.map(item=>item.querySelector('.sf-section-copy')).filter(Boolean);
      const syncCaption=()=>{
        if(disposed)return;
        if(!matchMedia('(max-width:700px)').matches){gallery.style.removeProperty('--sf-hero-caption-height');return;}
        const required=captions.map(copy=>{
          const style=getComputedStyle(copy);
          const children=[...copy.children].filter(child=>getComputedStyle(child).display!=='none');
          const padding=(parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0);
          const gap=(parseFloat(style.rowGap)||0)*Math.max(0,children.length-1);
          return Math.ceil(padding+gap+children.reduce((total,child)=>total+child.getBoundingClientRect().height,0));
        });
        if(required.length)gallery.style.setProperty('--sf-hero-caption-height',Math.max(...required)+'px');
      };
      const scheduleCaption=()=>{
        if(!disposed&&!captionFrame)captionFrame=requestAnimationFrame(()=>{captionFrame=0;syncCaption();});
      };
      syncCaption();
      if(typeof ResizeObserver!=='undefined'){
        const observer=new ResizeObserver(scheduleCaption);
        captions.forEach(copy=>{observer.observe(copy);[...copy.children].forEach(child=>observer.observe(child));});
        disposers.push(()=>observer.disconnect());
      }else listen(window,'resize',scheduleCaption,{passive:true});
      document.fonts?.ready?.then(scheduleCaption);
    }
    const restoreNative=()=>{
      const active=document.activeElement;
      const focusTarget=active===viewport?track:track.contains(active)?active:null;
      if(api){const old=api;api=null;old.destroy();}
      restoreTrack.forEach(restore=>restore());
      if(viewport){viewport.replaceWith(...viewport.childNodes);viewport=null;}
      if(originalTabIndex===null)track.removeAttribute('tabindex');else track.setAttribute('tabindex',originalTabIndex);
      if(focusTarget&&gallery.isConnected)focusTarget.focus({preventScroll:true});
      delete gallery.dataset.sfGalleryEngine;
    };
    // Embla v8 has no native wheel owner. A real horizontal wheel (or
    // Shift+wheel) permanently returns this component to its original scroll
    // container before the event's default action. Do not synthesize, consume
    // or apply its delta twice. This also blocks late enhancement during a
    // native wheel gesture while the vendor loads. Vertical wheel and pinch
    // zoom pass unchanged.
    listen(track,'wheel',event=>{
      if(disposed||event.defaultPrevented||event.ctrlKey||event.metaKey)return;
      const horizontal=Math.abs(event.deltaX)>Math.abs(event.deltaY)||event.shiftKey&&event.deltaY!==0;
      if(!horizontal)return;
      nativeWheel=true;
      if(!api)return;
      const selected=api.selectedScrollSnap();
      restoreNative();gallery.dataset.sfGalleryEngine='native';
      track.scrollTo({left:track.scrollLeft+items[selected].getBoundingClientRect().left-track.getBoundingClientRect().left,behavior:'instant'});
      prepare(selected-1);prepare(selected+1);updateNative();
    },{passive:false,capture:true});
    const destroy=()=>{
      if(disposed)return;
      disposed=true;
      cancelAnimationFrame(frame);cancelAnimationFrame(captionFrame);
      disposers.forEach(dispose=>dispose());
      restoreNative();restoreCaption();
      controls.hidden=originalHidden;
      delete gallery.dataset.sfGalleryReady;
      instances.delete(gallery);
    };
    instances.set(gallery,{track,items,destroy});
    controls.hidden=false;updateNative();
    if(!hero||!window.codelaSfVendors?.embla||typeof ResizeObserver==='undefined'||typeof IntersectionObserver==='undefined')return;
    loadEmbla().then(({default:EmblaCarousel})=>{
      if(disposed||nativeWheel||!gallery.isConnected)return;
      // Preserve a native selection made while the module was in flight.
      updateNative();
      const start=current,focused=document.activeElement;
      try{
        viewport=document.createElement('div');
        viewport.className='sf-gallery-viewport';
        viewport.setAttribute('tabindex',originalTabIndex||'0');
        viewport.setAttribute('role','group');
        const label=gallery.getAttribute('aria-label');
        if(label)viewport.setAttribute('aria-label',label);
        track.setAttribute('tabindex','-1');
        listen(viewport,'keydown',event=>{if(event.target===viewport)keyboard(event);});
        viewport.style.cssText='overflow:hidden;min-width:0;width:100%;touch-action:pan-y pinch-zoom';
        track.before(viewport);viewport.append(track);
        track.style.setProperty('overflow-x','visible');
        track.style.setProperty('overflow-y','visible');
        track.style.setProperty('scroll-snap-type','none');
        track.style.setProperty('scroll-behavior','auto');
        track.style.setProperty('touch-action','pan-y pinch-zoom');
        track.scrollLeft=0;
        api=EmblaCarousel(viewport,{
          container:track,slides:items,align:'start',loop:false,containScroll:'trimSnaps',startIndex:start,
          direction:getComputedStyle(track).direction==='rtl'?'rtl':'ltr',inViewThreshold:0.01,watchSlides:false,
          watchFocus:(engine,event)=>{
            const index=items.findIndex(item=>item.contains(event.target));
            // As in Embla's native focus handler, reveal keyboard focus
            // immediately so the browser does not also scroll the clip root.
            if(index>=0){prepare(index);viewport.scrollLeft=0;engine.scrollTo(index,true);}
            return false;
          }
        });
        const selected=()=>{current=api.selectedScrollSnap();prepare(current);paint();};
        const settleReduced=()=>{if(api&&reduced.matches)api.scrollTo(api.selectedScrollSnap(),true);};
        api.on('select',selected).on('reInit',()=>{current=api.selectedScrollSnap();paint();})
          .on('pointerDown',()=>{prepare(current-1);prepare(current+1);})
          .on('pointerUp',settleReduced)
          .on('slidesInView',()=>api.slidesInView().forEach(prepare));
        listen(reduced,'change',settleReduced);
        gallery.dataset.sfGalleryEngine='embla';
        current=api.selectedScrollSnap();paint();
        if(focused===track)viewport.focus({preventScroll:true});
        else if(track.contains(focused))focused.focus({preventScroll:true});
      }catch{
        restoreNative();
        if(focused===track||track.contains(focused))focused.focus({preventScroll:true});
        gallery.dataset.sfGalleryEngine='native';
        track.scrollTo({left:items[start].offsetLeft-items[0].offsetLeft,behavior:'instant'});
        updateNative();
      }
    }).catch(()=>{/* Failed/blocked vendor leaves the existing native owner intact. */});
  };
  const reconcile=()=>{
    for(const [gallery,state] of instances){
      const children=[...state.track.children];
      if(!gallery.isConnected||gallery.querySelector('.sf-ui-gallery-track')!==state.track||
        children.length!==state.items.length||children.some((item,index)=>item!==state.items[index]))state.destroy();
    }
    // Product/Woo galleries deliberately do not have this section marker.
    document.querySelectorAll('[data-sf-gallery]').forEach(gallery=>{if(!instances.has(gallery))mount(gallery);});
  };
  window[key]=reconcile;
  window.addEventListener('codela:route-committed',reconcile);
  // Native router replacements need disposal even if no script is reexecuted.
  // Observe child lists only, never Embla's per-frame style writes.
  const observer=new MutationObserver(records=>{
    if(records.some(record=>[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1)))reconcile();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  reconcile();
})();
