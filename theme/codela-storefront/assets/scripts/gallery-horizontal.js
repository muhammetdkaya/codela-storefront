// Shared native horizontal adapter. Independent instances, no clones or timers.
(()=>{
  // Same native horizontal track, independent instances. No cloned slides or timers.
  document.querySelectorAll('[data-sf-gallery]').forEach(gallery=>{
    const track=gallery.querySelector('.sf-ui-gallery-track');
    if(!track||gallery.dataset.sfGalleryReady)return;
    gallery.dataset.sfGalleryReady='1';
    const items=[...track.children];
    const controls=gallery.querySelector('[data-gallery-controls]');
    if(!items.length||!controls)return;
    const previous=controls.querySelector('[data-gallery-prev]');
    const next=controls.querySelector('[data-gallery-next]');
    const count=controls.querySelector('[data-gallery-count]');
    // Mobile Vitrin: measure the real rendered heading/subtitle/button rather
    // than reserving 248–280px on every slide. One shared overlay height keeps
    // the copy aligned; it must never change the full-background frame height.
    if(gallery.classList.contains('sf-section--hero')){
      const captions=items.map(item=>item.querySelector('.sf-section-copy')).filter(Boolean);
      const syncCaption=()=>{
        if(!matchMedia('(max-width:700px)').matches){
          gallery.style.removeProperty('--sf-hero-caption-height');return;
        }
        const required=captions.map(copy=>{
          const style=getComputedStyle(copy);
          const children=[...copy.children].filter(child=>getComputedStyle(child).display!=='none');
          const padding=(parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0);
          const gap=(parseFloat(style.rowGap)||0)*Math.max(0,children.length-1);
          return Math.ceil(padding+gap+children.reduce((total,child)=>total+child.getBoundingClientRect().height,0));
        });
        if(required.length)gallery.style.setProperty('--sf-hero-caption-height',Math.max(...required)+'px');
      };
      let captionFrame=0;
      const scheduleCaption=()=>{
        if(!captionFrame)captionFrame=requestAnimationFrame(()=>{captionFrame=0;syncCaption();});
      };
      syncCaption();
      if(typeof ResizeObserver!=='undefined'){
        const observer=new ResizeObserver(scheduleCaption);
        captions.forEach(copy=>{
          // Padding changes with the dock/safe area even when text dimensions
          // do not. Observe the caption box as well as its intrinsic children.
          observer.observe(copy);
          [...copy.children].forEach(child=>observer.observe(child));
        });
      }else window.addEventListener('resize',scheduleCaption,{passive:true});
      document.fonts?.ready?.then(scheduleCaption);
    }
    let current=0,frame=0;
    const update=()=>{
      frame=0;const edge=track.getBoundingClientRect().left;
      current=items.reduce((best,item,i)=>Math.abs(item.getBoundingClientRect().left-edge)<Math.abs(items[best].getBoundingClientRect().left-edge)?i:best,0);
      const format=value=>gallery.classList.contains('sf-section--hero')?String(value).padStart(2,'0'):String(value);
      count.textContent=format(current+1)+' / '+format(items.length);
      controls.querySelectorAll('.sf-hero-progress > span').forEach((step,i)=>step.classList.toggle('is-current',i===current));
      if(previous)previous.disabled=current===0;if(next)next.disabled=current===items.length-1;
    };
    const prepare=index=>items[index]?.dispatchEvent(new Event('codela:media-intent',{bubbles:true}));
    const select=index=>{
      prepare(Math.max(0,Math.min(items.length-1,index)));
      const item=items[Math.max(0,Math.min(items.length-1,index))];
      track.scrollTo({left:track.scrollLeft+item.getBoundingClientRect().left-track.getBoundingClientRect().left,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
    };
    previous?.addEventListener('click',()=>select(current-1));next?.addEventListener('click',()=>select(current+1));
    track.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
    track.addEventListener('pointerdown',()=>{prepare(current-1);prepare(current+1);},{passive:true});
    track.addEventListener('keydown',event=>{
      if(event.target!==track||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();select(event.key==='Home'?0:event.key==='End'?items.length-1:current+(event.key==='ArrowRight'?1:-1));
    });
    controls.hidden=false;update();
  });
})();
