(function(){
'use strict';

function installConferenceTopScrollbar(){
  const table=document.querySelector('.conf-table');
  const wrap=table?.closest('.table-wrap');
  if(!table||!wrap)return;

  const previous=wrap.previousElementSibling;
  if(previous?.classList.contains('table-scroll-top'))previous.remove();

  let bar=wrap.previousElementSibling;
  if(!bar||!bar.classList.contains('stable-conf-scroll')){
    bar=document.createElement('div');
    bar.className='stable-top-scroll stable-conf-scroll';
    bar.setAttribute('role','scrollbar');
    bar.setAttribute('aria-label','Barra de rolagem horizontal dos relatórios');
    bar.innerHTML='<div class="stable-top-scroll-thumb"></div>';
    wrap.parentNode.insertBefore(bar,wrap);
  }

  const thumb=bar.firstElementChild;
  const update=()=>{
    const max=Math.max(0,wrap.scrollWidth-wrap.clientWidth);
    if(max<=1){bar.hidden=true;return;}
    bar.hidden=false;
    const track=Math.max(1,bar.clientWidth);
    const thumbWidth=Math.max(64,Math.min(track,track*(wrap.clientWidth/wrap.scrollWidth)));
    const travel=Math.max(0,track-thumbWidth);
    const left=max?travel*(wrap.scrollLeft/max):0;
    thumb.style.width=thumbWidth+'px';
    thumb.style.transform=`translateX(${left}px)`;
    bar.setAttribute('aria-valuemin','0');
    bar.setAttribute('aria-valuemax',String(Math.round(max)));
    bar.setAttribute('aria-valuenow',String(Math.round(wrap.scrollLeft)));
  };

  if(!bar.dataset.bound){
    let dragging=false,startX=0,startScroll=0;
    thumb.addEventListener('pointerdown',e=>{
      dragging=true;startX=e.clientX;startScroll=wrap.scrollLeft;
      thumb.setPointerCapture?.(e.pointerId);e.preventDefault();
    });
    thumb.addEventListener('pointermove',e=>{
      if(!dragging)return;
      const max=Math.max(0,wrap.scrollWidth-wrap.clientWidth);
      const travel=Math.max(1,bar.clientWidth-thumb.offsetWidth);
      wrap.scrollLeft=Math.max(0,Math.min(max,startScroll+(e.clientX-startX)*(max/travel)));
    });
    const stop=e=>{dragging=false;try{thumb.releasePointerCapture?.(e.pointerId)}catch(_){}};
    thumb.addEventListener('pointerup',stop);
    thumb.addEventListener('pointercancel',stop);
    bar.addEventListener('pointerdown',e=>{
      if(e.target===thumb)return;
      const rect=bar.getBoundingClientRect();
      const max=Math.max(0,wrap.scrollWidth-wrap.clientWidth);
      const travel=Math.max(1,bar.clientWidth-thumb.offsetWidth);
      const desired=Math.max(0,Math.min(travel,e.clientX-rect.left-thumb.offsetWidth/2));
      wrap.scrollLeft=max*(desired/travel);
    });
    bar.addEventListener('wheel',e=>{
      if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){wrap.scrollLeft+=e.deltaY;e.preventDefault();}
    },{passive:false});
    wrap.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    bar.dataset.bound='1';
  }
  requestAnimationFrame(update);
}

const style=document.createElement('style');
style.textContent=`
.stable-top-scroll{position:relative;height:18px;margin:2px 0 12px;background:#e7eff1;border:1px solid #d7e4e7;border-radius:999px;cursor:pointer;user-select:none;touch-action:none;box-shadow:inset 0 1px 2px rgba(8,50,61,.08)}
.stable-top-scroll[hidden]{display:none!important}
.stable-top-scroll-thumb{position:absolute;left:0;top:2px;height:12px;min-width:64px;border-radius:999px;background:#7d999f;border:1px solid #6d8b92;box-shadow:0 1px 2px rgba(8,50,61,.18);cursor:grab;will-change:transform}
.stable-top-scroll-thumb:active{cursor:grabbing;background:#657f86}
.conf-table-wrap{scrollbar-width:thin!important}
.conf-table-wrap::-webkit-scrollbar{height:10px!important}
`;
document.head.appendChild(style);

const previousApply=window.applyTopScrollbars;
window.applyTopScrollbars=function(){
  if(typeof previousApply==='function')previousApply();
  setTimeout(installConferenceTopScrollbar,0);
};

window.addEventListener('load',()=>setTimeout(installConferenceTopScrollbar,50));
setTimeout(installConferenceTopScrollbar,0);
})();
