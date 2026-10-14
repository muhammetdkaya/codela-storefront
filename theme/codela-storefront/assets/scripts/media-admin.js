// Media Library only: one JPEG attachment per request; cancellable and resumable.
(()=>{
  const start=document.getElementById('sf-optimize-run');
  const stop=document.getElementById('sf-optimize-stop');
  const status=document.getElementById('sf-optimize-progress');
  const config=window.codelaSfMedia;
  if(!start||!stop||!status||!config)return;
  let running=false;
  let offset=0,changed=0,saved=0,errors=0;
  let controller=null;
  const present=message=>{status.textContent=message;};
  stop.addEventListener('click',()=>{running=false;controller?.abort();start.disabled=false;stop.disabled=true;present('Paused after '+offset+' JPEG images. You can start again safely.');});
  start.addEventListener('click',async()=>{
    if(running)return;
    running=true;start.disabled=true;stop.disabled=false;
    offset=0;changed=0;saved=0;errors=0;
    while(running){
      controller=new AbortController();
      try{
        const body=new URLSearchParams({action:'codela_sf_optimize_media',nonce:config.nonce,offset:String(offset)});
        const response=await fetch(config.url,{method:'POST',body,credentials:'same-origin',signal:controller.signal});
        const json=await response.json();
        if(!response.ok||!json.success)throw Error(json.data?.message||'Request failed');
        if(json.data.done){present('Complete: scanned '+offset+' images, optimized '+changed+' sizes; saved approximately '+Math.round(saved/1024)+' KB across generated derivatives.');break;}
        offset=json.data.offset;
        const result=json.data.result;
        changed+=result?.converted||0;
        saved+=result?.saved||0;
        if(result?.status==='error')errors++;
        present('Scanned '+offset+' images · optimized '+changed+' sizes · saved ~'+Math.round(saved/1024)+' KB'+(errors?' · '+errors+' errors':''));
      }catch(error){
        if(!running)break;
        present('Stopped at image '+offset+': '+String(error.message||error)+'. Restart is safe; processed items are skipped.');
        break;
      }
    }
    running=false;controller=null;start.disabled=false;stop.disabled=true;
  });
})();