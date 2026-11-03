// Shared native section galleries. No vendor, clones, wheel interception or
// competing transform owner. Router replacement disposes observers/listeners.
(()=>{
  const key=Symbol.for('codela.storefront.section-galleries');
  if(window[key]){window[key]();return;}
  const instances=new Map();
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
    let current=0,frame=0,captionFrame=0,disposed=false;
    const listen=(target,type,callback,options)=>{
      target.addEventListener(type,callback,options);
      disposers.push(()=>target.removeEventListener(type,callback,options));
    };
    const saveStyle=(element,property)=>{
      const value=element.style.getPropertyValue(property),priority=element.style.getPropertyPriority(property);
      return ()=>value?element.style.setProperty(property,value,priority):element.style.removeProperty(property);
    };
    const originalHidden=controls.hidden;
    const restoreCaption=saveStyle(gallery,'--sf-hero-caption-height');
    gallery.dataset.sfGalleryReady='1';
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
      if(disposed)return;
      const edge=track.getBoundingClientRect().left;
      current=items.reduce((best,item,i)=>Math.abs(item.getBoundingClientRect().left-edge)<Math.abs(items[best].getBoundingClientRect().left-edge)?i:best,0);
      paint();
    };
    const select=index=>{
      index=Math.max(0,Math.min(items.length-1,index));
      prepare(index);
      track.scrollTo({left:track.scrollLeft+items[index].getBoundingClientRect().left-track.getBoundingClientRect().left,behavior:reduced.matches?'instant':'smooth'});
    };
    if(previous)listen(previous,'click',()=>select(current-1));
    if(next)listen(next,'click',()=>select(current+1));
    listen(track,'scroll',()=>{if(!frame)frame=requestAnimationFrame(updateNative);},{passive:true});
    listen(track,'pointerdown',()=>{prepare(current-1);prepare(current+1);},{passive:true});
    const keyboard=event=>{
      if(event.target!==track||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      select(event.key==='Home'?0:event.key==='End'?items.length-1:current+(event.key==='ArrowRight'?1:-1));
    };
    listen(track,'keydown',keyboard);
    // Keep the existing Codela caption measurement, including font and dock
    // changes. This measurement does not gate the LCP image.
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
    const destroy=()=>{
      if(disposed)return;
      disposed=true;
      cancelAnimationFrame(frame);cancelAnimationFrame(captionFrame);
      disposers.forEach(dispose=>dispose());
      restoreCaption();
      controls.hidden=originalHidden;
      delete gallery.dataset.sfGalleryReady;
      instances.delete(gallery);
    };
    instances.set(gallery,{track,items,destroy});
    controls.hidden=false;updateNative();

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
  // Observe child lists only; caption style writes cannot trigger remounts.
  const observer=new MutationObserver(records=>{
    if(records.some(record=>[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1)))reconcile();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  reconcile();
})();
