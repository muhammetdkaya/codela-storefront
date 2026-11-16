/**
 * Codela Storefront · Glisse shell adapter, phase 1.
 * Real Glisse v0.6.0 TabBar and Glass, not a CSS imitation.
 * Native WordPress Interactivity actions and URLs remain authoritative.
 * If this enhancement fails or JavaScript is unavailable, the PHP shell
 * stays fully interactive, including search/cart/account dialogs.
 */
import { TabBar, Glass } from 'glisse';

const React = window.wp?.element;
const doc = document;
if (React?.createRoot && typeof ResizeObserver !== 'undefined') {
  const h = React.createElement;
  const roots = new Map();
  const docks = new Map();
  const selector = [
    '.sf-shell .sf-header .sf-brand.sf-ui-surface',
    '.sf-shell .sf-header .sf-actions.sf-ui-surface',
    '.sf-shell .sf-header .sf-desktop-navigation.sf-ui-surface',
    '.sf-shell .sf-header .sf-ui-icon-button--soft',
    '.sf-shell .sf-ui-icon-button--soft:not(.sf-dock-item)',
    '.sf-shell .sf-ui-button.sf-ui-surface',
    'body:not(.codela-my-account-layout) .sf-content .sf-ui-icon-button--soft',
    'body:not(.codela-my-account-layout) .sf-content .sf-ui-button.sf-ui-surface'
  ].join(',');

  function mountGlass(el) {
    if (roots.has(el) || el.closest('.sf-mobile-dock') || el.hidden ||
        el.matches('[aria-hidden="true"]') || el.closest('[hidden]')) return;
    // Protect the production route on pages with dozens of product controls.
    if (roots.size >= 32) return;
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
    if(docks.has(dock))return;
    const native=dock.querySelector('.sf-dock-surface');
    const anchors=[...native?.querySelectorAll('.sf-dock-item')||[]];
    if(anchors.length!==4)return;
    const mount=doc.createElement('div');
    mount.className='sf-glisse-dock-root';
    native.after(mount);
    const root=React.createRoot(mount);
    let ready=false;
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
      const current=anchors.find(a=>a.classList.contains('is-active'))?.dataset.dockView ?? null;
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
      mount.inert=dock.classList.contains('is-collapsed');
      root.render(h(TabBar,{
        items,
        value:current,
        link:BridgeLink,
        className:'sf-glisse-tabbar',
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
      attributeFilter:['class','aria-current','aria-expanded','aria-hidden','style']});
    watch.observe(dock,{attributes:true,attributeFilter:['class','hidden']});
    docks.set(dock,{root,watch,mount,anchors});
    sync();
  }
  let queued=false;
  function refresh() {
    queued=false;
    for(const [el,root] of roots)if(!el.isConnected){root.unmount();roots.delete(el);}
    for(const [el,entry] of docks)if(!el.isConnected){entry.watch.disconnect();entry.root.unmount();docks.delete(el);}
    const shell=doc.querySelector('.sf-shell');
    if(!shell)return;
    shell.classList.add('sf-glisse-light');
    doc.querySelectorAll('.sf-mobile-dock').forEach(mountDock);
    doc.querySelectorAll(selector).forEach(mountGlass);
  }
  function scheduleRefresh() {
    if(queued)return;
    queued=true;
    requestAnimationFrame(refresh);
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();
  // WordPress router, account overlay and WooCommerce can swap parts of the shell.
  const changes=new MutationObserver(scheduleRefresh);
  changes.observe(doc.documentElement,{childList:true,subtree:true});
  doc.addEventListener('codela:navigation-complete',scheduleRefresh);
}
