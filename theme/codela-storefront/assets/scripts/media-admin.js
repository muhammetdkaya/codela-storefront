// Media Library only: one JPEG attachment per request; cancellable and resumable.
(()=>{
  const start=document.getElementById('sf-optimize-run');
  const stop=document.getElementById('sf-optimize-stop');
  const status=document.getElementById('sf-optimize-progress');
  const config=window.codelaSfMedia;
  if(!start||!stop||!status||!config)return;
  const msg=config.messages||{};
  let running=false;
  let offset=0,changed=0,saved=0,errors=0;
  const present=message=>{status.textContent=message;};
  // Stop after the in-flight request; aborting only the browser could leave
  // the server encoding the same attachment during an immediate restart.
  stop.addEventListener('click',()=>{running=false;stop.disabled=true;present((msg.paused||'Paused')+': '+offset+'.');});
  start.addEventListener('click',async()=>{
    if(running)return;
    running=true;start.disabled=true;stop.disabled=false;
    offset=0;changed=0;saved=0;errors=0;
    while(running){
      try{
        const body=new URLSearchParams({action:'codela_sf_optimize_media',nonce:config.nonce,offset:String(offset)});
        const response=await fetch(config.url,{method:'POST',body,credentials:'same-origin'});
        const json=await response.json();
        if(!response.ok||!json.success)throw Error(json.data?.message||'Request failed');
        if(json.data.done){present((msg.complete||'Complete')+': '+(msg.scanned||'Scanned')+' '+offset+' · '+(msg.optimized||'Optimized')+' '+changed+' · '+(msg.saved||'Saved')+' ~'+Math.round(saved/1024)+' KB.');break;}
        offset=json.data.offset;
        const result=json.data.result;
        changed+=result?.converted||0;
        saved+=result?.saved||0;
        if(result?.status==='error')errors++;
        present((msg.scanned||'Scanned')+' '+offset+' · '+(msg.optimized||'Optimized')+' '+changed+' · '+(msg.saved||'Saved')+' ~'+Math.round(saved/1024)+' KB'+(errors?' · '+(msg.errors||'Errors')+' '+errors:''));
      }catch(error){
        if(!running)break;
        present((msg.failed||'Stopped at image')+' '+offset+': '+String(error.message||error));
        break;
      }
    }
    running=false;start.disabled=false;stop.disabled=true;
  });
})();