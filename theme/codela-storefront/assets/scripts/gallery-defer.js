// WooCommerce owns variation updates and its native fullscreen PhotoSwipe.
// This adapter promotes native images and keeps a three-item preview window.
(()=>{
  const gallery=document.querySelector('.woocommerce-product-gallery.sf-ui-gallery');
  if(!gallery)return;
  const mobileMedia=matchMedia('(max-width:900px)');
  const allSlides=()=>[...gallery.querySelectorAll('.woocommerce-product-gallery__image')];
  const slides=()=>allSlides().filter(item=>item.dataset.sfGalleryDevice!==(mobileMedia.matches?'desktop':'mobile'));
  const imageAt=i=>slides()[i]?.querySelector('a img:not(.zoomImg)');
  const activate=image=>{
    const source=image?.closest('picture')?.querySelector('source[data-sf-gallery-srcset]');
    if(source){source.srcset=source.dataset.sfGallerySrcset;delete source.dataset.sfGallerySrcset;}
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
    let items=slides();
    if(!items.length)return;
    const jq=window.jQuery;
    const initialImage=imageAt(0);
    const portraitSource=initialImage?.closest('picture')?.querySelector('source');
    const originalAlts=new Map(allSlides().map(item=>{const image=item.querySelector('a img:not(.zoomImg)');return [image,image?.alt||''];}));
    let variationActive=false;
    const syncAlt=()=>originalAlts.forEach((alt,image)=>{if(image&&!(image===initialImage&&variationActive))image.alt=mobileMedia.matches?(image.dataset.sfMobileAlt||alt):alt;});
    syncAlt();
    let lightbox = null;
    const closeZoom = () => { if (lightbox) lightbox.close(); };
    track.addEventListener('click', event => {
      const link = event.target.closest('.woocommerce-product-gallery__image a');
      if (!link || !window.PhotoSwipe || !window.PhotoSwipeUI_Default) return;
      const template = document.querySelector('.pswp');
      if (!template) return; // Native image link is the no-runtime fallback.
      event.preventDefault(); event.stopImmediatePropagation();
      const images = items.map(item => {
        const image = item.querySelector('a img');
        const portrait = mobileMedia.matches && image.dataset.sfMobileUrl && !(item === items[0] && variationActive);
        return {src:portrait ? image.dataset.sfMobileUrl : (image.dataset.large_image || item.querySelector('a').href),
          w:Number(portrait ? image.dataset.sfMobileWidth : image.dataset.large_image_width) || image.naturalWidth || 1200,
          h:Number(portrait ? image.dataset.sfMobileHeight : image.dataset.large_image_height) || image.naturalHeight || 1200};
      });
      lightbox = new window.PhotoSwipe(template, window.PhotoSwipeUI_Default, images, {
        index:Math.max(0, items.indexOf(link.closest('.woocommerce-product-gallery__image'))),
        history:false, shareEl:false, closeOnScroll:false,
        showAnimationDuration:matchMedia('(prefers-reduced-motion:reduce)').matches ? 0 : 160,
        hideAnimationDuration:matchMedia('(prefers-reduced-motion:reduce)').matches ? 0 : 160
      });
      lightbox.listen('destroy', () => { lightbox = null; link.focus({preventScroll:true}); });
      lightbox.init();
    }, true);
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
      const behavior=matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth';
      if(vertical)window.scrollTo({top:window.scrollY+rect.top,behavior});
      else track.scrollTo({left:track.scrollLeft+rect.left-bounds.left,top:0,behavior});
    }
    const buildNav=()=>{
      nav.replaceChildren();
    items.forEach((item,index)=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='sf-ui-icon-button sf-ui-icon-button--bare sf-icon-button sf-product-gallery-thumb';
      button.setAttribute('aria-label',(index+1)+' / '+items.length);
      const image=document.createElement('img');
      image.alt='';image.loading='lazy';image.width=44;image.height=44;
      image.src=(mobileMedia.matches?item.dataset.sfMobileThumb:'')||item.getAttribute('data-thumb')||imageAt(index)?.getAttribute('src')||'';
      button.appendChild(image);
      button.addEventListener('click',()=>select(index));
      nav.appendChild(button);
    });
    nav.hidden=items.length<2||gallery.classList.contains('sf-ui-gallery--no-thumbs');
    };
    buildNav();gallery.appendChild(nav);
    // Fade only a shared glass material layer, never the preview images/count.
    const glass = document.createElement('span');
    glass.className = 'sf-product-gallery-glass sf-ui-surface sf-ui-surface--glass-panel';
    glass.setAttribute('aria-hidden', 'true');
    gallery.appendChild(glass);
    let glassTimer = 0;
    const showGlass = () => {
      const rect = nav.getBoundingClientRect();
      glass.style.cssText = `left:${rect.left - 4}px;top:${rect.top - 4}px;width:${rect.width + 8}px;height:${rect.height + 8}px`;
      glass.classList.toggle('is-visible', !nav.hidden && rect.height > 0);
      clearTimeout(glassTimer);
      glassTimer = setTimeout(() => glass.classList.remove('is-visible'), 2000);
    };
    window.addEventListener('scroll', showGlass, {passive:true});
    track.addEventListener('scroll', showGlass, {passive:true});
    window.addEventListener('resize', () => glass.classList.remove('is-visible'), {passive:true});
    // Shared IconButtons use this adapter's existing select/IO state. No second
    // gallery engine, slide clones or separate index is introduced.
    const controlsTemplate=document.getElementById('sf-product-gallery-controls-template');
    const arrows=allSlides().length>1&&controlsTemplate?controlsTemplate.content.firstElementChild.cloneNode(true):null;
    if(arrows){
      gallery.appendChild(arrows);
      arrows.querySelectorAll('[data-product-gallery-step]').forEach(button=>{
        button.addEventListener('click',()=>{
          const current=Math.max(0,[...nav.children].findIndex(item=>item.getAttribute('aria-current')==='true'));
          select(Math.max(0,Math.min(items.length-1,current+Number(button.dataset.productGalleryStep))));
        });
      });
    }
    let browsing=false;
    function prepareAdjacent(index){activate(imageAt(index-1));activate(imageAt(index+1));}
    function beginBrowsing(){
      browsing=true;
      const index=[...nav.children].findIndex(button=>button.getAttribute('aria-current')==='true');
      prepareAdjacent(Math.max(0,index));
    }
    ['touchstart','pointerdown','wheel'].forEach(type=>track.addEventListener(type,beginBrowsing,{passive:true}));
    track.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(event.key))beginBrowsing();});
    function update(index){
      count.textContent=(index+1)+' / '+items.length;
      if(arrows)arrows.hidden=items.length<2;
      arrows?.querySelectorAll('[data-product-gallery-step]').forEach(button=>{button.disabled=Number(button.dataset.productGalleryStep)<0?index===0:index===items.length-1;});
      const first=Math.max(0,Math.min(index-1,items.length-3));
      [...nav.children].forEach((button,i)=>{
        button.setAttribute('aria-current',String(i===index));
        button.hidden=i<first||i>=first+3;
      });
      activate(imageAt(index));
      if(browsing)prepareAdjacent(index);
    }
    let visible;
    function observe(){
      if(!('IntersectionObserver' in window)){items.forEach((_,i)=>activate(imageAt(i)));return;}
      visible?.disconnect();
      const vertical=matchMedia('(max-width:700px)').matches;
      const bottom=vertical?(parseFloat(document.body.style.getPropertyValue('--sf-product-collapsed-height'))||120):0;
      visible=new IntersectionObserver(entries=>{
        if(document.documentElement.classList.contains('sf-overlay-scroll-locked'))return;
        entries.forEach(entry=>{
          if(entry.isIntersecting){activate(entry.target.querySelector('a img:not(.zoomImg)'));
            if(entry.intersectionRatio>=.55)update(items.indexOf(entry.target));}
        });
      },{root:vertical?null:track,rootMargin:'0px 0px -'+bottom+'px 0px',threshold:[0.05,.55]});
      items.forEach(item=>visible.observe(item));
    }
    update(0);
    observe();
    let observedWidth=innerWidth;
    window.addEventListener('resize',()=>{
      // IO already follows viewport height. Reconnecting on every toolbar
      // animation needlessly resets visibility/count while the page moves.
      if(observedWidth===innerWidth)return;
      observedWidth=innerWidth;observe();
    });
    track.addEventListener('keydown',event=>{
      if(event.target!==track||!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const current=[...nav.children].findIndex(button=>button.getAttribute('aria-current')==='true');
      const discovery=track.querySelector('.sf-product-discovery');
      if(discovery&&matchMedia('(max-width:700px)').matches){
        // Native keys scroll long recommendation lists. Home returns to photos.
        if(gallery.classList.contains('is-discovering')&&event.key!=='Home')return;
        if(event.key==='End'||(current===items.length-1&&['ArrowDown','ArrowRight'].includes(event.key))){
          event.preventDefault();
          window.scrollTo({top:window.scrollY+discovery.getBoundingClientRect().top,behavior:'instant'});
          return;
        }
      }
      event.preventDefault();
      const delta=['ArrowDown','ArrowRight'].includes(event.key)?1:-1;
      select(event.key==='Home'?0:event.key==='End'?items.length-1:Math.max(0,Math.min(items.length-1,current+delta)));
    });
    // Woo replaces the featured image for a variation; reveal that same node.
    if(jq)jq(document).on('found_variation reset_data','.variations_form',(event,variation)=>{
      variationActive=event.type==='found_variation'&&Boolean(variation?.image?.src);
      if(portraitSource)portraitSource.media=variationActive?'not all':'(max-width:900px)';
      syncAlt();
      closeZoom();
      select(0);
    });
    mobileMedia.addEventListener('change',()=>{
      closeZoom();
      items=slides();syncAlt();buildNav();observe();update(0);track.scrollTo(0,0);
    });
    matchMedia('(max-width:700px)').addEventListener('change',()=>{track.scrollTo(0,0);window.scrollTo({top:0,behavior:'instant'});observe();update(0);});
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
        activate(m.target.querySelector('a img:not(.zoomImg)'));
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
