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
    let current=0,frame=0;
    const update=()=>{
      frame=0;const edge=track.getBoundingClientRect().left;
      current=items.reduce((best,item,i)=>Math.abs(item.getBoundingClientRect().left-edge)<Math.abs(items[best].getBoundingClientRect().left-edge)?i:best,0);
      count.textContent=(current+1)+' / '+items.length;
      previous.disabled=current===0;next.disabled=current===items.length-1;
    };
    const prepare=index=>items[index]?.dispatchEvent(new Event('codela:media-intent',{bubbles:true}));
    const select=index=>{
      prepare(Math.max(0,Math.min(items.length-1,index)));
      const item=items[Math.max(0,Math.min(items.length-1,index))];
      track.scrollTo({left:track.scrollLeft+item.getBoundingClientRect().left-track.getBoundingClientRect().left,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
    };
    previous.addEventListener('click',()=>select(current-1));next.addEventListener('click',()=>select(current+1));
    track.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
    track.addEventListener('pointerdown',()=>{prepare(current-1);prepare(current+1);},{passive:true});
    track.addEventListener('keydown',event=>{
      if(event.target!==track||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();select(event.key==='Home'?0:event.key==='End'?items.length-1:current+(event.key==='ArrowRight'?1:-1));
    });
    controls.hidden=false;update();
  });
})();
