/* Agency homepage hybrid scroll: one physical wheel/touch gesture = one stage.
   Wheel momentum belongs to its originating session until input goes quiet AND
   the navigation scroll has settled. Taller content keeps native scrolling. */
(() => {
  'use strict';
  if (!document.body.classList.contains('home')) return;
  const root=document.querySelector('.sf-content .codela-page-layout');
  if(!root)return;
  const stages=Array.from(root.children).filter(el=>
    el.matches('.sf-agency-widget--studio,.sf-agency-widget--bento,.sf-agency-widget--process'));
  if(stages.length<2)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const ignore='input,select,textarea,[contenteditable="true"],[role="dialog"]';
  const excluded=target=>target instanceof Element && !!target.closest(ignore);
  // Vertical gestures over horizontal tracks should still scroll the document.
  const viewport=()=>window.innerHeight||document.documentElement.clientHeight;
  const top=element=>element.getBoundingClientRect().top+window.scrollY;
  const activeIndex=()=>{
    const point=window.scrollY+Math.min(24,viewport()*.04);
    let index=0;
    stages.forEach((element,i)=>{if(top(element)<=point)index=i;});
    return index;
  };
  // A consumed gesture is held only while navigation or the same momentum
  // burst continues. Small first samples of a new swipe count after a pause.
  const QUIET_MS=95;
  const freshWheel=(lastAt=-Infinity)=>({lastAt,used:false,delta:0,direction:0,lastMagnitude:0,lowTail:false});
  let wheel=freshWheel();
  let navigationPending=false;
  let touch=null;
  const targetFor=direction=>{
    const index=activeIndex();
    const current=stages[index];
    const height=current.getBoundingClientRect().height;
    const local=window.scrollY-top(current);
    if(height>viewport()+28){
      if(direction>0&&local+viewport()<height-24)return null;
      if(direction<0&&local>24)return null;
    }
    if(direction<0&&local>24)return current;
    const next=index+direction;
    return next>=0&&next<stages.length?stages[next]:null;
  };
  // Let the browser animate the actual document once. Per-frame instant
  // scrollTo calls fight Safari's compositor and create visible judder.
  let scrollTarget=0,settleTimer=0,watchdog=0;
  const release=()=>{
    clearTimeout(settleTimer);clearTimeout(watchdog);
    navigationPending=false;
    document.documentElement.classList.remove('sf-agency-stage-moving');
  };
  window.addEventListener('scrollend',()=>{
    if(navigationPending&&Math.abs(window.scrollY-scrollTarget)<=3)release();
  },{passive:true});
  window.addEventListener('scroll',()=>{
    if(!navigationPending)return;
    clearTimeout(settleTimer);
    settleTimer=setTimeout(release,120);
  },{passive:true});
  const move=direction=>{
    const target=targetFor(direction);
    if(!target)return false;
    scrollTarget=Math.max(0,Math.min(Math.round(top(target)),document.documentElement.scrollHeight-viewport()));
    if(reduced.matches||Math.abs(window.scrollY-scrollTarget)<=2){
      window.scrollTo({top:scrollTarget,behavior:'instant'});return true;
    }
    navigationPending=true;
    document.documentElement.classList.add('sf-agency-stage-moving');
    window.scrollTo({top:scrollTarget,behavior:'smooth'});
    watchdog=setTimeout(release,1600);
    return true;
  };
  document.documentElement.classList.add('sf-agency-stage-nav');
  window.addEventListener('wheel',event=>{
    if(event.ctrlKey||excluded(event.target)||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
    const direction=Math.sign(event.deltaY);
    if(!direction)return;
    // Only actual vertical input belongs to the gesture. Horizontal carousel
    // events and unrelated controls cannot extend the wheel session.
    const now=performance.now(),gap=now-wheel.lastAt;
    const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?viewport():1);
    const magnitude=Math.abs(pixels);
    // A precision touchpad starts a new swipe with very small samples. Do not
    // require its FIRST sample to meet the stage threshold, or every following
    // sample extends the old lock and the page remains stuck.
    // A decayed momentum tail followed by a renewed acceleration also marks
    // new intent even when the OS does not provide a quiet interval.
    const settled=!navigationPending;
    const lowTail=wheel.used&&(wheel.lowTail||wheel.lastMagnitude<=6);
    const renewed=lowTail&&magnitude>=12&&magnitude>=wheel.lastMagnitude*2.5;
    if(settled&&(gap>=QUIET_MS||(wheel.used&&wheel.direction!==direction)||renewed)){
      wheel=freshWheel(now);
    }
    wheel.lastAt=now;
    if(wheel.used&&magnitude<=6)wheel.lowTail=true;
    wheel.lastMagnitude=magnitude;
    if(!event.cancelable)return;
    if(wheel.used||navigationPending){
      // Prevent a long momentum tail from natively scrolling past our target.
      event.preventDefault();
      return;
    }
    const target=targetFor(direction);
    if(!target){
      // Tall sections are deliberately free-scroll; don't accumulate the
      // tiny momentum samples as a future stage transition.
      wheel.delta=0;wheel.direction=0;
      return;
    }
    event.preventDefault();
    if(wheel.direction!==direction){wheel.delta=0;wheel.direction=direction;}
    wheel.delta+=pixels;
    if(Math.abs(wheel.delta)<18)return;
    wheel.used=move(direction);
    wheel.delta=0;
  },{passive:false,capture:true});
  window.addEventListener('touchstart',event=>{
    if(event.touches.length!==1||excluded(event.target)){touch=null;return;}
    const p=event.touches[0];
    touch={x:p.clientX,y:p.clientY,lastY:p.clientY,
      horizontal:false,captured:false,used:false,blocked:navigationPending};
  },{passive:true});
  window.addEventListener('touchmove',event=>{
    if(!touch||!event.cancelable||event.touches.length!==1)return;
    const p=event.touches[0],dx=p.clientX-touch.x,dy=p.clientY-touch.y;
    touch.lastY=p.clientY;
    if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>9)touch.horizontal=true;
    if(touch.used){event.preventDefault();return;}
    if(touch.horizontal||Math.abs(dy)<9)return;
    const direction=dy<0?1:-1;
    if(touch.blocked||navigationPending||targetFor(direction)){
      event.preventDefault();touch.captured=true;
      if(!touch.blocked&&!navigationPending&&Math.abs(dy)>=28)touch.used=move(direction);
    }
  },{passive:false});
  window.addEventListener('touchend',()=>{
    if(!touch)return;
    const delta=touch.y-touch.lastY;
    if(touch.captured&&!touch.used&&!touch.blocked&&!navigationPending&&
       Math.abs(delta)>=28)move(Math.sign(delta));
    touch=null;
  },{passive:true});
  window.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
})();
