// WooCommerce still owns variation updates and PhotoSwipe.
// This only promotes the requested slide from the already present thumbnail.
(()=>{
  const gallery=document.querySelector('.woocommerce-product-gallery.sf-ui-gallery');
  if(!gallery)return;
  const slides=()=>[...gallery.querySelectorAll('.woocommerce-product-gallery__image')];
  const imageAt=i=>slides()[i]?.querySelector('a > img:not(.zoomImg)');
  const activate=image=>{
    if(!image?.dataset.sfGallerySrc)return;
    const {sfGallerySrc:src,sfGallerySrcset:srcset,sfGallerySizes:sizes}=image.dataset;
    // Set srcset and sizes before src, so responsive selection stays native.
    if(sizes)image.sizes=sizes;
    if(srcset)image.srcset=srcset;
    image.loading='eager';
    image.fetchPriority='high';
    image.src=src;
    delete image.dataset.sfGallerySrc;
    delete image.dataset.sfGallerySrcset;
    delete image.dataset.sfGallerySizes;
  };
  // The product sheet uses native scroll snapping, not a second carousel.
  // Desktop scrolls horizontally; the mobile composition scrolls vertically.
  if(gallery.classList.contains('sf-ui-gallery--scroll')){
    const track=gallery.querySelector('.woocommerce-product-gallery__wrapper');
    if(!track)return;
    track.tabIndex=0;
    track.setAttribute('role','region');
    track.setAttribute('aria-label',document.getElementById('sf-product-sheet-template')?.dataset.galleryLabel||'Product images');
    const items=slides();
    if(!items.length)return;
    const nav=document.createElement('nav');
    nav.className='sf-ui-gallery-nav sf-product-gallery-nav';
    nav.setAttribute('aria-label',track.getAttribute('aria-label'));
    const count=document.createElement('span');
    count.className='sf-product-gallery-count';
    count.setAttribute('aria-live','polite');
    gallery.appendChild(count);
    function select(index){
      const image=imageAt(index);
      activate(image);
      const vertical=matchMedia('(max-width:700px)').matches;
      const item=items[index];
      const bounds=track.getBoundingClientRect();
      const rect=item.getBoundingClientRect();
      track.scrollTo({left:vertical?0:track.scrollLeft+rect.left-bounds.left,
        top:vertical?track.scrollTop+rect.top-bounds.top:0,
        behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
    }
    items.forEach((item,index)=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='sf-ui-icon-button sf-ui-icon-button--bare sf-icon-button sf-product-gallery-thumb';
      button.setAttribute('aria-label',(index+1)+' / '+items.length);
      const image=document.createElement('img');
      image.alt='';image.loading='lazy';image.width=44;image.height=44;
      image.src=item.getAttribute('data-thumb')||imageAt(index)?.getAttribute('src')||'';
      button.appendChild(image);
      button.addEventListener('click',()=>select(index));
      nav.appendChild(button);
    });
    if(items.length>1&&!gallery.classList.contains('sf-ui-gallery--no-thumbs'))gallery.appendChild(nav);
    function update(index){
      count.textContent=(index+1)+' / '+items.length;
      [...nav.children].forEach((button,i)=>button.setAttribute('aria-current',String(i===index)));
      activate(imageAt(index));
    }
    if('IntersectionObserver' in window){
      const visible=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){activate(entry.target.querySelector('a > img:not(.zoomImg)'));
            if(entry.intersectionRatio>=.55)update(items.indexOf(entry.target));}
        });
      },{root:track,threshold:[0.05,.55]});
      items.forEach(item=>visible.observe(item));
    }else items.forEach((_,i)=>activate(imageAt(i)));
    track.addEventListener('keydown',event=>{
      if(event.target!==track||!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const current=[...nav.children].findIndex(button=>button.getAttribute('aria-current')==='true');
      const delta=['ArrowDown','ArrowRight'].includes(event.key)?1:-1;
      select(event.key==='Home'?0:event.key==='End'?items.length-1:Math.max(0,Math.min(items.length-1,current+delta)));
    });
    // Woo replaces the featured image for a variation; reveal that same node.
    if(window.jQuery)window.jQuery(document).on('found_variation reset_data','.variations_form',()=>select(0));
    matchMedia('(max-width:700px)').addEventListener('change',()=>{track.scrollTo(0,0);update(0);});
    update(0);
    return;
  }
  const currentIndex=()=>{
    const active=gallery.querySelector('.woocommerce-product-gallery__image.flex-active-slide');
    const index=slides().indexOf(active);
    return index>=0?index:0;
  };
  const activateVisible=()=>{
    const slider=window.jQuery?.(gallery).data('flexslider');
    activate(imageAt(slider && Number.isInteger(slider.currentSlide)?slider.currentSlide:currentIndex()));
  };
  gallery.addEventListener('click',event=>{
    const thumb=event.target.closest('.flex-control-thumbs li');
    if(!thumb||!gallery.contains(thumb))return;
    activate(imageAt([...thumb.parentNode.children].indexOf(thumb)));
  },true);
  // Users can swipe both ways. Only after a real gesture begins do we prepare
  // adjacent images; no full secondary downloads occur on initial page load.
  const preloadAdjacent=()=>{
    const index=currentIndex();
    activate(imageAt(index-1));
    activate(imageAt(index+1));
  };
  gallery.addEventListener('touchstart',event=>{
    if(event.target.closest('.flex-viewport'))preloadAdjacent();
  },{passive:true});
  gallery.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'&&event.target.closest('.flex-viewport'))preloadAdjacent();
  },{passive:true});
  gallery.addEventListener('keydown',event=>{
    if(['ArrowRight','ArrowLeft'].includes(event.key)&&event.target.closest('.flex-viewport'))preloadAdjacent();
  });
  // FlexSlider changes this existing class on slide transitions. No polling,
  // carousel replacement or synthetic selection is introduced.
  const observer=new MutationObserver(mutations=>{
    for(const m of mutations){
      if(m.type==='attributes' && m.target.classList?.contains('flex-active-slide')
          && m.target.classList.contains('woocommerce-product-gallery__image')){
        activate(m.target.querySelector('a > img:not(.zoomImg)'));
      }
    }
    if(mutations.some(m=>m.type==='childList'))activateVisible();
  });
  observer.observe(gallery,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});
  activateVisible();
  // When a plugin disables native FlexSlider entirely, retain usable images.
  window.addEventListener('load',()=>{
    if(!gallery.querySelector('.flex-viewport'))slides().forEach((_,i)=>activate(imageAt(i)));
  },{once:true});
})();
