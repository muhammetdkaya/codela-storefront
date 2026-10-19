// Responsive source promotion only. Native image decoding, srcset selection and
// scrolling remain browser-owned; product gallery promotion has its own owner.
(()=>{
 const mount=()=>{
  const images=[...document.querySelectorAll('img[data-sf-media-src]')];
  if(!images.length)return;
  const promote=image=>{
   image.closest('picture')?.querySelectorAll('source[data-sf-media-srcset]').forEach(source=>{
    source.srcset=source.dataset.sfMediaSrcset;delete source.dataset.sfMediaSrcset;
   });
   if(image.dataset.sfMediaSizes)image.sizes=image.dataset.sfMediaSizes;
   if(image.dataset.sfMediaSrcset)image.srcset=image.dataset.sfMediaSrcset;
   image.src=image.dataset.sfMediaSrc;
   delete image.dataset.sfMediaSrc;delete image.dataset.sfMediaSrcset;delete image.dataset.sfMediaSizes;
  };
  if(!('IntersectionObserver' in window)){images.forEach(promote);return;}
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);promote(entry.target);}
  },{rootMargin:'200px'});
  images.forEach(image=>observer.observe(image));
  // Printing includes all photographs; restore native sources before printing.
  addEventListener('beforeprint',()=>{observer.disconnect();images.filter(image=>image.dataset.sfMediaSrc).forEach(promote);},{once:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
