// WooCommerce still owns FlexSlider, variation updates and PhotoSwipe.
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
    if(mutations.some(m=>m.type==='attributes'||m.addedNodes.length))activateVisible();
  });
  observer.observe(gallery,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});
  activateVisible();
  // When a plugin disables native FlexSlider entirely, retain usable images.
  window.addEventListener('load',()=>{
    if(!gallery.querySelector('.flex-viewport'))slides().forEach((_,i)=>activate(imageAt(i)));
  },{once:true});
})();