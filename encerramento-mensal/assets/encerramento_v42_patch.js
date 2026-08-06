(function(){
'use strict';

/* v42 — fechamento estável do Anexo II para todas as UGs e UG inicial global */
const GLOBAL_UG_STORAGE='trancelim_encerramento_selected_ug_v1';

function ugByAny(value){
  const raw=String(value||'').trim();
  return (state.ugs||[]).find(u=>u.id===raw||u.code===raw||u.acronym===raw)||null;
}

function snapshotBelongsToUg(snapshot,ug){
  if(!snapshot||!ug)return false;
  return snapshot.ugId===ug.id || snapshot.ugCode===ug.code || snapshot.ug===ug.code || snapshot.unitCode===ug.code || snapshot.ugAcronym===ug.acronym;
}

function normalizeAnexo2Snapshots(){
  state.anexo2Snapshots=Array.isArray(state.anexo2Snapshots)?state.anexo2Snapshots:[];
  let changed=false;
  for(const snap of state.anexo2Snapshots){
    let ug=ugByAny(snap.ugId)||ugByAny(snap.ugCode)||ugByAny(snap.ug)||ugByAny(snap.unitCode)||ugByAny(snap.ugAcronym);
    if(ug){
      if(snap.ugId!==ug.id){snap.ugId=ug.id;changed=true}
      if(snap.ugCode!==ug.code){snap.ugCode=ug.code;changed=true}
      if(snap.ugAcronym!==ug.acronym){snap.ugAcronym=ug.acronym;changed=true}
    }
  }
  const seen=new Map(),dedup=[];
  for(const snap of state.anexo2Snapshots){
    const key=`${snap.ugId||snap.ugCode||''}|${snap.ref||''}`;
    if(!key.replace('|','')){dedup.push(snap);continue}
    if(!seen.has(key)){seen.set(key,dedup.length);dedup.push(snap);continue}
    const idx=seen.get(key),old=dedup[idx];
    const oldTime=Date.parse(old.updatedAt||old.createdAt||0)||0,newTime=Date.parse(snap.updatedAt||snap.createdAt||0)||0;
    if(newTime>=oldTime)dedup[idx]=snap;
    changed=true;
  }
  if(dedup.length!==state.anexo2Snapshots.length){state.anexo2Snapshots=dedup;changed=true}
  if(changed)persist();
}

normalizeAnexo2Snapshots();

window.saveSnapshot2=function(){
  const d=declarationData(true);
  if(!d)return;
  if(!d.date)return toast('Informe a data da declaração.');
  state.anexo2Snapshots=Array.isArray(state.anexo2Snapshots)?state.anexo2Snapshots:[];
  const matches=[];
  state.anexo2Snapshots.forEach((snap,index)=>{if(snap.ref===d.ref&&snapshotBelongsToUg(snap,d.u))matches.push(index)});
  const now=new Date().toISOString();
  const current=matches.length?state.anexo2Snapshots[matches[0]]:null;
  const snap={
    id:current?.id||uid('snap2'),
    ugId:d.u.id,
    ugCode:d.u.code,
    ugAcronym:d.u.acronym,
    ref:d.ref,
    date:d.date,
    location:d.location,
    personName:d.r.name,
    createdAt:current?.createdAt||now,
    updatedAt:now
  };
  if(matches.length){
    state.anexo2Snapshots[matches[0]]=snap;
    for(let i=matches.length-1;i>=1;i--)state.anexo2Snapshots.splice(matches[i],1);
  }else state.anexo2Snapshots.push(snap);
  persist();
  renderHistory2();
  renderSignedAnnexPanel('anexo2');
  if(typeof renderDashboard==='function')renderDashboard();
  toast('Anexo II fechado e salvo. Agora anexe a versão assinada.');
};

window.renderHistory2=function(){
  const box=document.getElementById('history2-list');
  if(!box)return;
  const ug=ugByAny(document.getElementById('report2-ug')?.value);
  const list=(state.anexo2Snapshots||[]).filter(x=>snapshotBelongsToUg(x,ug)).sort((a,b)=>String(b.ref||'').localeCompare(String(a.ref||'')));
  box.innerHTML=list.map(x=>`<div class="history-item"><div><strong>${formatRef(x.ref)}</strong><br>${esc(x.personName||'Responsável cadastrado')}</div><button class="btn small danger" onclick="deleteSnapshot2('${x.id}')">Excluir</button></div>`).join('')||'<div class="report-note">Nenhum fechamento salvo.</div>';
};

window.isSignedAnnexClosed=function(type,ugId,ref){
  if(type==='anexo1')return (state.snapshots||[]).some(x=>x.ugId===ugId&&x.ref===ref);
  const ug=ugByAny(ugId);
  return (state.anexo2Snapshots||[]).some(x=>x.ref===ref&&snapshotBelongsToUg(x,ug));
};

function selectedGlobalUg(){
  const saved=localStorage.getItem(GLOBAL_UG_STORAGE);
  return ugByAny(saved)||ugByAny('590001')||(state.ugs||[])[0]||null;
}

function fillGlobalUgSelector(){
  let select=document.getElementById('global-ug');
  const actions=document.querySelector('.top-actions');
  if(!actions)return null;
  if(!select){
    select=document.createElement('select');
    select.id='global-ug';
    select.title='Unidade Gestora inicial';
    select.setAttribute('aria-label','Unidade Gestora inicial');
    select.onchange=()=>applyGlobalUg(select.value,true);
    actions.insertBefore(select,actions.firstChild);
  }
  const old=select.value;
  select.innerHTML=(state.ugs||[]).map(u=>`<option value="${u.id}">${esc(u.code)} - ${esc(u.acronym)}</option>`).join('');
  const chosen=ugByAny(old)||selectedGlobalUg();
  if(chosen)select.value=chosen.id;
  return select;
}

function setSelectValue(id,ugId){
  const el=document.getElementById(id);
  if(!el)return;
  if([...el.options].some(o=>o.value===ugId))el.value=ugId;
}

function applyGlobalUg(ugId,save){
  const ug=ugByAny(ugId)||selectedGlobalUg();
  if(!ug)return;
  if(save)localStorage.setItem(GLOBAL_UG_STORAGE,ug.id);
  const global=document.getElementById('global-ug');
  if(global&&[...global.options].some(o=>o.value===ug.id))global.value=ug.id;
  ['report-ug','report2-ug','report3-ug','conference-ug','just-page-ug','process-filter-ug','process-ug'].forEach(id=>setSelectValue(id,ug.id));
  try{renderReport()}catch(e){}
  try{renderReport2()}catch(e){}
  try{renderReport3()}catch(e){}
  try{window.renderConference?.()}catch(e){}
  try{window.renderJustPage?.()}catch(e){}
  try{window.renderProcesses?.()}catch(e){}
}
window.applyGlobalUg=applyGlobalUg;

const previousRenderAll=window.renderAll;
window.renderAll=function(){
  previousRenderAll();
  fillGlobalUgSelector();
};

const style=document.createElement('style');
style.setAttribute('data-trancelim-v42','global-ug');
style.textContent=`
#global-ug{min-width:148px!important;max-width:185px}
@media(max-width:700px){#global-ug{min-width:132px!important;max-width:165px}.top-actions{gap:6px}}
`;
document.head.appendChild(style);

fillGlobalUgSelector();
setTimeout(()=>applyGlobalUg(selectedGlobalUg()?.id||'',false),0);
})();
