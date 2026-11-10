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
    let expand = null;
    let expandTimer = 0;
    const closeZoom = () => { if (lightbox) lightbox.close(); };
    // Keep fullscreen hidden until an intentional photo tap; the button then
    // appears just under the real header menu, even with Safari chrome offsets.
    const hideExpand = () => {
      if (!expand) return;
      clearTimeout(expandTimer);
      expand.classList.remove('is-visible');
      expand.tabIndex = -1;
      expand.setAttribute('aria-hidden','true');
    };
    const revealExpand = () => {
      if (!expand || !matchMedia('(max-width:700px)').matches ||
          document.body.classList.contains('sf-product-sheet-open') ||
          gallery.classList.contains('is-discovering')) return;
      const menu = document.querySelector('.sf-header .sf-menu-trigger');
      if (menu) {
        const rect = menu.getBoundingClientRect();
        if (rect.width && rect.height && rect.right > innerWidth * .5) {
          expand.style.top = Math.round(rect.bottom + 12) + 'px';
          expand.style.right = Math.round(Math.max(12,innerWidth - rect.right + (rect.width - 46) / 2)) + 'px';
        }
      }
      expand.classList.add('is-visible');
      expand.tabIndex = 0;
      expand.setAttribute('aria-hidden','false');
      clearTimeout(expandTimer);
      expandTimer = setTimeout(hideExpand, 3200);
    };
    // The image itself and the dedicated expand control open ONE native
    // PhotoSwipe instance. Woo image URLs and variation attributes are reused.
    function openFullScreen(index, trigger) {
      const template = document.querySelector('.pswp');
      if (!template || !window.PhotoSwipe || !window.PhotoSwipeUI_Default) return false;
      const link = items[index]?.querySelector('a');
      if (!link) return false;
      const images = items.map(item => {
        const image = item.querySelector('a img');
        const portrait = mobileMedia.matches && image.dataset.sfMobileUrl && !(item === items[0] && variationActive);
        return {src:portrait ? image.dataset.sfMobileUrl : (image.dataset.large_image || item.querySelector('a').href),
          w:Number(portrait ? image.dataset.sfMobileWidth : image.dataset.large_image_width) || image.naturalWidth || 1200,
          h:Number(portrait ? image.dataset.sfMobileHeight : image.dataset.large_image_height) || image.naturalHeight || 1200};
      });
      lightbox = new window.PhotoSwipe(template, window.PhotoSwipeUI_Default, images, {
        index:Math.max(0,index),history:false,shareEl:false,closeOnScroll:false,
        showAnimationDuration:matchMedia('(prefers-reduced-motion:reduce)').matches ? 0 : 160,
        hideAnimationDuration:matchMedia('(prefers-reduced-motion:reduce)').matches ? 0 : 160
      });
      lightbox.listen('destroy', () => {
        lightbox = null;
        // The transient expand button hides after opening. Return keyboard
        // focus to its real Woo image link, never a hidden control.
        const returnTarget = trigger?.classList.contains('sf-product-gallery-expand') ? link : (trigger || link);
        returnTarget.focus({preventScroll:true});
      });
      lightbox.init();
      return true;
    }
    track.addEventListener('click', event => {
      const link = event.target.closest('.woocommerce-product-gallery__image a');
      if (!link) return;
      const index = items.indexOf(link.closest('.woocommerce-product-gallery__image'));
      if (matchMedia('(max-width:700px)').matches && event.detail !== 0) {
        // A touch/click on the photograph REVEALS the separate fullscreen
        // control; it never unexpectedly opens PhotoSwipe on the first tap.
        event.preventDefault();event.stopImmediatePropagation();
        revealRail();revealExpand();
        return;
      }
      // Keyboard activation remains directly usable for accessibility.
      if (openFullScreen(index,link)) { event.preventDefault();event.stopImmediatePropagation(); }
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
    buildNav();
    // The glass material is the PERSISTENT rail containing the real native
    // preview controls, not a fading fixed overlay that disappears on scroll.
    const rail = document.createElement('div');
    rail.className = 'sf-product-gallery-rail sf-ui-surface sf-ui-surface--glass-panel';
    rail.setAttribute('role','group');
    rail.setAttribute('aria-label',track.getAttribute('aria-label'));
    const control = (direction, label) => {
      const button=document.createElement('button');
      button.type='button';
      button.className='sf-ui-icon-button sf-product-gallery-rail-arrow';
      button.setAttribute('aria-label',label);
      button.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(direction<0?'m6 15 6-6 6 6':'m6 9 6 6 6-6')+'"/></svg>';
      button.addEventListener('click',()=>select(Math.max(0,Math.min(items.length-1,currentIndex()+direction))));
      return button;
    };
    const previous=control(-1,document.getElementById('sf-product-sheet-template')?.dataset.previousImageLabel||'Previous image');
    const next=control(1,document.getElementById('sf-product-sheet-template')?.dataset.nextImageLabel||'Next image');
    const currentIndex=()=>Math.max(0,[...nav.children].findIndex(node=>node.getAttribute('aria-current')==='true'));
    rail.append(previous,nav,count,next);
    gallery.appendChild(rail);
    // Center between the actual header and purchase surface, including Safari's
    // visual viewport. Hidden arrow slots have symmetric height around previews.
    let railFrame = 0;
    function positionRail() {
      railFrame = 0;
      if (!matchMedia('(max-width:700px)').matches || document.body.classList.contains('sf-product-sheet-open')) return;
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop || 0;
      const bottom = top + (viewport?.height || innerHeight);
      const header = document.querySelector('.sf-header')?.getBoundingClientRect();
      const sheet = document.querySelector('.sf-product-sheet')?.getBoundingClientRect();
      const start = Math.max(top + 12, header?.bottom || top + 80);
      const end = Math.min(bottom - 12, sheet?.top || bottom - 190);
      rail.style.setProperty('--sf-gallery-rail-center', ((start + end) / 2) + 'px');
    }
    const queueRailPosition = () => { if (!railFrame) railFrame = requestAnimationFrame(positionRail); };
    window.addEventListener('resize', queueRailPosition, {passive:true});
    window.addEventListener('scroll', queueRailPosition, {passive:true});
    window.visualViewport?.addEventListener('resize', queueRailPosition, {passive:true});
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(queueRailPosition);
      const sheet = document.querySelector('.sf-product-sheet');
      if (sheet) observer.observe(sheet);
      const header = document.querySelector('.sf-header');
      if (header) observer.observe(header);
    }
    queueRailPosition();
    // Glass and arrows are a temporary interaction hint, while previews and
    // count remain visible. Repeated movement resets the fade delay.
    let railTimer=0;
    const hideRail=()=>{
      clearTimeout(railTimer);
      rail.classList.remove('is-active');
      previous.tabIndex=-1;next.tabIndex=-1;
    };
    const revealRail=()=>{
      if (!mobileMedia.matches || rail.hidden ||
          document.body.classList.contains('sf-product-sheet-open') ||
          gallery.classList.contains('is-discovering')) return;
      rail.classList.add('is-active');
      previous.tabIndex=0;next.tabIndex=0;
      clearTimeout(railTimer);
      railTimer=setTimeout(hideRail, 1800);
    };
    rail.addEventListener('pointerdown',revealRail,{passive:true});
    rail.addEventListener('focusin',revealRail);
    // Native document scrolling is the mobile gallery's actual motion.
    window.addEventListener('scroll',()=>{
      const photo=items[currentIndex()];
      const bounds=photo?.getBoundingClientRect();
      if (bounds && bounds.bottom>0 && bounds.top<innerHeight &&
          !gallery.classList.contains('is-discovering') &&
          !document.body.classList.contains('sf-product-sheet-open')) revealRail();
      else hideRail();
    },{passive:true});
    // Independent fullscreen affordance; gallery navigation remains intact.
    expand=document.createElement('button');
    expand.type='button';
    expand.className='sf-ui-icon-button sf-product-gallery-expand';
    expand.tabIndex=-1;
    expand.setAttribute('aria-hidden','true');
    expand.setAttribute('aria-label',document.getElementById('sf-product-sheet-template')?.dataset.fullscreenLabel||'Open fullscreen gallery');
    expand.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H3v5M3 3l7 7M16 3h5v5m0-5-7 7M3 16v5h5m-5 0 7-7m11 2v5h-5m5 0-7-7"/></svg>';
    expand.addEventListener('click',()=>{
      if (!expand.classList.contains('is-visible')) return;
      const index=currentIndex();
      if (openFullScreen(index,expand)) hideExpand();
      else {
        hideExpand();
        // Native Woo link is the graceful fallback when PhotoSwipe is absent.
        location.assign(items[index]?.querySelector('a')?.href || location.href);
      }
    });
    gallery.appendChild(expand);
    window.addEventListener('scroll',hideExpand,{passive:true});
    window.addEventListener('resize',hideExpand,{passive:true});
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
      revealRail();
      const index=[...nav.children].findIndex(button=>button.getAttribute('aria-current')==='true');
      prepareAdjacent(Math.max(0,index));
    }
    ['touchstart','pointerdown','wheel'].forEach(type=>track.addEventListener(type,beginBrowsing,{passive:true}));
    track.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(event.key))beginBrowsing();});
    let lastRailIndex=-1;
    function update(index){
      if(lastRailIndex>=0 && lastRailIndex!==index) revealRail();
      lastRailIndex=index;
      count.textContent=(index+1)+' / '+items.length;
      if(arrows)arrows.hidden=items.length<2;
      rail.hidden=items.length<2||nav.hidden;
      previous.disabled=index===0;next.disabled=index===items.length-1;
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
      hideExpand();
      select(0);
    });
    mobileMedia.addEventListener('change',()=>{
      closeZoom();hideExpand();hideRail();lastRailIndex=-1;
      items=slides();syncAlt();buildNav();observe();update(0);track.scrollTo(0,0);
    });
    matchMedia('(max-width:700px)').addEventListener('change',()=>{hideRail();lastRailIndex=-1;track.scrollTo(0,0);window.scrollTo({top:0,behavior:'instant'});observe();update(0);});
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
