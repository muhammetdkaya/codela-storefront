/**
 * Codela Storefront · Glisse shell adapter, phase 1.
 * Glisse v0.5.0 Glass and Button enhancements for the native shell.
 * Native WordPress Interactivity actions and URLs remain authoritative.
 * If this enhancement fails or JavaScript is unavailable, the PHP shell
 * stays fully interactive, including search/cart/account dialogs.
 */
import { Glass, Button } from 'glisse';

const React = window.wp?.element;
const doc = document;
if (React?.createRoot && typeof ResizeObserver !== 'undefined') {
  const h = React.createElement;
  const roots = new Map();
  const buttonRoots = new Map();
  // Mobile navigation stays fully native. No optional React mount.
  const buttonQueued = new WeakSet();
  const buttonObserver = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        buttonObserver.unobserve(entry.target);
        mountButton(entry.target);
      }
    }, {rootMargin:'80px'}) : null;
  // Header capsules are genuine Glisse Glass; individual soft controls
  // use a genuine Glisse Button paint-layer without replacing native actions.
  const selector = [
    '.sf-shell .sf-header .sf-brand.sf-ui-surface',
    '.sf-shell .sf-header .sf-actions.sf-ui-surface',
    '.sf-shell .sf-header .sf-desktop-navigation.sf-ui-surface'
  ].join(',');
  const buttonSelector = [
    '.sf-shell :is(a,button).sf-ui-icon-button--soft',
    '#sf-content :is(a,button).sf-ui-icon-button--soft',
    '.sf-shell :is(a,button).sf-ui-button--secondary',
    '#sf-content :is(a,button).sf-ui-button--secondary'
  ].join(',');

  function mountButton(el) {
    if (buttonRoots.has(el) || buttonRoots.size >= 8 ||
        el.closest('.sf-mobile-dock,.sf-header,#sf-panel,[hidden]') ||
        el.matches('.sf-menu-trigger') || el.hidden || !el.getClientRects().length) return;
    const visible=el.getBoundingClientRect();
    if(visible.bottom < -80 || visible.top > window.innerHeight + 80) return;
    const parent = el.parentElement;
    if (!parent || !parent.isConnected) return;
    // Keep the native link/button, its Interactivity API handlers, its ID,
    // keyboard focus, disabled state, and WooCommerce actions untouched.
    const mount = doc.createElement('span');
    mount.className = 'sf-glisse-button-mount';
    mount.setAttribute('aria-hidden', 'true');
    if (getComputedStyle(parent).position === 'static')
      parent.classList.add('sf-glisse-button-parent');
    parent.append(mount);
    const root = React.createRoot(mount);
    const measure = () => {
      if (!el.isConnected) return;
      const box = el.getBoundingClientRect();
      const container = parent.getBoundingClientRect();
      const parentStyle = getComputedStyle(parent);
      const scaleX = container.width / (parent.offsetWidth || container.width || 1);
      const scaleY = container.height / (parent.offsetHeight || container.height || 1);
      const x = (box.left - container.left - (parseFloat(parentStyle.borderLeftWidth) || 0)) / (scaleX || 1) + parent.scrollLeft;
      const y = (box.top - container.top - (parseFloat(parentStyle.borderTopWidth) || 0)) / (scaleY || 1) + parent.scrollTop;
      mount.style.left = x + 'px';
      mount.style.top = y + 'px';
      mount.style.width = box.width / (scaleX || 1) + 'px';
      mount.style.height = box.height / (scaleY || 1) + 'px';
      mount.style.borderRadius = getComputedStyle(el).borderRadius;
    };
    root.render(h(Button, {
      className:'sf-glisse-paint-button',
      ref:node=>{
        if (node && el.isConnected) {
          el.classList.add('sf-glisse-button-host');
          measure();
        }
      },
      type:'button',
      tabIndex:-1,
      'aria-hidden':'true',
      style:{width:'100%',height:'100%',borderRadius:'inherit',padding:0}
    }));
    const forwardDown = event => {
      if (event.button !== 0 || !event.isPrimary ||
          el.matches(':disabled,[aria-disabled="true"],[aria-busy="true"]')) return;
      const paint = mount.querySelector('.lg-button');
      if (!paint || typeof PointerEvent === 'undefined') return;
      paint.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles:false, cancelable:false, pointerId:event.pointerId,
        pointerType:event.pointerType, isPrimary:event.isPrimary,
        button:event.button, buttons:event.buttons,
        clientX:event.clientX, clientY:event.clientY
      }));
    };
    el.addEventListener('pointerdown',forwardDown,{passive:true});
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(parent);
    buttonRoots.set(el,{root,mount,parent,observer,measure,forwardDown});
    measure();

  }

  function mountGlass(el) {
    if (roots.has(el) || el.closest('.sf-mobile-dock') || el.hidden ||
        el.matches('[aria-hidden="true"]') || el.closest('[hidden]')) return;
    // Protect the production route on pages with dozens of product controls.
    if (roots.size >= 18) return;
    if(!el.closest('.sf-header')) {
      const bounds=el.getBoundingClientRect();
      if(bounds.top>window.innerHeight+120 || bounds.bottom < -120)return;
    }
    const mount = doc.createElement('span');
    mount.className = 'sf-glisse-glass-mount';
    mount.setAttribute('aria-hidden','true');
    el.append(mount);
    const root = React.createRoot(mount);
    roots.set(el, root);
    root.render(h(Glass, { className:'sf-glisse-glass-plate', 'aria-hidden':'true' }));
    requestAnimationFrame(() => {
      if (el.isConnected && mount.firstElementChild) el.classList.add('sf-glisse-host');
    });
    const press = event => {
      if (el.matches(':disabled,[aria-disabled="true"],[aria-busy="true"]')) return;
      if (event.type === 'pointerdown' && event.button !== 0) return;
      mount.firstElementChild?.toggleAttribute('data-pressed', event.type === 'pointerdown');
      if (event.type === 'pointerdown') {
        const b=el.getBoundingClientRect();
        mount.firstElementChild?.style.setProperty('--lg-x', ((event.clientX-b.left)/Math.max(1,b.width)*100)+'%');
        mount.firstElementChild?.style.setProperty('--lg-y', ((event.clientY-b.top)/Math.max(1,b.height)*100)+'%');
      }
    };
    el.addEventListener('pointerdown',press,{passive:true});
    for(const type of ['pointerup','pointercancel','pointerleave'])el.addEventListener(type,press,{passive:true});
  }

  let queued=false;
  function refresh() {
    queued=false;
    for(const [el,root] of roots)if(!el.isConnected){root.unmount();roots.delete(el);}
    for(const [el,entry] of buttonRoots)if(!el.isConnected){
      entry.observer.disconnect();
      el.removeEventListener('pointerdown',entry.forwardDown);
      entry.root.unmount();
      entry.mount.remove();
      if(!entry.parent.querySelector('.sf-glisse-button-mount'))
        entry.parent.classList.remove('sf-glisse-button-parent');
      buttonRoots.delete(el);
    }
    const shell=doc.querySelector('.sf-shell');
    if(!shell)return;
    shell.classList.add('sf-glisse-light');
    // Native mobile dock is not touched by this adapter.
    doc.querySelectorAll(selector).forEach(mountGlass);
    doc.querySelectorAll(buttonSelector).forEach(el=>{
      if(buttonRoots.has(el) || buttonQueued.has(el))return;
      if(el.closest('#sf-panel,.sf-header,.sf-mobile-dock'))return;
      if(buttonObserver){
        buttonQueued.add(el);
        buttonObserver.observe(el);
      } else mountButton(el);
    });
  }
  function scheduleRefresh() {
    if(queued)return;
    queued=true;
    requestAnimationFrame(refresh);
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();
  // WordPress router, account overlay and WooCommerce can swap parts of the shell.
  // React material internals mutate DOM while animating. Observe *structural*
  // additions only; do not rescan the entire document on each overlay state,
  // class update, menu morph or page scroll.
  const structural='.sf-shell,.sf-header,.sf-mobile-dock,#sf-content,.sf-ui-icon-button--soft,.sf-ui-button--secondary';
  const changes=new MutationObserver(records=>{
    for(const record of records){
      for(const node of [...record.addedNodes,...record.removedNodes]){
        if(node.nodeType!==1)continue;
        if(node.closest?.('.sf-glisse-glass-mount,.sf-glisse-button-mount'))continue;
        if(node.matches(structural) || node.querySelector(structural)){
          scheduleRefresh();
          return;
        }
      }
    }
  });
  changes.observe(doc.documentElement,{childList:true,subtree:true});
  doc.addEventListener('codela:navigation-complete',scheduleRefresh);
  window.addEventListener('pageshow',scheduleRefresh);
}
