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
    // Only the main showcase rotates. Product, promo and category galleries
    // remain manual. One timer belongs to this instance and never catches up
    // after a hidden tab, offscreen section or router replacement.
    let timer=0,visible=false,hovered=false,drag=null,suppressClick=false;
    const stopTimer=()=>{clearTimeout(timer);timer=0;};
    const canRotate=()=>hero&&!reduced.matches&&visible&&!hovered&&!drag&&!document.hidden&&!disposed&&gallery.isConnected&&
      !gallery.contains(document.activeElement);
    const syncRotation=()=>{
      if(!hero)return;
      stopTimer();
      // Automatic changes must not announce over the reader's current task.
      count?.setAttribute('aria-live',canRotate()?'off':'polite');
      if(canRotate())timer=setTimeout(()=>{timer=0;if(canRotate()){updateNative();select((current+1)%items.length);}syncRotation();},6000);
    };
    if(hero){
      const originalLive=count?.getAttribute('aria-live');
      disposers.push(()=>{stopTimer();if(count){if(originalLive===null)count.removeAttribute('aria-live');else count.setAttribute('aria-live',originalLive);}});
      listen(gallery,'pointerenter',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen'){hovered=true;syncRotation();}});
      listen(gallery,'pointerleave',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen'){hovered=false;syncRotation();}});
      listen(gallery,'focusin',syncRotation);
      listen(gallery,'focusout',()=>{queueMicrotask(()=>{if(!disposed)syncRotation();});});
      listen(document,'visibilitychange',syncRotation);
      listen(window,'pagehide',()=>{visible=false;syncRotation();});
      listen(window,'pageshow',()=>{visible=gallery.getBoundingClientRect().bottom>0&&gallery.getBoundingClientRect().top<innerHeight;syncRotation();});
      listen(reduced,'change',syncRotation);
      if(typeof IntersectionObserver!=='undefined'){
        const observer=new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.5);syncRotation();},{threshold:[0,.5]});
        observer.observe(gallery);disposers.push(()=>observer.disconnect());
      }else{
        const checkVisible=()=>{const rect=gallery.getBoundingClientRect();visible=rect.bottom>0&&rect.top<innerHeight;syncRotation();};
        listen(window,'scroll',checkVisible,{passive:true});listen(window,'resize',checkVisible,{passive:true});checkVisible();
      }
      syncRotation();
    }
    if(previous)listen(previous,'click',()=>select(current-1));
    if(next)listen(next,'click',()=>select(current+1));
    listen(track,'scroll',()=>{if(!frame)frame=requestAnimationFrame(updateNative);if(hero)syncRotation();},{passive:true});
    const endDrag=(event,cancelled=false)=>{
      if(!drag||(event&&event.pointerId!==drag.id))return;
      const state=drag;drag=null;
      track.classList.remove('is-dragging');
      if(track.hasPointerCapture?.(state.id))track.releasePointerCapture(state.id);
      if(state.active){
        suppressClick=true;
        const delta=state.lastX-state.x,threshold=Math.min(80,track.clientWidth*.15);
        const direction=getComputedStyle(track).direction==='rtl'?-1:1;
        select(cancelled||Math.abs(delta)<threshold?state.index:state.index-(delta>0?1:-1)*direction);
      }
      syncRotation();
    };
    listen(track,'pointerdown',event=>{
      prepare(current-1);prepare(current+1);
      if(event.pointerType!=='mouse'||event.button!==0||event.isPrimary===false||
        event.target.closest('button,input,select,textarea,[contenteditable="true"]'))return;
      // No capture/preventDefault before a real drag: normal CTA clicks work.
      suppressClick=false;updateNative();
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,left:track.scrollLeft,index:current,active:false};
      syncRotation();
    },{passive:true});
    listen(window,'pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      if(event.buttons===0){endDrag(event,true);return;}
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!drag.active){
        if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;
        if(Math.abs(dy)>Math.abs(dx)){endDrag(event,true);return;}
        drag.active=true;track.classList.add('is-dragging');track.setPointerCapture?.(event.pointerId);
      }
      event.preventDefault();drag.lastX=event.clientX;
      track.scrollLeft=drag.left-dx;
    },{passive:false});
    listen(window,'pointerup',event=>endDrag(event));
    listen(window,'pointercancel',event=>endDrag(event,true));
    listen(track,'lostpointercapture',event=>endDrag(event,true));
    listen(window,'blur',()=>endDrag(null,true));
    listen(window,'resize',()=>endDrag(null,true),{passive:true});
    listen(track,'dragstart',event=>{if(drag)event.preventDefault();});
    listen(track,'click',event=>{if(suppressClick){suppressClick=false;if(event.detail!==0){event.preventDefault();event.stopImmediatePropagation();}}},true);
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
      stopTimer();
      const pointer=drag?.id;drag=null;track.classList.remove('is-dragging');
      if(pointer!==undefined&&track.hasPointerCapture?.(pointer))track.releasePointerCapture(pointer);
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
