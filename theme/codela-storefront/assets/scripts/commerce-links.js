/**
 * Native commerce documents intentionally bypass the Core Router. They still
 * need the SAME immediate navigation feedback as other Storefront pages.
 * Runs in <head>; observes ordinary links without changing navigation, forms,
 * WooCommerce AJAX, gateway events or payment endpoints.
 */
(() => {
  const config=window.codelaSFDocument||{};
  const matches=(target,value)=>{
    if(!value)return false;
    const base=new URL(value,location.href);
    return target.origin===base.origin &&
      target.pathname.replace(/\/+$/,'')===base.pathname.replace(/\/+$/,'') &&
      [...base.searchParams].every(([key,v])=>target.searchParams.get(key)===v);
  };
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href]');
    if(!link || event.button!==0 || event.metaKey || event.ctrlKey ||
      event.shiftKey || event.altKey || link.hasAttribute('download') ||
      (link.target && link.target!=='_self') || link.closest('form,[contenteditable]'))return;
    let url;
    try {url=new URL(link.href,location.href);}catch{return;}
    if(url.origin!==location.origin || !['http:','https:'].includes(url.protocol) ||
      url.hash || url.href===location.href ||
      ['add-to-cart','remove_item','_wpnonce','wc-ajax','order-pay','key'].some(k=>url.searchParams.has(k)) ||
      /\/(order-pay|order-received|customer-logout|lost-password|wp-admin|wp-json)(\/|$)/.test(url.pathname))return;
    if(!matches(url,config.cart)&&!matches(url,config.checkout))return;
    // Native navigation continues. There is no custom fetch or preventDefault.
    // Capture starts before Woo's click handlers and before the document unloads.
    window.codelaSFFeedback?.begin({url:url.href,link,owner:'commerce'});
  },true);
})();
