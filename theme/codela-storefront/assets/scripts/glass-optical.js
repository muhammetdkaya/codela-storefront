/**
 * Glass V2: static Canvas 2D optical capsule rendering, adapted from
 * the approved preview. Samples a local procedural scene, not webpage DOM.
 * Controls remain native; no animation loop or external dependencies.
 */
(() => {
 'use strict';
 if (!document.body?.classList.contains('sf-glass-v2') || !document.querySelector('.sf-agency-widget')) return;
 if (matchMedia('(prefers-reduced-transparency: reduce)').matches || matchMedia('(forced-colors: active)').matches) return;
 const header=document.querySelector('.sf-shell .sf-header');
 if (!header || header.querySelector('.sf-glass-optical-canvas')) return;
 const canvas=document.createElement('canvas');
 canvas.className='sf-glass-optical-canvas';canvas.setAttribute('aria-hidden','true');
 const ctx=canvas.getContext('2d',{alpha:true,willReadFrequently:true});
 const source=document.createElement('canvas');
 const sourceCtx=source.getContext('2d',{willReadFrequently:true});
 if(!ctx || !sourceCtx)return;
 header.prepend(canvas);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const selectors=['.sf-brand.sf-ui-surface','.sf-actions.sf-ui-surface',
 '.sf-desktop-navigation.sf-ui-surface','.sf-header-menu .sf-ui-icon-button--soft'];
 function capsule(x,y,w,h){
  const r=Math.min(h/2,w/2);
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);
  ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);
  ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);
  ctx.arcTo(x,y,x+r,y,r);ctx.closePath();
 }
 let pending=false;
 function render(){
  try{
   if(!header.isConnected)return;
   const bounds=header.getBoundingClientRect(),w=Math.round(bounds.width),h=Math.round(bounds.height);
   if(w<100||h<30)return;
   const dpr=Math.min(window.devicePixelRatio||1,1.5);
   const W=Math.ceil(w*dpr),H=Math.ceil(h*dpr);
   if(canvas.width!==W || canvas.height!==H){
    canvas.width=W;canvas.height=H;source.width=W;source.height=H;
   }
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
   sourceCtx.setTransform(dpr,0,0,dpr,0,0);
   const bg=sourceCtx.createLinearGradient(0,0,w,h);
   bg.addColorStop(0,'#0d0d16');bg.addColorStop(.53,'#151421');bg.addColorStop(1,'#0b0b13');
   sourceCtx.fillStyle=bg;sourceCtx.fillRect(0,0,w,h);
   const halo=sourceCtx.createRadialGradient(w*.55,0,2,w*.55,0,w*.45);
   halo.addColorStop(0,'rgba(176,157,209,.23)');halo.addColorStop(1,'rgba(0,0,0,0)');
   sourceCtx.fillStyle=halo;sourceCtx.fillRect(0,0,w,h);
   sourceCtx.strokeStyle='rgba(216,215,240,.13)';sourceCtx.lineWidth=.8;
   for(let bx=-24;bx<w+30;bx+=38){
    sourceCtx.beginPath();sourceCtx.moveTo(bx,0);
    sourceCtx.bezierCurveTo(bx+2,h*.3,bx-2,h*.7,bx+3,h);sourceCtx.stroke();
   }
   const src=sourceCtx.getImageData(0,0,W,H).data;
   const sample=(px,py,ch)=>{
    const sx=clamp(Math.floor(px),0,W-1),sy=clamp(Math.floor(py),0,H-1);
    return src[(sy*W+sx)*4+ch];
   };
   let count=0;
   for(const selector of selectors){
    const el=header.querySelector(selector);
    if(!el||getComputedStyle(el).display==='none')continue;
    const b=el.getBoundingClientRect();
    if(b.width<25||b.height<25||b.right<=bounds.left||b.left>=bounds.right)continue;
    const x=b.left-bounds.left,y=b.top-bounds.top,bw=b.width,bh=b.height,r=bh/2,cy=y+r;
    const left=clamp(Math.floor(x*dpr),0,W),top=clamp(Math.floor(y*dpr),0,H);
    const right=clamp(Math.ceil((x+bw)*dpr),0,W),bottom=clamp(Math.ceil((y+bh)*dpr),0,H);
    if(right<=left||bottom<=top)continue;
    const pw=right-left,ph=bottom-top,img=ctx.createImageData(pw,ph),pixels=img.data;
    for(let iy=0;iy<ph;iy++)for(let ix=0;ix<pw;ix++){
     const px=(left+ix+.5)/dpr,py=(top+iy+.5)/dpr;
     const axis=clamp(px,x+r,x+bw-r),dx=px-axis,dy=py-cy;
     const len=Math.hypot(dx,dy),sd=len-r;
     if(sd>.45)continue;
     const cover=clamp(.55-sd,0,1),nx=len>.00001?dx/len:0,ny=len>.00001?dy/len:-1;
     const edge=Math.pow(1-clamp(-sd/18,0,1),1.4),shift=15*edge,mag=.035;
     const sx=(px+nx*shift+(px-(x+bw/2))*mag)*dpr;
     const sy=(py+ny*shift+(py-cy)*mag)*dpr;
     const dispersion=2.5*edge*dpr;
     const fresnel=Math.exp(-Math.pow((sd+1)/2.4,2));
     const rim=fresnel*(Math.max(0,-ny)*.79+Math.max(0,-nx)*.32+Math.max(0,ny)*.08);
     const shade=Math.exp(-Math.pow((sd+5.5)/3.4,2))*(1-Math.max(0,-ny)*.7)*7;
     const p=(iy*pw+ix)*4;
     for(let ch=0;ch<3;ch++){
      const aberration=ch===0?dispersion:ch===2?-dispersion:0;
      const value=sample(sx+nx*aberration,sy+ny*aberration,ch)*.96+19+(ch===2?4:0)+rim*170-shade;
      pixels[p+ch]=clamp(value,0,255);
     }
     pixels[p+3]=Math.round(cover*240);
    }
    ctx.putImageData(img,left,top);
    ctx.save();ctx.globalCompositeOperation='screen';capsule(x+.5,y+.5,bw-1,bh-1);
    const rim=ctx.createLinearGradient(x,y,x+bw,y+bh);
    rim.addColorStop(0,'rgba(255,252,255,.74)');rim.addColorStop(.30,'rgba(250,247,255,.30)');
    rim.addColorStop(.70,'rgba(179,186,212,.12)');rim.addColorStop(1,'rgba(255,255,255,.43)');
    ctx.strokeStyle=rim;ctx.lineWidth=1.1;ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+Math.min(20,bw*.17),y+1.1);ctx.lineTo(x+bw*.62,y+1.1);
    const ray=ctx.createLinearGradient(x,y,x+bw*.65,y);
    ray.addColorStop(0,'rgba(255,255,255,0)');
    ray.addColorStop(.54,'rgba(255,255,255,.63)');
    ray.addColorStop(1,'rgba(255,255,255,0)');
    ctx.strokeStyle=ray;ctx.lineWidth=1.05;ctx.stroke();ctx.restore();
    count++;
   }
   document.body.classList.toggle('sf-glass-optic-ready',count>0);
  }catch(error){
   document.body.classList.remove('sf-glass-optic-ready');
  }
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render()})}
 if(typeof ResizeObserver==='function')new ResizeObserver(schedule).observe(header);
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('pageshow',schedule,{passive:true});
 schedule();
})();
