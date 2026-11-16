/**
 * Codela Storefront · Glisse shell adapter, phase 1.
 * Real Glisse v0.5.0 TabBar and Glass, not a CSS imitation.
 * Native WordPress Interactivity actions and URLs remain authoritative.
 * If this enhancement fails or JavaScript is unavailable, the PHP shell
 * stays fully interactive, including search/cart/account dialogs.
 */
import { TabBar, Glass, Button } from 'glisse';

const React = window.wp?.element;
const doc = document;
if (React?.createRoot && typeof ResizeObserver !== 'undefined') {
  const h = React.createElement;
  const roots = new Map();
  const buttonRoots = new Map();
  const docks = new Map();
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

  function mountDock(dock) {
    if(docks.has(dock) || window.matchMedia('(forced-colors: active)').matches)return;
    const native=dock.querySelector('.sf-dock-surface');
    const anchors=[...native?.querySelectorAll('.sf-dock-item')||[]];
    if(anchors.length!==4)return;
    const mount=doc.createElement('div');
    mount.className='sf-glisse-dock-root';
    native.after(mount);
    const root=React.createRoot(mount);
    let ready=false;
    let widthObserver;
    let lastState = '';
    let width = dock.clientWidth;
    const base=anchors.map((anchor,index)=>({
      value:anchor.dataset.dockView,
      label:anchor.querySelector(':scope > span:last-child')?.textContent?.trim()||anchor.getAttribute('aria-label')||'',
      href:anchor.href,
      index
    }));
    function BridgeLink(props) {
      return h('a', {...props, onClick:event=>{
        if(props.onClick)props.onClick(event);
        if(event.defaultPrevented || event.metaKey || event.ctrlKey ||
           event.shiftKey || event.altKey || event.button!==0)return;
        event.preventDefault();
        const at=[...event.currentTarget.parentElement.querySelectorAll('.lg-tab')].indexOf(event.currentTarget);
        if(at>=0)anchors[at]?.click();
      }});
    }
    function sync() {
      if(!dock.isConnected)return;
      mount.inert=dock.hidden || dock.classList.contains('is-collapsed');
      if(dock.hidden || width<=0)return;
      const current=anchors.find(a=>a.classList.contains('is-active'))?.dataset.dockView ?? null;
      // Ignore cosmetic pressed/preview/collapsed class changes: Glisse already
      // owns the spring animation and a React render would interrupt it.
      const state=[current??'',width,...anchors.map(a=>a.querySelector('.sf-badge')?.textContent?.trim()??'')].join('|');
      if(ready && state===lastState)return;
      lastState=state;
      const items=base.map(({value,label,href,index})=>{
        const icon=anchors[index].querySelector('.sf-icon');
        const svg=icon?.outerHTML||'';
        const badge=anchors[index].querySelector('.sf-badge');
        const badgeText=badge?.textContent?.trim();
        return {value,label,href,icon:h('span',{
          className:'sf-glisse-dock-icon',
          dangerouslySetInnerHTML:{__html:svg+(badgeText ? '<span class="sf-glisse-dock-badge">'+badgeText.replace(/[^0-9+]/g,'')+'</span>' : '')}
        })};
      });
      root.render(h(TabBar,{
        items,
        value:current,
        link:BridgeLink,
        className:'sf-glisse-tabbar',
        style:{'--lg-tab-width':Math.max(0,(width-8)/4)+'px'},
        'aria-label':dock.getAttribute('aria-label')||'Mobile navigation'
      }));
      if(!ready)requestAnimationFrame(()=>{
        if(!dock.isConnected || !mount.querySelector('.lg-tab-bar'))return;
        // Never hide the accessible native links before the new controls exist.
        anchors.forEach(a=>{ a.setAttribute('aria-hidden','true'); a.tabIndex=-1; });
        dock.classList.add('sf-glisse-ready');
        ready=true;
      });
    }
    let scheduled=false;
    const schedule=()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;sync();});
    };
    const watch=new MutationObserver(schedule);
    watch.observe(native,{attributes:true,childList:true,characterData:true,subtree:true,
      attributeFilter:['class','aria-current','aria-expanded']});
    watch.observe(dock,{attributes:true,attributeFilter:['class','hidden']});
    // Width changes matter; a CSS class/scroll frame must not re-measure layout.
    const resize=()=>{
      const next=dock.clientWidth;
      if(next===width)return;
      width=next;
      schedule();
    };
    widthObserver=new ResizeObserver(resize);
    widthObserver.observe(dock);
    window.addEventListener('resize',resize,{passive:true});
    docks.set(dock,{root,watch,widthObserver,resize,mount,anchors});
    sync();
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
    for(const [el,entry] of docks)if(!el.isConnected){entry.watch.disconnect();entry.widthObserver.disconnect();window.removeEventListener('resize',entry.resize);entry.root.unmount();docks.delete(el);}
    const shell=doc.querySelector('.sf-shell');
    if(!shell)return;
    shell.classList.add('sf-glisse-light');
    doc.querySelectorAll('.sf-mobile-dock').forEach(mountDock);
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
        if(node.closest?.('.sf-glisse-dock-root,.sf-glisse-glass-mount,.sf-glisse-button-mount'))continue;
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
