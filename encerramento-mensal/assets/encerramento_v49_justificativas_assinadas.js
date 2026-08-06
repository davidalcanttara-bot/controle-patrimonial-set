(function(){
'use strict';

const escHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const itemToReport={REL1:'rel1',REL2:'rel2',REL3:'rel3',REL4:'rel4',REL5:'rel5',REL6:'rel6',REL7:'rel7',REL8:'rel8',REL9:'rel9',REL10:'rel10',REL11:'rel11',BALANCETE:'balancete',FISCAL:'fiscal',ANEXO1:'anexo1',ANEXO2:'anexo2',ANEXO3:'anexo3',ANEXO4:'anexo4',OUTRO:'Geral'};
const itemLabels={
 ANEXO1:'Anexo I - Listagem das Contas Bancárias Ativas',
 ANEXO2:'Anexo II - Declaração de Responsabilidade e de Ciência do Conteúdo dos Documentos Enviados',
 ANEXO3:'Anexo III - Grade de Conciliação e Extratos Bancários'
};

function activeKey(){
 const ug=document.getElementById('conference-ug')?.value||document.getElementById('report-ug')?.value||state.ugs?.[0]?.id||'';
 const ref=document.getElementById('conference-ref')?.value||document.getElementById('report-ref')?.value||'2026-07';
 return `${ug}|${ref}`;
}
function lists(){state.justifications=state.justifications||{};const key=activeKey();state.justifications[key]=state.justifications[key]||[];return state.justifications[key]}
function findRecord(id){for(const list of Object.values(state.justifications||{})){const x=(list||[]).find(v=>v.id===id);if(x)return x}return null}
function save(){if(typeof persist==='function')persist();if(typeof renderDashboard==='function')renderDashboard()}
function signedBlobKey(id){return `just-signed|${id}`}
function currentReportForItem(item){return itemToReport[item]||'Geral'}

window.openAnnexJustification=function(item,ugId,ref){
 const confUg=document.getElementById('conference-ug'),confRef=document.getElementById('conference-ref');
 if(confUg&&ugId)confUg.value=ugId;if(confRef&&ref)confRef.value=ref;
 if(typeof window.openJustification==='function')window.openJustification('');
 setTimeout(()=>{const sel=document.getElementById('just-document');if(sel)sel.value=item},0);
};

function installAnnexButtons(){
 const defs=[
  ['page-report','report-ug','report-ref','ANEXO1'],
  ['page-report2','report2-ug','report2-ref','ANEXO2'],
  ['page-report3','report3-ug','report3-ref','ANEXO3']
 ];
 defs.forEach(([pageId,ugId,refId,item])=>{
  const page=document.getElementById(pageId),controls=page?.querySelector('.report-controls');
  if(!controls||controls.querySelector(`[data-just-annex="${item}"]`))return;
  const btn=document.createElement('button');btn.className='btn warning';btn.style.cssText='width:100%;margin-top:10px';btn.dataset.justAnnex=item;btn.textContent='Cadastrar justificativa';
  btn.onclick=()=>openAnnexJustification(item,document.getElementById(ugId)?.value,document.getElementById(refId)?.value);
  const note=controls.querySelector('.report-note');controls.insertBefore(btn,note||null);
 });
}

window.uploadSignedJustification=async function(id,input){
 const file=input.files?.[0];if(!file)return;const rec=findRecord(id);if(!rec)return;
 try{
  if(typeof putBlob==='function')await putBlob(signedBlobKey(id),file);
  rec.signedDoc={name:file.name,size:file.size,type:file.type||'',uploadedAt:new Date().toISOString()};
  rec.signatureChecked=false;rec.signatureCheckedAt='';rec.signatureCheckedBy='';save();
  if(typeof window.renderConference==='function')window.renderConference();renderJustificationModalSignedPanel();
  if(typeof toast==='function')toast('Documento assinado anexado à justificativa.');
 }finally{input.value=''}
};
window.viewSignedJustification=function(id,download=false){const rec=findRecord(id);if(rec?.signedDoc&&typeof openStoredBlob==='function')openStoredBlob(signedBlobKey(id),rec.signedDoc.name,download)};
window.removeSignedJustification=async function(id){const rec=findRecord(id);if(!rec)return;delete rec.signedDoc;rec.signatureChecked=false;rec.signatureCheckedAt='';rec.signatureCheckedBy='';if(typeof deleteBlob==='function')await deleteBlob(signedBlobKey(id));save();if(typeof window.renderConference==='function')window.renderConference();renderJustificationModalSignedPanel()};
window.toggleJustificationSignature=function(id){const rec=findRecord(id);if(!rec?.signedDoc){if(typeof toast==='function')toast('Anexe primeiro o documento assinado.');return}rec.signatureChecked=!rec.signatureChecked;rec.signatureCheckedAt=rec.signatureChecked?new Date().toISOString():'';rec.signatureCheckedBy=rec.signatureChecked?(JSON.parse(sessionStorage.getItem('trancilim_portal_session_v2')||'null')?.name||'Usuário'):'';save();if(typeof window.renderConference==='function')window.renderConference();renderJustificationModalSignedPanel();if(typeof toast==='function')toast(rec.signatureChecked?'Assinatura conferida.':'Conferência da assinatura removida.')};

function signedPanel(id){const rec=findRecord(id);if(!rec)return'';const doc=rec.signedDoc,checked=!!rec.signatureChecked;return `<div class="just-signed-box"><div class="just-signed-status"><span class="conf-badge ${checked?'ok':doc?'warn':'pending'}">${checked?'✓ Assinatura conferida':doc?'• Aguardando conferência':'○ Documento assinado pendente'}</span>${checked&&rec.signatureCheckedBy?`<small>Conferido por ${escHtml(rec.signatureCheckedBy)}</small>`:''}</div>${doc?`<div class="just-signed-file"><strong>${escHtml(doc.name)}</strong><div class="side-item-actions"><button class="btn tiny" onclick="viewSignedJustification('${id}')">Ver</button><button class="btn tiny" onclick="viewSignedJustification('${id}',true)">Baixar</button><button class="btn tiny ${checked?'':'success'}" onclick="toggleJustificationSignature('${id}')">${checked?'Desmarcar conferência':'Conferir assinatura'}</button><button class="btn tiny danger" onclick="removeSignedJustification('${id}')">Remover</button></div></div>`:`<label class="btn tiny primary" style="cursor:pointer">Subir documento assinado<input hidden type="file" accept=".pdf,.doc,.docx,image/*" onchange="uploadSignedJustification('${id}',this)"></label>`}</div>`}

function augmentSavedJustifications(){
 const box=document.getElementById('saved-justifications-side');if(!box)return;
 box.querySelectorAll('.side-list-item').forEach(item=>{
  if(item.querySelector('.just-signed-box'))return;
  const btn=item.querySelector('button[onclick^="viewJustification"]');const m=btn?.getAttribute('onclick')?.match(/'([^']+)'/);if(!m)return;
  item.insertAdjacentHTML('beforeend',signedPanel(m[1]));
 });
}

function appendJustificationsToComplementary(){
 const box=document.getElementById('complementary-list-side');if(!box||box.querySelector('[data-generated-justifications]'))return;
 const focus=document.getElementById('conference-focus-report')?.value||'Geral';
 const records=lists().filter(x=>focus==='Geral'||currentReportForItem(x.item)===focus);
 if(!records.length)return;
 const wrap=document.createElement('div');wrap.dataset.generatedJustifications='1';wrap.className='generated-justifications-complementary';
 wrap.innerHTML=`<div class="generated-just-title">Justificativas vinculadas aos documentos complementares</div>`+records.slice().reverse().map(x=>`<div class="side-list-item"><div><strong>${escHtml(itemLabels[x.item]||x.item||'Justificativa')}</strong><span>${escHtml(x.reference||'')} · ${x.signedDoc?(x.signatureChecked?'Documento assinado e conferido':'Documento assinado aguardando conferência'):'Aguardando documento assinado'}</span></div><div class="side-item-actions"><button class="btn tiny" onclick="viewJustification('${x.id}')">Ver</button><button class="btn tiny" onclick="downloadSavedJustificationWord('${x.id}')">Word</button><button class="btn tiny" onclick="downloadSavedJustificationPdf('${x.id}')">PDF</button>${x.signedDoc?`<button class="btn tiny" onclick="viewSignedJustification('${x.id}')">Assinado</button>`:''}</div></div>`).join('');
 box.prepend(wrap);
}

function markGenerated(kind){setTimeout(()=>{const id=document.getElementById('just-edit-id')?.value,rec=id&&findRecord(id);if(!rec)return;rec[kind==='word'?'wordGenerated':'pdfGenerated']=true;rec.updatedAt=new Date().toISOString();save();augmentAll()},30)}
const baseWord=window.exportJustificationWord,basePdf=window.exportJustificationPdf;
if(baseWord)window.exportJustificationWord=async function(){const out=await baseWord.apply(this,arguments);markGenerated('word');return out};
if(basePdf)window.exportJustificationPdf=function(){const out=basePdf.apply(this,arguments);markGenerated('pdf');return out};


function renderJustificationModalSignedPanel(){
 const modal=document.getElementById('justification-modal');if(!modal)return;
 let panel=document.getElementById('just-modal-signed-panel');
 if(!panel){
  panel=document.createElement('div');panel.id='just-modal-signed-panel';panel.style.cssText='margin-top:14px;padding-top:14px;border-top:1px solid #dbe5ea';
  const body=modal.querySelector('.modal-body');body?.appendChild(panel);
 }
 const id=document.getElementById('just-edit-id')?.value||'';
 if(!id){panel.innerHTML='<div class="just-signed-box"><span class="conf-badge pending">○ Cadastre primeiro a justificativa para anexar o documento assinado</span></div>';return}
 panel.innerHTML='<div style="font-weight:800;margin-bottom:8px">Documento assinado da justificativa</div>'+signedPanel(id);
}
window.registerJustification=function(){
 const d=(typeof justificationData==='function')?justificationData():null;if(!d)return;
 const old=d.id?findRecord(d.id):null;
 const signed=old?.signedDoc,checked=old?.signatureChecked,checkedAt=old?.signatureCheckedAt,checkedBy=old?.signatureCheckedBy;
 const rec=(typeof saveJustificationData==='function')?saveJustificationData(d):null;if(!rec)return;
 if(signed){rec.signedDoc=signed;rec.signatureChecked=!!checked;rec.signatureCheckedAt=checkedAt||'';rec.signatureCheckedBy=checkedBy||'';save();}
 document.getElementById('just-edit-id').value=rec.id;
 renderJustificationModalSignedPanel();augmentAll();
 if(typeof toast==='function')toast('Justificativa cadastrada. Agora você pode anexar o documento assinado.');
};
function installRegisterButton(){
 const modal=document.getElementById('justification-modal'),foot=modal?.querySelector('.modal-foot.just-actions');if(!foot||foot.querySelector('[data-register-justification]'))return;
 const btn=document.createElement('button');btn.className='btn warning';btn.dataset.registerJustification='1';btn.textContent='Cadastrar justificativa';btn.onclick=window.registerJustification;
 const cancel=foot.querySelector('button');cancel?.insertAdjacentElement('afterend',btn);
 renderJustificationModalSignedPanel();
}

function augmentAll(){installAnnexButtons();installRegisterButton();augmentSavedJustifications();appendJustificationsToComplementary();if(document.getElementById('justification-modal')?.classList.contains('open'))renderJustificationModalSignedPanel()}
const observer=new MutationObserver(()=>requestAnimationFrame(augmentAll));
document.addEventListener('DOMContentLoaded',()=>{augmentAll();observer.observe(document.body,{childList:true,subtree:true})});
setTimeout(augmentAll,300);
})();
