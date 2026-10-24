// Native media library owns upload, selection and gallery ordering.
(()=>{
  document.querySelectorAll('[data-sf-mobile-field]').forEach(field=>{
    const input=field.querySelector('input'),preview=field.querySelector('[data-sf-mobile-preview]');
    const render=attachments=>{
      input.value=attachments.map(item=>item.id).join(',');preview.replaceChildren();
      attachments.forEach(item=>{const img=document.createElement('img');img.src=item.sizes?.thumbnail?.url||item.url;img.alt=item.alt||'';img.style.cssText='width:60px;height:75px;object-fit:cover;margin:2px';preview.append(img);});
    };
    field.querySelector('[data-sf-mobile-clear]').addEventListener('click',()=>render([]));
    field.querySelector('[data-sf-mobile-select]').addEventListener('click',()=>{
      const multiple=field.dataset.sfMobileField==='gallery';
      const selection=new wp.media.model.Selection(input.value.split(',').filter(Boolean).map(id=>wp.media.attachment(Number(id))),{multiple});
      const frame=wp.media({title:field.querySelector('strong').textContent,frame:multiple?'post':'select',state:multiple?'gallery-edit':'library',library:{type:'image'},selection,multiple});
      const save=()=>render(frame.state().get('selection')?.toJSON()||frame.state().get('library').toJSON());
      frame.on(multiple?'update':'select',save);frame.open();
    });
  });
})();
