// Responsive source promotion only. Native image decoding, srcset selection and
// scrolling remain browser-owned; product gallery promotion has its own owner.
(()=>{
 const promote=image=>{
   if(!image.dataset.sfMediaSrc)return;
   image.closest('picture')?.querySelectorAll('source[data-sf-media-srcset]').forEach(source=>{
    source.srcset=source.dataset.sfMediaSrcset;delete source.dataset.sfMediaSrcset;
   });
   if(image.dataset.sfMediaSizes)image.sizes=image.dataset.sfMediaSizes;
   if(image.dataset.sfMediaSrcset)image.srcset=image.dataset.sfMediaSrcset;
   image.src=image.dataset.sfMediaSrc;
   delete image.dataset.sfMediaSrc;delete image.dataset.sfMediaSrcset;delete image.dataset.sfMediaSizes;
 };
 // The existing gallery adapter owns selection; it signals actual navigation
 // intent so a hidden next picture starts before the native scroll animation.
 document.addEventListener('codela:media-intent',event=>{
  event.target.querySelectorAll('img[data-sf-media-src]').forEach(promote);
 });
 const mount=()=>{
  const images=[...document.querySelectorAll('img[data-sf-media-src]')];
  if(!images.length)return;
  if(!('IntersectionObserver' in window)){images.forEach(promote);return;}
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting&&entry.intersectionRatio>0){observer.unobserve(entry.target);promote(entry.target);}
  // Prefetch vertically as the visitor scrolls, not sideways into a hidden
  // slide. Touch/keyboard selection already promotes its intended neighbour.
  // A positive threshold also excludes zero-area contact at the track edge.
  },{rootMargin:'200px 0px',threshold:0.01});
  images.forEach(image=>observer.observe(image));
  // Printing includes all photographs; restore native sources before printing.
  addEventListener('beforeprint',()=>{observer.disconnect();images.filter(image=>image.dataset.sfMediaSrc).forEach(promote);},{once:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
