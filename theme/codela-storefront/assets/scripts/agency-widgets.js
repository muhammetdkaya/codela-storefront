/* Independent agency layout widgets. A duplicated block owns its own state. */
(() => {
  const widgets = Array.from(document.querySelectorAll('[data-agency-widget]'));
  if (!widgets.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  widgets.forEach(widget => {
    if (widget.dataset.agencyWidgetInitialized === 'true') return;
    widget.dataset.agencyWidgetInitialized = 'true';


    const quoteForm = widget.querySelector('[data-quote-form]');
    if (quoteForm && !quoteForm.dataset.quoteReady) {
      quoteForm.dataset.quoteReady = '1';
      const estimate = quoteForm.querySelector('[data-quote-estimate]');
      const update = () => {
        const selected = [quoteForm.querySelector('select[name="quote_package"]')?.selectedOptions[0], ...quoteForm.querySelectorAll('input[name="quote_extra[]"]:checked')];
        if (selected.some(x => !x || !/^\d+$/.test(x.dataset.min || '') || !/^\d+$/.test(x.dataset.max || ''))) { estimate.hidden = true; estimate.textContent = ''; return; }
        const low = selected.reduce((sum,x)=>sum+Number(x.dataset.min),0);
        const high = selected.reduce((sum,x)=>sum+Number(x.dataset.max),0);
        const format = new Intl.NumberFormat('tr-TR');
        estimate.textContent = 'Tahmini: '+format.format(low)+(low===high?'':' – '+format.format(high))+' TL';
        estimate.hidden = false;
      };
      quoteForm.addEventListener('change',update);update();
    }

    if (widget.dataset.agencyWidget === 'project') {
      const form = widget.querySelector('[data-project-form]');
      const steps=[...widget.querySelectorAll('[data-project-step]')];
      const progress=widget.querySelector('[data-project-progress-bar]');
      const indicator=widget.querySelector('[data-project-progress-label]');
      const summary=widget.querySelector('[data-project-summary]');
      if(form && steps.length===4 && progress && indicator && summary){
        let active=0;
        const services=[...form.querySelectorAll('input[name="agency_project_service[]"]')];
        const scopes=[...form.querySelectorAll('[data-project-scope]')];
        const nextLabel=form.querySelector('[data-scope-next-label]');
        const scopeError=form.querySelector('[data-scope-error]');
        const total=form.querySelector('[data-scope-total]');
        let activeScope='';
        const format=new Intl.NumberFormat('tr-TR');
        const selectedScopes=()=>scopes.filter(x=>services.some(s=>s.checked&&s.value===x.dataset.projectScope));
        const serviceName=scope=>scope?.querySelector('legend')?.textContent||'';
        const scopeLabels=()=>selectedScopes().map(x=>serviceName(x)+': '+x.querySelector('[data-scope-estimate]').textContent);
        const hasChoice=scope=>!!scope?.querySelector('[data-scope-package]:checked,[data-scope-custom]:checked');
        const currentScope=()=>selectedScopes().find(x=>x.dataset.projectScope===activeScope);
        const setError=visible=>{if(scopeError)scopeError.hidden=!visible;};
        const money=(min,max)=>format.format(min)+(min===max?'':' – '+format.format(max))+' TL';
        const updateScopes=()=>{
          const chosen=selectedScopes();
          if(!chosen.some(x=>x.dataset.projectScope===activeScope))activeScope=chosen[0]?.dataset.projectScope||'';
          const current=chosen.findIndex(x=>x.dataset.projectScope===activeScope);
          const last=current===chosen.length-1;
          // Each selected scope is a full wizard step. Recalculate even on step 1.
          const count=chosen.length+3;
          const stepNumber=active===0?1:active===1?current+2:chosen.length+active;
          const label=n=>String(n).padStart(2,'0');
          progress.style.width=(stepNumber/count*100)+'%';
          indicator.textContent=label(stepNumber)+' / '+label(count);
          if(nextLabel)nextLabel.textContent=last?'Devam Et: Takvim':'Devam Et: '+serviceName(chosen[current+1]);

          for(const scope of scopes){
            const included=chosen.includes(scope);
            scope.hidden=!included||scope.dataset.projectScope!==activeScope;
            // Completed or upcoming selected services remain in the native form.
            scope.disabled=!included;
            const custom=scope.querySelector('[data-scope-custom]')?.checked;
            const packages=[...scope.querySelectorAll('[data-scope-package]')];
            const extras=[...scope.querySelectorAll('[data-scope-extra]')];
            packages.forEach(x=>x.disabled=!!custom&&x.type==='checkbox');
            const selected=packages.filter(x=>x.checked);
            const extrasEnabled=!custom&&selected.length>0;
            extras.forEach(x=>{x.disabled=!extrasEnabled;if(!extrasEnabled)x.checked=false;});
            const extraGroup=scope.querySelector('[data-scope-extras]');
            if(extraGroup)extraGroup.hidden=!extrasEnabled;
            const rows=[...selected,...extras.filter(x=>x.checked)];
            const known=!custom&&selected.length&&rows.every(x=>/^\d+$/.test(x.dataset.min||'')&&/^\d+$/.test(x.dataset.max||''));
            const min=known?rows.reduce((sum,x)=>sum+Number(x.dataset.min),0):0;
            const max=known?rows.reduce((sum,x)=>sum+Number(x.dataset.max),0):0;
            const mode=scope.dataset.pricingMode;
            scope.querySelector('[data-scope-estimate]').textContent=known?(mode==='starting'?format.format(min)+' TL itibarıyla':money(min,max)+(mode==='monthly'?' / ay':'')):(hasChoice(scope)?'Teklif hazırlanacak':'—');
          }
          // Keep the active service estimate on one row, even on the final
          // scope. The contact summary retains each selected service's amount;
          // do not combine starting prices, ranges and monthly subscriptions.
          if(total)total.textContent=currentScope()?.querySelector('[data-scope-estimate]')?.textContent||'—';
        };
        // No free-jumping tabs: every selected service gets an explicit choice before the calendar.
        const focusStep=(index)=>{
          const h=steps[index].querySelector('h1,h2');
          if(h){h.tabIndex=-1;h.focus({preventScroll:true});}
          const panel=widget.querySelector('.cdl-project__panel');
          const header=document.querySelector('.sf-shell .sf-header');
          const clearance=header&&header.getBoundingClientRect().bottom>0?header.getBoundingClientRect().bottom+12:12;
          // Reset only if the progress/heading is above the visible header, not on every input change.
          if(panel&&panel.getBoundingClientRect().top<clearance-1){
            panel.scrollIntoView({block:'start',behavior:'instant'});
          }
        };
        form.addEventListener('change',event=>{
          const target=event.target;
          const scope=target.closest('[data-project-scope]');
          if(scope&&target.matches('[data-scope-custom]')&&target.checked){
            scope.querySelectorAll('input[data-scope-package]:checked,input[data-scope-extra]:checked').forEach(x=>x.checked=false);
          }
          if(scope&&hasChoice(scope))setError(false);
          updateScopes();
        });
        const show=(index,focus=true)=>{
          active=index;
          updateScopes();
          setError(false);
          steps.forEach((step,n)=>{step.hidden=n!==index;});
          if(index===3){
            summary.replaceChildren(...[...services.filter(x=>x.checked).map(x=>x.value==='Optimizasyon / Destek'?'Bakım & Geliştirme':x.value),form.querySelector('input[name="agency_project_month"]:checked')?.dataset.monthLabel,...scopeLabels()].filter(Boolean).map(value=>{
              const tag=document.createElement('span');tag.textContent=value;return tag;
            }));
          }
          if(focus)focusStep(index);
        };
        const switchScope=scope=>{
          activeScope=scope.dataset.projectScope;
          setError(false);
          updateScopes();
          focusStep(1);
        };
        const nextStep=()=>{
          if(active===0){
            activeScope=selectedScopes()[0]?.dataset.projectScope||'';
            show(1);
          }else if(active===1){
            const chosen=selectedScopes(),current=currentScope();
            if(!hasChoice(current)){
              setError(true);
              current?.querySelector('[data-scope-package],[data-scope-custom]')?.focus();
              return;
            }
            const next=chosen[chosen.indexOf(current)+1];
            if(next){switchScope(next);return;}
            const missing=chosen.find(x=>!hasChoice(x));
            if(missing){switchScope(missing);setError(true);return;}
            show(2);
          }else if(active<steps.length-1){show(active+1);}
        };
        const backStep=()=>{
          if(active===1){
            const chosen=selectedScopes(),i=chosen.indexOf(currentScope());
            if(i>0){switchScope(chosen[i-1]);return;}
            show(0);
          }else if(active===2){
            activeScope=selectedScopes().slice(-1)[0]?.dataset.projectScope||'';
            show(1);
          }else if(active>0){show(active-1);}
        };
        services.forEach(input=>input.addEventListener('change',()=>{if(!services.some(x=>x.checked))input.checked=true;}));
        widget.querySelectorAll('[data-project-next]').forEach(next=>next.addEventListener('click',nextStep));
        widget.querySelectorAll('[data-project-back]').forEach(back=>back.addEventListener('click',backStep));
        const contact=form.querySelector('[name="agency_project_contact"]');
        const validateContact=()=>{
          if(!contact)return true;
          const value=contact.value.trim(),digits=value.replace(/\D/g,'');
          const valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)||(/^\+?[0-9 ()-]{10,30}$/.test(value)&&digits.length>=10&&digits.length<=15);
          contact.setCustomValidity(!value||valid?'':'Geçerli bir e-posta adresi veya telefon numarası gir.');
          return valid;
        };
        contact?.addEventListener('input',validateContact);
        form.addEventListener('submit',event=>{
          if(active!==steps.length-1){event.preventDefault();nextStep();return;}
          if(!services.some(x=>x.checked)){event.preventDefault();show(0);return;}
          const missing=selectedScopes().find(x=>!hasChoice(x));
          if(missing){event.preventDefault();activeScope=missing.dataset.projectScope;show(1);setError(true);return;}
          validateContact();
          if(!form.checkValidity()){event.preventDefault();form.reportValidity();return;}
          const submit=form.querySelector('[data-project-submit]');
          if(submit){submit.disabled=true;submit.setAttribute('aria-busy','true');submit.firstChild.textContent='Gönderiliyor ';}
        });
        show(form.hasAttribute('data-project-start-scope')?1:0,false);
      }
    }

    if(widget.dataset.agencyWidget==='404'&&!reduced.matches){
      const stage=widget.querySelector('[data-404-stage]');
      let frame=0,x=0,y=0;
      stage?.addEventListener('pointermove',event=>{
        const rect=stage.getBoundingClientRect();x=event.clientX-rect.left;y=event.clientY-rect.top;
        if(!frame)frame=requestAnimationFrame(()=>{frame=0;stage.style.setProperty('--lx',x+'px');stage.style.setProperty('--ly',y+'px');});
      },{passive:true});
    }
    if(widget.dataset.agencyWidget==='detail'){
      const rows=[...widget.querySelectorAll('.cdl-service-detail__faq details')];
      rows.forEach(row=>row.addEventListener('toggle',()=>{if(row.open)rows.forEach(other=>{if(other!==row)other.open=false;});}));
    }
    if (widget.dataset.agencyWidget === 'cards') {
      const cards = Array.from(widget.querySelectorAll('[data-agency-card]'));
      const tabs = Array.from(widget.querySelectorAll('[data-agency-swap-to]'));
      let active = 0;
      const select = index => {
        if (!cards.length) return;
        active = ((index % cards.length) + cards.length) % cards.length;
        cards.forEach((card, i) => {
          const position = (i - active + cards.length) % cards.length;
          card.dataset.pos = String(position);
          card.setAttribute('aria-hidden', String(position !== 0));
          card.tabIndex = position === 0 ? 0 : -1;
        });
        tabs.forEach((tab, i) => tab.setAttribute('aria-pressed', String(i === active)));
      };
      tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)));
      cards.forEach(card => {
        card.addEventListener('click', () => select(active + 1));
        card.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          select(active + 1);
          cards[active]?.focus({ preventScroll: true });
        });
      });
      select(0);
    }


    if (widget.dataset.agencyWidget === 'contact-bento') {
      const copyButton = widget.querySelector('[data-agency-copy-email]');
      if (copyButton) {
        copyButton.addEventListener('click', async () => {
          const email = copyButton.dataset.email || '';
          const hint = copyButton.querySelector('[data-agency-copy-hint]');
          if (!email || !hint) return;
          try {
            if (!navigator.clipboard?.writeText) throw new Error('unavailable');
            await navigator.clipboard.writeText(email);
            hint.textContent = 'Kopyalandı ✓';
          } catch (_) {
            // Do not claim it was copied when the browser denies clipboard access.
            hint.textContent = 'E-posta uygulamasını açın';
            window.location.href = 'mailto:' + encodeURIComponent(email);
          }
        });
      }
      const disclosure = widget.querySelector('details[data-contact-disclosure]');
      const summary = disclosure?.querySelector('summary');
      const panel = disclosure?.querySelector('.cdl-contact-form-section');
      if (disclosure && summary && panel && typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal === 'function') {
        const dialog = document.createElement('dialog');
        dialog.className = 'cdl-contact__sheet';
        dialog.setAttribute('aria-labelledby',panel.getAttribute('aria-labelledby'));
        const initiallyOpen = disclosure.open;
        disclosure.open = false;
        dialog.appendChild(panel);
        widget.appendChild(dialog);
        summary.setAttribute('aria-haspopup','dialog');
        summary.setAttribute('aria-expanded','false');
        const open = () => {
          if (dialog.open) return;
          dialog.showModal();
          summary.setAttribute('aria-expanded','true');
          dialog.querySelector('[data-contact-close]')?.focus({preventScroll:true});
        };
        summary.addEventListener('click', event => {event.preventDefault();open();});
        dialog.querySelector('[data-contact-close]')?.addEventListener('click',()=>dialog.close());
        dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
        dialog.addEventListener('close',()=>{summary.setAttribute('aria-expanded','false');summary.focus({preventScroll:true});});
        widget.querySelectorAll('a[href^="#"]').forEach(link=>{if(link.getAttribute('href')==='#'+disclosure.id)link.addEventListener('click',event=>{event.preventDefault();open();});});
        const anchor = () => {if(window.location.hash==='#'+disclosure.id)open();};
        window.addEventListener('hashchange',anchor);
        if(initiallyOpen)open();else anchor();
      } else if (disclosure) {
        const anchor=()=>{if(window.location.hash==='#'+disclosure.id)disclosure.open=true;};
        window.addEventListener('hashchange',anchor);anchor();
        panel?.querySelector('[data-contact-close]')?.addEventListener('click',()=>{disclosure.open=false;});
      }
      // Map enhancement is loaded only on this contact widget. The native
      // OpenStreetMap iframe and external link remain usable if it fails.
      const frame=widget.querySelector('[data-contact-map]');
      const host=frame?.querySelector('[data-contact-map-live]');
      if(frame && host && !navigator.connection?.saveData){
        const loadLeaflet=()=>{
          if(window.L?.map)return Promise.resolve(window.L);
          if(window.codelaContactLeaflet)return window.codelaContactLeaflet;
          window.codelaContactLeaflet=new Promise((resolve,reject)=>{
            const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            css.crossOrigin='anonymous';css.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';document.head.appendChild(css);
            const js=document.createElement('script');js.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            js.crossOrigin='anonymous';js.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';js.onload=()=>window.L?.map?resolve(window.L):reject(new Error('Map unavailable'));js.onerror=reject;document.head.appendChild(js);
          });
          return window.codelaContactLeaflet;
        };
        const startMap=()=>loadLeaflet().then(L=>{
          const center=[Number(frame.dataset.mapLat),Number(frame.dataset.mapLon)];
          const office=frame.dataset.mapOffice==='true';
          const zoom=office?14:11;
          const map=L.map(host,{center,zoom,zoomControl:false,scrollWheelZoom:false,doubleClickZoom:false,attributionControl:true,dragging:window.matchMedia('(pointer:fine)').matches,touchZoom:false});
          const tiles=L.tileLayer('https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',{minZoom:5,maxZoom:15,attribution:'Tiles © Esri — Esri, HERE, Garmin, OpenStreetMap contributors'});
          tiles.once('tileload',()=>{frame.dataset.mapReady='true';});
          tiles.addTo(map);
          const icon=L.divIcon({className:'cdl-contact__beacon',html:'<i></i><b></b>',iconSize:[24,24],iconAnchor:[12,12]});
          L.marker(office?center:[41.0082,28.9784],{icon,interactive:false}).addTo(map);
          frame.querySelector('[data-contact-map-center]')?.addEventListener('click',event=>{
            if(frame.dataset.mapReady!=='true')return;
            event.preventDefault();map.setView(center,zoom,{animate:!reduced.matches});
          });
          if('ResizeObserver' in window)new ResizeObserver(()=>map.invalidateSize({pan:false})).observe(host);
        }).catch(()=>{});
        if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();startMap();}},{rootMargin:'200px'});observer.observe(frame);}
        else startMap();
      }
    }

    if (widget.dataset.agencyWidget === 'bento') {
      // The standalone Services page is not an animated homepage stage.
      // Never hide content that the browser may already have painted.
      if (document.body.classList.contains('home') && !reduced.matches && 'IntersectionObserver' in window) {
        widget.dataset.bentoReady = '1';
        const observer = new IntersectionObserver(entries => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            widget.dataset.bentoVisible = '1';
            observer.disconnect();
          }
        }, { threshold: 0.12 });
        observer.observe(widget);
      }
    }

    if (widget.dataset.agencyWidget === 'services') {
      const track = widget.querySelector('[data-agency-widget-track]');
      const prev = widget.querySelector('[data-agency-widget-prev]');
      const next = widget.querySelector('[data-agency-widget-next]');
      const cards = track ? Array.from(track.querySelectorAll('.sf-agency-poster')) : [];
      const counter = widget.querySelector('[data-agency-widget-count]');
      let frame = 0;

      const sync = () => {
        frame = 0;
        if (!track || !cards.length) return;
        // Desktop/tablet are static grids: no carousel, no changing headline.
        if (window.matchMedia('(min-width: 740px)').matches) {
          widget.style.removeProperty('--sf-service-accent');
          widget.dataset.agencyActiveService = '0';
          if (prev) prev.disabled = true;
          if (next) next.disabled = true;
          if (counter) counter.textContent = '01 / ' + String(cards.length).padStart(2, '0');
          return;
        }
        const step = cards.length > 1
          ? cards[1].offsetLeft - cards[0].offsetLeft
          : cards[0].getBoundingClientRect().width;
        const index = Math.max(0, Math.min(cards.length - 1,
          step ? Math.round(track.scrollLeft / step) : 0));
        widget.style.setProperty('--sf-service-accent',
          cards[index].dataset.agencyServiceAccent || '#4452d1');
        widget.dataset.agencyActiveService = String(index);
        if (prev) prev.disabled = index === 0;
        if (next) next.disabled = index === cards.length - 1;
        if (counter) counter.textContent =
          String(index + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
      };
      const scheduleSync = () => {
        if (!frame) frame = window.requestAnimationFrame(sync);
      };
      if (track && prev && next) {
        const slide = dir => {
          const index = Number(widget.dataset.agencyActiveService || 0);
          const target = cards[Math.max(0, Math.min(cards.length - 1, index + dir))];
          if (!target) return;
          track.scrollTo({
            left: target.offsetLeft - cards[0].offsetLeft,
            behavior: reduced.matches ? 'auto' : 'smooth'
          });
        };
        prev.addEventListener('click', () => slide(-1));
        next.addEventListener('click', () => slide(1));
        track.addEventListener('scroll', scheduleSync, { passive: true });
        window.addEventListener('resize', scheduleSync, { passive: true });
        sync();
      }
    }

    if (widget.dataset.agencyWidget === 'process') {
      const steps = [...widget.querySelectorAll('[data-agency-widget-step]')];
      const stage = widget.querySelector('[data-agency-widget-stage]');
      const counter = widget.querySelector('[data-agency-widget-counter]');
      const image = widget.querySelector('[data-agency-widget-stage-image]');
      const outcome = widget.querySelector('[data-agency-widget-stage-kicker]');
      const title = widget.querySelector('[data-agency-widget-stage-title]');
      const body = widget.querySelector('[data-agency-widget-stage-body]');
      const previous = widget.querySelector('[data-agency-widget-prev]');
      const next = widget.querySelector('[data-agency-widget-next]');
      const nextLabel = widget.querySelector('[data-agency-widget-next-label]');
      if (steps.length && stage && counter && image && outcome && title && body && previous && next && nextLabel) {
        let active = 0;
        let shown = 0;
        const visual = image.parentElement;
        image.dataset.processImageLayer = '0';
        image.dataset.processImageActive = 'true';
        const layers = new Map([[0, { node: image, ready: Promise.resolve(true) }]]);
        const prepare = (index, priority = 'low') => {
          if (layers.has(index)) return layers.get(index);
          const src = steps[index]?.dataset.agencyStageImage;
          if (!src) return null;
          const node = document.createElement('img');
          node.alt = '';
          node.width = Number(image.getAttribute('width')) || 1376;
          node.height = Number(image.getAttribute('height')) || 768;
          node.decoding = 'async';
          node.fetchPriority = priority;
          node.dataset.processImageLayer = String(index);
          node.dataset.processImageActive = 'false';
          const ready = new Promise(resolve => {
            node.addEventListener('load', async () => {
              try { await node.decode(); } catch (_) {}
              resolve(node.naturalWidth > 0);
            }, { once: true });
            node.addEventListener('error', () => resolve(false), { once: true });
          });
          const layer = { node, ready };
          layers.set(index, layer);
          visual.appendChild(node);
          node.src = src;
          ready.then(ok => { if (ok) node.dataset.processImageReady = 'true'; });
          return layer;
        };
        const warm = () => {
          image.loading = 'eager';
          steps.forEach((_, index) => { if (index) prepare(index); });
        };
        // No page-wide warmup: approach or explicit intent owns these downloads.
        // Old browsers without IntersectionObserver retain the load fallback.
        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            warm();
            observer.disconnect();
          }, { rootMargin: '450px 0px' });
          observer.observe(widget);
        } else {
          window.addEventListener('load', warm, { once: true });
          if (document.readyState === 'complete') warm();
        }
        widget.addEventListener('pointerenter', warm, { once: true });
        widget.addEventListener('focusin', warm, { once: true });
        const showImage = index => {
          const layer = prepare(index, 'high');
          if (!layer || shown === index) return;
          layer.node.fetchPriority = 'high';
          const commit = () => {
            if (active !== index) return;
            layers.get(shown).node.dataset.processImageActive = 'false';
            layer.node.dataset.processImageActive = 'true';
            shown = index;
          };
          if (layer.node.dataset.processImageReady === 'true' || index === 0) commit();
          else layer.ready.then(ok => { if (ok) commit(); });
        };
        const activate = (index, animate = true) => {
          const step = steps[index];
          if (!step) return;
          active = index;
          stage.dataset.step = String(index);
          counter.textContent = (index + 1) + ' / ' + steps.length;
          showImage(index);
          outcome.textContent = step.dataset.agencyStageOutcome || '';
          title.textContent = step.dataset.agencyStageTitle || '';
          body.textContent = step.dataset.agencyStageBody || '';
          nextLabel.textContent = step.dataset.agencyStageNextLabel || 'Süreci Başlat';
          previous.disabled = index === 0;
          steps.forEach((button, i) => {
            button.setAttribute('aria-pressed', String(i === index));
            button.dataset.complete = String(i <= index);
          });
          if (animate && !reduced.matches && typeof stage.animate === 'function') {
            stage.getAnimations?.().forEach(animation => animation.cancel());
            stage.animate(
              [{ opacity: .9 }, { opacity: 1 }],
              { duration: 150, easing: 'ease-out' }
            );
          }
        };
        steps.forEach((button, i) => button.addEventListener('click', () => activate(i)));
        previous.addEventListener('click', () => { if (active > 0) activate(active - 1); });
        next.addEventListener('click', event => {
          if (active < steps.length - 1) {
            event.preventDefault();
            activate(active + 1);
          }
          // At the final step this is a normal WordPress project-page link.
        });
        activate(0, false);
      }
    }
  });

})();
