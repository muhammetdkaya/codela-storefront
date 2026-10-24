// WordPress owns uploads, attachment hydration and gallery ordering.
// Delegate because the block editor can insert legacy meta boxes after this file.
(()=>{
  const render=(field,attachments)=>{
    const input=field.querySelector('input'),preview=field.querySelector('[data-sf-mobile-preview]');
    const images=attachments.filter(item=>item.type==='image'&&Number.isInteger(item.id)&&item.id>0);
    input.value=images.map(item=>item.id).join(',');
    input.dispatchEvent(new Event('change',{bubbles:true}));
    preview.replaceChildren();
    images.forEach(item=>{
      const img=document.createElement('img');
      img.src=item.sizes?.thumbnail?.url||item.url;img.alt=item.alt||'';
      img.style.cssText='width:60px;height:75px;object-fit:cover;margin:2px';preview.append(img);
    });
  };
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-sf-mobile-select],[data-sf-mobile-clear]');
    const field=button?.closest('[data-sf-mobile-field]');
    if(!field)return;
    event.preventDefault();
    if(button.hasAttribute('data-sf-mobile-clear')){render(field,[]);return;}
    if(!window.wp?.media)return;
    const input=field.querySelector('input');
    const ids=input.value.split(',').filter(id=>/^[1-9][0-9]*$/.test(id));
    if(field.dataset.sfMobileField==='gallery'){
      // The native editor fetches saved attachments before sorting. Bare ID-only
      // models are not enough: GalleryEdit validates their image type.
      const frame=ids.length
        ? wp.media.gallery.edit('[gallery ids="'+ids.join(',')+'"]')
        : wp.media({title:field.querySelector('strong').textContent,frame:'post',state:'gallery',library:{type:'image'},multiple:true});
      // GalleryEdit's selection is just the focused tile, not the gallery.
      // The update event supplies the complete ordered library.
      frame.on('update',library=>render(field,library.toJSON()));
      frame.open();
      return;
    }
    const frame=wp.media({title:field.querySelector('strong').textContent,library:{type:'image'},multiple:false});
    frame.on('open',()=>{
      const selection=frame.state().get('selection');
      ids.forEach(id=>{const attachment=wp.media.attachment(Number(id));attachment.fetch();selection.add(attachment);});
    });
    frame.on('select',()=>render(field,frame.state().get('selection').toJSON().slice(0,1)));
    frame.open();
  });
})();
